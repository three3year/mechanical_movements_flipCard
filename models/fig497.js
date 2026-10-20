// 第 497 種:風扇鼓風機。外殼兩側有圓形開口;軸與裝在上面的扇葉旋轉時,空氣從外殼中心被吸進來,在壓力下經噴口送出。
// 主動件是扇葉的軸。
// 推斷:三片彎曲的扇葉;外殼是渦形(越往出口越寬),噴口在右下沿底部往右;扇葉與空氣逆時針轉;空氣以流體示意。
// 前側板沒畫(剖開看得到扇葉);扇葉的軸穿過背板進風口裡橫過的軸承架(原圖進風口上下兩條剖開的條與中間的軸承環),
// 再往後穿過立在底座上的軸承座(推斷:前側板沒畫,第二個軸承放在後面)。底座(推斷,原圖沒有)頂面托著外殼的最低處。
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
const BACK = -0.42; // 背板的深度
const SHAFT = { r: 0.1, z: [-1.2, 0.4] }; // 扇葉的軸:從後面的軸承座穿過背板,前端到輪轂前面
const PEDESTAL_Z = -1.0; // 後面軸承座的深度
const BEARING = { r: 0.2, len: 0.1 };

const wall = Array.from({ length: 73 }, (_, i) => {
  const t = (TURN * i) / 72;
  return polar(casing(t), TONGUE + t).slice(0, 2);
});
const end = wall[wall.length - 1];
// 噴口:沿底部往右(逆時針的空氣在底部往右走)
const OUTLET = [[end[0], end[1]], [2.4, end[1]], [2.4, end[1] + 0.55], [polar(FAN + 0.2, TONGUE)[0], end[1] + 0.55], polar(FAN + 0.2, TONGUE).slice(0, 2)];
const WALL = thickLine(wall, 0.1);
const FLOOR = Math.min(...WALL.map((p) => p[1])); // 外殼最低處(渦形壁的末端),底座頂面貼著它
const BASE_Z = [PEDESTAL_Z - 0.1, 0.5];

export default {
  figure: 497,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(WALL), thickness: 0.8 },
        { kind: "plate", shape: shape(circle(casing(TURN) + 0.1), [circle(EYE).reverse()]), thickness: 0.04, at: [0, 0, BACK] },
        // 進風口裡橫過的軸承架:上下兩條接到進風口的邊,中間的軸承環套著扇葉的軸
        ...[1, -1].map((s) => ({ kind: "box", size: [0.14, EYE - BEARING.r + 0.02, 0.04], at: [0, (s * (EYE + BEARING.r - 0.02)) / 2, BACK] })),
        { kind: "cylinder", radius: BEARING.r, inner: SHAFT.r, length: BEARING.len, at: [0, 0, BACK] },
        // 底座:頂面貼著外殼最低處,往後伸到軸承座下
        { kind: "box", size: [3.0, 0.2, BASE_Z[1] - BASE_Z[0]], at: [0.3, FLOOR - 0.1, (BASE_Z[0] + BASE_Z[1]) / 2] },
        // 後面的軸承座:從底座立起的柱,頂上一個軸承環
        { kind: "box", size: [0.2, -BEARING.r + 0.02 - FLOOR, BEARING.len], at: [0, (FLOOR - BEARING.r + 0.02) / 2, PEDESTAL_Z] },
        { kind: "cylinder", radius: BEARING.r, inner: SHAFT.r, length: BEARING.len, at: [0, 0, PEDESTAL_Z] },
      ],
    },
    // 噴口(空氣在壓力下從這裡送出):獨立成一個零件當目標件
    {
      id: "outlet",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine(OUTLET.slice(0, 3), 0.1)), thickness: 0.8 },
        { kind: "plate", shape: shape(thickLine(OUTLET.slice(2), 0.1)), thickness: 0.8 },
      ],
    },
    {
      id: "fan",
      kind: "group",
      // 轉向箭頭在扇葉外緣與殼壁之間、擺在外殼前面(原圖右上的逆時針箭頭)
      spin: FAN - 0.05,
      spinOffset: 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(0.32), [circle(0.1).reverse()]), thickness: 0.7, mark: [0.2, 0], markSize: 0.05 },
        ...[0, 1, 2].map((k) => ({ kind: "plate", shape: shape(thickLine(bladeLine(0.3, FAN, (k * TAU) / 3, deg(-35)), 0.07)), thickness: 0.7 })),
        // 扇葉的軸(和扇葉一起轉)
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.z[1] - SHAFT.z[0], at: [0, 0, (SHAFT.z[0] + SHAFT.z[1]) / 2] },
      ],
    },
  ],
  driver: { part: "fan", type: "rotation", speed: 1.2 },
  target: "outlet", // 扇葉的軸就是主動件;標空氣被送出去的噴口
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
  waivers: [
    { check: "interference", parts: ["casing", "outlet"], reason: "簡化畫法:出風口接在外殼上,接口處重疊 0.12" },
  ],
};
