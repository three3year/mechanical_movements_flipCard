// 第 483 種:乾式氣錶。兩個像風箱一樣的腔室 A、A',輪流被氣體充滿,經一個閥門 B 排出;閥門有點像蒸汽機的滑閥,
// 由腔室 A、A' 帶動。腔室的容積已知,充滿的次數由錶盤機構記錄,所以通過的氣量就顯示在錶盤上。
// 主動件是虛擬的「進程」:通過的氣量(以兩個腔室各充放一次為一單位)。
// 推斷:兩個腔室的隔膜(皺褶的皮)左右擺動、相位差 90°,經頂上的曲柄帶動滑閥 B 與錶盤指針;剖面圖。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

export const STROKE = 0.38; // 隔膜擺動的半幅
const CENTERS = [-1.05, 1.05]; // 兩個腔室的中心
const H = 2.2; // 腔室高
const FOLDS = 6;

/** 進程 v → 兩片隔膜的位置(偏離中心)、滑閥 B 的位置、錶盤指針角、哪個腔室在進氣 */
export function meter(v) {
  const a = TAU * v;
  const d = [STROKE * Math.sin(a), STROKE * Math.sin(a - Math.PI / 2)];
  return { a, d, valve: VALVE_THROW * Math.cos(a), dial: -a / 4, filling: [Math.cos(a) > 0, Math.cos(a - Math.PI / 2) > 0] };
}

// 傳動(推斷;原圖沒有畫出來,只說滑閥由腔室帶動、錶盤記錄次數):外殼正面一根三拐的曲軸,
// 兩片隔膜與滑閥各伸出一個直槽框(蘇格蘭軛)套在自己那一拐的銷上——隔膜來回推銷,曲軸就轉,
// 曲軸再經第三拐帶著滑閥;軸上的小齒輪經大齒輪(4:1)帶動錶盤指針。三個直槽框各在一層,互不相碰。
const CRANK_Y = 1.9; // 曲軸的高度
const VALVE_Y = H / 2 + 0.2;
const VALVE_THROW = 0.18;
const LAYER = [0.7, 0.86, 1.02]; // 三個直槽框所在的前後層(隔膜 A、隔膜 A'、滑閥)
const slotBars = (x, half, z) => [-1, 1].map((s) => ({ kind: "box", size: [0.06, 2 * half + 0.16, 0.06], at: [x + s * 0.075, CRANK_Y, z] }));
// 隔膜的直槽框:隔膜上緣往前伸一根銷,接一根立桿、一根橫桿,到曲軸正下方再接直槽(k:0 左、1 右)
const diaphragmYoke = (k) => {
  const to = -CENTERS[k]; // 直槽相對隔膜的位置(曲軸在 x = 0)
  const z = LAYER[k];
  const low = CRANK_Y - STROKE - 0.11;
  return [
    { kind: "cylinder", radius: 0.03, length: z + 0.03 - 0.3, at: [0, 0.9, (z + 0.03 + 0.3) / 2] },
    { kind: "box", size: [0.06, low - 0.9 + 0.06, 0.06], at: [0, (low + 0.9) / 2, z] },
    { kind: "box", size: [Math.abs(to) + 0.21, 0.06, 0.06], at: [to / 2, low, z] },
    ...slotBars(to, STROKE, z),
  ];
};

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
        // 曲軸與指針齒輪的軸承座(接在頂壁下)
        { kind: "box", size: [0.9, 0.3, 0.1], at: [0.25, CRANK_Y + 0.02, 0.3] },
      ],
    },
    ...[0, 1].map((k) => ({ id: `diaphragm${k}`, kind: "group", label: k === 0 ? "A" : "A'", labelOffset: [0.25, -0.2, 0.4], arrow: false, pieces: [{ kind: "box", size: [0.08, H - 0.3, 0.6] }, ...diaphragmYoke(k)] })),
    ...[0, 1].flatMap((k) => ["Top", "Bottom"].map((p) => ({ id: `pleat${k}${p}`, kind: "rod", radius: 0.02 }))),
    {
      id: "valve",
      kind: "group",
      label: "B",
      labelOffset: [0.3, 0.2, 0.3],
      arrow: false,
      pieces: [
        { kind: "box", size: [0.5, 0.15, 0.35] },
        // 閥桿往前伸到最前面一層,接直槽框
        { kind: "cylinder", radius: 0.03, length: LAYER[2] + 0.03 - 0.05, at: [0, 0, (LAYER[2] + 0.03 - 0.05) / 2] },
        { kind: "box", size: [0.21, 0.06, 0.06], at: [0, 0, LAYER[2] - 0.05] },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.06, CRANK_Y + VALVE_THROW + 0.08 - VALVE_Y, 0.06], at: [s * 0.075, (CRANK_Y + VALVE_THROW + 0.08 - VALVE_Y) / 2, LAYER[2] - 0.05] })),
      ],
    },
    {
      id: "crankshaft",
      kind: "group",
      center: [0, CRANK_Y, 0],
      spin: 0.5,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.38, at: [0, 0, 0.44] },
        { kind: "gear", teeth: 8, radius: 0.1, width: 0.08, at: [0, 0, 0.48] },
        { kind: "plate", shape: shape(circle(STROKE + 0.08)), thickness: 0.06, at: [0, 0, 0.6] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [0, -STROKE, 0.69] },
        { kind: "plate", shape: shape(thickLine([[0, -STROKE], [-STROKE, 0]], 0.1)), thickness: 0.04, at: [0, 0, 0.77] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [-STROKE, 0, 0.85] },
        { kind: "plate", shape: shape(thickLine([[-STROKE, 0], [VALVE_THROW, 0]], 0.1)), thickness: 0.04, at: [0, 0, 0.93] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [VALVE_THROW, 0, 1.01] },
      ],
    },
    // 錶盤指針裝在大齒輪上(齒輪在曲軸盤的後面一層)
    {
      id: "dial",
      kind: "gear",
      center: [0.5, CRANK_Y, 0.48],
      teeth: 32,
      radius: 0.4,
      width: 0.08,
      pieces: [
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, -0.08] },
        { kind: "box", size: [0.34, 0.05, 0.03], at: [0.17, 0, 0.055], accent: true },
      ],
    },
  ],
  powered: ["diaphragm0", "diaphragm1"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.15 },
  target: "dial", // 錶盤指針
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const m = meter(v);
    const parts = { valve: { position: [m.valve, VALVE_Y, 0.05] }, crankshaft: { angle: m.a }, dial: { angle: m.dial } };
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
  waivers: [
    { check: "interference", parts: ["crankshaft", "dial"], reason: "簡化齒形:曲軸上的小齒輪與指針齒輪的梯形齒齒側重疊 0.04" },
  ],
};
