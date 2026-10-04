// 把一個模型的零件擺進物理引擎做碰撞查詢(不模擬力):每個姿勢算出任兩個零件實體之間的距離。
// 姿勢的擺放沿用繪圖層的規則(viewer/placement.js);線狀零件沿路徑每一段是一個膠囊。
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { PATH_KINDS } from "../models/kinds.js";
import { placement } from "../viewer/placement.js";
import { pathRadius } from "../viewer/paths.js";
import { buildSolid } from "./solids.js";

await RAPIER.init();

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();

/** 不參與實體驗證的零件:存量填色、作圖軌跡(流體示意本來就不是零件) */
export const isSolidPart = (part) => part.kind !== "fill" && part.kind !== "trace";

// 一塊凸塊:碰撞體與外框
function makePiece(world, hull, scale) {
  const points = new Float32Array(hull.length);
  const n = hull.length / 3;
  for (let i = 0; i < n; i++) {
    points[i * 3] = hull[i * 3] * scale.x;
    points[i * 3 + 1] = hull[i * 3 + 1] * scale.y;
    points[i * 3 + 2] = hull[i * 3 + 2] * scale.z;
  }
  const desc = RAPIER.ColliderDesc.convexHull(points);
  if (!desc) return null; // 沒有體積(共面、共線)
  try {
    return { collider: world.createCollider(desc), hull, box: new Float64Array(6) };
  } catch {
    return null; // 退化的凸包(幾乎沒有體積)
  }
}

