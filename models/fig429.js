// 第 429 種:Holly 的專利雙橢圓旋轉式引擎。兩個以齒互相咬合的橢圓活塞,被進到兩者之間的蒸汽推動,朝相反方向旋轉。
// (以上這些旋轉式引擎都可以改作泵用。)
// 主動件是左邊的橢圓活塞。
// 照原圖與 507movements 的動畫(維護者 2026-10-20 決定):兩個活塞一樣大,各繞自己的中心轉(軸在卵形的中心,不在焦點);
// 節曲線是二階卵形 r = p / (1 − e·cos 2φ),兩個一樣的二階卵形在中心距 2p/(1 − e²) 上互為共軛,節曲線始終在兩軸連線上相切
// (純滾動),轉速比一圈變兩次。輪齒沿節曲線等弧長排列。每個活塞長軸的兩端各有一塊密封條(原圖的小方塊),外緣貼著外殼;
// 外殼是以兩軸為圓心、半徑 = 密封條外緣的兩段弧,在上下的腰部開口接進汽管(上)與排汽管(下)。
// 蒸汽從上方進來,被長軸端的密封條沿兩側的外殼壁帶到下方排出(左輪逆時針、右輪順時針);密封條經過咬合處時落進對方
// 短軸端的齒槽(那兩個齒槽做得比別的深,推斷:否則密封條會撞到對方的齒根)。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, arcPoints, thickLine } from "./shapes.js";
import { conjugate, samplePitch, arcAt } from "./noncircular.js";
import { placeOutline, pointInPolygon } from "./contact.js";

export const DIST = 2.0; // 兩軸距離
export const E = 0.1; // 卵形的離心率(長短軸之比 (1+e)/(1−e) = 1.22,照原圖)
const P = (DIST * (1 - E * E)) / 2;
export const LEFT = [-DIST / 2, 0, 0];
export const RIGHT = [DIST / 2, 0, 0];
const TEETH = 14; // 原圖每輪約 14 齒;TEETH ≡ 2 (mod 4) 時長軸兩端是齒、短軸兩端是齒槽
const ADDENDUM = 0.1;
const DEDENDUM = 0.1;
export const STRIP = 0.06; // 密封條伸出齒頂多少
const DEEP = STRIP + 0.02; // 短軸端的齒槽多深多少(讓對方的密封條通過)
const STRIP_HALF = 0.045; // 密封條的半寬(弧度,從軸心量)

/** 左輪的節曲線:局部角 phi(從長軸量起)的半徑;二階卵形 */
export const radius = (phi) => P / (1 - E * Math.cos(2 * phi));
/** 右輪的節曲線:和左輪一樣的卵形,長軸在局部 ±π/2(短軸朝局部 0 與 π,接觸點在 π) */
export const radiusRight = (phi) => radius(phi + Math.PI / 2);
export const A = radius(0); // 半長軸
export const B = radius(Math.PI / 2); // 半短軸
export const CASE = A + ADDENDUM + STRIP; // 外殼內壁的半徑(以軸為圓心)
export const WAIST = Math.sqrt(CASE * CASE - (DIST / 2) ** 2); // 兩段弧在腰部相交處離軸連線的距離

const pair = conjugate(radius, { turns: 1, contact: 0 });

/** 左輪轉 theta(長軸的世界角)→ 右輪的轉角(順時針為負)與左輪朝接觸點的半徑 */
export function partner(theta) {
  return { angle: pair.driven(theta), r1: radius(-theta) };
}

/**
 * 帶齒與密封條的輪廓(局部座標):齒沿節曲線等弧長排列,齒 0 的中心在弧長 start;
 * longAxis 是長軸的局部角(密封條在長軸兩端、短軸端的齒槽加深)
 */
function toothed(r, { start, longAxis }) {
  const n = 1440;
  const { pts, s, length } = samplePitch(r, n);
  const pitch = length / TEETH;
  return pts.map((p, i) => {
    const a = (i / n) * TAU;
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    let nx = next[1] - prev[1];
    let ny = -(next[0] - prev[0]);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const u = (s[i] - start) / pitch;
    const c = Math.abs(u - Math.round(u)); // 0 為齒中心,0.5 為齒槽中心
    const toLong = Math.abs(Math.atan2(Math.sin(a - longAxis), Math.cos(a - longAxis))); // 離長軸方向(0 或 π)的角度
    const onLong = Math.min(toLong, Math.PI - toLong) < STRIP_HALF; // 長軸兩端:密封條
    const onShort = Math.abs(toLong - Math.PI / 2) < 0.2; // 短軸兩端:加深的齒槽
    if (onLong) {
      const R = CASE - 0.002;
      return [R * Math.cos(a), R * Math.sin(a)];
    }
    let h;
    if (c < 0.14) h = ADDENDUM;
    else if (c < 0.27) h = ADDENDUM - ((ADDENDUM + DEDENDUM) * (c - 0.14)) / 0.13;
    else h = -DEDENDUM - (onShort ? DEEP : 0);
    return [p[0] + nx * h, p[1] + ny * h];
  });
}

