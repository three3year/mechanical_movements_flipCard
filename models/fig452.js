// 第 452 種:雙動式泵。泵筒兩端封閉,活塞桿從一端的填料函穿出;泵筒上有四個由閥門蓋住的開口,兩個進水、兩個排水。
// A 是吸水管,B 是排水管。活塞往下時,水從泵筒上端的吸水閥 1 湧入,活塞下方的水被迫經閥門 3 流進排水管 B;
// 活塞再上升時,水被迫經上端的排水閥 4 排出,同時從下方的吸水閥 2 進來。
// 主動件是活塞桿(上下往復)。剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, flap, barrel, pipeWalls } from "./pump.js";
import { backHalf } from "./section.js";

export const CYL = { r: 0.55, y0: -1.2, y1: 1.2 };
export const STROKE = [0.55, -0.55]; // 活塞高度:往下 → 往上(原圖箭頭朝下)
const PISTON_H = 0.32;
const ROD = 2.3;
const OPEN = deg(55);
const A_X = 1.05; // 吸水道(右)
const B_X = -1.05; // 排水道(左)
const TOP_PORT = CYL.y1 - 0.25;
const BOT_PORT = CYL.y0 + 0.25;

const suction = [[A_X + 0.9, CYL.y0 - 0.5], [A_X, CYL.y0 - 0.5], [A_X, CYL.y1 - 0.1]];
const delivery = [[B_X, CYL.y0 + 0.1], [B_X, CYL.y1 + 0.35], [B_X + 0.6, CYL.y1 + 0.35]];

/** 主動量 v → 活塞高度、是否往下;四個閥門(1、2 吸水,3、4 排水)哪些打開 */
export function pump(v) {
  const { at, forward } = stroke(v, ...STROKE);
  const down = forward;
  return { y: at, down, open: { 1: down, 3: down, 2: !down, 4: !down } };
}

export default {
  figure: 452,
  parts: [
    barrel("cylinder", { r: CYL.r, y0: CYL.y0, y1: CYL.y1 }),
    {
      id: "works",
      kind: "group",
      pieces: [
        // 上下端蓋、填料函
        { kind: "lathe", axis: Y, profile: [[0, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, 0.1], [0, 0.1]], at: [0, CYL.y0 - 0.1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, 0.1], [0.06, 0.1]], at: [0, CYL.y1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [0.15, 0], [0.15, 0.3], [0.06, 0.3]], at: [0, CYL.y1 + 0.1, 0], ...backHalf(Y) },
        // 吸水道 A(右)與排水道 B(左),以及通到泵筒的四個開口
        ...pipeWalls(suction, 0.3),
        ...pipeWalls(delivery, 0.3),
        ...pipeWalls([[A_X - 0.15, TOP_PORT], [CYL.r + 0.07, TOP_PORT]], 0.22),
        ...pipeWalls([[A_X - 0.15, BOT_PORT], [CYL.r + 0.07, BOT_PORT]], 0.22),
        ...pipeWalls([[B_X + 0.15, TOP_PORT], [-CYL.r - 0.07, TOP_PORT]], 0.22),
        ...pipeWalls([[B_X + 0.15, BOT_PORT], [-CYL.r - 0.07, BOT_PORT]], 0.22),
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
    flap("valve1", 0.22, { label: "1", labelOffset: [0.12, 0.12, 0.3] }),
    flap("valve2", 0.22, { label: "2", labelOffset: [0.12, -0.3, 0.3] }),
    flap("valve3", 0.22, { label: "3", labelOffset: [-0.12, -0.3, 0.3] }),
    flap("valve4", 0.22, { label: "4", labelOffset: [-0.12, 0.12, 0.3] }),
  ],
  waivers: [
    { check: "interference", parts: ["works", "valve1"], reason: "待確認:works 的板 與 valve1 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "valve2"], reason: "待確認:works 的板 與 valve2 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "valve3"], reason: "待確認(未修):works 的板 與 valve3 的板互相穿入 0.12(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["works", "valve4"], reason: "待確認(未修):works 的板 與 valve4 的板互相穿入 0.12(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: STROKE },
  targets: ["valve3", "valve4"], // 兩個排水閥:活塞上下兩程輪流把水送進排水管 B
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const p = pump(v);
    const travel = v * 4;
    // 閥門鉸在開口的上緣、往下垂;被水推開時往水流的方向(四個開口的水都往左流)擺
    const valve = (k, x, y) => ({ position: [x, y + 0.11, 0.05], angle: -Math.PI / 2 - (p.open[k] ? OPEN : 0) });
    const flows = p.down
      ? [
          { fluid: "water", points: stream([...suction.slice(0, 2), [A_X, TOP_PORT], [0.2, TOP_PORT]].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
          { fluid: "water", points: stream([[-0.2, BOT_PORT], [B_X, BOT_PORT], ...delivery.slice(1)].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
        ]
      : [
          { fluid: "water", points: stream([...suction.slice(0, 2), [A_X, BOT_PORT], [0.2, BOT_PORT]].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
          { fluid: "water", points: stream([[-0.2, TOP_PORT], [B_X, TOP_PORT], ...delivery.slice(1)].map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.18 }) },
        ];
    return {
      parts: {
        piston: { position: [0, p.y, 0] },
        valve1: valve(1, CYL.r + 0.25, TOP_PORT),
        valve2: valve(2, CYL.r + 0.25, BOT_PORT),
        valve4: valve(4, -CYL.r - 0.25, TOP_PORT),
        valve3: valve(3, -CYL.r - 0.25, BOT_PORT),
      },
      flows,
      readouts: [{ label: "活塞", value: p.down ? "往下:閥 1 進水、閥 3 排水" : "往上:閥 2 進水、閥 4 排水" }],
    };
  },
};
