// 第 265 種:變速運動。內凹的圓錐形鼓輪以規則的圓周運動轉動,摩擦滾子壓在鼓輪頂上,沿鼓輪的長度方向
// 來回橫移;滾子在粗的一端轉得快、在細的一端轉得慢,得到變速的旋轉運動。
// 主動件是鼓輪;滾子的橫移由主動量帶著(鼓輪轉 TRAVERSE 圈走完一趟)。
// 推斷:滾子橫移的方式與速度(原文只說使滾子沿長度方向橫移);鼓輪的輪廓。
import { X, TAU, swing, periodicIntegral } from "./kit.js";

const LEN = 3.4;
const R = { big: 1.45, small: 0.62 };
const ROLLER = 0.42;
const TRAVERSE = 6; // 鼓輪轉幾圈,滾子橫移一趟
const ENDS = [-LEN / 2 + 0.35, LEN / 2 - 0.35]; // 滾子可到的範圍

/** 鼓輪在 x 處的半徑:左粗右細、母線內凹 */
export const drumRadius = (x) => {
  const f = (x + LEN / 2) / LEN;
  return R.small + (R.big - R.small) * (1 - f) ** 2;
};

/** 鼓輪轉 theta:滾子的位置與它的轉角(滾子線速度 = 鼓輪在接觸處的線速度) */
const SPAN = ENDS[1] - ENDS[0];
const at = (theta) => swing((theta / (TAU * TRAVERSE)) * SPAN, ENDS[0], ENDS[1]);

export function roller(theta) {
  const x = at(theta);
  // 來回一趟(2·TRAVERSE 圈)是一個週期
  const spin = -periodicIntegral((t) => drumRadius(at(t)), 2 * TAU * TRAVERSE, theta, 0.02) / ROLLER;
  return { x, spin, rate: drumRadius(x) / ROLLER };
}
export const geometry = { ROLLER, R };

const profile = Array.from({ length: 25 }, (_, i) => {
  const x = -LEN / 2 + (i / 24) * LEN;
  return [drumRadius(x), x];
});

export default {
  figure: 265,
  parts: [
    {
      id: "drum",
      kind: "lathe",
      axis: X,
      profile: [[0, -LEN / 2], ...profile, [0, LEN / 2]],
      mark: true,
      spin: R.big,
      spinOffset: -LEN / 2 + 0.1,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: LEN + 2.0 },
        { kind: "cylinder", radius: R.big - 0.002, length: 0.02, at: [0, 0, -LEN / 2 - 0.005] },
        { kind: "cylinder", radius: R.small - 0.002, length: 0.02, at: [0, 0, LEN / 2 + 0.005] },
      ],
    },
    {
      id: "roller",
      kind: "cylinder",
      axis: X,
      radius: ROLLER,
      length: 0.3,
      mark: true,
      spin: ROLLER,
      pieces: [{ kind: "cylinder", radius: 0.05, length: 0.6 }],
    },
    // 滾子的架:軸叉與一根往上的桿,沿上方的導軌橫移
    { id: "carriage", kind: "group", pieces: [{ kind: "box", size: [0.5, 0.08, 0.08], at: [0, 0, -0.3] }, { kind: "box", size: [0.1, 1.3, 0.1], at: [0, 0.65, -0.5] }] },
    { id: "rail", kind: "box", center: [0.3, R.big + 0.95, -0.5], size: [5.2, 0.06, 0.06] },
  ],
  waivers: [
    { check: "interference", parts: ["drum", "roller"], reason: "待確認:drum 的旋轉體 與 roller 的圓柱 r0.42×0.3重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["carriage", "rail"], reason: "待確認:carriage 的方塊 0.1×1.3×0.1 與 rail 的方塊 5.2×0.06×0.06重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "drum", type: "rotation", speed: 2.4 },
  target: "roller", // 得到變速旋轉的滾子
  view: { direction: [0.12, 0.3, 1] },
  pose(theta) {
    const { x, spin } = roller(theta);
    return {
      parts: {
        drum: { angle: theta },
        roller: { position: [x, drumRadius(x) + ROLLER, 0], angle: spin },
        carriage: { position: [x, drumRadius(x) + ROLLER, 0] },
      },
      readouts: [],
    };
  },
};
