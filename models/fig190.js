// 第 190 種:螺桿夾具。一根直立的支柱穿過工作台(下端彎成鉤勾住台面底下),柱頂以銷支著一根拱形的槓桿(支撐架)。
// 槓桿右臂由螺桿撐著:轉動頂上的手柄,螺桿在支柱下方伸出的腳座裡旋轉、往上頂住槓桿右臂;
// 槓桿繞支點轉,支點另一側(左端)以銷吊著的壓腳往下,把台面上的木塊緊緊夾住。主動件是手柄。
// 推斷:螺桿的螺紋在腳座裡(原文說螺桿往上頂住支撐架);放鬆時槓桿右臂跟著螺桿下降,壓腳離開木塊,
// 壓腳吊在銷上保持水平;初始是原圖的夾緊位置。
import { Y, TAU, screwAdvance } from "./kit.js";
import { shape, circle, rect, arcPoints } from "./shapes.js";

const FULCRUM = [0, 0, 0];
const RIGHT = 1.25; // 支點到螺桿的距離
const LEFT = 1.4; // 支點到壓腳銷的距離
const PITCH = 0.1;
const TURNS = 3;
const SCREW_X = RIGHT;

/** 手柄轉 angle(0 為夾緊,負為放鬆):螺桿升降、槓桿轉角與壓腳的升起量 */
export function screwClamp(angle) {
  const rise = screwAdvance(angle, PITCH);
  const lever = Math.atan2(rise, RIGHT);
  const foot = [FULCRUM[0] - LEFT * Math.cos(lever), FULCRUM[1] - LEFT * Math.sin(lever), 0];
  return { rise, lever, foot, lift: foot[1] - FULCRUM[1] };
}

// 拱形槓桿(以支點為原點;原圖量得,單位為 100 px)。左端圓頭包住壓腳的銷孔,底邊在銷附近是平的
const LEVER = shape(
  [
    [-1.62, 0.06], [-1.5, 0.2], [-1.2, 0.3], [-0.9, 0.42], [-0.3, 0.55], [0.3, 0.5], [0.75, 0.3], [1.08, 0.07], [1.08, -0.25],
    [0.75, -0.25], [0.3, -0.12], [-0.3, -0.12], [-0.9, -0.05], [-1.1, -0.22], [-1.62, -0.22],
  ],
  [circle(0.1).reverse(), circle(0.1, -LEFT, 0).reverse()],
);
// 壓腳:主體是槓桿底下的塊(頂面低於槓桿底邊,放鬆時槓桿左端往上翹、底邊往支點那側下沉也不碰到),
// 吊在銷上的是左右兩片叉耳(在槓桿兩側,不同的 z 層),銷穿過叉耳與槓桿——槓桿和壓腳在同一平面裡不重疊。
const FOOT_TOP = -0.3;
const FOOT = shape([[-0.6, -0.45], [0.6, -0.45], [0.28, FOOT_TOP], [-0.28, FOOT_TOP]], [circle(0.1).reverse()]);
const LUG = shape([[-0.28, FOOT_TOP - 0.01], [0.28, FOOT_TOP - 0.01], [0.22, -0.05], ...arcPoints(0.22, 0, Math.PI), [-0.22, -0.05]], [circle(0.1).reverse()]);
const LEVER_THICK = 0.25;
const LUG_THICK = 0.07;
const LUG_Z = LEVER_THICK / 2 + 0.01 + LUG_THICK / 2;
const POST = shape(
  [[-0.35, -0.87], [-0.35, 0.0], ...arcPoints(0.37, Math.PI, 0, 0.02, 0), [0.4, -0.5], [1.65, -0.5], [1.65, -0.85], [0.4, -0.85], [0.4, -0.87]],
  [circle(0.1).reverse()],
);
const WORK = { x: [-2.1, -0.75], y: [-0.87, -0.45] };

export default {
  figure: 190,
  parts: [
    {
      id: "bench",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(5.9, 0.73, -0.1, -1.235)), thickness: 1.0, at: [0, 0, -0.2] },
        { kind: "plate", shape: POST, thickness: 0.3, at: [0, 0, -0.3] }, // 支柱在槓桿後面,支點銷往前穿過槓桿
        { kind: "cylinder", radius: 0.1, length: 0.7, at: [0, 0, -0.1] },
        // 支柱穿過台面,下端彎成鉤
        { kind: "plate", shape: shape([[-0.06, -0.87], [0.06, -0.87], [0.06, -2.5], [0.45, -2.5], [0.45, -2.62], [-0.06, -2.62]]), thickness: 0.12 },
      ],
    },
    { id: "work", kind: "box", center: [(WORK.x[0] + WORK.x[1]) / 2, (WORK.y[0] + WORK.y[1]) / 2, 0], size: [WORK.x[1] - WORK.x[0], WORK.y[1] - WORK.y[0], 0.8] },
    {
      id: "lever",
      kind: "plate",
      center: FULCRUM,
      shape: LEVER,
      thickness: LEVER_THICK,
      arrow: false,
      posed: true,
      // 右端是叉形:兩支叉齒夾著螺桿(螺桿上下穿過,不穿過槓桿的實體)
      pieces: [1, -1].map((s) => ({ kind: "box", size: [0.65, 0.3, 0.05], at: [1.38, -0.1, s * 0.14] })),
    },
    {
      id: "foot",
      kind: "plate",
      shape: FOOT,
      thickness: 0.4,
      arrow: false,
      pieces: [
        { kind: "plate", shape: LUG, thickness: LUG_THICK, at: [0, 0, LUG_Z] },
        { kind: "plate", shape: LUG, thickness: LUG_THICK, at: [0, 0, -LUG_Z] },
        { kind: "cylinder", radius: 0.09, length: 2 * LUG_Z + LUG_THICK + 0.04 }, // 銷
      ],
    },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      spin: 0.3,
      pieces: [
        { kind: "worm", radius: 0.1, length: 1.3, pitch: PITCH, thread: 0.04 },
        // 槓桿右臂底下的肩:螺桿上升時由它頂起槓桿
        { kind: "cylinder", radius: 0.11, length: 0.06, at: [0, 0, -0.08], accent: true },
        // 手柄在槓桿最高處之上,轉動時不掃過槓桿與支柱
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, 0.85] },
        { kind: "box", size: [1.4, 0.15, 0.12], at: [0.55, 0, 1.1] },
        { kind: "lathe", profile: [[0, 0], [0.08, 0.05], [0.1, 0.18], [0.05, 0.3], [0, 0.3]], at: [1.2, 0, 1.16] },
      ],
    },
  ],
  driver: { part: "screw", type: "rotation", range: [-TURNS * TAU, 0] },
  target: "foot",
  view: { direction: [0.08, 0.12, 1] },
  pose(angle) {
    const { rise, lever, foot } = screwClamp(angle);
    return {
      parts: {
        screw: { position: [SCREW_X, -0.2 + rise, 0], angle },
        lever: { angle: lever },
        foot: { position: foot },
      },
      readouts: [],
    };
  },
};
