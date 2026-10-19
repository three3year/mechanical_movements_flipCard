// 第 330 種:活塞桿被延長,在一個與汽缸中心成一直線的導引件 A 中作動。連桿的下部做成叉形,
// 讓活塞桿的上部能從叉的中間穿過;連桿上端接頂上的曲柄。主動件是虛擬的「進程」(汽缸的蒸汽推動);
// 汽缸內的蒸汽以流體示意。目標件是曲柄軸上的飛輪。
// 結構(照 525 px 原圖):曲柄軸橫在紙面上(沿 x),穿過立柱頂上的軸承往右伸,右端是側看的飛輪;
// 曲柄臂在軸的左端,在垂直紙面的平面裡轉,曲柄銷朝左伸出、套著連桿上端,所以連桿前後擺。
// 叉的兩股在紙面上左右分開、夾著活塞桿,兩股下端共用一根橫的十字頭銷(穿過活塞桿頂上的十字頭);
// 活塞桿從十字頭再往上延長,插在導引件 A 裡——A 在叉的環裡、拱頂下方。A 由橫臂接到立柱,
// 橫臂照原圖畫在右股前面:從 A 往前伸出兩股之間,再在叉股前擺的範圍之外往右跨過右股,接到立柱前面的凸耳。
// 推斷:進汽的時機;立柱落到底座、立柱前面的凸耳;飛輪的輪輻與輪轂(原圖飛輪被圖框切掉上半,只看得到側面);
// 汽缸蓋上的填料函(原圖兩片圓盤);各部尺寸依原圖(1 單位 ≈ 原圖 90 px)。
// 偏離插圖:進汽管走在立柱後面(原圖沒畫進汽管;立柱就在汽缸右邊,管照共用的位置會穿過立柱)。
import { TAU } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, arcPoints, ring, stadium, thickLine } from "./shapes.js";

const CRANK = [0, 2.65, 0]; // 曲柄軸的軸心(軸沿 x)
export const R = 0.42;
export const ROD = 3.3; // 曲柄銷到十字頭銷
const PISTON_ROD = 2.12; // 十字頭到活塞
export const ROD_TOP = 1.95; // 活塞桿從十字頭往上延長的長度
export const ROD_R = 0.045; // 活塞桿半徑
// 叉:兩股中心離活塞桿 half、股寬 prong(沿 x)、股厚 depth(連桿擺動的方向);拱頂內緣離十字頭銷 inner
export const FORK = { half: 0.27, prong: 0.08, depth: 0.08, inner: 2.05 };
// 導引件 A:套著活塞桿的軸套(中心線與汽缸相同),上下緣 y0、y1
export const GUIDE = { x: 0, z: 0, y0: 0.56, y1: 0.91, radius: 0.12 };
// A 的橫臂:在叉股前擺的範圍之外(背面 z0)從 A 往右跨過右股,接到立柱
export const ARM = { x0: -0.04, x1: 0.86, y0: 0.67, y1: 0.87, z0: 0.27, z1: 0.39 };
const COLUMN = { x: 0.95, half: 0.22, top: 2.05 };
const BASE = -3.7; // 底座頂面
const CYL = { x: 0, top: -2.1, length: 1.35, radius: 0.42, seat: BASE, pipeZ: -0.36 };
const SHAFT = 0.13;
const WHEEL = { x: 2.28, r: 3.3, rim: 0.22, width: 0.5 };

/** 進程 p → 曲柄角、曲柄銷(世界座標)、十字頭高度、活塞高度 */
export function engine(p) {
  // 曲柄在 y–z 平面轉:曲柄角從飛輪的局部 +X(世界 −z)量起;p = 0 時曲柄朝下(原圖的姿勢,下死點)
  const theta = -Math.PI / 2 - TAU * p;
  const at = (a) => {
    const { pin, y } = crankSlider(CRANK, R, ROD, a); // crankSlider 的水平偏移在這裡是前後(−z)
    return { pin: [CRANK[0], pin[1], CRANK[2] - (pin[0] - CRANK[0])], head: y };
  };
  const { pin, head } = at(theta);
  return { theta, pin, head, piston: head - PISTON_ROD, downward: at(theta - 1e-4).head < head };
}

