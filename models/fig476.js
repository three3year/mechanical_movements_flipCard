// 第 476 種:另一種同理的裝置,蒸汽虹吸泵(Lansdell 的專利)。A 是噴射管;B、B 是兩根吸水管,與排水管 C 呈叉狀相接。
// 蒸汽噴射管在分叉處進入,不會阻礙水往上走,水以不斷的水流向上移動。
// 主動件是虛擬的「進程」(蒸汽持續噴入)。剖面圖。
// 推斷:噴射管從右側繞進分叉處,噴嘴朝上對著 C;兩根吸水管的水在分叉處匯合後一起往上。
import { ejectorPose } from "./ejector.js";
import { shape, thickLine } from "./shapes.js";

const W = 0.32; // 管的半寬
// 叉形管的中線:左腿、右腿在 (0, 0) 匯合,往上是 C
const LEG = (s) => [[s * 1.15, -2.0], [s * 1.15, -0.6], [s * 0.85, -0.05], [s * 0.3, 0.35], [0, 0.6]];
const C = [[0, 0.6], [0, 2.1]];
const JET = [[1.9, 1.0], [1.55, 0.25], [0.9, 0.0], [0.35, 0.05], [0.0, 0.25], [0, 0.65]];

const walls = (pts, w) => [1, -1].map((s) => ({
  kind: "plate",
  shape: shape(thickLine(pts.map(([x, y], i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    return [x - (s * w * dy) / l, y + (s * w * dx) / l];
  }), 0.06)),
  thickness: 0.5,
}));

export default {
  figure: 476,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        ...walls(LEG(-1).slice(0, 4), W),
        ...walls(LEG(1).slice(0, 4), W),
        ...walls(C, W),
        { kind: "plate", shape: shape(thickLine(JET, 0.14)), thickness: 0.14, at: [0, 0, 0.12] },
      ],
    },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [0.45, -0.25, 0.5] },
    { id: "labelB1", kind: "group", pieces: [], label: "B", labelOffset: [-1.15, -1.4, 0.5] },
    { id: "labelB2", kind: "group", pieces: [], label: "B", labelOffset: [1.15, -1.4, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0, 1.7, 0.5] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const z = 0.3;
    return ejectorPose(v, {
      steam: [[...JET.map(([x, y]) => [x, y, z]), [0, 2.2, z]]],
      water: [-1, 1].map((s) => [...LEG(s).map(([x, y]) => [x, y, z]), ...C.slice(1).map(([x, y]) => [x, y, z])]),
    });
  },
};
