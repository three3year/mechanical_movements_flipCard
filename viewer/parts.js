// 依模型定義的零件種類建立 3D 物件。每個零件在自己的座標裡以 Z 軸為旋轉軸,
// 由 viewer 對齊到定義中的 axis;皮帶、繩、連桿這類路徑零件由 paths.js 依姿勢建立。
import * as THREE from "three";

const SEGMENTS = 48;

// Three.js 的圓柱沿 Y 軸,轉成沿 Z 軸
function alongZ(geometry) {
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function cylinder(radius, length, radiusEnd = radius, segments = SEGMENTS) {
  return alongZ(new THREE.CylinderGeometry(radiusEnd, radius, length, segments));
}

// 中空圓環(輪緣),厚度沿 Z
function ring(outer, inner, width) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: false,
    curveSegments: SEGMENTS,
  });
  geometry.translate(0, 0, -width / 2);
  return geometry;
}

function mesh(geometry, material, position) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.set(...position);
  return m;
}

function spokes(group, count, from, to, thickness, depth, material, start = 0, sweep = Math.PI * 2) {
  const made = [];
  for (let i = 0; i < count; i++) {
    const a = start + (sweep * (i + (sweep < Math.PI * 2 ? 0.5 : 0))) / count;
    const length = to - from;
    const spoke = mesh(new THREE.BoxGeometry(length, thickness, depth), material);
    spoke.position.set(Math.cos(a) * (from + length / 2), Math.sin(a) * (from + length / 2), 0);
    spoke.rotation.z = a;
    group.add(spoke);
    made.push(spoke);
  }
  return made;
}

// 每個會轉的零件只有一處塗上記號色(mark):整圈對稱的輪輻看不出轉動,單一記號才看得出轉向與快慢

function pulley(part, material, mark) {
  const g = new THREE.Group();
  const r = part.radius;
  const w = part.width ?? 0.25;
  if (part.style === "spoked") {
    const rim = Math.max(0.06, r * 0.13);
    g.add(mesh(ring(r, r - rim, w), material));
    spokes(g, 4, r * 0.18, r - rim * 0.5, Math.max(0.05, r * 0.1), w * 0.45, material)[0].material = mark;
    g.add(mesh(cylinder(r * 0.22, w * 0.9), material));
  } else {
    // 實心輪:輪緣+內凹的輪板+輪轂,輪板上一條從輪轂到輪緣的記號條
    const rim = Math.max(0.05, r * 0.22);
    const hub = Math.max(0.05, r * 0.28);
    g.add(mesh(ring(r, r - rim, w), material));
    g.add(mesh(cylinder(r - rim * 0.5, w * 0.4), material));
    g.add(mesh(cylinder(hub, w * 1.05), material));
    const bar = r - rim - hub;
    g.add(mesh(new THREE.BoxGeometry(bar, Math.max(0.04, r * 0.16), w * 0.6), mark, [hub + bar / 2, 0, 0]));
  }
  // 軸頭
  g.add(mesh(cylinder(Math.max(0.035, r * 0.08), w * 1.6), material));
  return g;
}

function drum(part, material, mark) {
  const g = new THREE.Group();
  const r = part.radius;
  const w = part.width;
  g.add(mesh(cylinder(r, w), material));
  // 筒面上一條縱向細條,讓轉動看得出來
  g.add(mesh(new THREE.BoxGeometry(r * 0.16, r * 0.16, w * 0.98), mark, [r, 0, 0]));
  g.add(mesh(cylinder(r * 0.2, w + 0.3), material));
  return g;
}

function stepped(part, material, mark) {
  const g = new THREE.Group();
  const total = part.steps.reduce((s, step) => s + step.width, 0);
  let z = -total / 2;
  for (const step of part.steps) {
    g.add(mesh(cylinder(step.radius, step.width), material, [0, 0, z + step.width / 2]));
    z += step.width;
  }
  // 沿各段外緣的記號條
  z = -total / 2;
  for (const step of part.steps) {
    g.add(mesh(new THREE.BoxGeometry(0.09, 0.09, step.width * 0.96), mark, [step.radius, 0, z + step.width / 2]));
    z += step.width;
  }
  return g;
}

function cone(part, material, mark) {
  // profile:[[f, r], ...],f 從 0 到 1 沿軸,0 在 -length/2
  const points = part.profile.map(([f, r]) => new THREE.Vector2(r, (f - 0.5) * part.length));
  points.unshift(new THREE.Vector2(0, -part.length / 2));
  points.push(new THREE.Vector2(0, part.length / 2));
  const g = new THREE.Group();
  g.add(mesh(alongZ(new THREE.LatheGeometry(points, SEGMENTS)), material));
  // 沿錐面母線的一條細棱,讓轉動看得出來
  const line = new THREE.CatmullRomCurve3(
    part.profile.map(([f, r]) => new THREE.Vector3(r + 0.01, 0, (f - 0.5) * part.length)),
  );
  g.add(mesh(new THREE.TubeGeometry(line, part.profile.length * 2, 0.045, 6, false), mark));
  return g;
}

function bevel(part, material, mark) {
  // 斜齒輪:錐台,尖端朝 +Z,錐面上排列齒
  const g = new THREE.Group();
  const r = part.radius;
  const h = part.height ?? r * 0.6;
  const top = r * 0.55;
  g.add(mesh(cylinder(r, h, top), material));
  const teeth = part.teeth ?? 16;
  const slant = Math.hypot(r - top, h);
  const tilt = Math.atan2(r - top, h);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.Group();
    const box = mesh(new THREE.BoxGeometry(r * 0.12, r * 0.14, slant * 0.95), i < 2 ? mark : material);
    box.rotation.y = -tilt;
    box.position.set((r + top) / 2 + r * 0.03, 0, 0);
    tooth.add(box);
    tooth.rotation.z = a;
    g.add(tooth);
  }
  g.add(mesh(cylinder(r * 0.25, h * 1.4), material));
  return g;
}

