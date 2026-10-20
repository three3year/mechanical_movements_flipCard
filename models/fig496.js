// 第 496 種:紡棉、羊毛等時的牽伸與加撚。前面的牽伸羅拉 B 比後面的 A 轉得快,把通過兩者之間的棉條或粗紗中的纖維拉長(牽伸)。
// 紗從前羅拉通到紡紗機(throstle),紡紗機靠繞著紗管旋轉,把紗加撚並捲在紗管上。
// 主動件是虛擬的「進程」:機器運轉。
// 推斷:牽伸比 3(B 的表面速度是 A 的三倍,所以紗變細為三分之一);錠翼(倒 U 形)繞直立的錠子快轉加撚,
// 紗管轉得稍慢一點,差的轉數就把紗捲上去;粗紗以三段由粗到細的繩表示,各段以自己的速度前進。
// 推斷:羅拉與錠子都由機器的主軸經齒輪、錠帶帶動,沒畫——四根羅拉與錠翼列為外力來源(powered;決定 2026-10-20 (a))。
// 實物上上羅拉是壓在下羅拉上、靠摩擦跟著轉,這裡照決定一併列進 powered。
// 夾口處羅拉的表面和材料同向同速:上羅拉逆時針、下羅拉順時針,夾口往右(往紗錠)送。
import { TAU, Y, partPoint } from "./kit.js";
import { shape, rect, circle } from "./shapes.js";

export const DRAFT = 3;
const R = 0.28; // 羅拉半徑
const NIP_Y = 2.2;
export const A_X = -0.75;
export const B_X = 0.35;
const SPINDLE_X = 0.65;
const FLYER_TOP = 1.2;
export const FLYER_PER_TURN = 6; // A 轉一圈,錠翼轉幾圈(示意)

/** 進程 v → 兩對羅拉的轉角、三段紗的移動量、錠翼與紗管的轉角 */
export function spin(v) {
  const a = TAU * v;
  return { a, b: DRAFT * a, feed: R * a, out: DRAFT * R * a, flyer: FLYER_PER_TURN * a * DRAFT, bobbin: FLYER_PER_TURN * a * DRAFT * 0.93 };
}

// 羅拉座(推斷):兩端各一塊立板,每對羅拉一條直立的座,四根軸頸裝在座上的軸承裡;兩塊立板由羅拉下面的兩根橫撐連起來
const JOURNAL = 0.05; // 軸頸半徑
const STAND_Z = 0.65; // 兩塊立板的位置(羅拉寬 0.9,立板在兩端外面)
const STAND_W = 0.2; // 每條座的寬
const RAIL = [1.44, 1.62]; // 座底橫條的高度範圍(下羅拉底在 1.64)
const STAND_TOP = NIP_Y + 2 * R + 0.1;
const RIGHT = 1.4; // 後立板往右伸到機架的立柱
// 立板的外形:兩條直立的座(A、B)立在底下的橫條上;後立板的橫條伸到右邊的立柱
const standOutline = (right) => {
  const [a0, a1, b0, b1] = [A_X - STAND_W / 2, A_X + STAND_W / 2, B_X - STAND_W / 2, B_X + STAND_W / 2];
  return [[a0, RAIL[0]], [right, RAIL[0]], [right, RAIL[1]], [b1, RAIL[1]], [b1, STAND_TOP], [b0, STAND_TOP], [b0, RAIL[1]], [a1, RAIL[1]], [a1, STAND_TOP], [a0, STAND_TOP]];
};
const journals = [A_X, B_X].flatMap((x) => [[x, NIP_Y + R], [x, NIP_Y - R]]);
// 軸承環(孔與軸頸同大,比立板厚一點)
const BUSH = 0.09;
const stand = (z, right) => [
  { kind: "plate", shape: shape(standOutline(right), journals.map(([x, y]) => circle(BUSH, x, y).reverse())), thickness: 0.1, at: [0, 0, z] },
  ...journals.map(([x, y]) => ({ kind: "cylinder", radius: BUSH, inner: JOURNAL, length: 0.14, at: [x, y, z] })),
];

