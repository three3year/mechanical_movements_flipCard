// 第 220 種:兩根曲柄軸方向平行但不共線。一支曲柄端的手腕銷在另一支開槽曲柄的槽內作動;
// 手腕離開槽曲柄軸心的距離一直在變,所以任一支等速轉動,另一支都是變速轉動。主動件是左邊的(手腕)曲柄。
// 推斷:兩軸的距離;開槽曲柄在後、手腕曲柄在前。
import { deg, polar } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const O1 = [0, 0, 0];
const O2 = [0.55, -0.3, 0];
const R1 = 1.15;
const START = deg(60);
const SLOT = { from: 0.3, to: 2.1 };

/** 手腕曲柄轉 theta:手腕的位置、開槽曲柄的轉角與手腕在槽中的位置 */
export function cranks(theta) {
  const wrist = polar(R1, START + theta);
  const angle = Math.atan2(wrist[1] - O2[1], wrist[0] - O2[0]);
  return { wrist, angle, along: Math.hypot(wrist[0] - O2[0], wrist[1] - O2[1]) };
}
export const geometry = { O1, O2, R1, SLOT };
const A0 = cranks(0).angle;

export default {
  figure: 220,
  parts: [
    {
      id: "crank",
      kind: "group",
      center: [0, 0, 0.3],
      spin: R1 + 0.3,
      pieces: [
        { kind: "plate", shape: shape(stadium(R1, 0.5).outline, [circle(0.12).reverse()]), thickness: 0.14, angle: START },
        { kind: "cylinder", radius: 0.12, length: 3.0, at: [0, 0, 1.5], mark: true },
        { kind: "cylinder", radius: 0.08, length: 0.55, at: [...polar(R1, START).slice(0, 2), -0.2] },
      ],
    },
    {
      id: "slotted",
      kind: "group",
      center: O2,
      spin: SLOT.to + 0.3,
      pieces: [
        {
          kind: "plate",
          shape: shape(stadium(SLOT.to + 0.05, 0.5).outline, [stadium(SLOT.to - SLOT.from, 0.18).outline.map(([x, y]) => [x + SLOT.from, y]).reverse(), circle(0.12).reverse()]),
          thickness: 0.14,
          angle: A0,
        },
        { kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.25, angle: A0 },
        { kind: "cylinder", radius: 0.12, length: 3.0, at: [0, 0, -1.5] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  view: { direction: [0.55, 0.3, 1] },
  pose(theta) {
    const { angle } = cranks(theta);
    return { parts: { crank: { angle: theta }, slotted: { angle: angle - A0 } }, readouts: [] };
  },
};
