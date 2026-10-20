// 第 464 種:希羅噴泉。水倒進上方的容器後,經右邊的管子降到下方的容器;中間的容器也事先裝滿水。再把更多水倒進上方的容器時,
// 封在下方與中間容器水面上方、以及左邊連通管裡的空氣被壓縮,靠它的彈力把水柱從中央的管子噴出。
// 主動件是虛擬的「進程」:從倒水開始到中間容器的水噴完。
// 照 525 px 原圖讀:上方容器是頂上的橫箱(畫滿水的橫線,右邊的立管從它往下接到底箱);中間容器是吊在橫箱下面、
// 兩根立管之間的半圓碗,碗口接在橫箱底面,碗裡的水面和橫箱底之間留一層空氣,左邊的立管(空氣)接進這層空氣;
// 下方容器是底箱;中央管從碗底往上穿過橫箱,噴口在橫箱上方。
// 推斷:噴出的水落回橫箱裡(橫箱的水位不變);水柱高度和水頭成正比——右管水柱(橫箱水面到底箱水面)扣掉碗的水面到噴口的高度。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, arcPoints, spanBox } from "./shapes.js";

export const W = 3.4; // 橫箱、底箱的寬
export const TOP = { y0: 1.1, y1: 1.7 }; // 上方容器(頂上的橫箱)
export const BOWL = { top: 1.1, rim: 0.83, r: 0.95 }; // 中間容器:半圓碗吊在一個扁箱(兩根立管之間、rim 到 top)下面,碗裡的水面在 rim,扁箱是水面上方的空氣
export const LOW = { y0: -1.9, y1: -1.25 }; // 下方容器(底箱)
export const NOZZLE = { y0: BOWL.rim - BOWL.r + 0.05, y1: 2.3, w: 0.22 }; // 中央管:從碗底到噴口
const WALL = 0.06;
const DEPTH = 0.7;
export const RIGHT_X = W / 2 - 0.4;
export const LEFT_X = -W / 2 + 0.4;
export const DOWN_PIPE = { x: RIGHT_X, y0: LOW.y0 + 0.04, y1: TOP.y0 + WALL }; // 右管:橫箱 → 底箱(管口在底箱的水面下)
export const AIR_PIPE = { x: LEFT_X, y0: LOW.y1 - 0.08, y1: BOWL.top - 0.12 }; // 左管:底箱頂的空腔 → 碗上方的空腔(管口都在水面上)
const PIPE_W = 0.14;
const TOP_LEVEL = 0.7; // 橫箱的水位(噴回來的水補著,不變)
const BOWL_BOTTOM = BOWL.rim - BOWL.r;

/** 碗裡的水面高度(mid:0–1 是碗從底到水面 rim 的裝水比例) */
export const bowlSurface = (mid) => BOWL_BOTTOM + mid * (BOWL.rim - BOWL_BOTTOM);

/** 進程 u → 中間、下方容器的水位(0–1)與噴水高度 */
export function fountain(v) {
  const u = clamp(v - Math.floor(v), 0, 1);
  const mid = 0.95 - 0.85 * u;
  const low = 0.1 + 0.7 * u;
  // 空氣的壓力由右管裡的水柱(橫箱水面到底箱水面)決定,噴高再扣掉碗的水面到噴口的高度
  const lowSurface = LOW.y0 + low * (LOW.y1 - LOW.y0);
  const topSurface = TOP.y0 + TOP_LEVEL * (TOP.y1 - TOP.y0);
  const head = topSurface - lowSurface - (NOZZLE.y1 - bowlSurface(mid));
  return { top: TOP_LEVEL, mid, low, jet: Math.max(0, head) * 0.25, pressure: topSurface - lowSurface };
}

// 箱子:四面牆(前後開著,畫成剖面);底與頂在中央管兩側各斷開,讓中央管穿過
const box = (y0, y1, gapAt) => {
  const walls = [spanBox(-W / 2, -W / 2 + WALL, y0, y1, -DEPTH / 2, DEPTH / 2), spanBox(W / 2 - WALL, W / 2, y0, y1, -DEPTH / 2, DEPTH / 2)];
  for (const [a, b] of [[y0, y0 + WALL], [y1 - WALL, y1]]) {
    if (gapAt == null) walls.push(spanBox(-W / 2, W / 2, a, b, -DEPTH / 2, DEPTH / 2));
    else walls.push(spanBox(-W / 2, -gapAt, a, b, -DEPTH / 2, DEPTH / 2), spanBox(gapAt, W / 2, a, b, -DEPTH / 2, DEPTH / 2));
  }
  return walls;
};
const GAP = NOZZLE.w / 2 + 0.04;
// 碗:半圓,碗底在中央管兩側斷開;碗口接在扁箱的底板上
const bowlArc = (a0, a1) => ({ kind: "plate", shape: shape(thickLine(arcPoints(BOWL.r - WALL / 2, a0, a1, 0, BOWL.rim), WALL)), thickness: DEPTH });
const bowlGap = Math.asin(GAP / (BOWL.r - WALL / 2));

