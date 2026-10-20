// 第 461 種:擺動式水槽,靠擺動把水抬高。底端是舀斗,頂端是開口的管;中間每個轉角處有一個箱子(裝著瓣閥),
// 各與兩段管子相連。
// 主動件是整個搖動架(繞中間的支點來回擺)。
// 照 525 px 原圖讀:六層水平管,每層兩端各一個箱子(最上層的左端是開口的噴管);斜管(在水平管後面一層)
// 從每個左箱往右上接到高兩層的右箱;最下面一根斜管從水裡的舀斗接到右邊第五個箱子,最上面一根從左邊第二個箱子
// 伸過頂上、末端開口。中間的半圓是立柱頂的軸承,半圓往下兩條虛線是藏在管子後面、立在水底的立柱(第 5 類:虛線是
// 藏在後面的零件);一根斜撐穿過樞軸把整個架子扛在樞軸上。原圖把架子畫在往左擺約 20° 的姿勢,所以水平管畫成水平、
// 兩列箱子斜著;模型以兩列箱子直立為中立姿勢,水平管在中立時往右下斜 13°、斜管往右上斜 17.5°。
// 推斷(送水的原理,原文沒寫):每段管子都有固定的送水方向——水平管從右箱送到左箱、斜管從左箱送到高兩層的右箱——
// 擺到那段管往終點下斜時,水就流過去,箱子裡的瓣閥擋住回流。兩條鏈交錯:舀斗那條(第 5、3、1 層與其間的斜管)
// 往左擺到底時舀斗浸水,右下的底箱那條(第 6、4、2 層)往右擺到底時底箱浸水;各自從頂端的開口流出。
import { deg } from "./kit.js";
import { stroke } from "./pump.js";
import { stream } from "./flow.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";

export const PIVOT = [0, 1.5, 0]; // 立柱頂的樞軸
export const WATER = 0; // 水面
const FLOOR = -0.8; // 池底
const LEVELS = 6;
const HALF = 1.0; // 箱子離中線
const D = 0.55; // 層距
const DROP = 0.47; // 中立時水平管右端比左端低多少
export const BOX = 0.26; // 箱子的邊長
export const SWING = [deg(-25), deg(25)];

// 架子上的點(局部座標,樞軸在原點):R1–R6 右箱(1 在最上)、L2–L6 左箱,L1 是噴管的開口端;
// OPEN 是最上面那根斜管的開口端(相當於 R0),SCOOP 是最下面那根斜管在水裡的舀斗口(相當於 L7)
export const BOXES = {};
for (let k = 1; k <= LEVELS; k++) {
  BOXES[`R${k}`] = [HALF, 1.05 - (k - 1) * D];
  BOXES[`L${k}`] = [-HALF, 1.05 - (k - 1) * D + DROP];
}
export const OPEN = [HALF, BOXES.R1[1] + D];
export const SCOOP = [-HALF, BOXES.R5[1] - (2 * D - DROP)];

/** 管段:from → to 是送水的方向;pipe 水平管(右箱 → 左箱),diag 斜管(左箱 → 高兩層的右箱) */
export const SEGMENTS = [
  { id: "舀斗的斜管", kind: "diag", from: SCOOP, to: BOXES.R5 },
  ...[5, 3, 1].flatMap((k) => [
    { id: `第 ${k} 層水平管`, kind: "pipe", from: BOXES[`R${k}`], to: BOXES[`L${k}`] },
    ...(k > 1 ? [{ id: `左 ${k} 到右 ${k - 2} 的斜管`, kind: "diag", from: BOXES[`L${k}`], to: BOXES[`R${k - 2}`] }] : []),
  ]),
  ...[6, 4, 2].flatMap((k) => [
    { id: `第 ${k} 層水平管`, kind: "pipe", from: BOXES[`R${k}`], to: BOXES[`L${k}`] },
    { id: k > 2 ? `左 ${k} 到右 ${k - 2} 的斜管` : "頂上開口的斜管", kind: "diag", from: BOXES[`L${k}`], to: k > 2 ? BOXES[`R${k - 2}`] : OPEN },
  ]),
];
/** 兩條鏈(管段 id 的順序):舀斗那條接到左上的噴管,底箱那條接到頂上開口的斜管 */
export const CHAINS = [SEGMENTS.slice(0, 6).map((s) => s.id), SEGMENTS.slice(6).map((s) => s.id)];
export const SLOPE = { pipe: Math.atan2(DROP, 2 * HALF), diag: Math.atan2(2 * D - DROP, 2 * HALF) };

