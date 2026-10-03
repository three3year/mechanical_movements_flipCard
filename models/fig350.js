// 第 350 種:橫移(往復)運動。一根槓桿上下各開一道溝槽:上溝槽裡的銷是靜止的(固定在立柱上),
// 下溝槽裡的銷沿水平虛線來回移動;槓桿因此繞上銷擺動並沿它滑動,槓桿中間與桿相連,把橫移運動傳給桿,
// 桿在兩個導件 a、a 內左右往復。主動件是下溝槽裡的銷(沿水平虛線往復)。
// 推斷:槓桿與桿的連接點在槓桿中段(原圖);銷的行程。
import { clamp } from "./kit.js";
import { shape, rect, stadium, thickLine } from "./shapes.js";

const TOP = [0.35, 1.2, 0]; // 固定銷
const LOW_Y = -0.85; // 下銷所在的水平線
const ROD_Y = -0.2; // 桿的高度(槓桿在這裡帶動桿)
export const RANGE = [-1.6, 0.6]; // 下銷的 x

/** 下銷在 x → 槓桿方向、桿的位移(槓桿與桿高度交點的 x) */
export function traverse(x0) {
  const x = clamp(x0, ...RANGE);
  const dx = TOP[0] - x;
  const dy = TOP[1] - LOW_Y;
  const angle = Math.atan2(dy, dx); // 從下銷指向上銷
  const t = (ROD_Y - LOW_Y) / dy;
  return { x, angle, rod: x + dx * t };
}
const REST = traverse(0).rod;

// 槓桿(局部 +x 從下銷沿槓桿往上):兩道溝槽的長孔
const lever = shape(thickLine([[-0.6, 0], [3.4, 0]], 0.5), [
  stadium(0.85, 0.2).outline.map(([x, y]) => [x - 0.2, y]).reverse(),
  stadium(1.0, 0.2).outline.map(([x, y]) => [x + 2.15, y]).reverse(),
]);

export default {
  figure: 350,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.6, 2.2, TOP[0] - 0.2, 0.35)), thickness: 0.3, at: [0, 0, -0.35] },
        { kind: "box", size: [4.2, 0.18, 0.4], at: [-0.2, -0.65, -0.35] },
        { kind: "cylinder", radius: 0.1, length: 0.7, at: TOP },
        // 導件 a、a
        { kind: "box", size: [0.2, 0.45, 0.45], at: [-2.5, ROD_Y, 0] },
        { kind: "box", size: [0.2, 0.45, 0.45], at: [2.3, ROD_Y, 0] },
      ],
    },
    { id: "labelA1", kind: "group", center: [-2.5, ROD_Y, 0], label: "a", labelOffset: [0, 0.45, 0.3] },
    { id: "labelA2", kind: "group", center: [2.3, ROD_Y, 0], label: "a", labelOffset: [0, 0.45, 0.3] },
    { id: "rod", kind: "group", pieces: [{ kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 5.4 }, { kind: "box", size: [0.22, 0.32, 0.22], at: [0, 0, 0.12] }] },
    { id: "lever", kind: "plate", shape: lever, thickness: 0.1, arrow: false },
    { id: "pinLow", kind: "cylinder", radius: 0.09, length: 0.6 },
  ],
  driver: { part: "pinLow", grips: ["lever"], type: "translation", direction: [1, 0, 0], range: RANGE, initial: 0 },
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const t = traverse(x0);
    const rodX = t.rod - REST;
    return {
      parts: {
        lever: { position: [t.x, LOW_Y, 0.3], angle: t.angle },
        pinLow: { position: [t.x, LOW_Y, 0.3] },
        rod: { position: [rodX, ROD_Y, 0.15] },
      },
      readouts: [],
    };
  },
};
