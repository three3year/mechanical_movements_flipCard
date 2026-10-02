// 第 126 種:曲柄搖臂(bell-crank)槓桿,用來改變力的方向。繩從左邊垂下、繞過上方的滑輪往下接到搖臂的橫臂端;
// 往下拉左邊的繩,橫臂端被拉起,搖臂繞樞軸轉,直臂下端往左擺、把接在它上面的水平繩往左拉。主動件是左邊的繩端。
import { Z, routeRope } from "./kit.js";

const PULLEY = { center: [-1.4, 1.6, 0], radius: 0.95 };
const PIVOT = [1.45, -0.95, 0];
const ARM = { across: 1.9, down: 1.55 };
const RANGE = [0, 0.9];
const LEFT_X = PULLEY.center[0] - PULLEY.radius - 0.05;
const LEFT_END0 = [LEFT_X, -0.6, 0];

/** 繩端往下拉 d:搖臂的轉角(0 為原圖位置,順時針為負) */
export function crank(d) {
  // 橫臂端原本在樞軸左方 ARM.across;繩把它往上拉 d
  const lift = Math.min(ARM.across * 0.9, d);
  const angle = -Math.asin(lift / ARM.across);
  const across = [PIVOT[0] - ARM.across * Math.cos(angle), PIVOT[1] - ARM.across * Math.sin(angle), 0];
  const down = [PIVOT[0] + ARM.down * Math.sin(angle), PIVOT[1] - ARM.down * Math.cos(angle), 0];
  return { angle, across, down };
}
export const arms = ARM;

export default {
  figure: 126,
  parts: [
    {
      id: "pulley",
      kind: "pulley",
      style: "disc",
      center: PULLEY.center,
      radius: PULLEY.radius,
      width: 0.3,
    },
    {
      id: "crank",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM.across, 0.18, 0.1], at: [-ARM.across / 2, 0, 0] },
        { kind: "box", size: [0.18, ARM.down, 0.1], at: [0, -ARM.down / 2, 0] },
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2 },
        { kind: "cylinder", radius: 0.16, inner: 0.06, length: 0.2, at: [-ARM.across, 0, 0] },
        { kind: "cylinder", radius: 0.16, inner: 0.06, length: 0.2, at: [0, -ARM.down, 0] },
      ],
    },
    { id: "handle", kind: "ropeEnd", center: LEFT_END0, size: 0.14 },
    { id: "rope", kind: "rope" },
    { id: "rope2", kind: "rope" },
  ],
  driver: { part: "handle", type: "translation", direction: [0, -1, 0], range: RANGE },
  view: { direction: [0.06, 0.05, 1] },
  pose(d) {
    const { angle, across, down } = crank(d);
    const end = [LEFT_X, LEFT_END0[1] - d, 0];
    const rope = routeRope([{ point: end }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: across }]);
    const moved = down[0] - crank(0).down[0]; // 直臂下端的水平位移(往左為負)
    return {
      parts: {
        handle: { position: end },
        crank: { angle },
        pulley: { angle: d / PULLEY.radius },
      },
      paths: {
        // 往下拉時繩往起點那頭走(相位減少);水平繩整條跟著直臂下端移動
        rope: { points: rope.points, closed: false, phase: -d },
        rope2: { points: [down, [down[0] + 2.4, down[1], 0]], closed: false, phase: moved },
      },
      readouts: [],
    };
  },
};

