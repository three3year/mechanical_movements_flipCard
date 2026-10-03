// 第 155 種:往復直線運動轉換為間歇的圓周運動。肘節槓桿套在齒輪的軸上擺動,右臂接著上下往復的桿,
// 上臂頂端裝著棘爪,爪尖伸進齒輪的齒間。桿往一個方向動時棘爪推動齒輪,往回時滑過齒背;
// 依棘爪作用在哪一側(爪尖朝左或朝右),齒輪朝相反的方向轉。用於刨床等工具的進給運動。
// 主動量是桿的累計行程(見 kit.swing)。
import { swing, polar } from "./kit.js";
import { ratchetAdvance } from "./ratchets.js";
import { shape, circle } from "./shapes.js";

const GEAR = { teeth: 28, radius: 1.9 };
const ARM = 2.15; // 右臂(接桿處)離軸心的距離
const SWING = (2 * 2 * Math.PI) / GEAR.teeth; // 每次往復擺過兩齒
const STROKE = 2 * ARM * Math.sin(SWING / 2);
const TOP = 2.35; // 棘爪樞軸離軸心的距離

/** 主動量 v(桿的累計行程)、棘爪方向:槓桿與齒輪的轉角 */
export function feed(v, side) {
  const y = swing(v, STROKE / 2, -STROKE / 2); // 桿從高處往下
  const lever = Math.asin(y / ARM);
  // side = +1:棘爪推齒輪順時針(桿往下的那一程推動);−1:往上的那一程推動、逆時針
  const pushed = ratchetAdvance(side > 0 ? v : v + STROKE, STROKE, SWING, side > 0 ? SWING / 2 - lever : lever + SWING / 2);
  return { lever, gear: -side * pushed, y };
}
export const step = SWING;
export const stroke = STROKE;

const pawl = (side) => ({
  kind: "plate",
  shape: shape([[-0.12, 0.1], [side * 0.35, 0.18], [side * 0.62, -0.35], [side * 0.5, -0.42], [side * 0.2, -0.05], [-0.12, -0.1]], [circle(0.06).reverse()]),
  thickness: 0.1,
  at: [0, TOP, 0.15],
});

export default {
  figure: 155,
  parts: [
    { id: "gear", kind: "gear", teeth: GEAR.teeth, radius: GEAR.radius, width: 0.22, bore: 0.3, hub: false, pieces: [{ kind: "cylinder", radius: 1.45, inner: 1.38, length: 0.24 }] },
    {
      id: "lever",
      kind: "group",
      center: [0, 0, 0.3],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.55, -0.45], [ARM, -0.25], [ARM, 0.25], [0.65, 0.35], [0.4, TOP], [-0.4, TOP], [-0.6, 0.3]], [circle(0.45).reverse(), circle(0.12, ARM, 0).reverse(), circle(0.12, 0, TOP).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.6, inner: 0.45, length: 0.2 },
      ],
    },
    { id: "pawlRight", kind: "group", posed: true, arrow: false, pieces: [pawl(1)] },
    { id: "pawlLeft", kind: "group", posed: true, arrow: false, pieces: [pawl(-1)] },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.3, 2.6, 0.12], at: [0, 1.4, 0] }, { kind: "cylinder", radius: 0.26, inner: 0.12, length: 0.18 }] },
  ],
  driver: { part: "rod", type: "translation", direction: [0, -1, 0], cycle: [0, STROKE] },
  target: "gear",
  states: {
    options: [
      { id: "cw", label: "棘爪在右側(順時針)" },
      { id: "ccw", label: "棘爪在左側(逆時針)" },
    ],
    initial: "cw",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(v, state = "cw") {
    const side = state === "cw" ? 1 : -1;
    const { lever, gear, y } = feed(v, side);
    const end = polar(ARM, lever);
    return {
      parts: {
        gear: { angle: gear },
        lever: { angle: lever },
        pawlRight: { rotation: [0, 0, Math.sin(lever / 2), Math.cos(lever / 2)], position: [0, 0, 0.3], visible: side > 0 },
        pawlLeft: { rotation: [0, 0, Math.sin(lever / 2), Math.cos(lever / 2)], position: [0, 0, 0.3], visible: side < 0 },
        rod: { position: [end[0], end[1], 0.45] },
      },
      readouts: [],
    };
  },
};

