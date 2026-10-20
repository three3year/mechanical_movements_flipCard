// 第 426 種:另一種旋轉式引擎。汽缸裡有兩個不動的擋板 D、D;兩個活塞 A、A 為了能通過擋板,做成可以在主軸 B 的輪轂 C 的
// 溝槽裡徑向滑動。蒸汽同時作用在兩個活塞上,使輪轂與軸旋轉。蒸汽依箭頭進出。
// 主動件是主軸 B(原圖箭頭:逆時針)。
// 推斷:汽缸內壁在兩個擋板處收到輪轂的半徑,兩旁以斜坡過渡,活塞外端始終貼著內壁;每個擋板的逆時針側進汽、
// 順時針側排汽,所以兩個活塞同時被推。
// 2026-10-20 複查 #426-1、#426-2、#424-3:輪轂的溝槽真的開出來——輪轂是一塊背板加前面兩個 D 形半塊,兩個半塊之間就是
// 貫穿直徑的溝槽(原圖畫出溝槽與裡面的活塞),活塞在溝槽裡、看得到;活塞外端改成圓頭,伸出的距離由接觸算(圓頭推到剛好碰到內壁,
// 斜坡上也貼著滑);汽道改成從外面經汽缸壁中層的開口進缸膛、端頭停在內壁外;底座接到汽缸的外緣。
import { TAU, deg, clamp, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

export const BORE = 1.7; // 汽缸內半徑(擋板以外)
export const HUB = 1.0; // 輪轂 C 的半徑(擋板處的內壁)
const OUTER = BORE + 0.2; // 汽缸外半徑
const FLAT = deg(9); // 擋板頂面的半寬
const RAMP = deg(42); // 斜坡到這裡回到 BORE
export const PISTON = 0.74; // 活塞長(縮到底時圓頭中心在 0.93、內端離軸心 0.19,軸的半徑 0.16;伸到底時還有 0.11 在溝槽裡)
export const HEAD = 0.07; // 活塞半寬 = 圓頭半徑
const GROOVE = HEAD + 0.01; // 溝槽半寬
export const ABUTMENTS = [0, Math.PI];
const PORT = deg(16); // 汽口離擋板的角度
const OPEN = deg(4); // 汽缸壁上開口的半角
const Z = { hub: [-0.28, -0.2, 0.28], piston: [-0.19, 0.27], port: 0.15, ring: 0.3 }; // 輪轂背板與半塊、活塞的深度範圍;汽道(與中層環)、汽缸環的半厚

/** 汽缸內壁的半徑(角度 phi) */
export function wall(phi) {
  let d = Infinity;
  for (const a of ABUTMENTS) d = Math.min(d, Math.abs(Math.atan2(Math.sin(phi - a), Math.cos(phi - a))));
  return HUB + (BORE - HUB) * smooth(clamp((d - FLAT) / (RAMP - FLAT), 0, 1));
}
const polar = (r, a, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];
const wallPoint = (a) => [wall(a) * Math.cos(a), wall(a) * Math.sin(a)];
const bore = Array.from({ length: 360 }, (_, i) => wallPoint((TAU * i) / 360));

/** 活塞的外形(局部:圓頭中心在原點、內端在 −PISTON) */
export const PISTON_OUTLINE = [[-PISTON, -HEAD], ...arcPoints(HEAD, -Math.PI / 2, Math.PI / 2), [-PISTON, HEAD]];

/**
 * 活塞沿角度 a 伸出時圓頭中心離軸心的距離:由接觸算——圓頭沿半徑往外推,推到剛好碰到內壁(內壁取樣 0.25°)。
 * 斜坡上碰到的是圓頭的側面,所以比中線上的內壁略低
 */
export function reach(a) {
  const e = [Math.cos(a), Math.sin(a)];
  let best = Infinity;
  for (let i = -240; i <= 240; i++) {
    const p = wallPoint(a + i * deg(0.25));
    const pe = p[0] * e[0] + p[1] * e[1];
    const disc = pe * pe - (p[0] * p[0] + p[1] * p[1]) + HEAD * HEAD;
    if (disc < 0) continue;
    best = Math.min(best, pe - Math.sqrt(disc)); // 沿半徑往外走,圓心第一次離這個壁點只剩 HEAD 的位置
  }
  return best;
}

// 汽道:進汽道在擋板的逆時針側、排汽道在順時針側;從外面水平過來、轉成徑向、經汽缸壁的開口進缸膛,
// 端頭停在內壁外(端頭是平的,斜坡上要離遠一點,角才不會伸進缸膛)
const portEnd = (a) => Math.max(wall(a - deg(3)), wall(a + deg(3))) + 0.03;
const port = (abut, dir) => {
  const a = abut + dir * PORT;
  const out = abut === 0 ? 1 : -1;
  const p1 = polar(OUTER + 0.05, a, 0.2);
  return [[out * (BORE + 0.9), p1[1], 0.2], p1, polar(portEnd(a), a, 0.2)];
};
export const inlets = ABUTMENTS.map((a) => port(a, 1));
export const exhausts = ABUTMENTS.map((a) => port(a, -1).reverse());
const PORT_ANGLES = ABUTMENTS.flatMap((a) => [a - PORT, a + PORT]);

// 汽缸壁:前、後層整圈;中層在四個汽口處開口(開口 ±OPEN,汽道從開口穿進來)
/** 環從角度 a0 到 a1(逆時針)的一段 */
const sector = (a0, a1) => {
  const n = Math.max(2, Math.ceil(((a1 - a0) / TAU) * 360));
  return [...arcPoints(OUTER, a0, a1), ...Array.from({ length: n + 1 }, (_, i) => wallPoint(a1 - ((a1 - a0) * i) / n))];
};
const middle = PORT_ANGLES.map((a, i) => sector(a + OPEN, PORT_ANGLES[(i + 1) % PORT_ANGLES.length] - OPEN + (i === PORT_ANGLES.length - 1 ? TAU : 0)));

// 輪轂:背板一塊,前面兩個 D 形半塊,兩個半塊之間是貫穿直徑的溝槽(沿局部 x;活塞 1 在 +x、活塞 2 在 −x)
const half = (s) => {
  const b = Math.asin(GROOVE / HUB);
  return s > 0 ? arcPoints(HUB, b, Math.PI - b) : arcPoints(HUB, Math.PI + b, TAU - b);
};

/** 在 a0 到 a1(逆時針)之間、輪轂與內壁之間的蒸汽 */
function steamBetween(a0, a1, travel) {
  const dots = [];
  const n = Math.max(1, Math.round((a1 - a0) / deg(7)));
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5 + 0.3 * Math.sin(travel * 2 + i))) / n;
    const gap = wall(a) - HUB;
    if (gap < 0.12) continue;
    for (const f of gap > 0.5 ? [0.3, 0.7] : [0.5]) dots.push(polar(HUB + gap * f, a, 0.05));
  }
  return dots;
}

