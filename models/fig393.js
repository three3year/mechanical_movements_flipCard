// 第 393 種:拋光透鏡與球形物體的裝置。拋光料裝在一個杯子裡,杯子經球窩接頭接在一片彎曲的金屬片上,金屬片固定在旋轉的直立軸上,
// 直立軸與要拋光的物體同心。杯子偏心地放著,所以除了跟著軸繞物體的軸轉之外,還在萬向接頭上繞自己的軸轉,
// 杯面上的同一處不會一直碰到透鏡上的同一處。主動件是直立軸(頂上的手輪)。
// 推斷:杯子自轉的轉速(摩擦帶動,取為軸轉速的一個比例);各部尺寸依原圖。
// 直立軸穿過一個軸承環,軸承由台面左端立起的支柱伸臂托著(推斷;原圖只畫到軸)。支柱離軸夠遠,杯子繞過時碰不到。
//
// 2026-10-20 照原圖重排(#393-1):透鏡是半徑 R_LENS 的真半球,球心在台面上;杯子是罩住透鏡的殼,內面是同一個球心、
// 半徑大一點點(留拋光料那一層的間隙 CLEAR)的凹球面,所以杯子怎麼轉、杯面都貼著透鏡。杯子的局部原點放在球心、
// 局部 Z 是杯的軸(從球心指向杯頂),球窩的球在杯頂外側的凸台上;彎曲金屬片的末端是套著球的窩(推斷:原圖只看到杯頂的球與
// 金屬片的末端,窩的形狀是推斷)。杯的軸從球心指向窩的中心,窩跟著直立軸轉,所以杯的軸繞直立軸轉一圈(偏心),
// 杯子另外在窩裡繞自己的軸轉(轉向箭頭沿杯的軸,杯緣另有記號)。
import { Y, Z, quatMul, quatAxisAngle, quatFromZ, rotateAbout, add, scale } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const R_LENS = 1.35; // 透鏡(半球)的半徑
const TABLE = -0.26; // 台面頂;透鏡的球心在台面上
const LENS_C = [0, TABLE, 0];
const CLEAR = 0.015; // 杯面與透鏡之間拋光料那一層
const WALL = 0.12; // 杯殼的厚度
const R_IN = R_LENS + CLEAR;
const R_OUT = R_IN + WALL;
const CUP_SPAN = (55 * Math.PI) / 180; // 杯殼從杯頂量起的半角(原圖杯緣約在透鏡的六成高)
const BALL = 0.1; // 球窩的球
const BALL_AT = R_OUT + 0.15; // 球心離透鏡球心的距離(杯頂外側,凸台上)
const SOCKET_GAP = 0.006; // 窩的內面與球之間
const ECC = 0.45; // 杯頂偏離軸心的距離(在透鏡表面上量)
export const SELF = -0.6; // 杯子繞自己的軸轉的轉速(相對軸)
const SPINDLE_C = [0, 2.2, 0];

// 球面上一段弧的剖面點([r, z],從杯的軸量起的極角 a0 → a1)
const arc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [r * Math.sin(a), r * Math.cos(a)];
});

/** 軸轉 a → 杯的軸(單位向量)、杯頂(杯面中心)在透鏡上的點、窩的中心、杯子的自轉角 */
export function polisher(a) {
  const tilt = Math.asin(ECC / R_LENS);
  const axis = rotateAbout([Math.sin(tilt), Math.cos(tilt), 0], Y, a);
  return { axis, tilt, pole: add(LENS_C, scale(axis, R_LENS)), socket: add(LENS_C, scale(axis, BALL_AT)), self: SELF * a };
}
export const geometry = { R_LENS, LENS_C, R_IN, R_OUT, BALL, BALL_AT };

