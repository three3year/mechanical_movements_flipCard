// 第 464 種:希羅噴泉。水倒進上方的容器後,經右邊的管子降到下方的容器;中間的容器也事先裝滿水。再把更多水倒進上方的容器時,
// 封在下方與中間容器水面上方、以及左邊連通管裡的空氣被壓縮,靠它的彈力把水柱從中央的管子噴出。
// 主動件是虛擬的「進程」:從倒水開始到中間容器的水噴完。
// 推斷:上方容器是頂上的碗,中間容器是頂部的橫箱,下方容器是底部的橫箱,兩邊的立柱是管子;
// 噴出的水落回碗裡;水柱高度約等於下方與上方容器的水位差(隨中間容器的水減少而稍降)。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine } from "./shapes.js";

const W = 3.4;
export const MID = { y0: 1.0, y1: 1.6 }; // 中間容器(頂部橫箱)
export const LOW = { y0: -1.9, y1: -1.2 }; // 下方容器(底部橫箱)
const BASIN = { y: 1.95, r: 0.9 };
const RIGHT_X = W / 2 - 0.2;
const LEFT_X = -W / 2 + 0.2;
const NOZZLE = 2.35;

/** 進程 u → 中間、下方容器的水位(0–1)與噴水高度 */
export function fountain(v) {
  const u = clamp(v - Math.floor(v), 0, 1);
  const mid = 0.9 - 0.8 * u;
  const low = 0.1 + 0.8 * u;
  // 空氣的壓力由右管裡的水柱(碗到下方容器的水面)決定,噴高再扣掉中間容器水面到噴嘴的高度
  const lowSurface = LOW.y0 + low * (LOW.y1 - LOW.y0);
  const midSurface = MID.y0 + mid * (MID.y1 - MID.y0);
  const head = BASIN.y - lowSurface - (NOZZLE - midSurface);
  return { mid, low, jet: Math.max(0, head) * 0.25, pressure: BASIN.y - lowSurface };
}

const box = (y0, y1) => ({ kind: "plate", shape: shape(rect(W, y1 - y0 + 0.12, 0, (y0 + y1) / 2), [rect(W - 0.12, y1 - y0, 0, (y0 + y1) / 2).reverse()]), thickness: 0.7 });

export default {
  figure: 464,
  parts: [
    {
      id: "vessels",
      kind: "group",
      pieces: [
        box(MID.y0, MID.y1),
        box(LOW.y0, LOW.y1),
        // 碗(上方容器)
        { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (Math.PI * i) / 12; return [BASIN.r * Math.cos(a), BASIN.y + 0.15 + 0.55 * Math.sin(a)]; }), 0.07)), thickness: 0.7, at: [0, 0, 0] },
        // 右管:碗 → 下方容器;左管:下方容器的空氣 → 中間容器的空氣;中央管:中間容器的水 → 噴嘴
        { kind: "plate", shape: shape(thickLine([[0.5, BASIN.y - 0.25], [RIGHT_X, BASIN.y - 0.25], [RIGHT_X, LOW.y0 + 0.15]], 0.06)), thickness: 0.2, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape(thickLine([[LEFT_X, LOW.y1 - 0.05], [LEFT_X, MID.y1 - 0.05]], 0.06)), thickness: 0.2, at: [0, 0, 0.3] },
        // 腳
        { kind: "box", size: [0.4, 0.15, 0.6], at: [-W / 2 + 0.3, LOW.y0 - 0.15, 0] },
        { kind: "box", size: [0.4, 0.15, 0.6], at: [W / 2 - 0.3, LOW.y0 - 0.15, 0] },
      ],
    },
    // 中央的噴水管(水柱從它的頂端噴出):獨立成一個零件當目標件
    { id: "nozzle", kind: "group", pieces: [{ kind: "box", size: [0.1, NOZZLE - MID.y0 + 0.1, 0.1], at: [0, (NOZZLE + MID.y0) / 2, 0] }] },
    { id: "midWater", kind: "fill", fluid: "water", center: [0, (MID.y0 + MID.y1) / 2, 0], size: [W - 0.14, MID.y1 - MID.y0, 0.6], level: 0.9 },
    { id: "lowWater", kind: "fill", fluid: "water", center: [0, (LOW.y0 + LOW.y1) / 2, 0], size: [W - 0.14, LOW.y1 - LOW.y0, 0.6], level: 0.1 },
    { id: "basinWater", kind: "fill", fluid: "water", center: [0, BASIN.y - 0.15, 0], size: [1.2, 0.3, 0.6], level: 0.8 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.06 },
  target: "nozzle", // 只有水與空氣在動;標噴出水柱的中央管
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const f = fountain(v);
    const travel = v * 25;
    const jets = [-1, 1].map((s) => [[0, NOZZLE, 0.1], [0.05 * s, NOZZLE + f.jet, 0.1], [0.35 * s, NOZZLE + f.jet * 0.8, 0.1], [0.6 * s, BASIN.y, 0.1]]);
    return {
      parts: { midWater: { level: f.mid }, lowWater: { level: f.low } },
      flows: [
        { fluid: "water", points: [...stream([[0.5, BASIN.y - 0.25, 0.3], [RIGHT_X, BASIN.y - 0.25, 0.3], [RIGHT_X, LOW.y0 + 0.2, 0.3]], travel, { spacing: 0.2 }), ...(f.jet > 0.05 ? jets.flatMap((j) => stream(j, travel, { spacing: 0.12 })) : [])] },
        { fluid: "air", points: stream([[LEFT_X, LOW.y1 - 0.1, 0.3], [LEFT_X, MID.y1 - 0.1, 0.3], [-0.6, MID.y1 - 0.05, 0.3]], travel, { spacing: 0.25 }) },
      ],
      readouts: [{ label: "空氣被壓縮(水柱高)", value: f.pressure.toFixed(2) }],
    };
  },
};
