// 第 164 種:膝節槓桿(knee-lever),與肘節接頭略有不同,常用於壓印機與衝壓機,能得到極大的力量。
// 槓桿在上方的固定樞軸轉,短臂上的第二個銷(膝)接著一根長撐桿,撐桿下端壓在下方只能上下移動的壓塊上。
// 抬起水平的長柄,膝部擺向撐桿的正上方,撐桿接近直立,把壓塊往下壓;壓下長柄則放開。主動件是長柄。
import { deg, polar, add } from "./kit.js";
import { shape, circle } from "./shapes.js";

const TOP = [0, 2.7, 0]; // 槓桿的固定樞軸
const KNEE = { r: 0.58, at: deg(-112) }; // 膝銷相對樞軸的位置(原圖)
const STRUT = 3.3;
const BLOCK_X = 0.05;
const HANDLE = { length: 3.4, at: deg(-14) };
const RANGE = [deg(-12), deg(22)]; // 抬起長柄(逆時針)時膝部擺到撐桿正上方

/** 長柄轉 psi(往下為負):膝銷位置與壓塊的高度 */
export function knee(psi) {
  const k = add(TOP, polar(KNEE.r, KNEE.at + psi));
  const y = k[1] - Math.sqrt(STRUT * STRUT - (BLOCK_X - k[0]) ** 2);
  return { k, y };
}

// 槓桿的輪廓:樞軸附近是一塊三角板(往下伸到膝銷),往右是長柄
const K_AT = polar(KNEE.r, KNEE.at);
const H_END = polar(HANDLE.length, HANDLE.at);
const leverShape = shape(
  [
    [-0.3, 0.22],
    [0.3, 0.22],
    [H_END[0], H_END[1] + 0.12],
    [H_END[0], H_END[1] - 0.12],
    [0.45, -0.32],
    [K_AT[0] + 0.25, K_AT[1] - 0.2],
    [K_AT[0] - 0.25, K_AT[1] - 0.2],
    [-0.35, -0.2],
  ],
  [circle(0.1).reverse(), circle(0.1, K_AT[0], K_AT[1]).reverse()],
);

export default {
  figure: 164,
  parts: [
    {
      id: "lever",
      kind: "group",
      center: TOP,
      arrow: false,
      pieces: [
        { kind: "plate", shape: leverShape, thickness: 0.2 },
      ],
    },
    { id: "strut", kind: "link", width: 0.5, thickness: 0.25, pins: false },
    { id: "block", kind: "box", size: [0.85, 0.42, 0.6] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 上樑短、在長柄抬起的路徑之外,用一塊吊板(在槓桿後面)掛著槓桿的樞軸;床面在壓塊最低處
        { kind: "box", size: [1.2, 0.15, 0.8], at: [-0.5, TOP[1] + 0.45, 0] },
        { kind: "box", size: [0.2, 0.55, 0.2], at: [0, TOP[1] + 0.12, -0.2] },
        { kind: "box", size: [4.0, 0.15, 0.8], at: [0.2, -1.69, 0] },
      ],
    },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE },
  target: "block",
  view: { direction: [0.06, 0.05, 1] },
  pose(psi) {
    const { k, y } = knee(psi);
    return {
      parts: { lever: { angle: psi }, strut: { from: [k[0], k[1], 0.23], to: [BLOCK_X, y, 0.23] }, block: { position: [BLOCK_X, y - 0.21, 0] } },
      readouts: [],
    };
  },
};

