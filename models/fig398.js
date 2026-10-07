// 第 398 種:把連續的圓周運動變成間歇的圓周運動——凸輪 C 是主動件。三瓣的凸輪夾在一個方框形的滑塊(軛)裡,
// 凸輪轉動時方框左右往復(凸輪是等寬的,所以一直夾著);方框經一根連桿帶動右邊大輪頂上的棘爪,
// 方框往復一次,大輪被撥轉一下、又停一下。主動件是凸輪 C。
// 推斷:連桿末端鉸著一個棘爪,搭在大輪頂上的棘齒(原圖右邊大輪上的小爪);方框往左拉時棘爪推著大輪轉,
// 往右回時棘爪滑過齒,大輪不動,所以大輪間歇地朝同一方向轉。
//
// 由接觸算(2026-10-07 複查,原本棘爪和連桿是一體的、大輪照「方框往左走多少就轉多少」的進度表轉):
// - 棘爪鉸在連桿末端的銷上,爪尖朝左下、靠自重搭在大輪的鋸齒上(陡面朝右)。連桿往左時,銷在後面推著爪,
//   爪尖頂著陡面把大輪往逆時針推;爪身是斜撐,陡面頂回來的力只會把爪壓得更緊。連桿往右時爪尖沿斜背滑過,
//   越過齒尖後靠自重落進下一齒(加速落下)。大輪轉多少、停在哪裡都由爪尖與齒相碰決定;換向時有一段空程。
// - 補上凸輪軸的軸承座、連桿的方形導套與立柱、大輪軸的軸承座(原圖沒畫,推斷)。
import { TAU } from "./kit.js";
import { outlineForRoller } from "./cams.js";
import { shape, circle, rect, ratchetShape, thickLine } from "./shapes.js";
import { ratchetRadius } from "./ratchets.js";
import { pedestal, squareGuide } from "./supports.js";

const CAM = { center: [-1.6, 0, 0] };
const A = 0.9;
const B = 0.22;
const pitchAt = (phi) => A + B * Math.cos(3 * phi);
const OUTLINE = outlineForRoller(pitchAt, 0.001);
const WHEEL = { center: [2.4, -0.6, 0], r: 1.3 };
const RATCHET = { teeth: 45, outer: WHEEL.r, inner: WHEEL.r - 0.12, dir: 1 }; // 齒要夠密:爪尖每程相對大輪走得比一齒多,才抓得到下一齒
export const PITCH = TAU / RATCHET.teeth;
const ROD_X0 = CAM.center[0] + A + 0.85; // 連桿的位置(方框在中間時)
const ROD_END = [2.3, 0.95]; // 連桿末端(鉸銷)在連桿局部的位置
const PAWL = { len: 0.46 };
// 爪的外形(鉸銷在原點,爪尖在 (len, 0)),與爪身上取來量離齒面多遠的點
const PAWL_OUTLINE = [[-0.05, -0.035], [PAWL.len - 0.14, -0.035], [PAWL.len, 0], [PAWL.len - 0.14, 0.035], [-0.05, 0.035]];
const PROBES = [[PAWL.len, 0], ...Array.from({ length: 15 }, (_, i) => { const b = (i + 1) * 0.035; const h = 0.035 * Math.min(1, b / 0.14); return [[PAWL.len - b, -h], [PAWL.len - b, h]]; }).flat()];
const FALL = 300; // 爪靠自重落下的角加速度(主動量的單位)

/** 凸輪轉 theta → 方框的位移(右側從動面) */
export const yokeX = (theta) => pitchAt(theta) - A;
const pinAt = (theta) => [ROD_X0 + yokeX(theta) + ROD_END[0], ROD_END[1]];

// 爪尖在大輪局部的方位、半徑;離齒面多遠(負的是壓進去)
const tipLocal = (pin, psi, wheel) => {
  const x = pin[0] + PAWL.len * Math.cos(psi) - WHEEL.center[0];
  const y = pin[1] + PAWL.len * Math.sin(psi) - WHEEL.center[1];
  return { a: Math.atan2(y, x) - wheel, r: Math.hypot(x, y) };
};
const gapOf = (pin, psi, wheel) => {
  const [c, s] = [Math.cos(psi), Math.sin(psi)];
  let g = Infinity;
  for (const [px, py] of PROBES) {
    const x = pin[0] + px * c - py * s - WHEEL.center[0];
    const y = pin[1] + px * s + py * c - WHEEL.center[1];
    g = Math.min(g, Math.hypot(x, y) - ratchetRadius(RATCHET, Math.atan2(y, x) - wheel));
  }
  return g - 0.012; // 留一點間隙:探測點之間的邊不會切到齒尖
};

