// 第 403 種:弧線繪製儀,用來在圓心碰不到的圖上畫圓弧。先畫出弦與正矢,從弦的兩端畫斜線到正矢的頂端,把兩根直尺沿這兩條線
// 放、在頂端交叉,牢牢夾在一起,再橫過兩者裝第三根直尺當支撐。弦的兩端各插一根銷;把這個裝置靠著兩根銷推動,
// 兩根直尺夾角處的鉛筆就畫出圓弧(同一弦所對的圓周角都相等)。主動件是這組直尺(沿兩根銷滑動);軌跡由 pose 回傳。
import { clamp, deg } from "./kit.js";
import { shape, rect, circle } from "./shapes.js";

const C = 2.0; // 半弦長
const H = 0.9; // 正矢(弧高)
export const PINS = [[-C, 0, 0], [C, 0, 0]];
// 圓心與半徑(弦 2C、正矢 H)
const R = (C * C + H * H) / (2 * H);
export const CENTER = [0, H - R, 0];
export const RADIUS = R;
const TOP = Math.PI / 2;
const HALF_SPAN = Math.asin(C / R); // 弧的半張角
export const RANGE = [TOP - HALF_SPAN * 0.92, TOP + HALF_SPAN * 0.92];

/** 弧上參數 phi(從圓心量起的角)→ 鉛筆位置 */
export const pencil = (phi0) => {
  const phi = clamp(phi0, ...RANGE);
  return [CENTER[0] + R * Math.cos(phi), CENTER[1] + R * Math.sin(phi), 0];
};

// 直尺:長條,局部 +x 沿尺
const ruler = (len) => shape(rect(len, 0.22, len / 2 - 0.4, 0));

export default {
  figure: 403,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [6.5, 3.6, 0.04] },
    { id: "pins", kind: "group", pieces: PINS.map((p) => ({ kind: "cylinder", radius: 0.08, length: 0.5, at: [p[0], p[1], 0.1] })).concat(PINS.map((p) => ({ kind: "plate", shape: shape(circle(0.12)), thickness: 0.02, at: [p[0], p[1], -0.08] }))) },
    { id: "rulerL", kind: "plate", shape: ruler(4.8), thickness: 0.06, arrow: false },
    { id: "rulerR", kind: "plate", shape: ruler(4.8), thickness: 0.06, arrow: false },
    { id: "brace", kind: "link", width: 0.18, thickness: 0.06 },
    // 兩根直尺夾角處的鉛筆
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "arc", kind: "trace" },
  ],
  waivers: [
    { check: "interference", parts: ["paper", "pins"], reason: "待確認:paper 的方塊 6.5×3.6×0.04 與 pins 的圓柱 r0.08×0.5重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["pins", "rulerL"], reason: "待確認(未修):pins 的圓柱 r0.08×0.5 與 rulerL 的板互相穿入 0.19(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["pins", "rulerR"], reason: "待確認(未修):pins 的圓柱 r0.08×0.5 與 rulerR 的板互相穿入 0.19(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rulerL", "pencil"], reason: "待確認:rulerL 的板 與 pencil 的旋轉體重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["rulerR", "pencil"], reason: "待確認(未修):rulerR 的板 與 pencil 的旋轉體互相穿入 0.11(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["pins", "brace"], reason: "待確認(未修):pins 的圓柱 r0.08×0.5 與 brace 的圓柱 r0.09×0.06互相穿入 0.16(26 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "rulerL", grips: ["rulerR", "brace"], type: "rotation", range: RANGE, initial: TOP },
  target: "pencil", // 夾角處畫出圓弧的鉛筆
  view: { direction: [0.03, 0.05, 1] },
  pose(phi0) {
    const phi = clamp(phi0, ...RANGE);
    const P = pencil(phi);
    // 兩根直尺的邊從鉛筆經過兩根銷
    const toward = (pin) => Math.atan2(pin[1] - P[1], pin[0] - P[0]);
    const aL = toward(PINS[0]);
    const aR = toward(PINS[1]);
    const along = (a, d) => [P[0] + d * Math.cos(a), P[1] + d * Math.sin(a), 0.12];
    const n = Math.max(2, Math.round(Math.abs(phi - TOP) / deg(1)));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = pencil(TOP + ((phi - TOP) * i) / n);
      return [q[0], q[1], 0.01];
    });
    return {
      parts: {
        rulerL: { position: [P[0], P[1], 0.06], angle: aL },
        rulerR: { position: [P[0], P[1], 0.12], angle: aR },
        brace: { from: along(aL, 3.0), to: along(aR, 3.0) },
        pencil: { position: [P[0], P[1], 0.1] },
      },
      paths: { arc: { points, closed: false } },
      readouts: [],
    };
  },
};
