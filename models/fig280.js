// 第 280 種:操作絞盤的一種方式。右邊的長手動槓桿繞上端的樞軸來回扳動,樞軸處往左伸出的短臂(曲柄搖臂)
// 經一根直立的拉桿帶動短槓桿;短槓桿以銷裝在一個鑄鐵塊上,鐵塊的兩個夾爪跨過輪緣前後兩面,各以一道朝內凸出的
// 凸緣貼著輪緣的內面。短槓桿外端往上時,槓桿末端(銷內側的偏心頭)壓到輪緣外面,輪緣被夾在槓桿末端與鐵塊凸緣
// 之間,摩擦力帶著輪轉;短槓桿往下推時槓桿末端離開輪緣,鐵塊沿輪緣滑回去。輪的倒轉由一般的棘輪與棘爪擋住。
// 主動件是長手動槓桿(累計行程:每一程先是短槓桿在銷上轉一小段——往上那一程夾住、往下那一程鬆開——
// 再整組沿輪緣走;往上那一程輪被夾著一起轉,往下那一程輪不動)。
// 夾住由接觸算:短槓桿從鬆開的角度繞銷往上轉,停在偏心頭碰到輪緣外面的角度(swingUntilContact);
// 輪只在槓桿頭壓在輪緣上(夾住)時跟著鐵塊轉。
// 止回爪(由接觸算,共用 pawl-drive.js):兩支爪鉸在輪右上方的銷上,靠自重搭在棘輪上,彼此錯開半個齒距,
// 輪每轉半齒就有一支爪落進齒間;輪往前轉時爪被齒背頂起,越過齒尖後加速落回,輪往回就被擋住。
// 動力重演只驗止回爪:輪是靠夾具的摩擦帶動(重演引擎做不出夾緊的摩擦),照模型的姿勢轉。
// 偏離插圖:原圖的輪面是整片,凸緣以虛線畫在輪面後面;模型把輪輻板移到輪緣的中間,前後兩個夾爪的凸緣才伸得進
// 輪緣內側(原文是兩個夾爪各有一道凸緣),前面那道凸緣也看得到。
// 推斷:各桿長、鐵塊的形狀與夾爪的位置(依原圖與原文);短槓桿末端的偏心頭;止回爪的位置與棘輪的齒數
// (每程一齒,兩支爪錯開半齒,原圖的棘輪沒畫出來);輪軸與軸承座、止回爪樞軸銷的支架、機架的斜撐(依原圖)。
import { TAU, deg, rot2 } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { ratchetObstacles } from "./ratchets.js";
import { pawlDrive } from "./pawl-drive.js";
import { swingUntilContact, placeOutline, circlePolygon } from "./contact.js";
import { ratchetShape, shape, circle, thickLine, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const C = [-1.15, -0.55, 0]; // 輪心
const RIM = 1.4;
const R_OUT = RIM + 0.12; // 輪緣外面
const R_IN = RIM - 0.08; // 輪緣內面
const RIM_LEN = 0.42; // 輪緣寬(z ±0.21)
const FROM = deg(-12);
const TO = deg(3); // 鐵塊在輪緣上來回的角度範圍(從輪心量)
const SPAN = TO - FROM;
const RATCHET = { teeth: 24, outer: 0.62, inner: 0.48, dir: 1 }; // 每程 15°,剛好一齒
const PITCH = TAU / RATCHET.teeth;

// 鐵塊(局部座標:原點在輪心,+x 沿鐵塊所在的半徑朝外;轉角就是鐵塊在輪緣上的位置角)
const PIN = [1.75, 0]; // 短槓桿的銷,在輪緣外面,兩端固定在前後兩個夾爪上
// 夾爪板(在輪緣前後兩面外,z 0.22..0.32):沿輪緣的一條帶住凸緣,下半段往外接到銷;銷上方空著,
// 從前面看得到槓桿末端壓在輪緣外面
const JAW = { z: 0.27, t: 0.1 };
const JAW_BAND = { r0: 1.26, r1: 1.36, a0: -0.24, a1: 0.2 };
const JAW_LOW = { r0: 1.26, r1: 1.95, a0: -0.24, a1: -0.05 };
const FLANGE = { r0: 1.2, r1: R_IN - 0.003, a0: -0.2, a1: 0.16, z: 0.15, t: 0.14 }; // 凸緣:從夾爪往內伸進輪緣內側(z 0.08..0.22)
const sector = ({ r0, r1, a0, a1 }) => [...arcPoints(r1, a0, a1), ...arcPoints(r0, a1, a0)];

// 短槓桿(局部座標:原點在銷,+x 朝外端)。銷內側的偏心頭往上偏:槓桿往上轉時頭朝輪緣外面靠過去
const SHORT = 0.95; // 銷到外端(拉桿的接點)
const HEAD = { at: [-0.1, 0.2], r: 0.1 };
const HEAD_OUTLINE = circle(HEAD.r, ...HEAD.at);
const RELEASE = deg(15); // 鬆開時短槓桿比夾住時往下轉的角度
const G = deg(5); // 每一程裡短槓桿在銷上轉的那一段主動量(夾住或鬆開)
const H = SPAN + G; // 一程的主動量

// 夾住的角度:短槓桿繞銷往上轉,停在偏心頭碰到輪緣外面(鐵塊的局部座標裡算)
const RIM_OUTLINE = circlePolygon([0, 0], R_OUT, 720);
const GRIP = swingUntilContact({ pivot: PIN, outline: HEAD_OUTLINE, from: -0.4, into: 1, sweep: 1.2, steps: 240 }, [RIM_OUTLINE]);
const OPEN = GRIP - RELEASE;
/** 短槓桿在銷上的轉角 → 偏心頭離輪緣外面的間隙 */
const headGap = (lever) => {
  const [x, y] = rot2(HEAD.at, lever);
  return Math.hypot(PIN[0] + x, PIN[1] + y) - HEAD.r - R_OUT;
};

// 長手動槓桿:樞軸在高柱頂;往左伸出的短臂接直立拉桿,槓桿本體往右下伸到把手
const T = [2.72, 2.6, 0];
const ARM = 1.2;
const ROD = 3.3;
const LEVER = [[-0.51, 0.61], [-0.8, 3.8]]; // 槓桿本體(局部座標,+x 沿短臂;樞軸處往右下,再往下)

/** 主動量 v(累計行程)→ 鐵塊位置角、短槓桿在銷上的轉角、輪的轉角、短槓桿與長槓桿的姿勢 */
export function capstan(v) {
  const k = Math.floor(v / H + 1e-12);
  const u = v - k * H;
  const up = ((k % 2) + 2) % 2 === 0;
  const cycle = Math.floor(k / 2);
  const s = Math.min(1, u / G);
  const lever = up ? OPEN + (GRIP - OPEN) * s : GRIP - (GRIP - OPEN) * s;
  const block = up ? FROM + Math.max(0, u - G) : TO - Math.max(0, u - G);
  // 輪只在被夾住(槓桿頭壓在輪緣上)時跟著鐵塊往前轉;鬆開時鐵塊自己滑回去
  const held = up && headGap(lever) < 1e-3;
  const wheel = cycle * SPAN + (up ? (held ? block - FROM : 0) : SPAN);
  const pin = [C[0] + PIN[0] * Math.cos(block), C[1] + PIN[0] * Math.sin(block), 0];
  const a = block + lever;
  const end = [pin[0] + SHORT * Math.cos(a), pin[1] + SHORT * Math.sin(a), 0];
  const joint = circleCircle(T, ARM, end, ROD, -1).point;
  return { block, lever, wheel, held, forward: up, short: { pin, end, angle: a }, joint, long: angleOf(T, joint) };
}
export const geometry = { FROM, TO, H, G, pitch: PITCH, grip: GRIP, open: OPEN };

// 止回爪:第二支是第一支繞輪心轉 1.5 個齒距(錯開半齒)
const PAWL = { pivot: [C[0] + 1.0, C[1] + 0.8, 0.3], length: 0.8 }; // 樞軸在輪的右上,爪往左下搭在棘輪上
const SHIFT = 1.5 * PITCH;
const PAWL2 = (() => {
  const [x, y] = rot2([PAWL.pivot[0] - C[0], PAWL.pivot[1] - C[1]], SHIFT);
  return [C[0] + x, C[1] + y, 0.3];
})();
// 止回爪(局部座標:原點在樞軸,沿 +x):細桿,尖端削成斜面
const PAWL_OUTLINE = [[-0.06, -0.05], [PAWL.length - 0.08, -0.05], [PAWL.length, 0.02], [PAWL.length - 0.06, 0.05], [-0.06, 0.05]];

const check = pawlDrive({
  period: 2 * H,
  pins: () => ({ pawl: PAWL.pivot.slice(0, 2), pawl2: PAWL2.slice(0, 2) }),
  wheel: { obstacles: (w) => ratchetObstacles(RATCHET, w, C), angle: (v) => capstan(v).wheel, dir: RATCHET.dir, pitch: PITCH },
  // 爪靠自重往下擺(逆時針),尖端搭在棘輪上
  pawls: {
    pawl: { outline: PAWL_OUTLINE, into: 1, angle: deg(195), limits: [deg(160), deg(250)] },
    pawl2: { outline: PAWL_OUTLINE, into: 1, angle: deg(195) + SHIFT, limits: [deg(160) + SHIFT, deg(250) + SHIFT] },
  },
});
// 動力重演的中途事件:第一程裡第一支爪落得最深(往 into 轉得最多)、第二支爪被頂得最高的那一刻
const extreme = (id, sign) => {
  let best = { a: -Infinity, v: 0 };
  for (let i = 0; i <= 200; i++) {
    const v = (i * H) / 200;
    const a = sign * check.at(v).angles[id];
    if (a > best.a + 1e-9) best = { a, v };
  }
  return best.v;
};
// 重演裡的爪靠重力落下要一點時間:比對落到最深之後一小段(模型的爪這時仍在齒間,只比最深處淺不到 1°)
const PEAK = extreme("pawl", 1) + 0.02;
const LIFT2 = extreme("pawl2", -1);
/** 主動量 v:兩支止回爪的轉角 */
export const pawlAngles = (v) => check.at(v).angles;
/** 檢查用:止回爪與棘輪的齒(世界座標 2D) */
export const contactAt = (v) => {
  const s = check.shapes(v);
  return { pawls: s.pawls, teeth: s.wheel };
};

const wheelPieces = [
  { kind: "cylinder", radius: R_OUT, inner: R_IN, length: RIM_LEN },
  // 輪輻板在輪緣的中間(z ±0.06),前後都留出凸緣伸進來的空間
  { kind: "plate", shape: shape(circle(RIM - 0.05), [circle(0.25).reverse()]), thickness: 0.12 },
  { kind: "cylinder", radius: 0.3, length: 0.6 },
  { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.12 }), thickness: 0.14, at: [0, 0, 0.3] },
  { kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.6] }, // 輪軸,往後穿過軸承座
];

