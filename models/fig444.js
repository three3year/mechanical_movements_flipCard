// 第 444 種:蒙哥菲耶的水錘泵。利用小落差的水流把水柱噴到很高,或把水送到高處。右邊的閥門由重物(或彈簧)保持打開,
// 水沿箭頭流過管道、從那裡流出,直到水壓勝過重物把閥門關上。這個閥門一關,水流的動量就勝過另一個閥門上的壓力、
// 把它打開,擠一些水進球形的空氣室;空氣室裡空氣的膨脹力維持著從噴嘴向上的水柱。平衡後,右邊的閥門打開、
// 左邊的關上。兩個閥門如此交替,每一次都有一些水被送進空氣室,而空氣的彈性使流出的水柱保持均勻。
// 主動件是虛擬的「進程」:每單位是一次循環。
// 照原圖(2026-10-20):廢水閥是閥瓣、直立的閥桿與頂上的重球一件,閥桿穿過管頂上的橋形導架上下滑,沒有槓桿;
// 閥瓣在管頂開口的下面,重量把它往下拉開、水流把它頂上來貼住開口的邊(閥座)。送水閥坐在空氣室頸底的閥座環上、
// 被水推開時往上抬;頸直接坐在驅動管的頂壁上(管頂開口)。噴水管穿過球殼頂、和殼封死,下端伸到水面下。
// 推斷:各階段所佔的進程;空氣室裡的水位隨每次送水微微升降;剖面圖(管子畫兩道壁、水箱與外箱在管子穿過處開口)。
import { Y, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine } from "./shapes.js";

const PIPE_Y = -1.45;
const WALL = 0.06; // 管壁厚
const PIPE_TOP = PIPE_Y + 0.2 + WALL / 2; // 驅動管頂壁的上面
const PIPE_IN_TOP = PIPE_Y + 0.2 - WALL / 2; // 頂壁的下面(管內的頂)
const TANK = { x: -2.6, top: 1.9 };
/** 廢水閥(右):管頂開口的半寬、閥瓣的半寬、打開時落下的量 */
export const WASTE = { x: 1.55, hole: 0.17, half: 0.21, lift: 0.18 };
/** 送水閥(左):閥座環的孔半徑、閥瓣(圓盤)的半徑、抬起的量 */
export const DELIVERY = { x: 0.35, hole: 0.15, r: 0.19, lift: 0.18 };
export const CHAMBER = { center: [0.35, 0.2, 0], radius: 0.95 };
const NECK = { r: 0.22, wall: 0.06, seat: 0.08 }; // 空氣室的頸:內半徑、壁厚、底部閥座環的高
/** 頸壁的底面 = 驅動管頂壁的上面 */
export const NECK_BOTTOM = PIPE_TOP;
const SEAT_TOP = NECK_BOTTOM + NECK.seat; // 送水閥的閥座頂面
const NOZZLE_TOP = 2.6;
const NOZZLE_R = 0.06;
const BRIDGE = { leg: 0.26, rise: 0.32, boss: { r: 0.05, R: 0.12, h: 0.08, y: 0.42 } }; // 橋形導架:腳的 x、腳高、頂上的導套
/** 導架的導套(閥桿穿過的孔)的高度範圍 */
export const GUIDE = [PIPE_TOP + BRIDGE.boss.y, PIPE_TOP + BRIDGE.boss.y + BRIDGE.boss.h];
const STEM = 0.8; // 廢水閥桿長(從閥瓣頂面到桿頂)

/** 進程 v → 兩個閥門的開度(0 關、1 開)、管裡的水速、空氣室水位、階段 */
export function ram(v) {
  const u = v - Math.floor(v);
  if (u < 0.55) return { waste: 1, delivery: 0, speed: smooth(u / 0.55), level: 0.45 - 0.05 * (u / 0.55), phase: "右閥開:水沿管流出,越流越快" };
  if (u < 0.62) return { waste: 1 - (u - 0.55) / 0.07, delivery: 0, speed: 1, level: 0.4, phase: "水壓勝過重物,右閥關上" };
  if (u < 0.82) return { waste: 0, delivery: 1, speed: 1 - (u - 0.62) / 0.2, level: 0.4 + 0.05 * smooth((u - 0.62) / 0.2), phase: "水的動量打開左閥,水擠進空氣室" };
  return { waste: smooth((u - 0.82) / 0.18), delivery: 0, speed: 0, level: 0.45, phase: "平衡:左閥關、右閥又打開" };
}

