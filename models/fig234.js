// 第 234 種:軸桿式擒縱機構(verge escapement)。冠狀輪(齒朝上的鋸齒輪,直立的軸)上方橫著一根心軸 S,
// S 上兩片叉瓦 A 分別伸到輪的兩邊、互成一個角度。使 S 往復擺動時,兩片叉瓦輪流擋住、放開冠狀輪的齒,
// 冠狀輪就間歇地轉動:S 每擺一程,輪轉過半個齒。主動件是心軸 S(往復擺動)。
//
// 接觸(由接觸算,共用 pawl-drive.js 的 escapeDrive):冠狀輪受固定的力矩轉(齒的直面在前);兩片叉瓦在輪的左右兩端,
// 各在垂直於心軸的平面裡擺,輪緣上的齒在那裡沿切線走——在這兩個平面上各算叉瓦與齒相碰。心軸往一邊擺時一片叉瓦
// 伸進齒的路徑、另一片退開;輪轉到齒碰上伸進來的叉瓦就停(被叉瓦推回一點),叉瓦退開時從靜止加速轉到碰上另一片。
// 推斷:15 齒、擺幅;冠狀輪的轉向(直面在前);心軸兩端的軸承架、冠狀輪下方的軸承(原圖只畫心軸與輪)。
import { TAU, deg, X, Y, rot2, swing } from "./kit.js";
import { sawCrown } from "./escapement.js";
import { escapeDrive } from "./pawl-drive.js";

const N = 15;
const R = 1.6;
const H = 0.4;
const BASE = 0.35; // 輪緣頂面(齒根)的高度
const PITCH = TAU / N;
const SWING = deg(30);
const ROD_Y = BASE + H + 0.25; // S 的高度
const TEETH_R = R - 0.06; // 齒所在的半徑
// 叉瓦(心軸局部座標:x 朝世界 −z、y 朝上)。只伸到齒尖附近:伸到齒間的 V 底時,冠狀輪被推回會被下一齒的斜面夾住
const FLAG = { w: 0.08, h: 0.4, cx: 0.18, cy: -0.125, tilt: deg(35) };
const SIDE_GAP = 100; // 兩邊的平面在 2D 裡錯開的距離(左端的平面整個移到 u + 100)

// 叉瓦在心軸轉角 φ 時,在它那一端的平面上的外形:(u = 世界 z, y)
const flagAt = (side, phi) => {
  const c = [FLAG.cx * side, FLAG.cy];
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const [px, py] = rot2([(sx * FLAG.w) / 2, (sy * FLAG.h) / 2], FLAG.tilt * side);
    const [lx, ly] = rot2([c[0] + px, c[1] + py], phi);
    return [-lx + (side < 0 ? SIDE_GAP : 0), ROD_Y + ly];
  });
};
// 冠狀輪轉 θ 時,兩端附近的齒(u = 世界 z,y):齒 i 從局部角 i·齒距 的齒根沿斜面升到 (i+1)·齒距 的齒尖,在那裡直落
const teethAt = (theta) => {
  const out = [];
  for (const [side, center] of [[1, 0], [-1, Math.PI]]) {
    const first = Math.floor((center - theta) / PITCH) - 2;
    for (let i = first; i <= first + 4; i++) {
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const w = (i + k / 6) * PITCH + theta;
        pts.push([-TEETH_R * Math.sin(w) + (side < 0 ? SIDE_GAP : 0), BASE + (H * k) / 6]);
      }
      const end = (i + 1) * PITCH + theta;
      pts.push([-TEETH_R * Math.sin(end) + (side < 0 ? SIDE_GAP : 0), BASE]);
      pts.push([pts[0][0], BASE]);
      out.push(pts);
    }
  }
  return out;
};
const vergeAt = (v) => swing(v, -SWING, SWING);
const drive = escapeDrive({
  period: 4 * SWING,
  obstacles: teethAt,
  stops: (v) => [flagAt(1, vergeAt(v)), flagAt(-1, vergeAt(v))],
  dir: 1,
  pitch: PITCH,
  drop: 0.05,
});
const W0 = drive.at(0);

/** 心軸累計擺動 v:冠狀輪的轉角(自起點,繞 +y) */
export const wheelAngle = (v) => drive.at(v) - W0;
export const geometry = { N, PITCH, SWING };
/** 檢查用:主動量 v 時兩端平面上的齒與叉瓦(2D;左端的平面在 u + 100) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { teeth: s.wheel, flags: s.stops };
};

const pallet = (side) => ({ kind: "box", size: [FLAG.w, FLAG.h, 0.32], at: [FLAG.cx * side, FLAG.cy, side * R], angle: FLAG.tilt * side });

export default {
  figure: 234,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      spin: R + 0.1,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.12, length: BASE, at: [0, 0, BASE / 2] },
        { kind: "cylinder", radius: R - 0.06, length: 0.04, at: [0, 0, 0.02] },
        ...sawCrown({ teeth: N, radius: TEETH_R, height: H, base: BASE }),
        { kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, -1.2], mark: true },
      ],
    },
    {
      id: "verge",
      kind: "group",
      center: [0, ROD_Y, 0],
      axis: X,
      arrow: false,
      label: "S",
      labelOffset: [-2.3, 0.35, 0],
      pieces: [{ kind: "cylinder", radius: 0.07, length: 4.6 }, pallet(1), pallet(-1)],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 心軸兩端的軸承架(從底座立起),冠狀輪的軸下端的軸承
        ...[-2.15, 2.15].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.16, inner: 0.07, length: 0.16, at: [x, ROD_Y, 0] },
          { kind: "box", size: [0.16, ROD_Y + 2.4, 0.2], at: [x, (ROD_Y - 2.4) / 2 - 0.12, 0] },
        ]),
        { kind: "box", size: [4.6, 0.12, 1.2], at: [0, -2.5, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.1, length: 0.3, at: [0, -2.3, 0] },
      ],
    },
    { id: "tagA1", kind: "group", center: [-R, ROD_Y - 0.1, 0.35], pieces: [], arrow: false, label: "A" },
    { id: "tagA2", kind: "group", center: [R, ROD_Y - 0.1, 0.35], pieces: [], arrow: false, label: "A" },
  ],
  // 動力重演:只推心軸;冠狀輪受固定的力矩(發條或重錘),由兩片叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    seconds: 16,
    free: { wheel: { spring: 1, gravity: false } },
    ignore: [["wheel", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheel", label: "心軸擺一程,冠狀輪轉半齒", quote: "當使心軸 S 擺動時,冠狀輪便會產生間歇性的旋轉運動" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,轉一齒" },
      { at: 8 * SWING, part: "wheel", label: "兩個來回,轉兩齒" },
    ],
  },
  driver: { part: "verge", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel",
  view: { direction: [0.35, 0.55, 1] },
  pose(v) {
    return { parts: { verge: { angle: vergeAt(v) }, wheel: { angle: drive.at(v) } }, readouts: [] };
  },
};
