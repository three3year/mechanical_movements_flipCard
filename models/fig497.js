// 第 497 種:風扇鼓風機。外殼兩側有圓形開口;軸與裝在上面的扇葉旋轉時,空氣從外殼中心被吸進來,在壓力下經噴口送出。
// 主動件是扇葉的軸。
// 推斷:三片彎曲的扇葉;外殼是渦形(越往出口越寬),噴口在右下沿底部往右;扇葉與空氣逆時針轉;空氣以流體示意。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";
import { bladeLine } from "./turbine.js";

const FAN = 1.15;
const EYE = 0.45; // 中央的進風口
const TONGUE = deg(-70); // 渦形的起點(在噴口上方)
const TURN = deg(325);
/** 渦形外殼的半徑:從起點逆時針轉 t 後 */
export const casing = (t) => FAN + 0.15 + 0.5 * (t / TURN);

const wall = Array.from({ length: 73 }, (_, i) => {
  const t = (TURN * i) / 72;
  return polar(casing(t), TONGUE + t).slice(0, 2);
});
const end = wall[wall.length - 1];
// 噴口:沿底部往右(逆時針的空氣在底部往右走)
const OUTLET = [[end[0], end[1]], [2.4, end[1]], [2.4, end[1] + 0.55], [polar(FAN + 0.2, TONGUE)[0], end[1] + 0.55], polar(FAN + 0.2, TONGUE).slice(0, 2)];

export default {
  figure: 497,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([...wall, ...OUTLET.slice(1, 3)], 0.1)), thickness: 0.8 },
        { kind: "plate", shape: shape(thickLine(OUTLET.slice(2), 0.1)), thickness: 0.8 },
        { kind: "plate", shape: shape(circle(casing(TURN) + 0.1), [circle(EYE).reverse()]), thickness: 0.04, at: [0, 0, -0.42] },
        { kind: "box", size: [3.0, 0.2, 1.0], at: [0.3, -2.1, 0] },
      ],
    },
    {
      id: "fan",
      kind: "group",
      spin: FAN + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(0.32), [circle(0.1).reverse()]), thickness: 0.7, mark: [0.2, 0], markSize: 0.05 },
        ...[0, 1, 2].map((k) => ({ kind: "plate", shape: shape(thickLine(bladeLine(0.3, FAN, (k * TAU) / 3, deg(-35)), 0.07)), thickness: 0.7 })),
        { kind: "cylinder", radius: 0.1, length: 1.4 },
      ],
    },
  ],
  driver: { part: "fan", type: "rotation", speed: 1.2 },
  view: { direction: [0.15, 0.1, 1] },
  pose(theta) {
    const travel = theta * 0.6;
    // 空氣:從中央吸進來,被扇葉甩到外殼,沿渦形(逆時針)繞到噴口送出
    const paths = [0, 1, 2].map((k) => {
      const a0 = TONGUE + 0.3 + (k * TAU) / 3;
      const t0 = a0 + 0.9 - TONGUE;
      return [polar(0.2, a0, 0.45), polar(EYE, a0 + 0.3, 0.45), polar(FAN + 0.25, a0 + 0.9, 0.45), ...Array.from({ length: 10 }, (_, i) => {
        const t = Math.min(t0 + i * 0.35, TURN);
        return polar(casing(t) - 0.2, TONGUE + t, 0.45);
      }), [2.5, end[1] + 0.27, 0.45]];
    });
    return {
      parts: { fan: { angle: theta } },
      flows: [{ fluid: "air", points: paths.flatMap((p) => stream(p, travel, { spacing: 0.3 })) }],
      readouts: [],
    };
  },
};