const DRIVE = [[TANK.x, TANK.top - 0.4, 0.2], [TANK.x, PIPE_Y, 0.2], [WASTE.x, PIPE_Y, 0.2], [WASTE.x, PIPE_TOP + 0.2, 0.2], [WASTE.x + 0.5, PIPE_TOP + 0.3, 0.2], [WASTE.x + 0.8, PIPE_TOP - 0.2, 0.2]];
const INTO = [[DELIVERY.x, PIPE_Y, 0.2], [DELIVERY.x, CHAMBER.center[1] - 0.5, 0.2]];
const JETS = [-1, 1].map((s) => [[0.35, NOZZLE_TOP, 0.2], [0.35 + 0.1 * s, NOZZLE_TOP + 0.6, 0.2], [0.35 + 0.35 * s, NOZZLE_TOP + 0.8, 0.2], [0.35 + 0.6 * s, NOZZLE_TOP + 0.4, 0.2]]);

// 空氣室(球殼)的剖面:下面接一段頸、頸底收成閥座環,頂上留噴水管穿過的孔(孔和管一樣大,封死)
const arc = (r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [r * Math.cos(a), r * Math.sin(a)];
});
const RO = CHAMBER.radius + 0.06;
const RI = CHAMBER.radius;
const HB = NECK_BOTTOM - CHAMBER.center[1]; // 頸底(局部高度)
const chamberProfile = [
  [DELIVERY.hole, HB],
  [NECK.r + NECK.wall, HB],
  ...arc(RO, -Math.acos((NECK.r + NECK.wall) / RO), Math.acos(NOZZLE_R / RO)),
  ...arc(RI, Math.acos(NOZZLE_R / RI), -Math.acos(NECK.r / RI)),
  [NECK.r, HB + NECK.seat],
  [DELIVERY.hole, HB + NECK.seat],
];

const pipeWall = (pts, depth = 0.4) => ({ kind: "plate", shape: shape(thickLine(pts, WALL)), thickness: depth });
const TANK_BOTTOM = TANK.top - 1.065; // 水箱底板的中心線
const BOX = { x0: -0.6, x1: 2.8, top: -0.65, bottom: -2.0 }; // 承接廢水的外箱

