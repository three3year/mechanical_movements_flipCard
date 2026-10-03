// 依模型定義的零件種類建立 3D 物件。每個零件在自己的座標裡以 Z 軸為旋轉軸,
// 由 viewer 對齊到定義中的 axis;皮帶、繩、連桿這類路徑零件由 paths.js 依姿勢建立。
// 零件種類的清單在 models/kinds.js;齒輪、凸輪等板件的輪廓由 models/shapes.js 計算。
import * as THREE from "three";
import { gearShape, gearSize, rackShape, toothOutline, sectorShape } from "../models/shapes.js";
import { sliceAngle } from "../models/gears.js";
import { PATH_KINDS } from "../models/kinds.js";

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
    spokes(g, part.spokes ?? 4, r * 0.18, r - rim * 0.5, Math.max(0.05, r * 0.1), w * 0.45, material)[0].material = mark;
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

// ── 板件:沿局部 Z 擠出的 2D 輪廓 ─────────

function extrude({ outline, holes = [] }, thickness) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const hole of holes) shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 4 });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

// 板面上的一個記號圓點(會轉的板件靠它看出轉動)
function markDot(g, at, size, thickness, mark) {
  g.add(mesh(cylinder(size, thickness * 1.15, size, 20), mark, [at[0], at[1], 0]));
}

// 板面上的刻線圓:細圓環在法線上的落差描出一圈線,正面看也看得到(原圖的同心圓)
function faceCircle(g, r, z, material, tube) {
  g.add(mesh(new THREE.TorusGeometry(r, tube, 6, Math.max(24, Math.round(r * 60))), material, [0, 0, z]));
}

function plate(part, material, mark) {
  const g = new THREE.Group();
  const t = part.thickness ?? 0.2;
  g.add(mesh(extrude(part.shape, t), material));
  if (part.mark) markDot(g, part.mark, part.markSize ?? 0.08, t, mark);
  if (part.hub) g.add(mesh(cylinder(part.hub, t * 1.6), material));
  // circles:板面上的刻線圓(原圖的同心圓);engrave:板面上任意封閉折線的刻線
  for (const r of part.circles ?? []) for (const z of [t / 2, -t / 2]) faceCircle(g, r, z, material, Math.max(0.008, r * 0.008));
  for (const line of part.engrave ?? []) {
    const curve = new THREE.CatmullRomCurve3(line.map(([x, y]) => new THREE.Vector3(x, y, 0)), true);
    const geometry = new THREE.TubeGeometry(curve, line.length * 2, 0.012, 5, true);
    for (const z of [t / 2, -t / 2]) g.add(mesh(geometry, material, [0, 0, z]));
  }
  return g;
}

const internalRim = (part) => part.rim ?? part.radius + 2.6 * gearSize(part.radius, part.teeth).addendum;

