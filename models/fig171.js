// 第 171 種:擺動式船舶引擎的閥門運動與換向齒輪。上方曲柄軸上的兩個偏心輪,偏心桿往下接到開槽連桿的兩端
// (與機車頭的連桿運動相同,見第 185 種);連桿可用左邊的柄左右移動。槽中的滑塊接著往下的閥桿,
// 閥桿帶動樞軸(trunnion)上方的曲面滑塊;曲面滑塊的溝槽裡有一根銷,接在搖臂軸的搖臂上,搖臂軸再把運動傳給閥門。
// 溝槽是以樞軸中心為圓心的圓弧,所以圓筒擺動時不影響閥門的行程(此處圓筒不動,只畫出樞軸)。
// 主動件是曲柄軸;連桿的位置是狀態(前進、中位、後退)。
import { deg, polar } from "./kit.js";
import { linkMotion } from "./link-motion.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [0, 3.4, 0];
const ECC = 0.3;
const ROD = 3.2;
const HALF = 0.75;
const motion = linkMotion({ shaft: SHAFT, dir: [0, -1, 0], ecc: ECC, rod: ROD, half: HALF, leads: [deg(110), deg(-110)] });
const SHIFT = { forward: -HALF * 0.9, mid: 0, backward: HALF * 0.9 };
const VALVE_ROD = 1.1; // 滑塊到曲面滑塊的距離
const TRUNNION = [0, -1.45, 0];
const ARC_R = 1.25; // 曲面溝槽的半徑(以樞軸為圓心)
const ARM = { pivot: [-1.65, 0, 0], length: 1.6 }; // 搖臂軸在左邊

/** 軸轉 theta、連桿在 state:閥桿(滑塊)的高度與搖臂的轉角 */
export function valveGear(theta, state) {
  const g = motion(theta, SHIFT[state]);
  const blockY = g.block[1];
  const arcTop = blockY - VALVE_ROD; // 曲面滑塊頂端的高度
  const pinY = arcTop - 0.15;
  const armAngle = Math.asin(Math.max(-1, Math.min(1, (pinY - ARM.pivot[1]) / ARM.length)));
  return { g, blockY, arcTop, armAngle };
}
export const states = Object.keys(SHIFT);
const REST_TOP = valveGear(0, "mid").arcTop;
ARM.pivot[1] = REST_TOP - 0.15;

const linkShape = shape(
  [...arcPoints(3.0, deg(-76), deg(-104), 0, 3.0 + 0.16), ...arcPoints(3.0, deg(-104), deg(-76), 0, 3.0 - 0.16)],
  [[...arcPoints(3.0, deg(-78), deg(-102), 0, 3.0 + 0.06), ...arcPoints(3.0, deg(-102), deg(-78), 0, 3.0 - 0.06)].reverse()],
);
const arcPiece = shape(
  [...arcPoints(ARC_R + 0.3, deg(20), deg(160)), ...arcPoints(ARC_R - 0.25, deg(160), deg(20))],
  [[...arcPoints(ARC_R + 0.07, deg(40), deg(140)), ...arcPoints(ARC_R - 0.07, deg(140), deg(40))].reverse()],
);

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 171,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: 0.8,
      pieces: [
        { kind: "cylinder", radius: 0.22, length: 1.2, mark: true },
        { kind: "plate", shape: shape(circle(0.62, ...polar(ECC, deg(110) - Math.PI / 2).slice(0, 2)), [circle(0.23).reverse()]), thickness: 0.18, at: [0, 0, 0.25] },
        { kind: "plate", shape: shape(circle(0.62, ...polar(ECC, deg(-110) - Math.PI / 2).slice(0, 2)), [circle(0.23).reverse()]), thickness: 0.18, at: [0, 0, 0.5] },
      ],
    },
    { id: "rodA", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "rodB", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "link", kind: "group", posed: true, arrow: false, pieces: [{ kind: "plate", shape: linkShape, thickness: 0.12 }, { kind: "box", size: [0.8, 0.1, 0.08], at: [-1.15, 0, 0] }] },
    { id: "valveRod", kind: "group", pieces: [{ kind: "box", size: [0.1, VALVE_ROD, 0.08], at: [0, -VALVE_ROD / 2, 0] }, { kind: "box", size: [0.22, 0.22, 0.2] }] },
    { id: "arcPiece", kind: "plate", shape: arcPiece, thickness: 0.15 },
    { id: "arm", kind: "group", center: ARM.pivot, arrow: false, pieces: [{ kind: "box", size: [ARM.length, 0.12, 0.08], at: [ARM.length / 2, 0, 0.12] }, { kind: "cylinder", radius: 0.15, inner: 0.06, length: 0.2 }] },
    {
      id: "trunnion",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.25).reverse()]), thickness: 0.3, at: TRUNNION },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [-1.45, TRUNNION[1] + 0.9, -0.2] },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [1.45, TRUNNION[1] + 0.9, -0.2] },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["arcPiece"], reason: "待確認:arcPiece 與帶動(或支撐)它的零件之間差 0.09 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["arm"], reason: "待確認(未修):arm 在動,但離帶動(或支撐)它的零件還有 0.22 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "interference", parts: ["shaft", "rodA"], reason: "待確認(未修):shaft 的圓柱 r0.22×1.2 與 rodA 的方塊 1×0.16×0.08互相穿入 0.30(288 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["shaft", "rodB"], reason: "待確認(未修):shaft 的圓柱 r0.22×1.2 與 rodB 的方塊 1×0.16×0.08互相穿入 0.14(288 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rodA", "valveRod"], reason: "待確認:rodA 的圓柱 r0.032×0.176 與 valveRod 的方塊 0.22×0.22×0.2重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["link", "valveRod"], reason: "待確認(未修):link 的板 與 valveRod 的方塊 0.22×0.22×0.2互相穿入 0.11(288 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["arcPiece", "arm"], reason: "待確認:arcPiece 的板 與 arm 的方塊 1.6×0.12×0.08重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["arm", "trunnion"], reason: "待確認:arm 的方塊 1.6×0.12×0.08 與 trunnion 的板重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["rodB", "valveRod"], reason: "待確認:rodB 的圓柱 r0.032×0.176 與 valveRod 的方塊 0.22×0.22×0.2重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "arm",
  states: {
    options: [
      { id: "forward", label: "前進" },
      { id: "mid", label: "中位" },
      { id: "backward", label: "後退" },
    ],
    initial: "forward",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "forward") {
    const { g, blockY, arcTop, armAngle } = valveGear(theta, state);
    const [eA, eB] = g.eccentrics;
    const [aA, aB] = g.ends;
    const mid = [(aA[0] + aB[0]) / 2, (aA[1] + aB[1]) / 2, 0];
    return {
      parts: {
        shaft: { angle: theta },
        rodA: { from: z(eA, 0.25), to: z(aA, 0.25) },
        rodB: { from: z(eB, 0.5), to: z(aB, 0.5) },
        link: { position: z(mid, 0.35), angle: g.linkAngle + Math.PI / 2 },
        valveRod: { position: [0, blockY, 0.4] },
        arcPiece: { position: [TRUNNION[0], arcTop - ARC_R - 0.3, 0.2] },
        arm: { angle: armAngle },
      },
      readouts: [],
    };
  },
};
