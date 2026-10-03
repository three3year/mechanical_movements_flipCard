// 儲氣槽(第 479、480 種)共用:底部開口的鐘形容器 A 倒扣在盛水的槽 B 裡,氣體從槽底的管子進出;進氣時 A 上升,出氣時下降。
// 主動件是虛擬的「槽裡的氣量」。剖面圖。
import { Y, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

export const TANK = { r: 1.55, y0: -1.8, y1: 0.0 };
export const BELL = { r: 1.3, h: 1.9 };
export const WATER = -0.15;
export const RANGE = [0, 1];
const LOW = -1.6; // 氣量為 0 時 A 的下緣
const HIGH = -0.45; // 氣量最大時 A 的下緣(仍浸在水裡)

/** 氣量 g(0–1)→ 鐘的下緣高度 */
export const bellBottom = (g) => LOW + (HIGH - LOW) * clamp(g, 0, 1);

export const tankParts = () => [
  { kind: "lathe", axis: Y, profile: [[0, 0], [TANK.r + 0.08, 0], [TANK.r + 0.08, TANK.y1 - TANK.y0], [TANK.r, TANK.y1 - TANK.y0], [TANK.r, 0.08], [0, 0.08]], at: [0, TANK.y0, 0], ...backHalf(Y) },
  // 兩根伸進槽底的氣管(一進一出),頂端在水面上
  { kind: "cylinder", radius: 0.07, length: WATER - TANK.y0 + 0.25, axis: Y, at: [-0.3, (WATER + TANK.y0) / 2 + 0.12, 0] },
  { kind: "cylinder", radius: 0.07, length: WATER - TANK.y0 + 0.25, axis: Y, at: [0.3, (WATER + TANK.y0) / 2 + 0.12, 0] },
];
export const waterPart = { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (TANK.y0 + 0.08 + WATER) / 2, 0], size: [2 * TANK.r - 0.04, WATER - TANK.y0 - 0.08, 0], level: 1 };
export const bellPart = (extra = {}) => ({
  id: "bell",
  kind: "lathe",
  axis: Y,
  profile: [[BELL.r, 0], [BELL.r + 0.06, 0], [BELL.r + 0.06, BELL.h], [0, BELL.h + 0.35], [0, BELL.h + 0.29], [BELL.r, BELL.h - 0.06]],
  ...backHalf(Y),
  arrow: false,
  label: "A",
  labelOffset: [0, BELL.h - 0.2, 0.6],
  ...extra,
});

/** 氣體的進出(點):從左管進、右管出 */
export const gasFlows = (g) => {
  const top = bellBottom(g) + BELL.h - 0.2;
  return [{ fluid: "air", points: [...stream([[-0.3, TANK.y0 - 0.3, 0.2], [-0.3, WATER + 0.1, 0.2], [-0.6, top, 0.2]], g * 12, { spacing: 0.22 }), ...stream([[0.6, top, 0.2], [0.3, WATER + 0.1, 0.2], [0.3, TANK.y0 - 0.3, 0.2]], g * 12, { spacing: 0.22 })] }];
};
