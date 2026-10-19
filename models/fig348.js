// 第 348 種:軸轉一圈,桿往復兩次(B. F. Snyder,1836 年專利;J. S. McCurdy 用來驅動縫紉機的針,也驅動成組的鋸)。
// 中央旋轉軸上的碟片 A 有兩道在中心以直角交叉的溝槽 a、a;連桿 B 上以樞軸裝著兩個滑塊 c、c,各在一道溝槽裡。
// 兩個滑塊像橢圓規一樣在溝裡滑,B 相對碟片還能動,要靠 B 的另一端定住:B 的上端接在一根沿鉛直導軌上下的桿上
// (縫紉機的針桿、鋸框),碟片轉一圈,這根桿往復兩次(碟片轉半圈,兩溝互換,姿勢就重複一次),B 跟著左右擺。
// 主動件是碟片 A,目標件是導軌裡的桿。
// 推斷:B 上端接的桿、它的導套與托住導套的機架(原圖 B 往上伸出畫面;原文說它驅動縫紉機的針與鋸);導軌在碟片
// 中心的正上方;B 的長度;碟片的軸與軸承座(原圖只畫出碟片);滑塊以銷裝在 B 上。
// 偏離插圖:原圖把 B 畫成鉛直、偏在中心右邊;B 是連桿、上端在中心正上方的導軌裡,偏到右邊時一定是斜的
// (原圖是示意,507movements 的動畫裡 B 也是斜的)。B 做得比原圖窄、銷頭露在 B 的正面,讓滑塊在溝裡滑看得到
// (原圖用虛線畫被 B 蓋住的滑塊)。
import { deg } from "./kit.js";
import { shape, circle, rect } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = 2.1;
const D = 1.6; // 兩滑塊的間距(原圖兩銷相距約碟片半徑的 0.76)
const L = 3.2; // B 上:上滑塊的銷到上端的銷
const GROOVE = deg(30); // 溝槽 1 在碟片上的方向(溝槽 2 與它垂直)
const FLOOR = -2.6;
const BAR_Z = 0.25; // 連桿 B 的中面(B 在滑塊前面)
const NEEDLE_Z = 0.38; // 導軌裡的桿(在 B 前面)
const GUIDE_Y = 5.35; // 導套的高度(在 B 的上端走得到的最高處之上)

/**
 * 碟片轉 theta → 兩滑塊的位置、B 的擺角 swing(B 從上滑塊往上的方向和鉛直的夾角,逆時針為正)與上端的銷 top。
 * 上滑塊在溝槽 1、下滑塊在溝槽 2;B 的上端在 x = 0 的鉛直線上(導軌)。
 */
export function snyder(theta) {
  const g = theta + GROOVE;
  const e1 = [Math.cos(g), Math.sin(g)];
  const e2 = [-Math.sin(g), Math.cos(g)];
  // B 從上滑塊指向下滑塊的方向 u = (sin s, −cos s);上滑塊 c1 = −D (u·e1) e1、下滑塊 c2 = D (u·e2) e2(c2 − c1 = D u)
  const at = (s) => {
    const u = [Math.sin(s), -Math.cos(s)];
    const k1 = -D * (u[0] * e1[0] + u[1] * e1[1]);
    const k2 = D * (u[0] * e2[0] + u[1] * e2[1]);
    const c1 = [k1 * e1[0], k1 * e1[1]];
    return { c1, c2: [k2 * e2[0], k2 * e2[1]], top: [c1[0] - L * u[0], c1[1] - L * u[1]] };
  };
  // 上端的 x 隨擺角單調(D < L),二分求上端落在導軌上的擺角
  let [lo, hi] = [-1, 1];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid).top[0] > 0) lo = mid;
    else hi = mid;
  }
  const swing = (lo + hi) / 2;
  return { ...at(swing), swing };
}

// 一道溝槽:碟面上兩側凸起的槽壁,在兩道溝交會的中心處斷開(滑塊才能從一道溝穿過另一道溝)。
// 滑塊比 B 寬,B 順著溝槽時滑塊兩側仍露在外面
const WALL = R - 0.15 - 0.3;
const groove = (angle) =>
  [1, -1].flatMap((sx) => [1, -1].map((sy) => ({ kind: "plate", shape: shape(rect(WALL, 0.09, sx * (0.3 + WALL / 2), sy * 0.225)), thickness: 0.08, at: [0, 0, 0.1], angle })));

