// 第 321 種:哈里森(Harrison)的維持動力。捲繩筒 B 上的小棘輪由制動爪 R 扣在較大的棘輪上,較大的棘輪再經
// 彈簧 S、S' 與主輪 G 相連。時鐘走時,重物經捲繩筒、棘輪與彈簧推動主輪 G;上發條時重物的拉力被移除,
// 裝在框架上的制動爪 T 擋住較大的棘輪不讓它被彈簧拉回,於是在上發條的這段時間裡,彈簧 S、S' 繼續推動主輪,
// 時鐘照走。上完之後重物再度拉緊彈簧,較大的棘輪追回原來的位置。
// 主動件是虛擬的「進程」:每一輪前段時鐘照走,中段上發條(捲繩筒倒轉、重物上升),後段重物重新拉緊彈簧。
// 推斷:各段所佔的進程、彈簧的變形量;齒數依原圖。
import { TAU, deg, smooth, clamp } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";
import { pawlRest } from "./ratchets.js";

const RATE = TAU / 4; // 每一輪主輪轉過的角度
const P = { run: 0.7, wound: 0.85 }; // 0–0.7 照走、0.7–0.85 上發條、0.85–1 重新拉緊
const SPRING = deg(14); // 平時彈簧被拉開的角度(較大的棘輪領先主輪)
const DRUM = 0.45;
const BIG = { teeth: 24, outer: 1.55, inner: 1.38, dir: -1 };
const SMALL = { teeth: 14, outer: 0.72, inner: 0.58, dir: 1 };
const T_PIVOT = [2.6, 2.05, 0.3];

/** 進程 p → 主輪 G、較大的棘輪、捲繩筒的轉角(順時針為負),與重物的高度 */
export function harrison(p) {
  const k = Math.floor(p);
  const f = p - k;
  const g = -RATE * p; // 主輪一直轉
  // 較大的棘輪:照走時領先主輪 SPRING;上發條時被 T 擋住不動;之後由重物拉緊彈簧、追回原來的位置
  const held = -RATE * (k + P.run) - SPRING;
  let big;
  if (f < P.run) big = g - SPRING;
  else if (f < P.wound) big = held;
  else big = held + (g - SPRING - held) * smooth((f - P.wound) / (1 - P.wound));
  // 捲繩筒:照走時跟著較大的棘輪;上發條時倒轉(逆時針),把一輪走掉的繩捲回來
  const wind = RATE * (k + smooth(clamp((f - P.run) / (P.wound - P.run), 0, 1)));
  const drum = big + wind;
  const spring = big - g; // 彈簧拉開的角度(負值越大越緊)
  return { g, big, drum, spring, weight: -1.8 + DRUM * (drum - (-SPRING)) };
}
export const geometry = { SPRING, RATE, P };

const gearRing = { kind: "gear", teeth: 48, radius: 2.05, width: 0.12 };

