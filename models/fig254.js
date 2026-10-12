// 第 254 種:鏈輪,用來以鏈條驅動或被鏈條驅動。輪緣正中排著一圈 Y 形的叉齒,
// 環式鏈條的直立鏈節卡在叉口裡,平躺的鏈節落在兩齒之間。
// 推斷(原圖只畫靜止的輪):鏈條繞過輪的後半圈,轉動鏈輪時鏈條跟著走。
// 每個叉齒對兩節(一節直立、一節平躺),所以節距由齒數算:繞在輪上 15° 一節;起始相位讓直立鏈節的中心正對叉齒。
import { facePulley, shaftPieces } from "./face-pulley.js";
import { TAU, X, cross, quatFromBasis, partPoint } from "./kit.js";
import { shape } from "./shapes.js";

const R = 1.55;
const W = 0.85;
export const TEETH = 12;

// Y 形叉齒:Y 字在輪緣面上(輪軸 × 切線的平面),沿徑向立起成齒;相鄰的齒開口方向相反
const Y_SHAPE = shape([
  [-0.05, -0.2], [0.05, -0.2], [0.05, 0.02], [0.2, 0.2], [0.13, 0.25], [0, 0.09], [-0.13, 0.25], [-0.2, 0.2], [-0.05, 0.02],
]);
const HEIGHT = 0.24;
const forks = Array.from({ length: TEETH }, (_, i) => {
  const a = (i / TEETH) * TAU;
  const flip = i % 2 ? -1 : 1;
  const radial = [Math.cos(a), Math.sin(a), 0];
  const tangent = [-Math.sin(a) * flip, Math.cos(a) * flip, 0];
  const rotation = quatFromBasis(cross(tangent, radial), tangent, radial);
  return { kind: "plate", shape: Y_SHAPE, thickness: HEIGHT, rotation, at: [(R + HEIGHT / 2) * Math.cos(a), (R + HEIGHT / 2) * Math.sin(a), 0], accent: i === 0 };
});

const SEAT = R + 0.2; // 鏈條中心線的半徑
export const PITCH = (TAU * SEAT) / (2 * TEETH);

const pulley = facePulley({
  figure: 254,
  seat: SEAT,
  wheel: {
    kind: "group",
    spin: R + 0.3,
    pieces: [
      { kind: "cylinder", radius: R, inner: R - 0.18, length: W },
      { kind: "cylinder", radius: R - 0.1, length: 0.16 },
      ...shaftPieces(0.45, 0.28, W),
      ...forks,
    ],
  },
  strand: { kind: "chain", style: "ring", pitch: PITCH, width: 0.3, normal: [1, 0, 0] },
});
export const { travel } = pulley;

// 鏈條的起始相位:畫面上第 k 節的兩銷在路徑弧長 k·節距 + 相位處,k 為偶數的是直立鏈節(viewer/paths.js)。
// 從進入輪的切點沿路徑往前,找到第一個叉齒,讓一節直立鏈節的中心落在那裡。
const PHASE0 = (() => {
  const { points, arrivals } = pulley.route;
  const polar = ([, y, z]) => Math.atan2(z, y);
  const wrap = (a) => ((a % TAU) + TAU) % TAU;
  const enter = polar(points[1]);
  const dir = Math.sign(Math.sin(polar(points[2]) - enter)); // 沿路徑前進時角度增加(+1)或減少(−1)
  const ahead = Math.min(...forks.map((f) => wrap(dir * (polar(partPoint([0, 0, 0], X, 0, f.at)) - enter))));
  return wrap((arrivals[0] + SEAT * ahead - PITCH / 2) / (2 * PITCH) * TAU) / TAU * 2 * PITCH;
})();

export const def = {
  ...pulley.def,
  pose(angle) {
    const pose = pulley.def.pose(angle);
    return { ...pose, paths: { strand: { ...pose.paths.strand, phase: pose.paths.strand.phase + PHASE0 } } };
  },
};
export default {
  ...def,
  waivers: [
    {
      check: "interference",
      parts: ["wheel", "strand"],
      reason:
        "直立鏈節套在 Y 形叉齒上、平躺鏈節落在兩齒之間(測試驗每一節繞在輪上的直立鏈節都正對一個叉齒),是鏈條和叉齒的咬合;實體驗證把鍊條當成中心線加寬度(半徑 0.15)的圓管,中心線在半徑 1.75、低於叉齒頂(1.79),圓管和叉齒的板重疊約 0.05。輪緣是光滑的圓筒,沒有凹窩。另外直立鏈節的下半環穿進輪緣殼(半徑 1.39–1.46 對輪緣 1.37–1.55),實體驗證量不到;叉齒要不要照原圖改成立著的 Y 還待決(model-audit 第 12 族「需要你決定的」第一題)",
    },
  ],
};
