// 第 75 種:桿 C 的往復直線運動,透過振動桿 D 末端的棘爪 B,將間歇的旋轉運動傳遞給輪 A。
// D 套在 A 的軸上擺動;C 往下時 D 順時針擺,B 推 A 順時針前進兩齒(原圖箭頭方向),
// C 往上時 B 滑過齒背、A 不動。右上方的止回爪(原圖未標字母)擋住 A 不讓它倒轉。
// 主動量是 C 的累計行程(見 kit.swing),A 的累計前進量因此是主動量的純函式。
import { deg, swingPhase, polar } from "./kit.js";
import { ratchetShape, stadium, circle } from "./shapes.js";
import { pawlRest, ratchetAdvance } from "./ratchets.js";
import { circleCircle } from "./linkage.js";

const WHEEL = { center: [0, 0, 0], teeth: 36, outer: 1.9, inner: 1.66, dir: -1 };
const PITCH = (2 * Math.PI) / WHEEL.teeth;
const STEP = 2 * PITCH; // 每推一次前進兩齒
const C_ARM = 0.94; // D 上接 C 的銷離軸心的距離
const B_ARM = 2.11;
const B_OFFSET = deg(176); // D 上 B 端相對於 C 端的角度
const TOP = deg(-18); // C 在最高處時,D 上 C 銷的角度
const BOTTOM = TOP - STEP;
const Y_TOP = C_ARM * Math.sin(TOP);
const STROKE = Y_TOP - C_ARM * Math.sin(BOTTOM); // C 的單程行程
const PAWL = { length: 0.97 };
const CLICK = { pivot: [1.45, 1.66, 0], length: 0.8 };
const C_LENGTH = 2.2;
const FRONT = 0.22;

// 推程開始時爪尖落在齒根:由此定出 A 的初始轉角,讓爪尖剛好靠在一個齒的直面旁
const B_TOP = polar(B_ARM, TOP + B_OFFSET);
const tipStart = circleCircle(B_TOP, PAWL.length, [0, 0, 0], WHEEL.inner, 1).point;
const A0 = Math.atan2(tipStart[1], tipStart[0]) - 0.99 * PITCH;

/** 主動量(C 的累計行程)→ C 的位移、D 的轉角、A 的轉角 */
export function motion(v) {
  const { at: drop, forward } = swingPhase(v, 0, STROKE);
  const d = Math.asin((Y_TOP - drop) / C_ARM); // D 上 C 銷的角度
  const advance = ratchetAdvance(v, STROKE, STEP, TOP - d);
  return { drop, d, a: A0 - advance, forward };
}

const pawlOutline = (l) => [
  [-0.09, 0.07],
  [l * 0.45, 0.17],
  [l * 0.9, 0.09],
  [l, 0],
  [l * 0.86, 0.02],
  [l * 0.45, 0.04],
  [-0.09, -0.07],
];

export const wheelSpec = WHEEL;

export default {
  figure: 75,
  parts: [
    {
      id: "wheelA",
      kind: "plate",
      center: WHEEL.center,
      shape: ratchetShape({ ...WHEEL, bore: 0.12 }),
      thickness: 0.2,
      hub: 0.32,
      mark: [1.3, 0],
      markSize: 0.1,
      spin: WHEEL.outer,
      label: "A",
      labelOffset: [0.75, 0.75, 0],
      circles: [1.38],
    },
    {
      id: "leverD",
      kind: "group",
      center: [0, 0, FRONT],
      pieces: [
        { kind: "plate", shape: stadium(C_ARM, 0.16), thickness: 0.1 },
        { kind: "plate", shape: stadium(B_ARM, 0.16), thickness: 0.1, angle: B_OFFSET },
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [C_ARM, 0, 0] },
        { kind: "cylinder", radius: 0.09, length: 0.3, at: [B_ARM * Math.cos(B_OFFSET), B_ARM * Math.sin(B_OFFSET), -0.05] },
      ],
      label: "D",
      labelOffset: [-0.35, 0.55, 0],
    },
    {
      id: "pawlB",
      kind: "plate",
      shape: { outline: pawlOutline(PAWL.length), holes: [] },
      thickness: 0.14,
      pieces: [{ kind: "plate", shape: { outline: circle(0.11), holes: [] }, thickness: 0.18 }],
      label: "B",
      labelOffset: [-0.3, 0.35, 0],
    },
    {
      id: "rodC",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, C_LENGTH, 0.1], at: [0, -C_LENGTH / 2, 0] },
        { kind: "cylinder", radius: 0.11, length: 0.12 },
      ],
      label: "C",
      labelOffset: [-0.35, -1.9, 0],
    },
    {
      id: "click",
      kind: "plate",
      center: CLICK.pivot,
      shape: { outline: pawlOutline(CLICK.length), holes: [] },
      thickness: 0.14,
      pieces: [{ kind: "cylinder", radius: 0.12, length: 0.24 }],
    },
  ],
  driver: { part: "rodC", type: "translation", direction: [0, -1, 0], cycle: [0, STROKE] },
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const { drop, d, a } = motion(v);
    const wheel = { ...WHEEL, angle: a };
    const bPivot = [...polar(B_ARM, d + B_OFFSET).slice(0, 2), 0];
    const pawl = pawlRest({ pivot: bPivot, length: PAWL.length, from: d + B_OFFSET - deg(110), into: -1, sweep: 1.4 }, wheel);
    const click = pawlRest({ pivot: CLICK.pivot, length: CLICK.length, from: deg(-40), into: -1, sweep: 1.4 }, wheel);
    const pin = polar(C_ARM, d, FRONT + 0.05);
    return {
      parts: {
        wheelA: { angle: a },
        leverD: { angle: d },
        pawlB: { position: bPivot, angle: pawl.angle },
        rodC: { position: [pin[0], Y_TOP - drop, FRONT + 0.05] },
        click: { angle: click.angle },
      },
      readouts: [],
    };
  },
};