function shaft(part, material, mark) {
  const g = new THREE.Group();
  g.add(mesh(cylinder(part.radius, part.length), material));
  if (part.marker) {
    // 軸端的小臂:直立軸本身轉動看不出來,靠它顯示轉向
    const arm = part.radius * 6;
    const at = part.length / 2 - part.radius * 2;
    g.add(mesh(new THREE.BoxGeometry(arm, part.radius * 1.4, part.radius * 1.4), mark, [arm / 2, 0, at]));
    g.add(mesh(cylinder(part.radius * 1.3, part.radius * 3), mark, [arm, 0, at]));
  }
  return g;
}

function sectorLever(part, material, mark) {
  // 第 6 種:槓桿+固定其上的半圓扇形段(弧在下方)
  const g = new THREE.Group();
  const r = part.radius;
  const rim = r * 0.12;
  const w = part.width ?? 0.25;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, Math.PI, Math.PI * 2, false);
  shape.absarc(0, 0, r - rim, Math.PI * 2, Math.PI, true);
  const half = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false, curveSegments: SEGMENTS });
  half.translate(0, 0, -w / 2);
  g.add(mesh(half, material));
  spokes(g, 3, r * 0.15, r - rim * 0.5, r * 0.08, w * 0.5, material, Math.PI, Math.PI)[1].material = mark;
  const barLength = part.barLength;
  g.add(mesh(new THREE.BoxGeometry(barLength, r * 0.1, w * 0.5), material, [0, r * 0.03, 0]));
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.SphereGeometry(r * 0.1, 20, 12), material, [(s * barLength) / 2, r * 0.03, 0]));
  }
  g.add(mesh(cylinder(r * 0.2, w * 1.2), material));
  return g;
}

function weight(part, material) {
  const g = new THREE.Group();
  if (part.shape === "box") {
    g.add(mesh(new THREE.BoxGeometry(...part.size), material));
  } else {
    g.add(mesh(cylinder(part.radius, part.height), material));
    // 吊環
    const eye = new THREE.TorusGeometry(part.radius * 0.18, part.radius * 0.05, 8, 24);
    eye.rotateX(Math.PI / 2);
    g.add(mesh(eye, material, [0, 0, part.height / 2 + part.radius * 0.2]));
  }
  return g;
}

function box(part, material) {
  return mesh(new THREE.BoxGeometry(...part.size), material);
}

function ropeEnd(part, material) {
  // 繩端的握把:一截橫棒+圓頭
  const g = new THREE.Group();
  const s = part.size ?? 0.16;
  g.add(mesh(new THREE.SphereGeometry(s, 20, 14), material));
  const bar = mesh(new THREE.CylinderGeometry(s * 0.45, s * 0.45, s * 3.2, 16), material);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, -s * 0.9, 0);
  g.add(bar);
  return g;
}

function bar(part, material) {
  return mesh(cylinder(part.radius, part.length), material);
}

const builders = { pulley, drum, stepped, cone, bevel, shaft, sectorLever, weight, box, ropeEnd, bar };

export const PATH_KINDS = new Set(["belt", "rope", "rod"]);

export function buildPart(part, material, mark) {
  const build = builders[part.kind];
  if (!build) throw new Error(`未知的零件種類:${part.kind}`);
  return build(part, material, mark);
}

/**
 * 會轉動的零件的轉向箭頭位置:外緣半徑,以及沿軸的偏移(長筒形零件擺到端部,避開中段的皮帶)。
 * 不轉的零件回傳 null。
 */
export function spinPlacement(part) {
  switch (part.kind) {
    case "pulley":
    case "bevel":
    case "sectorLever":
      return { radius: part.radius, offset: 0 };
    case "drum":
      return { radius: part.radius, offset: part.width / 2 - 0.12 };
    case "stepped": {
      const total = part.steps.reduce((sum, st) => sum + st.width, 0);
      let z = -total / 2;
      let best = { radius: 0, offset: 0 };
      for (const st of part.steps) {
        if (st.radius > best.radius) best = { radius: st.radius, offset: z + st.width / 2 };
        z += st.width;
      }
      return best;
    }
    case "cone": {
      const [f, radius] = part.profile.reduce((m, pt) => (pt[1] > m[1] ? pt : m));
      return { radius, offset: (Math.min(Math.max(f, 0.08), 0.92) - 0.5) * part.length };
    }
    default:
      return null;
  }
}

/**
 * 轉向箭頭:繞零件軸(局部 Z)的一段弧,中心在局部 +X 方向,箭頭朝逆時針。
 * 把它的 scale.y 設成 −1 就變成順時針。
 */
export function buildSpinArrow(radius, material) {
  const arc = Math.PI / 2.6;
  const tube = 0.045;
  const g = new THREE.Group();
  const band = new THREE.TorusGeometry(radius, tube, 8, 32, arc);
  band.rotateZ(-arc / 2);
  g.add(mesh(band, material));
  const head = new THREE.ConeGeometry(tube * 2.6, tube * 6, 16);
  const end = arc / 2;
  const tip = mesh(head, material, [radius * Math.cos(end), radius * Math.sin(end), 0]);
  tip.rotation.z = end; // 圓錐尖端沿 +Y,轉到切線(逆時針)方向
  g.add(tip);
  return g;
}
