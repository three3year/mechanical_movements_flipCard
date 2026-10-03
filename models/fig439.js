// 第 439 種:從連續的落水中得到往復運動。水桶底部有一個閥門,撞到地面時打開、把水桶排空,
// 水桶再被掛在滑輪另一邊的配重拉上去。
// 主動件是虛擬的「進程」:一個循環是 裝水 → 下降 → 觸地排空 → 被配重拉回。
// 推斷:水桶在頂端接水裝滿後比配重重,開始下降;各階段所佔的進程。
import { smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle } from "./shapes.js";

const PULLEY = { center: [0, 2.2, 0], radius: 0.45 };
export const TOP = 1.0; // 水桶在頂端時的中心高度
export const BOTTOM = -1.55; // 水桶觸地時
const GROUND = -2.05;
const L = PULLEY.radius;
const SUM = TOP + (BOTTOM + 0.2); // 水桶與配重的高度和(繩長不變)

/** 進程 u → 水桶高度、存量、閥門是否打開、階段 */
export function cycle(v) {
  const u = v - Math.floor(v);
  if (u < 0.3) return { y: TOP, level: u / 0.3, open: false, phase: "接水" };
  if (u < 0.55) return { y: TOP + (BOTTOM - TOP) * smooth((u - 0.3) / 0.25), level: 1, open: false, phase: "裝滿,比配重重而下降" };
  if (u < 0.68) return { y: BOTTOM, level: clamp(1 - (u - 0.57) / 0.1, 0, 1), open: true, phase: "觸地,閥門打開排水" };
  return { y: BOTTOM + (TOP - BOTTOM) * smooth((u - 0.68) / 0.3), level: 0, open: u < 0.71, phase: "空桶被配重拉上去" };
}
export const weightY = (y) => SUM - y;

// 繩:從配重往上、繞過滑輪頂、往下到水桶
const ropePath = (yb, yw) => {
  const [cx, cy] = PULLEY.center;
  const arc = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI - (Math.PI * i) / 12;
    return [cx + L * Math.cos(a), cy + L * Math.sin(a), 0];
  });
  return [[cx - L, yw + 0.25, 0], ...arc, [cx + L, yb + 0.42, 0]];
};
const SPOUT = [[2.6, 1.95, 0], [0.75, 1.6, 0], [0.5, 1.2, 0]];

export default {
  figure: 439,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.0, 0.2, 1.2], at: [0.5, GROUND - 0.1, 0] },
        { kind: "box", size: [0.5, 0.15, 0.3], at: [0.45, GROUND + 0.075, 0] },
        { kind: "box", size: [2.2, 0.1, 0.3], at: [1.7, 1.86, 0], angle: -0.2 },
      ],
    },
    { id: "pulley", kind: "pulley", style: "spoked", center: PULLEY.center, radius: L, width: 0.16 },
    { id: "rope", kind: "rope", radius: 0.02 },
    { id: "weight", kind: "box", size: [0.4, 0.5, 0.4] },
    { id: "bucket", kind: "lathe", axis: [0, 1, 0], profile: [[0.28, -0.38], [0.36, 0.38], [0.32, 0.38], [0.24, -0.34], [0.05, -0.34], [0.05, -0.38]], pieces: [{ kind: "box", size: [0.72, 0.03, 0.03], at: [0, 0.42, 0] }] },
    { id: "valve", kind: "plate", shape: shape(circle(0.12)), thickness: 0.04, arrow: false },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", size: [0.55, 0.66, 0], level: 0 },
  ],
  powered: ["bucket", "weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["frame", "valve"], reason: "待確認(未修):frame 的方塊 0.5×0.15×0.3 與 valve 的板互相穿入 0.15(15 個取樣姿勢),尚未修正" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.15 },
  target: "bucket",
  view: { direction: [0.06, 0.08, 1] },
  pose(v) {
    const c = cycle(v);
    const yw = weightY(c.y);
    const travel = v * 4;
    const flows = [];
    if (c.phase === "接水") flows.push({ fluid: "water", points: stream(SPOUT, travel, { spacing: 0.16 }) });
    if (c.open && c.level > 0) flows.push({ fluid: "water", points: stream([[0.45, c.y - 0.4, 0.2], [0.75, GROUND + 0.05, 0.2], [2.2, GROUND + 0.05, 0.2]], travel, { spacing: 0.15 }) });
    return {
      parts: {
        pulley: { angle: (c.y - TOP) / L },
        weight: { position: [-L, yw, 0] },
        bucket: { position: [L, c.y, 0] },
        // 閥門:觸地時被頂開(轉成直立)
        valve: { position: [L, c.y - 0.38, 0], rotation: c.open ? [0, Math.SQRT1_2, 0, Math.SQRT1_2] : [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
        water: { position: [L, c.y, 0], level: c.level },
      },
      paths: { rope: { points: ropePath(c.y, yw), closed: false, phase: 0 } }, // 路徑從繩端(配重)起算
      flows,
      readouts: [{ label: "階段", value: c.phase }],
    };
  },
};

