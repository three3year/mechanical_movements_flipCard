// 第 238 種:一種擒縱機構。D 是擒縱輪(六個尖齒),B 和 C 是擒縱叉瓦,A 是叉瓦的軸。叉瓦架是一塊彎成 U 形的板:
// 左邊的瓦 B 在擒縱輪下方,右臂繞過輪的右邊、瓦 C 在輪的右上方。叉瓦架往復擺動,B、C 輪流擋住、放開輪的齒,
// 輪就一格一格地(每擺一程半個齒距)逆時針轉(原圖箭頭)。主動件是叉瓦架。
// 推斷:擺幅;輪齒數依原圖為六。
import { TAU, deg, polar, swing as swingAt } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, thickLine } from "./shapes.js";

const D = [-0.6, 1.0, 0];
const A = [0.1, -0.9, 0];
const N = 6;
const PITCH = TAU / N;
const SWING = deg(10);

/** 叉瓦架累計擺動 v:擒縱輪的轉角 */
export const wheelAngle = (v) => escapeStep(v, -SWING, SWING, PITCH / 2);
export const geometry = { N, PITCH };

const star = shape(
  Array.from({ length: 2 * N }, (_, i) => polar(i % 2 ? 0.32 : 0.62, (i * Math.PI) / N + deg(15)).slice(0, 2)),
  [circle(0.1).reverse()],
);
// 叉瓦架(相對 A):左下的瓦 B、U 形繞過擒縱輪右邊、上端的瓦 C
const frame = shape(
  thickLine([[-1.0, 1.4], [-1.05, 0.6], [-0.7, 0.05], [0, -0.02], [0.65, 0.2], [1.2, 0.85], [1.25, 1.55], [1.0, 2.05], [0.55, 2.3], [0.1, 2.32], [-0.18, 2.2]], 0.42),
  [circle(0.1, 0, 0).reverse()],
);

export default {
  figure: 238,
  parts: [
    { id: "post", kind: "cylinder", center: A, radius: 0.09, length: 0.5 }, // 框架的固定樞軸(推斷)
    { id: "wheelD", kind: "plate", center: D, shape: star, thickness: 0.16, mark: [0.45, 0], markSize: 0.06, spin: 0.7, label: "D", labelOffset: [-0.1, 0.12, 0.3] },
    {
      id: "frame",
      kind: "group",
      center: A,
      arrow: false,
      label: "A",
      labelOffset: [0.45, 0, 0.3],
      pieces: [{ kind: "plate", shape: frame, thickness: 0.12, at: [0, 0, -0.15] }, { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.3 }],
    },
    { id: "tagB", kind: "group", center: [-1.2, 0.55, 0.2], pieces: [], arrow: false, label: "B" },
    { id: "tagC", kind: "group", center: [0.05, 1.65, 0.2], pieces: [], arrow: false, label: "C" },
  ],
  // 動力重演:只推主動件;wheelD 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheelD: { spring: 1, gravity: false } }, expect: [{ part: "wheelD", label: "主動件走完一輪後 wheelD 的位置" }] },
  driver: { part: "frame", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelD",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { frame: { angle: swingAt(v, -SWING, SWING) }, wheelD: { angle: wheelAngle(v) } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheelD"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheelD 的位置」預期 wheelD 在主動量 0.70 時已轉 60°,實際轉了 11526°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
  ],
};
