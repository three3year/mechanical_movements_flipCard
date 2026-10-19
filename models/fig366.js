// 第 366 種:鑽床。轉動右邊的曲柄,大傘齒輪把旋轉傳給垂直的鑽桿軸;鑽桿穿過小傘齒輪、可以在其中上下滑動,
// 但以鍵條與溝槽和小傘齒輪一起轉。上方的槓桿壓住鑽桿頂端,槓桿另一端經直桿接到下方的踏板:踩下踏板,鑽桿就被往下壓。
// 主動件是曲柄;狀態按鈕切換踏板放開 / 踩下。
// 照原圖(525 px):機架是方框,鑽桿穿過上下橫樑的軸承;小傘齒輪在框的頂上、齒朝下咬大齒輪的上緣,
// 大齒輪的軸只從輪轂往右穿出機架接曲柄。上方槓桿三個圓:右端在鑽桿頂、中間是支點、左端接直桿;
// 直桿往下接踏板左端,踏板的支點在左邊地上的托架,腳踩右邊長的一端:踩下右端 → 左端抬起 → 直桿推起槓桿左端
// → 槓桿右端壓下鑽桿。踏板、直桿、槓桿與機架是四連桿:狀態決定踏板的角度,其餘由桿長不變解出。
// 推斷:齒數(大 30、小 12);踏板放開時上翹的角度(15°)與踩下轉的角度(24°,鑽桿下降約 0.38);槓桿支點的支柱(立在機架左上角);
// 鑽桿頂的套環(不跟著鑽桿轉,前面伸出的銷穿在槓桿右端的短長孔裡——槓桿端走圓弧、鑽桿走直線,銷沿孔滑約 0.02;
// 原圖只畫一個圓);小傘齒輪往下伸的輪轂(讓鍵條在踏板放開與踩下時都在輪轂裡;原圖齒輪下方畫著鑽桿上的溝);
// 機架後面落地的立柱與底座(原圖機架沒畫支撐);踏板托架的形狀。原圖槓桿與踏板略彎,這裡畫成直的。
// 深度:機架 −0.25..0.25,立柱在機架後面 −0.6..−0.25;槓桿、踏板 0.27..0.35,直桿在它們前面 0.37..0.43。
import { Y } from "./kit.js";
import { bevelGear, pitchCones, meshAngle, bevelContact } from "./gears.js";
import { circleCircle } from "./linkage.js";
import { shape, stadium, arcPoints, zCylinder } from "./shapes.js";

const M = 0.07;
const NB = 30;
const NS = 12;
const [coneB, coneS] = pitchCones(NB, NS);
export const APEX = [0, 1.4, 0];
// 大齒輪的齒寬 0.25:小端離錐頂 0.17,讓開鑽桿與鍵條
export const BIG = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: NB, radius: (NB * M) / 2, cone: coneB, width: 0.25 });
export const SMALL = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: NS, radius: (NS * M) / 2, cone: coneS, width: 0.3 });
const CONTACT = bevelContact(BIG, SMALL);

/** 曲柄轉 a → 鑽桿的轉角 */
export const drill = (a) => meshAngle(BIG, SMALL, a, CONTACT);

// ── 踏板、直桿、槓桿(四連桿) ──
const F = [-0.86, 3.26]; // 槓桿的支點
const LEVER_L = 0.77; // 支點到左端(直桿)
const R_UP = [0, 3.5]; // 放開時套環的銷(鑽桿頂)
const Q = [-0.86, -1.31]; // 踏板的支點
const TREADLE_L = 0.8; // 支點到左端(直桿)
const TREADLE_R = 3.6; // 支點到右端(腳踩)
const TREADLE_UP = (15 * Math.PI) / 180; // 放開時踏板右端往上翹的角度(推斷;原圖的踏板略彎、右端上翹,角度沒量)
const TREADLE_DOWN = TREADLE_UP - (24 * Math.PI) / 180; // 踩下時轉 24°(推斷)
const LEVER_UP = Math.atan2(R_UP[1] - F[1], R_UP[0] - F[0]);
const end = (pivot, angle, r) => [pivot[0] + r * Math.cos(angle), pivot[1] + r * Math.sin(angle)];
const ROD = Math.hypot(...[0, 1].map((k) => end(F, LEVER_UP + Math.PI, LEVER_L)[k] - end(Q, TREADLE_UP + Math.PI, TREADLE_L)[k]));