// 止回爪樞軸銷的支架:銷往前接到橫條,橫條接到直條,直條頂上往後接到機架的斜撐
const STRAP_X = 0.3;
const BRACE = [[-0.35, 1.6], [T[0], T[1] - 0.2]];
const braceY = (x) => BRACE[0][1] + ((x - BRACE[0][0]) / (BRACE[1][0] - BRACE[0][0])) * (BRACE[1][1] - BRACE[0][1]);
const pawlBar = (p) => ({ kind: "box", size: [STRAP_X - p[0] + 0.07, 0.14, 0.1], at: [(p[0] + STRAP_X) / 2, p[1], 0.5] });

export default {
  figure: 280,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.42, 5.2, 0.4], at: [-0.35, -0.2, -0.75] }, // 輪後面的立柱
        // 高柱:頂上是長手動槓桿的樞軸
        { kind: "box", size: [0.42, T[1] + 0.25 + 2.8, 0.4], at: [T[0], (T[1] + 0.25 - 2.8) / 2, -0.3] },
        { kind: "plate", shape: shape(thickLine(BRACE, 0.3)), thickness: 0.3, at: [0, 0, -0.6] }, // 斜撐
        // 長槓桿的樞軸:後端插進高柱,往前穿過槓桿
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [T[0], T[1], -0.02] },
        // 止回爪的樞軸銷(在輪緣的前面)與支架
        { kind: "cylinder", radius: 0.03, length: 0.22, at: [PAWL.pivot[0], PAWL.pivot[1], 0.34] },
        { kind: "cylinder", radius: 0.03, length: 0.22, at: [PAWL2[0], PAWL2[1], 0.34] },
        pawlBar(PAWL.pivot),
        pawlBar(PAWL2),
        { kind: "box", size: [0.14, braceY(STRAP_X) - PAWL.pivot[1] + 0.07, 0.1], at: [STRAP_X, (braceY(STRAP_X) + PAWL.pivot[1] - 0.07) / 2, 0.5] },
        { kind: "box", size: [0.14, 0.14, 1.0], at: [STRAP_X, braceY(STRAP_X), 0.05] }, // 往後接到斜撐
        { kind: "box", size: [7.4, 0.12, 2.0], at: [-0.2, -2.86, -0.3] }, // 底座
        // 輪軸的軸承座(在輪的後面)
        ...pedestal({ at: C, z: -1.0, bore: 0.12, floor: -2.8 }),
      ],
    },
    { id: "wheel", kind: "group", center: C, spin: R_OUT, pieces: [...wheelPieces, { kind: "box", size: [0.3, 0.16, 0.04], at: [1.0, 0, 0.08], accent: true }] },
    { id: "pawl", kind: "plate", center: PAWL.pivot, shape: shape(PAWL_OUTLINE, [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
    { id: "pawl2", kind: "plate", center: PAWL2, shape: shape(PAWL_OUTLINE, [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
    {
      id: "block",
      kind: "group",
      center: C,
      arrow: false,
      pieces: [
        // 鑄鐵塊:前後兩個夾爪跨過輪緣,各帶一道朝內的凸緣貼著輪緣內面;下方一道橫樑把兩個夾爪接成一塊
        ...[1, -1].flatMap((side) => [
          { kind: "plate", shape: shape(sector(JAW_BAND)), thickness: JAW.t, at: [0, 0, side * JAW.z] },
          { kind: "plate", shape: shape(sector(JAW_LOW)), thickness: JAW.t, at: [0, 0, side * JAW.z] },
          { kind: "plate", shape: shape(circle(0.11, ...PIN)), thickness: JAW.t, at: [0, 0, side * JAW.z] }, // 銷座
        ]),
        { kind: "plate", shape: shape(sector(FLANGE)), thickness: FLANGE.t, at: [0, 0, FLANGE.z] },
        { kind: "plate", shape: shape(sector(FLANGE)), thickness: FLANGE.t, at: [0, 0, -FLANGE.z] },
        { kind: "box", size: [0.36, 0.14, 2 * (JAW.z + JAW.t / 2)], at: [1.77, -0.29, 0] },
        { kind: "cylinder", radius: 0.05, length: 2 * (JAW.z + JAW.t / 2), at: [...PIN, 0] }, // 短槓桿的銷
      ],
    },
    {
      id: "short",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([HEAD.at, [0, 0], [SHORT, 0]], 0.16), [circle(0.05).reverse()]), thickness: 0.2 },
        { kind: "plate", shape: shape(circle(0.12), [circle(0.05).reverse()]), thickness: 0.2 }, // 套在銷上的眼
        { kind: "plate", shape: shape(HEAD_OUTLINE), thickness: 0.2 }, // 末端的偏心頭,壓在輪緣外面
        { kind: "plate", shape: shape(circle(0.08, SHORT, 0)), thickness: 0.2 }, // 外端接拉桿
      ],
    },
    { id: "link", kind: "link", width: 0.12, thickness: 0.1 },
    {
      id: "long",
      kind: "group",
      center: T,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(0.24), [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, 0.33] }, // 套在樞軸上的轂
        { kind: "plate", shape: shape(thickLine([[0.2, 0], [ARM, 0]], 0.16)), thickness: 0.12, at: [0, 0, 0.33] }, // 往左的短臂
        { kind: "plate", shape: shape(circle(0.09, ARM, 0)), thickness: 0.12, at: [0, 0, 0.33] },
        { kind: "plate", shape: shape(thickLine([[LEVER[0][0] * 0.3, LEVER[0][1] * 0.3], ...LEVER], 0.16)), thickness: 0.12, at: [0, 0, 0.33] },
        { kind: "lathe", axis: [-0.08, 0.997, 0], profile: [[0.06, 0], [0.12, 0.15], [0.09, 0.6], [0, 0.65]], at: [LEVER[1][0], LEVER[1][1], 0.33] }, // 把手
      ],
    },
  ],
  // 動力重演:只驗止回爪(輪由夾具的摩擦帶動,照模型的姿勢轉);爪鉸在銷上,靠自重搭在棘輪上
  replay: {
    to: 4 * H,
    seconds: 32, // 一程只轉一齒、爪落下的時刻緊接在中途事件之前:走慢一點,讓爪來得及落下
    free: { pawl: {}, pawl2: {} },
    expect: [
      // 中途:爪被齒背頂起、越過齒尖後落得比停著時深(擺動只有幾度,容許誤差收小,爪不動就不會通過)
      { at: PEAK, part: "pawl", label: "爪越過齒尖,落進齒間", tolerance: 0.03 },
      { at: LIFT2, part: "pawl2", label: "第二支爪被齒背頂起", tolerance: 0.03 },
      { at: 2 * H, part: "pawl", label: "輪轉過一齒,止回爪越過齒尖落回齒間", quote: "輪的向後移動則由一般的棘輪與棘爪機構所阻止" },
      { at: 2 * H, part: "pawl2", label: "第二支爪也落回齒間" },
      { at: 4 * H, part: "pawl", label: "再一個來回,爪又落回齒間" },
      { at: 4 * H, part: "pawl2", label: "再一個來回,第二支爪又落回齒間" },
    ],
  },
  driver: { part: "long", type: "rotation", cycle: [0, H] },
  target: "wheel", // 被夾著一步步轉的絞盤輪
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const c = capstan(v);
    const angles = pawlAngles(v);
    return {
      parts: {
        wheel: { angle: c.wheel },
        block: { position: [C[0], C[1], 0], angle: c.block },
        short: { position: c.short.pin, angle: c.short.angle },
        link: { from: [c.short.end[0], c.short.end[1], 0.18], to: [c.joint[0], c.joint[1], 0.18] },
        long: { angle: c.long },
        pawl: { angle: angles.pawl },
        pawl2: { angle: angles.pawl2 },
      },
      readouts: [],
    };
  },
};
