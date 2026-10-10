// 第 194 種:另一種曼格輪。輪上只有一圈齒(一圈銷,上方留一個缺口),所以兩個方向的轉速相同:
// 小齒輪在銷圈外側時輪朝一個方向轉,繞過缺口端的銷進到內側後輪反向轉。小齒輪軸由輪上的溝槽(雙線)引導,
// 讓小齒輪一直保持嚙合;軸上有萬向接頭,讓軸的一部分可以擺動。主動件是小齒輪。
// 推斷:小齒輪軸只沿輪心正下方的直線升降;銷的數目、小齒輪齒數(原圖的齒距與小齒輪大小不一致,取銷距)。
import { deg, TAU } from "./kit.js";
import { manglePath, belowHub } from "./mangle-path.js";
import { circle } from "./shapes.js";
import { pedestal } from "./supports.js";
import { pinionDrive, grooveLayers } from "./pinion-drive.js";

const RT = 1.7; // 銷圈半徑
const PINS = 22;
const SPAN = deg(300);
const STEP = SPAN / (PINS - 1);
const LO = deg(120);
const HI = LO + SPAN;
const PITCH = RT * STEP;
const NP = 9;
const RP = (NP * PITCH) / TAU;
const SEGMENTS = [
  { arc: [0, 0], r: RT, from: HI, to: LO }, // 外側:順時針,小齒輪在銷圈外
  { pin: [RT * Math.cos(LO), RT * Math.sin(LO)], sweep: -Math.PI }, // 繞過左上端的銷
  { arc: [0, 0], r: RT, from: LO, to: HI }, // 內側:逆時針
  { pin: [RT * Math.cos(HI), RT * Math.sin(HI)], sweep: -Math.PI }, // 繞過右上端的銷
];
const path = manglePath(SEGMENTS, RP);

export const mangle = path.at;
export const period = path.period;
export const radii = { RT, RP };
const START = path.driveWhere(belowHub);

const pins = Array.from({ length: PINS }, (_, i) => {
  const a = LO + i * STEP;
  return { kind: "box", size: [0.3, 0.09, 0.24], at: [RT * Math.cos(a), RT * Math.sin(a), 0.2], angle: a };
});

// 小齒輪軸往後伸進輪面上的溝(雙線,在 RT ± RP,離銷 0.3 以上),往前穿過靜止桿的直線溝槽,
// 再經萬向接頭與驅動軸接到固定端(見 pinion-drive.js);輪裝在固定的軸上,軸往後進到軸承座(推斷)
const SHAFT = 0.08;
const PZ = 0.23; // 小齒輪中心的 z:背面離輪面 0.005,整個寬度幾乎都咬在銷上
const heights = path.centers.map(([x, y]) => -Math.hypot(x, y));
const DRIVE = pinionDrive({ x: 0, travel: [Math.min(...heights), Math.max(...heights)], shaft: SHAFT, post: 0.45, floor: -4.2, base: -0.48 });
// 輪板前半個厚度開溝,後半是溝底的實心板(推斷:溝的深度)
const [outer, island, bottom] = grooveLayers({ centers: path.centers.slice(0, -1), shaft: SHAFT, outline: circle(2.95), holes: [circle(0.14).reverse()], front: 0.1, depth: 0.1, back: 0.1 });

export default {
  figure: 194,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: 3.0,
      pieces: [
        { ...outer, circles: [2.82, 0.55], mark: [0, -2.6], markSize: 0.1 },
        island, // 兩道溝之間、排著銷的那一圈
        bottom,
        { kind: "cylinder", radius: 0.3, length: 0.35, accent: true },
        ...pins,
      ],
    },
    // 小齒輪的軸往後伸進溝(離溝底 0.02),往前接萬向接頭
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.25, web: false, hub: false, center: [0, 0, PZ], pieces: [{ kind: "cylinder", radius: SHAFT, length: DRIVE.shaftEnd - 0.02, at: [0, 0, (DRIVE.shaftEnd + 0.02) / 2 - PZ] }] },
    ...DRIVE.parts,
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.13, length: 1.0, at: [0, 0, -0.42] }, // 輪的固定軸
        ...pedestal({ at: [0, 0], z: -0.78, bore: 0.13, floor: -4.2 }),
        ...DRIVE.pieces,
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5, grips: DRIVE.grips },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { wheel, y, pinion } = mangle(alpha * path.sense);
    const angle = path.phase(NP) + pinion;
    return {
      parts: {
        wheel: { angle: wheel },
        pinion: { position: [0, y, PZ], angle },
        ...DRIVE.pose(y, angle),
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "pinion"], reason: "簡化齒形:輪面上的銷畫成方塊、小齒輪是梯形齒,小齒輪繞過銷圈兩端時齒側擦到銷 0.05(96 個取樣中 16 個)" },
  ],
};
