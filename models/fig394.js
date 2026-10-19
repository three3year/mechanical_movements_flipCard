// 第 394 種:C. Parsons 的專利裝置,把往復運動轉成旋轉。一個無端齒條(跑道形的框,齒朝內,兩端是半圓)由往復的桿推拉;
// 小齒輪在框裡面,框的側面有溝,小齒輪的兩個凸緣(一大一小,同心)沿著溝走,讓小齒輪一直咬著框上的齒:
// 框往一個方向走時小齒輪咬著下排的齒,走到盡頭時小齒輪繞過一端的半圓齒,換咬上排;框往回走時,小齒輪仍朝同一方向轉。
// 可以代替擺動式汽缸引擎的曲柄(框跟著換排上下移一點,推拉桿接在擺動的汽缸上)。
//
// 2026-10-07 複查:原文說這是把往復轉成旋轉,輸入是往復的齒條框;原本的模型反過來以小齒輪為主動件,改成框當主動件
// (往復)、小齒輪當目標件。框原本是方形、兩端沒有齒,框在盡頭停住橫移(示意);改成照原圖的跑道形,兩端的半圓上也有齒,
// 小齒輪的中心相對框走一圈跑道形的路線(由凸緣貼著溝壁決定),小齒輪轉的角度 = 這條路線的長度 ÷ 節圓半徑(滾動不打滑)。
//
// 2026-10-20(model-audit-fixes-3 #394-1~3):
// - 凸緣照 525 px 原圖放大:小齒輪外圍的圓盤比小齒輪大,上緣以虛線畫到上排齒的後面——凸緣在齒的後面、伸進齒條側邊的溝。
//   兩個凸緣照原圖的比例,半徑約小齒輪齒尖的 1.25 倍與 1.55 倍;框在齒板後面做成兩層台階(兩道溝),小凸緣在前一層、
//   大凸緣在後一層,各沿自己那一道溝的外壁走(凸緣最外的一點始終貼著溝壁)。偏離插圖:原圖大凸緣只畫出下半,
//   模型兩個凸緣都是整圓(凸緣跟著小齒輪轉,不會只有半圈),大凸緣的上半在框板後面。框外緣要容得下大凸緣的溝,比原圖寬
//   (齒根外約 0.41,原圖約 0.23)。
// - 框的齒改成框板內緣的齒廓(和框板同一塊,不再是一個個離框板 0.04 的方塊);兩層台階和齒板前後貼齊。
// - 主動量改成小齒輪中心沿跑道走的路程(小齒輪是帶飛輪的輸出、等速轉),框的位置由它反推:框在兩端繞半圓換向時
//   像曲柄帶的活塞一樣慢下來,不再是框等速、換向時小齒輪瞬間猛轉。轉向箭頭擺到框板前面,咬上排時不被框蓋住。
// 推斷:齒數與跑道的尺寸;兩道溝的深度與層次;小齒輪的軸往後經框中間的空處伸到軸承座。
import { TAU } from "./kit.js";
import { shape, arcPoints, gearSize } from "./shapes.js";
import { pedestal } from "./supports.js";

const NP = 10;
const RP = 0.42; // 小齒輪節圓半徑
const PITCH = (TAU * RP) / NP;
const { m: MOD } = gearSize(RP, NP);
const TIP = RP + MOD; // 小齒輪齒尖半徑
const HALF = (9 * PITCH) / Math.PI; // 框上齒的節線:上下兩排相距 2·HALF,兩端是半徑 HALF 的半圓(半圓上剛好 9 齒)
const C = HALF - RP; // 小齒輪中心相對框走的跑道:直線段在 y = ±C,兩端半圓的半徑 C
export const LEN = 10 * PITCH; // 直線段的長度
const LOOP = 2 * LEN + 2 * Math.PI * C; // 跑道一圈
const REACH = LEN / 2 + C; // 框往一邊走到底時離中間多遠
export const RANGE = [-REACH, REACH];
// 兩個凸緣(原圖約齒尖的 1.25 與 1.55 倍)與它們走的溝:溝壁離跑道 C + 凸緣半徑(多留 0.004 的間隙)
const FLANGES = [
  { radius: 1.25 * TIP, z: [-0.2, -0.12], layer: [-0.21, -0.11] },
  { radius: 1.55 * TIP, z: [-0.3, -0.22], layer: [-0.31, -0.21] },
];
const CLEAR = 0.004;
const BAND = C + FLANGES[1].radius + CLEAR + 0.15; // 框外緣離中線

/** 小齒輪中心相對框走過的路程 s(從跑道最右端起,先走下半)→ 相對框的位置 */
function trackPoint(s0) {
  const s = ((s0 % LOOP) + LOOP) % LOOP;
  const q = (Math.PI * C) / 2; // 四分之一圓
  if (s < q) return [LEN / 2 + C * Math.cos(-s / C), C * Math.sin(-s / C)];
  if (s < q + LEN) return [LEN / 2 - (s - q), -C];
  if (s < 3 * q + LEN) { const a = -Math.PI / 2 - (s - q - LEN) / C; return [-LEN / 2 + C * Math.cos(a), C * Math.sin(a)]; }
  if (s < 3 * q + 2 * LEN) return [-LEN / 2 + (s - 3 * q - LEN), C];
  const a = Math.PI / 2 - (s - 3 * q - 2 * LEN) / C;
  return [LEN / 2 + C * Math.cos(a), C * Math.sin(a)];
}

