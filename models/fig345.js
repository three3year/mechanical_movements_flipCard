// 第 345 種:倒置式擺動(擺式)引擎。汽缸在上端有樞軸,像擺一樣擺動;曲柄軸在下方,活塞桿直接接曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內正在推活塞的那一側以蒸汽填色。
// 推斷:進汽的時機;各部尺寸依原圖。
// 耳軸是汽缸的一部分:頂蓋上的凸座往後伸成短軸,插進後面橫樑上的軸承(原圖汽缸頂上中央的小圓;橫樑在汽缸後面,
// 被汽缸擋住)。原機前後各有一個耳軸;汽缸剖開拿掉了前半,前面那一個跟著不畫。
// 曲柄臂在活塞桿後面一層,曲柄銷從臂往前穿過活塞桿端的眼、前面有銷頭;輪轂與曲柄軸從臂往後伸進底座上的軸承座
// (推斷:原圖底座頂上托著軸的凸起)。頂上的橫樑原圖兩端畫成斷口,接到圖外的機架。
import { TAU } from "./kit.js";
import { oscillating, trunnionStub, beamWithBearing, oscillatingCrank } from "./oscillating.js";

export const TRUNNION = [0, 2.3, 0];
const CRANK = [0.35, -2.3, 0];
const R = 0.45;
const CYL = { length: 2.0, radius: 0.62, offset: 1.15 }; // 頂蓋外面在樞軸下 0.03
const BEAM = { z: -1.02, t: 0.3 }; // 頂上橫樑的深度(z −1.17~−0.87,在汽缸後壁 −0.72 後面)與截面
const PIN_R = 0.04; // 曲柄銷(穿過活塞桿端的眼,眼的半徑是桿寬的一半 0.045)
const ARM_Z = -0.15; // 曲柄臂的深度(z −0.21~−0.09,活塞桿在 z ±0.045)
const BASE_TOP = -3.0; // 底座頂面(曲柄臂掃過的最低處 −2.9 之下)
const PEDESTAL_Z = -0.6; // 曲柄軸軸承座的深度(z −0.75~−0.45)

// 耳軸:汽缸局部座標(局部 Z 是汽缸軸、指向曲柄,局部 +Y 朝世界的後方 −z)。從剖面(局部 y 0)往後伸過軸承環;
// 半徑 0.13 的凸座一半嵌在頂蓋裡,下緣離汽缸內頂面 0.02(活塞不會碰到)
const STUB = { r: 0.13, from: 0, to: -BEAM.z + BEAM.t / 2 + 0.05 };
export const engine = oscillating({
  trunnion: TRUNNION,
  crank: CRANK,
  r: R,
  cyl: CYL,
  rod: 3.46,
  cylinderPieces: [trunnionStub(STUB, CYL)],
});

const SHAFT = { from: PEDESTAL_Z - 0.2, to: ARM_Z + 0.06 }; // 曲柄軸:從臂的正面往後穿過軸承座

export default {
  figure: 345,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...beamWithBearing(TRUNNION, STUB.r + 0.01, BEAM), // 頂上橫樑在樞軸處斷開、接上軸承環
        { kind: "box", size: [2.4, 0.3, 1.2], at: [CRANK[0], BASE_TOP - 0.15, -0.3] }, // 底座(原圖最下方的橫板)
        // 曲柄軸的軸承座:從底座頂面立起,頂端在軸承環的實體裡(不擋到軸孔)
        { kind: "box", size: [0.3, CRANK[1] - 0.2 - BASE_TOP, 0.3], at: [CRANK[0], (CRANK[1] - 0.2 + BASE_TOP) / 2, PEDESTAL_Z] },
        { kind: "cylinder", radius: 0.26, inner: 0.13, length: 0.3, at: [CRANK[0], CRANK[1], PEDESTAL_Z] },
      ],
    },
    ...engine.parts,
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: oscillatingCrank({ r: R, armZ: ARM_Z, pinR: PIN_R, shaft: SHAFT }),
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const theta = -Math.PI / 2 - TAU * p;
    const e = engine.pose(theta);
    return { parts: { ...e.parts, crank: { angle: theta } }, readouts: [] };
  },
};
