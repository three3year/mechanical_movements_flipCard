// 第 109 種:左側螺桿旋轉,使刀具(套在左螺桿上的螺帽,伸臂到右側)做均勻的直線運動,
// 在右側另一根轉動的螺桿胚料上切出螺紋。兩根螺桿底部各有一個輪,彼此咬合;
// 更換框架末端的輪(改變兩輪的齒數比),切出的螺距就改變:切出的螺距 = 導螺桿螺距 × 左輪轉速 ÷ 右輪轉速。
// 刀具上方是已切出的螺紋,下方仍是光滑的胚料。主動件是左螺桿(在行程內往返)。
import { Y, TAU, screwAdvance } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape } from "./shapes.js";

const LEAD = 0.36; // 導螺桿螺距
const X = { left: -0.75, right: 0.75 };
const TOP = 1.6;
const BOTTOM = -1.55;
const TURNS = 6;
const WHEELS = {
  equal: { left: 20, right: 20 },
  double: { left: 26, right: 13 },
};
const GAP = X.right - X.left; // 兩輪中心距 = 兩螺桿的距離
const wheel = (side, state) => {
  const w = WHEELS[state];
  const n = w[side];
  return { center: [X[side], BOTTOM - 0.18, 0], axis: Y, teeth: n, radius: (GAP * n) / (w.left + w.right) };
};

/** 換輪 state、左螺桿轉 angle:刀具高度、右螺桿轉角、切出的螺距 */
export function cutting(angle, state = "equal") {
  const w = WHEELS[state];
  const y = TOP - 0.35 - screwAdvance(angle, LEAD);
  const blank = meshAngle(wheel("left", state), wheel("right", state), angle);
  // 刀具每走一個導螺桿螺距,胚料轉 N左/N右 圈:切出的螺距 = 導螺距 × N右 / N左
  return { y, blank, cutPitch: (LEAD * w.right) / w.left };
}
export const lead = LEAD;

export default {
  figure: 109,
  parts: [
    { id: "lead", kind: "worm", axis: Y, center: [X.left, 0.05, 0], radius: 0.28, length: 3.0, pitch: LEAD, thread: 0.08, pieces: [{ kind: "cylinder", radius: 0.08, length: 3.7 }] },
    ...Object.keys(WHEELS).map((state) => ({
      id: `blank_${state}`,
      kind: "worm",
      axis: Y,
      center: [X.right, 0.05, 0],
      radius: 0.28,
      length: 3.0,
      pitch: (LEAD * WHEELS[state].right) / WHEELS[state].left,
      thread: 0.07,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 3.7 }],
    })),
    { id: "sleeve", kind: "cylinder", axis: Y, center: [X.right, BOTTOM + 0.1, 0], radius: 0.29, length: 1, arrow: false },
    {
      id: "cutter",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.4, -0.15], [0.4, -0.15], [0.4, 0.15], [-0.4, 0.15]]), thickness: 0.5, at: [X.left - 0.05, 0, 0] },
        { kind: "box", size: [0.95, 0.1, 0.12], at: [0, 0.03, 0] },
        { kind: "plate", shape: shape([[0.42, -0.06], [0.48, 0.12], [0.36, 0.12]]), thickness: 0.12 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.3, 0.28, 0.5], at: [0, TOP + 0.05, 0] },
        { kind: "box", size: [1.95, 0.2, 0.5], at: [0, BOTTOM - 0.45, 0] },
      ],
    },
    ...Object.keys(WHEELS).flatMap((state) =>
      ["left", "right"].map((side) => {
        const w = wheel(side, state);
        return { id: `wheel_${side}_${state}`, kind: "gear", axis: Y, center: w.center, teeth: w.teeth, radius: w.radius, width: 0.22, web: false };
      }),
    ),
  ],
  driver: { part: "lead", type: "rotation", range: [0, TURNS * TAU] },
  target: "cutter", // 均勻直線進給的刀具
  states: {
    options: [
      { id: "equal", label: "兩輪等大(螺距相同)" },
      { id: "double", label: "換輪 2:1(螺距減半)" },
    ],
    initial: "equal",
  },
  view: { direction: [0.15, 0.2, 1] },
  pose(angle, state = "equal") {
    const { y, blank } = cutting(angle, state);
    const below = y - (BOTTOM + 0.1); // 刀具下方仍是光滑胚料的長度
    const parts = {
      lead: { angle },
      sleeve: { position: [X.right, BOTTOM + 0.1 + below / 2, 0], scale: [1, 1, Math.max(0.001, below)] },
      cutter: { position: [0, y, 0] },
    };
    // 只顯示目前裝上的那一對輪與對應螺距的胚料
    for (const s of Object.keys(WHEELS)) {
      const on = s === state;
      parts[`blank_${s}`] = { angle: on ? blank : 0, visible: on };
      parts[`wheel_left_${s}`] = { angle: on ? angle : 0, visible: on };
      parts[`wheel_right_${s}`] = { angle: on ? blank : 0, visible: on };
    }
    return {
      parts,
      readouts: [],
    };
  },
};
