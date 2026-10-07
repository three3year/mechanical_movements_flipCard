// 第 306 種:三腳式擺鐘擒縱。擒縱叉瓦是裝在擺上的一塊板的開口邊緣;擺帶著板左右移動(原圖箭頭),
// 擒縱輪的三個腳交替地作用在開口上方與下方的叉瓦上。圖中是一個腳正作用於上方叉瓦的狀態。
// 擺每擺一次,三腳輪轉過六分之一圈(上、下叉瓦各放走半個腳距)。
// 主動件是板(擺);目標件是三腳輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):三腳輪受重錘的固定力矩逆時針轉,腳尖碰上開口的台階就停。
// 開口是 S 形:左上的台階(上方叉瓦)擋住在上面往左走的腳,右下的台階(下方叉瓦)擋住在下面往右走的腳;
// 板往左移時上方叉瓦的台階退到腳尖圓外面,腳滑過去,輪轉六分之一圈碰上下方叉瓦;往右移時反過來。
// 台階的面是直的,板移過來時會把腳推回一點(回退)。
// 推斷:板的行程;開口的尺寸照三腳輪的大小推算(原圖的開口形狀相同、比例不同);板裝在擺上的兩根直條、
// 三腳輪的軸往後伸到機架上的軸承(原圖沒畫)。
import { TAU, swing } from "./kit.js";
import { escapeByContact } from "./escapement.js";
import { shape, rect, circle } from "./shapes.js";

export const STEP = TAU / 6;
export const TRAVEL = 0.32; // 板的單邊行程
const LEG = 0.72;
// 開口的尺寸(由腳的長度 L 與行程推算):台階高 yu,台階面在腳尖圓與這一高度交點外側一點
const L = LEG + 0.06;
const YU = 0.6 * L;
const C = Math.sqrt(L * L - YU * YU);
const XR = -C + TRAVEL - 0.06; // 上方叉瓦的台階面(板居中時)
const XL = -XR; // 下方叉瓦的台階面
const X = C + TRAVEL + 0.35;
const Y = L + 0.15;
const PX = 2.2;
const PY = 1.15;
// 開口(S 形)與板的實體(開口上、下兩塊)
const OPENING = [[-X, -Y], [XL, -Y], [XL, -YU], [X, -YU], [X, Y], [XR, Y], [XR, YU], [-X, YU]];
const UPPER = [[-PX, -Y], [-X, -Y], [-X, YU], [XR, YU], [XR, Y], [X, Y], [PX, Y], [PX, PY], [-PX, PY]];
const LOWER = [[PX, Y], [X, Y], [X, -YU], [XL, -YU], [XL, -Y], [-X, -Y], [-PX, -Y], [-PX, -PY], [PX, -PY]];

// 三腳輪:三根腳,末端微彎成鉤
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3;
  const pts = [[0.06, -0.07], [LEG, -0.05], [LEG + 0.05, 0.12], [LEG - 0.08, 0.06], [0.06, 0.07]];
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

/** 板的累計行程 v → 板的位移 */
export const plateShift = (v) => swing(v, -TRAVEL, TRAVEL);
export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth: legs, dir: 1, period: 4 * TRAVEL, pitch: TAU / 3, stops: (v) => [UPPER, LOWER].map((p) => p.map(([x, y]) => [x + plateShift(v), y])) }),
  period: 4 * TRAVEL,
};

/** 板的累計行程 v → 板的位移、三腳輪轉角(逆時針為正,由接觸算) */
export function threeLeg(v) {
  return { plate: plateShift(v), wheel: escapement.angle(v) };
}

export default {
  figure: 306,
  parts: [
    {
      id: "plate",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2 * PX, 2 * PY), [OPENING.slice().reverse()]), thickness: 0.12 },
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
        { kind: "cylinder", radius: 0.06, length: 0.7, at: [0, 0, -0.38] }, // 輪軸,往後伸進軸承
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳輪的軸承,裝在板後面的機架橫條上(橫條在擺的直條之間,原圖沒畫)
        { kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.12, at: [0, 0, -0.62] },
        { kind: "box", size: [0.16, 2.2, 0.1], at: [0, -1.2, -0.62] },
        { kind: "box", size: [3.4, 0.16, 0.1], at: [0, -2.3, -0.62] },
      ],
    },
  ],
  // 動力重演:只推板;三腳輪受固定的力矩(重錘)逆時針轉,由開口的上、下台階輪流擋住、放行
  replay: {
    to: 8 * TRAVEL,
    free: { wheel: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * TRAVEL, part: "wheel", label: "板移過一次,三腳輪轉六分之一圈", quote: "擒縱輪的三個齒交替地作用於上方與下方的擒縱叉瓦上" },
      { at: 4 * TRAVEL, part: "wheel", label: "板一個來回,三腳輪轉三分之一圈" },
      { part: "wheel", label: "板兩個來回,三腳輪轉三分之二圈" },
    ],
  },
  driver: { part: "plate", type: "translation", direction: [1, 0, 0], cycle: [-TRAVEL, TRAVEL] },
  target: "wheel", // 三腳輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    return { parts: { plate: { position: [t.plate, 0, 0] }, wheel: { angle: t.wheel } }, readouts: [] };
  },
};
