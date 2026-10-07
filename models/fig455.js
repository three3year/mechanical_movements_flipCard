// 第 455 種:舊式旋轉泵。下方的開口進水,上方的開口出水。中央部分連同它的閥門一起旋轉,閥門恰好貼合外圓筒的內面。
// 圓筒下側畫出的凸出部分是一個擋板,閥門轉到那裡時被它闔上。
// 主動件是中央的轉鼓(順時針,依原圖的進出水箭頭)。
// 推斷:兩片閥門鉸在轉鼓上,平常張開、外緣貼著圓筒,把左側與上方的水從進水口推向出水口;
// 經過右下的擋板時被壓平貼著轉鼓,過了擋板再張開——閥門的角度由它與圓筒內壁、擋板的接觸算;
// 離開擋板後閥門被水往外推,加速擺開到外緣碰到圓筒為止(不是一下子張開)。
// 偏離插圖:擋板迎著閥門的那一端做成一段長斜面(約 50°,原圖只畫一小段凸出);閥門拖在鉸點後面,
// 斜面短的話閥根一碰到就整片瞬間被壓下,實物做不出來。
import { TAU, deg, clamp, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine, arcPoints, polygon } from "./shapes.js";

export const BORE = 1.6;
export const DRUM = 0.95;
export const VALVE = 0.85;
export const ABUT = [deg(-82), deg(-8)]; // 擋板所佔的角度
const INLET = deg(-115);
const OUTLET = deg(35);

/** 閥門鉸在轉鼓上角度 phi 處 → 張開的程度(0 闔上、1 貼著圓筒) */
export const opening = (phi) => clamp((CLOSED_REL - valveRelActual(phi)) / (CLOSED_REL - OPEN_REL), 0, 1);
// 張開的閥門相對鉸點方向的角度:外端剛好碰到圓筒(落後鉸點 delta)。只與幾何有關,先算好,
// 閥門的世界角才能寫成 phi 加一個固定的偏角——不能用 atan2 繞回的角度去跟 phi + 130° 內插,
// 轉鼓多轉幾圈後兩者差了好幾個 2π,閥門闔上、張開時會像螺旋槳一樣多轉好幾圈。
// (外緣的中心線離內壁半個閥門厚)
const OPEN_REL = (() => {
  const R = BORE - 0.03;
  const delta = Math.acos((R * R + DRUM * DRUM - VALVE * VALVE) / (2 * R * DRUM));
  const hinge = polar(DRUM, 0);
  const tip = polar(R, delta);
  return Math.atan2(tip[1] - hinge[1], tip[0] - hinge[0]);
})();
const CLOSED_REL = deg(130); // 闔上時往後收進轉鼓上的凹槽

// 擋板:迎著閥門的那一端(右上,ABUT[1])是一段長斜面——閥門拖在鉸點後面,斜面要從閥根往閥尖慢慢把它壓平
// (推斷:斜面若短,閥根一碰到就整片瞬間被壓下);離開的那一端(ABUT[0])是短斜面。
export const RAMP_IN = deg(50);
const RAMP_OUT = deg(6);
const HALF = 0.03; // 閥門厚度的一半
const INNER = DRUM + 0.07; // 擋板內面離軸心:讓出閥門鉸銷的空隙
/** 角度 a 處擋板內面(或圓筒內壁)離軸心多遠;擋板兩端是斜面 */
function surfaceAt(a0) {
  const a = Math.atan2(Math.sin(a0), Math.cos(a0));
  if (a <= ABUT[0] || a >= ABUT[1]) return BORE;
  const t = Math.min((a - ABUT[0]) / RAMP_OUT, (ABUT[1] - a) / RAMP_IN, 1);
  return BORE + (INNER - BORE) * t;
}
/** 角度 a 處閥門的中心線最多能到多遠 */
export const reachAt = (a) => surfaceAt(a) - HALF;
// 擋板的外形就是這條內面(畫的與接觸算的是同一條輪廓)
const abutment = shape([
  ...arcPoints(BORE + 0.01, ABUT[0], ABUT[1]),
  ...Array.from({ length: 75 }, (_, i) => {
    const a = ABUT[1] - ((ABUT[1] - ABUT[0]) * i) / 74;
    return polar(surfaceAt(a), a).slice(0, 2);
  }),
]);
const SAMPLES = Array.from({ length: 10 }, (_, i) => 0.05 + ((VALVE - 0.05) * i) / 9);

/**
 * 閥門相對鉸點方向的角度(鉸在轉鼓上角度 phi 處),由接觸算:閥門被水往外推開,張到外緣碰到圓筒內壁為止;
 * 轉到擋板時,閥門上任何一點都不能超出擋板的內面,於是被擋板的斜面推回去、貼著轉鼓通過,過了擋板再張開。
 * 從張開往闔上找第一個不超出的角度。
 */
export function valveRel(phi) {
  const [hx, hy] = polar(DRUM, phi);
  const fits = (rel) => {
    const [dx, dy] = [Math.cos(phi + rel), Math.sin(phi + rel)];
    return SAMPLES.every((s) => Math.hypot(hx + s * dx, hy + s * dy) <= reachAt(Math.atan2(hy + s * dy, hx + s * dx)));
  };
  // 越闔上,閥門上每一點離軸心越近:可行的角度是一段連續的區間,二分找它的起點
  let [lo, hi] = [OPEN_REL - deg(5), CLOSED_REL];
  if (fits(lo)) return lo;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}
