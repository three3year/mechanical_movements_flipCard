// 第 406 種:已知底邊、高度、焦點與準線,以機械方法畫拋物線。把直尺放好,讓它的邊與準線重合;曲尺(丁字尺)的尺座靠著直尺滑動,
// 尺葉與拋物線的軸平行;繩子一端套在焦點的銷上,另一端繫在尺葉的末端,繩長等於尺葉長;鉛筆把繩繃緊、貼著尺葉,
// 曲尺沿準線滑動時鉛筆畫出拋物線(鉛筆到焦點與到準線的距離始終相等)。主動件是曲尺;軌跡由 pose 回傳。
// 2026-10-20(model-audit-fixes-4,照原圖與維護者的決定):直尺與曲尺都平放在紙上、同一層,尺座的上緣真的靠著直尺的下緣;
// 分兩個狀態:「前半條」尺葉本體在貼鉛筆那條邊的左側、曲尺在軸的左邊畫左半(原圖畫的這一半);「後半條」照第 405 種把曲尺翻面
// (以尺葉的邊為軸轉 180°,尺座還是靠著直尺),本體在右側、畫右半——本體始終在繩的另一側,繩不橫過尺葉。
// 主動量是曲尺離軸的距離,從尺葉的邊剛碰到焦點的銷起算(由接觸算)。鉛筆、繩的深度安排見 pencil-thread.js。
import { clamp, quatAxisAngle, Y } from "./kit.js";
import { shape, rect, arcPoints } from "./shapes.js";
import { PAPER_TOP, RULER_T, RULER_Z, PIN_R, paperPin, pencilAndThread, pencilPart } from "./pencil-thread.js";

export const DIRECTRIX = 2.0; // 準線(直尺下緣)的高度
export const FOCUS = [0, 0.6, 0];
export const BLADE = 4.2; // 尺葉長(從準線往下到繫繩的末端)
const V0 = PIN_R + 0.002; // 尺葉的邊剛碰到焦點的銷
export const RANGE = [V0, 2.4]; // 曲尺離軸的距離
const SIDE = (state) => (state === "second" ? 1 : -1); // 前半條在軸的左邊、後半條在右邊

/** 曲尺離軸 v(狀態 state)→ 繩的彎曲處(鉛筆貼尺葉邊的點):到焦點的距離 = 到準線的距離 */
export function bight(v0, state = "first") {
  const x = SIDE(state) * clamp(v0, 0, RANGE[1]);
  const y = (DIRECTRIX * DIRECTRIX - FOCUS[1] * FOCUS[1] - (x - FOCUS[0]) ** 2) / (2 * (DIRECTRIX - FOCUS[1]));
  return [x, y];
}

// 曲尺(局部,前半條的樣子):尺葉的邊是局部 x = 0、本體在 −x 側;尺座靠在直尺下緣、往左伸、左端圓頭
const STOCK_H = 0.3;
const GAP = 0.003; // 尺座與直尺的貼合誤差
const stockShape = () => shape([[0, DIRECTRIX - GAP], [0, DIRECTRIX - STOCK_H], [-0.75, DIRECTRIX - STOCK_H], ...arcPoints(STOCK_H / 2 - GAP / 2, -Math.PI / 2, -3 * Math.PI / 2, -0.75, DIRECTRIX - STOCK_H / 2 - GAP / 2).slice(1)].reverse());

/** 鉛筆尖從離軸 v0 到 v1 畫過的線(狀態 state) */
function traced(v0, v1, state) {
  const n = Math.max(2, Math.round((v1 - v0) / 0.05));
  return Array.from({ length: n + 1 }, (_, i) => {
    const w = v0 + ((v1 - v0) * i) / n;
    const P = bight(w, state);
    return pencilAndThread({ bight: P, e: [0, -1], end: [P[0], DIRECTRIX - BLADE], pin: FOCUS }).tip;
  });
}

export default {
  figure: 406,
  parts: [
    { id: "paper", kind: "box", center: [0, -0.2, PAPER_TOP - 0.02], size: [7.2, 5.8, 0.04] },
    // 直尺:下緣與準線重合,平放在紙上
    { id: "straightedge", kind: "plate", shape: shape(rect(7.0, 0.45, 0, DIRECTRIX + 0.225)), thickness: 0.1, center: [0, 0, PAPER_TOP + 0.05] },
    { id: "pin", kind: "group", pieces: [paperPin(FOCUS)] },
    {
      id: "square",
      kind: "group",
      arrow: false,
      posed: true,
      pieces: [
        // 曲尺:靠在直尺下緣的尺座,與往下的尺葉(尺葉的右緣是鉛筆貼的邊)
        { kind: "plate", shape: stockShape(), thickness: RULER_T, stock: true },
        { kind: "plate", shape: shape(rect(0.3, BLADE - STOCK_H, -0.15, DIRECTRIX - STOCK_H - (BLADE - STOCK_H) / 2)), thickness: RULER_T },
      ],
    },
    { id: "string", kind: "rope", radius: 0.012 },
    pencilPart(),
    { id: "trace", kind: "trace" },
    { id: "done", kind: "trace" },
  ],
  driver: { part: "square", type: "translation", direction: [1, 0, 0], range: RANGE, initial: V0 },
  target: "pencil", // 畫出拋物線的鉛筆
  states: {
    options: [
      { id: "first", label: "前半條(尺葉在左)" },
      { id: "second", label: "後半條(曲尺翻面,尺葉在右)" },
    ],
    initial: "first",
  },
  view: { direction: [0.03, 0.05, 1] },
  pose(v0, state = "first") {
    const v = clamp(v0, ...RANGE);
    const P = bight(v, state);
    const { pencil, thread } = pencilAndThread({ bight: P, e: [0, -1], end: [P[0], DIRECTRIX - BLADE], pin: FOCUS });
    // 後半條:以尺葉的邊(局部 y 軸)為軸翻 180°,本體換到右側
    const rotation = state === "second" ? quatAxisAngle(Y, Math.PI) : [0, 0, 0, 1];
    return {
      parts: { square: { position: [P[0], 0, RULER_Z], rotation }, pencil: { position: pencil } },
      paths: {
        string: { points: thread, closed: false, phase: 0 }, // 從尺葉末端沿尺葉的邊到鉛筆、繞過鉛筆、套在焦點的銷上
        trace: { points: traced(V0, v, state), closed: false },
        done: { points: traced(V0, RANGE[1], "first"), closed: false, visible: state === "second" }, // 後半條時,前半條已經畫好
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["paper", "pin"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.04" },
  ],
};
