// 壓力泵(第 450、451 種)共用:泵筒在水面之上,實心活塞;一個閥門封住吸水管,另一個封住出水管。活塞上升時吸水閥打開、
// 水湧進泵筒,出水閥關閉;活塞下降時吸水閥關閉,水被迫經出水閥往上送。第 451 種在出水口加一個空氣室,使出水持續穩定。
// 主動件是手柄:照原圖支點在活塞桿左邊(第二種槓桿),往下壓把手就把活塞壓下去送水(2026-10-20 決定)——
// 第 450 種的手柄左端掛在泵筒左上耳垂下的吊環上(兩端銷接,活塞桿的銷走直線),第 451 種鉸在泵筒左上彎柱頂的支點上、
// 經短連桿接活塞桿。剖面圖:泵筒在進水管接進的地方開口,出水閥鉸在比管寬的閥室裡(第 450 種是圓頂的閥室,
// 第 451 種就是空氣室的底),管子的壁都畫到被接的壁的內面。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { lever, leverPart, stroke, valveOpening, flap, barrel, water, pipeWalls, valveDome, openedLathe } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, thickLine, circle } from "./shapes.js";

export const X = 0.6; // 泵筒軸線
export const BARREL = { x: X, r: 0.36, y0: -0.6, y1: 1.25, wall: 0.07 };
const SUCTION = { r: 0.18, y0: -2.2 };
const PISTON_H = 0.3;
const ROD = 1.8;
const LONG = 1.9; // 把手長
/** 第 450 種:吊環的上銷(泵筒左上的耳)、吊環長、吊環銷到活塞桿銷的距離 */
export const HANGER = { ear: [0.0, 1.25], length: 0.75, short: 0.6 };
/** 第 451 種:支點(彎柱頂)、支點到活塞桿銷的距離、連桿長 */
export const LEVER = { pivot: [X - 0.62, 2.35, 0], short: 0.62, long: LONG, link: 0.45, x: X, side: 1 };
export const SWING = [deg(24), deg(-24)]; // 把手從上到下:第一程往下壓,送水
const OPEN = deg(55);
export const VALVE_X = -0.7; // 出水閥(左邊的閥室)的軸線
const SEAT_Y = 0.2; // 出水閥的閥座(進水管的頂)
const FEED_Y = BARREL.y0 + 0.15; // 進水管的中心線(管的下壁坐在泵筒底的法蘭上)
const FEED_W = 0.24; // pipeWalls 的壁中心線相距 FEED_W,壁厚 0.06:內寬 0.18、外寬 0.30
const FEED_IN = FEED_W / 2 - 0.03; // 進水管的內半寬
const OUT_IN = 0.1 - 0.03; // 出水管(寬 0.2)的內半寬
const HANDLE_Z = -0.09; // 手柄在活塞桿後面一層;吊環 / 連桿再後一層,耳 / 支柱再後一層
const arm = lever(LEVER);

/**
 * 主動量 v → 手柄角、活塞高度、是否上行、活塞在行程中的位置(0 低、1 高)。
 * hanger:第 450 種的吊環(E 是手柄上活塞桿的銷,top 同 E,hang 是手柄左端掛在吊環上的銷);
 * 否則是第 451 種的固定支點(E 是連桿的上銷,top 是活塞桿頂)
 */
export function pump(v, { hanger = true } = {}) {
  const phase = stroke(v, ...SWING);
  const { at, forward } = phase;
  const place = (theta) => {
    if (!hanger) return { ...arm(theta), hang: null };
    // 吊環繞耳上的銷擺,擺到手柄上的活塞桿銷正好在泵筒軸線上(吊環在上、手柄左端在吊環的下銷)
    const { ear, length, short } = HANGER;
    const c = Math.max(-1, Math.min(1, (X - short * Math.cos(theta) - ear[0]) / length));
    const phi = Math.acos(c);
    const hang = [ear[0] + length * Math.cos(phi), ear[1] + length * Math.sin(phi), 0];
    const E = [hang[0] + short * Math.cos(theta), hang[1] + short * Math.sin(theta), 0];
    return { E, top: E, hang };
  };
  const { E, top, hang } = place(at);
  const hi = place(SWING[0]).top[1] - ROD;
  const lo = place(SWING[1]).top[1] - ROD;
  const y = top[1] - ROD;
  return { theta: at, E, top, hang, piston: y, up: !forward, frac: (y - lo) / (hi - lo), phase };
}

/**
 * 建立模型。air:有空氣室(第 451 種;手柄用固定支點),否則是第 450 種(吊環)
 */
