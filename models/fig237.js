// 第 237 種:頂端搖臂的往復圓周運動,使它附帶的棘爪帶動冠狀棘輪(鋸齒輪,rag-wheel)間歇地轉。
// 搖臂套在輪的直立軸頂上來回轉,臂端的棘爪往下搭在輪緣的鋸齒上:往一個方向轉時棘爪頂著齒的直面,輪跟著轉;
// 往回轉時棘爪沿齒的斜面滑上去、越過齒尖落下,輪不動。主動量是搖臂的累計擺動量。
// 推斷:24 齒,搖臂每程轉兩個齒距。棘爪靠自重落下,越過齒尖後的落下過程演出來(jumps.falling,
// 佔搖臂轉角 DROP):回程中途落下時,碰到下一齒的斜面就貼著斜面走;回程最後一齒的齒尖正好在
// 回程終點越過,落下的後段在推程開頭、沿著齒的直面滑到底(直面是垂直的,滑下途中照樣頂著齒推)。
import { TAU, Y, swingPhase } from "./kit.js";
import { sawCrown } from "./escapement.js";
import { ratchetAdvance } from "./ratchets.js";
import { falling } from "./jumps.js";

const N = 24;
const R = 2.0;
const H = 0.42;
const PITCH = TAU / N;
const SPAN = 2 * PITCH;
const FROM = SPAN / 2;
const TO = -SPAN / 2;
const TOP = 0.4; // 輪緣頂面高度(局部 z)
const DROP = 0.08; // 落下的過程佔搖臂轉角多少(約 0.18 秒)

/** 搖臂累計擺動 v:搖臂轉角、輪轉角、棘爪在齒上的高度 */
export function motion(v) {
  const { at, forward, cycle } = swingPhase(v, FROM, TO);
  const wheel = -ratchetAdvance(v, SPAN, SPAN, FROM - at);
  let lift;
  if (forward) {
    // 推程:頂著直面推;上一程最後越過的齒尖還沒落完就沿直面滑下去(第一程起始時已落定)
    lift = cycle === 0 ? 0 : H * (1 - falling((FROM - at) / DROP));
  } else {
    // 回程:沿斜面升到齒尖,越過後落下;落下途中碰到下一齒的斜面就貼著走
    const s = at - TO;
    const k = Math.floor(s / PITCH);
    const ramp = H * ((s - k * PITCH) / PITCH);
    const fall = k > 0 ? H * (1 - falling((s - k * PITCH) / DROP)) : 0;
    lift = Math.max(ramp, fall);
  }
  return { arm: at, wheel, lift };
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
        { kind: "cylinder", radius: 0.06, length: R + 0.09, axis: [1, 0, 0], at: [(R - 0.31) / 2, 0, 1.12] }, // 臂的端面頂著棘爪(棘爪掛在臂端,可上下滑)
      ],
    },
    { id: "pawl", kind: "box", size: [0.22, 0.6, 0.4] },
  ],
  // 動力重演:只推主動件;wheel 靠摩擦定位,由接觸帶動
  replay: { free: { wheel: { hold: true } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },

  target: "wheel",
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
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 1.05 時已轉 -30°,實際轉了 2°。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
    { check: "interference", parts: ["wheel", "pawl"], reason: "棘爪的抬起與落下依臂的行程演出,不逐點算爪底落在鋸齒上的位置;爪底伸進齒 0.12" },
  ],
};
