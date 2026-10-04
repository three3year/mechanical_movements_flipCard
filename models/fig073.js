// 第 73 種:驅動輪 D 上固定一片彎曲的彈簧爪 B,平常靠自身彈力翹開、不碰棘輪 A 的齒;
// 強力彈簧 C 固定在左下的支座上,本身不動,從 D 外側繞過左邊、伸到 D 的盤面上方。
// D 轉動時 B 跟著繞圈,轉到左側時從 C 底下經過:C 把 B 往內壓,B 的尖端卡進 A 的一齒,
// A 與 D 暫時鎖在一起、被帶著走一齒(轉向與 D 相同);B 離開 C 的末端後彈回,放開 A,
// A 停住直到 D 再轉一圈。A 與 D 同軸,A 鬆套在軸上。主動件是 D(順時針,原圖箭頭)。
//
// 立體化:B 貼在 A 那一層、C 在上面一層,B 的彈簧條與固定座都從 C 底下通過;
// B 末端立一個凸起伸到 C 那一層,C 的內緣壓的是這個凸起(原圖 B 的末端較寬,畫成凸起)。
// B 的彎曲以「繞固定端擺動」近似。B 被壓下多少、A 被推多遠都由接觸算。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { ratchetShape, circle, shape, arcPoints, thickLine } from "./shapes.js";
import { placeOutline, swingUntilContact, polygonsOverlap, circlePolygon, withFall } from "./contact.js";

const D = { radius: 2.1 };
const A = { teeth: 12, outer: 1.45, inner: 1.1, dir: -1 };
const PITCH = TAU / A.teeth;

// 彈簧爪 B:固定端在 D 的右上方,沿輪緣往順時針方向伸出(轉動時尖端在前)
const B = { root: deg(80), tip: deg(8), radius: 1.85, width: 0.08, nose: 1.55, lug: 0.07 };
const PIVOT = polar(B.radius, B.root).slice(0, 2);
const local = (p) => [p[0] - PIVOT[0], p[1] - PIVOT[1]];
const STRIP = thickLine(arcPoints(B.radius, B.root, B.tip), B.width).map(local);
// 尖端往內彎的爪:前緣(順時針那一側)推 A 的齒面
const NOSE = [polar(B.radius, B.tip), polar(B.nose, B.tip), polar(B.nose, B.tip + deg(4)), polar(B.radius, B.tip + deg(7))].map((p) => local(p));
const LUG_AT = local(polar(B.radius, B.tip + deg(3)));
const LUG = circlePolygon(LUG_AT, B.lug, 12);
const FLEX = 0.35; // B 往內擺的上限(弧度)

// 強力彈簧 C 的內緣(世界座標的半徑隨方位角):從輪緣外斜壓進來,壓到最深後維持一段,在末端放開 B
const C = { start: deg(215), deep: deg(198), end: deg(162), out: deg(218), from: 1.92, to: 1.63, width: 0.16 };
const innerRadius = (a) => (a <= C.deep ? C.to : C.to + ((C.from - C.to) * (a - C.deep)) / (C.start - C.deep));
const CAM = (() => {
  const angles = Array.from({ length: 41 }, (_, i) => C.end + ((C.out - C.end) * i) / 40);
  return [...angles.map((a) => polar(innerRadius(a), a).slice(0, 2)), ...angles.reverse().map((a) => polar(innerRadius(a) + C.width, a).slice(0, 2))];
})();
// C 往輪緣外的那一段:順著內緣的方向彎下來,末端直直插在支座的側面
const LEG = (() => {
  const p0 = polar(innerRadius(C.out) + C.width / 2, C.out);
  const [p1, p2, p3] = [[p0[0] + 0.08, p0[1] - 0.3], [-1.82, -2.2], [-1.82, -2.6]];
  const curve = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    const w = [(1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3];
    return [0, 1].map((k) => w[0] * p0[k] + w[1] * p1[k] + w[2] * p2[k] + w[3] * p3[k]);
  });
  return thickLine([...curve, [-1.82, -3.0]], C.width);
})();
const SUPPORT = { center: [-2.555, -2.95, 0.1], size: [1.3, 0.8, 0.6] }; // 右側面貼著 C 的末端(x = −1.9)

const pivotAt = (d) => rot2(PIVOT, -d);

// D 順時針轉過 d:C 把 B 往內壓了多少(B 自由時為 0)
function pressedBy(d) {
  const base = -d;
  const reached = swingUntilContact({ pivot: pivotAt(d), outline: LUG, from: base - FLEX, into: 1, sweep: FLEX, steps: 24 }, [CAM]);
  return base - reached;
}

// 一圈的取樣表:B 離開 C 的末端後不是瞬間彈回,在 SNAP 這段主動量內加速彈回原位
const SAMPLES = 720;
const SNAP = deg(6);
const flexAt = (() => {
  const table = Array.from({ length: SAMPLES + 1 }, (_, i) => pressedBy((TAU * i) / SAMPLES));
  const resting = (d) => lookup(table, d);
  return withFall(resting, TAU, SNAP, SAMPLES);
})();