const RELEASE = deg(40); // 閥門離開擋板後,轉鼓再轉這麼多,閥門才從闔上擺到張開

/**
 * 閥門實際的相對角:離開擋板後,閥門被水往外推,加速擺開、外緣碰到圓筒內壁為止,不會一下子張開。
 * 轉鼓順時針轉(phi 遞減),所以「稍早」是 phi + d;閥門最快只能照「從稍早的位置加速擺開」那樣張開。
 */
export function valveRelActual(phi) {
  let rel = contactRel(phi);
  for (let k = 1; k <= 20; k++) {
    const d = (RELEASE * k) / 20;
    rel = Math.max(rel, contactRel(phi + d) - (CLOSED_REL - OPEN_REL) * (d / RELEASE) ** 2);
  }
  return rel;
}
// valveRel 只與幾何有關:第一次用到時算好一圈的表(每 1°),之後內插
let table = null;
function contactRel(phi) {
  const N = 360;
  table ??= Array.from({ length: N }, (_, i) => valveRel((i * TAU) / N));
  const u = ((((phi / TAU) * N) % N) + N) % N;
  const i = Math.floor(u);
  return table[i] + (table[(i + 1) % N] - table[i]) * (u - i);
}
/** 閥門的世界角 */
export const valveAngle = (phi) => phi + valveRelActual(phi);

export default {
  figure: 455,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.15), [circle(BORE).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.15)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "plate", shape: abutment, thickness: 0.6 },
        // 下方的進水管、右上的出水管
        { kind: "plate", shape: shape(thickLine([polar(BORE, INLET - deg(8)), [polar(BORE, INLET - deg(8))[0], -2.6]], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, INLET + deg(12)), [polar(BORE, INLET + deg(12))[0], -2.6]], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, OUTLET + deg(9)), polar(BORE + 0.9, OUTLET + deg(9))], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, OUTLET - deg(9)), polar(BORE + 0.9, OUTLET - deg(9))], 0.08)), thickness: 0.5 },
      ],
    },
    {
      id: "drum",
      kind: "group",
      spin: DRUM - 0.15,
      pieces: [
        { kind: "plate", shape: shape(polygon(8, DRUM / Math.cos(Math.PI / 8), Math.PI / 8), [circle(DRUM - 0.12).reverse()]), thickness: 0.56, mark: [0, DRUM - 0.06], markSize: 0.05 },
        { kind: "plate", shape: shape(rect(2 * DRUM - 0.2, 0.08)), thickness: 0.3 },
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
    ...[0, 1].map((k) => ({ id: `valve${k}`, kind: "plate", shape: shape(rect(VALVE, 0.06, VALVE / 2, 0)), thickness: 0.54, arrow: false, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.6 }] })),
  ],
  // 動力重演:閥門鉸在轉鼓上,水壓以彈簧代替(把閥門往張開的方向推);擋板的斜面把它壓下、離開後再張開
  replay: {
    free: { valve0: { on: "drum", spring: -1, gravity: false }, valve1: { on: "drum", spring: -1, gravity: false } },
    expect: [
      { at: deg(-40), part: "valve1", label: "鉸點進到擋板的長斜面底下,閥門被壓下一部分" },
      { at: deg(-70), part: "valve1", label: "在擋板的平面段,閥門被壓平貼著轉鼓", quote: "當閥門抵達該點時會將閥門關閉" },
      { at: deg(-160), part: "valve1", label: "過了擋板,閥門再張開、外緣貼著圓筒" },
      { at: deg(-250), part: "valve0", label: "另一片閥門轉到擋板時同樣被壓平" },
      { part: "valve0", label: "轉完一圈,兩片閥門都張開" },
    ],
  },
  driver: { part: "drum", type: "rotation", speed: -0.5, initial: deg(10) },
  targets: ["valve0", "valve1"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const parts = { drum: { angle: theta } };
    for (const k of [0, 1]) {
      const phi = theta + Math.PI + k * Math.PI; // 兩片閥門鉸在轉鼓的左右兩端
      parts[`valve${k}`] = { position: polar(DRUM, phi, 0), angle: valveAngle(phi) };
    }
    const travel = -theta * 1.2;
    // 水:從下方的進水口進來,沿左側與上方被閥門推到右上的出水口
    const mid = (BORE + DRUM) / 2;
    const path = [[polar(BORE, INLET)[0] + 0.05, -2.5, 0.2], polar(mid, INLET, 0.2), ...arcPoints(mid, INLET, OUTLET - TAU).map(([x, y]) => [x, y, 0.2]), polar(BORE + 0.85, OUTLET, 0.2)];
    return {
      parts,
      flows: [{ fluid: "water", points: stream(path, travel, { spacing: 0.2 }) }],
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["drum", "valve1"], reason: "接合處的簡化畫法:滑片插在鼓的槽裡,槽沒有畫出來,重疊 0.15" },
    { check: "interference", parts: ["drum", "valve0"], reason: "接合處的簡化畫法:滑片插在鼓的槽裡,槽沒有畫出來,重疊 0.13" },
  ],
};
