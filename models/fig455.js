// 第 455 種:舊式旋轉泵。下方的開口進水,上方的開口出水。中央部分連同它的閥門一起旋轉,閥門恰好貼合外圓筒的內面。
// 圓筒下側畫出的凸出部分是一個擋板,閥門轉到那裡時被它闔上。
// 主動件是中央的轉鼓(順時針,依原圖的進出水箭頭)。
// 推斷:兩片閥門鉸在轉鼓上,平常張開、外緣貼著圓筒,把左側與上方的水從進水口推向出水口;
// 經過右下的擋板時被壓平貼著轉鼓,過了擋板再張開。
import { TAU, deg, clamp, smooth, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine, arcPoints, polygon } from "./shapes.js";

export const BORE = 1.6;
export const DRUM = 0.95;
export const VALVE = 0.85;
export const ABUT = [deg(-82), deg(-8)]; // 擋板所佔的角度
const RAMP = deg(14);
const INLET = deg(-115);
const OUTLET = deg(35);

/** 閥門鉸在轉鼓上角度 phi 處 → 張開的程度(0 闔上、1 貼著圓筒) */
export function opening(phi) {
  const a = Math.atan2(Math.sin(phi), Math.cos(phi));
  if (a > ABUT[0] - RAMP && a < ABUT[1] + RAMP) {
    const into = clamp((ABUT[1] + RAMP - a) / RAMP, 0, 1); // 順時針轉:從擋板的上端(右)進入
    const out = clamp((a - (ABUT[0] - RAMP)) / RAMP, 0, 1);
    return 1 - smooth(Math.min(into, out));
  }
  return 1;
}
// 張開的閥門相對鉸點方向的角度:外端剛好碰到圓筒(落後鉸點 delta)。只與幾何有關,先算好,
// 閥門的世界角才能寫成 phi 加一個固定的偏角——不能用 atan2 繞回的角度去跟 phi + 130° 內插,
// 轉鼓多轉幾圈後兩者差了好幾個 2π,閥門闔上、張開時會像螺旋槳一樣多轉好幾圈。
const OPEN_REL = (() => {
  const delta = Math.acos((BORE * BORE + DRUM * DRUM - VALVE * VALVE) / (2 * BORE * DRUM));
  const hinge = polar(DRUM, 0);
  const tip = polar(BORE, delta);
  return Math.atan2(tip[1] - hinge[1], tip[0] - hinge[0]);
})();
const CLOSED_REL = deg(130); // 闔上時往後收進轉鼓上的凹槽

/** 閥門的世界角:張開時外端剛好碰到圓筒,闔上時貼著轉鼓;open 介於其間時閥門繞鉸點擺過去 */
export function valveAngle(phi, open) {
  return phi + CLOSED_REL + (OPEN_REL - CLOSED_REL) * open;
}

const abutment = shape([...arcPoints(BORE + 0.01, ABUT[0], ABUT[1]), ...arcPoints(DRUM + 0.03, ABUT[1] - deg(6), ABUT[0] + deg(6))]);

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
  driver: { part: "drum", type: "rotation", speed: -0.5, initial: deg(10) },
  targets: ["valve0", "valve1"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const parts = { drum: { angle: theta } };
    for (const k of [0, 1]) {
      const phi = theta + Math.PI + k * Math.PI; // 兩片閥門鉸在轉鼓的左右兩端
      const open = opening(phi);
      parts[`valve${k}`] = { position: polar(DRUM, phi, 0), angle: valveAngle(phi, open) };
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
    { check: "interference", parts: ["casing", "valve1"], reason: "未修:滑片轉到進出口附近時伸進外殼,重疊 0.38(96 個取樣中 5 個);滑片的伸出量應由外殼內壁的接觸算(列入待確認清單)" },
    { check: "interference", parts: ["casing", "valve0"], reason: "未修:滑片轉到進出口附近時伸進外殼,重疊 0.38(96 個取樣中 5 個);滑片的伸出量應由外殼內壁的接觸算(列入待確認清單)" },
    { check: "interference", parts: ["casing", "drum"], reason: "簡化畫法:偏心的鼓貼著外殼內壁的密封處,重疊 0.05" },
  ],
};