// 齒輪:外齒輪板面上有齒圈內緣與輪轂兩圈刻線(原圖的同心圓),齒 0 塗記號色;內齒輪是帶內齒的環
// 傘齒輪:把正齒輪沿軸往錐頂收窄(局部 +Z 朝錐頂,節錐角 cone)
function taper(geometry, part, w) {
  const apex = part.radius / Math.tan(part.cone);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const s = 1 - (pos.getZ(i) + w / 2) / apex;
    pos.setXY(i, pos.getX(i) * s, pos.getY(i) * s);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// 冠狀齒輪:圓盤的 +Z 面上一圈徑向的齒
function crown(part, material, mark) {
  const g = new THREE.Group();
  const w = part.width ?? 0.25;
  const depth = part.toothDepth ?? (2.2 * part.radius) / part.teeth;
  const inner = part.radius - (part.faceWidth ?? part.radius * 0.22);
  g.add(mesh(cylinder(part.radius + depth * 0.2, w), material));
  g.add(mesh(cylinder(part.hub ?? part.radius * 0.18, w * 2), material));
  const pitch = (2 * Math.PI) / part.teeth;
  const thick = 0.42 * pitch * part.radius;
  for (let i = 0; i < part.teeth; i++) {
    const tooth = mesh(new THREE.BoxGeometry(part.radius - inner, thick, depth), i === 0 ? mark : material);
    tooth.position.set(Math.cos(i * pitch) * (inner + part.radius) / 2, Math.sin(i * pitch) * (inner + part.radius) / 2, w / 2 + depth / 2);
    tooth.rotation.z = i * pitch;
    g.add(tooth);
  }
  return g;
}

function gear(part, material, mark) {
  if (part.crown) return crown(part, material, mark);
  const g = new THREE.Group();
  const w = part.width ?? 0.25;
  const mask = part.mask ?? (part.toothed ? (i) => part.toothed.includes(i) : undefined);
  const { dedendum } = gearSize(part.radius, part.teeth);
  const root = part.radius - dedendum;
  const hub = Math.max((part.bore ?? 0) * 1.6, root * 0.28);
  if (part.span) {
    // 扇形齒輪:只有一段齒,第一個齒塗記號色
    g.add(mesh(extrude(sectorShape(part), w), material));
    g.add(mesh(cylinder(Math.max(part.bore ?? 0, part.radius * 0.12), w * 1.4), material));
    const first = Math.ceil(part.span[0] / ((2 * Math.PI) / part.teeth) + 0.5 - 1e-9);
    g.add(mesh(extrude({ outline: toothOutline(part, first) }, w * 1.08), mark));
    return g;
  }
  if (part.slices) {
    // 斜齒、人字齒、階梯錯齒:沿軸切成幾片,每片依 sliceAngle 轉一點(見 models/gears.js)
    const n = part.slices;
    const gap = part.sliceGap ?? 0;
    const t = (w - gap * (n - 1)) / n;
    const geometry = extrude(gearShape({ ...part, mask }), t);
    for (let i = 0; i < n; i++) {
      const slice = mesh(geometry, material, [0, 0, -w / 2 + t / 2 + i * (t + gap)]);
      slice.rotation.z = sliceAngle(part, i);
      g.add(slice);
    }
  } else if (part.cone) {
    g.add(mesh(taper(extrude(gearShape({ ...part, mask }), w), part, w), material));
  } else {
    g.add(mesh(extrude(gearShape({ ...part, mask }), w), material));
  }
  if (part.cone) {
    // 傘齒輪的輪轂在大端(背面)
    const hubLength = Math.min(w * 0.8, part.radius * 0.3);
    g.add(mesh(cylinder(Math.max(part.bore ?? 0, part.radius * 0.25), hubLength), material, [0, 0, -w / 2 - hubLength / 2 + 0.02]));
    const marked = mesh(taper(extrude({ outline: toothOutline(part, 0) }, w * 1.02), part, w * 1.02), mark);
    g.add(marked);
    return g;
  }
  if (!part.internal && part.hub !== false) {
    const tube = Math.max(0.008, part.radius * 0.011);
    for (const z of [1, -1]) {
      if (part.web !== false && root * 0.8 > hub * 1.5) faceCircle(g, root * 0.8, (z * w) / 2, material, tube);
      faceCircle(g, hub, z * w * 0.65, material, tube);
    }
    g.add(mesh(cylinder(hub, w * 1.3), material));
    if (part.axle !== false) g.add(mesh(cylinder(Math.max(0.03, Math.min(hub * 0.55, part.radius * 0.07)), w * 1.9), material));
  }
  const has = mask ?? (() => true);
  const markTooth = [...Array(part.teeth).keys()].find((i) => has(i)) ?? 0;
  const markAt = part.slices ? sliceAngle(part, part.slices - 1) : 0;
  const markZ = part.slices ? w / 2 - (w - (part.sliceGap ?? 0) * (part.slices - 1)) / part.slices / 2 : 0;
  const markLen = part.slices ? (w - (part.sliceGap ?? 0) * (part.slices - 1)) / part.slices : w;
  const marked = mesh(extrude({ outline: toothOutline(part, markTooth) }, markLen * 1.08), mark, [0, 0, markZ]);
  marked.rotation.z = markAt;
  g.add(marked);
  return g;
}

function rack(part, material) {
  const t = part.width ?? 0.25;
  return mesh(extrude(rackShape({ teeth: part.teeth, pitch: part.pitch, depth: part.depth ?? part.pitch * 0.8 }), t), material);
}

function solidCylinder(part, material, mark) {
  const g = new THREE.Group();
  const l = part.length;
  if (part.inner) g.add(mesh(ring(part.radius, part.inner, l), material));
  else g.add(mesh(cylinder(part.radius, l, part.radiusEnd ?? part.radius), material));
  if (part.mark) {
    const s = Math.max(0.035, part.radius * 0.18);
    g.add(mesh(new THREE.BoxGeometry(s, s, l * 0.96), mark, [part.radius, 0, 0]));
  }
  return g;
}

function sphere(part, material) {
  return mesh(new THREE.SphereGeometry(part.radius, 28, 18), material);
}

function lathe(part, material, mark) {
  // profile:[[r, z], …],沿局部 Z 由下而上
  const points = part.profile.map(([r, z]) => new THREE.Vector2(r, z));
  const geometry = new THREE.LatheGeometry(points, SEGMENTS);
  geometry.rotateX(Math.PI / 2);
  const g = new THREE.Group();
  g.add(mesh(geometry, material));
  if (part.mark) {
    const [r, z] = part.profile.reduce((m, pt) => (pt[0] > m[0] ? pt : m));
    g.add(mesh(new THREE.SphereGeometry(Math.max(0.04, r * 0.1), 12, 8), mark, [r, 0, z]));
  }
  return g;
}

// 連桿:局部 +X 由 from 指向 to,兩端銷頭;長度隨 from/to 改變(stretch)
function link(part, material) {
  const g = new THREE.Group();
  const w = part.width ?? 0.14;
  const t = part.thickness ?? 0.08;
  const body = mesh(new THREE.BoxGeometry(1, w, t).translate(0.5, 0, 0), material);
  const capA = mesh(cylinder(w / 2, t), material);
  const capB = mesh(cylinder(w / 2, t), material);
  const pinA = mesh(cylinder(w * 0.2, t * 2.2), material);
  const pinB = mesh(cylinder(w * 0.2, t * 2.2), material);
  g.add(body, capA, capB);
  if (part.pins !== false) g.add(pinA, pinB);
  g.userData.stretch = (length) => {
    body.scale.x = Math.max(1e-4, length);
    capB.position.x = pinB.position.x = length;
  };
  g.userData.stretch(part.length ?? 1);
  return g;
}

// 螺旋彈簧:局部 +X 由 from 到 to
function spring(part, material) {
  const coils = part.coils ?? 8;
  const r = part.radius ?? 0.12;
  const steps = coils * 16;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * coils * Math.PI * 2;
    return new THREE.Vector3(i / steps, r * Math.cos(a), r * Math.sin(a));
  });
  const coil = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, part.wire ?? 0.025, 6, false), material);
  const g = new THREE.Group();
  g.add(coil);
  g.userData.stretch = (length) => (coil.scale.x = Math.max(1e-4, length));
  g.userData.stretch(part.length ?? 1);
  return g;
}

