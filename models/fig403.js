// 第 403 種:弧線繪製儀,用來在圓心碰不到的圖上畫圓弧。先畫出弦與正矢,從弦的兩端畫斜線到正矢的頂端,把兩根直尺沿這兩條線
// 放、在頂端交叉,牢牢夾在一起,再橫過兩者裝第三根直尺當支撐。弦的兩端各插一根銷;把這個裝置靠著兩根銷推動,
// 兩根直尺夾角處的鉛筆就畫出圓弧(同一弦所對的圓周角都相等)。主動件是這組直尺(沿兩根銷滑動);軌跡由 pose 回傳。
// 2026-10-07 複查:原本兩根直尺的中線穿過銷(要在尺上開沒畫出的長孔);原文是把裝置「頂住這些銷」,改成兩根直尺的下緣
// 靠在銷上滑(銷在夾角的裡面),鉛筆夾在兩條下緣形成的夾角裡(碰著兩條邊)。銷有粗細,所以鉛筆畫的弧和圓周角的圓差一點點
// (銷半徑的量級);弧以鉛筆實際走過的路線畫出。
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

// 直尺:長條,局部 +x 沿尺,下緣在局部 y = 0;左尺的尺身在 −y、右尺在 +y(都在夾角的外側)
const WIDTH = 0.22;
const ruler = (len, side) => shape(rect(len, WIDTH, len / 2 - 0.4, (side * WIDTH) / 2)); // side:尺身在下緣的哪一側
const PIN_R = 0.08;
const PENCIL_R = 0.06;

/** 夾角的頂點在弧上 phi 時:兩條下緣(各靠著一根銷)的方向、交點與鉛筆的位置 */
export function setting(phi0) {
  const phi = clamp(phi0, ...RANGE);
  const P = pencil(phi);
  const edges = PINS.map((pin, i) => {
    const a = Math.atan2(pin[1] - P[1], pin[0] - P[0]); // 夾角頂點往銷的方向
    // 下緣朝夾角外側平移一個銷半徑(銷在夾角裡面、碰著下緣);外側 = 遠離另一根銷的那一邊
    const other = PINS[1 - i];
    let n = [-Math.sin(a), Math.cos(a)];
    if ((other[0] - pin[0]) * n[0] + (other[1] - pin[1]) * n[1] > 0) n = [-n[0], -n[1]];
    return { a, n, at: [pin[0] + PIN_R * n[0], pin[1] + PIN_R * n[1]] };
  });
  // 兩條下緣的交點
  const [e0, e1] = edges;
  const [d0, d1] = [[Math.cos(e0.a), Math.sin(e0.a)], [Math.cos(e1.a), Math.sin(e1.a)]];
  const den = d0[0] * d1[1] - d0[1] * d1[0];
  const t = ((e1.at[0] - e0.at[0]) * d1[1] - (e1.at[1] - e0.at[1]) * d1[0]) / den;
  const apex = [e0.at[0] + d0[0] * t, e0.at[1] + d0[1] * t];
  // 鉛筆在夾角裡、碰著兩條邊:沿角平分線往裡 PENCIL_R / sin(半角)
  const bis = [d0[0] + d1[0], d0[1] + d1[1]];
  const bl = Math.hypot(...bis);
  const half = Math.acos(Math.max(-1, Math.min(1, d0[0] * d1[0] + d0[1] * d1[1]))) / 2;
  const tip = [apex[0] + (bis[0] / bl) * (PENCIL_R / Math.sin(half)), apex[1] + (bis[1] / bl) * (PENCIL_R / Math.sin(half))];
  return { edges, apex, tip };
}

export default {
  figure: 403,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [6.5, 3.6, 0.04] },
    { id: "pins", kind: "group", pieces: PINS.map((p) => ({ kind: "cylinder", radius: PIN_R, length: 0.3, at: [p[0], p[1], 0.01] })).concat(PINS.map((p) => ({ kind: "plate", shape: shape(circle(0.12)), thickness: 0.02, at: [p[0], p[1], -0.08] }))) },
    { id: "rulerL", kind: "plate", shape: ruler(4.8, -1), thickness: 0.06, arrow: false },
    { id: "rulerR", kind: "plate", shape: ruler(4.8, 1), thickness: 0.06, arrow: false },
    { id: "brace", kind: "link", width: 0.18, thickness: 0.06 },
    // 兩根直尺夾角處的鉛筆
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "arc", kind: "trace" },
  ],
  driver: { part: "rulerL", grips: ["rulerR", "brace"], type: "rotation", range: RANGE, initial: TOP },
  target: "pencil", // 夾角處畫出圓弧的鉛筆
  view: { direction: [0.03, 0.05, 1] },
  pose(phi0) {
    const phi = clamp(phi0, ...RANGE);
    const { edges, apex, tip } = setting(phi);
    const [eL, eR] = edges;
    // 尺的下緣從夾角頂點沿 a 方向,尺身在外側
    const along = (e, d) => [apex[0] + d * Math.cos(e.a) + 0.11 * e.n[0], apex[1] + d * Math.sin(e.a) + 0.11 * e.n[1], 0.18]; // 撐桿疊在兩根直尺上面(比銷高)
    const n = Math.max(2, Math.round(Math.abs(phi - TOP) / deg(1)));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = setting(TOP + ((phi - TOP) * i) / n).tip;
      return [q[0], q[1], 0.01];
    });
    return {
      parts: {
        rulerL: { position: [apex[0], apex[1], 0.06], angle: eL.a },
        rulerR: { position: [apex[0], apex[1], 0.12], angle: eR.a },
        brace: { from: along(eL, 1.6), to: along(eR, 1.6) },
        pencil: { position: [tip[0], tip[1], 0.1] },
      },
      paths: { arc: { points, closed: false } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["paper", "pins"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.05" },
  ],
};
