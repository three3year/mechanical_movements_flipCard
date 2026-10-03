// 第 325 種:平行尺。兩根簡單的尺 A、B 由兩根以樞軸擺動的臂 C、C 相連(平行四邊形),
// 所以不論臂擺到哪裡,兩尺的邊緣都保持平行。主動件是上面的尺 A(帶著臂擺開或收攏);下面的尺 B 壓在紙上。
// 推斷:使用時的動作——A 在起始位置沿上緣畫一條線,擺到目前位置再畫一條,兩線平行。
import { deg, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const ARM = 2.3;
const PIV = [[-1.55, 0], [0.45, 0]]; // 兩臂在 B 上的樞軸(世界 x;y 相對 B 的中線)
const B_Y = -1.0;
const RULER = { w: 5.0, h: 0.75 };
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

const ruler = (label) => ({ kind: "plate", shape: shape(rect(RULER.w, RULER.h)), thickness: 0.1, label, labelOffset: [0.2, 0.05, 0.3] });

export default {
  figure: 325,
  parts: [
    { id: "paper", kind: "box", center: [0, 0.3, -0.12], size: [8, 5.6, 0.04] },
    { id: "rulerB", ...ruler("B"), center: [B_X, B_Y, 0] },
    { id: "rulerA", ...ruler("A") },
    { id: "armL", kind: "link", width: 0.16, thickness: 0.06, label: "C", labelOffset: [0.8, 0.5, 0.3] },
    { id: "armR", kind: "link", width: 0.16, thickness: 0.06, label: "C", labelOffset: [0.8, 0.5, 0.3] },
    ...rulerLineParts(),
  ],
  driver: { part: "rulerA", grips: ["armL", "armR"], type: "rotation", range: RANGE, initial: deg(130) },
  view: { direction: [0.03, 0.06, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const [dx, dy] = offset(a);
    const arm = ([x, y]) => ({ from: [x, B_Y + y, 0.12], to: [x + dx, B_Y + y + dy, 0.12] });
    return {
      parts: { rulerA: { position: [B_X + dx, B_Y + dy, 0] }, armL: arm(PIV[0]), armR: arm(PIV[1]) },
      paths: rulerLines(edge, deg(130), a),
      readouts: [],
    };
  },
};
