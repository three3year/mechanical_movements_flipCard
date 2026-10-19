// 第 344 種:擺動式引擎。汽缸在長度中點有樞軸(耳軸),裝在固定的軸承裡擺動;活塞桿不用任何導件,直接接上方的曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內正在推活塞的那一側以蒸汽填色。
// 推斷:進汽的時機(活塞往哪邊走,另一側就進汽);各部尺寸依原圖。
// 耳軸是汽缸的一部分:從汽缸後壁往後伸,插進後面橫樑上的軸承座(原圖汽缸正面中央的小圓是耳軸,上方的虛線半圓是
// 後面橫樑上的軸承座)。原機前後各有一個耳軸與軸承;汽缸剖開拿掉了前半,前面那一組跟著不畫。
// 曲柄臂在活塞桿後面一層,曲柄銷從臂往前穿過活塞桿端的眼、前面有銷頭;輪轂與曲柄軸從臂往後一路伸進上方橫樑的軸承
// (活塞桿從臂的前面掃過軸心,軸不用截斷)。兩根橫樑原圖兩端畫成斷口,接到圖外的機架。
import { TAU } from "./kit.js";
import { oscillating } from "./oscillating.js";
import { shape, thickLine } from "./shapes.js";

export const TRUNNION = [0, -1.0, 0];
const CRANK = [0.2, 2.35, 0];
const R = 0.5;
const CYL = { length: 2.0, radius: 0.62, offset: 0 };
const OUTER = CYL.radius + 0.1; // 汽缸外壁(oscillating.js 的壁厚 0.1)
const BEAM_Z = -1.02; // 兩根橫樑的深度(z −1.17~−0.87,在汽缸後壁 −0.72 後面)
const BEAM_T = 0.3;
const PIN_R = 0.04; // 曲柄銷(穿過活塞桿端的眼,眼的半徑是桿寬的一半 0.045)
const ARM_Z = -0.15; // 曲柄臂的深度(z −0.21~−0.09,活塞桿在 z ±0.045)

/** 橫樑在 c 處斷開、接上一個軸承環(孔半徑 inner) */
const beamWithBearing = (c, inner) => [
  { kind: "box", size: [1.8 + c[0] - 0.26, BEAM_T, BEAM_T], at: [(-1.8 + c[0] - 0.26) / 2, c[1], BEAM_Z] },
  { kind: "box", size: [1.8 - c[0] - 0.26, BEAM_T, BEAM_T], at: [(1.8 + c[0] + 0.26) / 2, c[1], BEAM_Z] },
  { kind: "cylinder", radius: 0.3, inner, length: BEAM_T, at: [c[0], c[1], BEAM_Z] },
];

// 耳軸:汽缸局部座標(局部 Z 是汽缸軸、局部 +Y 朝世界的後方 −z),從後壁裡往後伸過軸承環
const STUB = { r: 0.14, from: OUTER - 0.06, to: -BEAM_Z + BEAM_T / 2 + 0.05 };
export const engine = oscillating({
  trunnion: TRUNNION,
  crank: CRANK,
  r: R,
  cyl: CYL,
  rod: 3.36,
  cylinderPieces: [{ kind: "cylinder", axis: [0, 1, 0], radius: STUB.r, length: STUB.to - STUB.from, at: [0, (STUB.from + STUB.to) / 2, -CYL.offset] }],
});

const SHAFT = { from: BEAM_Z - BEAM_T / 2 - 0.05, to: ARM_Z + 0.06 }; // 曲柄軸:從臂的正面往後穿過橫樑的軸承

export default {
  figure: 344,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [...beamWithBearing(TRUNNION, STUB.r + 0.01), ...beamWithBearing(CRANK, 0.13)],
    },
    ...engine.parts,
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.3)), thickness: 0.12, at: [0, 0, ARM_Z] },
        { kind: "cylinder", radius: 0.2, length: 0.2, at: [0, 0, ARM_Z - 0.16] }, // 輪轂(臂的背面)
        { kind: "cylinder", radius: 0.12, length: SHAFT.to - SHAFT.from, at: [0, 0, (SHAFT.from + SHAFT.to) / 2] },
        { kind: "cylinder", radius: PIN_R, length: 0.06 - (ARM_Z - 0.06), at: [R, 0, (0.06 + ARM_Z - 0.06) / 2], accent: true }, // 曲柄銷:從臂背面穿到活塞桿前面
        { kind: "cylinder", radius: 0.07, length: 0.03, at: [R, 0, 0.06], accent: true }, // 銷頭(擋住活塞桿的眼)
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const theta = Math.PI / 2 - TAU * p;
    const e = engine.pose(theta);
    return { parts: { ...e.parts, crank: { angle: theta } }, readouts: [] };
  },
};
