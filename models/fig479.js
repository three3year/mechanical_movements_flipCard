// 第 479 種:儲氣槽。底部開口的容器 A 放在盛水的槽 B 裡,由重物 C、C 部分平衡。氣體經插進槽底的兩根管子之一進入,經另一根
// 離開。氣體進入時 A 上升,反之下降。壓力靠增減重物 C、C 調節。
// 主動件是虛擬的「槽裡的氣量」。剖面圖。
// 推斷:重物的繩子繞過兩邊柱頂的滑輪接到 A 的頂上;A 升起時重物下降同樣的距離。
import { tankParts, waterPart, bellPart, bellBottom, gasFlows, BELL, TANK } from "./gasometer.js";

const POST_X = 1.85;
const PULLEY_Y = 2.6;
const PULLEY_R = 0.25;
const ROPE = 3.3; // 每邊繩長(A 頂到重物)

export default {
  figure: 479,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...tankParts(),
        { kind: "box", size: [0.12, PULLEY_Y - TANK.y1 + 0.3, 0.12], at: [-POST_X - 0.3, (PULLEY_Y + TANK.y1) / 2, 0] },
        { kind: "box", size: [0.12, PULLEY_Y - TANK.y1 + 0.3, 0.12], at: [POST_X + 0.3, (PULLEY_Y + TANK.y1) / 2, 0] },
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [-1.2, -1.2, 0.6] },
    waterPart,
    bellPart(),
    ...[-1, 1].map((s) => ({ id: `pulley${s > 0 ? "R" : "L"}`, kind: "pulley", style: "spoked", center: [s * POST_X, PULLEY_Y, 0], radius: PULLEY_R, width: 0.08, arrow: false })),
    ...[-1, 1].map((s) => ({ id: `weight${s > 0 ? "R" : "L"}`, kind: "sphere", radius: 0.3, label: "C", labelOffset: [-s * 0.45, 0, 0.3] })),
    { id: "ropeL", kind: "rope", radius: 0.015 },
    { id: "ropeR", kind: "rope", radius: 0.015 },
  ],
  driver: { type: "virtual", label: "槽裡的氣量", mode: "balance", range: [0, 1], initial: 0.5, format: (g) => Math.round(g * 100) + "%" },
  view: { direction: [0.06, 0.08, 1] },
  pose(g) {
    const bottom = bellBottom(g);
    const top = bottom + BELL.h + 0.35;
    const parts = { bell: { position: [0, bottom, 0] } };
    const paths = {};
    for (const s of [-1, 1]) {
      const k = s > 0 ? "R" : "L";
      const over = [s * (POST_X - PULLEY_R), PULLEY_Y];
      const down = [s * (POST_X + PULLEY_R), PULLEY_Y];
      const used = Math.hypot(over[0] - s * 0.15, over[1] - top) + Math.PI * PULLEY_R;
      const wy = PULLEY_Y - (ROPE - used);
      parts[`pulley${k}`] = { angle: -s * (bottom / PULLEY_R) };
      parts[`weight${k}`] = { position: [down[0], wy - 0.3, 0] };
      const arc = Array.from({ length: 9 }, (_, i) => {
        const a = (s > 0 ? Math.PI : 0) - (s * Math.PI * i) / 8;
        return [s * POST_X + PULLEY_R * Math.cos(a), PULLEY_Y + PULLEY_R * Math.sin(a), 0];
      });
      paths[`rope${k}`] = { points: [[s * 0.15, top, 0], ...arc, [down[0], wy, 0]], closed: false };
    }
    return {
      parts,
      paths,
      flows: gasFlows(g),
      readouts: [{ label: "A 的高度", value: (bottom - bellBottom(0)).toFixed(2) }],
    };
  },
};
