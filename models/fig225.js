// 第 225 種:搖臂振動,經它承載的棘爪給棘輪間歇的圓周運動。直立的搖臂下端以樞軸裝在台座上,上端以銷掛著
// 一根長棘爪,棘爪的另一端搭在棘輪頂上的齒間。搖臂往左擺時棘爪推著齒,棘輪逆時針轉過兩齒;往右擺時棘爪滑過齒背,
// 棘輪不動。主動量是搖臂的累計擺動量。
// 推斷:棘爪靠自重落在齒上;每推一次前進兩齒。
import { polar, add, swingPhase } from "./kit.js";
import { ratchetShape, shape, thickLine, rect } from "./shapes.js";
import { ratchetRadius, ratchetAdvance } from "./ratchets.js";
import { circleCircle } from "./linkage.js";

const WHEEL = { center: [0, 0, 0], teeth: 24, outer: 1.78, inner: 1.42, dir: 1 };
const PITCH = (2 * Math.PI) / WHEEL.teeth;
const PIVOT = [2.5, -2.6, 0];
const LEVER = 5.2;
const PAWL = 3.0;
const CONTACT_R = WHEEL.inner + 0.03; // 推程中爪尖頂在齒直面的根部
const top = (psi) => add(PIVOT, polar(LEVER, Math.PI / 2 + psi));
// 推程中爪尖頂在齒的直面上(半徑 CONTACT_R)
const tipAngle = (psi) => {
  const p = circleCircle(top(psi), PAWL, WHEEL.center, CONTACT_R, -1).point;
  return Math.atan2(p[1], p[0]);
};
// 擺幅:讓每推一次輪恰好前進兩齒
let SWING = 0.2;
for (let i = 0; i < 50; i++) SWING *= (2 * PITCH) / (tipAngle(SWING / 2) - tipAngle(-SWING / 2));
const FROM = -SWING / 2;
const STEP = tipAngle(SWING / 2) - tipAngle(FROM);
const A0 = tipAngle(FROM) - 0.022 * PITCH; // 推程開始時爪尖剛好靠在一個齒的直面旁

/** 主動量 v(搖臂累計擺動):搖臂轉角、棘輪轉角與爪尖位置(推程頂著直面,回程沿齒背滑過) */
export function ratchet(v) {
  const { at: psi, forward } = swingPhase(v, FROM, -FROM);
  const wheel = A0 + ratchetAdvance(v, SWING, STEP, tipAngle(psi) - tipAngle(FROM));
  let r = CONTACT_R;
  let tip = circleCircle(top(psi), PAWL, WHEEL.center, r, -1).point;
  if (!forward)
    for (let i = 0; i < 12; i++) {
      r = Math.max(CONTACT_R, ratchetRadius(WHEEL, Math.atan2(tip[1], tip[0]) - wheel));
      tip = circleCircle(top(psi), PAWL, WHEEL.center, r, -1).point;
    }
  return { psi, wheel, tip };
}
export const step = STEP;
export const pitch = PITCH;

export default {
  figure: 225,
  parts: [
    { id: "wheel", kind: "plate", shape: ratchetShape({ ...WHEEL, bore: 0.15 }), thickness: 0.22, hub: 0.38, circles: [0.55], mark: [1.0, 0], markSize: 0.09, spin: WHEEL.outer },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, LEVER]], 0.22)), thickness: 0.12, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.3 },
      ],
    },
    { id: "pawl", kind: "plate", shape: shape([[-0.15, 0.12], [PAWL * 0.5, 0.22], [PAWL, 0.06], [PAWL + 0.02, -0.08], [PAWL * 0.5, -0.06], [-0.15, -0.12]]), thickness: 0.1, arrow: false },
    { id: "stand", kind: "group", pieces: [{ kind: "plate", shape: shape([[-0.5, -0.35], [0.5, -0.35], [0.3, 0.05], [-0.3, 0.05]]), thickness: 0.3, at: [PIVOT[0], PIVOT[1] - 0.05, 0] }, { kind: "plate", shape: shape(rect(2.2, 0.12, PIVOT[0], PIVOT[1] - 0.46)), thickness: 0.5 }] },
  ],
  waivers: [
    { check: "unsupported", parts: ["wheel"], reason: "待確認:wheel 與帶動(或支撐)它的零件之間差 0.09 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["pawl"], reason: "待確認:pawl 與帶動(或支撐)它的零件之間差 0.04 沒貼上,接觸位置是算出來的近似,未逐一修正" },
  ],
  driver: { part: "lever", type: "rotation", cycle: [FROM, -FROM] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { psi, wheel, tip } = ratchet(v);
    const t = top(psi);
    return {
      parts: {
        wheel: { angle: wheel },
        lever: { angle: psi },
        pawl: { position: [t[0], t[1], 0.25], angle: Math.atan2(tip[1] - t[1], tip[0] - t[0]) },
      },
      readouts: [],
    };
  },
};
