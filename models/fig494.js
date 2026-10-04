// 第 494 種:吊石塊等用的吊鉗。拉動連接兩個環節的鉤環時,環節作用在吊鉗的上臂,使它的尖端壓緊或嵌進石塊。
// 重量越大,吊鉗咬得越緊。
// 主動件是虛擬的「拉起」:鉤環被拉高的量。
// 推斷:兩支鉗臂交叉在中間的鉸點上(剪刀式),上臂經兩節環節接到鉤環;鉤環被拉起時兩個上臂端互相靠近,下面的尖端往內夾,
// 碰到石塊後整組連同石塊一起上升;夾緊的力與「重量 × 環節的斜度」成正比(讀數示意)。
import { clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, thickLine, rect } from "./shapes.js";

const PIVOT = [0, 1.25, 0];
const LINK = 0.7;
const STONE = { w: 1.9, h: 2.0 }; // 石塊(頂在 y = 0.95)
export const GRIP_X = STONE.w / 2; // 尖端碰到石塊側面
export const SHACKLE0 = 1.9; // 鉤環的起始高度
// 左鉗臂(局部,鉸點在原點):上臂端在左上,彎下來的尖端在右下(與右鉗臂交叉)
const U_LOCAL = [-0.52, 0.15];
const TIP_LOCAL = [1.35, -1.7];
const ARM_W = 0.1;
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const ARM_PATH = [[-0.52, 0.15], [0, 0], [1.15, -0.6], [1.5, -1.2], TIP_LOCAL];
// 真正碰到石塊的是鉗臂末端內側的角(臂有寬度,末端一段斜著往內),不是中心線的端點
const TIP_INNER = (() => {
  const [p, q] = ARM_PATH.slice(-2);
  const t = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const n = [-Math.sin(t), Math.cos(t)];
  const a = [q[0] + (n[0] * ARM_W) / 2, q[1] + (n[1] * ARM_W) / 2];
  const b = [q[0] - (n[0] * ARM_W) / 2, q[1] - (n[1] * ARM_W) / 2];
  return a[0] < b[0] ? a : b;
})();

/** 鉤環高 y → 左鉗臂的轉角、上臂端、尖端內側角(右鉗臂對稱) */
function arms(y) {
  const U = circleCircle(PIVOT, Math.hypot(...U_LOCAL), [0, y, 0], LINK, 1).point;
  const open = Math.atan2(U[1] - PIVOT[1], U[0] - PIVOT[0]) - Math.atan2(U_LOCAL[1], U_LOCAL[0]);
  const t = rot(TIP_INNER, open);
  return { U, open, tip: [PIVOT[0] + t[0], PIVOT[1] + t[1], 0] };
}

/** 拉起 u → 鉤環高度、整組上升量、尖端的位置、是否夾緊 */
export function tongs(u0) {
  const u = clamp(u0, 0, 1);
  // 先拉到尖端碰到石塊側面,之後整組連同石塊一起上升
  let lo = SHACKLE0;
  let hi = SHACKLE0 + 0.55;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (arms(mid).tip[0] > GRIP_X) lo = mid;
    else hi = mid;
  }
  const grip = (lo + hi) / 2;
  const travel = u * 2.0;
  const close = Math.min(travel, grip - SHACKLE0);
  const lift = Math.max(0, travel - (grip - SHACKLE0));
  const g = arms(SHACKLE0 + close);
  return { shackle: SHACKLE0 + close + lift, lift, ...g, gripped: travel >= grip - SHACKLE0 };
}

const arm = (s) => shape(thickLine(ARM_PATH.map(([x, y]) => [s * x, y]), ARM_W));

export default {
  figure: 494,
  parts: [
    { id: "ground", kind: "box", center: [0, -1.18, 0], size: [4, 0.15, 1.4] },
    { id: "stone", kind: "plate", shape: shape(rect(STONE.w, STONE.h, 0, -0.05)), thickness: 1.0, arrow: false },
    { id: "armL", kind: "plate", shape: arm(1), thickness: 0.08, arrow: false },
    { id: "armR", kind: "plate", shape: arm(-1), thickness: 0.08, arrow: false },
    { id: "linkL", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkR", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "rope", kind: "rope", radius: 0.03 },
  ],
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "拉起", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  target: "stone", // 要被夾住吊起的石塊
  view: { direction: [0.06, 0.06, 1] },
  pose(u) {
    const t = tongs(u);
    const up = (p, z = 0) => [p[0], p[1] + t.lift, z];
    return {
      parts: {
        stone: { position: [0, t.lift, 0] },
        armL: { position: up(PIVOT, 0.05), angle: t.open },
        armR: { position: up(PIVOT, -0.05), angle: -t.open },
        linkL: { from: up(t.U, 0.1), to: up([0, t.shackle - t.lift, 0], 0.1) },
        linkR: { from: up([-t.U[0], t.U[1], 0], 0.1), to: up([0, t.shackle - t.lift, 0], 0.1) },
      },
      paths: { rope: { points: [[0, t.shackle + 0.05, 0.1], [0, 3.6, 0.1]], closed: false, phase: 0 } },
      readouts: [{ label: "吊鉗", value: t.gripped ? "尖端咬進石塊,一起吊起" : "收攏中" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["stone", "armR"], reason: "石鉗夾住石塊:鉗尖嵌進石塊側面的凹窩(凹窩沒畫),重疊 0.41" },
    { check: "interference", parts: ["stone", "armL"], reason: "石鉗夾住石塊:鉗尖嵌進石塊側面的凹窩(凹窩沒畫),重疊 0.41" },
  ],
};