/** 沿 y 的軸套(固定件):外半徑 radius、孔 inner,從 y0 到 y1 */
const sleeve = (radius, inner, y0, y1) => ({ kind: "cylinder", axis: [0, 1, 0], radius, inner, length: y1 - y0, at: [0, (y0 + y1) / 2, 0] });

// 叉的 U 形(板件的局部 a 沿連桿、b 是左右;板厚是連桿擺動的方向):拱頂內緣在 a = ROD − inner,兩股止於十字頭銷的轂裡
const archCenter = ROD - FORK.inner + (FORK.half - FORK.prong / 2);
const forkLine = [[ROD - 0.07, -FORK.half], ...arcPoints(FORK.half, -Math.PI / 2, -1.5 * Math.PI, archCenter, 0), [ROD - 0.07, FORK.half]];

export default {
  figure: 330,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立柱(落到底座)、柱頭、軸承座與軸承環:曲柄軸穿過軸承環
        { kind: "box", size: [2 * COLUMN.half, COLUMN.top - BASE, 2 * COLUMN.half], at: [COLUMN.x, (COLUMN.top + BASE) / 2, 0] },
        { kind: "box", size: [0.6, 0.15, 0.6], at: [COLUMN.x, COLUMN.top + 0.075, 0] },
        { kind: "box", size: [0.44, 0.3, 0.44], at: [COLUMN.x, COLUMN.top + 0.28, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.3, inner: SHAFT + 0.01, length: 0.44, at: [COLUMN.x, CRANK[1], 0] },
        // 導引件 A:套著活塞桿的軸套,往前伸出兩股之間,接上橫臂;橫臂經立柱前面的凸耳(推斷)接到立柱
        { kind: "cylinder", axis: [0, 1, 0], radius: GUIDE.radius, inner: ROD_R + 0.005, length: GUIDE.y1 - GUIDE.y0, at: [GUIDE.x, (GUIDE.y0 + GUIDE.y1) / 2, GUIDE.z] },
        { kind: "box", size: [0.16, 0.27, ARM.z1 - 0.08], at: [0, 0.735, (ARM.z1 + 0.08) / 2] },
        { kind: "box", size: [ARM.x1 - ARM.x0, ARM.y1 - ARM.y0, ARM.z1 - ARM.z0], at: [(ARM.x0 + ARM.x1) / 2, (ARM.y0 + ARM.y1) / 2, (ARM.z0 + ARM.z1) / 2] },
        { kind: "box", size: [0.15, ARM.y1 - ARM.y0, 0.12], at: [0.8, (ARM.y0 + ARM.y1) / 2, 0.24] },
        // 底座
        { kind: "box", size: [2.8, 0.2, 1.2], at: [0.45, BASE - 0.1, 0] },
      ],
    },
    { id: "labelA", kind: "group", center: [0, (GUIDE.y0 + GUIDE.y1) / 2, 0.4], label: "A", labelOffset: [0.45, 0.3, 0.1] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    // 汽缸蓋上的填料函(原圖活塞桿穿出汽缸處的兩片圓盤,推斷)
    {
      id: "gland",
      kind: "group",
      pieces: [sleeve(0.2, ROD_R + 0.005, -1.98, -1.68), sleeve(0.28, ROD_R + 0.005, -1.74, -1.64), sleeve(0.14, ROD_R + 0.005, -1.66, -1.44), sleeve(0.28, ROD_R + 0.005, -1.46, -1.36)],
    },
    // 曲柄軸(局部 z 是世界 x):左端的曲柄臂與朝左的曲柄銷,軸穿過立柱頂的軸承,右端是飛輪
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      axis: [1, 0, 0],
      spin: WHEEL.r + 0.15,
      spinOffset: WHEEL.x,
      pieces: [
        { kind: "plate", shape: stadium(R, 0.34), thickness: 0.15, at: [0, 0, 0.225] },
        { kind: "cylinder", radius: 0.06, length: 0.32, at: [R, 0, 0.04], accent: true },
        { kind: "cylinder", radius: 0.1, length: 0.04, at: [R, 0, -0.12], accent: true },
        { kind: "cylinder", radius: SHAFT, length: 2.6, at: [0, 0, 1.45] },
        // 軸承兩側的軸環
        { kind: "cylinder", radius: 0.2, length: 0.06, at: [0, 0, COLUMN.x - 0.22 - 0.04] },
        { kind: "cylinder", radius: 0.2, length: 0.06, at: [0, 0, COLUMN.x + 0.22 + 0.04] },
        // 飛輪:輪轂、六根輪輻、輪緣(推斷:原圖只看得到側面)
        { kind: "cylinder", radius: 0.28, length: WHEEL.width, at: [0, 0, WHEEL.x] },
        { kind: "plate", shape: ring(WHEEL.r, WHEEL.r - WHEEL.rim), thickness: WHEEL.width, at: [0, 0, WHEEL.x] },
        ...[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * TAU) / 6 + Math.PI / 6;
          const mid = (0.25 + WHEEL.r - WHEEL.rim + 0.02) / 2;
          return { kind: "box", size: [WHEEL.r - WHEEL.rim - 0.23, 0.16, 0.14], at: [mid * Math.cos(a), mid * Math.sin(a), WHEEL.x], angle: a };
        }),
      ],
    },
    // 叉形連桿(局部 +x 由曲柄銷指向十字頭銷,局部 z 是世界 x):上端的眼套著曲柄銷,下半分成兩股,
    // 兩股下端的轂套著同一根十字頭銷
    {
      id: "conrod",
      kind: "group",
      axis: [1, 0, 0],
      pieces: [
        { kind: "cylinder", radius: 0.13, inner: 0.065, length: 0.18 },
        { kind: "box", size: [archCenter - FORK.half - 0.04, 0.12, 0.12], at: [(archCenter - FORK.half + 0.12) / 2, 0, 0] },
        { kind: "plate", shape: shape(thickLine(forkLine, FORK.prong)), thickness: FORK.depth, axis: [0, 1, 0] },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.08, inner: 0.045, length: 0.1, at: [ROD, 0, s * FORK.half] })),
      ],
    },
    // 活塞桿與十字頭:桿從活塞往上穿過填料函、十字頭,再延長插進導引件 A;十字頭銷橫穿,兩端有螺帽
    {
      id: "pistonRod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: ROD_R, length: PISTON_ROD + ROD_TOP, at: [0, (ROD_TOP - PISTON_ROD) / 2, 0] },
        { kind: "box", size: [0.3, 0.3, 0.22] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.04, length: 0.74 },
        ...[-1, 1].map((s) => ({ kind: "cylinder", axis: [1, 0, 0], radius: 0.075, length: 0.05, at: [s * 0.35, 0, 0] })),
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "flywheel", // 輸出的飛輪(與曲柄同軸)
  // 斜看才看得出曲柄前後轉、連桿前後擺;只以機構取景,大飛輪像原圖一樣被畫面切掉一部分
  view: { direction: [-0.45, 0.2, 1], fit: ["frame", "conrod", "pistonRod", "cylinder", "gland"] },
  pose(p) {
    const e = engine(p);
    const cyl = cylinderPose(CYL, e.piston, e.downward, p);
    return {
      parts: {
        flywheel: { angle: e.theta },
        conrod: { position: e.pin, angle: Math.atan2(e.head - e.pin[1], e.pin[2]) },
        pistonRod: { position: [0, e.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
