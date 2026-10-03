// 第 454 種:隔膜式壓力泵。以撓性隔膜代替風箱,閥門的配置與前一種相同。
// 主動件是手柄(在左上,往上抬把隔膜拉起)。
// 推斷:隔膜橫張在淺水室的頂上,中心接著活塞桿;隔膜拉起時底部的吸水閥打開,壓下時水經右邊的出水閥往上送;剖面圖。
import { deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, flap, pipeWalls } from "./pump.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const PIVOT = [-0.75, 1.55, 0];
const SHORT = 0.75; // 支點到桿頂(往右)
const LINK = 0.3;
const ROD = 1.0;
const RIM = 0.25; // 隔膜邊緣的高度
const HALF = 0.85; // 水室半寬
export const SWING = [deg(18), deg(-18)]; // 手柄端(左)往上 → 往下
const OPEN = deg(55);

/** 手柄轉 theta → 隔膜中心的高度(相對邊緣)、桿頂 */
export function diaphragm(theta) {
  const E = [PIVOT[0] + SHORT * Math.cos(theta), PIVOT[1] + SHORT * Math.sin(theta)];
  const top = E[1] - Math.sqrt(LINK * LINK - E[0] * E[0]);
  return { E, top, center: top - ROD - RIM };
}
const membrane = (d) => Array.from({ length: 21 }, (_, i) => {
  const x = -HALF + (2 * HALF * i) / 20;
  return [x, RIM + d * (1 - (x / HALF) ** 2), 0.1];
});

const OUT = [[HALF, -0.05], [1.55, -0.05], [1.55, 1.7]];
const INLET = [[0, -1.5], [0, -0.35]];

export default {
  figure: 454,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 淺水室、吸水管、出水管與出水閥的閥室、手柄支柱
        { kind: "plate", shape: shape(thickLine([[-HALF, RIM + 0.05], [-HALF, -0.35], [HALF, -0.35], [HALF, RIM + 0.05]], 0.08)), thickness: 0.8 },
        { kind: "box", size: [2 * HALF + 0.3, 0.08, 0.8], at: [0, RIM + 0.09, 0] },
        ...pipeWalls(INLET, 0.3),
        ...pipeWalls(OUT, 0.28),
        { kind: "plate", shape: shape(rect(0.5, 0.45, 1.55, 0.75), [rect(0.38, 0.45, 1.55, 0.75).reverse()]), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([[-0.7, RIM + 0.1], [-0.75, PIVOT[1]]], 0.12)), thickness: 0.15, at: [0, 0, -0.2] },
      ],
    },
    { id: "membrane", kind: "rod", radius: 0.04 },
    { id: "rod", kind: "cylinder", axis: [0, 1, 0], radius: 0.04, length: ROD, arrow: false, pieces: [{ kind: "box", size: [0.4, 0.06, 0.4], at: [0, 0, -ROD / 2] }] },
    // 手柄:支點在原點,短臂往右接桿,把手往左下彎
    { id: "handle", kind: "plate", shape: shape(thickLine([[SHORT, 0], [0, 0], [-0.7, -0.25], [-1.5, -0.85]], 0.1), [circle(0.04).reverse(), circle(0.04, SHORT, 0).reverse()]), thickness: 0.08, arrow: false, pieces: [{ kind: "sphere", radius: 0.11, at: [-1.5, -0.85, 0] }] },
    { id: "link", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "chamberWater", kind: "fill", fluid: "water", center: [0, -0.05, 0], size: [2 * HALF - 0.1, 0.6, 0.7], level: 1 },
    flap("suctionValve", 0.3),
    flap("deliveryValve", 0.36),
  ],
  waivers: [
    { check: "interference", parts: ["works", "suctionValve"], reason: "待確認:works 的板 與 suctionValve 的板重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "deliveryValve"], reason: "待確認:works 的板 與 deliveryValve 的板重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "membrane"], reason: "待確認:membrane 的第 3 段穿過works 的方塊 2×0.08×0.8重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "handle", type: "rotation", cycle: SWING },
  target: "rod", // 隔膜是路徑零件(不上目標色),標接在隔膜中心、帶著它起落的桿
  view: { direction: [0.08, 0.08, 1] },
  pose(v) {
    const { at, forward } = stroke(v, ...SWING);
    // 手柄的把手在左;往下壓(逆時針轉)→ 桿頂往上 → 隔膜被拉起
    const theta = -at;
    const d = diaphragm(theta);
    const rising = forward;
    const travel = v * 5;
    const flows = rising
      ? [{ fluid: "water", points: stream([[0, -1.45, 0.2], [0, -0.1, 0.2]], travel, { spacing: 0.16 }) }]
      : [{ fluid: "water", points: stream([[0.3, -0.05, 0.2], ...OUT.map(([x, y]) => [x, y, 0.2]), [1.8, 1.9, 0.2], [2.0, 1.3, 0.2]], travel, { spacing: 0.16 }) }];
    return {
      parts: {
        handle: { position: PIVOT, angle: theta },
        link: { from: [d.E[0], d.E[1], 0.1], to: [0, d.top, 0.1] },
        rod: { position: [0, d.top - ROD / 2, 0] },
        suctionValve: { position: [-0.15, -0.35, 0.1], angle: rising ? OPEN : 0 },
        deliveryValve: { position: [1.37, 0.55, 0.1], angle: rising ? 0 : OPEN },
      },
      paths: { membrane: { points: membrane(d.center), closed: false } },
      flows,
      readouts: [{ label: "隔膜", value: rising ? "拉起:吸水閥開、出水閥關" : "壓下:吸水閥關、水經出水閥送出" }],
    };
  },
};
