// 曼格輪、曼格式齒條(第 192–194、197 種)的小齒輪要沿溝槽內外移動,它的驅動軸因此不能固定:
// 原文(第 194 種)說「該軸配備有萬向接頭,使其某一部分可以擁有必要的擺動運動」。這裡畫成一根從小齒輪往前下方
// 伸到固定端的驅動軸,兩端各一個萬向接頭(以小球表示),小齒輪升降時整根軸繞固定的那一端擺動。
// 小齒輪升降時兩個萬向接頭的距離會變:驅動軸做成兩件——固定端出來的套管(較粗、空心)與小齒輪端出來的
// 花鍵軸(較細),各自固定長度,花鍵軸插在套管裡滑動;固定端放得遠,伸縮量只佔軸長的一小部分。
// 小齒輪軸只能升降:照第 36 種原文「在直立的靜止桿上所切出的直線溝槽內運作」,小齒輪前面立一支開直線溝槽的靜止桿
// 夾住小齒輪軸,軸穿過溝槽再接萬向接頭。驅動軸與兩個萬向接頭跟著小齒輪轉,是主動件的抓取處(同色)。
// 推斷(原圖沒畫):驅動軸的套管與花鍵軸、萬向接頭、固定端的立柱、靜止桿與連到輪的軸承座的底板。
//
// 輪上引導小齒輪軸的溝(第 36、192–194 種)見 grooveLayers。
import { TAU, dist, norm, sub, quatFromZ, quatAxisAngle, quatMul } from "./kit.js";
import { arcPoints, offsetLoop } from "./shapes.js";
import { resample } from "./noncircular.js";

const JOINT_PINION = 0.11; // 小齒輪端萬向接頭的半徑
const JOINT_FIXED = 0.13; // 固定端萬向接頭的半徑
const SINK = 0.03; // 軸身插進萬向接頭球面的深度(看得出接在一起)
const SLEEVE = { radius: 0.075, inner: 0.05 };
const SPLINE = 0.04;
const POST = 0.12; // 靜止桿的厚度
const CLEAR = 0.015; // 軸與溝壁、槽壁之間的間隙

/**
 * x:小齒輪軸升降的那條直線(世界 x);travel:[最低, 最高] 小齒輪軸心的 y;shaft:小齒輪軸的半徑;
 * post:靜止桿(板)中心的 z,要在小齒輪與它前面會動的零件之前;floor:地面高度;
 * base:底板往後接到哪個 z(輪的軸承座腳座的前緣);foot:底板厚(上緣在 floor)。
 * 回傳 { parts, grips(驅動軸與萬向接頭的 id), pieces(機架上的靜止桿、底板與立柱),
 *        shaftEnd(小齒輪軸前端的 z:頂在小齒輪端的萬向接頭上,略伸進球面),
 *        pose(y, angle):小齒輪軸心在 y、小齒輪轉角 angle 時驅動軸各件的姿勢 }。
 */