export default {
  figure: 444,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 上游的水箱(剖面:左右兩半的壁與底,底在驅動管接進處開口;後壁把兩半連成一件)
        { kind: "plate", shape: shape(thickLine([[TANK.x - 0.465, TANK.top], [TANK.x - 0.465, TANK_BOTTOM], [TANK.x - 0.2, TANK_BOTTOM]], 0.07)), thickness: 0.6 },
        { kind: "plate", shape: shape(thickLine([[TANK.x + 0.465, TANK.top], [TANK.x + 0.465, TANK_BOTTOM], [TANK.x + 0.2, TANK_BOTTOM]], 0.07)), thickness: 0.6 },
        { kind: "plate", shape: shape(rect(1.0, 1.1, TANK.x, TANK.top - 0.55)), thickness: 0.06, at: [0, 0, -0.27] },
        // 驅動管(剖面:兩道壁):外壁從水箱底下去、沿底到右端再上來,頂上折回一段成廢水閥開口的右邊(閥座);
        // 內壁從水箱底到送水閥的頸;兩閥之間的一段頂壁(開口的左邊)
        pipeWall([[TANK.x - 0.2, TANK.top - 1.0], [TANK.x - 0.2, PIPE_Y - 0.2], [WASTE.x + 0.3, PIPE_Y - 0.2], [WASTE.x + 0.3, PIPE_TOP]]),
        pipeWall([[WASTE.x + 0.33, PIPE_Y + 0.2], [WASTE.x + WASTE.hole, PIPE_Y + 0.2]]),
        pipeWall([[TANK.x + 0.2, TANK.top - 1.0], [TANK.x + 0.2, PIPE_Y + 0.2], [DELIVERY.x - NECK.r, PIPE_Y + 0.2]]),
        pipeWall([[DELIVERY.x + NECK.r, PIPE_Y + 0.2], [WASTE.x - WASTE.hole, PIPE_Y + 0.2]]),
        // 承接廢水的外箱:左壁在驅動管穿過處開口(推斷:管子穿過箱壁的孔),管前後的壁留著
        { kind: "plate", shape: shape(thickLine([[BOX.x0, BOX.top], [BOX.x0, PIPE_TOP - 0.03]], 0.08)), thickness: 1.2 },
        { kind: "plate", shape: shape(thickLine([[BOX.x0, PIPE_Y - 0.2 + 0.03], [BOX.x0, BOX.bottom], [BOX.x1, BOX.bottom], [BOX.x1, BOX.top]], 0.08)), thickness: 1.2 },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.08, 0.46, 0.38], at: [BOX.x0, PIPE_Y, s * 0.4] })),
        // 空氣室:球殼、頸與頸底的閥座環一件,坐在驅動管的頂壁上;噴水管穿過殼頂(半徑和孔一樣,封死)、下端伸到水面下
        { kind: "lathe", axis: Y, profile: chamberProfile, at: CHAMBER.center, ...backHalf(Y) },
        { kind: "cylinder", radius: NOZZLE_R + 0.005, length: NOZZLE_TOP - CHAMBER.center[1] + 0.5, axis: Y, at: [0.35, (NOZZLE_TOP + CHAMBER.center[1] - 0.5) / 2, 0] },
        // 廢水閥桿的橋形導架(原圖):兩腳站在管頂、頂上一個導套讓閥桿穿過
        ...[-1, 1].map((s) => ({
          kind: "plate",
          shape: shape(thickLine([[s * BRIDGE.leg, -0.02], [s * BRIDGE.leg, BRIDGE.rise], [s * 0.1, BRIDGE.boss.y + BRIDGE.boss.h / 2]], 0.06)),
          thickness: 0.12,
          at: [WASTE.x, PIPE_TOP, 0],
        })),
        { kind: "lathe", axis: Y, profile: [[BRIDGE.boss.r, 0], [BRIDGE.boss.R, 0], [BRIDGE.boss.R, BRIDGE.boss.h], [BRIDGE.boss.r, BRIDGE.boss.h]], at: [WASTE.x, GUIDE[0], 0] },
      ],
    },
    // 廢水閥:閥瓣(在管頂開口的下面)、閥桿與頂上的重球一件;重量把它往下拉開,水流把它頂上來關閉
    {
      id: "waste",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [2 * WASTE.half, 0.08, 0.36] },
        { kind: "cylinder", axis: Y, radius: 0.03, length: STEM, at: [0, 0.04 + STEM / 2, 0] },
        { kind: "sphere", radius: 0.12, at: [0, 0.04 + STEM + 0.1, 0] },
      ],
    },
    // 送水閥:圓盤坐在頸底的閥座環上,頂上一小段導桿
    { id: "delivery", kind: "group", arrow: false, pieces: [{ kind: "cylinder", axis: Y, radius: DELIVERY.r, length: 0.08 }, { kind: "cylinder", axis: Y, radius: 0.03, length: 0.2, at: [0, 0.14, 0] }] },
    { id: "tankWater", kind: "fill", fluid: "water", center: [TANK.x, TANK.top - 0.5, 0], size: [0.82, 0.98, 0.5], level: 0.8 },
    { id: "pond", kind: "fill", fluid: "water", center: [1.1, -1.4, 0], size: [3.2, 1.2, 1.0], level: 0.55 },
    { id: "chamberWater", kind: "fill", fluid: "water", shape: "cylinder", center: [CHAMBER.center[0], CHAMBER.center[1] - 0.2, 0], size: [1.2, 1.0, 0], level: 0.4 },
  ],
  powered: ["waste", "delivery"], // 外力來源:直接受力(重物與水流)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.25 },
  targets: ["waste", "delivery"], // 交替開閉的兩個閥門
  view: { direction: [0.05, 0.08, 1] },
  pose(v) {
    const r = ram(v);
    const travel = v * 6;
    const flows = [{ fluid: "water", points: JETS.flatMap((j) => stream(j, travel, { spacing: 0.15 })) }];
    if (r.speed > 0.05 && r.waste > 0.5) flows.push({ fluid: "water", points: stream(DRIVE, travel * (0.5 + r.speed), { spacing: 0.22 }) });
    if (r.delivery > 0) flows.push({ fluid: "water", points: [...stream(DRIVE.slice(0, 3), travel, { spacing: 0.22 }).filter((p) => p[0] < DELIVERY.x + 0.01), ...stream(INTO, travel, { spacing: 0.15 })] });
    return {
      parts: {
        // 廢水閥:關上時閥瓣頂面貼著管頂開口的邊,打開時整組(閥瓣、桿、球)落下
        waste: { position: [WASTE.x, PIPE_IN_TOP - 0.04 - WASTE.lift * r.waste, 0] },
        // 送水閥:關上時圓盤底面貼著閥座環,被水推開時往上抬
        delivery: { position: [DELIVERY.x, SEAT_TOP + 0.04 + DELIVERY.lift * r.delivery, 0] },
        chamberWater: { level: clamp(r.level, 0, 1) },
      },
      flows,
      readouts: [{ label: "階段", value: r.phase }],
    };
  },
};
