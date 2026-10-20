// 第 459 種:水井用的往復式升降機。上面是裝在軸上的水平風車輪,軸上有螺紋(蝸桿)。軸的接頭容許些微擺動,
// 讓蝸桿一次只咬一個蝸輪。蝸輪後面有滑輪,繩子繞過滑輪,兩端各掛一個水桶。中間是一個撥爪,水桶上升時撞到它,
// 經一根搖臂(蝸桿與軸的軸承就裝在搖臂上)把蝸桿從一個輪移到另一個輪,於是倒完水的水桶被放下,另一個被抬起。
// 主動件是虛擬的「進程」:風已帶著風車轉了幾圈(風車照全書的慣例由風推動,第 485、486 種相同)。
// 推斷:
// - 一條繩繞過兩個滑輪的頂上,兩端各掛一個水桶;兩個滑輪一起轉。蝸桿咬左輪時滑輪順時針轉、左桶上升,
//   咬右輪時反過來(蝸桿推兩個輪的那一側方向相同,兩輪的轉向就相反)。單頭蝸桿配 12 齒的蝸輪,
//   螺距等於蝸輪的周節(風車一圈,蝸輪走一齒)。
// - 兩個蝸輪的中心距照「撥爪水平時兩輪的齒頂都剛碰到螺紋外徑」放;撥爪倒到底時蝸桿偏到咬著的輪齒頂貼著蝸桿的芯
//   (TILT 由這個接觸算出來),另一個輪的齒頂離螺紋外徑有空隙——一次只咬一個輪。
// - 撥爪鉸在中間、兩臂伸到繩的外側,臂端各有一根往後伸的撞銷;撥爪往上的立柱就是搖臂,頂上的叉托著軸承環,
//   環套著蝸桿軸的下端,蝸桿軸在上面的接頭處擺動。上升的水桶用提把頂起撞銷(由接觸算);頂到撥爪水平時蝸桿剛好
//   脫離原本的輪(嚙合深度隨撥爪被頂起而變淺,水平時是 0),立柱上的重錘使撥爪越過中點後自己加速翻到另一邊,
//   蝸桿咬進另一個輪為止;另一個輪一被咬到就開始轉,倒完水的桶隨即被放下。
// - 撥爪的鉸座吊在蝸輪軸承的橫樑下;井口在中間,兩側井壁邊各有一個水槽(原圖兩邊都畫了槽)。
// - 水桶到頂的翻倒(維護者 2026-10-20 決定照原圖翻倒):井壁頂上立一根擋鉤(推斷),鉤的底面在水桶快到頂時勾住
//   桶緣外側;提把被繩繼續拉高,桶身就繞提把的軸翻過去(桶緣貼著鉤的底面往內滑,由接觸算),到頂時翻 45°,
//   水以流體示意從桶緣倒進井壁邊的水槽;桶被放下時沿原路翻回來。桶要在圖面裡翻倒,提把的轉軸就得是前後向的,
//   所以提把的兩隻腳鉸在桶緣的前後兩側(偏離插圖:原圖的繩直接繫在桶緣上)。
import { TAU, deg, clamp, quatFromZ, quatMul, quatAxisAngle, Y, Z } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, circle, thickLine, arcPoints, gearSize } from "./shapes.js";