export function pinionDrive({ x, travel: [lo, hi], shaft, post, floor, base, foot = 0.18 }) {
  const front = post + POST / 2 + 0.02 + JOINT_PINION;
  const fixed = [x, floor + 0.9, front + 2.6];
  const span = (y) => Math.hypot(fixed[1] - y, fixed[2] - front);
  const [shortest, longest] = [Math.min(span(lo), span(hi)), Math.max(span(lo), span(hi))];
  // 套管約佔兩接頭之間的一半多;花鍵軸在最短時伸到套管底前 0.08,最長時仍插在套管裡
  const sleeve = 0.55 * (shortest - JOINT_PINION - JOINT_FIXED);
  const spline = shortest - JOINT_PINION - JOINT_FIXED + 2 * SINK - 0.08;
  const overlap = JOINT_PINION - SINK + spline - (longest - JOINT_FIXED + SINK - sleeve);
  if (overlap < 0.3) throw new Error(`驅動軸伸到最長時花鍵軸只插進套管 ${overlap.toFixed(2)}`);

  const slot = shaft + CLEAR;
  const wall = slot + 0.1;
  const postShape = {
    outline: [[-wall, floor], [wall, floor], ...arcPoints(wall, 0, Math.PI, 0, hi)],
    holes: [[...arcPoints(slot, 0, Math.PI, 0, hi), ...arcPoints(slot, Math.PI, TAU, 0, lo)].reverse()],
  };
  const standTop = fixed[1] - JOINT_FIXED * 0.8;
  const baseEnd = fixed[2] + 0.3;

  return {
    parts: [
      { id: "joint", kind: "sphere", radius: JOINT_PINION }, // 小齒輪端的萬向接頭
      { id: "driveSpline", kind: "cylinder", radius: SPLINE, length: spline }, // 花鍵軸(小齒輪端)
      { id: "driveSleeve", kind: "cylinder", radius: SLEEVE.radius, inner: SLEEVE.inner, length: sleeve, mark: true }, // 套管(固定端)
      { id: "jointFixed", kind: "sphere", radius: JOINT_FIXED }, // 固定端的萬向接頭
    ],
    grips: ["joint", "driveSpline", "driveSleeve", "jointFixed"],
    pieces: [
      { kind: "plate", shape: postShape, thickness: POST, at: [x, 0, post] }, // 開直線溝槽的靜止桿
      { kind: "box", size: [0.6, foot, baseEnd - base], at: [x, floor - foot / 2, (base + baseEnd) / 2] }, // 底板
      { kind: "box", size: [0.2, standTop - floor, 0.2], at: [x, (standTop + floor) / 2, fixed[2]] }, // 托著固定端萬向接頭的立柱
    ],
    shaftEnd: front - JOINT_PINION + 0.02,
    pose(y, angle) {
      const a = [x, y, front];
      const d = norm(sub(fixed, a));
      const along = (p, t) => p.map((v, k) => v + d[k] * t);
      const rotation = quatMul(quatFromZ(d), quatAxisAngle([0, 0, 1], angle));
      const l = dist(a, fixed);
      return {
        joint: { position: a, rotation },
        driveSpline: { position: along(a, JOINT_PINION - SINK + spline / 2), rotation },
        driveSleeve: { position: along(a, l - (JOINT_FIXED - SINK) - sleeve / 2), rotation },
        jointFixed: { position: fixed, rotation },
      };
    },
  };
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** 平移後的折線在凹角(路徑段與段相接處的小折角)會打出小結:剪掉結,接在兩段的交點上 */
function untangle(loop) {
  // 跨過折線頭尾的結:轉半圈再剪一次
  const once = untangleOpen(loop);
  const h = Math.floor(once.length / 2);
  return untangleOpen([...once.slice(h), ...once.slice(0, h)]);
}

function untangleOpen(loop, window = 60) {
  const out = loop.slice();
  for (let i = 0; i < out.length - 3; i++) {
    const [a, b] = [out[i], out[i + 1]];
    for (let k = 2; k < window && i + k + 1 < out.length; k++) {
      const [c, d] = [out[i + k], out[i + k + 1]];
      if (cross(c, d, a) * cross(c, d, b) < 0 && cross(a, b, c) * cross(a, b, d) < 0) {
        const t = cross(c, d, a) / (cross(c, d, a) - cross(c, d, b));
        out.splice(i + 1, k, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); // 去掉結上的 k 點,換成交點
        break;
      }
    }
  }
  return out;
}

/**
 * 輪上引導小齒輪軸的溝(第 36、192–194 種):沿 centers(小齒輪軸心在輪上走的封閉路徑)開寬 2·(shaft + 間隙)的溝,
 * 溝只開 depth 深,溝底是實心板。outline、holes:輪的外形與輪轂孔;front:溝口(輪面)的 z。
 * 回傳輪的 pieces:溝那一層的外側板、溝圍住的島(靠溝底的實心板連在輪上)與溝底的實心板。
 */
export function grooveLayers({ centers, shaft, outline, holes = [], front, depth, back }) {
  let loop = resample(centers, 0.02);
  const area = loop.reduce((s, p, i) => s + p[0] * loop[(i + 1) % loop.length][1] - loop[(i + 1) % loop.length][0] * p[1], 0);
  if (area < 0) loop = loop.reverse(); // offsetLoop 要逆時針
  const half = shaft + CLEAR;
  return [
    { kind: "plate", shape: { outline, holes: [untangle(offsetLoop(loop, half)).reverse(), ...holes] }, thickness: depth, at: [0, 0, front - depth / 2] },
    { kind: "plate", shape: { outline: untangle(offsetLoop(loop, -half)) }, thickness: depth, at: [0, 0, front - depth / 2] },
    { kind: "plate", shape: { outline, holes }, thickness: back, at: [0, 0, front - depth - back / 2] },
  ];
}
