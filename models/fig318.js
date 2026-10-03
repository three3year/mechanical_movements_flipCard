// 第 318 種:錶的調節器。擺輪的游絲 S 內端固定在擺輪軸上、外端固定在擺輪框架的樁 R 上;游絲從槓桿上的兩根
// 制動插梢之間穿過,在 P 處形成一個中立點,游絲只在這個點與擺輪軸之間擺動(實際作用長度)。
// 槓桿繞一個與擺輪軸同心的固定環轉動:往右(FAST)推時,插梢沿游絲往內移,作用長度變短,擺輪擺得變快;
// 往左(SLOW)時相反。主動件是調節槓桿(指針在下方的刻度上)。
// 推斷:游絲圈數與尺寸;作用長度以游絲從內端量到插梢的弧長表示。
import { TAU, deg, clamp } from "./kit.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

export const RANGE = [deg(-22), deg(22)]; // 槓桿角(往右 FAST 為正)
const SPIRAL = { r0: 0.18, r1: 0.62, turns: 3.5 }; // 游絲的內外半徑與圈數
const STUD_ANGLE = deg(180); // 外端固定樁 R 的角度
const POINTER = 2.4; // 槓桿指針長
const LEVER0 = deg(-90); // 槓桿在中間時指向正下方

// 游絲:阿基米德螺線,從外端的樁 R 往內(逆時針)繞到內端;u 從內端(0)量到外端(1)
const spiralAt = (u) => {
  const a = STUD_ANGLE + SPIRAL.turns * TAU * (1 - u);
  const r = SPIRAL.r0 + (SPIRAL.r1 - SPIRAL.r0) * u;
  return [r * Math.cos(a), r * Math.sin(a), 0.12];
};
const ARC = (() => {
  let len = 0;
  const n = 400;
  const cum = [0];
  let prev = spiralAt(0);
  for (let i = 1; i <= n; i++) {
    const p = spiralAt(i / n);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    cum.push(len);
    prev = p;
  }
  return { cum, n, len };
})();

/** 槓桿角 lever → 插梢所在的游絲位置(0–1)、作用長度(從內端量起的弧長) */
export function regulator(lever0) {
  const lever = clamp(lever0, ...RANGE);
  // 插梢在外圈上,方向與槓桿相反(槓桿指針在下、插梢在上方)
  const pinAngle = LEVER0 + Math.PI + lever;
  // 找外圈上角度等於 pinAngle 的那一點(從樁 R 沿外圈逆時針量過去)
  let delta = (pinAngle - STUD_ANGLE) % TAU;
  if (delta < 0) delta += TAU;
  const u = 1 - delta / (SPIRAL.turns * TAU);
  const i = Math.round(u * ARC.n);
  return { u, active: ARC.cum[clamp(i, 0, ARC.n)], pinAngle };
}

const springPoints = (from, to) => {
  const n = Math.max(2, Math.round((to - from) * 160));
  return Array.from({ length: n + 1 }, (_, i) => spiralAt(from + ((to - from) * i) / n));
};

export default {
  figure: 318,
  parts: [
    {
      id: "balance",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(1.85), [circle(1.65).reverse()]), thickness: 0.14 },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.6, 0.1, 0.08], at: [0.85 * Math.cos(deg(90) + (i * TAU) / 3), 0.85 * Math.sin(deg(90) + (i * TAU) / 3), 0], angle: deg(90) + (i * TAU) / 3 })),
        { kind: "cylinder", radius: 0.1, length: 0.4 },
      ],
    },
    // 固定環與刻度(SLOW 在左、FAST 在右)
    {
      id: "plate",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(2.55, deg(-125), deg(-55)), ...arcPoints(2.25, deg(-55), deg(-125))]), thickness: 0.06, at: [0, 0, -0.2] },
        ...Array.from({ length: 9 }, (_, i) => {
          const a = deg(-125) + (i / 8) * deg(70);
          return { kind: "box", size: [0.3, 0.025, 0.04], at: [2.4 * Math.cos(a), 2.4 * Math.sin(a), -0.15], angle: a };
        }),
        { kind: "plate", shape: shape(circle(0.3), [circle(0.12).reverse()]), thickness: 0.06, at: [0, 0, 0.22] },
      ],
    },
    { id: "studR", kind: "box", center: [SPIRAL.r1 * Math.cos(STUD_ANGLE) - 0.1, SPIRAL.r1 * Math.sin(STUD_ANGLE), 0.12], size: [0.14, 0.2, 0.2], label: "R", labelOffset: [-0.25, 0, 0.2] },
    { id: "springActive", kind: "rod", radius: 0.02, label: "S", center: [0, 0.35, 0.12], labelOffset: [0, 0.15, 0.2] },
    { id: "springDead", kind: "rod", radius: 0.012 },
    {
      id: "lever",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [POINTER, 0]], 0.1)), thickness: 0.05, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape([[POINTER - 0.15, -0.08], [POINTER + 0.4, 0], [POINTER - 0.15, 0.08]]), thickness: 0.05, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [-SPIRAL.r1 - 0.05, 0]], 0.08)), thickness: 0.04, at: [0, 0, 0.3] },
        // 兩根制動插梢,夾著游絲外圈
        { kind: "cylinder", radius: 0.025, length: 0.25, at: [-SPIRAL.r1 + 0.05, 0, 0.18] },
        { kind: "cylinder", radius: 0.025, length: 0.25, at: [-SPIRAL.r1 - 0.06, 0, 0.18] },
      ],
    },
    { id: "labelP", kind: "group", center: [0, -SPIRAL.r1 - 0.25, 0.3], label: "P", labelOffset: [0.2, 0, 0] },
    { id: "labelSlow", kind: "group", center: [-2.1, -1.9, 0], label: "SLOW", labelOffset: [-0.3, 0, 0] },
    { id: "labelFast", kind: "group", center: [2.1, -1.9, 0], label: "FAST", labelOffset: [0.3, 0, 0] },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE, initial: 0 },
  target: "balance", // 快慢被調節的擺輪(模型裡它不動,只有游絲的作用長度隨槓桿改變)
  view: { direction: [0.03, 0.04, 1] },
  pose(lever0) {
    const lever = clamp(lever0, ...RANGE);
    const { u } = regulator(lever);
    return {
      parts: { lever: { angle: LEVER0 + lever } },
      paths: { springActive: { points: springPoints(0, u), closed: false }, springDead: { points: springPoints(u, 1), closed: false } },
      readouts: [],
    };
  },
};
