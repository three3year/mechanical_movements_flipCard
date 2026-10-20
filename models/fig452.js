// 第 452 種:雙動式泵。泵筒兩端封閉,活塞桿從一端的填料函穿出;泵筒上有四個由閥門蓋住的開口,兩個進水、兩個排水。
// A 是吸水管,B 是排水管。活塞往下時,水從泵筒上端的吸水閥 1 湧入,活塞下方的水被迫經閥門 3 流進排水管 B;
// 活塞再上升時,水被迫經上端的排水閥 4 排出,同時從下方的吸水閥 2 進來。
// 主動件是活塞桿(上下往復)。剖面圖:泵筒在四個開口的高度真的開著口,開口的短管接到 A、B 水道的內壁、內壁在接管處斷開
// (2026-10-20 決定);閥瓣鉸在短管的頂壁下、在短管裡張開(1、2 往泵筒那邊開,3、4 往 B 那邊開)。
// 推斷:A、B 的盡頭封住、留著剖開的背面;兩端的端蓋、填料函與泵筒兩端和 A 之間的頂壁、底壁都算外殼(原圖是一體的鑄件)。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, valveOpening, flap, barrel, pipeWalls } from "./pump.js";
import { backHalf } from "./section.js";
import { spanBox } from "./shapes.js";

export const CYL = { r: 0.55, y0: -1.2, y1: 1.2 };
export const STROKE = [0.55, -0.55]; // 活塞高度:往下 → 往上(原圖箭頭朝下)
const PISTON_H = 0.32;
const ROD = 2.3;
const OPEN = deg(55);
export const A_X = 1.05; // 吸水道(右)
export const B_X = -1.05; // 排水道(左)
const TOP_PORT = CYL.y1 - 0.25;
const BOT_PORT = CYL.y0 + 0.25;
const PORT_W = 0.22; // 開口短管:壁的中心線相距 0.22、壁厚 0.06 → 通道高 0.16、外高 0.28
const PORT_OUT = PORT_W / 2 + 0.03;
const WALL = 0.15; // A、B 水道的內壁中心線離水道軸線的距離(水道寬 0.3)
const FLAP = 0.15; // 閥瓣長:鉸在短管頂壁下,垂下來剛好到底壁

const suction = [[A_X, CYL.y0 - 0.6], [A_X, CYL.y1 + 0.1]]; // A:底下是進水口,頂端封住(和頂蓋齊)
const delivery = [[B_X, CYL.y0 + 0.1], [B_X, CYL.y1 + 0.28], [B_X + 0.6, CYL.y1 + 0.28]]; // B:底端封住,頂上往右轉出去(坐在頂蓋上)
const ports = [TOP_PORT, BOT_PORT];
const openings = ports.flatMap((y) => [1, -1].map((side) => ({ y0: y - PORT_OUT, y1: y + PORT_OUT, side, depth: 0.4 })));

/** 主動量 v → 活塞高度、是否往下;四個閥門(1、2 吸水,3、4 排水)哪些打開 */
export function pump(v) {
  const phase = stroke(v, ...STROKE);
  const down = phase.forward;
  return { y: phase.at, down, open: { 1: down, 3: down, 2: !down, 4: !down }, phase };
}

