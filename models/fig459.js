// 第 459 種:水井用的往復式升降機。上面是裝在軸上的水平風車輪,軸上有螺紋(蝸桿)。軸的接頭容許些微擺動,
// 讓蝸桿一次只咬一個蝸輪。蝸輪後面有滑輪,繩子繞過滑輪,兩端各掛一個水桶。中間是一個撥爪,水桶上升時撞到它,
// 經一根搖臂(蝸桿與軸的軸承就裝在搖臂上)把蝸桿從一個輪移到另一個輪,於是倒完水的水桶被放下,另一個被抬起。
// 主動件是虛擬的「進程」:風已帶著風車轉了幾圈(風車照全書的慣例由風推動,第 485、486 種相同)。
// 推斷:
// - 一條繩繞過兩個滑輪的頂上,兩端各掛一個水桶;兩個滑輪一起轉。蝸桿咬左輪時滑輪順時針轉、左桶上升,
//   咬右輪時反過來(蝸桿推兩個輪的那一側方向相同,兩輪的轉向就相反)。單頭蝸桿配 12 齒的蝸輪。
// - 撥爪鉸在中間、兩臂伸到繩的外側,臂端各有一根往後伸的撞銷;撥爪往上的立柱就是搖臂,頂上的軸承套著蝸桿軸的下端,
//   蝸桿軸在上面的接頭處擺動。上升的水桶用提把頂起撞銷(由接觸算);頂到撥爪水平時蝸桿離開原本的輪,
//   立柱上的重錘使撥爪越過中點後自己加速翻到另一邊,蝸桿咬進另一個輪為止。
// - 撥爪的鉸座吊在蝸輪軸承的橫樑下;井口在中間,左邊有水槽;上升的水桶是滿的,到頂把水倒進水槽。
import { TAU, deg, clamp, quatFromZ, quatMul, quatAxisAngle, Y, Z } from "./kit.js";
import { shape, rect, circle, thickLine } from "./shapes.js";

export const RATIO = 1 / 12; // 單頭蝸桿、12 齒的蝸輪:風車轉一圈,蝸輪轉 1/12 圈
export const WHEELS = [[-0.55, 0.9, 0], [0.55, 0.9, 0]]; // 兩個蝸輪(軸沿 z)
const WHEEL_R = 0.42;
export const DRUM_R = 0.3; // 蝸輪後面的滑輪
const JOINT = [0, 2.5, 0]; // 蝸桿軸上端的接頭(風車軸在它上面,不擺動)
const SHAFT_LOW = 0.42; // 蝸桿軸的下端(套在搖臂頂的軸承裡)
const WORM_Y = 0.9;
export const PIVOT = [0, 0.15, 0]; // 撥爪的鉸點
const POST = SHAFT_LOW - PIVOT[1]; // 搖臂(撥爪的立柱)長
export const ARM = 1.0; // 撥爪鉸點到撞銷
export const PIN_R = 0.03;
export const TILT = deg(9); // 撥爪擺到底的角度(逆時針為正:右臂往上、立柱頂往左)
export const HANDLE = 0.295; // 水桶提把橫樑的頂離水桶中心
const ROPE_X = WHEELS[1][0] + DRUM_R; // 兩條繩垂在滑輪外側
export const PIN_Y = 0.06; // 撞銷在撥爪臂上微微翹起的高度
export const TOP = PIVOT[1] + PIN_Y - PIN_R - HANDLE; // 水桶升到這裡時剛好把撥爪頂到水平
export const BOTTOM = -2.4; // 水桶在井底(水裡)
const STROKE = TOP - BOTTOM;
const MOVE = STROKE / (RATIO * DRUM_R); // 一程的風車轉角
const FALL = 2.0; // 撥爪越過中點後翻到另一邊所佔的風車轉角
const HALF = MOVE + FALL;

/** 撥爪被上升的水桶(提把頂在 y)頂起時的轉角大小 */
const pushed = (y) => clamp(Math.asin(clamp((PIVOT[1] + PIN_Y - PIN_R - (y + HANDLE)) / ARM, -1, 1)), 0, TILT);

/**
 * 風車轉角 w → 水桶的位置(左桶高度)、撥爪轉角、被咬住的蝸輪、走向
 * 偶數段:撥爪逆時針倒(立柱頂往左)、蝸桿咬左輪、左桶上升;到頂把撥爪頂到水平,撥爪翻到順時針那一邊,換右桶上升
 */
export function lift(w) {
  const n = Math.floor(w / HALF);
  const f = w - n * HALF;
  const leftUp = ((n % 2) + 2) % 2 === 0;
  const s = leftUp ? 1 : -1; // 這一段一開始撥爪倒向哪一邊
  const rising = BOTTOM + Math.min(f, MOVE) * RATIO * DRUM_R;
  let beta;
  if (f < MOVE) beta = s * pushed(rising);
  else {
    const t = (f - MOVE) / FALL; // 越過中點後靠重錘加速翻倒,蝸桿咬進另一個輪時停住
    beta = -s * TILT * t * t;
  }
  const left = leftUp ? rising : TOP + BOTTOM - rising;
  // 繩繞過兩個滑輪的頂上:左桶上升時滑輪順時針轉
  const drum = -(left - BOTTOM) / DRUM_R;
  // 蝸桿咬著哪個輪(0 左、1 右):水桶上升時咬著帶它的那個輪;撥爪翻邊途中,倒過一半才算咬上另一個輪(之前是 -1)
  const engaged = f < MOVE ? (leftUp ? 0 : 1) : beta > TILT / 2 ? 0 : beta < -TILT / 2 ? 1 : -1;
  return { left, right: TOP + BOTTOM - left, leftUp, engaged, beta, drum, atTop: f >= MOVE };
}

