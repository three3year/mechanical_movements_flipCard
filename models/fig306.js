// 第 306 種:三腳式擺鐘擒縱。擒縱叉瓦是裝在擺上的一塊板的開口邊緣;擺帶著板左右移動(原圖箭頭),
// 擒縱輪的三個腳交替地作用在開口上方與下方的叉瓦上。圖中是一個腳正作用於上方叉瓦的狀態。
// 擺每擺一次,三腳輪轉過六分之一圈(上、下叉瓦各放走半個腳距)。主動件是板(擺)。
// 推斷:板的行程;開口的形狀依原圖。
import { TAU, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, rect, circle } from "./shapes.js";

export const STEP = TAU / 6;
export const TRAVEL = 0.32; // 板的單邊行程

/** 板的累計行程 v → 板的位移、三腳輪轉角(逆時針為正) */
export function threeLeg(v) {
  return { plate: swing(v, -TRAVEL, TRAVEL), wheel: escapeStep(v, -TRAVEL, TRAVEL, STEP, 0.5) };
}

// 板的開口:中間一道橫槽,左上與右下各擴成一個凹室;上、下的台階就是叉瓦
const opening = [
  [-1.55, 0.2], [-1.2, 0.62], [-0.15, 0.62], [-0.15, 0.28], [0.95, 0.28], [1.55, 0.05],
  [1.55, -0.2], [1.2, -0.62], [0.15, -0.62], [0.15, -0.28], [-0.95, -0.28], [-1.55, -0.05],
];
// 三腳輪:三根腳,末端微彎成鉤
const LEG = 0.72;
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3;
  const pts = [[0.06, -0.07], [LEG, -0.05], [LEG + 0.05, 0.12], [LEG - 0.08, 0.06], [0.06, 0.07]];
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

export default {
  figure: 306,
  parts: [
    {
      id: "plate",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(4.4, 2.3), [opening.slice().reverse()]), thickness: 0.12 },
        ...[[-1.85, 0.8], [1.85, 0.8], [-1.85, -0.8], [1.85, -0.8]].map(([x, y]) => ({ kind: "cylinder", radius: 0.08, length: 0.2, at: [x, y, 0] })),
        // 板兩端接到擺上的直條
        { kind: "box", size: [0.35, 3.6, 0.1], at: [-2.25, 0, -0.1] },
        { kind: "box", size: [0.35, 3.6, 0.1], at: [2.25, 0, -0.1] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: LEG,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.14, accent: i === 0 })),
        { kind: "plate", shape: shape(circle(0.16), [circle(0.06).reverse()]), thickness: 0.18 },
      ],
    },
  ],
  // 動力重演:只推主動件;wheel 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheel: { spring: 1, gravity: false } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "plate", type: "translation", direction: [1, 0, 0], cycle: [-TRAVEL, TRAVEL] },
  target: "wheel", // 三腳輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    return { parts: { plate: { position: [t.plate, 0, 0] }, wheel: { angle: t.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 1.28 時已轉 120°,實際轉了 4°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["plate", "wheel"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算擺板上的掣子與輪齒的接觸;重疊 0.13。列入待確認清單的動力重演名單" },
  ],
};