// 蝸桿、螺桿:圓柱外繞螺旋齒,沿局部 Z
function worm(part, material, mark) {
  const g = new THREE.Group();
  const r = part.radius;
  const l = part.length;
  const pitch = part.pitch ?? r * 0.8;
  const turns = l / pitch;
  const steps = Math.ceil(turns * 24);
  const thread = part.thread ?? r * 0.18;
  const core = r - thread;
  g.add(mesh(cylinder(core, l), material));
  const hand = part.hand ?? 1; // +1 右旋
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = hand * (i / steps) * turns * Math.PI * 2;
    return new THREE.Vector3(core * Math.cos(a), core * Math.sin(a), -l / 2 + (i / steps) * l);
  });
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, thread, 6, false), material));
  const s = Math.max(0.03, core * 0.2);
  g.add(mesh(new THREE.BoxGeometry(s, s, l * 0.9), mark, [0, core * 0.85, 0]));
  return g;
}

// 容器內的存量:半透明填色,level(0–1)決定由底部起算的高度(局部 Y)
function fill(part, material) {
  const [w, h, d] = part.size;
  const geometry =
    part.shape === "cylinder"
      ? new THREE.CylinderGeometry(w / 2, w / 2, 1, 32).translate(0, 0.5, 0)
      : new THREE.BoxGeometry(w, 1, d).translate(0, 0.5, 0);
  const m = mesh(geometry, material);
  m.position.y = -h / 2;
  const g = new THREE.Group();
  g.add(m);
  g.userData.level = (level) => {
    m.scale.y = Math.max(1e-4, level * h);
    m.visible = level > 1e-4;
  };
  g.userData.level(part.level ?? 0);
  return g;
}

const group = () => new THREE.Group();

// 固定在零件上的曲線凸條(例如碟形輪面上的螺旋螺紋):沿 points 的管
function tube(part, material) {
  const curve = new THREE.CatmullRomCurve3(part.points.map((p) => new THREE.Vector3(...p)), !!part.closed);
  return mesh(new THREE.TubeGeometry(curve, part.points.length * 2, part.radius ?? 0.05, 8, !!part.closed), material);
}

const builders = {
  pulley,
  drum,
  stepped,
  cone,
  bevel,
  shaft,
  sectorLever,
  weight,
  box,
  ropeEnd,
  bar,
  gear,
  rack,
  plate,
  cylinder: solidCylinder,
  sphere,
  lathe,
  link,
  spring,
  worm,
  fill,
  group,
  tube,
};

export { PATH_KINDS };

const Z_AXIS = new THREE.Vector3(0, 0, 1);

/**
 * 依零件定義建立物件。pieces 是固定在零件上的附件(局部座標 at、局部軸 axis、繞軸 angle),
 * 例如曲柄上的銷、槓桿上的配重;附件標 accent: true 時用記號色。
 */
export function buildPart(part, material, mark) {
  const build = builders[part.kind];
  if (!build) throw new Error(`未知的零件種類:${part.kind}`);
  const object = build(part, material, mark);
  for (const piece of part.pieces ?? []) {
    const child = buildPart(piece, piece.accent ? mark : material, mark);
    if (piece.at) child.position.set(...piece.at);
    if (piece.rotation) {
      // 直接指定附件的朝向(四元數 [x, y, z, w]),例如冠狀棘輪上立在輪緣、面朝外的鋸齒
      child.quaternion.set(...piece.rotation);
    } else {
      child.quaternion.setFromUnitVectors(Z_AXIS, new THREE.Vector3(...(piece.axis ?? [0, 0, 1])).normalize());
      if (piece.angle) child.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, piece.angle));
    }
    object.add(child);
  }
  return object;
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
    case "gear": {
      const { addendum, dedendum } = gearSize(part.radius, part.teeth);
      if (part.internal) return { radius: internalRim(part), offset: 0 };
      return { radius: part.radius + addendum + dedendum * 0.2, offset: 0 };
    }
    case "worm":
      return { radius: part.radius, offset: part.length / 2 - 0.1 };
    case "plate":
    case "cylinder":
    case "lathe":
    case "group":
      return part.spin ? { radius: part.spin, offset: part.spinOffset ?? 0 } : null;
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