/** 踏板轉角 → 直桿兩端、槓桿轉角、鑽桿頂(套環的銷)下降的距離;槓桿與踏板都是局部 +x 朝右端 */
export function linkage(treadle) {
  const T = end(Q, treadle + Math.PI, TREADLE_L);
  const L = circleCircle([...T, 0], ROD, [...F, 0], LEVER_L, 1).point;
  const lever = Math.atan2(F[1] - L[1], F[0] - L[0]);
  const pin = F[1] + (R_UP[0] - F[0]) * Math.tan(lever); // 槓桿中心線和鑽桿軸線的交點
  return { T, L: [L[0], L[1]], lever, drop: R_UP[1] - pin, slide: (R_UP[0] - F[0]) / Math.cos(lever) };
}
export const PRESS = linkage(TREADLE_DOWN).drop; // 踩下踏板時鑽桿下降的距離

// 槓桿右端的短長孔:套環的銷離支點 0.86(槓桿水平)到 0.893(放開),兩端各留 0.01
const PIN = 0.04;
const SLOT = [(R_UP[0] - F[0]) - 0.01, linkage(TREADLE_UP).slide + 0.01];
const LEVER_END = SLOT[1] + 0.09;
const leverShape = (() => {
  const body = stadium(LEVER_END + LEVER_L, 0.16).outline.map(([x, y]) => [x - LEVER_L, y]);
  const slot = stadium(SLOT[1] - SLOT[0], 2 * (PIN + 0.01)).outline.map(([x, y]) => [x + SLOT[0], y]).reverse();
  return shape(body, [slot]);
})();
const treadleShape = shape(stadium(TREADLE_L + TREADLE_R, 0.14).outline.map(([x, y]) => [x - TREADLE_L, y]));

const Z_BAR = 0.31; // 槓桿、踏板的中心深度(厚 0.08)
const Z_ROD = 0.4; // 直桿(厚 0.06)
// 從板往前穿過直桿的銷與銷頭(板的局部座標)
const rodPin = (x) => [zCylinder(0.27, 0.47, PIN, [x, 0], Z_BAR), zCylinder(0.43, 0.47, 0.07, [x, 0], Z_BAR)];

// 鑽桿(局部 z = 世界 y,放開時原點在 y 1.2):套環的銷在局部 2.3
const SPINDLE_UP = 1.2;
const SWIVEL_AT = R_UP[1] - SPINDLE_UP;

const FLOOR = -2.15; // 底座頂面
const gear = (g, bore = 0.06) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, bore });
// 大齒輪的局部 z 朝 −x:曲柄臂在 x 1.13..1.23
const CRANK_Z = BIG.center[0] - 1.18;