// 依接觸逐步算:(1) 爪尖在齒根、又跑到陡面前面(連桿往左推)→ 大輪被推到陡面剛好貼著爪尖;
// (2) 爪被齒面壓進去(往右時斜背頂上來)就往上讓開;沒碰到就靠自重往下擺(越擺越快),碰到齒面就停
const FACE = 0.02; // 陡面的根部在一齒中的位置(齒距的比例,與 ratchetShape 一致)
const PERIOD = TAU / 3; // 凸輪轉三分之一圈,方框往復一次
const SAMPLES = 480;
function simulate(periods) {
  let wheel = 0;
  let psi = Math.PI + 0.2;
  let w = 0;
  const dv = PERIOD / SAMPLES;
  const run = [];
  for (let i = 0; i <= periods * SAMPLES; i++) {
    const pin = pinAt(-i * dv); // 主動件往負方向轉(速度 −0.8)
    const t = tipLocal(pin, psi, wheel);
    if (t.r < RATCHET.inner + 0.7 * (RATCHET.outer - RATCHET.inner)) {
      const f = (((t.a / PITCH) % 1) + 1) % 1;
      if (f > FACE && f < FACE + 0.3) wheel += (f - FACE) * PITCH;
    }
    if (gapOf(pin, psi, wheel) < 0) {
      let d = 0;
      while (gapOf(pin, psi - d, wheel) < 0 && d < 1) d += 0.002;
      let [lo, hi] = [psi - d, psi - d + 0.002];
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        if (gapOf(pin, mid, wheel) >= 0) lo = mid;
        else hi = mid;
      }
      psi = lo;
      w = 0;
    } else {
      w += FALL * dv;
      const span = w * dv;
      const n = Math.max(1, Math.ceil(span / 0.004));
      let next = psi + span;
      for (let j = 1; j <= n; j++) {
        const q = psi + (span * j) / n;
        if (gapOf(pin, q, wheel) < 0) {
          let [lo, hi] = [psi + (span * (j - 1)) / n, q];
          for (let m = 0; m < 30; m++) {
            const mid = (lo + hi) / 2;
            if (gapOf(pin, mid, wheel) >= 0) lo = mid;
            else hi = mid;
          }
          next = lo;
          w = 0;
          break;
        }
      }
      psi = next;
    }
    run.push({ wheel, psi });
  }
  return run;
}

// 先空走兩次往復,取第三次當作週期;每次推過整數個齒,逐步推的微小誤差按比例攤掉
const { TABLE, STEP } = (() => {
  const run = simulate(3);
  const table = run.slice(2 * SAMPLES);
  const [w0, raw] = [table[0].wheel, table[SAMPLES].wheel - table[0].wheel];
  const step = Math.round(raw / PITCH) * PITCH;
  return { TABLE: table.map((s) => ({ ...s, wheel: w0 + ((s.wheel - w0) * step) / raw })), STEP: step };
})();
/** 方框往復一次,大輪被推過的角度(整數個齒) */
export const perStroke = STEP;

/** 凸輪轉 theta(主動件往負方向轉)→ 方框的位移、大輪的轉角(只朝一個方向累計)、棘爪的角度 */
export function intermittent(theta) {
  const v = -theta;
  const k = Math.floor(v / PERIOD);
  const x = ((v - k * PERIOD) / PERIOD) * SAMPLES;
  const i = Math.max(0, Math.min(SAMPLES - 1, Math.floor(x)));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  const abs = k * STEP + a.wheel + (b.wheel - a.wheel) * t;
  return { x: yokeX(theta), wheel: abs - TABLE[0].wheel, abs, psi: a.psi + (b.psi - a.psi) * t };
}