const local = (p, a, z = 0.1) => [PIVOT[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), PIVOT[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a), z];

/** 擺角 a → 哪幾段管子正在送水(往終點下斜) */
export function active(a) {
  return SEGMENTS.map(({ from, to }) => (to[0] - from[0]) * Math.sin(a) + (to[1] - from[1]) * Math.cos(a) < 0);
}

const PIPE_W = 0.08;
const pipe = (from, to, z) => ({ kind: "plate", shape: shape(thickLine([from, to], PIPE_W)), thickness: 0.08, at: [0, 0, z] });
const BRACE = [[-0.15, 0.75], [0.32, -1.6]]; // 穿過樞軸的斜撐
const scoopDir = Math.atan2(BOXES.R5[1] - SCOOP[1], BOXES.R5[0] - SCOOP[0]);

export default {
  figure: 461,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.6, 0.2, 1.4], at: [0, FLOOR - 0.1, 0] }, // 池底
        // 立柱(原圖虛線:藏在架子後面)與頂上的半圓軸承座,樞軸銷從軸承座往前穿過斜撐上的軸眼
        { kind: "box", size: [0.35, PIVOT[1] - FLOOR, 0.3], at: [0, (PIVOT[1] + FLOOR) / 2, -0.37] },
        { kind: "plate", shape: shape(arcPoints(0.2, 0, Math.PI)), thickness: 0.3, at: [PIVOT[0], PIVOT[1], -0.37] },
        { kind: "cylinder", radius: 0.04, length: 0.42, at: [PIVOT[0], PIVOT[1], -0.31] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, (WATER + FLOOR) / 2, 0], size: [5.4, WATER - FLOOR, 1.3], level: 1 },
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 水平管(前層)與兩端的箱子;第 1 層的水平管獨立成 spout
        ...[2, 3, 4, 5, 6].map((k) => pipe(BOXES[`R${k}`], BOXES[`L${k}`], 0)),
        ...Object.entries(BOXES).filter(([id]) => id !== "L1").map(([, p]) => ({ kind: "box", size: [BOX, BOX, BOX], at: [p[0], p[1], 0] })),
        // 斜管(後層):貼在水平管的背面
        ...SEGMENTS.filter((s) => s.kind === "diag").map((s) => pipe(s.from, s.to, -0.08)),
        // 舀斗:最下面那根斜管的下口做成斗(推斷:原文「底部的末端為舀斗」,原圖這一端在水面下)
        { kind: "box", size: [0.36, 0.24, 0.3], at: [SCOOP[0] + 0.06, SCOOP[1] + 0.02, -0.08], angle: scoopDir },
        // 斜撐與樞軸的軸眼(再後一層):把架子扛在立柱頂的樞軸上
        { kind: "plate", shape: shape(thickLine(BRACE, 0.1)), thickness: 0.08, at: [0, 0, -0.16] },
        { kind: "plate", shape: shape(circle(0.12), [circle(0.045).reverse()]), thickness: 0.08, at: [0, 0, -0.16] },
      ],
    },
    // 頂端開口的噴管(第 1 層的水平管,左端開口):固定在架子上、跟著擺,獨立成一個零件當目標件
    { id: "spout", kind: "group", center: PIVOT, arrow: false, pieces: [pipe(BOXES.R1, BOXES.L1, 0)] },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: SWING },
  target: "spout", // 整個架子就是主動件;標頂端的噴管——水一層層被送到這裡流出
  view: { direction: [0.1, 0.08, 1] },
  pose(v) {
    const { at } = stroke(v, ...SWING);
    const act = active(at);
    const dots = [];
    SEGMENTS.forEach((seg, k) => {
      if (!act[k]) return;
      const path = [local(seg.from, at), local(seg.to, at)];
      // 開口的末端:水流出來往下落
      if (seg.to === BOXES.L1) path.push([path[1][0] - 0.35, path[1][1] - 0.7, 0.1]);
      if (seg.to === OPEN) path.push([path[1][0] + 0.3, path[1][1] - 0.7, 0.1]);
      dots.push(...stream(path, v * 6, { spacing: 0.18 }));
    });
    const sending = SEGMENTS.filter((_, k) => act[k]);
    return {
      parts: { pendulum: { angle: at }, spout: { angle: at } },
      flows: [{ fluid: "water", points: dots }],
      readouts: [{ label: "送水的管段", value: sending.length ? (sending[0].kind === "pipe" ? "水平管:右箱 → 左箱,噴管出水" : "斜管:左箱 → 高兩層的右箱,舀斗進水") : "無(換邊中)" }],
    };
  },
};
