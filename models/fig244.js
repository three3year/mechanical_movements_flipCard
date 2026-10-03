// 第 244 種:測功計(普朗尼制動器)。平滑的皮帶輪 A 裝在動力源的軸上;上方一塊木塊、下方一串木塊繫在帶上,
// 由槓桿 D 頂部的螺絲與螺帽夾緊在輪上。槓桿 D 的末端掛秤盤 B,放入砝碼;兩個擋止 C、C' 把槓桿限制在水平附近。
// 主動件是軸(輪 A 轉動,木塊在輪面上滑)。狀態按鈕是螺絲夾得太鬆、剛好、太緊:
// 太鬆時摩擦不夠,槓桿被砝碼拉下靠在擋止 C 上;太緊時槓桿被帶上去頂住 C';剛好時槓桿停在水平位置(原圖)。
// 推斷:三種夾緊程度的狀態(原文說鎖緊螺絲、加砝碼,直到槓桿呈現圖中的位置)。
import { deg, rot2 } from "./kit.js";
import { shape, circle, rect } from "./shapes.js";

const DRUM = 0.75;
const PIVOT = [-2.1, -0.15, 0]; // 輪 A 的軸心(槓桿繞它擺)
const ARM = 4.4; // 槓桿從軸心到掛秤盤處的長度
const TILT = deg(4.5); // 碰到擋止時槓桿的傾角
const PAN_DROP = 2.1;
export const TILTS = { loose: -TILT, right: 0, tight: TILT };

const lever = shape(rect(ARM + 1.0, 0.24, ARM / 2 - 0.25, 0.95), []);

export default {
  figure: 244,
  parts: [
    {
      id: "drumA",
      kind: "pulley",
      style: "disc",
      center: PIVOT,
      radius: DRUM,
      width: 0.5,
      label: "A",
      labelOffset: [-0.15, -0.05, 0.6],
      pieces: [{ kind: "cylinder", radius: 0.14, length: 1.4 }],
    },
    {
      id: "leverD",
      kind: "group",
      center: PIVOT,
      arrow: false,
      label: "D",
      labelOffset: [2.0, 1.25, 0.3],
      pieces: [
        { kind: "plate", shape: lever, thickness: 0.3 },
        // 上方木塊與兩根夾緊螺絲
        { kind: "plate", shape: shape(rect(0.7, 0.2, 0, DRUM + 0.11)), thickness: 0.46 },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.05, length: 1.6, at: [-0.45, 0.1, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.05, length: 1.6, at: [0.45, 0.1, 0] },
        { kind: "box", size: [0.18, 0.12, 0.18], at: [-0.45, 0.9, 0] },
        { kind: "box", size: [0.18, 0.12, 0.18], at: [0.45, 0.9, 0] },
        // 下方:一條帶上繫著一串木塊,包住輪的下半圈
        ...Array.from({ length: 7 }, (_, i) => {
          const a = deg(-180 + 12 + i * 26);
          const [x, y] = rot2([DRUM + 0.1, 0], a);
          return { kind: "box", size: [0.17, 0.32, 0.46], at: [x, y, 0], angle: a };
        }),
        { kind: "cylinder", radius: DRUM + 0.27, inner: DRUM + 0.2, length: 0.4, at: [0, 0, 0] },
        // 掛秤盤的環
        { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.1, axis: [1, 0, 0], at: [ARM, 0.75, 0] },
      ],
    },
    {
      id: "stops",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.42, 0.26, 0.3], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 + 0.43, 0] },
        { kind: "box", size: [0.42, 0.26, 0.3], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 - 0.43, 0] },
      ],
    },
    { id: "labelC1", kind: "group", center: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 1.38, 0], label: "C'", labelOffset: [0.5, 0.05, 0.2] },
    { id: "labelC", kind: "group", center: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.52, 0], label: "C", labelOffset: [0.5, -0.05, 0.2] },
    { id: "pan", kind: "group", label: "B", labelOffset: [0, 0.55, 0.6], pieces: [
      { kind: "box", size: [1.6, 0.08, 1.0], at: [0, 0, 0] },
      { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, length: 0.3, at: [-0.15, 0.19, 0] },
      { kind: "box", size: [0.3, 0.22, 0.3], at: [0.35, 0.15, 0] },
    ] },
    ...[0, 1, 2, 3].map((i) => ({ id: `string${i}`, kind: "rod", radius: 0.012 })),
  ],
  driver: { part: "drumA", type: "rotation" },
  states: {
    initial: "right",
    options: [
      { id: "loose", label: "夾得太鬆" },
      { id: "right", label: "剛好" },
      { id: "tight", label: "夾得太緊" },
    ],
  },
  view: { direction: [0.05, 0.12, 1] },
  pose(angle, state = "right") {
    const tilt = TILTS[state];
    const [hx, hy] = rot2([ARM, 0.75], tilt);
    const hook = [PIVOT[0] + hx, PIVOT[1] + hy, 0];
    const pan = [hook[0], hook[1] - PAN_DROP, 0];
    const corners = [[-0.75, -0.45], [0.75, -0.45], [0.75, 0.45], [-0.75, 0.45]];
    const paths = {};
    corners.forEach(([x, z], i) => (paths[`string${i}`] = { points: [hook, [pan[0] + x, pan[1] + 0.04, z]], closed: false }));
    return { parts: { drumA: { angle }, leverD: { angle: tilt }, pan: { position: pan } }, paths, readouts: [] };
  },
};
