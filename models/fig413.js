// 第 413 種:J. W. Howlett 的專利可調式摩擦齒輪,是第 45 種的改良。上方的輪 A(原圖畫成剖面)是一片 V 形邊緣的橡膠碟,
// 夾在兩片金屬板之間;旋緊固定各部件的螺帽 B,橡膠碟被迫徑向擴張,兩輪之間便有更大的牽引力。
// 主動件是下方的 V 形溝輪(左邊的手柄);狀態按鈕切換螺帽 B「放鬆」與「旋緊」。
// 推斷:放鬆時橡膠碟較小、只輕輕貼著溝面,帶動時打滑(以一半的轉速表示);旋緊後兩片金屬板夾近、橡膠碟脹大,
// 楔進溝裡不打滑。A 以整個輪畫出(剖面在轉動時沒有意義)。
import { X } from "./kit.js";

const LOWER = { center: [0, -1.0, 0], pitch: 0.86 };
const A_CENTER = [0, 0.66, 0];
export const PITCH_A = 0.66; // A 與溝面接觸處的半徑(旋緊時)
export const SLIP = { loose: 0.5, tight: 1 }; // A 實際轉速 / 不打滑時的轉速
const SQUEEZE = { loose: 0.15, tight: 0.11 }; // 兩片金屬板離中面的距離

// 橡膠碟的剖面(半徑、沿軸):V 形邊緣
const rubber = (tip, half) => [[0.12, -half], [tip - 0.22, -half], [tip, 0], [tip - 0.22, half], [0.12, half]];
// 下輪:中間一道 V 形溝
const lowerProfile = [[0.12, -0.32], [1.0, -0.32], [1.0, -0.26], [0.72, 0], [1.0, 0.26], [1.0, 0.32], [0.12, 0.32]];

/** 下輪轉 theta → A 的轉角(反向;放鬆時打滑) */
export const turnA = (theta, state = "tight") => (-theta * LOWER.pitch * SLIP[state]) / PITCH_A;

const plate = (id) => ({ id, kind: "lathe", axis: X, center: A_CENTER, profile: [[0.1, -0.03], [0.52, -0.03], [0.52, 0.03], [0.1, 0.03]], arrow: false });

export default {
  figure: 413,
  parts: [
    {
      id: "lower",
      kind: "lathe",
      axis: X,
      center: LOWER.center,
      profile: lowerProfile,
      mark: true,
      spin: 1.0,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, -0.2] },
        // 手柄(左)
        { kind: "box", size: [0.12, 0.7, 0.1], at: [0, -0.3, -1.45] },
        { kind: "cylinder", radius: 0.07, length: 0.4, at: [0, -0.6, -1.65], accent: true },
        // 右邊的軸頸
        { kind: "cylinder", radius: 0.16, length: 0.2, at: [0, 0, 0.55] },
      ],
    },
    { id: "rubberLoose", kind: "lathe", axis: X, center: A_CENTER, profile: rubber(0.8, SQUEEZE.loose), mark: true, spin: 0.85, arrow: false, label: "A", labelOffset: [0, 0.75, 0.3] },
    { id: "rubberTight", kind: "lathe", axis: X, center: A_CENTER, profile: rubber(0.88, SQUEEZE.tight), mark: true, spin: 0.95, label: "A", labelOffset: [0, 0.75, 0.3] },
    plate("plateL"),
    plate("plateR"),
    {
      id: "shaftA",
      kind: "group",
      axis: X,
      arrow: false,
      label: "B",
      labelOffset: [0, 0.32, 0.2],
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 1.9, at: [0, 0, 0.55] },
        // 螺帽 B
        { kind: "cylinder", radius: 0.17, length: 0.14, at: [0, 0, 0], accent: true },
      ],
    },
  ],
  states: {
    initial: "tight",
    options: [
      { id: "loose", label: "螺帽 B 放鬆" },
      { id: "tight", label: "螺帽 B 旋緊" },
    ],
  },
  driver: { part: "lower", type: "rotation" },
  targets: ["rubberLoose", "rubberTight"], // 兩個狀態各顯示其一的輪 A
  view: { direction: [0.3, 0.15, 1] },
  pose(theta, state = "tight") {
    const a = turnA(theta, state);
    const s = SQUEEZE[state];
    return {
      parts: {
        lower: { angle: theta },
        rubberLoose: { angle: a, visible: state === "loose" },
        rubberTight: { angle: a, visible: state === "tight" },
        plateL: { position: [A_CENTER[0] - s - 0.03, A_CENTER[1], 0], angle: a },
        plateR: { position: [A_CENTER[0] + s + 0.03, A_CENTER[1], 0], angle: a },
        shaftA: { position: [A_CENTER[0] + s + 0.16, A_CENTER[1], 0], angle: a },
      },
      readouts: [{ label: "牽引力", value: state === "tight" ? "大(不打滑)" : "小(打滑)" }],
    };
  },
};
