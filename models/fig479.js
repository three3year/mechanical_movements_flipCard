// 第 479 種:儲氣槽。底部開口的容器 A 放在盛水的槽 B 裡,由重物 C、C 部分平衡。氣體經插進槽底的兩根管子之一進入,經另一根
// 離開。氣體進入時 A 上升,反之下降。壓力靠增減重物 C、C 調節。
// 主動件是虛擬的「槽裡的氣量」。剖面圖。
// 推斷:重物的繩子繫在 A 的兩肩,鉛直上到肩正上方的滑輪、繞過滑輪再鉛直垂下掛重物(原圖);A 升起時重物下降同樣的距離。
// 滑輪的立柱原圖沒畫:立在槽旁的地面上(原圖的槽挖在地裡,地面與槽頂齊平),在滑輪與重球的後面一層。
import { tankParts, waterPart, bellPart, bellBottom, gasFlows, BELL, TANK } from "./gasometer.js";

export const PULLEY_R = 0.25;
export const PULLEY_Y = 2.7;
export const WEIGHT_R = 0.3;
const POST_X = BELL.r + 0.06 + PULLEY_R; // 滑輪中心:內側的切點正好在 A 的肩(凸緣外緣)上方
const HANG = 0.85; // 氣量為 0(A 最低、重物最高)時滑輪軸到重物頂的繩長:重物頂停在滑輪下約一個球徑
const ROPE = PULLEY_Y - (bellBottom(0) + BELL.h) + Math.PI * PULLEY_R + HANG; // 每邊繩長(A 的肩到重物頂)

export default {
  figure: 479,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...tankParts(),
        // 立柱立在地面上(推斷),在滑輪與重球的後面一層,滑輪的軸銷從柱頂的橫臂往前伸(重球沿柱的前面上下,不碰到柱)
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.12, PULLEY_Y + 0.15 - TANK.y1, 0.12], at: [s * (POST_X + 0.3), (PULLEY_Y + 0.15 + TANK.y1) / 2, -0.42] },
          { kind: "box", size: [0.42, 0.12, 0.12], at: [s * (POST_X + 0.15), PULLEY_Y, -0.42] },
          { kind: "cylinder", radius: 0.03, length: 0.54, at: [s * POST_X, PULLEY_Y, -0.21] },
        ]),
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [-1.2, -1.2, 0.6] },
    waterPart,
    bellPart(),
    ...[-1, 1].map((s) => ({ id: `pulley${s > 0 ? "R" : "L"}`, kind: "pulley", style: "spoked", center: [s * POST_X, PULLEY_Y, 0], radius: PULLEY_R, width: 0.08 })), // 兩個滑輪轉向相反,各有箭頭
    ...[-1, 1].map((s) => ({ id: `weight${s > 0 ? "R" : "L"}`, kind: "sphere", radius: WEIGHT_R, label: "C", labelOffset: [-s * 0.45, 0, 0.3] })),
    { id: "ropeL", kind: "rope", radius: 0.015 },
    { id: "ropeR", kind: "rope", radius: 0.015 },
  ],
  powered: ["bell"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "槽裡的氣量", mode: "balance", range: [0, 1], initial: 0.5, format: (g) => Math.round(g * 100) + "%" },
  target: "bell",
  view: { direction: [0.06, 0.08, 1] },
  pose(g) {
    const bottom = bellBottom(g);
    const shoulder = bottom + BELL.h; // 繩端:A 的肩頂
    const parts = { bell: { position: [0, bottom, 0] } };
    const paths = {};
    for (const s of [-1, 1]) {
      const k = s > 0 ? "R" : "L";
      const inner = s * (POST_X - PULLEY_R); // 內側的切點(肩的正上方)
      const outer = s * (POST_X + PULLEY_R); // 外側的切點(重物的正上方)
      // 繩長守恆:肩到滑輪 + 繞過滑輪的半圈 + 滑輪到重物頂
      const wy = PULLEY_Y - (ROPE - (PULLEY_Y - shoulder) - Math.PI * PULLEY_R);
      parts[`pulley${k}`] = { angle: -s * (bottom / PULLEY_R) };
      parts[`weight${k}`] = { position: [outer, wy - WEIGHT_R, 0] };
      const arc = Array.from({ length: 9 }, (_, i) => {
        const a = (s > 0 ? Math.PI : 0) - (s * Math.PI * i) / 8;
        return [s * POST_X + PULLEY_R * Math.cos(a), PULLEY_Y + PULLEY_R * Math.sin(a), 0];
      });
      paths[`rope${k}`] = { points: [[inner, shoulder, 0], ...arc, [outer, wy, 0]], closed: false, phase: 0 }; // 從繩端(A 的肩)起算
    }
    return {
      parts,
      paths,
      flows: gasFlows(g),
      readouts: [{ label: "A 的高度", value: (bottom - bellBottom(0)).toFixed(2) }],
    };
  },
};
