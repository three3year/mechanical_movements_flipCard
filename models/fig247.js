// 第 247 種:釋放測深錘的方式。測深錘(剖面)套在桿上,由桿下端的卡榫從下方托住;桿底伸出一根可以滑動的
// 頂桿。頂桿撞到海底時被推得相對於桿往上,把卡榫從錘的下方抽開,錘便脫落,桿不帶錘被拉上來。
// 主動件是虛擬的「進程」:放下 → 頂桿觸底、被推上 → 錘脫落 → 收回桿;每一輪換一個新錘。
// 推斷:卡榫與頂桿的連動方式(原圖只畫剖面);各階段所佔的進程。
import { Y, clamp, smooth } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const SEA = -2.5; // 海底
const TOP = 0.7; // 錘心起始高度
const BALL = 1.0;
const HOLE = 0.22;
const FOOT = -2.05; // 頂桿伸出時,腳底相對錘心的高度
export const PUSH = 0.32; // 頂桿被推上的行程
const K = 1.0; // 頂桿每推上一單位,卡榫轉的角度
const CATCH = [0.0, -0.52]; // 卡榫樞軸(相對錘心,在桿上)
const CONTACT = SEA - FOOT; // 腳底碰到海底時的錘心高度
const REST = SEA + BALL; // 錘落在海底時的錘心高度
const P = { touch: 0.33, pushed: 0.43, fallen: 0.5, lift: 0.58, back: 0.9, gone: 0.94 };

/** 進程 p → 桿(錘心原位)的高度、頂桿被推上的量、卡榫轉角、錘心高度與錘是否還在 */
export function sounding(p) {
  const t = ((p % 1) + 1) % 1;
  let rod;
  if (t < P.touch) rod = TOP + (CONTACT - TOP) * (t / P.touch);
  else if (t < P.pushed) rod = CONTACT - PUSH * ((t - P.touch) / (P.pushed - P.touch));
  else if (t < P.lift) rod = CONTACT - PUSH;
  else if (t < P.back) rod = CONTACT - PUSH + (TOP - CONTACT + PUSH) * smooth((t - P.lift) / (P.back - P.lift));
  else rod = TOP;
  const push = clamp(SEA - (rod + FOOT), 0, PUSH);
  let weight = rod;
  if (t >= P.pushed) weight = CONTACT - PUSH + (REST - CONTACT + PUSH) * Math.min(1, ((t - P.pushed) / (P.fallen - P.pushed)) ** 2);
  return { rod, push, catchAngle: -K * push, weight, attached: t < P.pushed, shown: t < P.gone };
}
export const geometry = { SEA, BALL, REST, FOOT };

const ballProfile = [
  [HOLE, -Math.sqrt(BALL * BALL - HOLE * HOLE)],
  ...Array.from({ length: 19 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 18) * Math.PI;
    return [Math.max(HOLE, BALL * Math.cos(a)), BALL * Math.sin(a)];
  }).slice(1, -1),
  [HOLE, Math.sqrt(BALL * BALL - HOLE * HOLE)],
];

export default {
  figure: 247,
  parts: [
    { id: "seabed", kind: "box", center: [0, SEA - 0.15, 0], size: [3.6, 0.3, 1.6] },
    { id: "rod", kind: "box", size: [0.3, 3.4, 0.3] },
    { id: "weight", kind: "lathe", axis: Y, profile: ballProfile, ...backHalf(Y) },
    { id: "catch", kind: "plate", shape: shape(thickLine([[0, 0], [0.14, -0.3], [0.2, -0.48]], 0.09), [circle(0.03).reverse()]), thickness: 0.12, arrow: false,
      pieces: [{ kind: "plate", shape: shape(rect(0.24, 0.08, 0.22, -0.5)), thickness: 0.12 }] },
    { id: "plunger", kind: "group", pieces: [{ kind: "box", size: [0.12, 1.3, 0.12], at: [0, -0.65, 0] }, { kind: "box", size: [0.36, 0.12, 0.36], at: [0, -1.3, 0] }] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },
  target: "weight", // 被釋放的測深錘
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sounding(p);
    return {
      parts: {
        rod: { position: [0, s.rod + 0.6, 0] },
        weight: { position: [0, s.weight, 0], visible: s.shown },
        catch: { position: [CATCH[0], s.rod + CATCH[1], 0.1], angle: s.catchAngle },
        plunger: { position: [-0.05, s.rod - 0.75 + s.push, 0.1] },
      },
      readouts: [],
    };
  },
};
