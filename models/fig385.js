// 第 385 種:俄羅斯的關門裝置。兩根桿以肘節相連,左端的銷轉動於固定在門上的插座裡,右端的銷接在門框上;肘節的接頭吊著
// 一個重物。開門時兩根銷被拉近,重物被抬高;放手後,重物把接頭往下壓、讓肘節接近一直線,兩根銷之間被撐開,門就關上。
// 主動件是門上的銷(開門時往門框那邊移);重物與接頭隨之升降。
// 照原圖:接頭的銷穿過兩根桿端、往前伸出,重物頂上的 S 形掛鉤勾在伸出的那段上;掛鉤的上彎從上面吊著銷,下彎穿過
// 重物頂上的眼(眼的上緣壓在掛鉤上),重物懸在接頭正下方。
// 推斷:兩根桿等長;門關上時肘節接近一直線(不完全拉直);掛鉤、眼與重物的大小(掛鉤夠長,開到最大時重物也碰不到桿)。
import { clamp } from "./kit.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

const L = 2.2; // 每根桿長
const FRAME_X = 2.1; // 門框上的銷
const Y0 = -0.4;
const BAR_Z = 0.1; // 兩根桿的深度
export const RANGE = [FRAME_X - 2 * L * 0.97, FRAME_X - 2 * L * 0.6]; // 門上的銷的 x(關 → 開)

/** 門上的銷在 x → 肘節接頭的位置(兩銷中點的正上方) */
export function toggle(x0) {
  const x = clamp(x0, ...RANGE);
  const half = (FRAME_X - x) / 2;
  return { x, joint: [x + half, Y0 + Math.sqrt(L * L - half * half), 0] };
}

// 接頭的銷:裝在右桿的端頭,穿過兩根桿(深度 0.06..0.14)往前伸到 0.22
const PIN = { r: 0.04, z0: 0.04, z1: 0.22 };
// S 形掛鉤(重物的局部座標,原點在銷的中心;線寬 2W,在桿的前面、銷伸出的那一段上)
const W = 0.02;
const A = PIN.r + W; // 上彎的中線半徑:內緣貼著銷
const DROP = 0.25; // 上彎與下彎圓心的高度差
const HOOK_Z = { z: 0.18, t: 0.04 };
// 中段是兩個彎的內公切線(過兩圓心的中點),和兩個彎相切,線的內緣不切進銷
const TAN = Math.acos(A / (DROP / 2)); // 切點離「圓心朝中點」方向的角度
const hookLine = [
  ...arcPoints(A, (-40 * Math.PI) / 180, -Math.PI / 2 - TAN + 2 * Math.PI, 0, 0), // 上彎:尖端在右下,從上面繞過銷到左下
  ...arcPoints(A, Math.PI / 2 - TAN, (-220 * Math.PI) / 180, 0, -DROP), // 下彎:從右上往下繞到左上(S 的下半)
];
// 重物頂上的眼(環的軸沿 X,掛鉤下彎的底穿過它;眼孔的上緣壓在掛鉤上)
const EYE = { r: 0.07, inner: 0.04, len: 0.03 };
const wireTop = -DROP - A + W; // 下彎底部的線,上緣的高度
const EYE_Y = wireTop - Math.sqrt(EYE.inner ** 2 - (HOOK_Z.t / 2) ** 2); // 線的斷面(方)上緣兩角貼著眼孔
const BODY_TOP = EYE_Y - EYE.r - 0.04; // 重物本體的頂(眼下面一段頸)

export default {
  figure: 385,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [0.12, 1.2, 0.12], at: [FRAME_X, Y0 - 0.65, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.25, at: [FRAME_X, Y0, 0] }] },
    { id: "doorPin", kind: "group", pieces: [{ kind: "box", size: [0.12, 1.2, 0.12], at: [0, -0.65, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.25 }] },
    { id: "barL", kind: "link", width: 0.13, thickness: 0.08 },
    // 右桿的端頭帶著接頭的銷(局部 x = 桿長處)
    { id: "barR", kind: "link", width: 0.13, thickness: 0.08, pieces: [{ kind: "cylinder", role: "jointPin", radius: PIN.r, length: PIN.z1 - PIN.z0, at: [L, 0, (PIN.z0 + PIN.z1) / 2 - BAR_Z] }] },
    {
      id: "weight",
      kind: "group",
      pieces: [
        { kind: "plate", role: "hook", shape: shape(thickLine(hookLine, 2 * W)), thickness: HOOK_Z.t, at: [0, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: EYE.r, inner: EYE.inner, length: EYE.len, at: [0, EYE_Y, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.03, length: EYE_Y - EYE.r - BODY_TOP + 0.01, at: [0, (EYE_Y - EYE.r + BODY_TOP) / 2 - 0.005, 0] },
        // 梨形的重物本體(沿 Y 的旋轉體;profile 的高度從本體頂往下量)
        { kind: "lathe", role: "body", axis: [0, 1, 0], profile: [[0, 0], [0.08, -0.04], [0.13, -0.15], [0.25, -0.38], [0.3, -0.52], [0.24, -0.66], [0, -0.7]], at: [0, BODY_TOP, 0] },
      ],
    },
  ],
  driver: { part: "doorPin", type: "translation", direction: [1, 0, 0], range: RANGE, initial: RANGE[0] + 0.6 },
  target: "weight", // 隨開門升降的重物
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const t = toggle(x0);
    const pin = [t.x, Y0, BAR_Z];
    const joint = [t.joint[0], t.joint[1], BAR_Z];
    return {
      parts: {
        doorPin: { position: [t.x, Y0, 0] },
        barL: { from: pin, to: joint },
        barR: { from: [FRAME_X, Y0, BAR_Z], to: joint },
        weight: { position: [t.joint[0], t.joint[1], HOOK_Z.z] },
      },
      readouts: [],
    };
  },
};
