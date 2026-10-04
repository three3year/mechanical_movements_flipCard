// 第 437 種:渦殼式水輪,有放射狀葉片 a,水衝擊葉片帶動輪轉。渦形(蝸殼)外殼 b 以特定方式約束水流,
// 使水作用在輪周的所有葉片上。在底部加裝傾斜的水斗 c、c,水從這些水斗的開口逸出時,又以額外的力推輪。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。原圖是俯視圖,箭頭:順時針。
// 推斷:水從左上的進水道切向流進蝸殼,繞一圈時逐漸送進葉片之間(蝸殼越來越窄),再從中央的斜水斗往下流出。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const WHEEL = 1.5; // 葉片外緣
const HUB = 0.55;
const VANES = 8;
const SPEED = TAU * 1.4;
/** 蝸殼壁的半徑:從頂端(進水處)順時針轉 t 後 */
export const volute = (t) => 2.35 - 0.7 * (t / TAU);

const START = Math.PI / 2;
const wallLine = [
  [-2.7, 2.35],
  [0, 2.35],
  ...Array.from({ length: 73 }, (_, i) => {
    const t = (TAU * i) / 72;
    return polar(volute(t), START - t).slice(0, 2);
  }),
  [-2.7, volute(TAU)],
];
// 水:沿蝸殼順時針流,逐漸流進葉片之間
const SPIRAL = [[-2.6, 2.0, 0.15], ...Array.from({ length: 49 }, (_, i) => {
  const t = (TAU * 0.92 * i) / 48;
  return polar((WHEEL + volute(t)) / 2 - 0.18 * (i / 48), START - t, 0.15);
})];
const INWARD = [0, 1, 2, 3].map((k) => {
  const a = START - (k + 0.5) * (TAU / 4);
  return [polar(WHEEL + 0.25, a, 0.15), polar(HUB + 0.1, a - 0.6, 0.15)];
});

export default {
  figure: 437,
  parts: [
    {
      id: "casing",
      kind: "group",
      label: "b",
      labelOffset: [2.15, -0.2, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine(wallLine, 0.16)), thickness: 0.6 },
        { kind: "plate", shape: shape(rect(5.6, 5.2, 0, 0)), thickness: 0.04, at: [0, 0, -0.35] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL + 0.06), [circle(WHEEL - 0.06).reverse()]), thickness: 0.06, at: [0, 0, -0.27] },
        ...Array.from({ length: VANES }, (_, i) => ({ kind: "box", size: [WHEEL - HUB, 0.08, 0.5], at: polar((WHEEL + HUB) / 2, (i * TAU) / VANES + deg(22.5)), angle: (i * TAU) / VANES + deg(22.5) })),
        { kind: "plate", shape: shape(circle(HUB), [circle(0.14).reverse()]), thickness: 0.5 },
        // 中央的斜水斗 c(以扇形表示,水從開口往下流出)
        ...[0, 1, 2, 3].map((k) => ({ kind: "plate", shape: shape([[0, 0], ...Array.from({ length: 7 }, (_, j) => polar(HUB - 0.04, (k * TAU) / 4 + deg(10) + (deg(50) * j) / 6).slice(0, 2))]), thickness: 0.06, at: [0, 0, 0.27], ...(k === 0 ? { mark: [0.3, 0.2] } : {}) })),
        { kind: "cylinder", radius: 0.14, length: 0.8 },
      ],
    },
    ...[0, 1, 2].map((k) => ({ id: `labelA${k}`, kind: "group", label: "a", labelOffset: [...polar(WHEEL - 0.3, START + deg(45) + (k * TAU) / 3).slice(0, 2), 0.4], pieces: [] })),
    ...[0, 1].map((k) => ({ id: `labelC${k}`, kind: "group", label: "c", labelOffset: [...polar(0.32, deg(-20) - k * deg(70)).slice(0, 2), 0.45], pieces: [] })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: -TAU * progress } },
      flows: [{ fluid: "water", points: [...stream(SPIRAL, travel, { spacing: 0.22 }), ...INWARD.flatMap((p) => stream(p, travel, { spacing: 0.22 }))] }],
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["casing", "wheel"], reason: "接合處的簡化畫法:輪葉在外殼的環形流道裡轉;外殼畫成整塊的板,輪葉與它重疊 0.55" },
  ],
};
