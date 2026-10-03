// 第 292 種:凸柱式擒縱(大型時鐘)。大輪的輪緣上交替地在前面與後面立著凸柱;錨形件繞 F 擺動,
// 一個叉瓦(A)在輪的前方作動、另一個(B)在後方作動,凸柱交替地抵在前、後叉瓦上。
// 叉瓦的曲面是以 F 為圓心的圓弧,所以凸柱抵住叉瓦時輪完全靜止(靜擊式)。輪依原圖箭頭順時針轉,
// 擺每擺一次放走一根凸柱。主動件是錨形件(擺)。
// 推斷:凸柱的數目與間距;擺幅。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

const WHEEL = { center: [-2.6, -3.6, 0], radius: 3.9 };
export const STUDS = 60; // 一圈的凸柱數(前、後交替)
export const STEP = TAU / STUDS;
export const SWING = deg(4);
const F = [0.35, 2.35, 0];

/** 錨形件累計擺動 v → 大輪轉角(順時針為負;凸柱抵住叉瓦時不動) */
export const wheelAngle = (v) => -escapeStep(v, -SWING, SWING, STEP, 0.55);

const studs = Array.from({ length: STUDS }, (_, i) => {
  const a = i * STEP;
  const front = i % 2 === 0;
  return { kind: "cylinder", radius: 0.07, length: 0.22, at: [(WHEEL.radius - 0.2) * Math.cos(a), (WHEEL.radius - 0.2) * Math.sin(a), front ? 0.2 : -0.2], accent: i === 0 };
});

// 錨形件(相對 F):兩支臂往下;前臂末端是叉瓦 A(以 F 為圓心的弧面),後臂末端是叉瓦 B
const arm = (pts) => shape(thickLine([[0, 0], ...pts], 0.14), [circle(0.06).reverse()]);
const palletArc = (r, a0, a1) => shape([...arcPoints(r + 0.1, a0, a1), ...arcPoints(r - 0.1, a1, a0)]);

export default {
  figure: 292,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.radius,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.radius), [circle(WHEEL.radius - 0.45).reverse()]), thickness: 0.18, circles: [WHEEL.radius - 0.08] },
        ...studs,
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.radius - 0.6, 0.18, 0.12], angle: (i * Math.PI) / 6 })),
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: F,
      arrow: false,
      label: "F",
      labelOffset: [0, 0.3, 0.4],
      pieces: [
        // 叉瓦都落在輪緣的凸柱圈上:前叉瓦 A 在 F 下方 3.39、後叉瓦 B 在 3.99 處
        { kind: "plate", shape: arm([[-0.25, -3.3]]), thickness: 0.1, at: [0, 0, 0.32] },
        { kind: "plate", shape: palletArc(3.39, deg(-98), deg(-91)), thickness: 0.2, at: [0, 0, 0.25] },
        { kind: "plate", shape: arm([[1.3, -2.3], [0.3, -3.9]]), thickness: 0.1, at: [0, 0, -0.32] },
        { kind: "plate", shape: palletArc(3.99, deg(-90), deg(-84)), thickness: 0.2, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.32, inner: 0.1, length: 0.8 },
      ],
    },
    { id: "labelA", kind: "group", center: [0.1, -1.1, 0.3], label: "A", labelOffset: [-0.35, -0.2, 0] },
    { id: "labelB", kind: "group", center: [1.65, 0.05, -0.3], label: "B", labelOffset: [0.3, 0, 0.6] },
  ],
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.25, 0.12, 1], fit: ["anchor"] },
  pose(v) {
    return { parts: { anchor: { angle: swing(v, -SWING, SWING) }, wheel: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