export class Scene {
  constructor(def) {
    this.world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    this.solids = [];
    this.paths = [];
    this.byId = new Map();
    for (const part of def.parts) {
      if (!isSolidPart(part)) continue;
      if (PATH_KINDS.has(part.kind)) {
        const entry = { id: part.id, part, path: true, radius: pathRadius(part), pieces: [], visible: true, changed: true, points: null, box: new Float64Array(6) };
        this.paths.push(entry);
        this.byId.set(part.id, entry);
        continue;
      }
      const { object, meshes } = buildSolid(part);
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, new THREE.Vector3(...(part.axis ?? [0, 0, 1])).normalize());
      const entry = {
        id: part.id,
        part,
        object,
        baseQuat,
        meshes: meshes.map((m) => ({ ...m, pieces: null, scaleKey: null, matrix: new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0) })),
        place: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), length: null },
        pieces: [],
        visible: true,
        changed: true,
        box: new Float64Array(6),
      };
      this.solids.push(entry);
      this.byId.set(part.id, entry);
    }
    this.entries = [...this.solids, ...this.paths];
  }

  /** 套上一個姿勢;每個零件記下它是否隱藏、位置是否與上一次套用時不同 */
  apply(pose) {
    for (const entry of this.solids) {
      const { part, object, baseQuat, place } = entry;
      const p = pose.parts[entry.id] ?? {};
      entry.visible = p.visible !== false;
      placement(part, baseQuat, p, p.angle ?? 0, place);
      object.position.copy(place.position);
      object.quaternion.copy(place.quaternion);
      if (place.length != null) object.userData.stretch?.(place.length);
      if (p.scale != null) {
        if (Array.isArray(p.scale)) object.scale.set(...p.scale);
        else object.scale.setScalar(p.scale);
      }
      object.updateMatrixWorld(true);
      entry.changed = false;
      for (const m of entry.meshes) {
        if (m.matrix.equals(m.mesh.matrixWorld)) continue;
        m.matrix.copy(m.mesh.matrixWorld);
        entry.changed = true;
        m.matrix.decompose(tmpP, tmpQ, tmpS);
        const key = `${tmpS.x.toFixed(4)},${tmpS.y.toFixed(4)},${tmpS.z.toFixed(4)}`;
        if (key !== m.scaleKey) {
          for (const piece of m.pieces ?? []) this.world.removeCollider(piece.collider, false);
          m.pieces = m.hulls.map((hull) => makePiece(this.world, hull, tmpS)).filter(Boolean);
          if (m.axle) for (const piece of m.pieces) piece.axle = { from: new THREE.Vector3(), to: new THREE.Vector3(), radius: m.radius, bar: m.mesh.geometry.type === "BoxGeometry" };
          m.scaleKey = key;
        }
        for (const piece of m.pieces) {
          piece.collider.setTranslation(tmpP);
          piece.collider.setRotation(tmpQ);
          boxOf(piece, m.matrix);
          if (piece.axle) {
            piece.axle.from.copy(m.axle[0]).applyMatrix4(m.matrix);
            piece.axle.to.copy(m.axle[1]).applyMatrix4(m.matrix);
          }
        }
      }
      if (entry.changed) {
        entry.pieces = entry.meshes.flatMap((m) => m.pieces);
        bound(entry);
      }
    }
    for (const entry of this.paths) {
      const p = pose.paths?.[entry.id];
      entry.visible = !!p && p.visible !== false;
      if (!p) continue;
      const points = p.closed ? [...p.points, p.points[0]] : p.points;
      entry.changed = !samePoints(points, entry.points);
      entry.closed = !!p.closed;
      if (!entry.changed) continue;
      entry.points = points;
      const pieces = [];
      for (let i = 0; i + 1 < points.length; i++) {
        tmpP.set(...points[i]);
        tmpV.set(...points[i + 1]).sub(tmpP);
        const length = tmpV.length();
        if (length < 1e-6) continue;
        const piece = entry.pieces[pieces.length] ?? { collider: this.world.createCollider(RAPIER.ColliderDesc.capsule(length / 2, entry.radius)), box: new Float64Array(6) };
        piece.collider.setHalfHeight(length / 2);
        const a = points[i];
        const b = points[i + 1];
        for (let k = 0; k < 3; k++) {
          piece.box[k] = Math.min(a[k], b[k]) - entry.radius;
          piece.box[k + 3] = Math.max(a[k], b[k]) + entry.radius;
        }
        piece.collider.setTranslation(tmpP.addScaledVector(tmpV, 0.5));
        piece.collider.setRotation(tmpQ.setFromUnitVectors(Y_AXIS, tmpV.divideScalar(length)));
        piece.segment = i;
        pieces.push(piece);
      }
      for (const extra of entry.pieces.slice(pieces.length)) this.world.removeCollider(extra.collider, false);
      entry.pieces = pieces;
      bound(entry);
    }
  }

  /**
   * 兩個零件之間,距離在 prediction 以內的每一對凸塊各呼叫一次 visit(pieceA, pieceB, distance, normal);
   * distance 為負表示穿入的深度;normal 是把 b 從 a 推開的方向。
   */
  contacts(a, b, prediction, visit) {
    if (apart(a.box, b.box, prediction)) return;
    for (const pa of a.pieces) {
      if (apart(pa.box, b.box, prediction)) continue;
      for (const pb of b.pieces) {
        if (apart(pa.box, pb.box, prediction)) continue;
        const contact = pa.collider.contactCollider(pb.collider, prediction);
        if (contact) visit(pa, pb, contact.distance === 0 ? nudged(pa.collider, pb.collider, prediction) : contact.distance, contact.normal1);
      }
    }
  }

  /** 兩個零件實體之間的最小距離(負值 = 穿入深度);超過 prediction 回傳 null */
  distance(a, b, prediction) {
    let best = null;
    this.contacts(a, b, prediction, (pa, pb, d) => {
      if (best == null || d < best) best = d;
    });
    return best;
  }

  /** 開放路徑的端點(end:0 起點、1 終點)離零件實體多遠;超過 prediction 回傳 Infinity */
  endGap(path, end, solid, prediction = 0.05) {
    this.probe ??= this.world.createCollider(RAPIER.ColliderDesc.ball(path.radius));
    this.probe.setRadius(path.radius);
    tmpP.set(...path.points[end ? path.points.length - 1 : 0]);
    this.probe.setTranslation(tmpP);
    let best = Infinity;
    for (const piece of solid.pieces) {
      const reach = prediction + path.radius;
      if (tmpP.x < piece.box[0] - reach || tmpP.x > piece.box[3] + reach || tmpP.y < piece.box[1] - reach || tmpP.y > piece.box[4] + reach || tmpP.z < piece.box[2] - reach || tmpP.z > piece.box[5] + reach) continue;
      const contact = this.probe.contactCollider(piece.collider, prediction);
      if (contact) best = Math.min(best, contact.distance);
    }
    return best;
  }

  /** 軸線 axle(兩個端點定出的無限長直線)是否穿過凸塊 piece */
  lineHits(axle, piece) {
    tmpV.subVectors(axle.to, axle.from).normalize();
    tmpP.copy(axle.from).addScaledVector(tmpV, -100);
    return piece.collider.castRay(new RAPIER.Ray(tmpP, tmpV), 200, true) >= 0;
  }

  dispose() {
    this.world.free();
  }
}