/** 撥爪轉 beta → 搖臂頂(蝸桿軸下端)的橫移與蝸桿軸的傾角 */
export function worm(beta) {
  const shift = -POST * Math.sin(beta);
  return { shift, tilt: Math.atan2(shift, JOINT[1] - SHAFT_LOW) };
}

const wormWheel = (id, at) => ({
  id,
  kind: "group",
  center: at,
  spin: WHEEL_R + 0.1,
  pieces: [
    { kind: "gear", teeth: 12, radius: WHEEL_R, width: 0.12 },
    { kind: "cylinder", radius: DRUM_R, length: 0.25, at: [0, 0, -0.25] },
    { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.2] },
  ],
});
// 桶身加提把(橫樑與兩根立耳):繩繫在提把的中央
const bucketPart = (id) => ({
  id,
  kind: "group",
  arrow: false,
  pieces: [
    { kind: "lathe", axis: Y, profile: [[0.18, -0.22], [0.23, 0.22], [0.2, 0.22], [0.15, -0.18], [0, -0.18], [0, -0.22]] },
    { kind: "box", size: [0.48, 0.03, 0.03], at: [0, 0.28, 0] },
    { kind: "box", size: [0.03, 0.1, 0.03], at: [-0.215, 0.245, 0] },
    { kind: "box", size: [0.03, 0.1, 0.03], at: [0.215, 0.245, 0] },
  ],
});
// 撥爪:兩臂微微上翹,臂端各一根往後伸的撞銷;中間往上的立柱是搖臂,頂上是蝸桿軸的軸承,下面掛著重錘
const TAPPET = shape(thickLine([[-ARM, PIN_Y], [0, 0], [ARM, PIN_Y]], 0.08), [circle(0.035).reverse()]);

