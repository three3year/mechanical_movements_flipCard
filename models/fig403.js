// 第 403 種:弧線繪製儀,用來在圓心碰不到的圖上畫圓弧。先畫出弦與正矢,從弦的兩端畫斜線到正矢的頂端,把兩根直尺沿這兩條線
// 放、在頂端交叉,牢牢夾在一起,再橫過兩者裝第三根直尺當支撐。弦的兩端各插一根銷;把這個裝置靠著兩根銷推動,
// 兩根直尺夾角處的鉛筆就畫出圓弧(同一弦所對的圓周角都相等)。主動件是這組直尺(沿兩根銷滑動);軌跡由 pose 回傳。
// 2026-10-07 複查:原本兩根直尺的中線穿過銷(要在尺上開沒畫出的長孔);原文是把裝置「頂住這些銷」,改成兩根直尺的下緣
// 靠在銷上滑(銷在夾角的裡面),鉛筆夾在兩條下緣形成的夾角裡(碰著兩條邊)。銷有粗細,所以鉛筆畫的弧和圓周角的圓差一點點
// (銷半徑的量級);弧以鉛筆實際走過的路線畫出。
// 2026-10-20(model-audit-fixes-4):整組放到紙上——左尺平放在紙面、右尺疊在左尺上、撐桿疊在右尺上;撐桿左端下面加一塊
// 一個尺厚的墊塊(推斷:三根尺要夾在一起,墊塊補上左尺與撐桿之間的落差),兩端都夾在尺上。鉛筆尖貼在紙面:鉛筆的尖端是圓錐,
// 在兩根尺的厚度範圍內筆身還沒到全粗,鉛筆離尺邊的距離取圓錐在右尺上緣高度的半徑,筆身在那裡剛好碰到兩條尺邊。
import { clamp, deg } from "./kit.js";
import { shape, rect, circle, stadium } from "./shapes.js";

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

// 深度:紙面在 PAPER_TOP;左尺、右尺、撐桿各厚 T,依序疊上去;銷從紙面下 0.04 立到紙面上 0.26
const PAPER_TOP = -0.1;
const T = 0.06;
const Z_L = PAPER_TOP + T / 2; // 左尺(板件中心)
const Z_R = Z_L + T; // 右尺
const Z_B = Z_R + T; // 撐桿
// 直尺:長條,局部 +x 沿尺,下緣在局部 y = 0;左尺的尺身在 −y、右尺在 +y(都在夾角的外側)
const WIDTH = 0.22;
const ruler = (len, side) => shape(rect(len, WIDTH, len / 2 - 0.4, (side * WIDTH) / 2)); // side:尺身在下緣的哪一側
const PIN_R = 0.08;
// 鉛筆:旋轉體,尖端在局部 z −0.1(紙面),半徑 0.05 在局部 z 0,再往上到 0.06
const PENCIL_PROFILE = [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]];
const PENCIL_Z = PAPER_TOP + 0.1; // 尖端剛好在紙面
export const PENCIL_R = 0.05 + (0.01 * (Z_R + T / 2 - PENCIL_Z)) / 0.4 + 0.001; // 圓錐在右尺上緣高度的半徑(留 0.001 貼合誤差)

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

// 撐桿的兩端:從夾角頂點沿各尺的下緣 1.6、再往尺身裡 0.11(尺的中線)
const BRACE_AT = 1.6;
const braceEnds = (st) => st.edges.map((e) => [st.apex[0] + BRACE_AT * Math.cos(e.a) + 0.11 * e.n[0], st.apex[1] + BRACE_AT * Math.sin(e.a) + 0.11 * e.n[1]]);
export const BRACE_LEN = (() => {
  const [l, r] = braceEnds(setting(TOP));
  return Math.hypot(r[0] - l[0], r[1] - l[1]); // 兩尺夾角固定,撐桿的長不變
})();

export default {
  figure: 403,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, PAPER_TOP - 0.02], size: [6.5, 3.6, 0.04] },
    // 弦兩端各插一根銷(兩根各自插在紙上,分成兩個零件)
    ...PINS.map((p, i) => ({ id: ["pinL", "pinR"][i], kind: "cylinder", radius: PIN_R, length: 0.3, center: [p[0], p[1], PAPER_TOP + 0.11] })),
    { id: "rulerL", kind: "plate", shape: ruler(4.8, -1), thickness: T, arrow: false },
    { id: "rulerR", kind: "plate", shape: ruler(4.8, 1), thickness: T, arrow: false },
    // 撐桿:橫過兩尺的第三根尺(局部 +x 從左尺上的一端到右尺上的一端),壓在右尺上;左端下面的墊塊壓在左尺上(推斷)
    { id: "brace", kind: "plate", shape: stadium(BRACE_LEN, 0.18), thickness: T, arrow: false, pieces: [{ kind: "plate", shape: shape(circle(0.09)), thickness: T, at: [0, 0, -T] }] },
    // 兩根直尺夾角處的鉛筆
    { id: "pencil", kind: "lathe", profile: PENCIL_PROFILE },
    { id: "arc", kind: "trace" },
  ],
  driver: { part: "rulerL", grips: ["rulerR", "brace"], type: "rotation", range: RANGE, initial: TOP },
  target: "pencil", // 夾角處畫出圓弧的鉛筆
  view: { direction: [0.03, 0.05, 1] },
  pose(phi0) {
    const phi = clamp(phi0, ...RANGE);
    const st = setting(phi);
    const { edges, apex, tip } = st;
    const [eL, eR] = edges;
    const [bl, br] = braceEnds(st);
    const n = Math.max(2, Math.round(Math.abs(phi - TOP) / deg(1)));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = setting(TOP + ((phi - TOP) * i) / n).tip;
      return [q[0], q[1], PAPER_TOP + 0.01];
    });
    return {
      parts: {
        rulerL: { position: [apex[0], apex[1], Z_L], angle: eL.a },
        rulerR: { position: [apex[0], apex[1], Z_R], angle: eR.a },
        brace: { position: [bl[0], bl[1], Z_B], angle: Math.atan2(br[1] - bl[1], br[0] - bl[0]) },
        pencil: { position: [tip[0], tip[1], PENCIL_Z] },
      },
      paths: { arc: { points, closed: false } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["paper", "pinL"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.04" },
    { check: "interference", parts: ["paper", "pinR"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.04" },
  ],
};
