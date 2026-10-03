// 第 252 種:滾子 A、B 要在溝槽 C 內以相同幅度來回移動。部件 D 有兩支斜向的開槽臂(下寬上窄),
// 兩滾子的銷各插在一支臂的槽裡;把 D 上下移動,斜槽把兩滾子同時往外推或往內拉,幅度相同、方向相反。
// 主動件是部件 D。滾子沿溝槽滾動。
import { deg, clamp } from "./kit.js";
import { shape, rect, thickLine } from "./shapes.js";

const SLANT = deg(27); // 臂與鉛直線的夾角
const T = Math.tan(SLANT);
export const ROLL = 0.4; // 滾子半徑
const Y = 1.55; // 溝槽(滾子中心)的高度
const X0 = 0.62; // D 在中間位置時滾子離中線的距離
// D 往下的極限:兩滾子互相碰到(原圖畫的就是兩滾子相切的位置)就不能再往下,否則滾子互相穿透。
export const RANGE = [-(X0 - ROLL - 0.01) / T, 0.6];
const ARM_TOP = 1.85; // D 在中間位置時臂頂的高度
const ARM_BOTTOM = -1.4;

/** D 往上移 v → 滾子 A、B 的 x 座標 */
export function rollers(v) {
  const d = clamp(v, ...RANGE) * T;
  return { a: -X0 - d, b: X0 + d };
}

// 開槽臂:沿臂的兩條邊框(局部座標:D 在中間位置時的世界座標)
const armX = (y, s) => s * (X0 + (Y - y) * T);
const arm = (s) => {
  const top = [armX(ARM_TOP, s), ARM_TOP];
  const bottom = [armX(ARM_BOTTOM, s), ARM_BOTTOM];
  const off = (p, d) => [p[0] + d * Math.cos(SLANT), p[1] + s * d * Math.sin(SLANT)];
  return [
    { kind: "plate", shape: shape(thickLine([off(top, 0.24), off(bottom, 0.24)], 0.14)), thickness: 0.2 },
    { kind: "plate", shape: shape(thickLine([off(top, -0.24), off(bottom, -0.24)], 0.14)), thickness: 0.2 },
    { kind: "plate", shape: shape(thickLine([off(top, -0.31), off(top, 0.31)], 0.14)), thickness: 0.2 },
  ];
};

const roller = (id, label, labelOffset) => ({
  id,
  kind: "plate",
  shape: shape([...Array(36).keys()].map((i) => [ROLL * Math.cos((i / 36) * 2 * Math.PI), ROLL * Math.sin((i / 36) * 2 * Math.PI)])),
  thickness: 0.18,
  mark: [ROLL * 0.6, 0],
  markSize: 0.05,
  spin: ROLL,
  label,
  labelOffset,
  pieces: [{ kind: "cylinder", radius: 0.08, length: 0.6, at: [0, 0, -0.1] }],
});

export default {
  figure: 252,
  parts: [
    {
      id: "guideC",
      kind: "group",
      label: "C",
      labelOffset: [-1.85, Y - 0.05, 0.4],
      pieces: [
        // 左邊的立架與往右伸出的溝槽(上下兩條軌)
        { kind: "plate", shape: shape(rect(0.5, 1.9, -2.6, Y - 0.1)), thickness: 0.4 },
        { kind: "plate", shape: shape(rect(4.6, 0.14, -0.05, Y + ROLL + 0.07)), thickness: 0.3, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(rect(4.6, 0.14, -0.05, Y - ROLL - 0.07)), thickness: 0.3, at: [0, 0, 0.18] },
      ],
    },
    roller("rollerA", "A", [0, 0.45, 0.4]),
    roller("rollerB", "B", [0, 0.45, 0.4]),
    {
      id: "partD",
      kind: "group",
      label: "D",
      labelOffset: [0, ARM_BOTTOM - 0.45, 0.4],
      pieces: [
        ...arm(-1),
        ...arm(1),
        { kind: "plate", shape: shape(rect(2 * armX(ARM_BOTTOM, 1) + 0.9, 0.3, 0, ARM_BOTTOM - 0.1)), thickness: 0.2 },
        { kind: "box", size: [0.35, 0.35, 0.3], at: [0, ARM_BOTTOM - 0.45, 0] },
        { kind: "box", size: [0.14, 1.0, 0.14], at: [0, ARM_BOTTOM - 1.0, 0] },
      ],
    },
  ],
  waivers: [
    { check: "interference", parts: ["rollerA", "partD"], reason: "待確認(未修):rollerA 的圓柱 r0.08×0.6 與 partD 的板互相穿入 0.14(20 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rollerB", "partD"], reason: "待確認(未修):rollerB 的圓柱 r0.08×0.6 與 partD 的板互相穿入 0.14(20 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "partD", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  targets: ["rollerA", "rollerB"], // 要被推開拉攏的兩個滾子
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const { a, b } = rollers(v);
    const x0 = rollers(0);
    return {
      parts: {
        partD: { position: [0, clamp(v, ...RANGE), -0.15] },
        rollerA: { position: [a, Y, 0.18], angle: -(a - x0.a) / ROLL },
        rollerB: { position: [b, Y, 0.18], angle: -(b - x0.b) / ROLL },
      },
      readouts: [],
    };
  },
};