export default {
  figure: 459,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.4, 0.12, 0.6], at: [0, 2.6, -0.4] },
        { kind: "box", size: [0.12, 3.2, 0.12], at: [-1.6, 1.0, -0.4] },
        { kind: "box", size: [0.12, 3.2, 0.12], at: [1.6, 1.0, -0.4] },
        // 風車軸的軸承(從頂上的橫樑往前伸的托架)
        { kind: "box", size: [0.12, 0.1, 0.4], at: [0, 2.6, -0.1] },
        { kind: "cylinder", radius: 0.11, inner: 0.065, length: 0.12, axis: Y, at: [0, 2.6, 0] },
        // 蝸輪軸的橫樑(兩根立柱之間)與吊在它下面的撥爪鉸座
        { kind: "box", size: [3.32, 0.12, 0.24], at: [0, WHEELS[0][1], -0.5] },
        { kind: "box", size: [0.1, WHEELS[0][1] - PIVOT[1] + 0.06, 0.08], at: [0, (WHEELS[0][1] + PIVOT[1]) / 2 - 0.03, -0.42] },
        { kind: "cylinder", radius: 0.03, length: 0.5, at: [PIVOT[0], PIVOT[1], -0.2] },
        // 地面、井口(中間)與左邊的水槽
        { kind: "box", size: [1.2, 0.2, 1.2], at: [-2.0, -0.7, 0] },
        { kind: "box", size: [1.2, 0.2, 1.2], at: [2.0, -0.7, 0] },
        { kind: "box", size: [0.15, 2.3, 1.0], at: [-1.32, -1.75, 0] },
        { kind: "box", size: [0.15, 2.3, 1.0], at: [1.32, -1.75, 0] },
        { kind: "plate", shape: shape(rect(0.7, 0.4, -1.95, -0.4), [rect(0.6, 0.35, -1.95, -0.37).reverse()]), thickness: 0.6 },
      ],
    },
    {
      id: "windmill",
      kind: "group",
      axis: Y,
      center: [0, 2.95, 0],
      spin: 1.4,
      pieces: [
        { kind: "cylinder", radius: 1.25, length: 0.18 },
        ...Array.from({ length: 16 }, (_, i) => ({ kind: "box", size: [0.08, 0.3, 0.25], at: [1.25 * Math.cos((i * TAU) / 16), 1.25 * Math.sin((i * TAU) / 16), 0], angle: (i * TAU) / 16, ...(i === 0 ? { accent: true } : {}) })),
        // 風車軸:從輪往下到接頭(局部 z 朝上,往下是 −z)
        { kind: "cylinder", radius: 0.06, length: 0.45, at: [0, 0, -0.225] },
        { kind: "box", size: [0.16, 0.16, 0.08], at: [0, 0, -0.41] }, // 接頭的上半
      ],
    },
    // 蝸桿軸與蝸桿:從接頭往下,在接頭處擺動(局部 z 沿軸往上、原點在接頭)
    {
      id: "worm",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [0.14, 0.14, 0.08], at: [0, 0, -0.04] }, // 接頭的下半(容許蝸桿軸些微擺動)
        { kind: "cylinder", radius: 0.06, length: JOINT[1] - SHAFT_LOW + 0.05, at: [0, 0, -(JOINT[1] - SHAFT_LOW + 0.05) / 2] },
        { kind: "worm", radius: 0.14, length: 0.7, pitch: 0.12, thread: 0.05, at: [0, 0, -(JOINT[1] - WORM_Y)] },
      ],
    },
    wormWheel("wheelL", WHEELS[0]),
    { ...wormWheel("wheelR", WHEELS[1]), arrow: false }, // 兩個滑輪同向轉,箭頭只畫在左輪
    {
      id: "tappet",
      kind: "plate",
      shape: TAPPET,
      thickness: 0.08,
      arrow: false,
      pieces: [
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: PIN_R, length: 0.5, at: [s * ARM, PIN_Y, -0.22] })),
        // 搖臂:往上到蝸桿軸下端的軸承,頂上是重錘
        { kind: "box", size: [0.07, POST, 0.06], at: [0, POST / 2, 0] },
        { kind: "cylinder", radius: 0.13, inner: 0.09, length: 0.08, axis: Y, at: [0, POST, 0] }, // 軸承留了間隙:搖臂擺的角度比蝸桿軸大
        { kind: "sphere", radius: 0.07, at: [0, POST - 0.15, 0.08] },
      ],
    },
    { id: "rope", kind: "rope", radius: 0.015 },
    bucketPart("bucketL"),
    bucketPart("bucketR"),
    { id: "waterL", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "waterR", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.55, 0], size: [2.4, 0.5, 0.9], level: 1 },
  ],
  // 動力重演:撥爪鉸在鉸座上,只受重力與水桶提把、蝸桿軸(套在搖臂頂的軸承裡)的碰撞。
  // 只重演第一次換邊(左桶升到頂那幾圈):零件多,整段重演太慢
  replay: {
    from: 13,
    to: 16.5,
    seconds: 4,
    free: { tappet: { pivot: PIVOT } },
    expect: [
      { at: 13.6, part: "tappet", label: "左桶還沒碰到撞銷,撥爪倒向左邊不動" },
      { part: "tappet", label: "左桶到頂頂起撥爪,撥爪越過中點翻到另一邊", quote: "水桶上升時會撞擊到它" },
    ],
  },
  powered: ["windmill"], // 外力來源:風推著風車轉
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.6 },
  targets: ["bucketL", "bucketR"],
  view: { direction: [0.12, 0.15, 1] },
  pose(v) {
    const w = TAU * v; // 風車的轉角
    const l = lift(w);
    const { shift, tilt } = worm(l.beta);
    // 蝸桿只在被咬住的那個輪上推:被咬住的輪轉,滑輪經繩子帶著另一個輪一起轉
    const hang = (s, y) => [s * ROPE_X, y + 0.28, -0.25];
    const over = Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI - (Math.PI * i) / 8; // 左滑輪:從外側往上繞到頂
      return [WHEELS[0][0] + DRUM_R * Math.cos(a), WHEELS[0][1] + DRUM_R * Math.sin(a), -0.25];
    });
    const overR = over.map(([x, y, z]) => [-x, y, z]).reverse();
    return {
      parts: {
        windmill: { angle: w },
        worm: { position: JOINT, rotation: quatMul(quatAxisAngle(Z, tilt), quatMul(quatFromZ(Y), quatAxisAngle([0, 0, 1], w))) },
        wheelL: { angle: l.drum },
        wheelR: { angle: l.drum },
        tappet: { position: PIVOT, angle: l.beta },
        bucketL: { position: [-ROPE_X, l.left, -0.25] },
        bucketR: { position: [ROPE_X, l.right, -0.25] },
        waterL: { position: [-ROPE_X, l.left, -0.25], level: l.leftUp && !l.atTop ? 0.85 : 0 },
        waterR: { position: [ROPE_X, l.right, -0.25], level: !l.leftUp && !l.atTop ? 0.85 : 0 },
      },
      paths: { rope: { points: [hang(-1, l.left), ...over, ...overR, hang(1, l.right)], closed: false, phase: 0 } }, // 路徑從繩端(左桶)起算
      readouts: [{ label: "蝸桿咬著", value: l.engaged === 0 ? "左輪:左桶上升(滿)、右桶下降" : l.engaged === 1 ? "右輪:右桶上升(滿)、左桶下降" : "換邊中" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["worm", "wheelL"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、蝸輪是直齒,齒頂伸進蝸桿的芯 0.09" },
    { check: "interference", parts: ["worm", "wheelR"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、蝸輪是直齒,齒頂伸進蝸桿的芯 0.04" },
  ],
};
