// 第 483 種:乾式氣錶。兩個像風箱一樣的腔室 A、A',輪流被氣體充滿,經一個閥門 B 排出;閥門有點像蒸汽機的滑閥,
// 由腔室 A、A' 帶動。腔室的容積已知,充滿的次數由錶盤機構記錄,所以通過的氣量就顯示在錶盤上。
// 主動件是虛擬的「進程」:通過的氣量(以兩個腔室各充放一次為一單位)。
// 推斷:兩個腔室的隔膜(皺褶的皮)左右擺動、相位差 90°,經頂上的曲柄帶動滑閥 B 與錶盤指針;剖面圖。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine } from "./shapes.js";

export const STROKE = 0.38; // 隔膜擺動的半幅
const CENTERS = [-1.05, 1.05]; // 兩個腔室的中心
const H = 2.2; // 腔室高
const FOLDS = 6;

/** 進程 v → 兩片隔膜的位置(偏離中心)、滑閥 B 的位置、錶盤指針角、哪個腔室在進氣 */
export function meter(v) {
  const a = TAU * v;
  const d = [STROKE * Math.sin(a), STROKE * Math.sin(a - Math.PI / 2)];
  return { a, d, valve: 0.18 * Math.cos(a), dial: -a / 4, filling: [Math.cos(a) > 0, Math.cos(a - Math.PI / 2) > 0] };
}

// 隔膜的皺褶(之字形的皮)
const pleats = (x0, x1, y) => {
  const pts = [];
  for (let i = 0; i <= 2 * FOLDS; i++) {
    const t = i / (2 * FOLDS);
    pts.push([x0 + (x1 - x0) * t, y + (i % 2 ? 0.1 : -0.1), 0.15]);
  }
  return pts;
};

export default {
  figure: 483,
  parts: [
    {
      id: "case",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(4.6, H + 1.4, 0, 0.35), [rect(4.4, H + 1.2, 0, 0.35).reverse()]), thickness: 0.8 },
        { kind: "box", size: [4.4, 0.08, 0.7], at: [0, H / 2 + 0.05, 0] },
        { kind: "box", size: [0.08, H, 0.7], at: [0, 0, 0] },
        // 頂上的閥座
        { kind: "plate", shape: shape(thickLine([[-0.6, H / 2 + 0.1], [-0.6, H / 2 + 0.3], [0.6, H / 2 + 0.3], [0.6, H / 2 + 0.1]], 0.06)), thickness: 0.4 },
        { kind: "plate", shape: shape(thickLine([[1.8, H / 2 + 0.15], [1.8, H / 2 + 0.9]], 0.08)), thickness: 0.2 },
      ],
    },
    ...[0, 1].map((k) => ({ id: `diaphragm${k}`, kind: "box", size: [0.08, H - 0.3, 0.6], label: k === 0 ? "A" : "A'", labelOffset: [0.25, -0.2, 0.4], arrow: false })),
    ...[0, 1].flatMap((k) => ["Top", "Bottom"].map((p) => ({ id: `pleat${k}${p}`, kind: "rod", radius: 0.02 }))),
    { id: "valve", kind: "box", size: [0.5, 0.15, 0.35], label: "B", labelOffset: [0.3, 0.2, 0.3], arrow: false },
    { id: "dial", kind: "plate", shape: shape(thickLine([[0, 0], [0.32, 0]], 0.05)), thickness: 0.04, center: [1.8, H / 2 + 0.95, 0.15], spin: 0.4, accent: true },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.15 },
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const m = meter(v);
    const parts = { valve: { position: [m.valve, H / 2 + 0.2, 0.05] }, dial: { angle: m.dial } };
    const paths = {};
    [0, 1].forEach((k) => {
      const x = CENTERS[k] + m.d[k];
      parts[`diaphragm${k}`] = { position: [x, 0, 0] };
      const wall = k === 0 ? -0.05 : 0.05; // 隔膜接在中間的隔板上
      paths[`pleat${k}Top`] = { points: pleats(wall, x, (H - 0.3) / 2), closed: false };
      paths[`pleat${k}Bottom`] = { points: pleats(wall, x, -(H - 0.3) / 2), closed: false };
    });
    const travel = v * 10;
    const gas = [0, 1].flatMap((k) => (m.filling[k] ? stream([[0, H / 2 + 0.6, 0.3], [m.valve, H / 2 + 0.25, 0.3], [CENTERS[k] * 0.5, 0.3, 0.3]], travel, { spacing: 0.2 }) : []));
    return {
      parts,
      paths,
      flows: [{ fluid: "air", points: gas }],
      readouts: [{ label: "錶盤記錄", value: `${(v * 2).toFixed(1)} 腔室` }],
    };
  },
};