// B 上的銷:穿過 B 伸進滑塊,銷頭露在 B 的正面
const pin = (y) => [
  { kind: "cylinder", radius: 0.05, length: 0.22, at: [0, y, 0.19] },
  { kind: "cylinder", radius: 0.08, length: 0.04, at: [0, y, BAR_Z + 0.07], accent: true },
];
const BAR_TOP = L + 0.2;
const BAR_BOTTOM = -(D + 0.4);
const NEEDLE = 2.55; // 導軌裡的桿從上端的銷往上的長度
const COLUMN_X = 2.6;

export default {
  figure: 348,
  parts: [
    {
      id: "diskA",
      kind: "group",
      spin: R,
      label: "A",
      labelOffset: [-1.1, -0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.12).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.12, length: 0.6, at: [0, 0, -0.27] }, // 中央旋轉軸,往後伸進軸承座
        ...groove(GROOVE),
        ...groove(GROOVE + Math.PI / 2),
        { kind: "box", size: [0.2, 0.2, 0.15], at: [R - 0.2, 0, 0.08], accent: true },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.42, bore: 0.13, floor: FLOOR }),
        { kind: "box", size: [COLUMN_X + 0.65, 0.18, 0.6], at: [(COLUMN_X + 0.15 - 0.5) / 2, FLOOR - 0.09, -0.42] }, // 底板往右伸到立柱(推斷)
        { kind: "box", size: [0.3, GUIDE_Y + 0.1 - FLOOR + 0.09, 1.03], at: [COLUMN_X, (GUIDE_Y + 0.1 + FLOOR - 0.09) / 2, -0.055] }, // 立柱(推斷)
        { kind: "box", size: [COLUMN_X - 0.12, 0.2, 0.16], at: [(COLUMN_X + 0.12) / 2, GUIDE_Y, NEEDLE_Z] }, // 托導套的臂(推斷)
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.17, inner: 0.085, length: 0.5, at: [0, GUIDE_Y, NEEDLE_Z] }, // 鉛直導套(推斷)
      ],
    },
    { id: "labelA1", kind: "group", center: [-1.3, -0.75, 0.3], label: "a", labelOffset: [0, 0, 0] },
    { id: "labelA2", kind: "group", center: [-0.8, 1.25, 0.3], label: "a", labelOffset: [0, 0, 0] },
    {
      id: "barB",
      kind: "group",
      arrow: false,
      label: "B",
      labelOffset: [0.25, 2.2, 0.4],
      pieces: [{ kind: "box", size: [0.18, BAR_TOP - BAR_BOTTOM, 0.1], at: [0, (BAR_TOP + BAR_BOTTOM) / 2, BAR_Z] }, ...pin(0), ...pin(-D)], // 局部 +Y 從上滑塊的銷往上
    },
    { id: "sliderC1", kind: "box", size: [0.5, 0.32, 0.14], label: "c", labelOffset: [0.3, 0.1, 0.3] },
    { id: "sliderC2", kind: "box", size: [0.5, 0.32, 0.14], label: "c", labelOffset: [0.3, 0.1, 0.3] },
    {
      id: "needleBar",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.28, at: [0, 0, 0.3] }, // 接 B 上端的銷
        { kind: "box", size: [0.3, 0.3, 0.16], at: [0, 0, NEEDLE_Z] }, // 桿下端的頭
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.08, length: NEEDLE, at: [0, NEEDLE / 2, NEEDLE_Z] },
      ],
    },
  ],
  driver: { part: "diskA", type: "rotation" },
  target: "needleBar", // 每圈往復兩次的桿(縫紉機的針桿、鋸框)
  view: { direction: [0.03, 0.04, 1], fit: ["diskA", "barB"] },
  pose(theta) {
    const s = snyder(theta);
    return {
      parts: {
        diskA: { angle: theta },
        sliderC1: { position: [...s.c1, 0.13], angle: theta + GROOVE },
        sliderC2: { position: [...s.c2, 0.13], angle: theta + GROOVE + Math.PI / 2 },
        barB: { position: [...s.c1, 0], angle: s.swing },
        needleBar: { position: [...s.top, 0] },
      },
      readouts: [],
    };
  },
};
