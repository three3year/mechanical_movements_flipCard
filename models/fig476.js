// 第 476 種:另一種同理的裝置,蒸汽虹吸泵(Lansdell 的專利)。A 是噴射管;B、B 是兩根吸水管,與排水管 C 呈叉狀相接。
// 蒸汽噴射管在分叉處進入,不會阻礙水往上走,水以不斷的水流向上移動。
// 主動件是虛擬的「進程」(蒸汽持續噴入)。剖面圖。
// 推斷:噴射管照原圖從右上繞到右腿後面(原圖畫成虛線),在兩腿之間的缺口繞一個 U 形回到剖面上,
// 穿過分叉處的拱往上,噴嘴在 C 的喉部正對 C;兩根吸水管的水在分叉處匯合後一起往上。
// 叉形管畫成剖開的管(2026-10-20 重畫,原本每根管只有兩片壁、接頭處有縫):兩腿的外壁一路接到 C 的壁,
// 兩片內壁在分叉處合成拱(拱上開孔讓噴射管穿過,拱的兩半各接著噴射管的壁),背面補上後半的板,各片壁經背面連成一件。
import { ejectorPose } from "./ejector.js";
import { pipeWalls } from "./pump.js";
import { shape, thickLine } from "./shapes.js";

const W = 0.32; // 管的半寬(內)
const T = 0.06; // 壁厚
const DEPTH = 0.5; // 剖開後留下的深度
const C_FROM = 0.95; // 排水管 C(獨立零件)從這個高度起;叉形管的壁往上接到這裡
// 叉形管的中線:左腿、右腿在 (0, 0.6) 匯合,往上是 C
const LEG = (s) => [[s * 1.15, -2.0], [s * 1.15, -0.6], [s * 0.85, -0.05], [s * 0.3, 0.35], [0, 0.6]];
const C = [[0, C_FROM], [0, 2.1]];
const JET = { w: 0.14, t: 0.05, depth: 0.24, r: 0.12 }; // 噴射管:內寬、壁厚、剖開的深度、後面那段圓管的半徑
const JET_HALF = JET.w / 2 + JET.t; // 噴射管的外半寬
// 噴射管:右腿後面的一段圓管(z 在背面板之後),接到缺口裡剖開的 U 形管,往上穿過拱、噴嘴在 C 的喉部
const JET_BEHIND = [[1.95, 1.05, -0.45], [1.6, 0.35, -0.45], [1.05, -0.25, -0.45], [0.78, -0.5, -0.3], [0.58, -0.62, -0.05]];
const JET_CUT = [[0.58, -0.62], [0.3, -0.72], [0.08, -0.58], [0, -0.35], [0, 0.75]];

/** 折線沿法線平移 d(d > 0 往前進方向的左側;轉角處斜接) */
function offset(pts, d) {
  const normal = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  return pts.map(([x, y], i) => {
    const n0 = i > 0 ? normal(pts[i - 1], pts[i]) : normal(pts[i], pts[i + 1]);
    const n1 = i < pts.length - 1 ? normal(pts[i], pts[i + 1]) : n0;
    const n = [n0[0] + n1[0], n0[1] + n1[1]];
    const l = Math.hypot(...n) || 1;
    const k = d / ((n[0] / l) * n0[0] + (n[1] / l) * n0[1]);
    return [x + (n[0] / l) * k, y + (n[1] / l) * k];
  });
}

/** 折線走到 x = limit 為止(從頭走,越過的那一段截在 limit 上) */
function untilX(pts, limit, sign) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    if (sign * (b[0] - limit) < 0) (out.push(b));
    else {
      const f = (limit - a[0]) / (b[0] - a[0]);
      out.push([limit, a[1] + (b[1] - a[1]) * f]);
      break;
    }
  }
  return out;
}

const wallPlate = (line, role) => ({ kind: "plate", role, shape: shape(thickLine(line, T)), thickness: DEPTH });
// 外壁:腿的中線往外偏 W + T/2,一路延伸到 C 的起點;內壁:往內偏,走到噴射管的壁為止(拱上的孔),略伸進噴射管的壁裡接上
// (折線往上走:左腿的左側、右腿的右側是外;偏移量 d > 0 往前進方向的左側)
const outerWall = (s) => wallPlate(offset([...LEG(s), [0, C_FROM]], -s * (W + T / 2)), s < 0 ? "outerL" : "outerR");
const innerWall = (s) => wallPlate(untilX(offset(LEG(s), s * (W + T / 2)), s * (JET_HALF - 0.02), -s), s < 0 ? "innerL" : "innerR");
// 背面的板:叉形管的外輪廓(兩腿的外緣、C 的起點、兩腿之間的缺口沿內壁的外緣到拱頂)
const backOutline = () => {
  const outerL = offset([...LEG(-1), [0, C_FROM]], W + T);
  const outerR = offset([...LEG(1), [0, C_FROM]], -(W + T));
  const notchL = untilX(offset(LEG(-1), -(W + T)), 0, 1);
  const notchR = untilX(offset(LEG(1), W + T), 0, -1);
  return [...outerL, ...outerR.slice().reverse(), ...notchR, ...notchL.slice().reverse().slice(1)];
};

export default {
  figure: 476,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        outerWall(-1),
        outerWall(1),
        innerWall(-1),
        innerWall(1),
        { kind: "plate", shape: shape(backOutline()), thickness: T, at: [0, 0, -DEPTH / 2 - T / 2] },
        // 噴射管 A:右腿後面的圓管,接到缺口裡剖開的 U 形管(兩道壁 + 背面)
        { kind: "tube", points: JET_BEHIND, radius: JET.r },
        ...pipeWalls(JET_CUT, JET.w, JET.t, JET.depth, { back: true }).map((q, i) => (i < 2 ? { ...q, role: "jet" } : q)),
      ],
    },
    // 排水管 C(兩根吸水管的水匯合後從這裡往上送):獨立成一個零件當目標件
    { id: "discharge", kind: "group", pieces: pipeWalls(C, 2 * W, T, DEPTH, { back: true }).map((q, i) => (i < 2 ? { ...q, role: i === 0 ? "wallL" : "wallR" } : q)) },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [0.45, -0.25, 0.5] },
    { id: "labelB1", kind: "group", pieces: [], label: "B", labelOffset: [-1.15, -1.4, 0.5] },
    { id: "labelB2", kind: "group", pieces: [], label: "B", labelOffset: [1.15, -1.4, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0, 1.7, 0.5] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  target: "discharge", // 只有蒸汽與水在動;標水被送出去的排水管 C
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const z = 0.3;
    return ejectorPose(v, {
      steam: [[...JET_BEHIND, ...JET_CUT.map(([x, y]) => [x, y, 0]), [0, 2.2, z]]],
      water: [-1, 1].map((s) => [...LEG(s).slice(0, -1).map(([x, y]) => [x, y, z]), [s * 0.2, 0.7, z], [s * 0.2, 2.2, z]]), // 兩股水在噴射管的兩側匯合、往上
    });
  },
};