export default {
  figure: 452,
  parts: [
    barrel("cylinder", { r: CYL.r, y0: CYL.y0, y1: CYL.y1, openings }),
    {
      id: "works",
      kind: "group",
      pieces: [
        // 上下端蓋、填料函、泵筒兩端與 A 之間的頂壁和底壁(外殼)
        { kind: "lathe", axis: Y, profile: [[0, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, 0.1], [0, 0.1]], at: [0, CYL.y0 - 0.1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, 0.1], [0.06, 0.1]], at: [0, CYL.y1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [0.15, 0], [0.15, 0.3], [0.06, 0.3]], at: [0, CYL.y1 + 0.1, 0], ...backHalf(Y) },
        spanBox(CYL.r, A_X - WALL + 0.03, CYL.y0 - 0.1, CYL.y0, -0.2, 0.2),
        spanBox(CYL.r, A_X - WALL + 0.03, CYL.y1, CYL.y1 + 0.1, -0.2, 0.2),
        // 吸水道 A(右)與排水道 B(左):內壁在四個開口處斷開;通到泵筒的四段開口短管接到內壁的外面
        ...pipeWalls(suction, 2 * WALL, 0.06, 0.4, { breaks: ports.map((y) => ({ at: [A_X - WALL, y], width: 2 * PORT_OUT, side: 1 })), caps: { end: true }, back: true }),
        ...pipeWalls(delivery, 2 * WALL, 0.06, 0.4, { breaks: ports.map((y) => ({ at: [B_X + WALL, y], width: 2 * PORT_OUT, side: -1 })), caps: { start: true }, back: true }),
        ...ports.flatMap((y) => [...pipeWalls([[A_X - WALL + 0.03, y], [CYL.r, y]], PORT_W), ...pipeWalls([[B_X + WALL - 0.03, y], [-CYL.r, y]], PORT_W)]),
      ],
    },
    { id: "labelA", kind: "group", label: "A", labelOffset: [A_X + 0.35, 0, 0.4], pieces: [] },
    { id: "labelB", kind: "group", label: "B", labelOffset: [B_X - 0.3, CYL.y1 + 0.5, 0.4], pieces: [] },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, 0, 0], size: [2 * CYL.r - 0.02, CYL.y1 - CYL.y0, 0], level: 1 },
    {
      id: "piston",
      kind: "cylinder",
      axis: Y,
      radius: CYL.r - 0.01,
      length: PISTON_H,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.05, length: ROD, at: [0, 0, ROD / 2] }],
    },
    // 四個瓣閥:1 上吸水、2 下吸水(在右邊的開口)、4 上排水、3 下排水(在左邊的開口)
    flap("valve1", FLAP, { label: "1", labelOffset: [0.12, 0.12, 0.3] }),
    flap("valve2", FLAP, { label: "2", labelOffset: [0.12, -0.3, 0.3] }),
    flap("valve3", FLAP, { label: "3", labelOffset: [-0.12, -0.3, 0.3] }),
    flap("valve4", FLAP, { label: "4", labelOffset: [-0.12, 0.12, 0.3] }),
  ],
  powered: ["valve1", "valve2", "valve3", "valve4"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: STROKE },
  targets: ["valve3", "valve4"], // 兩個排水閥:活塞上下兩程輪流把水送進排水管 B
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const p = pump(v);
    const travel = v * 4;
    // 閥門鉸在開口短管的頂壁下、往下垂;被水推開時往水流的方向(四個開口的水都往左流)擺,回程加速落回(pump.js 的 valveOpening)。
    // 吸水閥 1、2 鉸在 A 那一端、往泵筒張;排水閥 3、4 鉸在泵筒那一端、往 B 張
    const valve = (k, x, y) => ({ position: [x, y + PORT_W / 2 - 0.03 - 0.005, 0.05], angle: -Math.PI / 2 - OPEN * valveOpening(p.open[k], p.phase) });
    const hingeA = A_X - WALL - 0.03 - 0.04;
    const hingeB = -CYL.r - 0.07 - 0.035;
    const flows = p.down
      ? [
          { fluid: "water", points: stream([suction[0], [A_X, TOP_PORT], [0.2, TOP_PORT]].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
          { fluid: "water", points: stream([[-0.2, BOT_PORT], [B_X, BOT_PORT], ...delivery.slice(1)].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
        ]
      : [
          { fluid: "water", points: stream([suction[0], [A_X, BOT_PORT], [0.2, BOT_PORT]].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
          { fluid: "water", points: stream([[-0.2, TOP_PORT], [B_X, TOP_PORT], ...delivery.slice(1)].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
        ];
    return {
      parts: {
        piston: { position: [0, p.y, 0] },
        valve1: valve(1, hingeA, TOP_PORT),
        valve2: valve(2, hingeA, BOT_PORT),
        valve4: valve(4, hingeB, TOP_PORT),
        valve3: valve(3, hingeB, BOT_PORT),
      },
      flows,
      readouts: [{ label: "活塞", value: p.down ? "往下:閥 1 進水、閥 3 排水" : "往上:閥 2 進水、閥 4 排水" }],
    };
  },
};
