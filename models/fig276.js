// 第 276 種:等徑凸輪。三瓣的凸輪橫跨中心量的每個方向直徑都相等,夾在桿上相對的兩個滾子之間,
// 兩個滾子始終同時貼著凸輪;凸輪連續旋轉,桿就往復直線運動。主動件是凸輪。
// 照原圖:桿是一根直桿,從凸輪後面穿過(左端的 V 形線是圓桿轉成扁平段的交線,不是斷開);
// 扁平段在凸輪後面一層,兩個滾子各用一根短銷從扁平段往前伸到凸輪那一層。
// 凸輪軸往後穿過扁平段上的一道長槽(槽長大於行程 2B = 0.6),接到後面的軸承座。
// 推斷:長槽、銷上的墊套、凸輪軸的軸承座、桿兩端的導套(原圖沒畫)。
import { outlineForRoller } from "./cams.js";
import { shape, circle, rect, stadium } from "./shapes.js";
import { pedestal, pedestalX } from "./supports.js";

const A = 1.25; // 滾子中心到凸輪中心的平均距離
const B = 0.3; // 三瓣的起伏
const ROLLER = 0.2;
const CAM_T = 0.2; // 凸輪厚度(轂厚 1.6 倍,前後各伸出 0.16)
const SHAFT = 0.12; // 凸輪軸的半徑
/** 滾子中心走的節曲線:r(φ) + r(φ + π) = 2A,所以兩滾子的距離一直不變 */
export const pitch = (phi) => A + B * Math.cos(3 * phi);
const OUTLINE = outlineForRoller(pitch, ROLLER);

/** 凸輪轉 theta:右、左滾子中心離凸輪軸的距離與桿的位置 */
export function follower(theta) {
  const right = pitch(-theta);
  const left = pitch(Math.PI - theta);
  return { right, left, x: (right - left) / 2 };
}
export const SPAN = 2 * A;

// 桿(局部座標原點在兩滾子的中點):扁平段在凸輪的轂後面(z −0.33..−0.21),中間開長槽讓凸輪軸穿過
const ROD_Z = -0.27;
const BAR = { half: A + 0.6, width: 0.44, thick: 0.12 };
const SLOT = { travel: 2 * B + 0.02, width: 2 * SHAFT + 0.04 }; // 槽兩端半圓的圓心距、槽寬
const slotHole = stadium(SLOT.travel, SLOT.width).outline.map(([x, y]) => [x - SLOT.travel / 2, y]).reverse();
const bar = { kind: "plate", shape: shape(rect(2 * BAR.half, BAR.width), [slotHole]), thickness: BAR.thick, at: [0, 0, ROD_Z] };
// 滾子的短銷:從扁平段後面穿過,往前伸過滾子(滾子 z ±0.1),前端一個銷頭擋住滾子
const pinFront = CAM_T / 2 + 0.03;
const pinBack = ROD_Z - BAR.thick / 2;
const pins = [-1, 1].map((s) => ({ kind: "cylinder", radius: 0.05, length: pinFront - pinBack, at: [s * A, 0, (pinFront + pinBack) / 2] }));
const spacer = [ROD_Z + BAR.thick / 2, -CAM_T / 2 - 0.01]; // 扁平段前面到滾子背面(留 0.01)
const pinParts = [-1, 1].flatMap((s) => [
  { kind: "cylinder", radius: 0.1, length: spacer[1] - spacer[0], at: [s * A, 0, (spacer[0] + spacer[1]) / 2] }, // 墊套
  { kind: "cylinder", radius: 0.08, length: 0.04, at: [s * A, 0, pinFront - 0.02] }, // 銷頭
]);
// 兩端的圓桿:接在扁平段的兩端,穿過導套
const ends = [-1, 1].map((s) => ({ kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 1.6, at: [s * (A + 1.35), 0, ROD_Z] }));
/** 桿的各塊(測試用) */
export const ROD = { bar, pins, ends };

const roller = (id) => ({ id, kind: "plate", shape: shape(circle(ROLLER - 0.01), [circle(0.05).reverse()]), thickness: 0.2, mark: [ROLLER * 0.55, 0], markSize: 0.045, arrow: false });

export default {
  figure: 276,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: SHAFT, length: 0.8, at: [0, 0, -0.35] }, // 凸輪軸:穿過桿的長槽,接到後面的軸承座
        ...pedestal({ at: [0, 0], z: -0.65, bore: SHAFT, floor: -2.4 }),
        // 桿兩端的導套(和扁平段同一層)
        ...pedestalX({ x: -2.6, y: 0, z: ROD_Z, bore: 0.2, floor: -2.4 }),
        ...pedestalX({ x: 2.6, y: 0, z: ROD_Z, bore: 0.2, floor: -2.4 }),
      ],
    },
    { id: "cam", kind: "plate", shape: shape(OUTLINE, [circle(SHAFT).reverse()]), thickness: CAM_T, hub: 0.3, circles: [0.24], mark: [A - 0.1, 0], markSize: 0.08, spin: A + B },
    { id: "rod", kind: "group", pieces: [bar, ...ends, ...pins, ...pinParts] },
    roller("rollerR"),
    roller("rollerL"),
  ],
  driver: { part: "cam", type: "rotation" },
  target: "rod", // 往復的桿
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { right, left, x } = follower(theta);
    // 滾子在凸輪上滾動:轉角 ≈ 接觸處走過的弧長 / 滾子半徑(以節曲線近似)
    const spin = (-theta * A) / ROLLER;
    return {
      parts: {
        cam: { angle: theta },
        rod: { position: [x, 0, 0] },
        rollerR: { position: [right, 0, 0], angle: spin },
        rollerL: { position: [-left, 0, 0], angle: spin },
      },
      readouts: [],
    };
  },
};
