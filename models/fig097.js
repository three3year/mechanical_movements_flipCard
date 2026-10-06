// 第 97 種:開有溝槽的心形凸輪,與第 96 種類似:圓盤面上切出心形的溝槽,水平桿端的銷在溝槽裡,
// 圓盤轉動時桿做均勻的橫移(去程、回程各半圈,位移與轉角成正比)。溝槽兩側都導引著銷,不必靠重力或彈簧貼緊。
import { TAU, signedAngle } from "./kit.js";
import { circle, shape, offsetLoop } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const NEAR = 0.62;
const FAR = 2.05;
const GROOVE = 0.13; // 溝槽半寬
const DISC = 2.4;
const GUIDE_X = 3.0; // 導座在圓盤之外;桿在 0.62–2.05 之間往復,桿身(銷右方 0–3.0)始終穿過這裡

/** 節曲線:圓盤局部角 φ 處銷中心離軸心的距離(φ = 0 最近,φ = π 最遠) */
export const pitchAt = (phi) => NEAR + ((FAR - NEAR) * Math.abs(signedAngle(phi))) / Math.PI;

const pitch = Array.from({ length: 360 }, (_, i) => {
  const a = (i / 360) * TAU;
  const r = pitchAt(a);
  return [r * Math.cos(a), r * Math.sin(a)];
});

export default {
  figure: 97,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [offsetLoop(pitch, GROOVE).reverse()]), thickness: 0.2 },
        { kind: "plate", shape: shape(offsetLoop(pitch, -GROOVE), [circle(0.18).reverse()]), thickness: 0.2, circles: [0.36], mark: [-0.9, 0.3], markSize: 0.08 },
        { kind: "plate", shape: shape(circle(DISC), []), thickness: 0.05, at: [0, 0, -0.12] },
        { kind: "cylinder", radius: 0.18, length: 0.75, at: [0, 0, -0.45] }, // 軸,往後伸進軸承座
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: [NEAR, 0, 0.12],
      pieces: [
        { kind: "cylinder", radius: GROOVE * 0.6, length: 0.3, at: [0, 0, -0.06] }, // 銷比溝槽細:溝槽在最近、最遠兩處有折角,內側會變窄
        { kind: "box", size: [3.0, 0.24, 0.12], at: [1.5, 0, 0.12] },
        { kind: "cylinder", radius: 0.14, length: 0.18, at: [0, 0, 0.12] },
      ],
    },
    {
      // 桿的導座(推斷,原圖只畫到桿):方形導套與托著它的柱子
      id: "guide",
      kind: "group",
      pieces: [
        ...squareGuide({ at: [GUIDE_X, 0, 0.24], width: 0.24, thickness: 0.12, wall: 0.06 }),
        { kind: "box", size: [0.3, 2.2, 0.2], at: [GUIDE_X, -1.3, 0.24] },
        { kind: "box", size: [1.0, 0.16, 0.6], at: [GUIDE_X, -2.4, 0.24] },
        ...pedestal({ at: [0, 0], z: -0.65, bore: 0.19, floor: -2.6 }), // 圓盤軸的軸承座,在圓盤後面
      ],
    },
  ],
  // 動力重演:只推圓盤;桿在導座的直線滑軌上,銷由溝槽兩側推著走(不靠重力或彈簧)
  replay: {
    free: { rod: { slide: [1, 0, 0], gravity: false } },
    expect: [
      { at: Math.PI / 2, part: "rod", label: "圓盤轉四分之一圈,桿被推出全程的一半", quote: "與第 96 種類似,差別在於它是開有溝槽的形式" },
      { at: Math.PI, part: "rod", label: "圓盤轉半圈,桿被推到最遠" },
      { at: 2 * Math.PI, part: "rod", label: "圓盤轉一圈,溝槽的內側把桿拉回最近處" },
    ],
  },
  driver: { part: "disc", type: "rotation" },
  target: "rod", // 均勻橫移的水平桿
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    return { parts: { disc: { angle }, rod: { position: [pitchAt(-angle), 0, 0.12] } }, readouts: [] };
  },
};
