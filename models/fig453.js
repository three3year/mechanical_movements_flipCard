// 第 453 種:雙燈籠式風箱泵。槓桿把一個風箱撐開時,裡面的空氣變稀薄,水沿吸水管上升填補空間;同時另一個風箱被壓縮,
// 把裡面的水經排水管排出;閥門的作動方式與普通壓力泵相同。
// 主動件是頂上的槓桿(來回擺動)。
// 推斷:兩個風箱立在底座的水室上,共用中央的吸水管(底部)與排水管(中央往上彎);每個風箱底下有一個吸水閥、
// 一個通往排水管的出水閥;風箱以一圈圈的褶與頂板表示;剖面圖。
import { deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, flap, pipeWalls } from "./pump.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const PIVOT = [0, 2.3, 0];
const BEAM = 1.15; // 支點到兩端
const LINK = 1.0;
export const BELLOWS_X = [-1.15, 1.15];
const BASE_TOP = -0.2;
const R = 0.5;
export const SWING = [deg(-12), deg(12)];
const OPEN = deg(50);
const FOLDS = 5;

/** 槓桿轉 theta → 兩個風箱頂板的高度 */
export function tops(theta) {
  return BELLOWS_X.map((x, k) => {
    const s = k === 0 ? -1 : 1;
    const end = [PIVOT[0] + s * BEAM * Math.cos(theta), PIVOT[1] + s * BEAM * Math.sin(theta)];
    return { end, y: end[1] - Math.sqrt(LINK * LINK - (end[0] - x) ** 2) };
  });
}

// 風箱的側面:褶(之字形)
const folds = (x, top, s) => {
  const pts = [];
  for (let i = 0; i <= 2 * FOLDS; i++) {
    const y = BASE_TOP + ((top - BASE_TOP) * i) / (2 * FOLDS);
    pts.push([x + s * (R + (i % 2 ? 0.14 : 0)), y, 0.1]);
  }
  return pts;
};

const DELIVERY = [[0, BASE_TOP - 0.05], [0, 1.35], [0.25, 1.6], [0.5, 1.35]];
const INLET = [[0, -1.6], [0, -0.75]];

export default {
  figure: 453,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 底座水室、吸水管、排水管、支柱
        { kind: "plate", shape: shape(rect(3.6, 0.55, 0, -0.48), [rect(3.4, 0.35, 0, -0.48).reverse()]), thickness: 0.8 },
        ...pipeWalls(INLET, 0.3),
        ...pipeWalls(DELIVERY, 0.22),
        { kind: "box", size: [0.06, 0.6, 0.6], at: [-0.3, -0.48, 0] },
        { kind: "box", size: [0.06, 0.6, 0.6], at: [0.3, -0.48, 0] },
        { kind: "plate", shape: shape(thickLine([[0.18, 0.8], [0.18, PIVOT[1]]], 0.14), [circle(0.05, 0.18, PIVOT[1]).reverse()]), thickness: 0.2, at: [-0.18, 0, -0.25] },
      ],
    },
    { id: "beam", kind: "plate", shape: shape(thickLine([[-BEAM - 0.1, 0], [BEAM + 0.5, 0]], 0.14), [circle(0.05).reverse()]), thickness: 0.1, center: PIVOT, arrow: false },
    ...[0, 1].map((k) => ({ id: `link${k}`, kind: "link", width: 0.08, thickness: 0.05 })),
    ...[0, 1].map((k) => ({ id: `top${k}`, kind: "box", size: [2 * R + 0.3, 0.1, 0.8] })),
    ...[0, 1].flatMap((k) => [-1, 1].map((s) => ({ id: `fold${k}${s > 0 ? "R" : "L"}`, kind: "rod", radius: 0.025 }))),
    ...[0, 1].map((k) => ({ id: `water${k}`, kind: "fill", fluid: "water", size: [2 * R, 1.6, 0.6], level: 0.5 })),
    ...[0, 1].map((k) => flap(`suction${k}`, 0.28)),
    ...[0, 1].map((k) => flap(`delivery${k}`, 0.22)),
  ],
  driver: { part: "beam", type: "rotation", cycle: SWING },
  view: { direction: [0.05, 0.08, 1] },
  pose(v) {
    const { at, forward } = stroke(v, ...SWING);
    const t = tops(at);
    // 槓桿往逆時針轉(forward)時右邊的風箱被撐開、左邊的被壓縮
    const expanding = [!forward, forward];
    const parts = { beam: { angle: at } };
    const paths = {};
    const travel = v * 6;
    const flows = [];
    t.forEach(({ end, y }, k) => {
      const x = BELLOWS_X[k];
      parts[`link${k}`] = { from: [end[0], end[1], 0.15], to: [x, y, 0.15] };
      parts[`top${k}`] = { position: [x, y, 0] };
      paths[`fold${k}L`] = { points: folds(x, y, -1), closed: false };
      paths[`fold${k}R`] = { points: folds(x, y, 1), closed: false };
      parts[`water${k}`] = { position: [x, BASE_TOP + 0.8, 0], level: (y - BASE_TOP - 0.05) / 1.6 };
      // 吸水閥在風箱底的外側,出水閥在靠排水管那一側
      const s = k === 0 ? -1 : 1;
      parts[`suction${k}`] = { position: [x + s * 0.15 - 0.14, BASE_TOP, 0.1], angle: expanding[k] ? OPEN : 0 };
      parts[`delivery${k}`] = { position: [s * 0.3, -0.5, 0.1], angle: Math.PI / 2 + (expanding[k] ? 0 : s * OPEN) }; // 被水推向中央
      if (expanding[k]) flows.push({ fluid: "water", points: stream([[0, -1.55, 0.2], [0, -0.6, 0.2], [x, -0.6, 0.2], [x, y - 0.2, 0.2]], travel, { spacing: 0.18 }) });
      else flows.push({ fluid: "water", points: stream([[x, y - 0.2, 0.2], [x, -0.35, 0.2], [s * 0.15, -0.35, 0.2], ...DELIVERY.slice(1).map(([a, b]) => [a, b, 0.2]), [0.55, 0.6, 0.2]], travel, { spacing: 0.18 }) });
    });
    return { parts, paths, flows, readouts: [{ label: "風箱", value: forward ? "右邊撐開吸水、左邊壓縮排水" : "左邊撐開吸水、右邊壓縮排水" }] };
  },
};
