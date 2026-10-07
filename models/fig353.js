// 第 353 種:第 72 種傾動(跳動)錘的變形。錘柄是第一類槓桿:支點在錘柄中段的軸套,錘頭在左端、
// 右端的尾巴伸到星形推板輪旁;推板輪每轉過一片推板,就把錘柄尾端往下壓,錘頭隨之抬起,
// 推板一滑脫,錘頭就落回砧上(第 74 種則是第三類槓桿)。主動件是推板輪。
// 轉向以原文為準(維護者決定):第一類槓桿要把尾端往下壓,尾端在輪的左側,所以輪逆時針轉
// (原圖箭頭畫的是順時針,照原圖的配置那一側的推板是往上走的,壓不下尾端)。
// 抬起的角度由推板與錘柄尾端的接觸算,滑脫後錘頭憑自重加速落回砧上。推斷:推板數(依原圖六片)。
import { TAU, deg, polar } from "./kit.js";
import { placeOutline, swingUntilContact, withFall } from "./contact.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

const WHEEL = [2.5, 0.05, 0];
const N = 6;
const PIVOT = [0.6, 0.0, 0]; // 錘柄的支點
const SWEEP = deg(30);
const HANDLE = thickLine([[-2.6, 0.35], [1.15, -0.05]], 0.42); // 錘柄(支點座標):推板壓的是它的右端

const star = shape(
  Array.from({ length: 2 * N }, (_, i) => polar(i % 2 ? 0.42 : 0.85, (i * Math.PI) / N).slice(0, 2)),
  [circle(0.12).reverse()],
);

// 錘頭憑自重落在砧上(抬起角 0);推板壓著尾端時,錘柄靠在推板上的抬起角(由接觸算)
function resting(b) {
  const wheel = placeOutline(star.outline, WHEEL, b);
  return Math.max(0, -swingUntilContact({ pivot: PIVOT, outline: HANDLE, from: -SWEEP, into: 1, sweep: SWEEP }, [wheel]));
}

/** 推板輪轉 b(逆時針為正)→ 錘柄抬起的角度(錘頭往上為正);推板滑脫後加速落回 */
export const hammer = withFall(resting, TAU / N, deg(6));

export default {
  figure: 353,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推板輪的支架與砧(砧面就在錘頭落下的位置:動力重演時錘頭落在砧上停住)
        { kind: "plate", shape: shape([[WHEEL[0] - 0.9, -2.4], [WHEEL[0] + 0.9, -2.4], [WHEEL[0] + 0.15, WHEEL[1]], [WHEEL[0] - 0.15, WHEEL[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "box", size: [3.4, 0.2, 0.6], at: [WHEEL[0] - 0.55, -2.45, -0.2] },
        { kind: "plate", shape: shape([[-3.2, -2.45], [-1.6, -2.45], [-1.75, -0.4], [-1.6, -0.17], [-3.2, -0.17], [-3.05, -0.4]]), thickness: 0.8 },
        // 支柱在錘柄的後面,立在底座上(原本懸在半空);頂上的軸承環套著錘柄的軸
        { kind: "box", size: [0.35, 2.05, 0.4], at: [PIVOT[0], -1.375, -0.42] },
        { kind: "cylinder", radius: 0.3, inner: 0.13, length: 0.3, at: [PIVOT[0], PIVOT[1], -0.42] },
      ],
    },
    { id: "wheel", kind: "plate", center: WHEEL, shape: star, thickness: 0.2, hub: 0.25, mark: [0.6, 0], markSize: 0.07, spin: 0.85 },
    {
      id: "hammer",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(HANDLE), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.55, 0.65, 0, 0), [circle(0.12).reverse()]), thickness: 0.4 },
        { kind: "cylinder", radius: 0.11, length: 0.45, at: [0, 0, -0.38] }, // 錘柄的軸,往後伸進支柱頂的軸承環
        // 錘頭
        { kind: "plate", shape: shape([[-3.35, 0.0], [-2.6, -0.15], [-2.45, 0.85], [-3.1, 1.05], [-3.4, 0.75]]), thickness: 0.6 },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.8 }, // 逆時針:依原文(把尾端往下壓),與原圖箭頭相反
  target: "hammer", // 被抬起落下的錘
  // 動力重演:只推推板輪;錘柄繞支點自由擺動,錘頭靠自重落下
  replay: {
    from: 0,
    to: TAU / N,
    free: { hammer: {} },
    expect: [
      { at: 0.45, part: "hammer", label: "推板把錘柄尾端往下壓,錘頭抬起" },
      { at: 0.95, part: "hammer", label: "推板滑脫後錘頭落回砧上" },
    ],
  },
  view: { direction: [0.03, 0.05, 1] },
  pose(b) {
    return { parts: { wheel: { angle: b }, hammer: { angle: -hammer(b) } }, readouts: [] };
  },
};