export function makeForcePump(figure, { air = false } = {}) {
  const hanger = !air;
  const deliveryTop = air ? 2.6 : 2.4;
  const CHAMBER = { x: VALVE_X, y0: SEAT_Y, r: 0.5, wall: 0.06, straight: 1.1, h: 1.6 }; // 空氣室:有底的罐,頸口在 h
  const SPOUT_Y = CHAMBER.y0 + 0.85; // 側面出口的高度
  const feed = [[X - BARREL.r, FEED_Y], [VALVE_X, FEED_Y], [VALVE_X, SEAT_Y]];
  const outlet = air ? [[VALVE_X, CHAMBER.y0 + 0.5], [VALVE_X, deliveryTop]] : [[VALVE_X, SEAT_Y + 0.55], [VALVE_X, deliveryTop]];
  const side = [[VALVE_X - CHAMBER.r, SPOUT_Y], [VALVE_X - 0.85, SPOUT_Y], [VALVE_X - 1.0, SPOUT_Y - 0.4]];
  const spout = { y0: SPOUT_Y - 0.1, y1: SPOUT_Y + 0.1, side: -1, depth: 0.4 }; // 側面出口(寬 0.14)的外寬
  // 泵筒上的附件(推斷):第 450 種左上的耳(吊環掛在它的銷上),第 451 種左上的彎柱(頂著手柄的支點與樞軸銷)
  const fittings = hanger
    ? [{ kind: "plate", shape: shape(thickLine([[0.3, HANGER.ear[1]], [HANGER.ear[0] - 0.1, HANGER.ear[1]]], 0.14), [circle(0.04, HANGER.ear[0], HANGER.ear[1]).reverse()]), thickness: 0.06, at: [0, 0, HANDLE_Z - 0.17] }]
    : [
        { kind: "plate", shape: shape(thickLine([[0.3, BARREL.y1 - 0.3], [0.1, 2.0], [LEVER.pivot[0], LEVER.pivot[1]], [LEVER.pivot[0] - 0.03, LEVER.pivot[1] + 0.1]], 0.12)), thickness: 0.15, at: [0, 0, HANDLE_Z - 0.17] },
        { kind: "cylinder", radius: 0.035, length: 0.3, at: [LEVER.pivot[0], LEVER.pivot[1], HANDLE_Z - 0.1] }, // 手柄的樞軸銷:從柱穿過手柄
      ];
  return {
    figure,
    parts: [
      barrel("barrel", { ...BARREL, openings: [{ y0: BARREL.y0, y1: FEED_Y + FEED_W / 2 + 0.03, side: -1, depth: 0.4 }], pieces: fittings }),
      barrel("suction", { x: X, r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0 - 0.08, wall: 0.06 }),
      {
        id: "works",
        kind: "group",
        pieces: [
          // 泵筒底的法蘭(接吸水管)、泵筒底到出水閥座的管
          { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [X, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
          ...pipeWalls(feed, FEED_W),
          ...(air
            ? [
                // 空氣室:有底的罐(底就是出水閥的閥座,中央開進水管的孔),頂上收成頸口接出水管;出水管從空氣室裡
                // 開口、穿過頸口往上;左側壁開口接側面的出口(推斷:原圖左邊的杯形出口)
                ...openedLathe({
                  x: CHAMBER.x,
                  y0: CHAMBER.y0,
                  profile: [[FEED_IN, 0], [CHAMBER.r + CHAMBER.wall, 0], [CHAMBER.r + CHAMBER.wall, CHAMBER.straight], [OUT_IN + 0.06, CHAMBER.h], [OUT_IN + 0.06, CHAMBER.h + 0.05], [OUT_IN, CHAMBER.h + 0.05], [OUT_IN, CHAMBER.h - 0.04], [CHAMBER.r, CHAMBER.straight - 0.02], [CHAMBER.r, CHAMBER.wall], [FEED_IN, CHAMBER.wall]],
                  openings: [spout],
                }),
                ...pipeWalls(outlet, 0.2),
                ...pipeWalls(side, 0.14),
              ]
            : [
                // 圓頂的閥室(原圖出水管腳的圓頂),出水管從頸口接出
                ...valveDome(VALVE_X, SEAT_Y, { seat: FEED_IN, neck: OUT_IN }),
                ...pipeWalls(outlet, 0.2),
              ]),
        ],
      },
      { id: "well", kind: "fill", fluid: "water", center: [X, -2.45, 0], size: [2.0, 0.5, 1.2], level: 1 },
      { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [X, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
      { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
      ...(air ? [{ id: "chamberWater", kind: "fill", fluid: "water", shape: "cylinder", center: [CHAMBER.x, CHAMBER.y0 + CHAMBER.h / 2, 0], size: [2 * CHAMBER.r - 0.02, CHAMBER.h, 0], level: 0.4 }] : []),
      flap("suctionValve", 2 * SUCTION.r),
      flap("deliveryValve", 0.4),
      {
        id: "piston",
        kind: "cylinder",
        axis: Y,
        radius: BARREL.r - 0.01,
        length: PISTON_H,
        arrow: false,
        pieces: [
          { kind: "cylinder", radius: 0.04, length: ROD, at: [0, 0, ROD / 2] },
          // 第 450 種:活塞桿頂的銷(往後穿過手柄的銷孔);第 451 種:連桿下銷的座(往後,連桿的銷頭插在上面)
          { kind: "cylinder", radius: 0.03, length: 0.22, axis: [0, 1, 0], at: [0, 0.11, ROD] },
        ],
      },
      leverPart("handle", { short: hanger ? HANGER.short : LEVER.short, long: LONG, side: 1 }),
      hanger ? { id: "hanger", kind: "link", width: 0.08, thickness: 0.05 } : { id: "link", kind: "link", width: 0.08, thickness: 0.05 },
    ],
    powered: ["suctionValve", "deliveryValve"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
    driver: { part: "handle", type: "rotation", cycle: SWING },
    target: "piston", // 第 450、451 種:被手柄壓下去送水的活塞
    view: { direction: [0.08, 0.06, 1] },
    pose(v) {
      const p = pump(v, { hanger });
      const travel = v * 4;
      const flows = [];
      if (p.up) flows.push({ fluid: "water", points: stream([[X, -2.4, 0.1], [X, BARREL.y0 + 0.2, 0.1]], travel, { spacing: 0.2 }) });
      else flows.push({ fluid: "water", points: stream([[X - 0.1, FEED_Y, 0.1], ...feed.slice(1).map(([x, y]) => [x, y, 0.1]), ...(air ? [[VALVE_X, CHAMBER.y0 + 0.5, 0.1]] : outlet.map(([x, y]) => [x, y, 0.1]))], travel, { spacing: 0.18 }) });
      const parts = {
        handle: { position: hanger ? p.hang : LEVER.pivot, angle: p.theta },
        piston: { position: [X, p.piston, 0] },
        // 閥瓣被水頂開、回程加速落回閥座(見 pump.js 的 valveOpening)
        suctionValve: { position: [X - SUCTION.r, BARREL.y0 + 0.03, 0], angle: OPEN * valveOpening(p.up, p.phase) },
        deliveryValve: { position: [VALVE_X - 0.2, SEAT_Y + 0.09, 0], angle: OPEN * valveOpening(!p.up, p.phase) },
        below: water(X, BARREL.y0, p.piston - PISTON_H / 2, BARREL.y1 - BARREL.y0),
      };
      parts.handle.position = [parts.handle.position[0], parts.handle.position[1], HANDLE_Z];
      if (hanger) parts.hanger = { from: [HANGER.ear[0], HANGER.ear[1], HANDLE_Z - 0.09], to: [p.hang[0], p.hang[1], HANDLE_Z - 0.09] };
      else parts.link = { from: [p.E[0], p.E[1], HANDLE_Z - 0.09], to: [p.top[0], p.top[1], HANDLE_Z - 0.09] };
      let readout = p.up ? "上行:吸水閥開、出水閥關,水湧進泵筒" : "下行:吸水閥關、出水閥開,水被往上送";
      if (air) {
        // 空氣室的水位:下行時水被壓進去(空氣被壓縮),上行時空氣膨脹把水推出;兩個出口一直出水
        parts.chamberWater = { level: 0.35 + 0.25 * (1 - p.frac) };
        flows.push({
          fluid: "water",
          points: [
            ...stream([...outlet.map(([x, y]) => [x, y, 0.1]), [VALVE_X + 0.4, deliveryTop + 0.2, 0.1], [VALVE_X + 0.6, deliveryTop - 0.4, 0.1]], travel, { spacing: 0.16 }),
            ...stream([[VALVE_X - 0.2, SPOUT_Y, 0.1], ...side.slice(1).map(([x, y]) => [x, y, 0.1]), [VALVE_X - 1.0, SPOUT_Y - 0.9, 0.1]], travel, { spacing: 0.16 }),
          ],
        });
        readout += p.up ? ";空氣膨脹把水推出" : ";空氣被壓縮";
      } else if (!p.up) flows.push({ fluid: "water", points: stream([[VALVE_X, deliveryTop, 0.1], [VALVE_X - 0.3, deliveryTop + 0.2, 0.1], [VALVE_X - 0.5, deliveryTop - 0.4, 0.1]], travel, { spacing: 0.16 }) });
      return { parts, flows, readouts: [{ label: "活塞", value: readout }] };
    },
  };
}
