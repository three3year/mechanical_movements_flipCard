// 第 364 種:繞直角軸的連續旋轉產生間歇旋轉。左邊的小輪是主動件,輪緣上一圈徑向凸柱,柱端裝著摩擦滾子;
// 右邊較大的輪(軸是鉛直的,原圖從側面看到它的輪緣)的表面有一圈傾斜的溝槽(凸棱)。小輪每轉過一根凸柱,
// 它的滾子就推著一道斜棱的側面走過,大輪轉過一格;滾子之間的空檔,大輪停住。主動件是小輪。
// 由接觸算:滾子在大輪最左的那條母線上往下走,斜棱是一道斜面——滾子的側面貼著斜棱,滾子降多少,
// 斜棱就被推開多少,大輪轉角與滾子的高度成正比;接觸點走到斜棱下端後,滾子再推著下端(圓頭)直到從旁邊讓過去,
// 兩段合起來推一格(斜棱從下端到上端剛好跨一格);滾子離開斜棱的高度範圍(斜棱的上下端之外)時大輪停住,
// 等下一根凸柱的滾子從上面進來。
// 照原圖(2026-10-14 決定 (b)):大輪半徑約是凸柱伸出長度的 1.5 倍,一圈 12 道斜棱、每道從下端斜到上端跨一格(30°),
// 小輪每根凸柱推一格,轉一圈推 8 格(2/3 圈)。斜棱沿輪面的螺旋線走(攤平後是一條直線)。
// 偏離插圖:原圖的斜溝從輪面下緣斜到上緣;照那樣滾子在輪高範圍內走過的角度比凸柱間距大,下一根滾子在上一根離開前
// 就進來,大輪幾乎不停,演不出原文的「間歇」,所以斜棱只占輪面中段。
// 推斷:凸柱數(依原圖八根);兩根軸的軸承座(原圖沒畫)。
import { Y, Z, TAU } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const SMALL = { center: [-2.0, 0, 0], r: 0.75, studs: 8, reach: 1.25 };
const ROLLER = 0.08; // 滾子半徑
const ROLLER_LEN = 0.22;
const BIG_R = 1.9; // 約凸柱伸出長度(1.25)的 1.5 倍
// 大輪最左的母線離滾子的外端 0.005(滾子走到正中時最接近)
const BIG = { center: [SMALL.center[0] + SMALL.reach + ROLLER_LEN / 2 + 0.005 + BIG_R, 0, 0], r: BIG_R, height: 1.8, ribs: 12 };
export const STEP = TAU / BIG.ribs;
const BAND = 0.3; // 斜棱的上下端(相對大輪中心的高度):斜棱只占輪面中段,滾子走過它的那段之外大輪停住(間歇)
// 斜棱的粗細與中心半徑:滾子的軸隨小輪轉而斜,走到斜棱上下端時滾子外端比走到正中時退回約 0.05;斜棱凸出輪面
// 夠高,滾子在整段斜棱上都是側面貼著斜棱的中段(不是外端的邊擦過斜棱的頂)。斜棱的內緣埋進輪面 0.005
const TUBE = 0.07;
const RIB_R = BIG.r + TUBE - 0.005;
const POST_Z = BIG.r + 0.3; // 大輪立軸托架的立柱在大輪後面的深度
// 斜棱在最左母線上的斜率(橫向位移 / 高度)
const SLOPE = (RIB_R * STEP) / (2 * BAND);
// 滾子的軸是徑向的、隨小輪轉而斜:接觸處(斜棱中心線所在的那個鉛直面,離小輪中心 D)滾子軸的高度是 D·tan φ
const D = BIG.center[0] - RIB_R - SMALL.center[0];
// 在那個面上看:滾子(加上斜棱的粗細)是半徑 RHO 的圓,沿斜棱的法向量 (NZ, NY) 碰到斜棱的中心線,
// 接觸點比滾子軸低 DELTA
const RHO = ROLLER + TUBE;
const NZ = 1 / Math.hypot(1, SLOPE);
const NY = SLOPE / Math.hypot(1, SLOPE);
const DELTA = RHO * NY;
// 一根滾子推一格分兩段:先貼著斜棱的側面往下走(接觸點走到斜棱下端為止),再推著斜棱的下端(圓頭)直到滾子軸和下端
// 一樣高、滾子從下端旁邊讓過去;兩段合起來斜棱橫移 RIB_R·STEP。後一段斜棱橫移 END_Z
const END_Z = RHO * (1 - NZ);
const Y_LOW = -BAND + DELTA; // 貼著側面那段結束時滾子軸的高度(接觸點在斜棱下端)
const Y_TOP = Y_LOW + 2 * BAND - END_Z / SLOPE; // 滾子碰上斜棱時滾子軸的高度(接觸點在斜棱上端稍下)
// 貼著側面時,斜棱中心線在滾子軸那個高度離滾子軸的橫向距離;滾子在那個面上的截面其實是上下長 1/cos φ 倍的橢圓,
// 取 φ 最大時(斜棱上端)的值,全程不穿入
const PHI_TOP = Math.atan(Y_TOP / D);
const PHI_END = Math.atan(-BAND / D);
const OFFSET = ROLLER * Math.hypot(1, SLOPE / Math.cos(PHI_TOP)) + TUBE * Math.hypot(1, SLOPE);
// 大輪轉角 B 時,第 i 道斜棱在高度 h 的最左母線上的橫向位置 = RIB_R·(i·STEP + STEP·(h + BAND)/(2·BAND) + B − π);
// 滾子在 Y_TOP 碰上它時這個值等於 OFFSET。取 B0 讓起始的轉角在 0 附近
const B_TOP = Math.PI + OFFSET / RIB_R - (STEP * (Y_TOP + BAND)) / (2 * BAND);
const B0 = B_TOP - Math.round(B_TOP / STEP) * STEP;
export const PUSH = PHI_TOP - PHI_END; // 一根滾子推一格所走的小輪轉角

