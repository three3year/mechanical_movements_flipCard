// 第 150 種:使蒸汽膨脹作動的閥門運動。軸上一串偏心量(擺動幅度)不同的凸輪,可沿軸滑動,
// 讓其中任一個作用在連接閥桿的槓桿上;作用的凸輪偏心量越大,閥門的動作越大。
// 槓桿右端是樞軸,左端的滾子靠在凸輪上,閥桿吊在槓桿中段。狀態切換讓哪一個凸輪在槓桿下面。主動件是軸。
import { shape, circle, stadium } from "./shapes.js";

const RC = 0.95; // 凸輪半徑(相同)
const ECC = { small: 0.12, middle: 0.25, large: 0.38 }; // 各凸輪的偏心量
const ORDER = ["large", "middle", "small"];
const SPACING = 0.32; // 凸輪沿軸的間距
const ROLLER = 0.3;
const PIVOT = [3.3, 0.75, 0];
const ROD_AT = 1.3; // 閥桿離樞軸的距離

// 偏心圓凸輪下,滾子中心(在軸的正上方)的高度
const rollerY = (theta, e) => e * Math.sin(theta) + Math.sqrt((RC + ROLLER) ** 2 - (e * Math.cos(theta)) ** 2);
const ARM = Math.hypot(PIVOT[0], PIVOT[1] - rollerY(0, ECC.middle));

/** 軸轉 theta、選用 state 的凸輪:槓桿的轉角(從樞軸指向滾子的方向)與閥桿的高度 */
export function valve(theta, state) {
  const y = rollerY(theta, ECC[state]);
  const psi = Math.PI - Math.asin((y - PIVOT[1]) / ARM);
  return { y, psi, rod: PIVOT[1] + (ROD_AT / ARM) * (y - PIVOT[1]) };
}
export const eccentricity = ECC;

const STACK_Z = (state) => -ORDER.indexOf(state) * SPACING; // 讓選用的凸輪落在 z = 0(槓桿所在的平面)

export default {
  figure: 150,
  parts: [
    {
      id: "shaft",
      kind: "group",
      posed: true,
      spin: RC + 0.4,
      pieces: [
        ...ORDER.map((k, i) => ({ kind: "plate", shape: shape(circle(RC, 0, ECC[k]), []), thickness: SPACING * 0.85, at: [0, 0, i * SPACING], ...(i === 0 ? { mark: [0, ECC[k] + RC - 0.25], markSize: 0.08 } : {}) })),
        { kind: "cylinder", radius: 0.42, length: 2.2, at: [0, 0, 0.3] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(ARM, 0.36).outline, [circle(0.16).reverse()]), thickness: 0.1, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.25, at: [ARM, 0, 0.1] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2, at: [ROD_AT, 0, 0.35] },
      ],
    },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.1, 1.6, 0.1], at: [0, -0.8, 0] }] },
  ],
  driver: { part: "shaft", type: "rotation" },
  states: {
    options: [
      { id: "large", label: "大幅度凸輪" },
      { id: "middle", label: "中幅度凸輪" },
      { id: "small", label: "小幅度凸輪" },
    ],
    initial: "middle",
  },
  view: { direction: [0.35, 0.15, 1] },
  pose(theta, state = "middle") {
    const { psi, rod } = valve(theta, state);
    return {
      parts: {
        shaft: { position: [0, 0, STACK_Z(state)], angle: theta },
        lever: { angle: psi },
        rod: { position: [PIVOT[0] - ROD_AT, rod, 0.45] },
      },
      readouts: [],
    };
  },
};

