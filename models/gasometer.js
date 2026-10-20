// 儲氣槽(第 479、480 種)共用:底部開口的鐘形容器 A 倒扣在盛水的槽 B 裡,氣體從槽底的管子進出;進氣時 A 上升,出氣時下降。
// 主動件是虛擬的「槽裡的氣量」。剖面圖。
// 原圖的槽 B 挖在地裡,地面與槽頂齊平、往兩邊延伸(兩側的斜線);兩根氣管插進槽底、穿出槽外再橫著伸出(原文「插入槽底的兩根管子」)。
import { X, Y, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

export const TANK = { r: 1.55, y0: -1.8, y1: 0.0 };
export const BELL = { r: 1.3, h: 1.9 };
export const WATER = -0.15;
export const RANGE = [0, 1];
export const GROUND = { x1: 3.1, y0: -2.0, depth: 1.6 }; // 槽兩旁的地面:從槽的外壁到 x1,深到 y0,只畫剖面後面的那一半
export const PIPE = { x: 0.3, r: 0.07, top: 0.095, run: -2.15, out: 3.1 }; // 氣管:在槽裡 x=±0.3 直上到水面上,穿出槽底到 run 的高度再橫著伸到 ±out
const LOW = -1.6; // 氣量為 0 時 A 的下緣
const HIGH = -0.45; // 氣量最大時 A 的下緣(仍浸在水裡)

/** 氣量 g(0–1)→ 鐘的下緣高度 */
export const bellBottom = (g) => LOW + (HIGH - LOW) * clamp(g, 0, 1);

export const tankParts = () => [
  { kind: "lathe", axis: Y, profile: [[0, 0], [TANK.r + 0.08, 0], [TANK.r + 0.08, TANK.y1 - TANK.y0], [TANK.r, TANK.y1 - TANK.y0], [TANK.r, 0.08], [0, 0.08]], at: [0, TANK.y0, 0], ...backHalf(Y) },
  // 槽兩旁的地面(原圖兩側的斜線):槽挖在地裡,地面與槽頂齊平
  ...[-1, 1].map((s) => ({ kind: "box", role: "ground", size: [GROUND.x1 - (TANK.r + 0.08), TANK.y1 - GROUND.y0, GROUND.depth], at: [s * (TANK.r + 0.08 + GROUND.x1) / 2, (TANK.y1 + GROUND.y0) / 2, -GROUND.depth / 2] })),
  // 兩根氣管(一進一出):插進槽底,頂端在水面上;穿出槽底後各往外橫著伸出(原圖)
  ...[-1, 1].flatMap((s) => [
    { kind: "cylinder", role: "pipe", radius: PIPE.r, length: PIPE.top - (PIPE.run - PIPE.r), axis: Y, at: [s * PIPE.x, (PIPE.top + PIPE.run - PIPE.r) / 2, 0] },
    { kind: "cylinder", role: "pipe", radius: PIPE.r, length: PIPE.out - (PIPE.x - PIPE.r), axis: X, at: [s * (PIPE.out + PIPE.x - PIPE.r) / 2, PIPE.run, 0] },
  ]),
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

/** 氣體的進出(點):從左管進、右管出,沿管子走(橫管 → 直管 → 鐘裡) */
export const gasFlows = (g) => {
  const top = bellBottom(g) + BELL.h - 0.2;
  const z = 0.2;
  return [
    {
      fluid: "air",
      points: [
        ...stream([[-PIPE.out, PIPE.run, z], [-PIPE.x, PIPE.run, z], [-PIPE.x, PIPE.top, z], [-0.6, top, z]], g * 12, { spacing: 0.22 }),
        ...stream([[0.6, top, z], [PIPE.x, PIPE.top, z], [PIPE.x, PIPE.run, z], [PIPE.out, PIPE.run, z]], g * 12, { spacing: 0.22 }),
      ],
    },
  ];
};
