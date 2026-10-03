// 第 234 種:軸桿式擒縱機構(verge escapement)。冠狀輪(齒朝上的鋸齒輪,直立的軸)上方橫著一根心軸 S,
// S 上兩片叉瓦 A 分別伸到輪的兩邊、互成一個角度。使 S 往復擺動時,兩片叉瓦輪流擋住、放開冠狀輪的齒,
// 冠狀輪就間歇地轉動:S 每擺一程,輪轉過半個齒。主動件是心軸 S(往復擺動)。
// 推斷:15 齒、擺幅 ±40°;冠狀輪的轉向(順著齒的斜面)。
import { TAU, deg, X, Y, swing } from "./kit.js";
import { escapeStep, sawCrown } from "./escapement.js";

const N = 15;
const R = 1.6;
const H = 0.4;
const PITCH = TAU / N;
const SWING = deg(40);
const ROD_Y = 0.35 + H + 0.25; // S 的高度(輪面在 y = 0.35)

/** 心軸累計擺動 v:冠狀輪的轉角(繞 +y,順時針從上往下看為負) */
export const wheelAngle = (v) => -escapeStep(v, -SWING, SWING, PITCH / 2);
export const geometry = { N, PITCH, SWING };

const pallet = (side) => ({ kind: "box", size: [0.08, 0.55, 0.32], at: [0.18 * side, -0.28, side * R], angle: deg(35) * side });

export default {
  figure: 234,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      spin: R + 0.1,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.12, length: 0.35, at: [0, 0, 0.175] },
        { kind: "cylinder", radius: R - 0.06, length: 0.04, at: [0, 0, 0.02] },
        ...sawCrown({ teeth: N, radius: R - 0.06, height: H, base: 0.35 }),
        { kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, -1.2], mark: true },
      ],
    },
    {
      id: "verge",
      kind: "group",
      center: [0, ROD_Y, 0],
      axis: X,
      arrow: false,
      label: "S",
      labelOffset: [-2.3, 0.35, 0],
      pieces: [{ kind: "cylinder", radius: 0.07, length: 4.6 }, pallet(1), pallet(-1)],
    },
    { id: "tagA1", kind: "group", center: [-R, ROD_Y - 0.1, 0.35], pieces: [], arrow: false, label: "A" },
    { id: "tagA2", kind: "group", center: [R, ROD_Y - 0.1, 0.35], pieces: [], arrow: false, label: "A" },
  ],
  driver: { part: "verge", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.35, 0.55, 1] },
  pose(v) {
    return { parts: { verge: { angle: swing(v, -SWING, SWING) }, wheel: { angle: wheelAngle(v) } }, readouts: [] };
  },
};