const PISTON_Z = (Z.piston[0] + Z.piston[1]) / 2;
export default {
  figure: 426,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(OUTER), [bore.slice().reverse()]), thickness: Z.ring - Z.port, at: [0, 0, (Z.ring + Z.port) / 2] },
        { kind: "plate", shape: shape(circle(OUTER), [bore.slice().reverse()]), thickness: Z.ring - Z.port, at: [0, 0, -(Z.ring + Z.port) / 2] },
        ...middle.map((outline) => ({ kind: "plate", shape: shape(outline), thickness: 2 * Z.port })),
        { kind: "plate", shape: shape(circle(OUTER)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [2.6, 0.25, 0.9], at: [0, -BORE - 0.3, 0] },
        ...[...inlets, ...exhausts].map((p) => ({ kind: "plate", shape: shape(thickLine(p.map(([x, y]) => [x, y]), 0.1)), thickness: 2 * Z.port })),
      ],
    },
    { id: "abutD1", kind: "group", label: "D", labelOffset: [HUB + 0.25, -0.05, 0.4], pieces: [] },
    { id: "abutD2", kind: "group", label: "D", labelOffset: [-HUB - 0.25, 0.05, 0.4], pieces: [] },
    {
      id: "hub",
      kind: "group",
      label: "C",
      labelOffset: [-0.55, 0.45, 0.4],
      spin: HUB + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(HUB)), thickness: Z.hub[1] - Z.hub[0], at: [0, 0, (Z.hub[0] + Z.hub[1]) / 2] }, // 背板(溝槽的底)
        { kind: "plate", shape: shape(half(1)), thickness: Z.hub[2] - Z.hub[1], at: [0, 0, (Z.hub[1] + Z.hub[2]) / 2], mark: [0, HUB - 0.15], markSize: 0.08 },
        { kind: "plate", shape: shape(half(-1)), thickness: Z.hub[2] - Z.hub[1], at: [0, 0, (Z.hub[1] + Z.hub[2]) / 2] },
        { kind: "cylinder", radius: 0.16, length: 1.0, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", label: "B", labelOffset: [0.25, -0.25, 0.4], pieces: [] },
    { id: "piston1", kind: "plate", shape: shape(PISTON_OUTLINE), thickness: Z.piston[1] - Z.piston[0], label: "A", labelOffset: [0, 0, 0.4], arrow: false },
    { id: "piston2", kind: "plate", shape: shape(PISTON_OUTLINE), thickness: Z.piston[1] - Z.piston[0], label: "A", labelOffset: [0, 0, 0.4], arrow: false },
  ],
  // 動力重演:只推輪轂;活塞 1 沿輪轂的溝槽滑(和輪轂不算碰撞),被蒸汽(以彈簧代表)往外壓,外端貼著缸壁;
  // 經過擋板時被缸壁的斜坡推回溝槽裡。只比對到這裡:重演的彈簧力固定在起始的方向(不跟著輪轂轉),
  // 活塞轉過半圈後彈簧反而往裡推,「過了擋板再伸出來」那一段重演做不出來
  replay: {
    free: { piston1: { slide: [0, 1, 0], on: "hub", spring: 1, gravity: false, limits: [-(BORE - HUB) - 0.05, 0.05] } }, // 溝槽的深度限住活塞
    expect: [
      { at: Math.PI / 2 + Math.PI / 2, part: "piston1", label: "活塞經過擋板,被缸壁推回溝槽裡", quote: "被設計為可在主軸 B 的輪轂 C 上的溝槽內徑向滑動" },
    ],
  },
  driver: { part: "hub", type: "rotation", speed: 0.6, initial: Math.PI / 2 },
  targets: ["piston1", "piston2"], // 軸 B 就是主動件(輪轂);標受蒸汽推、在輪轂裡滑進滑出的兩個活塞 A
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const angles = [theta, theta + Math.PI];
    const travel = theta;
    const dots = [];
    // 每個擋板的逆時針側到前面的活塞之間充滿蒸汽
    for (const a of ABUTMENTS) {
      const ahead = Math.min(...angles.map((p) => (((p - a) % TAU) + TAU) % TAU).filter((d) => d > FLAT));
      dots.push(...steamBetween(a + FLAT, a + ahead - deg(4), travel));
    }
    const flows = [
      { fluid: "steam", points: [...dots, ...inlets.flatMap((p) => stream(p, travel, { spacing: 0.18 }))] },
      { fluid: "steam", points: exhausts.flatMap((p) => stream(p, travel, { spacing: 0.18 })) },
    ];
    const r = angles.map(reach);
    return {
      parts: {
        hub: { angle: theta },
        piston1: { position: polar(r[0], angles[0], PISTON_Z), angle: angles[0] },
        piston2: { position: polar(r[1], angles[1], PISTON_Z), angle: angles[1] },
      },
      flows,
      readouts: [{ label: "活塞伸出", value: `${(r[0] + HEAD - HUB).toFixed(2)} / ${(r[1] + HEAD - HUB).toFixed(2)}` }],
    };
  },
};
