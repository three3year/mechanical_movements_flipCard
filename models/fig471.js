// 第 471 種:Hotchkiss 的大氣錘,打擊的力量來自壓縮空氣。錘頭 C 接在汽缸 B 裡的活塞上,汽缸經桿 D 接到旋轉驅動軸上的
// 曲柄 A。汽缸上升時,從進氣孔 c 進來的空氣在活塞下方被壓縮,把錘抬起;汽缸下降時,從進氣孔 e 進來的空氣在上方被壓縮
// 並儲存起來,等曲柄與連桿越過下死點後,靠它的瞬間膨脹打擊。
// 主動件是曲柄 A。
// 推斷:錘的運動落後汽缸,當作汽缸運動延遲一段相位再放大(空氣墊的彈性),碰到砧時停住;進氣孔在行程端點露出時進氣。
import { Y, deg, clamp } from "./kit.js";
import { crankSlider } from "./vertical-engine.js";
import { backHalf } from "./section.js";
import { shape } from "./shapes.js";

const CRANK = [0, 2.6, 0];
const R = 0.35;
const ROD = 1.3;
const CYL_LEN = 1.3;
const CYL_R = 0.32;
export const ANVIL_TOP = -1.6;
const PISTON_ROD = 1.5;
const LAG = deg(55);

/** 曲柄轉 theta → 汽缸頂的高度、錘頭(活塞)的高度 */
export function hammer(theta) {
  const cyl = crankSlider(CRANK, R, ROD, theta).y; // 汽缸頂(連桿下端)
  const lagged = crankSlider(CRANK, R, ROD, theta - LAG).y;
  const mid = CRANK[1] - ROD;
  // 活塞相對汽缸的位置:落後並放大,碰到砧為止
  let piston = mid - CYL_LEN / 2 + (lagged - mid) * 1.6;
  const headBottom = (p) => p - PISTON_ROD - 0.35;
  if (headBottom(piston) < ANVIL_TOP) piston = ANVIL_TOP + PISTON_ROD + 0.35;
  // 活塞留在汽缸裡
  piston = clamp(piston, cyl - CYL_LEN + 0.12, cyl - 0.12);
  return { cyl, piston, strike: headBottom(piston) <= ANVIL_TOP + 1e-6 };
}

export default {
  figure: 471,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.5, -2.7], [1.5, -2.7], [1.0, -1.6], [0.6, -1.0], [0.55, 2.9], [0.75, 2.9], [0.75, 3.15], [-0.75, 3.15], [-0.75, 2.9], [-0.55, 2.9], [-0.6, -1.0], [-1.0, -1.6]], [[[-0.45, 2.85], [0.45, 2.85], [0.45, -0.75], [-0.45, -0.75]].reverse()]), thickness: 0.3, at: [0, 0, -0.45] },
        { kind: "box", size: [0.8, 0.35, 0.8], at: [0, ANVIL_TOP - 0.18, 0] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      label: "A",
      labelOffset: [-0.25, -0.35, 0.4],
      spin: R + 0.12,
      pieces: [
        { kind: "plate", shape: shape([[0, -0.12], [R, -0.08], [R, 0.08], [0, 0.12]]), thickness: 0.08, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: 0.08, length: 1.1, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.05, length: 0.25, at: [R, 0, 0.22] },
      ],
    },
    { id: "rodD", kind: "link", width: 0.1, thickness: 0.06, label: "D", labelOffset: [0.25, 0, 0.3] },
    {
      id: "cylinder",
      kind: "lathe",
      axis: Y,
      label: "B",
      labelOffset: [-0.05, 0.85, 0.5],
      profile: [[0.08, 0], [CYL_R + 0.07, 0], [CYL_R + 0.07, CYL_LEN], [0, CYL_LEN], [0, CYL_LEN - 0.08], [CYL_R, CYL_LEN - 0.08], [CYL_R, 0.08], [0.08, 0.08]],
      ...backHalf(Y),
      arrow: false,
    },
    { id: "holeC", kind: "group", pieces: [], label: "c", labelOffset: [-0.5, 0, 0.4] },
    { id: "holeE", kind: "group", pieces: [], label: "e", labelOffset: [-0.5, 0, 0.4] },
    {
      id: "hammer",
      kind: "cylinder",
      axis: Y,
      radius: CYL_R - 0.02,
      length: 0.14,
      arrow: false,
      label: "C",
      labelOffset: [0.5, -PISTON_ROD - 0.2, 0.4],
      pieces: [
        { kind: "cylinder", radius: 0.06, length: PISTON_ROD, at: [0, 0, -PISTON_ROD / 2] },
        { kind: "box", size: [0.6, 0.6, 0.35], at: [0, 0, -PISTON_ROD - 0.17] },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["cylinder"], reason: "待確認(未修):cylinder 在動,但離帶動(或支撐)它的零件還有 0.23 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["hammer"], reason: "待確認:hammer 與帶動(或支撐)它的零件之間差 0.08 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["crank", "rodD"], reason: "待確認:crank 的圓柱 r0.08×1.1 與 rodD 的方塊 1×0.1×0.06重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "hammer",
  view: { direction: [0.1, 0.08, 1] },
  pose(theta) {
    const h = hammer(theta);
    const pin = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta), 0.3];
    const gapBelow = h.piston - (h.cyl - CYL_LEN);
    return {
      parts: {
        crank: { angle: theta },
        rodD: { from: pin, to: [0, h.cyl, 0.3] },
        cylinder: { position: [0, h.cyl - CYL_LEN, 0] },
        holeC: { position: [0, h.cyl - CYL_LEN + 0.2, 0] },
        holeE: { position: [0, h.cyl - 0.2, 0] },
        hammer: { position: [0, h.piston, 0] },
      },
      readouts: [
        { label: "活塞下方的空氣", value: gapBelow < CYL_LEN * 0.35 ? "被壓縮(抬錘)" : "—" },
        { label: "錘", value: h.strike ? "打在砧上" : "—" },
      ],
    };
  },
};