export default {
  figure: 321,
  parts: [
    {
      id: "arbor",
      kind: "cylinder",
      radius: 0.06,
      length: 0.9, // 各輪共用的固定心軸(推斷)
    },
    {
      id: "wheelG",
      kind: "group",
      spin: 2.15,
      label: "G",
      labelOffset: [1.6, -1.2, 0.3],
      pieces: [
        { ...gearRing, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(circle(1.85), [circle(1.65).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        { kind: "box", size: [3.4, 0.1, 0.06], at: [0, 0, -0.2], angle: deg(30) },
      ],
    },
    {
      id: "bigRatchet",
      kind: "group",
      spin: 1.55,
      pieces: [
        { kind: "plate", shape: { ...ratchetShape(BIG), holes: [circle(1.25).reverse()] }, thickness: 0.1 },
        { kind: "box", size: [2.6, 0.1, 0.06], angle: deg(-40) },
        // 制動爪 R:扣在捲繩筒的小棘輪上
        { kind: "plate", shape: shape(thickLine([[0.95, -0.6], [0.6, -0.55], [0.45, -0.62]], 0.08)), thickness: 0.06, at: [0, 0, 0.12] },
      ],
      label: "R",
      labelOffset: [0.6, -0.95, 0.3],
    },
    {
      id: "drumB",
      kind: "group",
      spin: SMALL.outer,
      label: "B",
      labelOffset: [0, 0.3, 0.4],
      pieces: [
        { kind: "plate", shape: ratchetShape({ ...SMALL, bore: 0.08 }), thickness: 0.12, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: DRUM, length: 0.4, at: [0, 0, 0.35] },
        { kind: "box", size: [0.18, 0.18, 0.06], at: [0, 0, 0.58] },
      ],
    },
    { id: "springS", kind: "spring", coils: 6, radius: 0.09, wire: 0.02, label: "S", labelOffset: [0, 0.3, 0.2] },
    { id: "springS2", kind: "spring", coils: 6, radius: 0.09, wire: 0.02, label: "S'", labelOffset: [-0.3, 0, 0.2] },
    { id: "clickT", kind: "plate", shape: shape(thickLine([[0, 0], [-1.05, -0.35], [-1.15, -0.55]], 0.08)), thickness: 0.06, arrow: false, label: "T", labelOffset: [0.3, 0.15, 0.2] },
    { id: "frame", kind: "group", pieces: [{ kind: "cylinder", radius: 0.08, length: 0.4, at: T_PIVOT }, { kind: "plate", shape: shape(thickLine([[T_PIVOT[0], T_PIVOT[1]], [T_PIVOT[0] - 0.7, T_PIVOT[1]]], 0.1)), thickness: 0.06, at: [0, 0, 0.3] }] },
    { id: "rope", kind: "rope" },
    { id: "weight", kind: "box", size: [0.9, 0.6, 0.5] },
  ],
  powered: ["weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.08 },
  target: "wheelG", // 上發條時照走的主輪
  view: { direction: [0.03, 0.04, 1] },
  pose(p) {
    const h = harrison(p);
    // 彈簧:一端在較大的棘輪上、一端在主輪上
    const onBig = (a, r) => [r * Math.cos(a + h.big), r * Math.sin(a + h.big), 0.05];
    const onG = (a, r) => [r * Math.cos(a + h.g), r * Math.sin(a + h.g), -0.12]; // 彈簧的另一端扣在後面一層的主輪 G 上
    const t = pawlRest({ pivot: T_PIVOT, length: Math.hypot(1.15, 0.55), from: deg(160), into: 1, sweep: 1.0 }, { center: [0, 0], angle: h.big, ...BIG });
    const ropeX = DRUM; // 繩從捲繩筒右側垂下:筒順時針轉時重物下降
    return {
      parts: {
        wheelG: { angle: h.g },
        bigRatchet: { angle: h.big },
        drumB: { angle: h.drum },
        springS: { from: onBig(deg(110), 1.05), to: onG(deg(110) + deg(28), 1.45) },
        springS2: { from: onBig(deg(200), 1.05), to: onG(deg(200) + deg(28), 1.45) },
        clickT: { position: T_PIVOT, angle: t.angle - Math.atan2(-0.55, -1.15) },
        weight: { position: [ropeX, h.weight - 0.3, 0.35] },
      },
      paths: { rope: { points: [[ropeX, 0, 0.35], [ropeX, h.weight, 0.35]], closed: false, phase: -h.weight } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["clickT", "frame"], reason: "止回爪的軸眼比機架上的樞軸銷小(軸眼畫得小),銷伸進爪 0.08" },
    { check: "interference", parts: ["bigRatchet", "springS2"], reason: "彈簧的一端扣在大棘輪上:彈簧的端圈伸進棘輪 0.07" },
    { check: "interference", parts: ["bigRatchet", "springS"], reason: "彈簧的一端扣在大棘輪上:彈簧的端圈伸進棘輪 0.07" },
  ],
};