// 兩個凸塊有面剛好共平面時(同一層、同厚度的兩塊板),引擎算不出穿入深度而回傳 0;
// 把其中一個挪開一點點再問一次
const NUDGE = { x: 1.1e-4, y: 2.3e-4, z: 3.7e-4 };
function nudged(a, b, prediction) {
  const t = b.translation();
  b.setTranslation({ x: t.x + NUDGE.x, y: t.y + NUDGE.y, z: t.z + NUDGE.z });
  const contact = a.contactCollider(b, prediction);
  b.setTranslation(t);
  return contact ? contact.distance : 0;
}

// 軸對齊的外框 [minX, minY, minZ, maxX, maxY, maxZ]
const apart = (p, q, margin) =>
  p[0] - q[3] > margin || q[0] - p[3] > margin || p[1] - q[4] > margin || q[1] - p[4] > margin || p[2] - q[5] > margin || q[2] - p[5] > margin;

function boxOf(piece, matrix) {
  const e = matrix.elements;
  const h = piece.hull;
  const box = piece.box;
  box[0] = box[1] = box[2] = Infinity;
  box[3] = box[4] = box[5] = -Infinity;
  for (let i = 0; i < h.length; i += 3) {
    const x = h[i], y = h[i + 1], z = h[i + 2];
    const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
    const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
    const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
    if (wx < box[0]) box[0] = wx;
    if (wy < box[1]) box[1] = wy;
    if (wz < box[2]) box[2] = wz;
    if (wx > box[3]) box[3] = wx;
    if (wy > box[4]) box[4] = wy;
    if (wz > box[5]) box[5] = wz;
  }
}

// 零件的外框(各凸塊外框的聯集)
function bound(entry) {
  const box = entry.box;
  box[0] = box[1] = box[2] = Infinity;
  box[3] = box[4] = box[5] = -Infinity;
  for (const piece of entry.pieces) {
    for (let k = 0; k < 3; k++) {
      if (piece.box[k] < box[k]) box[k] = piece.box[k];
      if (piece.box[k + 3] > box[k + 3]) box[k + 3] = piece.box[k + 3];
    }
  }
}

/** 一塊凸塊的說明:屬於哪種幾何、多大、在哪裡(報告裡指出是零件的哪一塊) */
export function describe(entry, piece) {
  const c = [0, 1, 2].map((k) => ((piece.box[k] + piece.box[k + 3]) / 2).toFixed(2)).join(", ");
  if (entry.path) return `${entry.id} 的第 ${piece.segment + 1} 段〔${c}〕`;
  const { geometry } = entry.meshes.find((m) => m.pieces.includes(piece)).mesh;
  const p = geometry.parameters ?? {};
  const n = (x) => Number(x.toFixed(3));
  const shape =
    geometry.type === "CylinderGeometry" ? `圓柱 r${n(p.radiusTop)}×${n(p.height)}`
    : geometry.type === "BoxGeometry" ? `方塊 ${n(p.width)}×${n(p.height)}×${n(p.depth)}`
    : geometry.type === "ExtrudeGeometry" ? "板"
    : geometry.type === "SphereGeometry" ? `球 r${n(p.radius)}`
    : geometry.type === "LatheGeometry" ? "旋轉體"
    : geometry.type.replace("Geometry", "");
  return `${entry.id} 的${shape}〔${c}〕`;
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpI = new THREE.Matrix4();

/** 圓柱凸塊 piece 的軸線(球是球心),換到零件 entry 自己的座標裡(兩個端點) */
export function axleIn(piece, entry) {
  tmpI.copy(entry.object.matrixWorld).invert();
  return [piece.axle.from.clone().applyMatrix4(tmpI), piece.axle.to.clone().applyMatrix4(tmpI)];
}

/** 兩條軸線(各為兩個端點)是否同一條直線;球心則是同一個點 */
export function sameLine([a0, a1], [b0, b1], eps = 2e-3) {
  if (a0.distanceTo(a1) < 1e-9) return b0.distanceTo(a0) < eps;
  tmpA.subVectors(a1, a0).normalize();
  return [b0, b1].every((p) => tmpB.subVectors(p, a0).cross(tmpA).length() < eps);
}

function samePoints(a, b) {
  if (!b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i][0] - b[i][0]) + Math.abs(a[i][1] - b[i][1]) + Math.abs(a[i][2] - b[i][2]) > 1e-9) return false;
  }
  return true;
}
