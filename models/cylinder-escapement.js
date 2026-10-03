// 第 294–295 種共用:圓筒式擒縱。擺輪軸下端是一段切掉將近一半的空心圓筒(A、B 為兩側的切口邊緣);
// 擒縱輪的齒是立在細柄上的楔形叉瓦(a、b、c),交替地停靠在圓筒的內側與外側。擺輪每擺一次,
// 一個齒的斜面沿圓筒的斜邊滑過,給擺輪一點衝量,擒縱輪前進半個齒。
// 主動件是擺輪(累計擺動)。第 294 種以立體圖看圓筒,第 295 種從上方看擒縱輪的一段。
// 推斷:齒數與擺幅。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(120);
const R = 2.2; // 擒縱輪半徑(齒尖)
const CYL = { r: 0.24, inner: 0.19, length: 0.7 };
const AT = [0, R - 0.05, 0]; // 圓筒軸心:在輪的齒尖圓上

/** 擺輪累計擺動 v → 擺輪角、擒縱輪轉角(順時針為負) */
export function cylinder(v) {
  return { balance: swing(v, -SWING, SWING), wheel: -escapeStep(v, -SWING, SWING, PITCH / 2, 0.45) };
}

// 齒:從輪緣伸出的細柄,末端是楔形叉瓦(高出輪面,好伸進圓筒)
const tooth = (i) => {
  const a = Math.PI / 2 + i * PITCH;
  return [
    { kind: "box", size: [0.42, 0.06, 0.08], at: [(R - 0.5) * Math.cos(a), (R - 0.5) * Math.sin(a), 0.1], angle: a },
    {
      kind: "plate",
      shape: shape([[0, -0.1], [0.32, -0.05], [0.32, 0.05], [0, 0.1]]),
      thickness: 0.14,
      at: [(R - 0.32) * Math.cos(a), (R - 0.32) * Math.sin(a), 0.17],
      angle: a + Math.PI / 2,
      accent: i === 0,
    },
  ];
};

export function cylinderEscapement(figure, view) {
  return {
    figure,
    parts: [
      {
        id: "wheel",
        kind: "group",
        spin: R - 0.6,
        arrow: false,
        pieces: [
          { kind: "plate", shape: shape(circle(R - 0.68), [circle(R - 0.95).reverse()]), thickness: 0.08 },
          { kind: "box", size: [2 * (R - 0.95), 0.12, 0.06] },
          { kind: "box", size: [0.12, 2 * (R - 0.95), 0.06] },
          { kind: "cylinder", radius: 0.15, length: 0.3 },
          ...Array.from({ length: N }, (_, i) => tooth(i)).flat(),
        ],
      },
      {
        id: "cylinder",
        kind: "group",
        center: AT,
        spin: 0.5,
        label: "A",
        labelOffset: [-0.45, 0.2, 0.5],
        pieces: [
          // 切掉將近一半的空心圓筒,上下兩端接擺輪軸
          { kind: "lathe", profile: [[CYL.inner, -CYL.length / 2], [CYL.r, -CYL.length / 2], [CYL.r, CYL.length / 2], [CYL.inner, CYL.length / 2]], cut: deg(-100), sweep: deg(200), at: [0, 0, 0.17] },
          { kind: "cylinder", radius: CYL.r, length: 0.35, at: [0, 0, 0.7] },
          { kind: "cylinder", radius: CYL.r * 0.9, length: 0.3, at: [0, 0, -0.35] },
          { kind: "cylinder", radius: 0.07, length: 2.2, at: [0, 0, 0.5] },
          { kind: "box", size: [0.28, 0.08, 0.08], at: [0.14, 0, 1.55], accent: true },
        ],
      },
      { id: "labelB", kind: "group", center: AT, label: "B", labelOffset: [0.45, 0.2, 0.5] },
    ],
    driver: { part: "cylinder", type: "rotation", cycle: [-SWING, SWING] },
    view,
    pose(v) {
      const c = cylinder(v);
      return { parts: { cylinder: { angle: c.balance }, wheel: { angle: c.wheel } }, readouts: [] };
    },
  };
}