export default {
  figure: 366,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 方框:兩側板與上下橫樑(上 2.65..2.87、下 −0.05..0.17),橫樑中間是鑽桿的軸承環
        { kind: "box", size: [0.22, 2.92, 0.5], at: [-0.86, 1.41, 0] },
        { kind: "box", size: [0.22, 2.92, 0.5], at: [0.86, 1.41, 0] },
        ...[2.76, 0.06].flatMap((y) => [
          { kind: "box", size: [0.55, 0.22, 0.5], at: [-0.475, y, 0] },
          { kind: "box", size: [0.55, 0.22, 0.5], at: [0.475, y, 0] },
          { kind: "cylinder", axis: [0, 1, 0], radius: 0.22, inner: 0.08, length: 0.26, at: [0, y, 0] },
        ]),
        // 大齒輪的軸穿過右側板,外面的軸承環
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.16, inner: 0.07, length: 0.15, at: [1.045, APEX[1], 0] },
        // 槓桿支點的支柱(推斷):立在機架左上角,銷往前穿過槓桿
        { kind: "box", size: [0.16, F[1] - 2.87, 0.35], at: [F[0], (F[1] + 2.87) / 2, 0.075] },
        zCylinder(-0.1, 0.25, 0.08, F),
        zCylinder(-0.1, 0.39, PIN, F),
        zCylinder(0.35, 0.39, 0.07, F),
        // 機架後面落地的立柱與底座(推斷)
        { kind: "box", size: [0.22, 2.87 - FLOOR, 0.35], at: [-0.86, (2.87 + FLOOR) / 2, -0.425] },
        { kind: "box", size: [2.4, 0.2, 1.05], at: [-0.2, FLOOR - 0.1, -0.075] },
        // 踏板的托架(原圖左邊地上),銷往前穿過踏板
        {
          kind: "plate",
          shape: shape([[Q[0] - 0.4, FLOOR], [Q[0] + 0.4, FLOOR], ...arcPoints(0.1, 0, Math.PI, Q[0], Q[1])]),
          thickness: 0.1,
          at: [0, 0, 0.2],
        },
        zCylinder(0.15, 0.39, PIN, Q),
        zCylinder(0.35, 0.39, 0.07, Q),
      ],
    },
    {
      id: "bigGear",
      kind: "group",
      center: BIG.center,
      axis: BIG.axis,
      spin: BIG.radius,
      pieces: [
        gear(BIG),
        // 軸只從輪轂往右(局部 −z)穿過右側板,接到曲柄臂
        { kind: "cylinder", radius: 0.07, length: 0.05 - CRANK_Z, at: [0, 0, (CRANK_Z - 0.05) / 2] },
        { kind: "box", size: [0.1, 0.6, 0.1], at: [0, 0.3, CRANK_Z] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [0, 0.6, CRANK_Z - 0.05 - 0.175], accent: true },
      ],
    },
    {
      id: "smallGear",
      kind: "group",
      center: SMALL.center,
      axis: SMALL.axis,
      spin: SMALL.radius,
      // 輪轂從小端往下伸 0.25(推斷),鍵條在裡面滑;齒輪的孔連鍵槽畫成半徑 0.11(鑽桿 0.08、鍵條的角伸到 0.102)
      pieces: [gear(SMALL, 0.11), { kind: "cylinder", radius: 0.13, length: 0.25, at: [0, 0, SMALL.width / 2 + 0.125] }],
    },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: SWIVEL_AT + 0.13 + 1.8, at: [0, 0, (SWIVEL_AT + 0.13 - 1.8) / 2] },
        { kind: "cylinder", radius: 0.16, length: 0.35, at: [0, 0, -1.9] }, // 夾頭:鑽桿下端伸進來
        { kind: "lathe", profile: [[0, -2.75], [0.05, -2.65], [0.1, -2.075], [0, -2.075]] }, // 鑽頭接在夾頭底面
        { kind: "box", size: [0.04, 0.04, 1.1], at: [0.08, 0, 0.85], accent: true }, // 鍵條:世界 y 1.5..2.6(放開)
        // 套環上下的擋圈
        { kind: "cylinder", radius: 0.12, length: 0.05, at: [0, 0, SWIVEL_AT - 0.105] },
        { kind: "cylinder", radius: 0.12, length: 0.05, at: [0, 0, SWIVEL_AT + 0.105] },
      ],
    },
    {
      // 鑽桿頂的套環(推斷):跟著鑽桿上下、不跟著轉,銷往前穿過槓桿右端的長孔
      id: "swivel",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.16, inner: 0.08, length: 0.16 },
        zCylinder(0.12, 0.39, PIN),
        zCylinder(0.35, 0.39, 0.07),
      ],
    },
    { id: "lever", kind: "plate", shape: leverShape, thickness: 0.08, posed: true, arrow: false, pieces: rodPin(-LEVER_L) },
    { id: "rodToTreadle", kind: "link", width: 0.1, thickness: 0.06, pins: false },
    { id: "treadle", kind: "plate", shape: treadleShape, thickness: 0.08, posed: true, arrow: false, pieces: rodPin(-TREADLE_L) },
  ],
  driver: { part: "bigGear", type: "rotation" },
  target: "spindle", // 旋轉並被壓下的鑽桿
  states: {
    initial: "up",
    options: [
      { id: "up", label: "踏板放開" },
      { id: "down", label: "踩下踏板" },
    ],
  },
  view: { direction: [0.08, 0.1, 1] },
  pose(a, state = "up") {
    const treadle = state === "down" ? TREADLE_DOWN : TREADLE_UP;
    const k = linkage(treadle);
    return {
      parts: {
        bigGear: { angle: a },
        smallGear: { angle: drill(a) },
        spindle: { angle: drill(a), position: [0, SPINDLE_UP - k.drop, 0] },
        swivel: { position: [R_UP[0], R_UP[1] - k.drop, 0] },
        lever: { position: [...F, Z_BAR], angle: k.lever },
        treadle: { position: [...Q, Z_BAR], angle: treadle },
        rodToTreadle: { from: [...k.L, Z_ROD], to: [...k.T, Z_ROD] },
      },
      readouts: [],
    };
  },
};
