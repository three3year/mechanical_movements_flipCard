// 第 381 種:Bowery 式木工夾具(原圖下為平面圖,上為橫截面)。長方形床台的一端有兩個楔形夾頰,兩者相鄰的側面彼此成角度,
// 而且從上緣往內收成燕尾形(上緣伸出、蓋住楔塊的下緣),用來容納兩個楔塊;把楔塊順著夾頰往裡推,兩個楔塊的內側就夾緊
// 立在中間、要刨邊的木料(原圖的橫截面:木料立著,比夾頰高出好幾倍)。主動件是楔塊(兩個一起往夾頰的尖端推)。
// 燕尾做在 3D 裡:夾頰沿內側面伸出一條往內收的唇,楔塊外側的下緣伸出一條斜邊塞在唇的底下,兩條斜面互相貼著,
// 楔塊只能順著夾頰滑,不能往上拔出。原圖另畫的橫截面因此不再另做示意。
// 推斷:楔塊的角度、燕尾的斜度與行程;木料的厚度與高度(照橫截面的比例);楔塊粗端的弧形(原圖平面圖的雙弧線)。
import { deg, clamp, quatFromBasis } from "./kit.js";
import { shape, rect, arcPoints } from "./shapes.js";

const HALF = deg(14); // 夾頰側面與中線的夾角
const T = Math.tan(HALF);
const BED = { x0: -3.3, x1: 3.5, y: 0.95 };
const APEX_X = BED.x0 - 0.1; // 夾頰側面(上緣)延長後交會的點:原圖兩條斜線在床台左端會合
const BOARD = 0.2; // 木料半厚(橫截面裡木料約床台寬的 1/5)
const BOARD_H = 0.85; // 木料高(橫截面裡約夾頰高的 3.4 倍)
const H = 0.25; // 夾頰與楔塊的高
const UNDERCUT = 0.08; // 燕尾:夾頰內側面從上緣到下緣往外收的量(垂直側面量)
const WEDGE_W = 0.5; // 楔塊(粗的右端)上緣的寬度
const WEDGE_L = 1.6;
const BOARD_X0 = -2.0; // 木料左端:推到底時楔塊的細端伸過木料左端(原圖)
const XR_CLAMP = APEX_X + (BOARD + WEDGE_W) / T; // 推到底時楔塊右端的位置
const JAW_END = XR_CLAMP + 0.1; // 夾頰的右端:推到底時楔塊粗端的弧剛好在夾頰端內(原圖)
const X0 = XR_CLAMP + 0.5; // 楔塊右端的起始位置
export const RANGE = [0, X0 - XR_CLAMP]; // 楔塊被推進的距離:推到夾緊木料為止

/** 楔塊推進 d → 楔塊內側(夾木料的面)離中線的距離、楔塊右端的位置 */
export function clampGap(d0) {
  const d = clamp(d0, ...RANGE);
  // 楔塊上緣的外側貼著夾頰的上緣(離中線 = (x − APEX_X)·tan),薄的一端朝夾頰的尖端;楔塊右端從 X0 推進 d
  const xr = X0 - d;
  return { d, inner: (xr - APEX_X) * T - WEDGE_W, xr };
}

// 燕尾的斜邊條:斷面是直角三角形,沿夾頰側面(上緣那條線)的方向擠出。s = ±1 是上下兩個夾頰。
// 局部 x 垂直側面朝外(朝夾頰)、局部 y 朝上、局部 z 沿側面往右。tri 是斷面的三個頂點 [垂直側面往外, 高度]
function rail(s, tri, from, length) {
  const along = [Math.cos(HALF), s * Math.sin(HALF), 0];
  const out = [-Math.sin(HALF), s * Math.cos(HALF), 0];
  // 擠出方向要和 x × y 同向:s = −1 時把局部 x 反過來、斷面跟著鏡射
  const x = s > 0 ? out : out.map((v) => -v);
  const outline = tri.map(([u, v]) => [s * u, v]);
  return {
    kind: "plate",
    shape: shape(s > 0 ? outline : outline.reverse()),
    thickness: length,
    rotation: quatFromBasis(x, [0, 0, 1], along),
    at: [from[0] + along[0] * (length / 2), from[1] + along[1] * (length / 2), from[2]],
  };
}