// 錠子(推斷照原圖):穿過上下兩個軸承座,錠盤夾在兩座之間,上座的頂面托著紗管底
const BEARING_UP = -0.87;
const BEARING_FOOT = -1.75;
const BEARING_LEN = 0.14;
const SPINDLE = [BEARING_FOOT - 0.1, FLYER_TOP + 0.03]; // 錠子下端、上端(頂在錠翼的橫樑上)
const BOBBIN_Y = BEARING_UP + BEARING_LEN / 2 + 0.55; // 紗管底(局部 −0.55)坐在上座頂面
// 錠子的軸承座:沿 z 的橫樑(原圖剖開的方塊),從後面的機架伸到錠子,中間一個軸承環
const POST = [1.2, RIGHT]; // 機架的立柱(在錠翼掃過的圓外,錠翼臂最遠到 x 1.11)
const rail = (y) => [
  { kind: "box", size: [0.3, 0.12, 0.9], at: [SPINDLE_X, y, -0.25] },
  { kind: "cylinder", axis: Y, radius: 0.15, inner: 0.04, length: BEARING_LEN, at: [SPINDLE_X, y, 0] },
  { kind: "box", size: [POST[0] - SPINDLE_X - 0.15, 0.12, 0.1], at: [(SPINDLE_X + 0.15 + POST[0]) / 2, y, -STAND_Z] },
];

// 錠翼(局部 z 是直立方向):臂伸到紗管下段,下端各一個導眼
const ARM = 0.43;
const ARM_BOTTOM = -0.45;
const EYE = { r: 0.07, inner: 0.045, len: 0.04 };
const EYE_X = ARM + 0.05; // 導眼的孔心在臂的外側(紗沿臂的外面下來)
const YARN_R = 0.025;
const BARREL = 0.2; // 紗管筒身半徑
const ENTRY = [SPINDLE_X, FLYER_TOP + 0.25, 0]; // 紗進錠翼頂的地方(錠子軸線上方)

const roller = (id, x, top, label) => ({
  id,
  kind: "group",
  center: [x, NIP_Y + (top ? R : -R), 0],
  spin: R,
  ...(label ? { label, labelOffset: [0, R + 0.15, 0.5] } : {}),
  pieces: [
    { kind: "pulley", style: "disc", radius: R, width: 0.9 },
    // 軸頸(推斷):穿過兩端羅拉座的軸承
    { kind: "cylinder", radius: JOURNAL, length: 2 * STAND_Z + 0.2 },
  ],
});

/** 紗沿下前羅拉右側的圓弧:從夾口(頂點)順時針繞到往 to 的切點 */
function wrapB(to) {
  const c = [B_X, NIP_Y - R];
  const d = Math.hypot(to[0] - c[0], to[1] - c[1]);
  const toward = Math.atan2(to[1] - c[1], to[0] - c[0]);
  const leave = toward + Math.acos(R / d); // 切點(在 to 的逆時針那一側,紗從右側往下離開)
  const n = 8;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = Math.PI / 2 + ((leave - Math.PI / 2) * i) / n;
    return [c[0] + R * Math.cos(t), c[1] + R * Math.sin(t), 0];
  });
}

