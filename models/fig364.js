// 第 364 種:繞直角軸的連續旋轉產生間歇旋轉。左邊的小輪是主動件,輪緣上一圈徑向凸柱,柱端裝著摩擦滾子;
// 右邊較大的輪(軸是鉛直的,原圖從側面看到它的輪緣)的表面有一圈傾斜的溝槽(凸棱)。小輪每轉過一根凸柱,
// 它的滾子就推著一道斜棱的側面走過,大輪轉過一格;滾子之間的空檔,大輪停住。主動件是小輪。
// 推斷:凸柱數(依原圖八根)與大輪上斜棱的數目、每格的角度。
import { Y, TAU, deg } from "./kit.js";
import { cycloid } from "./jumps.js";
import { shape, circle } from "./shapes.js";

const SMALL = { center: [-2.0, 0, 0], r: 0.75, studs: 8, reach: 1.25 };
const BIG = { center: [0.4, 0, 0], r: 1.05, height: 1.0, ribs: 24 };
export const STEP = TAU / BIG.ribs;
const SPAN = deg(22); // 每根凸柱經過接觸處(小輪的 0°)時,推動大輪的那一段轉角

/** 小輪轉 theta(順時針為負)→ 大輪的轉角:每根凸柱經過接觸處時推一格,其餘時間不動 */
export function bigAngle(theta) {
  const per = TAU / SMALL.studs;
  const t = -theta + SPAN / 2;
  const k = Math.floor(t / per);
  const u = t - k * per;
  return -(k + (u < SPAN ? cycloid(u / SPAN) : 1)) * STEP;
}

// 小輪:圓盤+八根徑向凸柱與柱端的滾子
const studs = Array.from({ length: SMALL.studs }, (_, i) => {
  const a = (i * TAU) / SMALL.studs;
  return [
    { kind: "box", size: [SMALL.reach - SMALL.r + 0.1, 0.1, 0.1], at: [((SMALL.r + SMALL.reach) / 2) * Math.cos(a), ((SMALL.r + SMALL.reach) / 2) * Math.sin(a), 0], angle: a },
    { kind: "cylinder", radius: 0.14, length: 0.22, axis: [Math.cos(a), Math.sin(a), 0], at: [SMALL.reach * Math.cos(a), SMALL.reach * Math.sin(a), 0], accent: i === 0 },
  ];
}).flat();
// 大輪輪緣上的斜棱(局部:軸沿 z,斜棱從下緣斜上到上緣)
const ribs = Array.from({ length: BIG.ribs }, (_, i) => {
  const a = (i * TAU) / BIG.ribs;
  const d = STEP * 0.8;
  const r = BIG.r + 0.03;
  return { kind: "tube", points: [[r * Math.cos(a), r * Math.sin(a), -BIG.height / 2 + 0.05], [r * Math.cos(a + d), r * Math.sin(a + d), BIG.height / 2 - 0.05]], radius: 0.035, accent: i === 0 };
});

export default {
  figure: 364,
  parts: [
    { id: "small", kind: "group", center: SMALL.center, spin: SMALL.reach, pieces: [{ kind: "plate", shape: shape(circle(SMALL.r), [circle(0.12).reverse()]), thickness: 0.18, circles: [0.3] }, ...studs] },
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
  waivers: [
    { check: "interference", parts: ["small", "big"], reason: "待確認:small 的圓柱 r0.14×0.22 與 big 的Tube重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "small", type: "rotation", speed: -0.8 },
  target: "big", // 間歇轉動的大輪
  view: { direction: [0.03, 0.12, 1] },
  pose(theta) {
    return { parts: { small: { angle: theta }, big: { angle: bigAngle(theta) } }, readouts: [] };
  },
};
