// 第 394 種:C. Parsons 的專利裝置,把往復運動轉成旋轉。一個無端齒條(跑道形的框,齒朝內,兩端是半圓)由往復的桿推拉;
// 小齒輪在框裡面,框的側面有一道溝(導邊),小齒輪的兩個凸緣(一大一小,同心)沿著它走,讓小齒輪一直咬著框上的齒:
// 框往一個方向走時小齒輪咬著下排的齒,走到盡頭時小齒輪繞過一端的半圓齒,換咬上排;框往回走時,小齒輪仍朝同一方向轉。
// 可以代替擺動式汽缸引擎的曲柄(框跟著換排上下移一點,推拉桿接在擺動的汽缸上)。
//
// 2026-10-07 複查:原文說這是把往復轉成旋轉,輸入是往復的齒條框;原本的模型反過來以小齒輪為主動件,改成框當主動件
// (往復)、小齒輪當目標件。框原本是方形、兩端沒有齒,框在盡頭停住橫移(示意);改成照原圖的跑道形,兩端的半圓上也有齒,
// 小齒輪的中心相對框走一圈跑道形的路線(由凸緣貼著導邊決定),小齒輪轉的角度 = 這條路線的長度 ÷ 節圓半徑(滾動不打滑)。
// 推斷:齒數與跑道的尺寸;導邊畫成框後面一層的板(凸緣貼著它的內緣);小齒輪的軸往後經框中間的空處伸到軸承座。
import { TAU, swingPhase } from "./kit.js";
import { shape } from "./shapes.js";
import { pedestal } from "./supports.js";

const NP = 10;
const RP = 0.42; // 小齒輪節圓半徑
const PITCH = (TAU * RP) / NP;
const HALF = (9 * PITCH) / Math.PI; // 框上齒的節線:上下兩排相距 2·HALF,兩端是半徑 HALF 的半圓(半圓上剛好 9 齒)
const C = HALF - RP; // 小齒輪中心相對框走的跑道:直線段在 y = ±C,兩端半圓的半徑 C
export const LEN = 10 * PITCH; // 直線段的長度
const FLANGE = 0.22; // 凸緣半徑(貼著導邊的內緣走)
const REACH = LEN / 2 + C; // 框往一邊走到底時離中間多遠
export const RANGE = [-REACH, REACH];

/**
 * 框的位置 x 與走的方向(forward:往 +x)→ 小齒輪中心相對框的位置與走過的路線長(從跑道最右端起,繞一圈為 2·LEN + 2πC)。
 * 框往 +x 走時,小齒輪相對框往 −x 走:沿下排(y = −C);往回走時沿上排。框在兩端換向時,小齒輪正繞到半圓的最外點。
 */
export function track(x, forward) {
  const px = -x; // 小齒輪中心相對框的 x
  const loop = 2 * LEN + 2 * Math.PI * C;
  const arc = (k) => Math.acos(Math.max(-1, Math.min(1, k)));
  if (forward) {
    // 下半:右端半圓的下半 → 下排 → 左端半圓的下半
    if (px > LEN / 2) { const a = arc((px - LEN / 2) / C); return { p: [px, -C * Math.sin(a)], s: C * a }; }
    if (px >= -LEN / 2) return { p: [px, -C], s: (C * Math.PI) / 2 + (LEN / 2 - px) };
    const b = arc((-px - LEN / 2) / C);
    return { p: [px, -C * Math.sin(b)], s: (C * Math.PI) / 2 + LEN + C * (Math.PI / 2 - b) };
  }
  // 上半:左端半圓的上半 → 上排 → 右端半圓的上半
  const half = loop / 2;
  if (px < -LEN / 2) { const b = arc((-px - LEN / 2) / C); return { p: [px, C * Math.sin(b)], s: half + C * b }; }
  if (px <= LEN / 2) return { p: [px, C], s: half + (C * Math.PI) / 2 + (px + LEN / 2) };
  const a = arc((px - LEN / 2) / C);
  return { p: [px, C * Math.sin(a)], s: half + (C * Math.PI) / 2 + LEN + C * (Math.PI / 2 - a) };
}

/** 主動量 v(框的累計行程)→ 框的位置、小齒輪的轉角(逆時針,連續同向) */
export function parsons(v) {
  const { at, cycle, forward } = swingPhase(v, -REACH, REACH);
  const t = track(at, forward);
  const loop = 2 * LEN + 2 * Math.PI * C;
  return { x: at, frame: [-t.p[0], -t.p[1]], pinion: (cycle * loop + t.s) / RP, forward };
}
export const geometry = { RP, C, HALF, LEN, FLANGE };

// 跑道形(逆時針):直線段長 LEN、兩端半圓半徑 r
function stadium(r, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (Math.PI * i) / n; pts.push([LEN / 2 + r * Math.cos(a), r * Math.sin(a)]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (Math.PI * i) / n; pts.push([-LEN / 2 + r * Math.cos(a), r * Math.sin(a)]); }
  return pts;
}
// 框上朝內的齒:沿節線每隔一個齒距一齒(方塊,頂端伸到節線內側)
const teeth = [];
{
  const add = (x, y, nx, ny) => teeth.push({ kind: "box", size: [0.16, PITCH * 0.45, 0.2], at: [x - nx * 0.02, y - ny * 0.02, 0], angle: Math.atan2(ny, nx) });
  for (let i = 0; i < 10; i++) {
    const x = -LEN / 2 + (i + 0.5) * PITCH;
    add(x, HALF, 0, 1);
    add(-x, -HALF, 0, -1);
  }
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) * Math.PI) / 9;
    add(LEN / 2 + HALF * Math.cos(a), HALF * Math.sin(a), Math.cos(a), Math.sin(a));
    add(-LEN / 2 - HALF * Math.cos(a), -HALF * Math.sin(a), -Math.cos(a), -Math.sin(a));
  }
}
const OUTER = stadium(HALF + 0.28);
const ROD_X = LEN / 2 + HALF + 0.28;

export default {
  figure: 394,
  parts: [
    { id: "base", kind: "group", pieces: pedestal({ at: [0, 0], z: -0.75, bore: 0.06, floor: -(HALF + 0.9) }) },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(OUTER, [stadium(HALF + 0.1).reverse()]), thickness: 0.22 },
        ...teeth,
        // 導邊:框後面一層的板,內緣是小齒輪凸緣走的路線(凸緣一直貼著它)
        { kind: "plate", shape: shape(OUTER, [stadium(C + FLANGE).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        // 往右伸出的推拉桿
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.6, at: [ROD_X + 0.8, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 0.15, at: [ROD_X + 1.55, 0, 0] },
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      teeth: NP,
      radius: RP,
      width: 0.25,
      bore: 0.06,
      pieces: [
        { kind: "cylinder", radius: RP * 0.7, length: 0.06, at: [0, 0, 0.15] }, // 前面的大凸緣
        { kind: "cylinder", radius: FLANGE, length: 0.1, at: [0, 0, -0.2] }, // 後面的小凸緣(在導邊那一層)
        { kind: "cylinder", radius: 0.06, length: 0.75, at: [0, 0, -0.45] }, // 軸,往後伸進軸承座
      ],
    },
  ],
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], cycle: RANGE },
  target: "pinion", // 連續朝同一方向轉的小齒輪(原文:把往復運動轉成旋轉)
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const p = parsons(v);
    return { parts: { pinion: { angle: p.pinion }, frame: { position: [p.frame[0], p.frame[1], 0] } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["frame", "pinion"], reason: "簡化齒形:框上的齒畫成方塊,與小齒輪的梯形齒重疊" },
  ],
};
