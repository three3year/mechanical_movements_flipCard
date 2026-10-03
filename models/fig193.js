// 第 193 種:另一種曼格輪及其小齒輪。輪面上是一圈馬蹄形的齒槽:外緣是大半徑、齒朝內的齒圈,內緣是繞著輪轂、
// 齒朝外的齒圈,兩端在上方以半圓相接;中間的雙線是引導小齒輪軸的溝(小齒輪軸心走過的路)。
// 小齒輪持續朝同一方向轉:沿外緣走時輪朝一個方向轉近乎一整圈,繞過端頭改沿內緣走時輪反向轉回來;
// 外緣的半徑較大,所以輪朝這個方向轉得比另一方向慢。主動件是小齒輪。
// 推斷:小齒輪軸只沿輪心正下方的直線升降(軸上的萬向接頭,見第 194 種原文);兩端半圓上也排齒。
import { deg, TAU } from "./kit.js";
import { manglePath, arcLength, belowHub } from "./mangle-path.js";
import { circle } from "./shapes.js";
import { toothedLoop, resample } from "./noncircular.js";

const RO = 2.15;
const RI = 1.0;
const GAP = deg(36); // 上方缺口的半角
const RC = (RO + RI) / 2;
const RH = (RO - RI) / 2;
const L = deg(90) - GAP;
const H = deg(90) + GAP;
const cap = (a) => [RC * Math.cos(a), RC * Math.sin(a)];
const SEGMENTS = [
  { arc: [0, 0], r: RO, from: H, to: L + TAU }, // 外緣:經過下方,逆時針
  { arc: cap(L), r: RH, from: L, to: L + Math.PI }, // 右上端頭
  { arc: [0, 0], r: RI, from: L, to: H - TAU }, // 內緣:順時針繞回
  { arc: cap(H), r: RH, from: H + Math.PI, to: H + TAU }, // 左上端頭
];
const NP = 10;
const NT = Math.round(arcLength(SEGMENTS) / 0.27);
const PITCH = arcLength(SEGMENTS) / NT;
const RP = (NP * PITCH) / TAU;
const path = manglePath(SEGMENTS, RP);

export const mangle = path.at;
export const radii = { RO, RI, RP };
export const period = path.period;

// 原圖:小齒輪在外緣的正下方
const START = path.driveWhere(belowHub);

const pitchLoop = resample(path.pitch.slice(0, -1), 0.02);
const M = PITCH / Math.PI;
const slot = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: 0, into: -1 });

export default {
  figure: 193,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: circle(2.85), holes: [[...slot].reverse(), circle(0.14).reverse()] },
      thickness: 0.22,
      engrave: [path.centers.slice(0, -1)],
      circles: [2.72, 0.62],
      hub: 0.3,
      mark: [0, 2.45],
      markSize: 0.1,
      spin: 2.85,
    },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.3, web: false, pieces: [{ kind: "cylinder", radius: 0.08, length: 0.9 }] },
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5 },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { wheel, y, pinion } = mangle(alpha * path.sense);
    return {
      parts: {
        wheel: { angle: wheel },
        pinion: { position: [0, y, 0], angle: path.phase(NP) + pinion },
      },
      readouts: [],
    };
  },
};
