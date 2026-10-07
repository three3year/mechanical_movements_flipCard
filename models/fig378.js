// 第 378 種:由擺的運動驅動、用來鋸倒下的樹木的鋸子。左邊三腳架上吊著一個擺(重錘),擺經一根連桿推拉鋸框;
// 鋸框掛在跨過樹幹的門形架上,來回鋸時慢慢往下,鋸條一點一點切進樹幹。主動件是虛擬的「進程」:擺已擺過的次數
// (鋸切的進度);鋸框隨擺往復,同時逐漸下降。進程繞回時重新從樹幹頂上鋸起(鋸框與配重回到起點,刻意的循環)。
// 推斷:擺與鋸框的連接方式(連桿的一端在鋸框的長槽裡滑動)、每一次往復切進的深度(示意)。
// 鋸框怎麼掛(依原圖):兩條繩從門形架上角的滑輪垂下吊著鋸框,繞過滑輪後從外側垂下吊著配重;鋸框往下切時配重被拉上去
// (繩長不變,滑輪跟著轉)。繩的下端掛在鋸框頂上一根橫軌的滑塊上,鋸框來回鋸時在掛鉤下面滑,繩保持垂直(推斷);
// 滑輪的支架也是推斷。
import { TAU, deg, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const PIVOT = [-3.0, 2.2, 0]; // 擺的懸掛點(三腳架頂)
const L = 2.6; // 擺長
const SWING = deg(16);
const STROKES = 12; // 進程一輪裡擺擺過的次數
const LOG = { center: [1.0, -0.95, 0], r: 0.75 };
const SAW_Y0 = LOG.center[1] + LOG.r + 0.08; // 鋸條起始高度(剛碰到樹幹頂)
export const DEPTH = 1.1; // 一輪鋸進的深度
/** 進程 p → 擺角、鋸框的水平位移、鋸條高度 */
export function sawing(p0) {
  const p = clamp(p0, 0, 1);
  const angle = SWING * Math.sin(TAU * STROKES * p);
  const bob = [PIVOT[0] + L * Math.sin(angle), PIVOT[1] - L * Math.cos(angle), 0];
  return { angle, shift: L * Math.sin(angle), saw: SAW_Y0 - DEPTH * p, bob };
}

const HANG_Z = 0.45; // 繩、滑輪、配重所在的那一層(在連桿前面)
const SHEAVE = { r: 0.15, y: 1.25, xs: [-0.85, 2.85] }; // 門形架兩個上角外側的滑輪
const RAIL = { up: 1.0, half: 2.5 }; // 鋸框頂上的橫軌(在鋸框上橫樑之上 RAIL.up),繩的掛鉤在它上面滑
const WEIGHT_TOP0 = -0.3; // 配重頂端在進程 0 時的高度(切到底時升到滑輪下方)
const hookX = (side) => SHEAVE.xs[side] + (side === 0 ? SHEAVE.r : -SHEAVE.r); // 繩從滑輪內側垂直往下

/** 鋸框高度 → 兩邊配重頂端的高度、繩移動的量(繩垂直、長度不變:鋸框降多少,配重升多少) */
export function hang(sawY) {
  const drop = SAW_Y0 - sawY;
  return { drop, weightTop: WEIGHT_TOP0 + drop };
}
const arcOver = (side) => {
  const x = SHEAVE.xs[side];
  return Array.from({ length: 9 }, (_, k) => {
    const a = side === 0 ? (k / 8) * Math.PI : Math.PI - (k / 8) * Math.PI;
    return [x + SHEAVE.r * Math.cos(a), SHEAVE.y + SHEAVE.r * Math.sin(a), HANG_Z];
  });
};

export default {
  figure: 378,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳架
        { kind: "plate", shape: shape(thickLine([[-3.9, -1.75], [PIVOT[0], PIVOT[1] + 0.1], [-2.1, -1.75]], 0.1)), thickness: 0.1, at: [0, 0, -0.3] }, // 三腳架的前兩腳在擺的後面(擺錘從它前方擺過)
        { kind: "cylinder", radius: 0.055, length: 0.5, at: [PIVOT[0], PIVOT[1], -0.1] },
        { kind: "box", size: [0.08, 3.9, 0.08], at: [PIVOT[0], 0.25, -0.5], angle: 0 },
        // 跨過樹幹的門形架
        { kind: "plate", shape: shape(thickLine([[-0.6, -1.75], [-0.6, 1.25], [2.6, 1.25], [2.6, -1.75]], 0.18)), thickness: 0.2, at: [0, 0, -0.7] },
        { kind: "plate", shape: shape(thickLine([[-0.6, -1.75], [-0.6, 1.25], [2.6, 1.25], [2.6, -1.75]], 0.18)), thickness: 0.2, at: [0, 0, 0.7] },
        { kind: "box", size: [7.4, 0.12, 2.0], at: [-0.6, -1.82, 0] },
        // 滑輪的支架:從門形架前面那片的上角伸出,托著滑輪軸
        ...SHEAVE.xs.map((x) => ({ kind: "box", size: [0.4, 0.1, 0.1], at: [x + (x < 1 ? 0.12 : -0.12), SHEAVE.y + 0.22, 0.7] })),
        ...SHEAVE.xs.map((x) => ({ kind: "box", size: [0.1, 0.22, 0.1], at: [x, SHEAVE.y + 0.12, 0.7] })),
        ...SHEAVE.xs.map((x) => ({ kind: "cylinder", radius: 0.04, length: 0.4, at: [x, SHEAVE.y, 0.55] })),
      ],
    },
    ...SHEAVE.xs.map((x, i) => ({ id: i === 0 ? "sheaveL" : "sheaveR", kind: "pulley", style: "disc", center: [x, SHEAVE.y, HANG_Z], radius: SHEAVE.r, width: 0.1 })),
    ...["weightL", "weightR"].map((id) => ({ id, kind: "box", size: [0.22, 0.4, 0.22] })),
    // 繩的掛鉤:在鋸框頂上的橫軌上滑的小滑塊,往前伸到繩的那一層
    ...["hookL", "hookR"].map((id) => ({ id, kind: "group", pieces: [{ kind: "box", size: [0.2, 0.12, 0.14], at: [0, 0.1, 0.1] }, { kind: "box", size: [0.06, 0.06, 0.4], at: [0, 0.13, 0.27] }] })),
    { id: "cordL", kind: "rope" },
    { id: "cordR", kind: "rope" },
    // 倒下的樹幹(沿 z 方向躺著)
    { id: "log", kind: "cylinder", center: LOG.center, radius: LOG.r, length: 2.4, axis: [0, 0, 1] },
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [0.06, L, 0.06], at: [0, -L / 2, 0] },
        { kind: "box", size: [0.4, 0.55, 0.3], at: [0, -L, 0] },
        { kind: "cylinder", radius: 0.12, inner: 0.06, length: 0.2 },
      ],
    },
    { id: "rod", kind: "link", width: 0.07, thickness: 0.05, stretch: true }, // 連桿接鋸框的一端在長槽裡滑動,鋸框才能一面往復一面下降
    {
      id: "saw",
      kind: "group",
      arrow: false,
      pieces: [
        // 鋸框:兩根立柱、上橫樑、下面的鋸條
        { kind: "box", size: [2.6, 0.1, 0.1], at: [0, 0.75, 0] },
        // 頂上的橫軌(兩根短柱接在上橫樑上),繩的掛鉤在上面滑
        { kind: "box", size: [2 * RAIL.half, 0.08, 0.08], at: [0, 0.75 + RAIL.up, -0.03] },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.08, RAIL.up, 0.08], at: [s * 1.0, 0.75 + RAIL.up / 2, -0.03] })),
        { kind: "box", size: [0.1, 0.85, 0.1], at: [-1.25, 0.35, 0] },
        { kind: "box", size: [0.1, 0.85, 0.1], at: [1.25, 0.35, 0] },
        { kind: "plate", shape: shape([[-1.3, 0], [1.3, 0], [1.3, 0.12], ...Array.from({ length: 26 }, (_, i) => [1.3 - i * 0.1, i % 2 ? 0.0 : -0.06]).slice(1), [-1.3, 0.12]].map(([x, y]) => [x, y])), thickness: 0.03 },
      ],
    },
  ],
  powered: ["pendulum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.04 },
  target: "saw",
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sawing(((p % 1) + 1) % 1);
    const sawX = LOG.center[0] + s.shift;
    const h = hang(s.saw);
    const railY = s.saw + 0.75 + RAIL.up;
    const cord = (side) => {
      const out = SHEAVE.xs[side] + (side === 0 ? -SHEAVE.r : SHEAVE.r);
      return [[hookX(side), railY + 0.13, HANG_Z], ...arcOver(side), [out, h.weightTop, HANG_Z]];
    };
    return {
      paths: {
        cordL: { points: cord(0), closed: false, phase: -h.drop },
        cordR: { points: cord(1), closed: false, phase: -h.drop },
      },
      parts: {
        sheaveL: { angle: -h.drop / SHEAVE.r },
        sheaveR: { angle: h.drop / SHEAVE.r },
        hookL: { position: [hookX(0), railY, 0] },
        hookR: { position: [hookX(1), railY, 0] },
        weightL: { position: [SHEAVE.xs[0] - SHEAVE.r, h.weightTop - 0.2, HANG_Z] },
        weightR: { position: [SHEAVE.xs[1] + SHEAVE.r, h.weightTop - 0.2, HANG_Z] },
        pendulum: { angle: s.angle },
        saw: { position: [sawX, s.saw, 0.13] },
        rod: { from: [s.bob[0], s.bob[1] + 0.3, 0.2], to: [sawX - 1.25, s.saw + 0.7, 0.2] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["log", "saw"], reason: "鋸片鋸進木頭是這個機構的作用:鋸片與木頭重疊 0.81 是鋸口(木頭上的鋸縫沒有畫出來)" },
  ],
};
