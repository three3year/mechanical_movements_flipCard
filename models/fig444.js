// 第 444 種:蒙哥菲耶的水錘泵。利用小落差的水流把水柱噴到很高,或把水送到高處。右邊的閥門由重物(或彈簧)保持打開,
// 水沿箭頭流過管道、從那裡流出,直到水壓勝過重物把閥門關上。這個閥門一關,水流的動量就勝過另一個閥門上的壓力、
// 把它打開,擠一些水進球形的空氣室;空氣室裡空氣的膨脹力維持著從噴嘴向上的水柱。平衡後,右邊的閥門打開、
// 左邊的關上。兩個閥門如此交替,每一次都有一些水被送進空氣室,而空氣的彈性使流出的水柱保持均勻。
// 主動件是虛擬的「進程」:每單位是一次循環。
// 推斷:各階段所佔的進程;空氣室裡的水位隨每次送水微微升降;剖面圖。
import { deg, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine } from "./shapes.js";

const PIPE_Y = -1.45;
const TANK = { x: -2.6, top: 1.9 };
const WASTE = { x: 1.55, seat: PIPE_Y + 0.22 }; // 右邊的閥門(廢水閥)
const DELIVERY = { x: 0.35, seat: PIPE_Y + 0.22 }; // 左邊的閥門(送水閥),通到空氣室
const CHAMBER = { center: [0.35, 0.2, 0], radius: 0.95 };
const NOZZLE_TOP = 2.6;

/** 進程 v → 兩個閥門的開度(0 關、1 開)、管裡的水速、空氣室水位、階段 */
export function ram(v) {
  const u = v - Math.floor(v);
  if (u < 0.55) return { waste: 1, delivery: 0, speed: smooth(u / 0.55), level: 0.45 - 0.05 * (u / 0.55), phase: "右閥開:水沿管流出,越流越快" };
  if (u < 0.62) return { waste: 1 - (u - 0.55) / 0.07, delivery: 0, speed: 1, level: 0.4, phase: "水壓勝過重物,右閥關上" };
  if (u < 0.82) return { waste: 0, delivery: 1, speed: 1 - (u - 0.62) / 0.2, level: 0.4 + 0.05 * smooth((u - 0.62) / 0.2), phase: "水的動量打開左閥,水擠進空氣室" };
  return { waste: smooth((u - 0.82) / 0.18), delivery: 0, speed: 0, level: 0.45, phase: "平衡:左閥關、右閥又打開" };
}

const DRIVE = [[TANK.x, TANK.top - 0.4, 0.2], [TANK.x, PIPE_Y, 0.2], [WASTE.x, PIPE_Y, 0.2], [WASTE.x, WASTE.seat + 0.4, 0.2], [WASTE.x + 0.6, WASTE.seat + 0.5, 0.2]];
const INTO = [[DELIVERY.x, PIPE_Y, 0.2], [DELIVERY.x, CHAMBER.center[1] - 0.5, 0.2]];
const JETS = [-1, 1].map((s) => [[0.35, NOZZLE_TOP, 0.2], [0.35 + 0.1 * s, NOZZLE_TOP + 0.6, 0.2], [0.35 + 0.35 * s, NOZZLE_TOP + 0.8, 0.2], [0.35 + 0.6 * s, NOZZLE_TOP + 0.4, 0.2]]);

// 空氣室(球殼)的剖面:下面接一段頸,頂上留噴水管的孔
const arc = (r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [r * Math.cos(a), r * Math.sin(a)];
});
const RO = CHAMBER.radius + 0.06;
const RI = CHAMBER.radius;
const chamberProfile = [
  [0.22, -RO - 0.35],
  [0.28, -RO - 0.35],
  ...arc(RO, -Math.acos(0.28 / RO), Math.acos(0.12 / RO)),
  ...arc(RI, Math.acos(0.12 / RI), -Math.acos(0.22 / RI)),
];

const pipeWall = (pts) => ({ kind: "plate", shape: shape(thickLine(pts, 0.06)), thickness: 0.4 });

