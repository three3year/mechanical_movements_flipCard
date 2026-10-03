// 第 441 種:波斯水車,東方國家用於灌溉。有一根空心軸與彎曲的浮板,浮板末端掛著水斗(水桶)。輪的一部分浸在水流裡,
// 水流推浮板的凸面使輪轉動;每片浮板每轉一圈舀起一些水,沿浮板導進空心軸;同時一個個水桶把滿桶的水帶到高處,
// 碰到裝在方便處的固定銷而傾斜,把水倒出。
// 主動件是虛擬的「進程」:水流已帶著輪轉了幾圈。原圖箭頭:左側往下(逆時針)。
// 推斷:水桶掛在銷上、始終朝下垂,只在頂端附近被固定銷撥斜倒水;浮板舀的水沿浮板流進空心軸,從軸的側面流出。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream, ramp } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

export const RIM = 2.0;
const HUB = 0.45;
const FLOATS = 8;
const SWEEP = deg(55); // 浮板從軸到外端轉過的角度(彎曲)
export const RIVER = -1.25; // 水面
export const PIN = deg(100); // 固定銷的位置(水桶在這裡被撥斜)
const SPEED = TAU * 1.6;

// 浮板:從軸往外彎曲到外緣(外端落後軸端,逆時針轉時凸面朝下游)
const floatLine = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return polar(HUB + (RIM - HUB) * t, -SWEEP * t * t).slice(0, 2);
});

/** 水桶掛在輪上角度 a 處 → 傾斜角與存量:在最低點浸水裝滿,一路滿著上升,到固定銷處被撥斜倒空 */
export function bucket(a) {
  const from = (wrap(a + Math.PI / 2) * 180) / Math.PI; // 從最低點逆時針轉過的角度(度)
  const pin = (wrap(PIN + Math.PI / 2) * 180) / Math.PI;
  const level = from < 25 ? from / 25 : from < pin - 5 ? 1 : from < pin + 10 ? (pin + 10 - from) / 15 : 0;
  return { tilt: deg(110) * ramp(from, pin - 15, pin, pin + 8, pin + 30), level };
}

export default {
  figure: 441,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [0, 0, 0],
      spin: RIM + 0.15,
      pieces: [
        { kind: "plate", shape: shape(circle(RIM + 0.04), [circle(RIM - 0.04).reverse()]), thickness: 0.06, at: [0, 0, -0.2] },
        ...Array.from({ length: FLOATS }, (_, i) => ({ kind: "plate", shape: shape(thickLine(floatLine, 0.06)), thickness: 0.45, angle: (i * TAU) / FLOATS })),
        // 空心軸(有放射狀的開口)
        { kind: "plate", shape: shape(circle(HUB), [circle(HUB - 0.12).reverse()]), thickness: 0.5, mark: [0, HUB - 0.06], markSize: 0.05 },
        ...Array.from({ length: 12 }, (_, i) => ({ kind: "box", size: [0.12, 0.03, 0.5], at: polar(HUB - 0.18, (i * TAU) / 12), angle: (i * TAU) / 12 })),
      ],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.4, 0.2, 1.2], at: [0, -2.45, 0] },
        // 固定銷與接水槽
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [...polar(RIM + 0.55, PIN).slice(0, 2), 0.3], accent: true },
        { kind: "box", size: [1.3, 0.12, 0.8], at: [-0.9, RIM + 0.85, 0.75] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (RIVER - 2.35) / 2, 0], size: [6.2, RIVER + 2.35, 1.1], level: 1 },
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `bucket${i}`, kind: "group", arrow: false, pieces: [
      { kind: "box", size: [0.04, 0.3, 0.04], at: [0, -0.15, 0.3] },
      { kind: "plate", shape: shape([[-0.18, -0.3], [0.18, -0.3], [0.15, -0.65], [-0.15, -0.65]], [[[-0.13, -0.33], [-0.11, -0.61], [0.11, -0.61], [0.13, -0.33]]]), thickness: 0.3, at: [0, 0, 0.3] },
    ] })),
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.24, 0.26, 0.24] })),
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  target: "wheel",
  view: { direction: [0.08, 0.06, 1] },
  pose(progress) {
    const wheel = TAU * progress; // 逆時針
    const parts = { wheel: { angle: wheel } };
    for (let i = 0; i < FLOATS; i++) {
      const a = wheel + (i * TAU) / FLOATS - SWEEP;
      const pin = polar(RIM, a, 0);
      const b = bucket(a);
      parts[`bucket${i}`] = { position: pin, angle: b.tilt };
      // 桶裡的水(隨桶傾斜)
      parts[`water${i}`] = { position: [pin[0] + 0.47 * Math.sin(b.tilt), pin[1] - 0.47 * Math.cos(b.tilt), 0.3], angle: b.tilt, level: b.level };
    }
    const travel = progress * SPEED;
    // 水:河水往右流;右側上升的浮板把舀起的水導向軸;頂端的水桶倒進水槽
    const riverPath = [[-3.1, RIVER - 0.4, 0.4], [3.1, RIVER - 0.4, 0.4]];
    const inward = [0, 1, 2].map((k) => {
      const a = deg(-40) + k * deg(35);
      return [polar(RIM - 0.3, a, 0.3), polar(HUB + 0.1, a + deg(40), 0.3)];
    });
    const pour = [polar(RIM + 0.35, PIN - deg(8), 0.6), [-0.5, RIM + 0.95, 0.7], [-1.5, RIM + 0.95, 0.7]];
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(riverPath, travel, { spacing: 0.3 }), ...inward.flatMap((p) => stream(p, travel, { spacing: 0.2 })), ...stream(pour, travel, { spacing: 0.18 })] }],
      readouts: [],
    };
  },
};
