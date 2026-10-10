// 一件掃描(維護工具,不屬於實體驗證;掃出的結果不影響 npm run verify 的成敗,只有本身的測試在 test:verify 裡):同一個零件的各塊——本體與每個 pieces
// (含附件的附件)——要彼此相連。實體驗證把一個零件當成一體,懸空的塊、浮在托架前面的銷都看不到。
// 每塊拆成凸塊(與實體驗證同一份幾何);兩塊之間有一對凸塊的距離在 TOUCH 以內就算相連(先用外接盒篩掉離很遠的)。
// 凸塊是實體的切塊,所以報出的一定不相連;旋轉體、管子的凸塊是逐段的近似,貼得很近的縫(幾千分之一)看不出來。
// 零件的各塊彼此固定,與姿勢無關;只有連桿的長度與姿勢的縮放取主動件初始位置(第一個狀態)的姿勢。
// 一個固定件常把幾座分開立著的軸承座、支柱放在一起;和主體一起落到零件最低處(各自站在地上)的那一群標出來,多半是刻意的分件。
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { PATH_KINDS } from "../models/kinds.js";
import { placement } from "../viewer/placement.js";
import { buildSolid } from "./solids.js";
import { initialValue, sampleValues, statesOf } from "./sampling.js";
import { isSolidPart } from "./scene.js";
import { partMoving } from "./index.js";

await RAPIER.init();

const TOUCH = 0.005; // 兩塊的距離在這以內算相連(貼合的兩塊)
const FAR = 100; // 量間隙時的距離上限
const FLOOR = 0.01; // 一群的最低處離零件最低處在這以內,算站在同一個地面上
const EPS = 1e-4; // 凸塊的座標是單精度,剛好 TOUCH 的距離會算成略大一點

/**
 * 掃一個模型。每一群和零件主體(體積最大的一群)不相連的塊報一項:
 * { part, blocks: [{ label, kind, center, min, max }], gap, toMain, fixed, grounded }——label 是「本體」或 pieces[i]
 * (附件的附件 pieces[i].pieces[j]);center、min、max 是這一塊的外接範圍(會動的零件用零件局部座標,固定件用世界座標);
 * gap 是這一群到其餘任一塊最近的距離(可能是另一群懸空的塊,例如浮在懸空托架前的銷),toMain 是到主體的距離;fixed:零件在播放中不動;grounded:固定件的這一群與主體都落到零件最低處。
 */
export function detachedPieces(def) {
  const pose = def.pose(initialValue(def.driver), statesOf(def)[0]).parts ?? {};
  const moving = movingParts(def);
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const found = [];
    for (const part of def.parts) {
      if (!part.pieces?.length || PATH_KINDS.has(part.kind) || !isSolidPart(part)) continue;
      const fixed = !moving.has(part.id);
      const blocks = blocksOf(world, part, pose[part.id] ?? {}, fixed).filter((b) => b.hulls.length);
      if (blocks.length < 2) continue;
      const groups = connected(blocks);
      if (groups.length < 2) continue;
      const volume = (g) => g.reduce((sum, b) => sum + b.volume, 0); // 只用來挑主體:各凸塊外框體積的和就夠
      const main = groups.reduce((a, b) => (volume(b) > volume(a) ? b : a));
      // 落地:主體與這一群都落到零件最低處(幾座軸承座站在同一個地面上)
      const floor = Math.min(...blocks.map((b) => b.min[1]));
      const onFloor = (g) => Math.min(...g.map((b) => b.min[1])) <= floor + FLOOR;
      for (const group of groups) {
        if (group === main) continue;
        const rest = blocks.filter((b) => !group.includes(b));
        const grounded = fixed && onFloor(main) && onFloor(group);
        found.push({ part: part.id, blocks: group.map(({ label, kind, center, min, max }) => ({ label, kind, center, min, max })), gap: gapBetween(group, rest), toMain: gapBetween(group, main), fixed, grounded });
      }
    }
    return found;
  } finally {
    world.free();
  }
}

// 播放中位置或轉角有變的零件(取樣的姿勢與初始姿勢比較,「會動」的判斷與實體驗證相同)
function movingParts(def) {
  const moving = new Set();
  for (const state of statesOf(def)) {
    let first = null;
    for (const v of sampleValues(def.driver, 24)) {
      const parts = def.pose(v, state).parts ?? {};
      first ??= parts;
      for (const [id, p] of Object.entries(parts)) if (partMoving(p, first[id])) moving.add(id);
    }
  }
  return moving;
}

