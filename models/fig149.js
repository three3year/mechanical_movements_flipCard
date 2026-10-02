// 第 149 種:凸輪作用在槓桿上,把均勻的圓周運動轉換為附著桿的交替直線運動。槓桿左端是樞軸,右端的滾子
// 靠在橢圓形凸輪上(凸輪繞偏心的軸轉);槓桿中段吊著一根直立的桿。原圖把槓桿與凸輪畫在兩個位置(高、低)。
// 主動件是凸輪。滾子中心的高度由凸輪輪廓算出(滾子大致在凸輪軸的正上方)。
import { rollerFace } from "./cams.js";
import { shape, circle, stadium } from "./shapes.js";

const PIVOT = [-2.4, 0.25, 0.25];
const CAM = { center: [2.0, -0.85, 0], a: 0.9, b: 0.55, offset: 0.3 };
const ROLLER = 0.25;
const ARM = CAM.center[0] - PIVOT[0];
const ROD_AT = 1.65; // 吊桿離樞軸的距離(沿槓桿)

// 橢圓凸輪的輪廓(凸輪局部座標;軸心在原點,橢圓中心偏離軸心 offset)
const OUTLINE = Array.from({ length: 180 }, (_, i) => {
  const t = (i / 180) * 2 * Math.PI;
  return [CAM.offset + CAM.a * Math.cos(t), CAM.b * Math.sin(t)];
});

/** 凸輪轉 theta:槓桿的轉角 */
export function lever(theta) {
  const h = rollerFace(OUTLINE, theta, Math.PI / 2, ROLLER);
  const y = CAM.center[1] + h; // 滾子中心的高度
  return Math.asin((y - PIVOT[1]) / ARM);
}

export default {
  figure: 149,
  parts: [
    {
      id: "cam",
      kind: "plate",
      center: CAM.center,
      shape: shape(OUTLINE, [circle(0.12).reverse()]),
      thickness: 0.3,
      hub: 0.28,
      mark: [CAM.offset + 0.55, 0],
      markSize: 0.07,
      spin: CAM.a + CAM.offset,
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(ARM, 0.36).outline, [circle(0.16).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: ROLLER, inner: 0.1, length: 0.3, at: [ARM, 0, -0.2] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2, at: [ROD_AT, 0, 0.1] },
      ],
    },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.12, 2.4, 0.1], at: [0, -1.25, 0] }] },
    { id: "guide", kind: "box", center: [PIVOT[0] + ROD_AT, -2.0, 0.15], size: [0.5, 0.15, 0.3] },
  ],
  driver: { part: "cam", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const psi = lever(theta);
    const rod = [PIVOT[0] + ROD_AT * Math.cos(psi), PIVOT[1] + ROD_AT * Math.sin(psi), 0.4];
    return {
      parts: { cam: { angle: theta }, lever: { angle: psi }, rod: { position: [PIVOT[0] + ROD_AT, rod[1], 0.4] } },
      readouts: [],
    };
  },
};

