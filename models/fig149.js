// 第 149 種:凸輪作用在槓桿上,把均勻的圓周運動轉換為附著桿的交替直線運動。槓桿左端是樞軸,右端的滾子
// 靠在橢圓形凸輪上(凸輪繞偏心的軸轉);槓桿中段吊著一根直立的桿。原圖把槓桿與凸輪畫在兩個位置(高、低)。
// 主動件是凸輪。滾子中心的高度由凸輪輪廓算出(滾子大致在凸輪軸的正上方)。
// 結構推斷:原圖槓桿左端的大圓是固定的樞軸、凸輪中心的圓是它的軸,兩者都得架在機架上;吊桿與槓桿、滾子與槓桿
// 以銷相連。原本的模型這些都沒畫出來(槓桿與吊桿懸空、滾子只是貼著槓桿、凸輪沒有軸),這裡補上:底板、
// 樞軸立柱與樞軸銷、凸輪的軸與後方的軸承座、滾子銷、吊桿頂端的銷,以及套住吊桿的 U 形導座(立在底板上)。
// 滾子中心離凸輪輪廓恆為滾子半徑(數值驗證過),凸輪→滾子→槓桿→銷→吊桿的傳力路徑因此看得見。不改運動學。
import { rollerFace } from "./cams.js";
import { shape, circle, stadium, arcPoints } from "./shapes.js";

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

// 機架:底板、樞軸立柱、凸輪的軸承座、吊桿的導座
const FLOOR_TOP = -2.7;
const GUIDE = [PIVOT[0] + ROD_AT, -1.8]; // 導座的位置(吊桿最低時桿底仍在導座裡)
const CAM_SEAT = shape(
  [[-0.35, FLOOR_TOP - CAM.center[1]], [0.35, FLOOR_TOP - CAM.center[1]], ...arcPoints(0.28, -0.3, Math.PI + 0.3)],
  [circle(0.13).reverse()],
);

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
      pieces: [{ kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, -0.3] }], // 軸:往後穿進軸承座
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(ARM, 0.36).outline, [circle(0.16).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: ROLLER, inner: 0.1, length: 0.3, at: [ARM, 0, -0.2] },
        { kind: "cylinder", radius: 0.09, length: 0.55, at: [ARM, 0, -0.17] }, // 滾子銷:穿過滾子與槓桿
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2, at: [ROD_AT, 0, 0.1] },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 2.4, 0.1], at: [0, -1.25, 0.1] }, // 吊桿在槓桿上那個環的前面
        { kind: "cylinder", radius: 0.07, length: 0.4, at: [0, 0, -0.1] }, // 頂端的銷:穿過槓桿上的環與槓桿
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.4, 0.12, 1.0], at: [0, FLOOR_TOP - 0.06, 0] }, // 底板
        { kind: "box", size: [0.3, PIVOT[1] + 0.15 - FLOOR_TOP, 0.3], at: [PIVOT[0], (PIVOT[1] + 0.15 + FLOOR_TOP) / 2, -0.05] }, // 樞軸立柱(在槓桿後面)
        { kind: "cylinder", radius: 0.14, length: 0.6, at: [PIVOT[0], PIVOT[1], 0.1] }, // 樞軸銷
        { kind: "plate", shape: CAM_SEAT, thickness: 0.3, at: [CAM.center[0], CAM.center[1], -0.55] }, // 凸輪的軸承座(在凸輪後方)
        // 吊桿的 U 形導座:兩側夾住桿、後板、立柱接到底板
        { kind: "box", size: [0.1, 0.3, 0.14], at: [GUIDE[0] - 0.22, GUIDE[1], 0.5] },
        { kind: "box", size: [0.1, 0.3, 0.14], at: [GUIDE[0] + 0.1, GUIDE[1], 0.5] },
        { kind: "box", size: [0.5, 0.3, 0.14], at: [GUIDE[0] - 0.06, GUIDE[1], 0.37] },
        { kind: "box", size: [0.2, GUIDE[1] - FLOOR_TOP, 0.2], at: [GUIDE[0], (GUIDE[1] + FLOOR_TOP) / 2, 0.34] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const psi = lever(theta);
    const rod = [PIVOT[0] + ROD_AT * Math.cos(psi), PIVOT[1] + ROD_AT * Math.sin(psi), 0.4];
    return {
      parts: { cam: { angle: theta }, lever: { angle: psi }, rod: { position: [rod[0], rod[1], 0.4] } }, // 吊桿的頂端跟著槓桿上的環走(略有左右擺動,導座留了間隙)
      readouts: [],
    };
  },
};

