// 第 377 種:踏車。長圓筒的周邊排著踏板,人扶著前面的橫桿、踩在踏板上往上走,圓筒被人的重量帶著轉;
// 軸端的大齒輪把動力傳出去(碾穀物、在中國用來抽水灌溉)。主動件是虛擬的「進程」:踏車已轉了幾圈。
// 人留在原地踏步(腿交替擺動),圓筒在他腳下往後轉。
// 推斷:踏板數、人的步伐與圓筒轉速的對應;只畫一個人。
import { X, TAU, deg } from "./kit.js";
import { shape, circle } from "./shapes.js";

const R = 1.35; // 圓筒半徑(踏板外緣)
const LEN = 4.4;
const TREADS = 16;

/** 進程 p → 圓筒轉角、腿的擺動 */
export function treadmill(p) {
  const drum = -TAU * p; // 人往前(+z 方向朝讀者的左上)走,圓筒往回轉
  const step = Math.sin((-drum * R) / ((TAU * R) / TREADS) * Math.PI);
  return { drum, step };
}

const treads = Array.from({ length: TREADS }, (_, i) => {
  const a = (i * TAU) / TREADS;
  return { kind: "box", size: [0.08, 0.32, LEN], at: [(R - 0.12) * Math.cos(a), (R - 0.12) * Math.sin(a), 0], angle: a, accent: i === 0 }; // 一片踏板塗記號色
});
const gearTeeth = Array.from({ length: 16 }, (_, i) => {
  const a = (i * TAU) / 16;
  return { kind: "box", size: [0.4, 0.3, 0.25], at: [1.7 * Math.cos(a), 1.7 * Math.sin(a), 0], angle: a };
});

export default {
  figure: 377,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.0, -1.9], [1.0, -1.9], [0.3, 0.2], [-0.3, 0.2]]), thickness: 0.3, at: [-3.35, 0, 0], axis: X },
        { kind: "plate", shape: shape([[-1.0, -1.9], [1.0, -1.9], [0.3, 0.2], [-0.3, 0.2]]), thickness: 0.3, at: [2.45, 0, 0], axis: X },
        { kind: "box", size: [6.4, 0.15, 1.6], at: [0, -1.95, 0] },
        // 前面的扶手(斜桿與橫桿)
        { kind: "box", size: [0.12, 1.6, 0.12], at: [-1.6, R + 1.0, 0.7] },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [2.0, R + 1.0, 0.7] },
        { kind: "box", size: [3.8, 0.08, 0.08], at: [0.2, R + 1.75, 0.7] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      axis: X,
      spin: R,
      spinOffset: LEN / 2,
      pieces: [
        ...treads,
        { kind: "cylinder", radius: R - 0.3, length: LEN - 0.2 },
        { kind: "cylinder", radius: 0.12, length: LEN + 2.2, at: [0, 0, -0.6] },
        // 軸端的大齒輪
        { kind: "plate", shape: shape(circle(1.55), [circle(0.25).reverse()]), thickness: 0.25, at: [0, 0, -LEN / 2 - 0.6] },
        ...gearTeeth.map((t) => ({ ...t, at: [t.at[0], t.at[1], -LEN / 2 - 0.6] })),
      ],
    },
    // 人:身體與手臂(扶著橫桿),兩條腿另外擺動
    { id: "person", kind: "group", center: [0.6, R + 0.95, 0.25], arrow: false, pieces: [
      { kind: "box", size: [0.35, 0.8, 0.3], at: [0, 0.2, 0] },
      { kind: "sphere", radius: 0.18, at: [0, 0.8, 0] },
      { kind: "box", size: [0.08, 0.08, 0.5], at: [0.2, 0.55, 0.25] },
      { kind: "box", size: [0.08, 0.08, 0.5], at: [-0.2, 0.55, 0.25] },
    ] },
    { id: "legA", kind: "link", width: 0.12, thickness: 0.12 },
    { id: "legB", kind: "link", width: 0.12, thickness: 0.12 },
  ],
  powered: ["drum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.06 },
  target: "drum", // 被人踩著轉的圓筒
  view: { direction: [0.55, 0.35, 1] },
  pose(p) {
    const t = treadmill(p);
    const hip = [0.6, R + 0.75, 0.25];
    const leg = (s) => {
      const sw = deg(20) * t.step * s;
      return { from: [hip[0] + 0.08 * s, hip[1], hip[2]], to: [hip[0] + 0.08 * s, hip[1] - 0.8 * Math.cos(sw), hip[2] + 0.8 * Math.sin(sw)] };
    };
    return { parts: { drum: { angle: t.drum }, legA: leg(1), legB: leg(-1) }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["person", "legB"], reason: "簡化畫法:人形的腿接在身體下緣,腿根伸進身體的方塊 0.08" },
    { check: "interference", parts: ["person", "legA"], reason: "簡化畫法:人形的腿接在身體下緣,腿根伸進身體的方塊 0.08" },
    { check: "interference", parts: ["frame", "drum"], reason: "簡化畫法:鼓輪上的踏塊轉到最低時擦到底板 0.03(96 個取樣中 29 個)" },
  ],
};
