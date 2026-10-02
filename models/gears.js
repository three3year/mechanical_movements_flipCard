// 齒輪咬合的運動學:純函式,不依賴 Three.js。
// 齒輪以 { center, axis, teeth, radius }(radius 為節圓半徑)描述;齒 0 的中心在局部 +X(見 shapes.js)。
// 兩輪在接觸點的節圓線速度相等:外咬合反向、內咬合同向,轉角比為齒數反比。
// 初始相位讓接觸點上一輪是齒、另一輪是齒槽,齒互相嵌入而不重疊。
import { Z, TAU, add, sub, scale, dot, cross, norm, len, planeAngle } from "./kit.js";

const pitchAngle = (g) => TAU / g.teeth;
const axisOf = (g) => g.axis ?? Z;

/** 兩輪的接觸點:平行軸時在連心線上(外咬合在兩輪之間,內咬合在小輪遠離大輪圓心的一側) */
function contactPoint(a, b) {
  const d = sub(b.center, a.center);
  const u = norm(d);
  if (a.internal) return add(b.center, scale(u, b.radius)); // a 是內齒輪,b 在它裡面
  if (b.internal) return add(a.center, scale(u, -a.radius));
  return add(a.center, scale(u, a.radius));
}

/** 接觸點上兩輪表面速度的方向是否相同(+1 同向咬合,如內齒輪;−1 反向,如外咬合) */
function contactSense(a, b, p) {
  const va = cross(axisOf(a), sub(p, a.center));
  const vb = cross(axisOf(b), sub(p, b.center));
  return Math.sign(dot(va, vb)) || -1;
}

/**
 * a 轉 angleA 時,與它咬合的 b 的轉角(含讓齒互相嵌入的相位)。
 * 兩軸不平行(傘齒輪、交錯軸)時用 contact 指定接觸點。
 */
export function meshAngle(a, b, angleA, contact) {
  const p = contact ?? contactPoint(a, b);
  const sense = contactSense(a, b, p);
  const tA = (planeAngle(axisOf(a), sub(p, a.center)) - angleA) / pitchAngle(a);
  const tB = 0.5 + sense * tA;
  return planeAngle(axisOf(b), sub(p, b.center)) - pitchAngle(b) * tB;
}

/** 一串依序咬合的齒輪:回傳每個齒輪的轉角(第一個是主動輪) */
export function gearTrain(gears, angle) {
  const angles = [angle];
  for (let i = 1; i < gears.length; i++) angles.push(meshAngle(gears[i - 1], gears[i], angles[i - 1]));
  return angles;
}

/** 同軸固定在一起的兩輪轉角相同;這個函式只是讓定義讀起來清楚 */
export const sameShaft = (angle) => angle;

/** a 轉 angleA 時 b 的轉速比(不含相位):外咬合為負,內咬合為正 */
export function speedRatio(a, b, contact) {
  const p = contact ?? contactPoint(a, b);
  return (contactSense(a, b, p) * a.teeth) / b.teeth;
}

/**
 * 小齒輪帶動齒條:回傳齒條沿 rack.dir 的位移(含讓齒嵌入的相位)。
 * rack:{ origin(位移 0 時齒 0 中心在節線上的位置), dir, pitch(齒距) };
 * 小齒輪的節圓與齒條節線相切。小齒輪轉一圈,齒條移動節圓周長。
 */
export function rackOffset(pinion, rack, angle) {
  const n = axisOf(pinion);
  const along = norm(rack.dir);
  // 接觸點:小齒輪中心往齒條節線的垂足方向走一個節圓半徑
  const toLine = sub(rack.origin, pinion.center);
  const perp = sub(toLine, scale(along, dot(toLine, along)));
  const p = add(pinion.center, scale(norm(perp), pinion.radius));
  const sense = Math.sign(dot(cross(n, sub(p, pinion.center)), along)) || 1;
  const tA = (planeAngle(n, sub(p, pinion.center)) - angle) / pitchAngle(pinion);
  const tR = 0.5 + sense * tA;
  return dot(sub(p, rack.origin), along) - rack.pitch * tR;
}

/** 齒條移動 offset 時帶動的小齒輪轉角(rackOffset 的反函數) */
export function pinionAngle(pinion, rack, offset) {
  const zero = rackOffset(pinion, rack, 0);
  const n = axisOf(pinion);
  const along = norm(rack.dir);
  const toLine = sub(rack.origin, pinion.center);
  const perp = sub(toLine, scale(along, dot(toLine, along)));
  const p = add(pinion.center, scale(norm(perp), pinion.radius));
  const sense = Math.sign(dot(cross(n, sub(p, pinion.center)), along)) || 1;
  return (offset - zero) / (sense * pinion.radius);
}

/** 齒條的齒距等於與它咬合的小齒輪的節圓齒距 */
export const circularPitch = (g) => (TAU * g.radius) / g.teeth;

/** 兩個齒輪中心距(外咬合為半徑和,內咬合為半徑差) */
export const centerDistance = (a, b) => len(sub(a.center, b.center));