export default {
  figure: 464,
  parts: [
    {
      id: "vessels",
      kind: "group",
      pieces: [
        ...box(TOP.y0, TOP.y1, GAP),
        ...box(LOW.y0, LOW.y1),
        bowlArc(Math.PI, 1.5 * Math.PI - bowlGap),
        bowlArc(1.5 * Math.PI + bowlGap, 2 * Math.PI),
        // 中間容器上半的扁箱:兩根立管之間、橫箱底面下方,底板在碗口兩側(碗口開進扁箱),兩側壁就在立管旁
        spanBox(LEFT_X - WALL / 2, LEFT_X + WALL / 2, BOWL.rim, BOWL.top, -DEPTH / 2, DEPTH / 2),
        spanBox(RIGHT_X - WALL / 2, RIGHT_X + WALL / 2, BOWL.rim, BOWL.top, -DEPTH / 2, DEPTH / 2),
        spanBox(LEFT_X, -BOWL.r + WALL, BOWL.rim, BOWL.rim + WALL, -DEPTH / 2, DEPTH / 2),
        spanBox(BOWL.r - WALL, RIGHT_X, BOWL.rim, BOWL.rim + WALL, -DEPTH / 2, DEPTH / 2),
        // 右管:橫箱 → 底箱;左管:底箱的空氣 → 碗上方的空氣(都穿過箱壁,畫在中層)
        { kind: "plate", shape: shape(rect(PIPE_W, DOWN_PIPE.y1 - DOWN_PIPE.y0, DOWN_PIPE.x, (DOWN_PIPE.y0 + DOWN_PIPE.y1) / 2)), thickness: 0.2 },
        { kind: "plate", shape: shape(rect(PIPE_W, AIR_PIPE.y1 - AIR_PIPE.y0, AIR_PIPE.x, (AIR_PIPE.y0 + AIR_PIPE.y1) / 2)), thickness: 0.2 },
        // 腳:接在底箱底面
        spanBox(-W / 2 + 0.1, -W / 2 + 0.5, LOW.y0 - 0.15, LOW.y0, -0.3, 0.3),
        spanBox(W / 2 - 0.5, W / 2 - 0.1, LOW.y0 - 0.15, LOW.y0, -0.3, 0.3),
      ],
    },
    // 中央的噴水管(水柱從它尖頂的噴口噴出):獨立成一個零件當目標件;從碗底穿過橫箱的底與頂
    { id: "nozzle", kind: "plate", shape: shape([[-NOZZLE.w / 2, NOZZLE.y0], [NOZZLE.w / 2, NOZZLE.y0], [NOZZLE.w / 2, NOZZLE.y1 - 0.2], [0, NOZZLE.y1], [-NOZZLE.w / 2, NOZZLE.y1 - 0.2]]), thickness: NOZZLE.w },
    { id: "topWater", kind: "fill", fluid: "water", center: [0, (TOP.y0 + TOP.y1) / 2, 0], size: [W - 2 * WALL, TOP.y1 - TOP.y0, 0.6], level: TOP_LEVEL },
    // 碗裡的水:上寬下窄兩層填色,都在半圓裡
    { id: "bowlUpper", kind: "fill", fluid: "water", center: [0, (0.38 + BOWL.rim) / 2, 0], size: [1.5, BOWL.rim - 0.38, 0.5], level: 1 },
    { id: "bowlLower", kind: "fill", fluid: "water", center: [0, (BOWL_BOTTOM + 0.1 + 0.38) / 2, 0], size: [0.6, 0.38 - BOWL_BOTTOM - 0.1, 0.5], level: 1 },
    { id: "lowWater", kind: "fill", fluid: "water", center: [0, (LOW.y0 + LOW.y1) / 2, 0], size: [W - 2 * WALL, LOW.y1 - LOW.y0, 0.6], level: 0.1 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.06 },
  target: "nozzle", // 只有水與空氣在動;標噴出水柱的中央管
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const f = fountain(v);
    const travel = v * 25;
    const surface = bowlSurface(f.mid);
    const jets = [-1, 1].map((s) => [[0, NOZZLE.y1, 0.2], [0.05 * s, NOZZLE.y1 + f.jet, 0.2], [0.4 * s, NOZZLE.y1 + f.jet * 0.8, 0.2], [0.7 * s, TOP.y1 - 0.05, 0.2]]);
    return {
      parts: {
        bowlUpper: { level: clamp((surface - 0.38) / (BOWL.rim - 0.38), 0, 1) },
        bowlLower: { level: clamp((surface - BOWL_BOTTOM - 0.1) / (0.38 - BOWL_BOTTOM - 0.1), 0, 1) },
        lowWater: { level: f.low },
      },
      flows: [
        { fluid: "water", points: [...stream([[DOWN_PIPE.x, TOP.y0 + 0.1, 0.15], [DOWN_PIPE.x, DOWN_PIPE.y0 + 0.05, 0.15]], travel, { spacing: 0.2 }), ...(f.jet > 0.05 ? jets.flatMap((j) => stream(j, travel, { spacing: 0.12 })) : [])] },
        { fluid: "air", points: stream([[AIR_PIPE.x, LOW.y1 - 0.05, 0.15], [AIR_PIPE.x, BOWL.top - 0.12, 0.15], [-0.6, BOWL.top - 0.12, 0.3]], travel, { spacing: 0.25 }) },
      ],
      readouts: [{ label: "空氣被壓縮(水柱高)", value: f.pressure.toFixed(2) }],
    };
  },
};
