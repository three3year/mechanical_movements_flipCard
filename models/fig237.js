// 第 237 種:頂端搖臂的往復圓周運動,使它附帶的棘爪帶動冠狀棘輪(鋸齒輪,rag-wheel)間歇地轉。
// 搖臂套在輪的直立軸頂上來回轉,臂端的棘爪往下搭在輪緣的鋸齒上:往一個方向轉時棘爪頂著齒的直面,輪跟著轉;
// 往回轉時棘爪沿齒的斜面滑上去、越過齒尖落下,輪不動。主動量是搖臂的累計擺動量。
//
// 接觸(由接觸算):棘爪是一根直立的方桿,穿過臂端的導套,可上下滑,靠自重落在齒上。把輪緣沿圓周攤平來算:
// 搖臂每走一小步,棘爪若頂到齒的直面就把輪推開(輪跟著轉);棘爪被齒的斜面頂起,越過齒尖後從當下的速度起
// 加速落下,碰到齒面就停。推多遠、何時越過、落多深,都由棘爪的底與鋸齒相碰算出。
// 推斷:24 齒;搖臂每程轉兩個多齒距(推程開頭有一小段空行程),輪每程前進兩齒;導套的樣子。
import { TAU, Y, swingPhase } from "./kit.js";
import { sawCrown } from "./escapement.js";
import { polygonsOverlap } from "./contact.js";

const N = 24;
const R = 2.0;
const H = 0.42;
const PITCH = TAU / N;
const SPAN = 2.3 * PITCH; // 搖臂每程的擺幅
const FROM = SPAN / 2;
const TO = -SPAN / 2;
const TOP = 0.4; // 輪緣頂面高度(局部 z)
const PAWL = { width: 0.2, height: 0.9 }; // 棘爪方桿(沿圓周的寬度、高度)
const ARC = R - 0.05; // 鋸齒與棘爪所在的半徑(沿圓周攤平時的比例)

// 攤平的座標:s 是沿圓周的弧長(往輪的局部角增加的方向為正),h 是離輪緣頂面的高度。
// 齒 i 從 s = i·齒距 的齒根沿斜面升到 (i+1)·齒距 的齒尖,在那裡直落(與 sawCrown 一致)
const P = PITCH * ARC;
const teethAt = (shift, near) => {
  const out = [];
  const i0 = Math.floor((near - shift) / P) - 2;
  for (let i = i0; i <= i0 + 4; i++) {
    const x = shift + i * P;
    out.push([[x, 0], [x + P, 0], [x + P, H]]);
  }
  out.push([[near - 3 * P, -1], [near + 3 * P, -1], [near + 3 * P, 0], [near - 3 * P, 0]]); // 輪緣頂面
  return out;
};
const pawlAt = (s, h) => [[s - PAWL.width / 2, h], [s + PAWL.width / 2, h], [s + PAWL.width / 2, h + 1], [s - PAWL.width / 2, h + 1]];
const hits = (s, h, shift) => teethAt(shift, s).some((t) => polygonsOverlap(pawlAt(s, h), t));

// 逐步算:臂的轉角 ψ(棘爪在 s = ψ·ARC)、輪的轉角 θ(齒移了 θ·ARC)、棘爪底的高度 h 與落下速度
const SAMPLES = 480; // 一個來回
const DV = (2 * SPAN) / SAMPLES;
const ACC = (2 * H) / (0.07 * SPAN) ** 2; // 憑自重落下:自靜止落過一個齒高約花擺幅的 7%
function stepTo(state, psi, pushing) {
  let { theta, h, w } = state;
  const s = psi * ARC;
  if (pushing && hits(s, h, theta * ARC)) {
    // 頂到齒的直面:輪往臂的方向(局部角減少)轉到剛好不碰那一齒。只看原本碰到的那一齒(以它的齒根位置認):
    // 棘爪同時壓在下一齒的斜面上時,輪一轉,斜面會把棘爪抬起一點,那由下面「被斜面頂起」處理
    const pawl = pawlAt(s, h);
    const roots = teethAt(theta * ARC, s).slice(0, -1).filter((t) => polygonsOverlap(pawl, t)).map((t) => t[0][0] - theta * ARC);
    const still = (d) => roots.some((r) => {
      const x = (theta - d) * ARC + r;
      return polygonsOverlap(pawl, [[x, 0], [x + P, 0], [x + P, H]]);
    });
    let [lo, hi] = [0, PITCH / 4];
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (still(mid)) lo = mid;
      else hi = mid;
    }
    if (roots.length && !still(hi)) theta -= hi;
  }
  const shift = theta * ARC;
  if (hits(s, h, shift)) {
    // 被斜面頂起:往上退到剛好不碰
    let [lo, hi] = [h, h + H + 0.1];
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (hits(s, mid, shift)) lo = mid;
      else hi = mid;
    }
    return { theta, h: hi, w: 0 };
  }
  // 落下:從當下的速度起加速,碰到齒面就停
  const target = h - (w * DV + ACC * DV * DV);
  if (!hits(s, target, shift)) return { theta, h: target, w: (h - target) / DV };
  let [lo, hi] = [target, h];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hits(s, mid, shift)) lo = mid;
    else hi = mid;
  }
  return { theta, h: hi, w: 0 };
}

