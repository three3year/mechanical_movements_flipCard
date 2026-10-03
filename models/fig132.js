// 第 132 種:壓印機中對壓板施壓的運動。上圓盤固定在原處、只能轉動;下圓盤(壓板)只能上下移動。
// 兩根斜桿的兩端插在上下圓盤的孔裡。推動上圓盤的槓桿使它轉動,兩根桿逐漸轉向直立,把下圓盤往下推;
// 桿越接近直立,下推的力越大。主動件是槓桿(上圓盤)。
// 兩盤的距離 = √(桿長² − 兩端水平距離²),兩端水平距離 = 2ρ·sin(兩孔方向的夾角 / 2)。
import { Y, deg } from "./kit.js";

const RHO = 0.62; // 孔離軸心的距離
const ROD = 1.55; // 斜桿長
const SKEW0 = deg(120); // 原圖(未施壓)時上下兩孔方向的夾角
const UPPER_Y = 1.15; // 上圓盤孔所在的高度
const RANGE = [0, deg(110)];

/** 槓桿(上圓盤)轉 phi:上下兩孔的夾角與下圓盤孔所在的高度 */
export function press(phi) {
  const skew = SKEW0 - phi;
  const chord = 2 * RHO * Math.sin(skew / 2);
  const drop = Math.sqrt(ROD * ROD - chord * chord);
  return { skew, y: UPPER_Y - drop };
}

const hole = (a, y) => [RHO * Math.sin(a), y, RHO * Math.cos(a)];

export default {
  figure: 132,
  parts: [
    {
      id: "upper",
      kind: "group",
      axis: Y,
      center: [0, UPPER_Y, 0],
      spin: 0.95,
      pieces: [
        { kind: "lathe", profile: [[0, 0.05], [0.95, 0.05], [0.95, 0.45], [0.55, 0.85], [0.55, 1.15], [0.72, 1.15], [0.72, 1.6], [0, 1.6]], mark: true },
        { kind: "cylinder", radius: 0.07, length: 2.6, axis: [1, 0, 0], at: [1.3 + 0.65, 0, 1.4] },
      ],
    },
    {
      id: "lower",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.95, length: 0.35, at: [0, -0.2, 0] },
        { kind: "box", size: [3.6, 0.6, 1.3], at: [0, -0.7, 0] },
      ],
    },
    { id: "rodA", kind: "link", width: 0.16, thickness: 0.16 },
    { id: "rodB", kind: "link", width: 0.16, thickness: 0.16 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.8, 0.4, 1.4], at: [0, UPPER_Y + 2.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.18, length: 5.4, at: [-1.95, UPPER_Y - 0.7, 0] },
        { kind: "cylinder", axis: Y, radius: 0.18, length: 5.4, at: [1.95, UPPER_Y - 0.7, 0] },
        { kind: "box", size: [4.8, 0.15, 1.4], at: [0, UPPER_Y - 3.45, 0] },
        { kind: "box", size: [1.6, 0.35, 0.9], at: [0, UPPER_Y - 3.2, 0] },
      ],
    },
  ],
  driver: { part: "upper", type: "rotation", range: RANGE },
  target: "lower",
  view: { direction: [0.06, 0.12, 1] },
  pose(phi) {
    const { y } = press(phi);
    // 上圓盤的孔在 phi + 0 與 phi + π 方向;下圓盤的孔落後 skew
    const skew = SKEW0 - phi;
    const ups = [hole(phi, UPPER_Y), hole(phi + Math.PI, UPPER_Y)];
    const downs = [hole(phi + skew, y), hole(phi + skew + Math.PI, y)];
    return {
      parts: {
        upper: { angle: phi },
        lower: { position: [0, y + 0.2, 0] },
        rodA: { from: ups[0], to: downs[0] },
        rodB: { from: ups[1], to: downs[1] },
      },
      readouts: [],
    };
  },
};