const pitch = samplePitch(radius).length / TEETH;
const OUTLINES = {
  left: toothed(radius, { start: 0, longAxis: 0 }), // 齒 0 在長軸端(局部 0),接觸點(主動量 0)在齒上
  right: toothed(radiusRight, { start: arcAt(radiusRight, Math.PI) - pitch / 2, longAxis: Math.PI / 2 }), // 接觸點(局部 π)在齒槽中心
};
/** 轉子的輪廓(含密封條;局部座標) */
export const rotorOutline = (side) => OUTLINES[side];

// 外殼:兩段以兩軸為圓心的弧,上下腰部各開一個寬 2·PORT 的口接汽管;開口把殼分成左右兩半(靠後蓋連成一件)
const PORT = 0.2;
const SHELL = CASE + 0.2; // 外殼外緣的半徑
const ao = Math.acos((DIST / 2 - PORT) / SHELL);
const ai = Math.acos((DIST / 2 - PORT) / CASE);
const shellLeft = [...arcPoints(SHELL, ao, TAU - ao, LEFT[0], 0), ...arcPoints(CASE, TAU - ai, ai, LEFT[0], 0)];
const shellRight = [...arcPoints(SHELL, -(Math.PI - ao), Math.PI - ao, RIGHT[0], 0), ...arcPoints(CASE, Math.PI - ai, -(Math.PI - ai), RIGHT[0], 0)];
/** 外殼的左右兩半(世界座標的多邊形) */
export const shells = [shellLeft, shellRight];
const ac = Math.acos(DIST / 2 / SHELL);
const cover = [...arcPoints(SHELL, ac, TAU - ac, LEFT[0], 0), ...arcPoints(SHELL, -(Math.PI - ac), Math.PI - ac, RIGHT[0], 0)];
const portTop = Math.sqrt(SHELL * SHELL - (DIST / 2 - PORT) ** 2); // 外殼外緣在開口兩側的高度
const PIPE = CASE + 0.95;
const pipeWalls = [1, -1].flatMap((sy) => [-1, 1].map((sx) => [[sx * (PORT + 0.03), sy * (portTop - 0.06)], [sx * (PORT + 0.03), sy * PIPE]]));

// 蒸汽的路徑:從上方進來,沿左輪外側(在轉子與外殼之間的月牙形空間裡,左輪逆時針帶著走)繞到下方排出;右邊對稱
const RM = (CASE + B + ADDENDUM) / 2;
const am = Math.acos(DIST / 2 / RM);
const flowLeft = [[0, PIPE, 0.3], [0, WAIST + 0.1, 0.3], ...arcPoints(RM, am, TAU - am, LEFT[0], 0).map(([x, y]) => [x, y, 0.3]), [0, -WAIST - 0.1, 0.3], [0, -PIPE, 0.3]];
const flowRight = flowLeft.map(([x, y, z]) => [-x, y, z]);

export default {
  figure: 429,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(shellLeft), thickness: 0.6 },
        { kind: "plate", shape: shape(shellRight), thickness: 0.6 },
        { kind: "plate", shape: shape(cover), thickness: 0.04, at: [0, 0, -0.32] }, // 後蓋
        ...pipeWalls.map((line) => ({ kind: "plate", shape: shape(thickLine(line, 0.06)), thickness: 0.6 })),
      ],
    },
    {
      id: "left",
      kind: "group",
      center: LEFT,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(OUTLINES.left, [circle(0.1).reverse()]), thickness: 0.5, mark: [0.45, 0], markSize: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
    {
      id: "right",
      kind: "group",
      center: RIGHT,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(OUTLINES.right, [circle(0.1).reverse()]), thickness: 0.5, mark: [0, 0.45], markSize: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
  ],
  driver: { part: "left", type: "rotation", speed: 0.5 },
  target: "right",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const q = partner(theta);
    // 蒸汽的點只在轉子和外殼之間:被轉子佔住的位置不畫(長軸端掃過時把蒸汽推走)
    const L = placeOutline(OUTLINES.left, LEFT, theta);
    const R = placeOutline(OUTLINES.right, RIGHT, q.angle);
    const free = (p) => !pointInPolygon(p, L) && !pointInPolygon(p, R);
    const dots = [...stream(flowLeft, theta * RM, { spacing: 0.2 }), ...stream(flowRight, theta * RM, { spacing: 0.2 })].filter(free);
    return {
      parts: { left: { angle: theta }, right: { angle: q.angle } },
      flows: [{ fluid: "steam", points: dots }],
      readouts: [{ label: "右輪 / 左輪 轉速比", value: (q.r1 / (DIST - q.r1)).toFixed(2) }],
    };
  },
};