/**
 * 主動量 v(小齒輪中心沿跑道的累計路程,一程 = 半圈跑道)→ 框的位置、小齒輪的轉角(逆時針,連續同向)。
 * 小齒輪中心相對框沿跑道順時針走(先沿下排往左,框往右),滾動不打滑:小齒輪轉角 = 路程 ÷ 節圓半徑;
 * 起點的半個齒距是讓小齒輪的齒槽對著框上跑道最右端的那一齒。
 */
export function parsons(v) {
  const p = trackPoint(v);
  const s = ((v % LOOP) + LOOP) % LOOP;
  return { x: -p[0], frame: [-p[0], -p[1]], pinion: v / RP + Math.PI / NP, forward: s < LOOP / 2 };
}
export const geometry = { RP, C, HALF, LEN, TIP };

// 跑道形(逆時針):直線段長 LEN、兩端半圓半徑 r
function stadium(r, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (Math.PI * i) / n; pts.push([LEN / 2 + r * Math.cos(a), r * Math.sin(a)]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (Math.PI * i) / n; pts.push([-LEN / 2 + r * Math.cos(a), r * Math.sin(a)]); }
  return pts;
}

// 框板內緣的齒廓(逆時針):沿節線(離中線 HALF 的跑道)每隔一個齒距一齒,齒朝內;齒形和 shapes.js 的齒條、內齒輪一樣
// (節線上齒厚 0.42 齒距、齒側斜 14°、齒冠 1 模數、齒根 1.2 模數)。σ 從左下角沿下排往右量。
function pitchPoint(sigma, w) {
  const s = ((sigma % (2 * LEN + 2 * Math.PI * HALF)) + 2 * LEN + 2 * Math.PI * HALF) % (2 * LEN + 2 * Math.PI * HALF);
  const arc = Math.PI * HALF;
  const r = HALF - w; // w:往內(朝跑道中線)的距離
  if (s < LEN) return [-LEN / 2 + s, -r];
  if (s < LEN + arc) { const a = -Math.PI / 2 + (s - LEN) / HALF; return [LEN / 2 + r * Math.cos(a), r * Math.sin(a)]; }
  if (s < 2 * LEN + arc) return [LEN / 2 - (s - LEN - arc), r];
  const a = Math.PI / 2 + (s - 2 * LEN - arc) / HALF;
  return [-LEN / 2 + r * Math.cos(a), r * Math.sin(a)];
}
function toothedLoop() {
  const n = Math.round((2 * LEN + 2 * Math.PI * HALF) / PITCH); // 38 齒
  const flank = Math.tan((14 * Math.PI) / 180);
  const halfAt = (w) => Math.max(0.05 * MOD, (0.42 * PITCH) / 2 - w * flank); // w:從節線往齒頂(朝內)
  const [tip, root] = [MOD, -1.2 * MOD];
  const pts = [];
  for (let k = 0; k < n; k++) {
    const c = (k + 0.5) * PITCH;
    for (const f of [0.15, 0.3]) pts.push(pitchPoint(c - 0.5 * PITCH + f * PITCH * 0.5, root)); // 齒根(半圓上沿弧取點)
    pts.push(pitchPoint(c - halfAt(root), root), pitchPoint(c - halfAt(tip), tip), pitchPoint(c + halfAt(tip), tip), pitchPoint(c + halfAt(root), root));
    for (const f of [0.7, 0.85]) pts.push(pitchPoint(c + 0.5 * PITCH * f, root));
    pts.push(pitchPoint(c + 0.5 * PITCH, root));
  }
  return pts;
}
const OUTER = stadium(BAND);
const ROD_X = LEN / 2 + BAND;

export default {
  figure: 394,
  parts: [
    { id: "base", kind: "group", pieces: pedestal({ at: [0, 0], z: -0.75, bore: 0.06, floor: -(C + BAND + 0.12) }) },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        // 齒板:內緣就是齒廓
        { kind: "plate", shape: shape(OUTER, [toothedLoop().reverse()]), thickness: 0.22 },
        // 側邊的兩道溝:齒板後面兩層台階,內緣是兩個凸緣各自走的溝壁(凸緣最外的一點一直貼著它)
        ...FLANGES.map((f) => ({
          kind: "plate",
          shape: shape(OUTER, [stadium(C + f.radius + CLEAR).reverse()]),
          thickness: f.layer[1] - f.layer[0],
          at: [0, 0, (f.layer[0] + f.layer[1]) / 2],
        })),
        // 往右伸出的推拉桿
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.6, at: [ROD_X + 0.8 - 0.02, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 0.15, at: [ROD_X + 1.55, 0, 0] },
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      teeth: NP,
      radius: RP,
      width: 0.22,
      bore: 0.06,
      spinOffset: 0.2, // 轉向箭頭擺在框板前面(咬上排時箭頭在上排齒的前面,不被框蓋住)
      pieces: [
        ...FLANGES.map((f) => ({ kind: "cylinder", radius: f.radius, length: f.z[1] - f.z[0], at: [0, 0, (f.z[0] + f.z[1]) / 2] })),
        { kind: "cylinder", radius: 0.06, length: 0.75, at: [0, 0, -0.45] }, // 軸,往後伸進軸承座(兩個凸緣固定在軸上)
      ],
    },
  ],
  // 主動量是小齒輪中心沿跑道的路程(框的往復由它反推);一程 = 半圈跑道
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], cycle: [0, LOOP / 2] },
  target: "pinion", // 連續朝同一方向轉的小齒輪(原文:把往復運動轉成旋轉)
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const p = parsons(v);
    return { parts: { pinion: { angle: p.pinion }, frame: { position: [p.frame[0], p.frame[1], 0] } }, readouts: [] };
  },
};
