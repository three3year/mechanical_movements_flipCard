// 第 369 種:擺線面(惠更斯的擺線擺)。擺線從上方懸掛點兩側的兩片擺線形曲面(擺線頰板)之間垂下;擺動時擺線
// 靠著一側的頰板捲上去,擺錘因此走的是一條擺線(原圖虛線),擺動不論幅度大小都等時。
// 主動件是虛擬的「進程」:擺已擺過的週期數。擺錘沿擺線作簡諧運動(沿擺線的弧長隨時間成正弦)。
// 原圖的虛線(擺錘的軌跡、兩端的擺錘與擺線)是預覽運動線,不畫。
// 支架照原圖:橫樑底下兩根立柱,兩片頰板的上端接在橫樑底面的中央(懸掛點),往兩側彎下去穿過立柱的下端,
// 立柱與頰板之間各有一根斜撐(原圖的三角撐架),頰板就是撐架的一邊。
// 頰板的曲面是擺線往外偏一個線的半徑:擺線的中心線捲在擺線上,線面剛好貼著頰板。兩片頰板的尖端之間留一個線徑寬、
// 一小段直的夾口,擺線的上端夾在夾口裡、頂到橫樑底面(推斷:夾口的長度)。
// 推斷:擺幅;頰板的大小、立柱與斜撐的位置依原圖。
import { TAU, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

export const A = 0.9; // 擺線的生成圓半徑:擺線長 4A
const TOP = [0, 2.4, 0]; // 擺線的尖點(兩片頰板曲面的交會處)
export const AMP = 2.4; // 沿擺線弧長的擺幅(單邊,< 4A)
const THREAD = 0.025; // 擺線的半徑:頰板的曲面從擺線往外偏這麼多
const JAW = 0.08; // 尖點上方的夾口長度:橫樑底面在尖點上方這麼高
const BEAM_Y = TOP[1] + JAW; // 橫樑底面
const CHEEK_W = 0.12; // 頰板的厚度(平面內)
const CHEEK_END = 0.85 * Math.PI; // 頰板畫到擺線參數 φ 的哪裡
const POST_X = 1.0; // 立柱的中心(離懸掛點)

/** 頰板上(右側)參數 φ 的點:擺線從懸掛點往右下 */
const cheek = (phi, s) => [TOP[0] + s * A * (phi - Math.sin(phi)), TOP[1] - A * (1 - Math.cos(phi)), 0];

/** 進程 p → 擺錘位置、擺線捲在頰板上的參數、擺到哪一側 */
export function pendulum(p) {
  const arc = AMP * Math.sin(TAU * p); // 沿擺線的弧長(從最低點量起)
  const s = arc >= 0 ? 1 : -1;
  const phi = 2 * Math.asin(clamp(Math.abs(arc) / (4 * A), 0, 1));
  const bob = [TOP[0] + s * A * (phi + Math.sin(phi)), TOP[1] - 3 * A - A * Math.cos(phi), 0];
  return { arc, phi, side: s, bob };
}
export const top = TOP;

// 頰板:擺線往外(背離擺線的那一側)偏 THREAD 是貼著線的曲面,再偏 CHEEK_W 是外緣;上端加一段直的夾口接到橫樑底面
function cheekOutline(s) {
  const n = 80;
  const at = (phi, d) => {
    const [x, y] = cheek(phi, s);
    return [x + s * d * Math.cos(phi / 2), y + d * Math.sin(phi / 2)]; // 法線 (s·cos(φ/2), sin(φ/2))
  };
  const phis = Array.from({ length: n + 1 }, (_, i) => (i / n) * CHEEK_END);
  const inner = [[s * THREAD, BEAM_Y], ...phis.map((f) => at(f, THREAD))];
  const outer = [[s * (THREAD + CHEEK_W), BEAM_Y], ...phis.map((f) => at(f, THREAD + CHEEK_W))].reverse();
  const loop = [...inner, ...outer];
  return s > 0 ? loop.reverse() : loop; // 逆時針
}

/** 頰板外緣在 x 處的高度(立柱與斜撐的下端接到這裡) */
function outerY(x) {
  let lo = 0;
  let hi = CHEEK_END;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    const px = cheek(m, 1)[0] + (THREAD + CHEEK_W) * Math.cos(m / 2);
    if (px < x) lo = m;
    else hi = m;
  }
  return cheek(lo, 1)[1] + (THREAD + CHEEK_W) * Math.sin(lo / 2);
}
const POST_FOOT = outerY(POST_X) - 0.06; // 立柱的下端伸進頰板一點
const BRACE_FOOT = [0.62, outerY(0.62) - 0.04];

/** 一側的立柱與斜撐(原圖的三角撐架) */
const brace = (s) => [
  { kind: "plate", shape: shape(thickLine([[s * POST_X, BEAM_Y + 0.02], [s * POST_X, POST_FOOT]], 0.12)), thickness: 0.3 },
  { kind: "plate", shape: shape(thickLine([[s * (POST_X - 0.04), BEAM_Y - 0.06], [s * BRACE_FOOT[0], BRACE_FOOT[1]]], 0.08)), thickness: 0.3 },
];

export default {
  figure: 369,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.8, 0.25, 0.5], at: [0, BEAM_Y + 0.125, 0] },
        ...brace(-1),
        ...brace(1),
        // 兩片擺線頰板:上端接在橫樑底面
        { kind: "plate", role: "cheek", shape: shape(cheekOutline(1)), thickness: 0.4 },
        { kind: "plate", role: "cheek", shape: shape(cheekOutline(-1)), thickness: 0.4 },
      ],
    },
    { id: "thread", kind: "rod", radius: THREAD },
    { id: "bob", kind: "sphere", radius: 0.16 },
  ],
  powered: ["bob"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.25 },
  target: "bob", // 沿擺線走的擺錘
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const m = pendulum(p);
    // 擺線:上端夾在夾口裡(頂到橫樑底面),沿頰板捲到切點,再直線垂到擺錘
    const n = 16;
    const wrapped = Array.from({ length: n + 1 }, (_, i) => cheek((m.phi * i) / n, m.side));
    return {
      parts: { bob: { position: m.bob } },
      paths: { thread: { points: [[TOP[0], BEAM_Y - THREAD, 0], ...wrapped, m.bob], closed: false } },
      readouts: [],
    };
  },
  waivers: [],
};
