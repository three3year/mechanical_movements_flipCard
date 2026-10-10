// 第 205 種:由「兩齒小齒輪」驅動的輪。這個小齒輪其實是兩個凸輪(前後各一),分別與輪兩面上兩組獨立的齒咬合:
// 前面一組長齒、後面一組短齒,兩組交錯排列。兩個凸輪方向相差半圈,各自在轉到朝著輪的那大半圈裡推自己那一組的齒,
// 一個推完之前另一個已經接手,輪因此連續地轉。主動件是小齒輪。
//
// 接觸:照 507movements 的動畫,輪等速轉(小齒輪每轉一圈,輪走兩格),凸輪的外形由齒反求——把那一組齒
// 換到小齒輪的座標裡掃過一圈,凸輪就是齒從沒掃到的那一塊(從軸心沿每個方向往外量到第一次碰到齒,最遠到尖端)。
// 所以凸輪整圈貼著齒的外形:尖端兩側是兩段漸開的弧(心形凸輪),朝前的一側頂著齒的側面推,
// 背面是齒端掃過的同心圓弧(只擦過、不推)。推的那一段大半圈,兩個凸輪交接時一起推一段。
// 推斷:凸輪外形(由齒反求,和原圖的蛋形相近);齒數依原圖。
import { TAU, polar, rot2 } from "./kit.js";
import { placeOutline } from "./contact.js";
import { pedestal } from "./supports.js";
import { shape, circle } from "./shapes.js";

const N = 12; // 每一組的齒數
const STEP = TAU / (2 * N); // 一格(前後兩組交錯)
const RIM = 1.95;
const PINION = [0, -2.8, 0];
const TIP = 0.85; // 凸輪尖端離軸心(伸到輪板的邊)
const TOOTH = { width: 0.2, outer: 2.55, inner: { front: 1.6, back: 1.85 } }; // 齒沿半徑的範圍;內端都壓在輪板上
const LAYER = 0.2; // 齒與凸輪那一層離輪板中面(輪板厚 0.2,齒厚 0.22 從輪板面起,凸輪厚 0.16 在齒的那一層裡)

/** 小齒輪轉 alpha(逆時針):輪轉的角度(順時針為負)——每轉半圈走一格 */
export const wheelAngle = (alpha) => -(alpha / Math.PI) * STEP;
export const geometry = { N, STEP };

const toothAngle = (set, i) => Math.PI / 2 + (set === "front" ? STEP : 0) + i * 2 * STEP;
// 齒的平面外形(輪的座標)
const toothOutline = (set, i) => {
  const [r0, r1, h] = [TOOTH.inner[set], TOOTH.outer, TOOTH.width / 2];
  return [[r0, -h], [r1, -h], [r1, h], [r0, h]].map((p) => rot2(p, toothAngle(set, i)));
};
const teethAt = (set, w, only = Array.from({ length: N }, (_, i) => i)) => only.map((i) => toothOutline(set, i).map((p) => rot2(p, w)));
// 輪轉 w 時最靠近小齒輪(正下方)的三個齒
const nearPinion = (set, w) => {
  const i = Math.round((-Math.PI / 2 - w - toothAngle(set, 0)) / (2 * STEP));
  return [i - 1, i, i + 1].map((k) => ((k % N) + N) % N);
};