export default {
  figure: 444,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 上游的水箱與驅動管(剖面:畫兩道管壁)
        { kind: "plate", shape: shape(rect(1.0, 1.1, TANK.x, TANK.top - 0.55), [rect(0.86, 1.0, TANK.x, TANK.top - 0.5).reverse()]), thickness: 0.6 },
        pipeWall([[TANK.x - 0.2, TANK.top - 1.1], [TANK.x - 0.2, PIPE_Y - 0.2], [WASTE.x + 0.3, PIPE_Y - 0.2], [WASTE.x + 0.3, PIPE_Y + 0.2]]),
        pipeWall([[TANK.x + 0.2, TANK.top - 1.1], [TANK.x + 0.2, PIPE_Y + 0.2], [DELIVERY.x - 0.2, PIPE_Y + 0.2]]),
        pipeWall([[DELIVERY.x + 0.2, PIPE_Y + 0.2], [WASTE.x - 0.2, PIPE_Y + 0.2]]),
        // 承接廢水的外箱
        { kind: "plate", shape: shape(thickLine([[-0.6, -0.65], [-0.6, -2.0], [2.8, -2.0], [2.8, -0.65]], 0.08)), thickness: 1.2 },
        // 空氣室與下面的頸、噴水管
        { kind: "lathe", axis: [0, 1, 0], profile: chamberProfile, at: CHAMBER.center, ...backHalf([0, 1, 0]) },
        { kind: "cylinder", radius: 0.06, length: NOZZLE_TOP - CHAMBER.center[1] + 0.5, axis: [0, 1, 0], at: [0.35, (NOZZLE_TOP + CHAMBER.center[1] - 0.5) / 2, 0.08] },
        // 廢水閥的槓桿與重錘
        { kind: "box", size: [0.06, 0.6, 0.06], at: [WASTE.x + 0.75, WASTE.seat + 0.3, 0] },
      ],
    },
    { id: "lever", kind: "plate", shape: shape(thickLine([[0, 0], [0.75, 0]], 0.06)), thickness: 0.05, arrow: false, pieces: [{ kind: "sphere", radius: 0.12, at: [0.75, 0.15, 0] }] },
    { id: "waste", kind: "box", size: [0.4, 0.08, 0.36], arrow: false },
    { id: "delivery", kind: "box", size: [0.36, 0.08, 0.36], arrow: false },
    { id: "tankWater", kind: "fill", fluid: "water", center: [TANK.x, TANK.top - 0.5, 0], size: [0.82, 0.98, 0.5], level: 0.8 },
    { id: "pond", kind: "fill", fluid: "water", center: [1.1, -1.4, 0], size: [3.2, 1.2, 1.0], level: 0.55 },
    { id: "chamberWater", kind: "fill", fluid: "water", shape: "cylinder", center: [CHAMBER.center[0], CHAMBER.center[1] - 0.2, 0], size: [1.2, 1.0, 0], level: 0.4 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.25 },
  view: { direction: [0.05, 0.08, 1] },
  pose(v) {
    const r = ram(v);
    const travel = v * 6;
    const flows = [{ fluid: "water", points: JETS.flatMap((j) => stream(j, travel, { spacing: 0.15 })) }];
    if (r.speed > 0.05 && r.waste > 0.5) flows.push({ fluid: "water", points: stream(DRIVE, travel * (0.5 + r.speed), { spacing: 0.22 }) });
    if (r.delivery > 0) flows.push({ fluid: "water", points: [...stream(DRIVE.slice(0, 3), travel, { spacing: 0.22 }).filter((p) => p[0] < DELIVERY.x + 0.01), ...stream(INTO, travel, { spacing: 0.15 })] });
    const lift = (open) => 0.18 * open;
    return {
      parts: {
        // 廢水閥:打開時落下(離開閥座),關上時被水推上來
        waste: { position: [WASTE.x, WASTE.seat - lift(r.waste) + 0.04, 0] },
        lever: { position: [WASTE.x, WASTE.seat - lift(r.waste) + 0.3, 0], angle: deg(-8) * r.waste },
        // 送水閥:被水推開時往上抬
        delivery: { position: [DELIVERY.x, DELIVERY.seat + 0.15 + lift(r.delivery), 0] },
        chamberWater: { level: clamp(r.level, 0, 1) },
      },
      flows,
      readouts: [{ label: "階段", value: r.phase }],
    };
  },
};

