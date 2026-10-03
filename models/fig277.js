// 第 277 種:柯特上校的發明:扳動擊錘,轉輪跟著轉。把擊錘往後扳起時,擊錘關節(tumbler)上的爪 a 往上推
// 轉輪背面的棘齒 b,轉輪轉過一個膛室;爪 a 由彈簧 c 頂住棘齒。擊錘落下時爪往下滑過棘齒,轉輪不動。
// 主動件是擊錘:扳起、落下(累計行程,見 kit.swing)。
// 推斷:六個膛室、扳起一次轉一格;爪在棘齒上的接觸位置(原圖只畫側面)。
import { X, TAU, deg, swingPhase, rot2 } from "./kit.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";

export const COCK = deg(32);
export const CHAMBERS = 6;
const PIVOT = [-0.55, -0.75, 0];
const PIN = [-1.1, -0.3]; // 爪的樞銷(擊錘關節上,相對擊錘樞軸)
const PAWL = 0.95; // 爪長
const CYL = { center: [-2.85, 0.3, 0], radius: 1.25, length: 1.5 };
const BACK = CYL.center[0] + CYL.length / 2; // 轉輪背面

/** 主動量 v(累計行程)→ 擊錘轉角、轉輪轉角、爪樞銷位置 */
export function colt(v) {
  const { at, cycle, forward } = swingPhase(v, 0, COCK);
  const step = TAU / CHAMBERS;
  // 扳起那一程轉輪跟著轉一格;落下那一程轉輪不動
  const cylinder = -step * (cycle + (forward ? at / COCK : 1));
  const hammer = -at;
  const [px, py] = rot2(PIN, hammer);
  return { hammer, cylinder, pin: [PIVOT[0] + px, PIVOT[1] + py, 0.32], forward };
}

const hammer = shape(
  [[-0.35, -0.55], [0.45, -0.6], [0.95, -0.1], [1.05, 0.9], [1.6, 1.85], [2.05, 2.45], [1.25, 2.0], [0.55, 1.55], [-0.15, 1.75], [-0.62, 1.45], [-0.4, 0.75], [-0.8, 0.1], [-0.85, -0.3]],
  [circle(0.12).reverse()],
);
const flutes = Array.from({ length: CHAMBERS }, (_, i) => {
  const a = (i + 0.5) * (TAU / CHAMBERS);
  return { kind: "box", size: [0.12, 0.12, CYL.length * 0.8], at: [CYL.radius * Math.cos(a), CYL.radius * Math.sin(a), 0], angle: a };
});

export default {
  figure: 277,
  parts: [
    {
      id: "cylinder",
      kind: "cylinder",
      axis: X,
      center: CYL.center,
      radius: CYL.radius,
      length: CYL.length,
      mark: true,
      spin: CYL.radius,
      label: "b",
      labelOffset: [CYL.length / 2 + 0.5, -0.55, 0.6],
      pieces: [...flutes, { kind: "plate", shape: ratchetShape({ teeth: CHAMBERS, outer: 0.62, inner: 0.4, dir: -1 }), thickness: 0.18, at: [0, 0, CYL.length / 2 + 0.09] }],
    },
    {
      id: "hammer",
      kind: "plate",
      center: PIVOT,
      shape: hammer,
      thickness: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.2, length: 0.4 },
        // 擊錘關節(tumbler):從樞軸伸向爪的短臂
        { kind: "plate", shape: shape(thickLine([[0, 0], PIN], 0.22)), thickness: 0.12, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.07, length: 0.5, at: [...PIN, 0.15] },
      ],
    },
    { id: "pawl", kind: "link", width: 0.13, thickness: 0.08, label: "a", labelOffset: [0.3, -0.1, 0.3] },
    { id: "springC", kind: "spring", coils: 6, radius: 0.08, wire: 0.02, label: "c", labelOffset: [0.15, 0.25, 0.3] },
    { id: "frame", kind: "box", center: [BACK + 0.12, 0.3, -0.35], size: [0.2, 3.0, 0.2] },
  ],
  driver: { part: "hammer", type: "rotation", cycle: [0, COCK] },
  target: "cylinder", // 每扳一次轉一格的轉輪
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { hammer: h, cylinder, pin } = colt(v);
    const tip = [BACK + 0.05, pin[1] + PAWL * 0.98, pin[2]];
    // 爪由樞銷往上到棘齒;長度不變:爪尖貼著轉輪背面,依樞銷的位置定出角度
    const dx = tip[0] - pin[0];
    const dy = Math.sqrt(Math.max(0, PAWL * PAWL - dx * dx));
    const top = [tip[0], pin[1] + dy, pin[2]];
    const mid = [(pin[0] + top[0]) / 2, (pin[1] + top[1]) / 2, pin[2]];
    return {
      parts: {
        hammer: { angle: h },
        cylinder: { angle: cylinder },
        pawl: { from: pin, to: top },
        springC: { from: [BACK + 0.5, 0.75, 0.32], to: [mid[0] + 0.05, mid[1], mid[2]] },
      },
      readouts: [],
    };
  },
};
