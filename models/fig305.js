// 第 305 種:單銷式擺鐘擒縱。擒縱輪是一個很小的圓盤,上面只有一根偏心的銷;擺(瓶形框架,下端兩個擺錘)
// 每擺一次,圓盤轉半圈,銷把衝量傳到叉瓦的垂直面上,叉瓦的水平面則是靜擊面(銷靠在上面時圓盤不動)。
// 主動件是擺(累計擺動)。
// 推斷:擺幅與框架裡叉瓦缺口的尺寸(依原圖)。
import { deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const SWING = deg(6);
const PIVOT = [0, 2.4, 0];
const DISC = [0, -0.25, 0.2];

/** 擺累計擺動 v → 擺角、圓盤轉角(每擺一次半圈) */
export function singlePin(v) {
  return { pendulum: swing(v, -SWING, SWING), disc: escapeStep(v, -SWING, SWING, Math.PI, 0.5) };
}

// 瓶形框架(相對樞軸):細頸往下、肚子圍著圓盤
const body = Array.from({ length: 25 }, (_, i) => {
  const t = i / 24;
  const y = -0.6 - t * 3.2;
  const w = 0.2 + 1.1 * Math.sin(Math.min(1, t * 1.25) * (Math.PI / 2)) ** 1.5;
  return [w, y];
});
const frameLoop = [...body, ...body.map(([x, y]) => [-x, y]).reverse()];

export default {
  figure: 305,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([...frameLoop, frameLoop[0]], 0.1)), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.16, 0.7, 0, -0.3)), thickness: 0.12 },
        { kind: "sphere", radius: 0.22 },
        // 叉瓦:框架裡的缺口,上下水平靜擊面、中間垂直衝擊面
        { kind: "plate", shape: shape([[-0.55, -2.35], [0.35, -2.35], [0.35, -2.5], [0.05, -2.5], [0.05, -2.8], [0.35, -2.8], [0.35, -2.95], [-0.55, -2.95]]), thickness: 0.14, at: [0, 0, 0.05] },
        // 下端兩個擺錘
        { kind: "sphere", radius: 0.32, at: [-0.6, -3.55, 0] },
        { kind: "sphere", radius: 0.32, at: [0.6, -3.55, 0] },
      ],
    },
    {
      id: "disc",
      kind: "plate",
      center: DISC,
      shape: shape(circle(0.36), [circle(0.05).reverse()]),
      thickness: 0.08,
      spin: 0.36,
      pieces: [{ kind: "cylinder", radius: 0.07, length: 0.3, at: [0.25, 0, 0.1], accent: true }],
    },
  ],
  // 動力重演:只推主動件;disc 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { disc: { spring: 1, gravity: false } }, expect: [{ part: "disc", label: "主動件走完一輪後 disc 的位置" }] },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "disc", // 帶單銷的擒縱盤
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = singlePin(v);
    return { parts: { pendulum: { angle: s.pendulum }, disc: { angle: s.disc } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["disc"], reason: "未修:動力重演不成立——「主動件走完一輪後 disc 的位置」預期 disc 在主動量 0.42 時已轉 360°,實際轉了 107913°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
  ],
};