// 窩:直立軸轉 0 時窩的中心與杯的軸,換到直立軸的局部座標(局部 Z = 世界 Y,局部 Y = 世界 −Z)
const toSpindle = ([x, y, z]) => [x, -z, y];
const rest = polisher(0);
const SOCKET_AT = toSpindle([rest.socket[0] - SPINDLE_C[0], rest.socket[1] - SPINDLE_C[1], rest.socket[2] - SPINDLE_C[2]]);
const SOCKET_AXIS = toSpindle(rest.axis);
const SOCKET_TOP = add(SOCKET_AT, scale(SOCKET_AXIS, BALL + SOCKET_GAP + 0.04));
// 窩的殼:從頂(極角 0)包到過了赤道 30°,下面留口讓杯頂的凸台伸進來
const SOCKET_PROFILE = [...arc(BALL + SOCKET_GAP, 0, (2 * Math.PI) / 3, 8), ...arc(BALL + SOCKET_GAP + 0.045, (2 * Math.PI) / 3, 0, 8)];

export default {
  figure: 393,
  parts: [
    {
      id: "table",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.4, 0.28, 1.6], at: [0, TABLE - 0.14, 0] },
        { kind: "plate", shape: shape(thickLine([[-1.9, -0.55], [-1.9, -2.6]], 0.14)), thickness: 0.14 },
        { kind: "plate", shape: shape(thickLine([[-1.9, -2.0], [0.4, -0.55]], 0.12)), thickness: 0.12 },
        // 直立軸的軸承與托著它的支柱、伸臂
        { kind: "box", size: [0.14, 2.66, 0.14], at: [-1.9, 1.07, 0] },
        { kind: "box", size: [1.75, 0.12, 0.14], at: [-1.025, 2.4, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.08, length: 0.15, at: [0, 2.4, 0] },
        // 要拋光的物體:半球形透鏡,球心在台面上
        { kind: "lathe", axis: Y, profile: [[0, TABLE], ...arc(R_LENS, Math.PI / 2, 0, 24).map(([r, z]) => [r, TABLE + z])] },
      ],
    },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      center: SPINDLE_C,
      spin: 0.55,
      spinOffset: 0.6,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 1.0, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.55, length: 0.35, at: [0, 0, 0.75], mark: true },
        { kind: "cylinder", radius: 0.12, length: 0.14, at: [0, 0, -0.25] }, // 夾住金屬片的軸端套環
        // 彎曲的金屬片:從軸端的套環往外、往下彎到杯頂的球窩
        { kind: "tube", points: [[0, 0, -0.25], [0.3, 0, -0.32], [0.55, 0, -0.5], SOCKET_TOP], radius: 0.04 },
        { kind: "lathe", axis: SOCKET_AXIS, at: SOCKET_AT, profile: SOCKET_PROFILE },
      ],
    },
    {
      id: "cup",
      kind: "group",
      // 自轉的箭頭繞杯的軸,擺在杯頂外側(局部原點是透鏡的球心,箭頭要移出來才看得到)
      spin: 0.5,
      spinOffset: R_OUT + 0.1,
      pieces: [
        // 杯殼:內面是半徑 R_IN 的凹球面(和透鏡同一個球心),外面半徑 R_OUT
        { kind: "lathe", profile: [...arc(R_IN, 0, CUP_SPAN, 16), ...arc(R_OUT, CUP_SPAN, 0, 16)] },
        // 杯頂外側的凸台與球窩的球
        { kind: "cylinder", radius: 0.06, length: 0.16, at: [0, 0, R_OUT + 0.05] },
        { kind: "sphere", radius: BALL, at: [0, 0, BALL_AT] },
        { kind: "box", size: [0.12, 0.12, 0.08], at: [R_OUT * Math.sin(CUP_SPAN - 0.06), 0, R_OUT * Math.cos(CUP_SPAN - 0.06)], accent: true },
      ],
    },
  ],
  driver: { part: "spindle", type: "rotation" },
  target: "cup",
  view: { direction: [0.12, 0.25, 1] },
  pose(a) {
    const p = polisher(a);
    // 杯的軸(局部 z)從球心指向窩,隨軸轉;杯子再繞自己的軸自轉
    const rotation = quatMul(quatFromZ(p.axis), quatAxisAngle(Z, p.self));
    return { parts: { spindle: { angle: a }, cup: { position: LENS_C, rotation } }, readouts: [] };
  },
  waivers: [],
};
