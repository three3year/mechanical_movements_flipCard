// 第 212 種:日內瓦式擋止(Geneva-stop),用於瑞士錶中限制上發條的圈數。輪 A(下)上有一個齒,每轉一圈進入
// 輪 B(上)的一道槽一次,把 B 推過一格;其餘時間 A 的圓盤卡在 B 兩槽之間的內凹圓弧上,B 不動。
// B 上的凸曲部分 a、b 之間不挖鎖定圓弧,是擋止:A 的齒推著 B 往那一格換格時,凸弧 a–b 轉過來頂到 A 的圓盤,
// A 就轉不動了。可轉的範圍由兩者外形相碰的角度決定。主動件是輪 A。
// 照原圖:B 有五道槽(相鄰槽之間四段內凹鎖定弧、a–b 一段凸弧),所以 B 走三整格,兩端各再走一部分被擋住。
// A 的圓盤朝齒那一側削去一整段(約 72°–108°,半徑從 1.55 削到約 1.34):B 的槽角在換格途中掃過的範圍的包絡,
// 大致是 B 的外圓(geneva.js 的 disk);齒在這段切口的中間。
// 偏離插圖(實物可行):原圖的齒是圓盤上的一個凸出部分;但換格時 B 的槽角會掃過齒根,同一片板上的齒連不回圓盤。
// 這裡把齒做成圓銷,由圓盤後面(B 的後方)的曲柄臂托著——日內瓦機構的常見做法;正面看仍是切口中間的一個齒。
// 推斷:曲柄臂;兩輪的軸承座。
import { TAU, rot2 } from "./kit.js";
import { pedestal } from "./supports.js";
import { geneva, genevaWheel, convexArc } from "./geneva.js";
import { shape, circle } from "./shapes.js";
import { circlePolygon } from "./contact.js";

const C = 2.8;
const RB = 1.45;
const N = 5;
const RA = 1.55; // A 的鎖定圓盤
const PIN = 0.11; // 齒(圓銷)的半徑:槽寬 0.24,兩邊各留 0.01
const CONVEX = 4; // a–b 那一格
const G = geneva({ C, rb: RB, n: N });
const A = [0, -C, 0];

export const stop = G.at;

const slot = { C, rb: RB, n: N, width: 0.24, bottom: C - G.a - 0.12, lock: RA + 0.03 };
const wheelB = genevaWheel({ ...slot, convex: [CONVEX] });
// A 的鎖定圓盤(齒朝上,θ = 0 時正對 B):朝齒那一側整段削去 B 的槽角掃過的範圍
const diskA = G.disk({ wheel: genevaWheel(slot), lock: RA });
const pinA = circlePolygon([0, G.a], PIN, 32);
/** 平面上 A(圓盤、齒)與 B 的外形,各在自己的局部座標;測試用來量接觸 */
export const outlines = { A: [diskA, pinA], B: wheelB };
const INITIAL = 2 * TAU - 0.85 * G.phiE; // 原圖:齒剛進右下方的槽,凸弧 a–b 在右上
export const range = G.stopRange({ parts: outlines.A, wheel: wheelB, from: INITIAL });
const [arcFrom, arcTo] = convexArc(slot, CONVEX);
export const geometry = { C, RB, RA, N, a: G.a, convexArc: [arcFrom, arcTo] };

// B 上 a、b 兩點:凸弧的兩端(a 在上方的槽旁、b 在右邊的槽旁),在 B 的局部座標
const arcEnd = (t) => [(RB + 0.18) * Math.cos(t), (RB + 0.18) * Math.sin(t)];

export default {
  figure: 212,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: A,
      spin: RA,
      label: "A",
      labelOffset: [-0.65, 0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(diskA, [circle(0.22).reverse()]), thickness: 0.2 },
        // 推斷:托著齒的曲柄臂,在 B 的後方(B 的槽角從它前面掃過)
        { kind: "box", size: [0.26, G.a - 0.03, 0.2], at: [0, (G.a + 0.29) / 2, -0.22] },
        { kind: "cylinder", radius: PIN, length: 0.43, at: [0, G.a, -0.105], accent: true },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.35 },
      ],
    },
    {
      id: "wheelB",
      kind: "group",
      spin: RB,
      label: "B",
      labelOffset: [0, 0.6, 0.3],
      pieces: [
        { kind: "plate", shape: shape(wheelB, [circle(0.16).reverse()]), thickness: 0.2, mark: [0.6, 0.6], markSize: 0.07 },
        { kind: "cylinder", radius: 0.28, inner: 0.14, length: 0.35 },
      ],
    },
    { id: "tagA", kind: "group", pieces: [], arrow: false, label: "a" },
    { id: "tagB", kind: "group", pieces: [], arrow: false, label: "b" },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [A, [0, 0]].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.57, at: [x, y, -0.185] },
        ...pedestal({ at: [x, y], z: -0.47, bore: 0.1, floor: -5.22, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "wheelA", type: "rotation", range, initial: INITIAL },
  target: "wheelB",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { b } = stop(theta);
    return {
      parts: {
        wheelA: { angle: theta },
        wheelB: { angle: b },
        tagA: { position: [...rot2(arcEnd(arcTo), b), 0.2] },
        tagB: { position: [...rot2(arcEnd(arcFrom), b), 0.2] },
      },
      readouts: [],
    };
  },
};