const { TABLE, ADVANCE } = (() => {
  let state = { theta: 0, h: H, w: 0 };
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const v = i * DV;
    const psi = swingPhase(v, FROM, TO).at;
    state = stepTo(state, psi, swingPhase(v - DV / 2, FROM, TO).forward);
    run.push(state);
  }
  const table = run.slice(2 * SAMPLES);
  const raw = table[SAMPLES].theta - table[0].theta;
  const advance = Math.round(raw / PITCH) * PITCH;
  if (!advance || Math.abs(raw - advance) > PITCH * 0.05) throw new Error(`第 237 種:每個來回推了 ${(raw / PITCH).toFixed(2)} 齒`);
  const t0 = table[0].theta;
  return { TABLE: table.map((e) => ({ ...e, theta: t0 + ((e.theta - t0) * advance) / raw })), ADVANCE: advance };
})();
const W0 = TABLE[0].theta;

/** 搖臂累計擺動 v:搖臂轉角、輪轉角(自起點,繞 +y)、棘爪底離輪緣頂面的高度 */
export function motion(v) {
  const period = 2 * SPAN;
  const k = Math.floor(v / period + 1e-12);
  const x = Math.max(0, ((v - k * period) / period) * SAMPLES);
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { arm: swingPhase(v, FROM, TO).at, wheel: a.theta + (b.theta - a.theta) * t - W0 + k * ADVANCE, lift: a.h + (b.h - a.h) * t };
}
export const geometry = { N, PITCH, SPAN, H };
/** 檢查用:主動量 v 時攤平的棘爪底與鋸齒 */
export function contactAt(v) {
  const { arm, wheel, lift } = motion(v);
  const s = arm * ARC;
  return { pawl: pawlAt(s, lift), teeth: teethAt((wheel + W0) * ARC, s).slice(0, -1) };
}

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
        { kind: "cylinder", radius: 0.06, length: R - 0.3, axis: [1, 0, 0], at: [(R - 0.1) / 2 + 0.05, 0, 1.12] },
        // 臂端的導套:四片板圍住棘爪方桿(棘爪在裡面上下滑)
        { kind: "box", size: [0.04, 0.3, 0.3], at: [ARC - PAWL.width / 2 - 0.04, 0, 1.12] },
        { kind: "box", size: [0.04, 0.3, 0.3], at: [ARC + PAWL.width / 2 + 0.04, 0, 1.12] },
        { kind: "box", size: [PAWL.width + 0.16, 0.04, 0.3], at: [ARC, PAWL.width / 2 + 0.04, 1.12] },
        { kind: "box", size: [PAWL.width + 0.16, 0.04, 0.3], at: [ARC, -PAWL.width / 2 - 0.04, 1.12] },
      ],
    },
    { id: "pawl", kind: "box", size: [PAWL.width, PAWL.height, PAWL.width] },
  ],
  // 動力重演:只推搖臂;棘爪在臂端的導套裡上下滑,靠自重落在齒上;輪靠摩擦定位,由棘爪推動
  replay: {
    to: 4 * SPAN,
    seconds: 16,
    free: { wheel: { hold: true, gravity: false }, pawl: { on: "arm", slide: [0, 1, 0] } },
    expect: [
      { at: SPAN, part: "wheel", label: "搖臂推程:棘爪頂著直面,輪轉兩齒", quote: "頂端搖臂的往復圓周運動,會使其附帶的棘爪產生冠狀棘輪……的間歇圓周運動" },
      { at: 2 * SPAN, part: "wheel", label: "回程:棘爪沿斜面滑過,輪不動" },
      { at: 4 * SPAN, part: "wheel", label: "兩個來回後轉四齒" },
    ],
  },
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },
  target: "wheel",
  view: { direction: [0.3, 0.75, 1] },
  pose(v) {
    const { arm, wheel, lift } = motion(v);
    // 棘爪掛在臂端(半徑 ARC),底端在輪緣頂面上 lift 處;世界座標:輪軸是 y,局部 (x, y) → 世界 (x, −z)
    return {
      parts: {
        arm: { angle: arm },
        wheel: { angle: wheel + W0 },
        pawl: { position: [ARC * Math.cos(arm), TOP + lift + PAWL.height / 2, -ARC * Math.sin(arm)], rotation: [0, Math.sin(arm / 2), 0, Math.cos(arm / 2)] },
      },
      readouts: [],
    };
  },
};
