// 第 179 種:單一引擎的換向齒輪。偏心輪鬆套在軸上,由軸上的一個凸出部分推著偏心輪側面一個近半圓形的凸出部分轉動;
// 這個設計讓偏心輪能在軸上相對轉動半圈。換向時:抬起偏心桿(釋放閥門心軸),用左邊的直立槓桿把閥門扳到另一邊,
// 引擎反轉後,軸上的凸出部分在半圓凸出部分的另一端推動偏心輪——偏心輪相對軸轉了半圈,閥門的動作因此反向——
// 再把偏心桿放下。主動件是軸;前進與後退是狀態(切換時偏心輪轉半圈)。
import { deg, polar, add } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [2.6, 0, 0];
const ECC = 0.35;
const ROD = 3.9;
const VALVE_Y = 0.05;
const LEVER = { pivot: [-1.95, -0.95, 0.12], length: 3.2 }; // 手柄貼著閥門心軸的前面
const OFFSET = { forward: 0, backward: Math.PI };

/** 軸轉 theta、狀態:偏心輪中心與閥門心軸(偏心桿末端)的位置 */
export function reverser(theta, state) {
  const ecc = add(SHAFT, polar(ECC, theta + OFFSET[state] + Math.PI));
  const valveX = ecc[0] - Math.sqrt(ROD * ROD - (ecc[1] - VALVE_Y) ** 2);
  return { ecc, valveX };
}

export default {
  figure: 179,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 1.2, mark: true },
        { kind: "box", size: [0.12, 0.2, 0.25], at: [0.36, 0, 0.45], accent: true }, // 軸上的凸出部分
      ],
    },
    {
      id: "eccentric",
      kind: "group",
      center: SHAFT,
      posed: true,
      spin: 0.95,
      pieces: [
        { kind: "plate", shape: shape(circle(0.75, ...polar(ECC, Math.PI).slice(0, 2)), [circle(0.31).reverse()]), thickness: 0.3 },
        // 側面的近半圓形凸出部分
        { kind: "plate", shape: shape([...arcPoints(0.55, deg(10), deg(170)), ...arcPoints(0.42, deg(170), deg(10))]), thickness: 0.12, at: [0, 0, 0.3] },
      ],
    },
    {
      id: "strap",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.92, inner: 0.78, length: 0.3 },
        { kind: "box", size: [0.25, 0.25, 0.3], at: [0, 0.95, 0] },
        { kind: "box", size: [0.25, 0.25, 0.3], at: [0, -0.95, 0] },
      ],
    },
    { id: "rod", kind: "link", width: 0.2, thickness: 0.1 },
    {
      id: "spindle",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.07, length: 1.5, at: [-0.85, 0, 0] },
        { kind: "plate", shape: shape([[0, 0.12], [0.35, 0.3], [0.45, 0.12], [0.45, -0.12], [0, -0.12]]), thickness: 0.15 },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [{ kind: "box", size: [0.1, LEVER.length, 0.08], at: [0, LEVER.length / 2, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.15 }],
    },
    { id: "base", kind: "box", center: [-1.9, -1.15, 0], size: [1.6, 0.12, 0.8] },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "spindle",
  states: {
    options: [
      { id: "forward", label: "前進" },
      { id: "backward", label: "後退(偏心輪轉了半圈)" },
    ],
    initial: "forward",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "forward") {
    const { ecc, valveX } = reverser(theta, state);
    const rodAngle = Math.atan2(VALVE_Y - ecc[1], valveX - ecc[0]);
    // 直立槓桿的中段經短銷接在閥門心軸上:槓桿隨心軸左右擺
    const lever = Math.atan2(valveX - 0.5 - LEVER.pivot[0], VALVE_Y - LEVER.pivot[1]);
    return {
      parts: {
        shaft: { angle: theta },
        eccentric: { angle: theta + OFFSET[state] },
        strap: { position: ecc },
        rod: { from: [ecc[0] + 1.02 * Math.cos(rodAngle), ecc[1] + 1.02 * Math.sin(rodAngle), 0], to: [valveX, VALVE_Y, 0] }, // 偏心桿從環的外緣伸出
        spindle: { position: [valveX, VALVE_Y, 0] },
        lever: { angle: -lever },
      },
      readouts: [],
    };
  },
};
