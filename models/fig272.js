// 第 272 種:斜面圓盤凸輪。圓盤斜裝在水平軸上,一根斜向的桿由兩個導套導引,桿端靠在圓盤頂部的圓周上;
// 軸轉動時,斜盤的盤緣在桿端處前後擺,把桿推出又讓它退回,得到往復的直線運動。主動件是軸,斜盤和軸一起轉(抓取處)。
// 桿端照原文「靠在其圓周上」(原圖也是桿端靠在圓盤頂部的邊緣):桿端的圓頭和盤的圓周(厚 THICK 的那一圈,含兩個邊角)
// 算距離,桿沿自己的方向退到圓頭剛好碰到盤為止(由接觸算)。桿斜 145°(照原圖);盤緣在這個方向上的起伏比盤面小,
// 所以行程比靠在盤面上時短:盤頂朝桿那一側擺過來時,朝桿那一側的邊角把桿推出;擺開時桿靠自重跟著退;
// 盤頂擺到桿這一側的那段(約三分之一圈),圓頭停在盤緣頂上的圓周面上,桿幾乎不動。
// 推斷:桿端由重力保持貼在盤上(原文只說「靠在其圓周上」;桿斜向上伸,自重把桿端壓向盤);桿端是一顆圓頭;
// 圓盤的傾角;軸兩端的軸承座、托著兩個導套的連接板與支柱、底板。原圖的導套畫成桿兩側的斜線剖面,是剖開的方框導套:
// 這裡做成四片板圍成的方框,桿在方孔裡滑。原圖的軸轂緊貼在圓盤右面:做成斜盤的輪轂,一端埋在盤裡、另一端伸出盤面,
// 把斜盤固定在軸上。
import { X, Z, deg, dot, quatMul, quatAxisAngle, quatFromZ, quatRotate, scale } from "./kit.js";
import { pushUntilClear } from "./contact.js";

const R = 1.3;
const TILT = deg(12); // 盤面與垂直面的夾角
const THICK = 0.32;
const ROD_ANGLE = deg(145); // 桿的方向(從桿端往上的方向,與 +x 的夾角;照原圖)
const U = [Math.cos(ROD_ANGLE), Math.sin(ROD_ANGLE), 0]; // 桿沿這個方向伸出
const V = [-Math.sin(ROD_ANGLE), Math.cos(ROD_ANGLE), 0]; // 桿所在平面上和桿垂直的方向
const BALL = 0.2; // 桿端圓頭的半徑
const ROD = 0.2; // 桿的方形截面邊長
const Q = [0, 1.31, 0]; // 桿的中心線通過這一點(圓頭的中心全程離盤軸至少 R:碰到的是圓周,不是盤面)
const at = (s, v = 0, z = 0) => [Q[0] + U[0] * s + V[0] * v, Q[1] + U[1] * s + V[1] * v, z]; // 桿的座標 → 世界

/** 軸轉 theta:斜盤的朝向(盤的局部 z = 盤面法線,先從軸偏 TILT,再隨軸轉) */
const discRotation = (theta) => quatMul(quatAxisAngle(X, theta), quatMul(quatAxisAngle(Z, TILT), quatFromZ(X)));
const normal = (theta) => quatRotate(discRotation(theta), Z);

/** 點 p 到斜盤(半徑 R、厚 THICK 的實心圓柱)的距離;在盤裡面時是負的 */
function discDistance(p, theta) {
  const a = dot(normal(theta), p);
  const r = Math.sqrt(Math.max(0, dot(p, p) - a * a));
  const dr = Math.max(r - R, 0);
  const da = Math.max(Math.abs(a) - THICK / 2, 0);
  return dr === 0 && da === 0 ? -Math.min(R - r, THICK / 2 - Math.abs(a)) : Math.hypot(dr, da);
}

/** 軸轉 theta:桿沿自身方向的位置 t(圓頭中心在 Q + t·U)。桿從遠處沿 −U 落下,停在圓頭剛好碰到盤的地方 */
export function rodTravel(theta) {
  const overlaps = (t) => discDistance(at(t), theta) < BALL;
  const STEP = 0.02;
  let t = 1.5; // 這裡圓頭一定碰不到盤
  while (!overlaps(t - STEP)) t -= STEP;
  return pushUntilClear(t - STEP, 1, STEP, overlaps);
}

// 輪轂:和軸同軸(在盤的局部座標裡是軸 X 轉回去的方向),內端在盤心、外端伸出盤的右面
const HUB = { radius: 0.32, length: 0.55 };
const hubAxis = (() => {
  const [x, y, z, w] = discRotation(0);
  return quatRotate([-x, -y, -z, w], X);
})();

