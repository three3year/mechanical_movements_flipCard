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
  for (let i = 0; i < count; i++) {
    const a = start + (sweep * (i + (sweep < Math.PI * 2 ? 0.5 : 0))) / count;
    const length = to - from;
    const spoke = mesh(new THREE.BoxGeometry(length, thickness, depth), material);
    spoke.position.set(Math.cos(a) * (from + length / 2), Math.sin(a) * (from + length / 2), 0);
    spoke.rotation.z = a;
    group.add(spoke);
  }
}

function pulley(part, material) {
  const g = new THREE.Group();
  const r = part.radius;
  const w = part.width ?? 0.25;
  if (part.style === "spoked") {
    const rim = Math.max(0.06, r * 0.13);
    g.add(mesh(ring(r, r - rim, w), material));
    spokes(g, 4, r * 0.18, r - rim * 0.5, Math.max(0.05, r * 0.1), w * 0.45, material);
    g.add(mesh(cylinder(r * 0.22, w * 0.9), material));
  } else {
    // 實心輪:輪緣+內凹的輪板+輪轂,輪板上兩個凸點讓轉動看得出來
    const rim = Math.max(0.05, r * 0.22);
    g.add(mesh(ring(r, r - rim, w), material));
    g.add(mesh(cylinder(r - rim * 0.5, w * 0.4), material));
    g.add(mesh(cylinder(Math.max(0.05, r * 0.28), w * 1.05), material));
    for (const s of [1, -1]) {
      g.add(mesh(new THREE.BoxGeometry(r * 0.16, r * 0.16, w * 0.5), material, [s * r * 0.52, 0, 0]));
    }
  }
  // 軸頭
  g.add(mesh(cylinder(Math.max(0.035, r * 0.08), w * 1.6), material));
  return g;
}

function drum(part, material) {
  const g = new THREE.Group();
  const r = part.radius;
  const w = part.width;
  g.add(mesh(cylinder(r, w), material));
  // 筒面上一條縱向細條,讓轉動看得出來
  g.add(mesh(new THREE.BoxGeometry(r * 0.12, r * 0.12, w * 0.98), material, [r, 0, 0]));
  g.add(mesh(cylinder(r * 0.2, w + 0.3), material));
  return g;
}

function stepped(part, material) {
  const g = new THREE.Group();
  const total = part.steps.reduce((s, step) => s + step.width, 0);
  let z = -total / 2;
  for (const step of part.steps) {
    g.add(mesh(cylinder(step.radius, step.width), material, [0, 0, z + step.width / 2]));
    z += step.width;
  }
  const rMin = Math.min(...part.steps.map((s) => s.radius));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.06, total), material, [rMin - 0.02, 0, 0]));
  return g;
}

function cone(part, material) {
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
  g.add(mesh(new THREE.TubeGeometry(line, part.profile.length * 2, 0.03, 6, false), material));
  return g;
}

function bevel(part, material) {
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
    const box = mesh(new THREE.BoxGeometry(r * 0.12, r * 0.14, slant * 0.95), material);
    box.rotation.y = -tilt;
    box.position.set((r + top) / 2 + r * 0.03, 0, 0);
    tooth.add(box);
    tooth.rotation.z = a;
    g.add(tooth);
  }
  g.add(mesh(cylinder(r * 0.25, h * 1.4), material));
  return g;
}

function shaft(part, material) {
  const g = new THREE.Group();
  g.add(mesh(cylinder(part.radius, part.length), material));
  if (part.marker) {
    // 軸端的小臂:直立軸本身轉動看不出來,靠它顯示轉向
    const arm = part.radius * 6;
    const at = part.length / 2 - part.radius * 2;
    g.add(mesh(new THREE.BoxGeometry(arm, part.radius * 1.4, part.radius * 1.4), material, [arm / 2, 0, at]));
    g.add(mesh(cylinder(part.radius * 1.3, part.radius * 3), material, [arm, 0, at]));
  }
  return g;
}

function sectorLever(part, material) {
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
  spokes(g, 3, r * 0.15, r - rim * 0.5, r * 0.08, w * 0.5, material, Math.PI, Math.PI);
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

export function buildPart(part, material) {
  const build = builders[part.kind];
  if (!build) throw new Error(`未知的零件種類:${part.kind}`);
  return build(part, material);
}
