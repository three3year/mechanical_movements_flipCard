// 第 325 種:平行尺。兩根簡單的尺 A、B 由兩根以樞軸擺動的臂 C、C 相連(平行四邊形),
// 所以不論臂擺到哪裡,兩尺的邊緣都保持平行。主動件是上面的尺 A(帶著臂擺開或收攏);下面的尺 B 壓在紙上。
// 推斷:使用時的動作——A 在起始位置沿上緣畫一條線,擺到目前位置再畫一條,兩線平行。
// 兩尺平放在紙上(底面貼紙面),線畫在紙面上;臂貼著尺面,四個樞軸各有一根立在尺上的銷穿過臂端(推斷:原圖是平面圖)。
import { deg, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const ARM = 2.3;
const PIV = [[-1.55, 0], [0.45, 0]]; // 兩臂在 B 上的樞軸(世界 x;y 相對 B 的中線)
const B_Y = -1.0;
const RULER = { w: 5.0, h: 0.75, t: 0.1 };
const ARM_T = 0.06;
const ARM_Z = RULER.t / 2 + ARM_T / 2; // 臂貼著尺面
export const RANGE = [deg(105), deg(160)]; // 臂的方向(從 B 上的樞軸往 A)

/** 臂角 a → A 的位移(相對 B) */
export const offset = (a0) => {
  const a = clamp(a0, ...RANGE);
  return [ARM * Math.cos(a), ARM * Math.sin(a)];
};
const B_X = -0.6;
export const edge = (a) => {
  const [dx, dy] = offset(a);
  const y = B_Y + dy + RULER.h / 2 + 0.06;
  return [[B_X + dx - RULER.w / 2 - 0.3, y], [B_X + dx + RULER.w / 2 + 0.3, y]];
};

// 尺上的樞軸銷:兩臂的端點在尺的局部座標裡相同(平行四邊形),從尺底穿出臂面
const PIN_LEN = RULER.t + ARM_T + 0.02;
const pins = PIV.map(([x, y]) => ({ kind: "cylinder", radius: 0.035, length: PIN_LEN, at: [x - B_X, y, -RULER.t / 2 + PIN_LEN / 2] }));
const ruler = (label) => ({ kind: "plate", shape: shape(rect(RULER.w, RULER.h)), thickness: RULER.t, label, labelOffset: [0.2, 0.05, 0.3], pieces: pins });

export default {
  figure: 325,
  parts: [
    { id: "paper", kind: "box", center: [0, 0.3, -RULER.t / 2 - 0.02], size: [8, 5.6, 0.04] },
    { id: "rulerB", ...ruler("B"), center: [B_X, B_Y, 0] },
    { id: "rulerA", ...ruler("A") },
    { id: "armL", kind: "link", width: 0.16, thickness: ARM_T, pins: false, label: "C", labelOffset: [0.8, 0.5, 0.3] },
    { id: "armR", kind: "link", width: 0.16, thickness: ARM_T, pins: false, label: "C", labelOffset: [0.8, 0.5, 0.3] },
    ...rulerLineParts(),
  ],
  driver: { part: "rulerA", grips: ["armL", "armR"], type: "rotation", range: RANGE, initial: deg(130) },
  view: { direction: [0.03, 0.06, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const [dx, dy] = offset(a);
    const arm = ([x, y]) => ({ from: [x, B_Y + y, ARM_Z], to: [x + dx, B_Y + y + dy, ARM_Z] });
    return {
      parts: { rulerA: { position: [B_X + dx, B_Y + dy, 0] }, armL: arm(PIV[0]), armR: arm(PIV[1]) },
      paths: rulerLines(edge, deg(130), a, -RULER.t / 2 + 0.002),
      readouts: [],
    };
  },
};
