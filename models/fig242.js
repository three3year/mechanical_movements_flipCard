// 第 242 種:起重機與吊升機用的煞車。煞車帶繞過煞車輪將近一圈,兩端接在右邊槓桿上離樞軸不同遠的兩根銷;
// 把槓桿的手柄往下拉,兩根銷把帶的兩端拉向彼此(帶的路徑變長),帶就收緊在煞車輪上。主動件是槓桿。
// 推斷:帶長不變,依兩根銷的位置算出帶包住輪的半徑(收緊時貼在輪上);槓桿可轉的範圍。
import { deg, add, Z, routeRope } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const DRUM = 1.75;
const P = [2.65, -0.35, 0];
const PINS = { upper: [-0.45, 0.62, 0], lower: [-0.62, -0.1, 0] }; // 相對樞軸
const HANDLE = [1.6, 0.42];
const MAX = deg(30);

const pinAt = (which, psi) => {
  const [x, y] = PINS[which];
  return add(P, [x * Math.cos(psi) - y * Math.sin(psi), x * Math.sin(psi) + y * Math.cos(psi), 0]);
};
const route = (psi, r) => routeRope([{ point: pinAt("upper", psi) }, { circle: { center: [0, 0, 0], axis: Z, radius: r, sense: 1 } }, { point: pinAt("lower", psi) }]);
// 帶長:槓桿拉到底(psi = −MAX,手柄往下)時剛好貼在輪上
const LENGTH = route(-MAX, DRUM).length;

/** 槓桿轉 psi(手柄往下為負):帶包住輪的半徑(越小越緊,最小等於輪半徑)與帶的路徑 */
export function brake(psi) {
  let lo = DRUM;
  let hi = DRUM + 1.0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (route(psi, mid).length > LENGTH) hi = mid;
    else lo = mid;
  }
  const r = Math.max(DRUM, (lo + hi) / 2);
  return { r, gap: r - DRUM, strap: route(psi, r) };
}
export const range = [-MAX, 0];

export default {
  figure: 242,
  parts: [
    {
      id: "drum",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(DRUM), [circle(0.32).reverse()]), thickness: 0.4, circles: [DRUM - 0.18] },
        { kind: "cylinder", radius: 0.55, inner: 0.32, length: 0.5 },
      ],
      arrow: false,
    },
    { id: "strap", kind: "rope" },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([PINS.upper.slice(0, 2), [0, 0], HANDLE], 0.2)), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([PINS.lower.slice(0, 2), [0, 0]], 0.2)), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.17, inner: 0.07, length: 0.3 },
        { kind: "cylinder", radius: 0.13, inner: 0.05, length: 0.3, at: PINS.upper },
        { kind: "cylinder", radius: 0.13, inner: 0.05, length: 0.3, at: PINS.lower },
      ],
    },
  ],
  driver: { part: "lever", type: "rotation", range: [-MAX, 0], initial: 0 },
  target: "drum", // 煞車帶是路徑零件不上色,標被它煞住的煞車輪
  view: { direction: [0.06, 0.05, 1] },
  pose(psi) {
    const { gap, strap } = brake(psi);
    return {
      parts: { lever: { angle: psi } },
      paths: { strap: { points: strap.points, closed: false, phase: 0 } },
      readouts: [{ label: "帶與輪的間隙", value: gap < 0.005 ? "收緊" : gap.toFixed(2) }],
    };
  },
};