/** 檢查用:爪(整個外形上取的點)離齒面多遠 */
export const pawlOutlineAt = (theta) => {
  const s = intermittent(theta);
  const pin = pinAt(theta);
  return PAWL_OUTLINE.map(([x, y]) => [pin[0] + x * Math.cos(s.psi) - y * Math.sin(s.psi), pin[1] + x * Math.sin(s.psi) + y * Math.cos(s.psi)]);
};
export const wheelOutlineAt = (theta) => {
  const a = intermittent(theta).abs;
  return ratchetShape(RATCHET).outline.map(([x, y]) => [WHEEL.center[0] + x * Math.cos(a) - y * Math.sin(a), WHEEL.center[1] + x * Math.sin(a) + y * Math.cos(a)]);
};
export const pawlGap = (theta) => {
  const s = intermittent(theta);
  return gapOf(pinAt(theta), s.psi, s.abs);
};

export default {
  figure: 398,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [CAM.center[0], CAM.center[1]], z: -0.45, bore: 0.1, floor: -1.6 }),
        ...pedestal({ at: [WHEEL.center[0], WHEEL.center[1]], z: -0.45, bore: 0.09, floor: -2.2 }),
        // 連桿的方形導套與托著它的立柱
        ...squareGuide({ at: [1.0, 0, 0.13], width: 0.1, thickness: 0.06, length: 0.3 }),
        { kind: "box", size: [0.1, 1.4, 0.06], at: [1.0, -0.77, 0.13] },
        { kind: "box", size: [0.6, 0.12, 0.6], at: [1.0, -1.5, 0.13] },
      ],
    },
    { id: "cam", kind: "plate", center: CAM.center, shape: shape(OUTLINE, [circle(0.1).reverse()]), thickness: 0.2, hub: 0.25, mark: [0.6, 0], markSize: 0.06, spin: A + B, label: "C", labelOffset: [-0.95, 0, 0.3], pieces: [{ kind: "cylinder", radius: 0.1, length: 0.55, at: [0, 0, -0.25] }] },
    {
      id: "yoke",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2 * A + 0.5, 2.4), [rect(2 * A, 2.0).reverse()]), thickness: 0.18, at: [CAM.center[0], 0, -0.05] },
        { kind: "box", size: [0.5, 0.35, 0.3], at: [CAM.center[0] + A + 0.6, 0, 0] },
      ],
    },
    // 連桿(隨方框平移),末端的銷往後伸到棘爪那一層
    { id: "rod", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [1.6, 0], ROD_END], 0.1)), thickness: 0.06 }, { kind: "cylinder", radius: 0.03, length: 0.2, at: [ROD_END[0], ROD_END[1], -0.08] }] },
    { id: "pawl", kind: "plate", shape: shape(PAWL_OUTLINE), thickness: 0.06, arrow: false },
    { id: "axle", kind: "cylinder", center: [WHEEL.center[0], WHEEL.center[1], -0.15], radius: 0.09, length: 0.75 }, // 輪的固定軸(推斷)
    { id: "wheel", kind: "group", center: WHEEL.center, spin: WHEEL.r, pieces: [{ kind: "plate", shape: { ...ratchetShape(RATCHET), holes: [circle(0.1).reverse()] }, thickness: 0.15, circles: [0.8] }, { kind: "box", size: [0.15, 0.15, 0.2], at: [WHEEL.r - 0.4, 0, 0], accent: true }] },
  ],
  // 動力重演:只推凸輪(方框、連桿照模型走);棘爪鉸在連桿末端、靠自重搭在齒上,大輪只被棘爪推動
  replay: {
    to: -3 * PERIOD,
    seconds: 20,
    free: { pawl: { pivot: [...pinAt(0), 0], on: "rod" }, wheel: { hold: true, gravity: false } },
    ignore: [["wheel", "axle"]],
    expect: [
      { at: -PERIOD, part: "wheel", label: "方框往復一次,大輪被撥轉一下、又停住", quote: "將連續圓周運動轉換為間歇性圓周運動" },
      { part: "wheel", label: "往復三次,大輪朝同一方向一下一下轉" },
    ],
  },
  driver: { part: "cam", type: "rotation", speed: -0.8 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const i = intermittent(theta);
    const pin = pinAt(theta);
    return {
      parts: {
        cam: { angle: theta },
        yoke: { position: [i.x, 0, 0] },
        rod: { position: [ROD_X0 + i.x, 0, 0.13] },
        pawl: { position: [pin[0], pin[1], 0], angle: i.psi },
        wheel: { angle: i.abs }, // 逐步算出的絕對轉角(和爪的位置對得上)
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["cam", "yoke"], reason: "接合處的簡化畫法:凸輪在叉形框裡轉;框與凸輪前後錯開的量不夠,重疊 0.14" },
  ],
};