export default {
  figure: 496,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...stand(-STAND_Z, RIGHT),
        ...stand(STAND_Z, B_X + STAND_W / 2),
        // 兩塊立板之間的橫撐(在下羅拉下面)
        ...[A_X, B_X].map((x) => ({ kind: "box", size: [STAND_W, RAIL[1] - RAIL[0], 2 * STAND_Z], at: [x, (RAIL[0] + RAIL[1]) / 2, 0] })),
        // 機架的立柱:從羅拉座的後立板往下,接錠子的兩個軸承座
        { kind: "box", size: [POST[1] - POST[0], RAIL[0] - (BEARING_FOOT - 0.06), 0.1], at: [(POST[0] + POST[1]) / 2, (RAIL[0] + BEARING_FOOT - 0.06) / 2, -STAND_Z] },
        ...rail(BEARING_UP),
        ...rail(BEARING_FOOT),
      ],
    },
    roller("aTop", A_X, true, "A"),
    roller("aBottom", A_X, false),
    roller("bTop", B_X, true, "B"),
    roller("bBottom", B_X, false),
    { id: "roving", kind: "rope", radius: 0.08 },
    { id: "drafted", kind: "rope", radius: 0.05 },
    { id: "yarn", kind: "rope", radius: YARN_R },
    {
      id: "flyer",
      kind: "group",
      axis: Y,
      center: [SPINDLE_X, 0, 0],
      spin: 0.55,
      pieces: [
        // 錠子(局部 z 是直立方向)、倒 U 形的錠翼、兩臂下端的導眼、兩個軸承座之間的錠盤
        { kind: "cylinder", radius: 0.04, length: SPINDLE[1] - SPINDLE[0], at: [0, 0, (SPINDLE[0] + SPINDLE[1]) / 2] },
        { kind: "plate", shape: shape(rect(2 * ARM + 0.05, 0.06, 0, 0)), thickness: 0.06, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], at: [0, 0, FLYER_TOP] },
        ...[1, -1].map((s) => ({ kind: "box", size: [0.05, 0.05, FLYER_TOP - ARM_BOTTOM], at: [s * ARM, 0, (FLYER_TOP + ARM_BOTTOM) / 2] })),
        // 導眼(推斷照原圖兩臂下端的圈):直立的小環,掛在臂的下端、孔心在臂外側
        ...[1, -1].map((s) => ({ kind: "cylinder", role: "eye", radius: EYE.r, inner: EYE.inner, length: EYE.len, at: [s * EYE_X, 0, ARM_BOTTOM - EYE.len / 2] })),
        { kind: "pulley", style: "disc", radius: 0.22, width: 0.12, at: [0, 0, (BEARING_UP + BEARING_FOOT) / 2] },
      ],
    },
    { id: "bobbin", kind: "lathe", axis: Y, center: [SPINDLE_X, BOBBIN_Y, 0], profile: [[0.06, -0.55], [0.3, -0.55], [0.3, -0.5], [BARREL, -0.45], [BARREL, 0.55], [0.3, 0.6], [0.3, 0.65], [0.06, 0.65]], mark: true, arrow: false },
  ],
  powered: ["flyer", "aTop", "aBottom", "bTop", "bBottom"], // 外力來源:由機器的主軸經齒輪、錠帶帶動(傳動沒畫,推斷)
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "bobbin", // 紗被加撚後捲上去的紗管
  view: { direction: [0.15, 0.15, 1] },
  pose(v) {
    const s = spin(v);
    const nip = (x) => [x, NIP_Y, 0];
    const flyer = (local) => partPoint([SPINDLE_X, 0, 0], Y, s.flyer, local);
    // 紗:夾口 → 沿下前羅拉右側繞下 → 錠翼頂(錠子軸線上方)→ 越過橫樑到一臂的外側 → 沿臂下到導眼 →
    // 從導眼下方切線接到紗管筒身(切點由導眼的位置決定,與紗管轉角無關;錠翼比紗管快,切點落後導眼)
    const below = ARM_BOTTOM - EYE.len - YARN_R - 0.01; // 紗在導眼下緣轉向紗管
    const lag = Math.acos(BARREL / EYE_X);
    const yarn = [
      ...wrapB(ENTRY),
      ENTRY,
      flyer([EYE_X, 0, FLYER_TOP + 0.06]),
      flyer([EYE_X, 0, below]),
      flyer([BARREL * Math.cos(-lag), BARREL * Math.sin(-lag), below]),
    ];
    return {
      parts: {
        aTop: { angle: s.a },
        aBottom: { angle: -s.a },
        bTop: { angle: s.b },
        bBottom: { angle: -s.b },
        flyer: { angle: s.flyer },
        bobbin: { angle: s.bobbin },
      },
      paths: {
        // 三段紗各以自己的速度往前走(粗紗慢、牽伸後快)
        roving: { points: [[-2.4, NIP_Y, 0], nip(A_X)], closed: false, phase: s.feed },
        drafted: { points: [nip(A_X), nip(B_X)], closed: false, phase: s.out },
        yarn: { points: yarn, closed: false, phase: s.out },
      },
      readouts: [
        { label: "牽伸比(B / A)", value: `${DRAFT} 倍` },
        { label: "錠翼 / 紗管", value: "錠翼快轉加撚,紗管稍慢、把紗捲上" },
      ],
    };
  },
};