// 導套:四片板圍成的方框(中間是桿的方孔,留 0.01 的間隙),沿桿的方向放在桿的座標 s 處
const WALL = 0.06;
const HOLE = ROD / 2 + 0.01; // 方孔的半寬
const OUT = HOLE + WALL; // 方框外緣的半寬
const GUIDES = [0.85, 2.0];
const guide = (s) => [
  ...[1, -1].map((k) => ({ kind: "box", size: [0.3, WALL, 2 * OUT], at: at(s, k * (HOLE + WALL / 2)), angle: ROD_ANGLE })),
  ...[1, -1].map((k) => ({ kind: "box", size: [0.3, 2 * HOLE, WALL], at: at(s, 0, k * (HOLE + WALL / 2)), angle: ROD_ANGLE })),
];
const BOARD_Z = -OUT - 0.05; // 連接板的中心(前面貼著導套的背面)
const BASE_TOP = -1.7;
const POST_TOP = at(GUIDES[0])[1];

export default {
  figure: 272,
  parts: [
    { id: "shaft", kind: "cylinder", axis: X, radius: 0.1, length: 3.6, mark: true, spin: 0.45, spinOffset: 1.05 },
    {
      id: "disc",
      kind: "plate",
      shape: { outline: Array.from({ length: 64 }, (_, i) => [R * Math.cos((i / 64) * 2 * Math.PI), R * Math.sin((i / 64) * 2 * Math.PI)]), holes: [] },
      thickness: THICK,
      mark: [R - 0.15, 0],
      markSize: 0.08,
      // 輪轂(和軸同軸,內端埋在盤裡,外端伸出盤的右面):把斜盤固定在軸上
      pieces: [{ kind: "cylinder", axis: hubAxis, radius: HUB.radius, length: HUB.length, at: scale(hubAxis, HUB.length / 2) }],
    },
    {
      id: "rodGuides",
      kind: "group",
      pieces: [
        ...GUIDES.flatMap(guide),
        // 兩個導套背面的連接板、往下落到底板的支柱、軸兩端的軸承座、底板(推斷)
        { kind: "box", size: [GUIDES[1] - GUIDES[0] + 0.3, 2 * OUT, 0.1], at: at((GUIDES[0] + GUIDES[1]) / 2, 0, BOARD_Z), angle: ROD_ANGLE },
        { kind: "box", size: [0.2, POST_TOP - BASE_TOP, 0.1], at: [at(GUIDES[0])[0], (POST_TOP + BASE_TOP) / 2, BOARD_Z] },
        ...[-1.6, 1.6].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.24, inner: 0.1, length: 0.25, at: [x, 0, 0] },
          { kind: "box", size: [0.25, 1.53, 0.3], at: [x, -0.95, 0] },
        ]),
        { kind: "box", size: [4.0, 0.12, 1.2], at: [0, -1.76, -0.1] },
      ],
    },
    // 桿:方形截面的桿身,端頭是圓頭(桿身的四個邊角都包在圓頭裡)
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [2.75, ROD, ROD], at: [0.1 + 2.75 / 2, 0, 0] }, { kind: "sphere", radius: BALL }] },
  ],
  driver: { part: "shaft", type: "rotation", grips: ["disc"] },
  target: "rod", // 往復的桿
  view: { direction: [0.1, 0.12, 1] },
  pose(theta) {
    return {
      parts: {
        shaft: { angle: theta },
        disc: { rotation: discRotation(theta) },
        rod: { position: at(rodTravel(theta)), angle: ROD_ANGLE },
      },
      readouts: [],
    };
  },
  // 動力重演:只轉軸;桿在導套的方孔裡沿自己的方向滑、受重力,桿端的圓頭被盤的圓周推出又靠自重退回
  replay: {
    seconds: 12,
    free: { rod: { slide: U } },
    expect: [
      { at: (2 * Math.PI) / 3, part: "rod", label: "斜盤轉三分之一圈,盤緣擺開,桿靠自重跟著退" },
      { at: Math.PI, part: "rod", label: "轉半圈,桿退到最低處", quote: "斜面圓盤凸輪的旋轉運動,會賦予靠在其圓周上的桿一種往復直線運動" },
      { at: (4 * Math.PI) / 3, part: "rod", label: "再轉六分之一圈,圓周的邊角把桿推回" },
      { at: 2 * Math.PI, part: "rod", label: "轉一圈回到原位" },
    ],
  },
};