export const RATIO = 1 / 12; // 單頭蝸桿、12 齒的蝸輪:風車轉一圈,蝸輪轉 1/12 圈
const TEETH = 12;
export const WHEEL_R = 0.42; // 蝸輪的節圓半徑
const WHEEL_TIP = WHEEL_R + gearSize(WHEEL_R, TEETH).addendum; // 齒頂圓
export const WORM_R = 0.15; // 螺紋外徑
export const THREAD = 0.06; // 螺紋深(螺紋的斷面是半徑 THREAD 的圓,圓心在芯的表面)
export const WORM_PITCH = (TAU * WHEEL_R) / TEETH; // 螺距 = 蝸輪的周節
const WORM_Y = 0.9;
const MESH_X = WHEEL_TIP + WORM_R; // 撥爪水平(蝸桿軸鉛直)時兩輪的齒頂剛碰到螺紋外徑
export const WHEELS = [[-MESH_X, WORM_Y, 0], [MESH_X, WORM_Y, 0]]; // 兩個蝸輪(軸沿 z)
export const DRUM_R = 0.3; // 蝸輪後面的滑輪
const JOINT = [0, 2.5, 0]; // 蝸桿軸上端的接頭(風車軸在它上面,不擺動)
const SHAFT_LOW = 0.46; // 蝸桿軸的下端(套在搖臂頂的軸承裡)
export const PIVOT = [0, 0.15, 0]; // 撥爪的鉸點
const POST = SHAFT_LOW - PIVOT[1]; // 搖臂(撥爪的立柱)長
export const ARM = 1.0; // 撥爪鉸點到撞銷
export const PIN_R = 0.03;
export const PIN_Y = 0.06; // 撞銷在撥爪臂上微微翹起的高度
const BUCKET_Z = -0.25; // 水桶、繩所在的深度
export const ROPE_X = WHEELS[1][0] + DRUM_R; // 兩條繩垂在滑輪外側
export const HANDLE = 0.295; // 提把的頂離水桶中心
export const LIP_R = 0.23; // 桶緣的半徑(桶口)
export const LIP_H = 0.22; // 桶緣離水桶中心的高度;提把鉸在這個高度
export const TOP = PIVOT[1] + PIN_Y - PIN_R - HANDLE; // 水桶升到這裡時剛好把撥爪頂到水平
export const BOTTOM = -2.4; // 水桶在井底(水裡)
const STROKE = TOP - BOTTOM;
export const MOVE = STROKE / (RATIO * DRUM_R); // 一程的風車轉角
const FALL = 2.0; // 撥爪越過中點後翻到另一邊所佔的風車轉角
// 到頂的水桶被擋鉤勾住翻倒:到頂時翻 TIP_MAX,所以鉤在桶升到 CATCH 時勾住桶緣(桶緣離鉤底 LIP_R·sin TIP_MAX 的行程翻完)
export const TIP_MAX = deg(45);
export const CATCH = TOP - LIP_R * Math.sin(TIP_MAX);
export const HOOK_Y = CATCH + LIP_H; // 擋鉤的底面
export const HOOK_X = [1.06, 1.33]; // 擋鉤底面蓋住的範圍(離中線的距離;桶緣翻倒時從 ROPE_X + LIP_R 往內滑到 ROPE_X + LIP_R·cos TIP_MAX)
export const TROUGH = { x0: 1.445, x1: 1.8, y0: -0.55, y1: -0.25 }; // 水槽的內腔(離中線的距離、高度)
const TROUGH_WALL = 0.05;

