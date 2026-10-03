// 第 366 種:鑽床。轉動右邊的曲柄,大斜齒輪把旋轉傳給垂直的鑽桿軸;鑽桿穿過小斜齒輪、可以在其中上下滑動,
// 但以鍵條與溝槽和小斜齒輪一起轉。上方的槓桿壓住鑽桿頂端,槓桿另一端經連桿接到下方的踏板:踩下踏板,鑽桿就被往下壓。
// 主動件是曲柄;狀態按鈕切換踏板放開 / 踩下。
// 推斷:齒數(大 30、小 12)與鑽桿被壓下的距離。
import { Y } from "./kit.js";
import { bevelGear, pitchCones, meshAngle, bevelContact } from "./gears.js";
import { shape, thickLine } from "./shapes.js";

const M = 0.07;
const NB = 30;
const NS = 12;
const [coneB, coneS] = pitchCones(NB, NS);
const APEX = [0, 1.4, 0];
export const BIG = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: NB, radius: (NB * M) / 2, cone: coneB, width: 0.35 });
export const SMALL = bevelGear({ apex: APEX, axis: [0, 1, 0], teeth: NS, radius: (NS * M) / 2, cone: coneS, width: 0.3 });
const CONTACT = bevelContact(BIG, SMALL);
export const PRESS = 0.6; // 踩下踏板時鑽桿下降的距離

/** 曲柄轉 a → 鑽桿的轉角 */
export const drill = (a) => meshAngle(BIG, SMALL, a, CONTACT);

const gear = (g) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, bore: 0.06 });

export default {
  figure: 366,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // C 形架:上橫樑、右立柱、下方的軸承臂
        { kind: "plate", shape: shape(thickLine([[-1.4, 2.15], [1.45, 2.15], [1.45, -0.6], [-0.25, -0.6]], 0.22)), thickness: 0.35, at: [0, 0, -0.5] },
        { kind: "box", size: [0.6, 0.18, 0.5], at: [0, -0.6, 0] },
        { kind: "box", size: [0.6, 0.18, 0.5], at: [0, 2.05, 0] },
        // 上方槓桿的支柱
        { kind: "box", size: [0.12, 1.1, 0.12], at: [-1.4, 2.65, -0.3] },
      ],
    },
    {
      id: "bigGear",
      kind: "group",
      center: BIG.center,
      axis: BIG.axis,
      spin: BIG.radius,
      pieces: [
        gear(BIG),
        { kind: "cylinder", radius: 0.07, length: 2.2, at: [0, 0, -0.9] },
        // 右端曲柄
        { kind: "box", size: [0.1, 0.6, 0.1], at: [0, 0.3, -1.95] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [0, 0.6, -2.1], accent: true },
      ],
    },
    { id: "smallGear", kind: "group", center: SMALL.center, axis: SMALL.axis, spin: SMALL.radius, pieces: [gear(SMALL)] },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 3.6, at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.16, length: 0.35, at: [0, 0, -1.9] },
        { kind: "lathe", profile: [[0, -2.75], [0.05, -2.65], [0.1, -2.1], [0, -2.1]] },
        { kind: "box", size: [0.04, 0.04, 2.2], at: [0.08, 0, 0.6], accent: true },
      ],
    },
    { id: "lever", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "rodToTreadle", kind: "link", width: 0.07, thickness: 0.05 },
    { id: "treadle", kind: "link", width: 0.12, thickness: 0.06 },
  ],
  driver: { part: "bigGear", type: "rotation" },
  target: "spindle", // 旋轉並被壓下的鑽桿
  states: {
    initial: "up",
    options: [
      { id: "up", label: "踏板放開" },
      { id: "down", label: "踩下踏板" },
    ],
  },
  view: { direction: [0.08, 0.1, 1] },
  pose(a, state = "up") {
    const drop = state === "down" ? PRESS : 0;
    const top = [0, 2.95 - drop, 0.15];
    // 上方槓桿:支點在左上,右端壓著鑽桿頂
    const P = [-1.4, 3.2, 0.15];
    const leverLen = Math.hypot(top[0] - P[0], top[1] - P[1]);
    const dir = [(top[0] - P[0]) / leverLen, (top[1] - P[1]) / leverLen];
    const back = [P[0] - dir[0] * 0.5, P[1] - dir[1] * 0.5, 0.15];
    const pedal = [-2.0, -2.75 - drop * 0.9, 0.15];
    return {
      parts: {
        bigGear: { angle: a },
        smallGear: { angle: drill(a) },
        spindle: { angle: drill(a), position: [0, 1.2 - drop, 0] },
        lever: { from: back, to: top },
        rodToTreadle: { from: back, to: pedal },
        treadle: { from: pedal, to: [1.6, -2.45, 0.15] },
      },
      readouts: [],
    };
  },
};
