// 第 254 種:鏈輪,用來以鏈條驅動或被鏈條驅動。輪緣上立著一圈 Y 形的叉齒(柄插在輪緣上,兩叉沿徑向往外、
// 往輪軸的兩側張開,照原圖輪緣頂端與底端伸出輪廓外的 Y),環式鏈條的直立鏈節從兩叉之間落進叉口、
// 下緣靠在分岔處,兩叉夾在它兩側不讓它沿輪緣滑;平躺的鏈節貼著輪緣、落在兩齒之間。
// 推斷(原圖只畫靜止的輪,沒畫鏈條):鏈條繞過輪的後半圈,轉動鏈輪時鏈條跟著走;叉齒的尺寸配鏈節
// (叉口剛好容下直立鏈節的管;Y 的寬約輪緣寬的一半,照原圖)。
// 每個叉齒對兩節(一節直立、一節平躺),所以節距由齒數算:繞在輪上 15° 一節;起始相位讓直立鏈節的中心正對叉齒。
import { facePulley, shaftPieces } from "./face-pulley.js";
import { TAU, X, quatFromBasis, partPoint } from "./kit.js";
import { shape } from "./shapes.js";
import { ringSize } from "./chain-links.js";

const R = 1.55;
const W = 0.85;
export const TEETH = 12;
const CHAIN_WIDTH = 0.3;
const { tube: TUBE, half: RING_HALF } = ringSize(CHAIN_WIDTH);

// Y 形叉齒:Y 字在輪軸與徑向張成的平面上(局部 x 沿輪軸、y 從輪緣面往外量),沿切線方向有厚度。
// 柄插進輪緣殼 0.1;分岔處(叉口底)在輪緣面上方 CROTCH,叉口底寬 0.12,剛好容下直立鏈節的管(管半徑 TUBE 0.054)
const CROTCH = 0.06;
const Y_SHAPE = shape([
  [-0.1, -0.1], [0.1, -0.1], [0.1, CROTCH - 0.03], [0.23, CROTCH + 0.19], [0.17, CROTCH + 0.25], [0.07, CROTCH + 0.08], [0.06, CROTCH],
  [-0.06, CROTCH], [-0.07, CROTCH + 0.08], [-0.17, CROTCH + 0.25], [-0.23, CROTCH + 0.19], [-0.1, CROTCH - 0.03],
]);
const FORK_THICKNESS = 0.1;
const forks = Array.from({ length: TEETH }, (_, i) => {
  const a = (i / TEETH) * TAU;
  const radial = [Math.cos(a), Math.sin(a), 0];
  const tangent = [-Math.sin(a), Math.cos(a), 0];
  const rotation = quatFromBasis([0, 0, 1], radial, tangent);
  return { kind: "plate", shape: Y_SHAPE, thickness: FORK_THICKNESS, rotation, at: [R * Math.cos(a), R * Math.sin(a), 0], accent: i === 0 };
});

// 鏈條中心線(直立鏈節的中心)的半徑:直立鏈節的下緣(弦的正中往內 RING_HALF)在分岔處上方 0.003
const HALF_STEP = Math.PI / (2 * TEETH); // 繞在輪上一節所張的角的一半
const SEAT = (R + CROTCH + 0.003 + RING_HALF) / Math.cos(HALF_STEP);
export const PITCH = (TAU * SEAT) / (2 * TEETH);
// 直立鏈節比平躺鏈節高出 UPRIGHT_LIFT:平躺鏈節的管(厚 TUBE)在弦的正中離輪緣面 0.005,貼著輪緣
const UPRIGHT_LIFT = SEAT * Math.cos(HALF_STEP) - TUBE - R - 0.005;

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
  strand: { kind: "chain", style: "ring", pitch: PITCH, width: CHAIN_WIDTH, normal: [1, 0, 0], uprightLift: UPRIGHT_LIFT },
});
export const { travel } = pulley;

// 鏈條的起始相位:第 k 節的兩銷在路徑弧長 k·節距 + 相位處,k 為偶數的是直立鏈節(models/chain-links.js)。
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
export default def;
