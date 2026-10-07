// 第 364 種:繞直角軸的連續旋轉產生間歇旋轉。左邊的小輪是主動件,輪緣上一圈徑向凸柱,柱端裝著摩擦滾子;
// 右邊較大的輪(軸是鉛直的,原圖從側面看到它的輪緣)的表面有一圈傾斜的溝槽(凸棱)。小輪每轉過一根凸柱,
// 它的滾子就推著一道斜棱的側面走過,大輪轉過一格;滾子之間的空檔,大輪停住。主動件是小輪。
// 由接觸算:滾子在大輪最左的那條母線上往下走,斜棱是一道斜面——滾子的側面貼著斜棱,滾子降多少,
// 斜棱就被推開多少,大輪轉角與滾子的高度成正比(斜棱從下緣到上緣剛好跨一格,滾子從上緣走到下緣推一格);
// 滾子離開斜棱的高度範圍(大輪的上下緣之外)時大輪停住,等下一根凸柱的滾子從上緣進來。
// 推斷:凸柱數(依原圖八根)與大輪上斜棱的數目;兩根軸的軸承座(原圖沒畫)。
import { Y, Z, TAU } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const SMALL = { center: [-2.0, 0, 0], r: 0.75, studs: 8, reach: 1.25 };
const BIG = { center: [0.4, 0, 0], r: 1.05, height: 1.0, ribs: 24 };
export const STEP = TAU / BIG.ribs;
const BAND = 0.28; // 斜棱的上下端(相對大輪中心的高度):斜棱只占輪面中段,滾子走過它的那段之外大輪停住(間歇)
const RIB_R = BIG.r + 0.03;
const ROLLER = 0.08; // 滾子要放得進相鄰兩道斜棱之間(垂直於斜棱量,棱距約 0.25)
const TUBE = 0.035;
// 斜棱在最左母線上的斜率(橫向位移 / 高度),滾子側面與斜棱的接觸:中心線要離滾子中心這麼遠(橫向量)
const SLOPE = (RIB_R * STEP) / (2 * BAND);
const OFFSET = (ROLLER + TUBE) * Math.hypot(1, SLOPE);
// 大輪轉角 B 時,第 i 道斜棱在高度 h 的最左母線上的橫向位置 = RIB_R·(i·STEP + STEP·(h + BAND)/(2·BAND) + B − π);
// 滾子在高度 y 推著它時這個值等於 OFFSET。取 B0 讓起始的轉角在 0 附近
const B0 = Math.PI + OFFSET / RIB_R - Math.round((Math.PI + OFFSET / RIB_R) / STEP) * STEP;
export const PHI_BAND = Math.asin(BAND / SMALL.reach); // 滾子在斜棱高度範圍內的那段小輪轉角(單邊)

/** 小輪轉 theta(順時針為負)→ 大輪的轉角、正推著的滾子高度(沒推時 null) */
export function drive(theta) {
  const per = TAU / SMALL.studs;
  const t = -theta + PHI_BAND;
  const k = Math.floor(t / per);
  const u = t - k * per;
  if (u > 2 * PHI_BAND) return { angle: B0 + (k + 1) * STEP, y: null };
  const y = SMALL.reach * Math.sin(PHI_BAND - u); // 正在接觸處的滾子的高度(由上往下)
  return { angle: B0 + (k + (BAND - y) / (2 * BAND)) * STEP, y };
}
export const bigAngle = (theta) => drive(theta).angle;

// 小輪:圓盤+八根徑向凸柱與柱端的滾子
const studs = Array.from({ length: SMALL.studs }, (_, i) => {
  const a = (i * TAU) / SMALL.studs;
  return [
    { kind: "box", size: [SMALL.reach - SMALL.r + 0.1, 0.1, 0.1], at: [((SMALL.r + SMALL.reach) / 2) * Math.cos(a), ((SMALL.r + SMALL.reach) / 2) * Math.sin(a), 0], angle: a },
    { kind: "cylinder", radius: ROLLER, length: 0.22, axis: [Math.cos(a), Math.sin(a), 0], at: [SMALL.reach * Math.cos(a), SMALL.reach * Math.sin(a), 0], accent: i === 0 },
  ];
}).flat();
// 大輪輪緣上的斜棱(局部:軸沿 z,斜棱從下緣斜上到上緣)
const ribs = Array.from({ length: BIG.ribs }, (_, i) => {
  const a = (i * TAU) / BIG.ribs;
  // 斜棱從下端到上端跨一格(STEP),半徑 RIB_R、粗 TUBE、上下端在 ±BAND——和 drive() 的接觸計算用同一組數
  return { kind: "tube", points: [[RIB_R * Math.cos(a), RIB_R * Math.sin(a), -BAND], [RIB_R * Math.cos(a + STEP), RIB_R * Math.sin(a + STEP), BAND]], radius: TUBE, accent: i === 0 };
});

export default {
  figure: 364,
  parts: [
    { id: "small", kind: "group", center: SMALL.center, spin: SMALL.reach, pieces: [{ kind: "plate", shape: shape(circle(SMALL.r), [circle(0.12).reverse()]), thickness: 0.18, circles: [0.3] }, ...studs, { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.35] }] },
    {
      // 兩根軸的軸承座:小輪的軸往後伸進軸承座;大輪的立軸上下各一個托架(推斷,原圖沒畫)
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [SMALL.center[0], SMALL.center[1]], z: -0.6, bore: 0.13, floor: -2.3 }),
        ...[1.75, -1.75].flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.25, inner: 0.11, length: 0.2, at: [BIG.center[0], y, 0] },
          { kind: "box", size: [0.2, 0.2, 1.25], at: [BIG.center[0], y, -0.725] },
        ]),
        { kind: "box", size: [0.25, 4.15, 0.25], at: [BIG.center[0], -0.225, -1.45] },
        { kind: "box", size: [2.8, 0.18, 1.9], at: [-0.8, -2.39, -0.85] },
      ],
    },
    {
      id: "big",
      kind: "group",
      axis: Y,
      center: BIG.center,
      spin: BIG.r,
      spinOffset: BIG.height / 2,
      pieces: [
        { kind: "cylinder", radius: BIG.r, length: BIG.height },
        { kind: "cylinder", radius: 0.1, length: 4.0 },
        ...ribs,
      ],
    },
  ],
  // 動力重演:只推小輪;大輪靠摩擦定位,由滾子推斜棱帶動
  replay: {
    from: 0,
    to: -TAU,
    seconds: 20,
    free: { big: { hold: true, gravity: false } },
    expect: [
      { at: -TAU / 16, part: "big", label: "一根凸柱的滾子推著斜棱往下走:大輪轉過半格", quote: "摩擦滾子作用於較大輪表面上的傾斜溝槽或凸起物的側面" },
      { part: "big", label: "小輪轉一圈:八根凸柱各推一格,大輪轉過三分之一圈" },
    ],
  },
  driver: { part: "small", type: "rotation", speed: -0.8 },
  target: "big", // 間歇轉動的大輪
  view: { direction: [0.03, 0.12, 1] },
  pose(theta) {
    return { parts: { small: { angle: theta }, big: { angle: bigAngle(theta) } }, readouts: [] };
  },
};
