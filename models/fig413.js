// 第 413 種:J. W. Howlett 的專利可調式摩擦傳動機構,是第 45 種的改良。上方的輪 A(原圖畫成剖面)是一片 V 形邊緣的橡膠碟,
// 夾在兩片金屬板之間;旋緊固定各部件的螺帽 B,橡膠碟被迫徑向擴張,兩輪之間便有更大的牽引力。
// 主動件是下方的 V 形溝輪(左邊的手柄);狀態按鈕切換螺帽 B「放鬆」與「旋緊」。
// 橡膠碟的 V 角和溝一樣(第 45 種的 V 形摩擦傳動靠兩側斜面楔緊):放鬆時兩側斜面輕貼溝面(間隙 0)、尖端離溝底留空,
// 帶動時打滑(以一半的轉速表示);旋緊後兩片金屬板夾近、橡膠碟徑向脹大,斜面壓進溝面 0.03(畫的是未壓縮的外形,
// 重疊量就是橡膠的壓縮量,在實體驗證的貼合誤差以內)、尖端仍不頂溝底,楔進溝裡不打滑。A 以整個輪畫出(剖面在轉動時沒有意義)。
// 推斷:機架(兩根立柱托著上下兩根軸)、下輪的軸與手柄、螺帽退出的距離;原圖都沒畫。
import { X, dist } from "./kit.js";

const LOWER = { center: [0, -1.0, 0], pitch: 0.86 };
const A_CENTER = [0, 0.66, 0];
export const PITCH_A = 0.66; // A 與溝面接觸處的半徑(旋緊時)
export const SLIP = { loose: 0.5, tight: 1 }; // A 實際轉速 / 不打滑時的轉速
const SQUEEZE = { loose: 0.2, tight: 0.12 }; // 兩片金屬板離中面的距離
const PRESS = { loose: 0, tight: 0.03 }; // 斜面壓進溝面的深度(橡膠的壓縮量)
const BACK_OFF = { loose: 0.14, tight: 0 }; // 螺帽 B 退離金屬板的距離

// 下輪:中間一道 V 形溝(溝底半徑 0.72,兩側斜面每沿軸 0.26 升到 1.0),孔和軸同徑
const GROOVE = { bottom: 0.72, slope: 0.28 / 0.26 };
const AXLE = 0.1;
const lowerProfile = [[AXLE, -0.32], [1.0, -0.32], [1.0, -0.26], [GROOVE.bottom, 0], [1.0, 0.26], [1.0, 0.32], [AXLE, 0.32]];
// 橡膠碟的剖面(半徑、沿軸):V 形邊緣,斜率和溝一樣;斜面的虛擬頂點半徑 = 中心距 − 溝底半徑(+ 壓進的量),
// 尖端削平(離虛擬頂點 0.04),所以斜面貼著溝面時尖端離溝底還有空
const APEX = dist(LOWER.center, A_CENTER) - GROOVE.bottom;
const TIP_FLAT = 0.04;
export function rubberProfile(state) {
  const apex = APEX + PRESS[state];
  const half = SQUEEZE[state];
  const flat = TIP_FLAT / GROOVE.slope;
  return [[0.12, -half], [apex - GROOVE.slope * half, -half], [apex - TIP_FLAT, -flat], [apex - TIP_FLAT, flat], [apex - GROOVE.slope * half, half], [0.12, half]];
}

/** 下輪轉 theta → A 的轉角(反向;放鬆時打滑) */
export const turnA = (theta, state = "tight") => (-theta * LOWER.pitch * SLIP[state]) / PITCH_A;

const plate = (id) => ({ id, kind: "lathe", axis: X, center: A_CENTER, profile: [[0.1, -0.03], [0.52, -0.03], [0.52, 0.03], [0.1, 0.03]], arrow: false });

export default {
  figure: 413,
  parts: [
    {
      id: "lower",
      kind: "group",
      axis: X,
      center: LOWER.center,
      mark: true,
      spin: 1.0,
      pieces: [
        { kind: "lathe", profile: lowerProfile },
        { kind: "cylinder", radius: AXLE, length: 2.6, at: [0, 0, -0.2] },
        // 手柄(左)
        { kind: "box", size: [0.12, 0.7, 0.1], at: [0, -0.3, -1.45] },
        { kind: "cylinder", radius: 0.07, length: 0.4, at: [0, -0.6, -1.65], accent: true },
        // 右邊的軸頸
        { kind: "cylinder", radius: 0.16, length: 0.2, at: [0, 0, 0.5] },
      ],
    },
    // 機架(推斷;原圖沒有畫):兩根立柱托著上下兩根軸
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 3.0, 0.4], at: [-0.62, -0.56, 0] },
        { kind: "box", size: [0.12, 3.0, 0.4], at: [0.78, -0.56, 0] },
        { kind: "box", size: [1.9, 0.12, 0.7], at: [0.08, -2.12, 0] },
      ],
    },
    { id: "rubberLoose", kind: "lathe", axis: X, center: A_CENTER, profile: rubberProfile("loose"), mark: true, spin: 0.85, label: "A", labelOffset: [0, 0.75, 0.3] },
    { id: "rubberTight", kind: "lathe", axis: X, center: A_CENTER, profile: rubberProfile("tight"), mark: true, spin: 0.95, label: "A", labelOffset: [0, 0.75, 0.3] },
    plate("plateL"),
    plate("plateR"),
    // 軸穿過兩片金屬板、橡膠碟與兩根立柱
    { id: "shaftA", kind: "cylinder", axis: X, center: A_CENTER, radius: 0.09, length: 1.9, arrow: false },
    // 螺帽 B:旋緊時頂著右邊的金屬板,放鬆時退出一段
    { id: "nut", kind: "cylinder", axis: X, radius: 0.17, length: 0.14, accent: true, arrow: false, label: "B", labelOffset: [0, 0.32, 0.2] },
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
        shaftA: { position: [A_CENTER[0] - 0.1, A_CENTER[1], 0], angle: a },
        nut: { position: [A_CENTER[0] + s + 0.13 + BACK_OFF[state], A_CENTER[1], 0], angle: a },
      },
      readouts: [{ label: "牽引力", value: state === "tight" ? "大(不打滑)" : "小(打滑)" }],
    };
  },
};