/** 小輪轉 theta(順時針為負)→ 大輪的轉角、正推著的滾子(軸)的高度(沒推時 null) */
export function drive(theta) {
  const per = TAU / SMALL.studs;
  const t = -theta + PHI_TOP;
  const k = Math.floor(t / per);
  const u = t - k * per;
  if (u > PUSH) return { angle: B0 + (k + 1) * STEP, y: null };
  const y = D * Math.tan(PHI_TOP - u); // 由上往下
  if (y >= Y_LOW) return { angle: B0 + (k + (Y_TOP - y) / (2 * BAND)) * STEP, y };
  // 推著斜棱的下端:下端離滾子軸的橫向距離 = √(RHO² − 高度差²)
  const end = (Math.sqrt(RHO * RHO - (y + BAND) ** 2) - RHO * NZ) / RIB_R;
  return { angle: B0 + (k + (Y_TOP - Y_LOW) / (2 * BAND)) * STEP + end, y };
}
export const bigAngle = (theta) => drive(theta).angle;

// 小輪:圓盤+八根徑向凸柱與柱端的滾子
const studs = Array.from({ length: SMALL.studs }, (_, i) => {
  const a = (i * TAU) / SMALL.studs;
  return [
    { kind: "box", size: [SMALL.reach - SMALL.r + 0.1, 0.1, 0.1], at: [((SMALL.r + SMALL.reach) / 2) * Math.cos(a), ((SMALL.r + SMALL.reach) / 2) * Math.sin(a), 0], angle: a },
    { kind: "cylinder", radius: ROLLER, length: ROLLER_LEN, axis: [Math.cos(a), Math.sin(a), 0], at: [SMALL.reach * Math.cos(a), SMALL.reach * Math.sin(a), 0], accent: i === 0 },
  ];
}).flat();
// 大輪輪緣上的斜棱(局部:軸沿 z,斜棱從下緣斜上到上緣)
const ribs = Array.from({ length: BIG.ribs }, (_, i) => {
  const a = (i * TAU) / BIG.ribs;
  // 斜棱從下端到上端跨一格(STEP),沿半徑 RIB_R 的螺旋線走、粗 TUBE、上下端在 ±BAND——和 drive() 的接觸計算用同一組數
  const points = Array.from({ length: 9 }, (_, k) => {
    const t = k / 8;
    return [RIB_R * Math.cos(a + t * STEP), RIB_R * Math.sin(a + t * STEP), -BAND + 2 * BAND * t];
  });
  return { kind: "tube", points, radius: TUBE, accent: i === 0 };
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
          { kind: "box", size: [0.2, 0.2, POST_Z - 0.15], at: [BIG.center[0], y, -(POST_Z + 0.15) / 2] },
        ]),
        // 立柱在大輪後面(離輪緣 0.3)
        { kind: "box", size: [0.25, 4.15, 0.25], at: [BIG.center[0], -0.225, -POST_Z] },
        { kind: "box", size: [BIG.center[0] + 0.35 - (SMALL.center[0] - 0.6), 0.18, POST_Z + 0.3], at: [(BIG.center[0] + 0.35 + SMALL.center[0] - 0.6) / 2, -2.39, -(POST_Z + 0.3) / 2 + 0.15] },
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
      { part: "big", label: "小輪轉一圈:八根凸柱各推一格,大輪轉過三分之二圈" },
    ],
  },
  driver: { part: "small", type: "rotation", speed: -0.8 },
  target: "big", // 間歇轉動的大輪
  view: { direction: [0.03, 0.12, 1] },
  pose(theta) {
    return { parts: { small: { angle: theta }, big: { angle: bigAngle(theta) } }, readouts: [] };
  },
};
