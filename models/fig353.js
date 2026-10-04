// 第 353 種:第 72 種傾動(跳動)錘的變形。錘柄是第一類槓桿:支點在錘柄中段的軸套,錘頭在左端、
// 右端的尾巴伸到星形推板輪旁;推板輪(原圖箭頭)每轉過一片推板,就把錘柄尾端往下壓,錘頭隨之抬起,
// 推板一滑脫,錘頭就落回砧上(第 74 種則是第三類槓桿)。主動件是推板輪。
// 推斷:推板數(依原圖六片)、抬起的角度;推板滑脫後錘頭瞬間落下(示意)。
import { TAU, deg, polar } from "./kit.js";
import { liftAndDrop, cycleOf } from "./jumps.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

const WHEEL = [2.15, 0.05, 0];
const N = 6;
const PIVOT = [0.6, 0.0, 0]; // 錘柄的支點
const LIFT = deg(14);
const PHASE = { liftFrom: 0.1, liftTo: 0.72, dropTo: 0.78 };

/** 推板輪轉 b(順時針為正)→ 錘柄抬起的角度(錘頭往上為正) */
export function hammer(b) {
  const { u } = cycleOf(b, TAU / N);
  return LIFT * liftAndDrop(u, PHASE).height;
}

const star = shape(
  Array.from({ length: 2 * N }, (_, i) => polar(i % 2 ? 0.42 : 0.85, (i * Math.PI) / N).slice(0, 2)),
  [circle(0.12).reverse()],
);

export default {
  figure: 353,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推板輪的支架與砧
        { kind: "plate", shape: shape([[WHEEL[0] - 0.9, -2.4], [WHEEL[0] + 0.9, -2.4], [WHEEL[0] + 0.15, WHEEL[1]], [WHEEL[0] - 0.15, WHEEL[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "box", size: [2.3, 0.2, 0.6], at: [WHEEL[0], -2.45, -0.2] },
        { kind: "plate", shape: shape([[-3.2, -2.45], [-1.6, -2.45], [-1.75, -1.6], [-1.6, -1.45], [-3.2, -1.45], [-3.05, -1.6]]), thickness: 0.8 },
        { kind: "box", size: [0.35, 1.4, 0.4], at: [PIVOT[0], -0.75, -0.42] }, // 支柱在錘柄的後面
      ],
    },
    { id: "wheel", kind: "plate", center: WHEEL, shape: star, thickness: 0.2, hub: 0.25, mark: [0.6, 0], markSize: 0.07, spin: 0.85 },
    {
      id: "hammer",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.6, 0.35], [1.15, -0.05]], 0.42)), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.55, 0.65, 0, 0), [circle(0.12).reverse()]), thickness: 0.4 },
        // 錘頭
        { kind: "plate", shape: shape([[-3.35, 0.0], [-2.6, -0.15], [-2.45, 0.85], [-3.1, 1.05], [-3.4, 0.75]]), thickness: 0.6 },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation", speed: -0.8 }, // 原圖箭頭:順時針
  target: "hammer", // 被抬起落下的錘
  view: { direction: [0.03, 0.05, 1] },
  pose(b) {
    return { parts: { wheel: { angle: b }, hammer: { angle: -hammer(-b) } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "hammer"], reason: "未修:推板輪壓下錘柄尾端的過程依時序演出,推板與錘柄重疊 0.25。照原圖的配置(尾端在輪的左側)與原圖箭頭(順時針),推板在這一側是往上走的,壓不下尾端——原文、箭頭與配置三者對不上,要改成由接觸算得先決定以哪一個為準(列入待確認清單)" },
  ],
};
