// 第 320 種:無端鏈(惠更斯的維持動力)。右上是動力輪部分主輪上的皮帶輪 P(表面粗糙,繩不打滑),左上是另一根軸上
// 的棘輪皮帶輪 p(以棘輪與制動爪連著,只能往一個方向轉)。一條無端的繩依序繞過 P、下方掛大重物 W 的滑輪、p、
// 掛小重物 w 的滑輪,再回到 P:繩段 d、a 吊著 W,b、c 吊著 w(w 只重到讓繩保持在輪上)。
// 時鐘走時,W 下降帶動 P;上發條時把繩段 b 往下拉,p 在制動爪下轉動、a 把 W 拉上來,而 c 仍拉著 P,
// 動力輪一刻也不失去動力。主動件是虛擬的「進程」:每一輪前段時鐘照走,後段同時上發條(拉 b)。
// 推斷:每一輪上發條的時機與快慢;各輪尺寸依原圖。
import { Z, TAU, smooth, routeBelt } from "./kit.js";

const R = 0.55;
const RW = 0.48; // W 的滑輪
const Rw = 0.32; // w 的滑輪
const PP = [1.3, 1.6, 0]; // P
const Pp = [-1.3, 1.6, 0]; // p
const W0 = -1.6; // W 滑輪的起始高度
const w0 = -1.0; // w 滑輪的起始高度
export const FEED = 1.6; // 每一輪時鐘走過、經 P 送出的繩長
const WIND = 0.75; // 每一輪的後段(0.75–1)同時上發條

/** 進程 p → 經 P 送出的繩長、經 p 拉過的繩長、兩重物的高度 */
export function chain(p) {
  const k = Math.floor(p);
  const f = p - k;
  const fed = FEED * p; // 時鐘一直在走
  const wound = FEED * (k + smooth((f - WIND) / (1 - WIND)));
  return { fed, wound, W: W0 - fed / 2 + wound / 2, w: w0 + fed / 2 - wound / 2 };
}

export default {
  figure: 320,
  parts: [
    { id: "pulleyP", kind: "pulley", style: "disc", center: PP, radius: R, width: 0.2, label: "P", labelOffset: [0, 0.15, 0.3] },
    { id: "pulleyp", kind: "group", center: Pp, spin: R, label: "p", labelOffset: [0, 0.15, 0.3], pieces: [{ kind: "pulley", style: "disc", radius: R, width: 0.2 }, { kind: "plate", shape: { outline: Array.from({ length: 24 }, (_, i) => { const a = (i / 12) * Math.PI; const r = i % 2 ? 0.28 : 0.38; return [r * Math.cos(a), r * Math.sin(a)]; }), holes: [] }, thickness: 0.1, at: [0, 0, 0.15] }] },
    { id: "click", kind: "box", center: [Pp[0] - 0.05, Pp[1] + 0.5, 0.2], size: [0.4, 0.06, 0.06] },
    { id: "sheaveW", kind: "pulley", style: "disc", radius: RW, width: 0.16 },
    { id: "sheavew", kind: "pulley", style: "disc", radius: Rw, width: 0.14 },
    { id: "weightW", kind: "box", size: [1.7, 1.0, 0.7], label: "W", labelOffset: [0, 0, 0.5] },
    { id: "weightw", kind: "box", size: [0.45, 0.55, 0.4], label: "w", labelOffset: [0, 0, 0.35] },
    { id: "rope", kind: "rope" },
    { id: "labelA", kind: "group", center: [0.3, 0.3, 0], label: "a", labelOffset: [0, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-1.95, 0.4, 0], label: "b", labelOffset: [-0.2, 0, 0.3] },
    { id: "labelC", kind: "group", center: [-0.4, 0.4, 0], label: "c", labelOffset: [0.2, 0, 0.3] },
    { id: "labelD", kind: "group", center: [1.95, 0.3, 0], label: "d", labelOffset: [0.2, 0, 0.3] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.08 },
  view: { direction: [0.03, 0.04, 1] },
  pose(p) {
    const c = chain(p);
    const W = [PP[0], c.W, 0];
    const w = [Pp[0], c.w, 0];
    // 無端繩:P(順時針)→ W 的滑輪 → p(逆時針)→ w 的滑輪 → 回到 P
    const loop = routeBelt([
      { center: PP, axis: Z, radius: R, sense: -1 },
      { center: W, axis: Z, radius: RW, sense: -1 },
      { center: Pp, axis: Z, radius: R, sense: 1 },
      { center: w, axis: Z, radius: Rw, sense: 1 },
    ]);
    return {
      parts: {
        pulleyP: { angle: -c.fed / R },
        pulleyp: { angle: c.wound / R },
        sheaveW: { position: W, angle: -(c.fed + c.wound) / (2 * RW) },
        sheavew: { position: w, angle: (c.fed + c.wound) / (2 * Rw) },
        weightW: { position: [W[0], W[1] - 1.05, 0] },
        weightw: { position: [w[0], w[1] - 0.6, 0] },
      },
      paths: { rope: { points: loop.points, closed: true, phase: c.fed } },
      readouts: [],
    };
  },
};
