// 壓力泵(第 450、451 種)共用:泵筒在水面之上,實心活塞;一個閥門封住吸水管,另一個封住出水管。活塞上升時吸水閥打開、
// 水湧進泵筒,出水閥關閉;活塞下降時吸水閥關閉,水被迫經出水閥往上送。第 451 種在出水口加一個空氣室,使出水持續穩定。
// 主動件是手柄(往下壓提起活塞)。剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { lever, leverPart, stroke, flap, barrel, water, pipeWalls } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, thickLine } from "./shapes.js";

const X = 0.6; // 泵筒軸線
export const BARREL = { x: X, r: 0.36, y0: -0.6, y1: 1.4 };
const SUCTION = { r: 0.18, y0: -2.2 };
const PISTON_H = 0.3;
const ROD = 1.75;
const HANDLE = { pivot: [X + 0.9, 2.55, 0], short: 0.9, long: 1.9, link: 0.35, x: X };
export const SWING = [deg(22), deg(-24)];
const OPEN = deg(55);
const VALVE_X = -0.7; // 出水閥(左邊的閥箱)
const VALVE_Y = -0.1;
const arm = lever(HANDLE);

/** 主動量 v → 手柄角、活塞高度、是否上行、活塞在行程中的位置(0 低、1 高) */
export function pump(v) {
  const { at, forward } = stroke(v, ...SWING);
  const { E, top } = arm(at);
  const hi = arm(SWING[1]).top[1] - ROD;
  const lo = arm(SWING[0]).top[1] - ROD;
  const y = top[1] - ROD;
  return { theta: at, E, top, piston: y, up: forward, frac: (y - lo) / (hi - lo) };
}

/**
 * 建立模型。air:有空氣室(第 451 種)
 */