// 凸輪外形:沿小齒輪座標的每個方向,量齒在一圈裡最靠近軸心的地方
const RAYS = 360;
const SAMPLES = 1440;
function rayHit(dx, dy, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = (a[0] * ey - a[1] * ex) / den;
    const s = (a[0] * dy - a[1] * dx) / den;
    if (t > 0 && s >= 0 && s <= 1 && t < best) best = t;
  }
  return best;
}
function camOutline(set) {
  const dirs = Array.from({ length: RAYS }, (_, j) => [Math.cos((j / RAYS) * TAU), Math.sin((j / RAYS) * TAU)]);
  const rho = new Array(RAYS).fill(TIP);
  for (let k = 0; k < SAMPLES; k++) {
    const alpha = (k / SAMPLES) * TAU;
    const w = wheelAngle(alpha);
    for (const tooth of teethAt(set, w, nearPinion(set, w))) {
      if (!tooth.some(([x, y]) => Math.hypot(x - PINION[0], y - PINION[1]) < TIP + 0.3)) continue;
      const local = tooth.map(([x, y]) => rot2([x - PINION[0], y - PINION[1]], -alpha));
      // 只量齒從軸心看過去所佔的那幾個方向(齒離軸心至少 0.25,張角小於半圈)
      const angles = local.map(([x, y]) => Math.atan2(y, x));
      const mid = angles[0];
      const rel = angles.map((a) => Math.atan2(Math.sin(a - mid), Math.cos(a - mid)));
      const [lo, hi] = [Math.floor(((mid + Math.min(...rel)) / TAU) * RAYS), Math.ceil(((mid + Math.max(...rel)) / TAU) * RAYS)];
      for (let n = lo; n <= hi; n++) {
        const j = ((n % RAYS) + RAYS) % RAYS;
        rho[j] = Math.min(rho[j], rayHit(dirs[j][0], dirs[j][1], local));
      }
    }
  }
  // 留 0.001 的間隙,免得取樣之間的齒擦進去
  return dirs.map(([x, y], j) => [(rho[j] - 0.001) * x, (rho[j] - 0.001) * y]);
}
const CAM = { front: camOutline("front"), back: camOutline("back") };

/** 檢查用:小齒輪轉 alpha 時兩個凸輪與兩組齒裡最靠近小齒輪的三個齒的外形(世界座標 2D);lag 是讓輪比應有的轉角少轉多少(逆時針) */
export function contactAt(alpha, lag = 0) {
  const w = wheelAngle(alpha) + lag;
  return {
    cams: { front: placeOutline(CAM.front, PINION, alpha), back: placeOutline(CAM.back, PINION, alpha) },
    teeth: { front: teethAt("front", w, nearPinion("front", w)), back: teethAt("back", w, nearPinion("back", w)) },
  };
}

const teeth = (set) =>
  Array.from({ length: N }, (_, i) => {
    const a = toothAngle(set, i);
    const [r0, r1] = [TOOTH.inner[set], TOOTH.outer];
    const z = set === "front" ? 1 : -1;
    return { kind: "box", size: [r1 - r0, TOOTH.width, 0.22], at: [...polar((r0 + r1) / 2, a).slice(0, 2), z * (0.09 + 0.11)], angle: a, accent: set === "front" && i === 0 };
  });

const FLOOR = PINION[1] - 0.9;
export default {
  figure: 205,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: RIM + 0.5,
      pieces: [
        { kind: "plate", shape: shape(circle(RIM), [circle(0.25).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.48, inner: 0.25, length: 0.35 },
        ...teeth("front"),
        ...teeth("back"),
      ],
    },
    {
      id: "pinion",
      kind: "group",
      center: PINION,
      // 轉向箭頭放在前面凸輪的前方,不埋進輪板
      spin: 1.0,
      spinOffset: 0.5,
      pieces: [
        { kind: "plate", shape: shape(CAM.front, [circle(0.1).reverse()]), thickness: 0.16, at: [0, 0, LAYER] },
        { kind: "plate", shape: shape(CAM.back, [circle(0.1).reverse()]), thickness: 0.16, at: [0, 0, -LAYER] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.65, mark: true },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推斷(原圖只畫出輪轂):輪與小齒輪的固定軸,往後進到軸承座
        { kind: "cylinder", radius: 0.24, length: 1.0, at: [0, 0, -0.35] },
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.24, floor: FLOOR }),
        { kind: "cylinder", radius: 0.075, length: 1.2, at: [PINION[0], PINION[1], -0.35] },
        ...pedestal({ at: [PINION[0], PINION[1]], z: -0.75, bore: 0.075, floor: FLOOR }),
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", speed: 2 },
  target: "wheel",
  view: { direction: [0.15, 0.1, 1] },
  pose(alpha) {
    return { parts: { pinion: { angle: alpha }, wheel: { angle: wheelAngle(alpha) } }, readouts: [] };
  },
};
