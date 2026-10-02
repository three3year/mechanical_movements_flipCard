// 第 166 種:圓盤上的曲柄銷帶動連桿來回往復,但連桿接銷的孔是長形的(溝槽),讓連桿在每一程的盡頭停住一會兒:
// 曲柄銷在長孔裡空走,碰到孔的一端才拉或推連桿。曾用於製磚壓印機:連桿把模具前後拉動,在每一程的盡頭停住,
// 好放入黏土、取出磚坯。連桿右端接著在水平導軌上滑動的模具。主動件是圓盤。
// 模具的位置由「銷離模具的距離必須在長孔的兩端之間」決定,從每一圈的起點逐步推算(仍是主動量的純函式)。
import { TAU, deg, polar, clamp } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = 2.35;
const PIN = 1.05;
const L = 3.6; // 模具到長孔近端的距離
const SLOT = 0.75; // 長孔的長度
const MOLD_Y = PIN * Math.sin(deg(160));
const STEP = deg(2);
const PER = Math.round(TAU / STEP);
const START = deg(160);

const pinAt = (theta) => polar(PIN, START + theta);
// 模具 x 的可行範圍:銷到模具的距離在 [L, L + SLOT] 之間
const bounds = (theta) => {
  const [px, py] = pinAt(theta);
  const dy = py - MOLD_Y;
  return [px + Math.sqrt(L * L - dy * dy), px + Math.sqrt((L + SLOT) ** 2 - dy * dy)];
};
function settle(x, k, theta) {
  const last = Math.floor(theta / STEP + 1e-9);
  for (let j = k * PER + 1; j <= last; j++) x = clamp(x, ...bounds(j * STEP));
  return clamp(x, ...bounds(theta));
}
const X0 = (() => {
  let x = (bounds(0)[0] + bounds(0)[1]) / 2;
  for (let k = 0; k < 3; k++) x = settle(x, 0, TAU - 1e-9);
  return x;
})();

/** 圓盤轉 theta:模具的位置 */
export const moldX = (theta) => settle(X0, Math.floor(theta / TAU + 1e-12), theta);
/** 銷在長孔中的位置(離模具的距離) */
export const pinDistance = (theta) => {
  const [px, py] = pinAt(theta);
  return Math.hypot(moldX(theta) - px, MOLD_Y - py);
};
export const slot = { near: L, far: L + SLOT };

// 連桿(局部 +X 由模具指向銷):從模具到長孔,長孔從 L 到 L + SLOT
const rodShape = shape(
  [...stadium(L + SLOT + 0.2, 0.62).outline.map(([x, y]) => [x * 1, y * (x > L - 0.3 ? 1 : 0.32)])],
  [stadium(SLOT, 0.42).outline.map(([x, y]) => [x + L, y]).reverse(), circle(0.1).reverse()],
);

export default {
  figure: 166,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [circle(0.25).reverse()]), thickness: 0.15, circles: [DISC - 0.12, 0.5] },
        { kind: "cylinder", radius: 0.2, length: 0.5, at: [...polar(PIN, START).slice(0, 2), 0.2], accent: true },
      ],
    },
    { id: "rod", kind: "plate", shape: rodShape, thickness: 0.1, arrow: false },
    { id: "mold", kind: "box", size: [0.7, 0.5, 0.4] },
  ],
  driver: { part: "disc", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const x = moldX(theta);
    const pin = pinAt(theta);
    return {
      parts: {
        disc: { angle: theta },
        rod: { position: [x, MOLD_Y, 0.35], angle: angleOf([x, MOLD_Y, 0], pin) },
        mold: { position: [x + 0.3, MOLD_Y, 0.35] },
      },
      readouts: [],
    };
  },
};
