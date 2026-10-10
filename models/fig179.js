// 第 179 種:單一引擎的換向齒輪。偏心輪鬆套在軸上,由軸上的一個凸出部分推著偏心輪側面一個近半圓形的凸出部分轉動;
// 這個設計讓偏心輪能在軸上相對轉動半圈。換向時:抬起偏心桿(釋放閥門心軸),用左邊的直立槓桿把閥門扳到另一邊,
// 引擎反轉後,軸上的凸出部分在半圓凸出部分的另一端推動偏心輪——偏心輪相對軸轉了半圈,閥門的動作因此反向——
// 再把偏心桿放下。主動件是軸;前進與後退是狀態(原機構由司機扳動槓桿切換;切換時偏心輪轉半圈)。
// 前進時軸逆時針轉,凸出部分頂著半圓凸出部分的一端;後退時軸順時針轉,凸出部分空轉約半圈後頂到另一端。
// 為什麼要轉半圈:偏心輪要比曲柄超前約四分之一圈,閥門才會在對的時候開關;反轉後「超前」的方向跟著反過來,
// 偏心輪相對曲柄的位置就要換到另一邊,兩者相差約半圈。
// 切換狀態時軸與偏心輪都以短動畫轉到新的姿勢(省略抬桿、扳槓桿與凸出部分空轉的過程)。
// 推斷(原圖沒畫):軸往後伸進軸承座;閥門心軸穿過底座上立起的導套。
import { deg, polar, add } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const SHAFT = [2.6, 0, 0];
const ECC = 0.35;
const ROD = 3.9;
const VALVE_Y = 0.05;
const LEVER = { pivot: [-1.95, -0.95, 0.12], length: 3.2 }; // 手柄貼著閥門心軸的前面
const OFFSET = { forward: 0, backward: Math.PI };
const GUIDE_X = -2.45; // 閥門心軸導套的位置(心軸在行程中始終穿過它,手柄碰不到)
export const ARC = { inner: 0.42, outer: 0.55, from: deg(100), to: deg(260) }; // 偏心輪側面的半圓凸出部分(偏心輪的局部座標;在偏心輪較厚的那一側)
export const LUG = ARC.inner * Math.sin(ARC.from - Math.PI / 2); // 軸上凸出部分(沿軸的 +y 伸出)的半寬:兩邊剛好碰到半圓凸出部分兩端的內角
const SIGN = { forward: 1, backward: -1 }; // 軸的轉向:前進逆時針、後退順時針
const FACE = 0.15; // 偏心輪的正面

/** 主動量 theta、狀態:軸與偏心輪的轉角、偏心輪中心與閥門心軸(偏心桿末端)的位置 */
export function reverser(theta, state) {
  const shaft = SIGN[state] * theta;
  const eccentric = shaft + OFFSET[state];
  const ecc = add(SHAFT, polar(ECC, eccentric + Math.PI));
  const valveX = ecc[0] - Math.sqrt(ROD * ROD - (ecc[1] - VALVE_Y) ** 2);
  return { shaft, eccentric, ecc, valveX };
}

export default {
  figure: 179,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: 0.3,
      posed: true, // 換向時軸改變轉向:與偏心輪一起以短動畫轉到新狀態的姿勢,維持兩者的相對位置
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.9, at: [0, 0, -0.15], mark: true }, // 前端只伸到凸出部分的前面,看得到兩個凸出部分
        { kind: "cylinder", radius: 0.2, length: 0.9, at: [0, 0, -0.95] }, // 軸:往後伸進軸承座
        // 軸上的凸出部分:從軸面往外伸到半圓凸出部分的外緣,在偏心輪正面的前面、與半圓凸出部分同一層
        { kind: "box", size: [2 * LUG, ARC.outer + 0.05 - 0.28, 0.11], at: [0, (ARC.outer + 0.05 + 0.28) / 2, FACE + 0.065], accent: true },
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
        { kind: "plate", shape: shape([...arcPoints(ARC.outer, ARC.from, ARC.to), ...arcPoints(ARC.inner, ARC.to, ARC.from)]), thickness: 0.12, at: [0, 0, FACE + 0.06] }, // 貼在偏心輪的正面
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
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.6, 0.12, 0.8], at: [-1.9, -1.15, 0] },
        // 閥門心軸的導套(心軸在它裡面左右滑),由底座上的立柱托著
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.15, inner: 0.08, length: 0.3, at: [GUIDE_X, VALVE_Y, 0] },
        { kind: "box", size: [0.14, VALVE_Y + 1.09 - 0.15, 0.14], at: [GUIDE_X, (VALVE_Y - 0.15 - 1.09) / 2, -0.25] },
        { kind: "box", size: [0.14, 0.12, 0.25], at: [GUIDE_X, VALVE_Y - 0.15, -0.14] },
        ...pedestal({ at: [SHAFT[0], SHAFT[1]], z: -1.2, bore: 0.2, floor: -1.21 }),
      ],
    },
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
    const { shaft, eccentric, ecc, valveX } = reverser(theta, state);
    const rodAngle = Math.atan2(VALVE_Y - ecc[1], valveX - ecc[0]);
    // 直立槓桿的中段經短銷接在閥門心軸上:槓桿隨心軸左右擺
    const lever = Math.atan2(valveX - 0.5 - LEVER.pivot[0], VALVE_Y - LEVER.pivot[1]);
    return {
      parts: {
        shaft: { angle: shaft },
        eccentric: { angle: eccentric },
        strap: { position: ecc },
        rod: { from: [ecc[0] + 1.02 * Math.cos(rodAngle), ecc[1] + 1.02 * Math.sin(rodAngle), 0], to: [valveX, VALVE_Y, 0] }, // 偏心桿從環的外緣伸出
        spindle: { position: [valveX, VALVE_Y, 0] },
        lever: { angle: -lever },
      },
      readouts: [],
    };
  },
};
