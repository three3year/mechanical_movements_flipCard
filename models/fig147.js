// 第 147 種:蒸汽引擎的調速器。中心軸上牢固地固定著兩個圓形斜面(碗形座邊緣上的螺旋斜面);十字頭鬆套在軸上,
// 兩端裝著扇葉,底下兩個摩擦滾子靠在斜面上,頂上加了一個重球。軸轉得越快,扇葉受的空氣阻力越大,
// 十字頭便落後於軸,滾子沿斜面往上滾,把十字頭抬高;十字頭頂部接著作用於調節閥的槓桿。
// 主動件是虛擬的「轉速」(平衡型):空氣阻力與轉速的平方成正比,十字頭落後的角度與抬升的高度也是(推斷)。
// 心軸由底部的一對斜齒輪與水平軸帶動(原圖只畫到底部的軸承托架;斜齒輪、水平軸與軸承是推斷,
// 比照第 161、170 種);主動件是轉速本身,心軸在模型裡不轉,看到的是十字頭相對心軸落後、沿斜面抬起。
import { X, Y, deg } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { pedestalX } from "./supports.js";

const MAX = 10; // 轉速範圍(示意單位)
const LAG = deg(55); // 最高轉速時十字頭落後的角度
const RISE = 0.55; // 斜面:每落後 LAG,滾子升高 RISE
const ARM = 1.35; // 十字頭臂長(滾子離軸)
const RIM_Y = -0.35; // 碗形座邊緣的頂面
const RAMP_R = 0.1; // 斜面(圓管)的半徑
const ROLLER = 0.13;
const RAMP_Y0 = RIM_Y + 0.02; // 斜面起點的中心:半陷在邊緣裡
const BASE_Y = RAMP_Y0 + RAMP_R + ROLLER; // 滾子在斜面最低處時的高度
const LEVER = { pivot: [3.4, 3.47, 0], length: 3.5 }; // 槓桿的一端壓在十字頭頂端的圓頭上
const APEX = [0, -2.0, 0]; // 底部斜齒輪對的錐頂
const FLOOR = -3.3;

/** 轉速 s:十字頭落後的角度與抬升的高度 */
export function governor(s) {
  const f = (Math.min(MAX, Math.max(0, s)) / MAX) ** 2;
  return { lag: LAG * f, rise: RISE * f };
}

const SPAN = LAG * 1.15; // 斜面的長度(角度):比最大落後角再長一點
// 斜面:碗形座邊緣上兩段螺旋斜面(高度隨角度線性增加),下面用一排階狀的塊填到邊緣,看得出是實心的楔
const rampAt = (start, a) => [ARM * Math.cos(start + a), RAMP_Y0 + (RISE * a) / LAG, ARM * Math.sin(start + a)];
const ramp = (start) => [
  { kind: "tube", points: Array.from({ length: 31 }, (_, i) => rampAt(start, (SPAN * i) / 30)), radius: RAMP_R },
  ...Array.from({ length: 10 }, (_, i) => {
    const a = (SPAN * (i + 0.5)) / 10;
    const [x, y, z] = rampAt(start, a);
    const h = y - RIM_Y;
    return { kind: "box", size: [0.3, (ARM * SPAN) / 10 + 0.02, h], at: [x, RIM_Y + h / 2, z], axis: Y, angle: -(start + a) };
  }),
];

export default {
  figure: 147,
  parts: [
    {
      id: "shaft",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.16, length: 3.6, at: [0, 0.3, 0] },
        // 碗形座:邊緣是一圈平頂的厚環,斜面立在上面
        { kind: "lathe", axis: Y, at: [0, -0.55, 0], profile: [[0.2, -0.3], [1.6, -0.3], [1.6, 0.2], [1.1, 0.2], [1.1, 0.05], [0.4, 0.0], [0.2, 0.05]] },
        ...ramp(0),
        ...ramp(Math.PI),
        { kind: "cylinder", axis: Y, radius: 0.16, length: 2.3, at: [0, -2.1, 0] }, // 軸的下段:穿過斜齒輪,底端在腳座裡
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, -1, 0], at: [0, APEX[1] + 0.5, 0] },
      ],
    },
    {
      id: "crosshead",
      kind: "group",
      pieces: [
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", axis: X, radius: 0.14, length: ARM + 0.15, at: [s * (0.3 + (ARM + 0.15) / 2), 0.95, 0] }, // 橫臂從套筒兩側伸出(不穿過軸)
          { kind: "cylinder", axis: X, radius: 0.24, length: 0.18, at: [s * (ARM - 0.25), 0.95, 0] },
          { kind: "plate", shape: shape(rect(0.9, 1.6)), thickness: 0.06, at: [s * (ARM + 1.05), 0.95, 0] },
          // 吊架從臂端垂下,滾子(軸沿徑向)裝在吊架下端,靠在斜面上
          { kind: "box", size: [0.08, 0.95 - BASE_Y, 0.12], at: [s * (ARM + 0.11), (0.95 + BASE_Y) / 2, 0] },
          { kind: "cylinder", axis: X, radius: 0.05, length: 0.3, at: [s * ARM, BASE_Y, 0] },
          { kind: "cylinder", axis: X, radius: ROLLER, length: 0.14, at: [s * ARM, BASE_Y, 0] },
        ]),
        { kind: "sphere", radius: 0.82, at: [0, 2.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.3, length: 0.55, at: [0, 1.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, length: 0.4, at: [0, 2.95, 0] },
        { kind: "sphere", radius: 0.12, at: [0, 3.25, 0] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [LEVER.length, 0.2, 0.12], at: [-LEVER.length / 2, 0, 0.1] },
        { kind: "cylinder", radius: 0.14, length: 0.3 },
      ],
    },
    // 引擎經這根水平軸與斜齒輪帶動心軸(零件的局部 +Z 是世界的 +X;錐頂朝 −X)
    {
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: [0.5, APEX[1], 0],
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, -1] },
        { kind: "cylinder", radius: 0.1, length: 1.6, at: [0, 0, 0.8] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.4, inner: 0.18, length: 0.6, at: [0, FLOOR + 0.3, 0] }, // 心軸的腳座
        { kind: "box", size: [1.2, 0.18, 1.0], at: [0, FLOOR - 0.09, 0] },
        ...pedestalX({ x: 1.75, y: APEX[1], z: 0, bore: 0.1, floor: FLOOR }),
      ],
    },
  ],
  powered: ["crosshead"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: [0, MAX] },
  target: "lever",
  view: { direction: [0.02, 0.12, 1] },
  pose(s) {
    const { lag, rise } = governor(s);
    return {
      parts: {
        crosshead: { position: [0, rise, 0], rotation: [0, Math.sin(-lag / 2), 0, Math.cos(-lag / 2)] },
        lever: { angle: -Math.asin(rise / LEVER.length) },
      },
      readouts: [],
    };
  },
};