export function makeForcePump(figure, { air = false } = {}) {
  const deliveryTop = air ? 2.6 : 2.4;
  const CHAMBER = { x: VALVE_X, y0: VALVE_Y + 0.35, y1: 1.9, r: 0.5 };
  const feed = [[X - 0.1, BARREL.y0 + 0.1], [VALVE_X, BARREL.y0 + 0.1], [VALVE_X, VALVE_Y + 0.3]];
  const outlet = air ? [[VALVE_X, CHAMBER.y0 + 0.15], [VALVE_X, deliveryTop]] : [[VALVE_X, VALVE_Y + 0.3], [VALVE_X, deliveryTop]];
  const side = [[VALVE_X - 0.15, CHAMBER.y0 + 0.2], [VALVE_X - 1.0, CHAMBER.y0 + 0.2], [VALVE_X - 1.15, CHAMBER.y0 - 0.4]];
  return {
    figure,
    parts: [
      barrel("barrel", { x: X, r: BARREL.r, y0: BARREL.y0, y1: BARREL.y1 }),
      barrel("suction", { x: X, r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0, wall: 0.06 }),
      {
        id: "works",
        kind: "group",
        pieces: [
          { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [X, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
          // 泵筒底到出水閥箱的管、閥箱、往上的出水管
          ...pipeWalls(feed, 0.24),
          { kind: "plate", shape: shape(thickLine([[VALVE_X - 0.3, VALVE_Y + 0.35], [VALVE_X - 0.3, VALVE_Y - 0.3], [VALVE_X + 0.3, VALVE_Y - 0.3], [VALVE_X + 0.3, VALVE_Y + 0.35]], 0.06)), thickness: 0.4 },
          ...(air
            ? [
                // 空氣室(倒扣的罐,剖面)、穿過頂上的出水管、側面的出水口
                { kind: "lathe", axis: Y, profile: [[CHAMBER.r, 0], [CHAMBER.r + 0.06, 0], [CHAMBER.r + 0.06, CHAMBER.y1 - CHAMBER.y0], [0.1, CHAMBER.y1 - CHAMBER.y0 + 0.06], [0.1, CHAMBER.y1 - CHAMBER.y0], [CHAMBER.r, CHAMBER.y1 - CHAMBER.y0 - 0.06]], at: [CHAMBER.x, CHAMBER.y0, 0], ...backHalf(Y) },
                ...pipeWalls(outlet, 0.14),
                ...pipeWalls(side, 0.14),
              ]
            : pipeWalls(outlet, 0.2)),
          // 手柄的支柱
          { kind: "plate", shape: shape(thickLine([[X + BARREL.r + 0.07, BARREL.y1 - 0.2], [X + 0.75, 2.2], [X + 0.9, 2.55]], 0.1)), thickness: 0.15 },
        ],
      },
      { id: "well", kind: "fill", fluid: "water", center: [X, -2.45, 0], size: [2.0, 0.5, 1.2], level: 1 },
      { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [X, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
      { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
      ...(air ? [{ id: "chamberWater", kind: "fill", fluid: "water", shape: "cylinder", center: [CHAMBER.x, (CHAMBER.y0 + CHAMBER.y1) / 2, 0], size: [2 * CHAMBER.r - 0.02, CHAMBER.y1 - CHAMBER.y0, 0], level: 0.4 }] : []),
      flap("suctionValve", 2 * SUCTION.r),
      flap("deliveryValve", 0.4),
      {
        id: "piston",
        kind: "cylinder",
        axis: Y,
        radius: BARREL.r - 0.01,
        length: PISTON_H,
        arrow: false,
        pieces: [{ kind: "cylinder", radius: 0.04, length: ROD, at: [0, 0, ROD / 2] }],
      },
      leverPart("handle", HANDLE),
      { id: "link", kind: "link", width: 0.08, thickness: 0.05 },
    ],
    driver: { part: "handle", type: "rotation", cycle: SWING },
    target: "piston", // 第 450、451 種:被手柄壓下去送水的活塞
    view: { direction: [0.08, 0.06, 1] },
    pose(v) {
      const p = pump(v);
      const travel = v * 4;
      const flows = [];
      if (p.up) flows.push({ fluid: "water", points: stream([[X, -2.4, 0.1], [X, BARREL.y0 + 0.2, 0.1]], travel, { spacing: 0.2 }) });
      else flows.push({ fluid: "water", points: stream([...feed.map(([x, y]) => [x, y, 0.1]), ...(air ? [[VALVE_X, CHAMBER.y0 + 0.5, 0.1]] : outlet.map(([x, y]) => [x, y, 0.1]))], travel, { spacing: 0.18 }) });
      const parts = {
        handle: { position: HANDLE.pivot, angle: p.theta },
        link: { from: [p.E[0], p.E[1], 0.08], to: [p.top[0], p.top[1], 0.08] },
        piston: { position: [X, p.piston, 0] },
        suctionValve: { position: [X - SUCTION.r, BARREL.y0 + 0.03, 0], angle: p.up ? OPEN : 0 },
        deliveryValve: { position: [VALVE_X - 0.2, VALVE_Y + 0.3, 0], angle: p.up ? 0 : OPEN },
        below: water(X, BARREL.y0, p.piston - PISTON_H / 2, BARREL.y1 - BARREL.y0),
      };
      let readout = p.up ? "上行:吸水閥開、出水閥關,水湧進泵筒" : "下行:吸水閥關、出水閥開,水被往上送";
      if (air) {
        // 空氣室的水位:下行時水被壓進去(空氣被壓縮),上行時空氣膨脹把水推出;兩個出口一直出水
        parts.chamberWater = { level: 0.35 + 0.25 * (1 - p.frac) };
        flows.push({ fluid: "water", points: [...stream([...outlet.map(([x, y]) => [x, y, 0.1]), [VALVE_X + 0.4, deliveryTop + 0.2, 0.1], [VALVE_X + 0.6, deliveryTop - 0.4, 0.1]], travel, { spacing: 0.16 }), ...stream(side.map(([x, y]) => [x, y, 0.1]), travel, { spacing: 0.16 })] });
        readout += p.up ? ";空氣膨脹把水推出" : ";空氣被壓縮";
      } else if (!p.up) flows.push({ fluid: "water", points: stream([[VALVE_X, deliveryTop, 0.1], [VALVE_X - 0.3, deliveryTop + 0.2, 0.1], [VALVE_X - 0.5, deliveryTop - 0.4, 0.1]], travel, { spacing: 0.16 }) });
      return { parts, flows, readouts: [{ label: "活塞", value: readout }] };
    },
  };
}