// 零件建成 3D 物件(會動的零件在零件局部座標,只取姿勢的連桿長度與縮放;固定件擺到世界座標),
// 依 pieces 的結構分成塊,每塊收集自己的凸塊
function blocksOf(world, part, p, fixed) {
  const { object, meshes } = buildSolid(part);
  const baseQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...(part.axis ?? [0, 0, 1])).normalize());
  const place = placement(part, baseQuat, p, p.angle ?? 0, { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() });
  if (fixed) {
    object.position.copy(place.position);
    object.quaternion.copy(place.quaternion);
  }
  if (place.length != null) object.userData.stretch?.(place.length);
  if (p.scale != null) Array.isArray(p.scale) ? object.scale.set(...p.scale) : object.scale.setScalar(p.scale);
  object.updateMatrixWorld(true);

  // 繪圖層(viewer/parts.js 的 buildPart)把 pieces 依序接在物件子節點的最後面
  const owner = new Map(); // 3D 物件 → 塊
  const blocks = [];
  const walk = (def, node, label) => {
    const block = { label, kind: def.kind, hulls: [] };
    blocks.push(block);
    owner.set(node, block);
    const n = def.pieces?.length ?? 0;
    const children = node.children;
    def.pieces?.forEach((piece, i) => walk(piece, children[children.length - n + i], label === "本體" ? `pieces[${i}]` : `${label}.pieces[${i}]`));
  };
  walk(part, object, "本體");
  const blockOf = (o) => {
    for (; o; o = o.parent) if (owner.has(o)) return owner.get(o);
  };

  for (const { mesh, hulls } of meshes) {
    const block = blockOf(mesh);
    for (const hull of hulls) {
      const made = convex(world, hull, mesh.matrixWorld);
      if (made) block.hulls.push(made);
    }
  }
  for (const block of blocks) {
    const min = [0, 1, 2].map((k) => Math.min(...block.hulls.map((h) => h.box[k])));
    const max = [0, 1, 2].map((k) => Math.max(...block.hulls.map((h) => h.box[k + 3])));
    const volume = block.hulls.reduce((sum, h) => sum + (h.box[3] - h.box[0]) * (h.box[4] - h.box[1]) * (h.box[5] - h.box[2]), 0);
    Object.assign(block, { min, max, center: min.map((v, k) => (v + max[k]) / 2), volume });
  }
  return blocks;
}

// 凸塊(網格局部座標的點集)換到零件座標,建成碰撞體;附上零件座標的外框 [minX, minY, minZ, maxX, maxY, maxZ]
const tmp = new THREE.Vector3();
function convex(world, hull, matrix) {
  const points = new Float32Array(hull.length);
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < hull.length; i += 3) {
    tmp.set(hull[i], hull[i + 1], hull[i + 2]).applyMatrix4(matrix);
    for (let k = 0; k < 3; k++) {
      points[i + k] = tmp.getComponent(k);
      box[k] = Math.min(box[k], points[i + k]);
      box[k + 3] = Math.max(box[k + 3], points[i + k]);
    }
  }
  const desc = RAPIER.ColliderDesc.convexHull(points);
  if (!desc) return null; // 沒有體積(共面、共線)
  try {
    return { collider: world.createCollider(desc), box };
  } catch {
    return null; // 退化的凸包
  }
}

const apart = (p, q, margin) => [0, 1, 2].some((k) => p[k] - q[k + 3] > margin || q[k] - p[k + 3] > margin);

// 兩塊之間最近的距離(負值 = 互相穿入);超過 reach 回傳 Infinity
function distance(p, q, reach) {
  let best = Infinity;
  for (const a of p.hulls) {
    for (const b of q.hulls) {
      if (apart(a.box, b.box, Math.min(reach, best))) continue;
      const contact = a.collider.contactCollider(b.collider, Math.min(reach, best));
      if (contact) best = Math.min(best, contact.distance);
    }
  }
  return best;
}

// 塊依「相連」分群(依原順序)
function connected(blocks) {
  const groupOf = blocks.map((_, i) => i);
  const root = (i) => (groupOf[i] === i ? i : (groupOf[i] = root(groupOf[i])));
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (root(i) !== root(j) && distance(blocks[i], blocks[j], TOUCH + EPS) <= TOUCH + EPS) groupOf[root(j)] = root(i);
    }
  }
  const groups = new Map();
  blocks.forEach((b, i) => {
    const r = root(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(b);
  });
  return [...groups.values()];
}

// 兩群塊之間最近的距離;超過 FAR 是 Infinity
const gapBetween = (group, rest) => Math.min(...group.flatMap((p) => rest.map((q) => distance(p, q, FAR))));