// 夾頰(固定在床台上):擠出的本體的內側面在下緣那條線(上緣往外收 UNDERCUT),上面再加一條往內伸的唇,
// 唇的斜面就是燕尾的上半。唇沿側面擠出,兩端垂直側面切齊(右端比夾頰端面略斜,差 UNDERCUT·tan 14° ≈ 0.02)
const faceY = (x) => (x - APEX_X) * T; // 上緣的側面
const lowY = (x) => faceY(x) + UNDERCUT / Math.cos(HALF); // 下緣的側面
const jaw = (s) => {
  const loop = [[BED.x0, BED.y], [JAW_END, BED.y], [JAW_END, lowY(JAW_END)], [BED.x0, lowY(BED.x0)]].map(([x, y]) => [x, s * y]);
  return { kind: "plate", role: "jaw", shape: shape(s > 0 ? loop : loop.reverse()), thickness: H, at: [0, 0, H / 2] };
};
const lipStart = BED.x0 + UNDERCUT * Math.sin(HALF); // 唇的左端垂直側面切齊,外角不伸出床台左端
const lipLength = (JAW_END - lipStart) / Math.cos(HALF);
const lip = (s) => rail(s, [[0, H / 2], [UNDERCUT, H / 2], [UNDERCUT, -H / 2]], [lipStart, s * faceY(lipStart), H / 2], lipLength);

// 楔塊(局部:右端內側在原點、上緣的外側面與夾頰上緣平行;本體高 H、底面在局部 z = −H/2)。
// 粗端是往右鼓的弧;外側下緣伸出一條斜邊,塞在夾頰的唇底下(燕尾的下半)
const BULGE = 0.08;
function wedge(s) {
  // 粗端的弧:通過右端內外兩角、中間往右鼓 BULGE
  const c = (WEDGE_W / 2) ** 2 / (2 * BULGE) - BULGE / 2; // 圓心在弦中點左邊 c
  const R = c + BULGE;
  const half = Math.asin(WEDGE_W / 2 / R);
  const arc = arcPoints(R, -half, half, -c, WEDGE_W / 2).slice(1, -1);
  const loop = [[-WEDGE_L, 0], [0, 0], ...arc, [0, WEDGE_W], [-WEDGE_L, WEDGE_W - WEDGE_L * T]].map(([x, y]) => [x, s * y]);
  const outerLen = WEDGE_L / Math.cos(HALF);
  return {
    kind: "plate",
    shape: shape(s > 0 ? loop : loop.reverse()),
    thickness: H,
    arrow: false,
    pieces: [rail(s, [[0, H / 2], [0, -H / 2], [UNDERCUT, -H / 2]], [-WEDGE_L, s * (WEDGE_W - WEDGE_L * T), 0], outerLen)],
  };
}

export default {
  figure: 381,
  parts: [
    {
      id: "bed",
      kind: "group",
      pieces: [
        { kind: "plate", role: "bed", shape: shape(rect(BED.x1 - BED.x0, 2 * BED.y + 0.3, (BED.x0 + BED.x1) / 2, 0)), thickness: 0.25, at: [0, 0, -0.125] },
        jaw(1),
        jaw(-1),
        lip(1),
        lip(-1),
      ],
    },
    // 木料立在床台上,夾在兩個楔塊之間;左端止於推到底時楔塊細端的右邊
    { id: "board", kind: "box", size: [BED.x1 + 0.4 - BOARD_X0, 2 * BOARD, BOARD_H], center: [(BED.x1 + 0.4 + BOARD_X0) / 2, 0, BOARD_H / 2] },
    { id: "wedgeUp", ...wedge(1) },
    { id: "wedgeDown", ...wedge(-1) },
  ],
  driver: { part: "wedgeUp", grips: ["wedgeDown"], type: "translation", direction: [-1, 0, 0], range: RANGE, initial: 0.2 },
  target: "board", // 被夾緊的木料
  view: { direction: [0.25, -0.2, 1] },
  pose(d0) {
    const c = clampGap(d0);
    return {
      parts: {
        wedgeUp: { position: [c.xr, c.inner, H / 2] },
        wedgeDown: { position: [c.xr, -c.inner, H / 2] },
      },
      readouts: [],
    };
  },
};