/** 撥爪轉 beta → 搖臂頂(蝸桿軸下端)的橫移與蝸桿軸的傾角 */
export function worm(beta) {
  const shift = -POST * Math.sin(beta);
  return { shift, tilt: Math.atan2(shift, JOINT[1] - SHAFT_LOW) };
}
/** 撥爪轉 beta 時,蝸輪 k(0 左、1 右)的齒頂圓離螺紋外徑的間隙(負的是齒頂伸進螺紋的深度) */
export function wormGap(beta, k) {
  const { shift } = worm(beta);
  const ux = shift;
  const uy = SHAFT_LOW - JOINT[1];
  const len = Math.hypot(ux, uy);
  const [cx, cy] = WHEELS[k];
  const dist = Math.abs((cx - JOINT[0]) * uy - (cy - JOINT[1]) * ux) / len;
  return dist - WHEEL_TIP - WORM_R;
}
/** 撥爪擺到底的角度(逆時針為正:右臂往上、立柱頂往左):蝸桿偏到咬著的輪齒頂貼著蝸桿的芯為止(由接觸算) */
export const TILT = (() => {
  let [lo, hi] = [0, deg(40)];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (wormGap(mid, 0) > -THREAD) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** 撥爪被上升的水桶(提把頂在 y)頂起時的轉角大小 */
const pushed = (y) => clamp(Math.asin(clamp((PIVOT[1] + PIN_Y - PIN_R - (y + HANDLE)) / ARM, -1, 1)), 0, TILT);
/** 水桶中心升到 y 時桶身繞提把的軸翻倒的角度(桶緣勾在擋鉤底面:LIP_R·sin(角) = 提把比勾住時多升的高度) */
const tipAngle = (y) => Math.asin(clamp((y - CATCH) / LIP_R, 0, 1));

/**
 * 風車轉角 w → 水桶的位置(左桶高度)、撥爪轉角、被咬住的蝸輪、走向
 * 偶數段:撥爪倒向左邊(逆時針)、蝸桿咬左輪、左桶從井底升到頂;快到頂時提把頂起撥爪,到頂時撥爪水平、蝸桿脫開左輪。
 * 下一段開頭:重錘把撥爪翻向另一邊(越過中點後加速,FALL 內翻到底),蝸桿咬進右輪,右桶上升、左桶被放下。
 */
export function lift(w) {
  const n = Math.floor(w / MOVE);
  const f = w - n * MOVE;
  const leftUp = ((n % 2) + 2) % 2 === 0;
  const s = leftUp ? 1 : -1; // 這一段撥爪倒向哪一邊
  const rising = BOTTOM + f * RATIO * DRUM_R;
  const push = pushed(rising); // 上升的桶頂著撞銷時撥爪只能倒到這裡
  const fall = TILT * Math.min(1, f / FALL) ** 2; // 段首重錘把撥爪翻過來的進度
  const beta = s * Math.min(push, fall);
  const pushing = push < TILT - 1e-9 && push <= fall;
  const left = leftUp ? rising : TOP + BOTTOM - rising;
  // 繩繞過兩個滑輪的頂上:左桶上升時滑輪順時針轉
  const drum = -(left - BOTTOM) / DRUM_R;
  return { left, right: TOP + BOTTOM - left, leftUp, engaged: leftUp ? 0 : 1, beta, drum, pushing, rising, tilt: tipAngle(rising) };
}

/** 水桶(側 side:−1 左、+1 右)中心在 y、翻倒 tilt 時,勾在擋鉤上那一點桶緣(外側)的位置 */
export const lipOf = (side, y, tilt) => [side * (ROPE_X + LIP_R * Math.cos(tilt)), y + LIP_H - LIP_R * Math.sin(tilt)];
/** 倒水的路徑:從桶緣往外側拋出,落進井壁邊的水槽 */
export const pourPath = (side, [x, y]) => [[x, y, BUCKET_Z], [x + side * 0.15, y + 0.02, BUCKET_Z], [x + side * 0.3, y - 0.08, BUCKET_Z], [x + side * 0.45, y - 0.25, BUCKET_Z], [x + side * 0.55, y - 0.45, BUCKET_Z]];

const wormWheel = (id, at) => ({
  id,
  kind: "group",
  center: at,
  spin: WHEEL_R + 0.1,
  pieces: [
    { kind: "gear", teeth: TEETH, radius: WHEEL_R, width: 0.12 },
    { kind: "cylinder", radius: DRUM_R, length: 0.25, at: [0, 0, -0.25] },
    { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.2] },
  ],
});
// 桶身:桶緣前後各一根鉸銷(插在提把腳的孔裡),桶身繞這條前後向的軸翻倒
const bucketPart = (id) => ({
  id,
  kind: "group",
  arrow: false,
  pieces: [
    { kind: "lathe", axis: Y, profile: [[0.18, -0.22], [LIP_R, LIP_H], [0.2, LIP_H], [0.15, -0.18], [0, -0.18], [0, -0.22]] },
    ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.015, length: 0.08, at: [0, LIP_H, s * 0.24] })),
  ],
});
// 提把:頂上一根前後向的橫樑(繩繫在中央、頂撞銷的就是它),兩隻腳垂到桶緣前後的鉸銷上(腳的下端畫圓、開鉸孔)
const BAIL_LEG = shape([...arcPoints(0.025, Math.PI, TAU, 0, LIP_H), [0.025, HANDLE], [-0.025, HANDLE]], [circle(0.016, 0, LIP_H).reverse()]);
const bailPart = (id) => ({
  id,
  kind: "group",
  arrow: false,
  pieces: [{ kind: "box", size: [0.03, 0.03, 0.56], at: [0, 0.28, 0] }, ...[-1, 1].map((s) => ({ kind: "plate", shape: BAIL_LEG, thickness: 0.03, at: [0, 0, s * 0.265] }))],
});
// 撥爪:兩臂微微上翹,臂端各一根往後伸的撞銷;中間往上的立柱是搖臂,頂上的叉托著蝸桿軸的軸承環,下面掛著重錘
const TAPPET = shape(thickLine([[-ARM, PIN_Y], [0, 0], [ARM, PIN_Y]], 0.08), [circle(0.035).reverse()]);
// 水槽:開口朝上的 U 形(側 s),外側 TROUGH.x1 + 壁、內側貼著井壁外面
const troughShape = (s) => {
  const o = [TROUGH.x0 - TROUGH_WALL, TROUGH.x1 + TROUGH_WALL];
  const pts = [[o[0], TROUGH.y0 - TROUGH_WALL], [o[1], TROUGH.y0 - TROUGH_WALL], [o[1], TROUGH.y1], [TROUGH.x1, TROUGH.y1], [TROUGH.x1, TROUGH.y0], [TROUGH.x0, TROUGH.y0], [TROUGH.x0, TROUGH.y1], [o[0], TROUGH.y1]].map(([x, y]) => [s * x, y]);
  return shape(s > 0 ? pts : pts.reverse());
};
const GROUND_Y = -0.6; // 地面與井壁的頂
const HOOK_TOP = HOOK_Y + 0.04;

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
        // 地面、井口(中間)、兩側井壁邊的水槽
        { kind: "box", size: [1.2, 0.2, 1.2], at: [-2.0, GROUND_Y - 0.1, 0] },
        { kind: "box", size: [1.2, 0.2, 1.2], at: [2.0, GROUND_Y - 0.1, 0] },
        { kind: "box", size: [0.15, 2.3, 1.0], at: [-1.32, -1.75, 0] },
        { kind: "box", size: [0.15, 2.3, 1.0], at: [1.32, -1.75, 0] },
        ...[-1, 1].map((s) => ({ kind: "plate", shape: troughShape(s), thickness: 0.6 })),
        // 擋鉤(推斷):井壁頂上立一根柱,頂上往內伸一段,底面勾住到頂的水桶的桶緣
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.05, HOOK_TOP - GROUND_Y, 0.05], at: [s * (HOOK_X[1] - 0.025), (HOOK_TOP + GROUND_Y) / 2, BUCKET_Z] },
          { kind: "box", size: [HOOK_X[1] - HOOK_X[0], HOOK_TOP - HOOK_Y, 0.05], at: [(s * (HOOK_X[0] + HOOK_X[1])) / 2, (HOOK_TOP + HOOK_Y) / 2, BUCKET_Z] },
        ]),
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
    // 蝸桿軸與蝸桿:從接頭往下,在接頭處擺動(局部 z 沿軸往上、原點在接頭);軸的下端收在搖臂頂的軸承環裡
    {
      id: "worm",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [0.14, 0.14, 0.08], at: [0, 0, -0.04] }, // 接頭的下半(容許蝸桿軸些微擺動)
        { kind: "cylinder", radius: 0.06, length: JOINT[1] - SHAFT_LOW + 0.02, at: [0, 0, -(JOINT[1] - SHAFT_LOW + 0.02) / 2] },
        { kind: "worm", radius: WORM_R, length: 0.7, pitch: WORM_PITCH, thread: THREAD, at: [0, 0, -(JOINT[1] - WORM_Y)] },
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
        // 搖臂:往上到蝸桿軸下端的軸承,頂上是叉托著軸承環,環下面掛著重錘
        { kind: "box", size: [0.07, POST, 0.06], at: [0, POST / 2, 0] },
        { kind: "box", size: [0.3, 0.06, 0.08], at: [0, POST - 0.07, 0] }, // 叉:托住軸承環的底
        { kind: "cylinder", radius: 0.13, inner: 0.09, length: 0.08, axis: Y, at: [0, POST, 0] }, // 軸承環留了間隙:搖臂擺的角度比蝸桿軸大
        { kind: "sphere", radius: 0.07, at: [0, POST - 0.15, 0.08] },
      ],
    },
    { id: "rope", kind: "rope", radius: 0.015 },
    bailPart("bailL"),
    bailPart("bailR"),
    bucketPart("bucketL"),
    bucketPart("bucketR"),
    { id: "waterL", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "waterR", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.55, 0], size: [2.4, 0.5, 0.9], level: 1 },
  ],
  // 動力重演:撥爪鉸在鉸座上,只受重力與水桶提把、蝸桿軸(套在搖臂頂的軸承裡)的碰撞。
  // 只重演第一次換邊(左桶升到頂那幾圈):零件多,整段重演太慢
  replay: {
    from: 12.3,
    to: 16.5,
    seconds: 5,
    free: { tappet: { pivot: PIVOT } },
    expect: [
      { at: 12.8, part: "tappet", label: "左桶還沒碰到撞銷,撥爪倒向左邊不動" },
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
    const { tilt } = worm(l.beta);
    // 蝸桿只在被咬住的那個輪上推:被咬住的輪轉,滑輪經繩子帶著另一個輪一起轉
    const hang = (s, y) => [s * ROPE_X, y + 0.28, BUCKET_Z];
    const over = Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI - (Math.PI * i) / 8; // 左滑輪:從外側往上繞到頂
      return [WHEELS[0][0] + DRUM_R * Math.cos(a), WHEELS[0][1] + DRUM_R * Math.sin(a), BUCKET_Z];
    });
    const overR = over.map(([x, y, z]) => [-x, y, z]).reverse();
    const parts = {
      windmill: { angle: w },
      worm: { position: JOINT, rotation: quatMul(quatAxisAngle(Z, tilt), quatMul(quatFromZ(Y), quatAxisAngle([0, 0, 1], w))) },
      wheelL: { angle: l.drum },
      wheelR: { angle: l.drum },
      tappet: { position: PIVOT, angle: l.beta },
    };
    const flows = [];
    for (const [side, id] of [[-1, "L"], [1, "R"]]) {
      const y = side < 0 ? l.left : l.right;
      const rising = (side < 0) === l.leftUp;
      const tip = tipAngle(y); // 桶在擋鉤的高度以上就被勾著:上升時翻過去,放下時沿原路翻回來
      // 提把垂直掛在繩上;桶身繞提把的軸(桶緣高度)翻倒,翻向外側的水槽(左桶逆時針、右桶順時針)
      const angle = -side * tip;
      parts[`bail${id}`] = { position: [side * ROPE_X, y, BUCKET_Z] };
      const body = [side * ROPE_X + LIP_H * Math.sin(angle), y + LIP_H - LIP_H * Math.cos(angle), BUCKET_Z];
      parts[`bucket${id}`] = { position: body, angle };
      // 上升的桶是滿的,被勾住翻倒時水隨翻倒的角度倒掉;放下的桶是空的
      parts[`water${id}`] = { position: body, angle, level: rising ? 0.85 * (1 - Math.sin(tip) / Math.sin(TIP_MAX)) : 0 };
      if (rising && tip > deg(5)) flows.push({ fluid: "water", points: stream(pourPath(side, lipOf(side, y, tip)), w * 0.15, { spacing: 0.1 }) });
    }
    const up = l.leftUp ? "左" : "右";
    return {
      parts,
      flows,
      paths: { rope: { points: [hang(-1, l.left), ...over, ...overR, hang(1, l.right)], closed: false, phase: 0 } }, // 路徑從繩端(左桶)起算
      readouts: [
        { label: "蝸桿咬著", value: l.engaged === 0 ? "左輪:左桶上升(滿)、右桶下降" : "右輪:右桶上升(滿)、左桶下降" },
        { label: "水桶", value: l.tilt > 0 ? `${up}桶到頂被擋鉤勾住翻倒,水倒進水槽` : l.pushing ? `${up}桶的提把頂著撥爪的撞銷` : `${up}桶上升中` },
      ],
    };
  },
  waivers: [
    // 右輪在取樣的那一程裡沒被咬到(取樣只到第一次換邊前),所以沒有對應的豁免
    { check: "interference", parts: ["worm", "wheelL"], reason: "簡化齒形:實體驗證把螺紋當成外徑 0.15 的實心圓柱,咬著時齒頂伸進螺紋外徑一個螺紋深 0.06" },
  ],
};