function lookup(table, d) {
  const u = ((d % TAU) + TAU) % TAU;
  const x = (u / TAU) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}

const TEETH = ratchetShape({ ...A, bore: 0.34 });
const noseAt = (d, flex) => placeOutline(NOSE, pivotAt(d), -d - flex);
const ratchetAt = (angle) => TEETH.outline.map((p) => rot2(p, angle));

// A 只被 B 的爪推著往順時針轉:每一步轉到剛好不和爪重疊為止,沒被推就停在原地
function pushRatchet(a, nose) {
  if (!polygonsOverlap(nose, ratchetAt(a))) return a;
  let lo = 0;
  let hi = 0.002;
  while (polygonsOverlap(nose, ratchetAt(a - hi)) && hi < 0.5) [lo, hi] = [hi, hi * 2];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (polygonsOverlap(nose, ratchetAt(a - mid))) lo = mid;
    else hi = mid;
  }
  return a - hi;
}

// 從任意的起始齒位走兩圈:第一圈之後每圈都是爪在同一處放開一齒(穩定),取第二圈當作週期
const { START, STEPS } = (() => {
  let a = 0;
  const run = [];
  for (let i = 0; i <= 2 * SAMPLES; i++) {
    const d = (TAU * i) / SAMPLES;
    a = pushRatchet(a, noseAt(d, flexAt(d)));
    run.push(a);
  }
  const start = run[SAMPLES];
  return { START: start, STEPS: run.slice(SAMPLES).map((x) => x - start) };
})();

/** D 順時針轉過 d:A 的轉角(順時針為負,自起始位置起算)與 B 被壓下的角度 */
export function motion(d) {
  const k = Math.floor(d / TAU);
  const step = STEPS[SAMPLES];
  return { a: k * step + lookup(STEPS, d), flex: flexAt(d) };
}
export const toothStep = PITCH;
/** 檢查用:D 轉過 d 時 B 的爪與 A 的齒形(世界座標 2D) */
export const contactAt = (d) => {
  const { a, flex } = motion(d);
  return { nose: noseAt(d, flex), ratchet: ratchetAt(START + a) };
};

export default {
  figure: 73,
  parts: [
    {
      id: "d",
      kind: "group",
      spin: D.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(D.radius)), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(circle(0.3)), thickness: 0.5, at: [0, 0, 0.1] }, // 軸(和 D 固定)
        // B 的固定座:在 B 的固定端後面,矮於 C 那一層
        { kind: "box", size: [0.3, 0.2, 0.18], at: [...polar(B.radius, B.root + deg(5)).slice(0, 2), 0.05], angle: B.root + deg(5) + Math.PI / 2, accent: true },
      ],
      label: "D",
      labelOffset: [-0.8, -1.6, 0.3],
    },
    {
      id: "b",
      kind: "group",
      center: [...PIVOT, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(STRIP), thickness: 0.12, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(NOSE), thickness: 0.12, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(LUG), thickness: 0.31, at: [0, 0, 0.265] },
      ],
    },
    { id: "labelB", kind: "group", label: "B", labelOffset: [0, 0, 0.3] }, // 標籤跟著 B 的中段
    {
      id: "a",
      kind: "plate",
      center: [0, 0, 0.06],
      shape: TEETH,
      thickness: 0.16,
      circles: [0.46],
      mark: [0.8, 0],
      markSize: 0.08,
      spin: A.outer,
      label: "A",
      labelOffset: [-0.05, 0.75, 0.3],
    },
    {
      id: "c",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(CAM), thickness: 0.16, at: [0, 0, 0.33] },
        { kind: "plate", shape: shape(LEG), thickness: 0.16, at: [0, 0, 0.33] },
      ],
      label: "C",
      labelOffset: [-1.85, 0.75, 0.4],
    },
    { id: "support", kind: "box", ...SUPPORT },
  ],
  // 動力重演:只推 D;B 繞固定端擺(彈簧往外推、翹開時靠在擋止上),A 靠摩擦定位,由 B 的爪推動
  replay: {
    from: 0,
    to: -TAU,
    free: {
      a: { hold: true, gravity: false },
      b: { pivot: [...PIVOT, 0], on: "d", spring: 1, gravity: false, limits: [-FLEX, 0] },
    },
    expect: [{ part: "a", label: "D 轉一圈,B 把 A 帶過一齒", quote: "會讓輪 A 保持靜止,直到 D 再旋轉一圈為止" }],
  },
  driver: { part: "d", type: "rotation", speed: -0.9 },
  target: "a", // 每圈被帶過一齒的棘輪 A
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { a, flex } = motion(-v);
    const label = rot2(polar(B.radius + 0.35, (B.root + B.tip) / 2), v);
    return {
      parts: { d: { angle: v }, b: { position: [...rot2(PIVOT, v), 0], angle: v - flex }, labelB: { position: [...label, 0.3] }, a: { angle: START + a } },
      readouts: [],
    };
  },
};
