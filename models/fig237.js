// 第 237 種:頂端搖臂的往復圓周運動,使它附帶的棘爪帶動冠狀棘輪(鋸齒輪,rag-wheel)間歇地轉。
// 搖臂套在輪的直立軸頂上來回轉,臂端的棘爪往下搭在輪緣的鋸齒上:往一個方向轉時棘爪頂著齒的直面,輪跟著轉;
// 往回轉時棘爪沿齒的斜面滑上去、越過齒尖落下,輪不動。主動量是搖臂的累計擺動量。
// 推斷:24 齒,搖臂每程轉兩個齒距。
import { TAU, Y, swingPhase } from "./kit.js";
import { sawCrown, sawHeight } from "./escapement.js";
import { ratchetAdvance } from "./ratchets.js";

const N = 24;
const R = 2.0;
const H = 0.42;
const PITCH = TAU / N;
const SPAN = 2 * PITCH;
const FROM = SPAN / 2;
const TO = -SPAN / 2;
const TOP = 0.4; // 輪緣頂面高度(局部 z)

/** 搖臂累計擺動 v:搖臂轉角、輪轉角、棘爪在齒上的高度 */
export function motion(v) {
  const { at } = swingPhase(v, FROM, TO);
  const wheel = -ratchetAdvance(v, SPAN, SPAN, FROM - at);
  // 棘爪相對於輪的位置;推程時停在直面腳下(局部角 0⁺)
  const rel = at - wheel - FROM + 1e-6;
  return { arm: at, wheel, lift: sawHeight(rel, N, H) };
}
export const geometry = { N, PITCH, SPAN };

export default {
  figure: 237,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      spin: R + 0.1,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.1, length: TOP, at: [0, 0, TOP / 2] },
        { kind: "cylinder", radius: R - 0.05, length: 0.04, at: [0, 0, 0.02] },
        ...sawCrown({ teeth: N, radius: R - 0.05, height: H, base: TOP }).map((p) => ({ ...p, at: [p.at[0], p.at[1], TOP] })),
        { kind: "cylinder", radius: 0.12, length: 2.6, at: [0, 0, -1.3], mark: true },
        { kind: "cylinder", radius: 0.2, length: 0.9, at: [0, 0, 0.6] },
      ],
    },
    {
      id: "arm",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.18, at: [0, 0, 1.0] },
        { kind: "cylinder", radius: 0.06, length: 3.2, axis: [1, 0, 0], at: [1.4, 0, 1.12] },
      ],
    },
    { id: "pawl", kind: "box", size: [0.22, 0.6, 0.4] },
  ],
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },
  view: { direction: [0.3, 0.75, 1] },
  pose(v) {
    const { arm, wheel, lift } = motion(v);
    // 棘爪掛在臂端(半徑 R),底端落在齒面上;世界座標:輪軸是 y,局部 (x, y) → 世界 (x, −z)
    const a = arm;
    return {
      parts: {
        arm: { angle: arm },
        wheel: { angle: wheel },
        pawl: { position: [R * Math.cos(a), TOP + lift + 0.3, -R * Math.sin(a)], rotation: [0, Math.sin(a / 2), 0, Math.cos(a / 2)] },
      },
      readouts: [],
    };
  },
};
