// 第 280 種:操作絞盤的一種方式。右邊的長手動槓桿繞上端的樞軸來回扳動,經連桿帶動短槓桿;短槓桿以銷裝在
// 一個鑄鐵塊上,鐵塊的兩個夾爪以凸緣扣住輪緣內側。短槓桿外端往上時,輪緣被夾在槓桿末端與鐵塊凸緣之間,
// 摩擦力帶著輪轉;短槓桿往下推時鬆開,鐵塊沿輪緣滑回去。輪的倒轉由一般的棘輪與棘爪擋住。
// 主動件是長手動槓桿(累計行程:往上那一程帶輪轉,往下那一程輪不動)。
// 止回爪(由接觸算,共用 pawl-drive.js):爪鉸在輪右上方的銷上,靠自重搭在棘輪上;輪往前轉時爪被齒背頂起,
// 越過齒尖後加速落回下一格,輪往回就被擋住。
// 動力重演只驗止回爪:輪是靠夾具的摩擦帶動(重演引擎做不出夾緊的摩擦),照模型的姿勢轉。
// 推斷:各桿長與夾爪的位置(依原圖);短槓桿夾緊時多轉的小角度;棘輪的齒數(每程剛好兩齒);
// 輪軸與軸承座、止回爪樞軸銷的支架(原圖沒畫)。
import { TAU, deg, swingPhase } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { ratchetObstacles } from "./ratchets.js";
import { pawlDrive } from "./pawl-drive.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const C = [-1.15, -0.55, 0]; // 輪心
const RIM = 1.4;
const SHORT = 0.95; // 短槓桿從鐵塊上的銷到外端
const T = [1.55, 2.25, 0]; // 長槓桿的樞軸
const DL = 2.5; // 樞軸到連桿接點
const LONG = 4.1;
const FROM = deg(-26);
const TO = deg(4); // 鐵塊在輪緣上來回的角度範圍(從輪心量)
const GRIP = deg(4); // 夾緊時短槓桿多轉的角度
const RATCHET = { teeth: 24, outer: 0.62, inner: 0.48, dir: 1 }; // 每程 30°,剛好兩齒
const PAWL = { pivot: [C[0] + 1.0, C[1] + 0.8, 0.3], length: 0.8 }; // 樞軸在輪的右上,爪往左下搭在棘輪上(輪往前轉時爪尖被拖著走)
// 止回爪(局部座標:原點在樞軸,沿 +x):細桿,尖端削成斜面
const PAWL_OUTLINE = [[-0.06, -0.05], [PAWL.length - 0.08, -0.05], [PAWL.length, 0.02], [PAWL.length - 0.06, 0.05], [-0.06, 0.05]];

const shortEnd = (phi, grip) => {
  const pin = [C[0] + RIM * Math.cos(phi), C[1] + RIM * Math.sin(phi), 0];
  const a = phi + grip;
  return { pin, end: [pin[0] + SHORT * Math.cos(a), pin[1] + SHORT * Math.sin(a), 0], angle: a };
};
const LINK = 1.6;

/** 主動量 v(鐵塊沿輪緣的累計行程)→ 鐵塊位置角、輪的轉角、短槓桿與長槓桿的姿勢 */
export function capstan(v) {
  const { at, cycle, forward } = swingPhase(v, FROM, TO);
  const span = TO - FROM;
  const wheel = cycle * span + (forward ? at - FROM : span);
  const grip = forward ? GRIP : 0;
  const s = shortEnd(at, grip);
  const joint = circleCircle(T, DL, s.end, LINK, 1).point;
  return { block: at, wheel, forward, short: s, joint, long: angleOf(T, joint) };
}
export const geometry = { FROM, TO, pitch: TAU / RATCHET.teeth };

const SPAN = TO - FROM;
const check = pawlDrive({
  period: 2 * SPAN,
  pins: () => ({ pawl: PAWL.pivot.slice(0, 2) }),
  wheel: { obstacles: (w) => ratchetObstacles(RATCHET, w, C), angle: (v) => capstan(v).wheel, dir: RATCHET.dir, pitch: TAU / RATCHET.teeth },
  // 爪靠自重往下擺(逆時針),尖端搭在棘輪上
  pawls: { pawl: { outline: PAWL_OUTLINE, into: 1, angle: deg(195), limits: [deg(160), deg(250)] } },
});
// 第一程裡爪落得最深的那一刻(動力重演的中途事件)
const PEAK = (() => {
  let best = { a: -Infinity, v: 0 };
  for (let i = 0; i <= 200; i++) {
    const v = (i * SPAN) / 200;
    const a = check.at(v).angles.pawl;
    if (a > best.a) best = { a, v };
  }
  return best.v;
})();
/** 主動量 v:止回爪的轉角 */
export const pawlAngle = (v) => check.at(v).angles.pawl;
/** 檢查用:止回爪與棘輪的齒(世界座標 2D) */
export const contactAt = (v) => {
  const s = check.shapes(v);
  return { pawl: s.pawls.pawl, teeth: s.wheel };
};

const wheelPieces = [
  { kind: "cylinder", radius: RIM + 0.12, inner: RIM - 0.08, length: 0.42 },
  { kind: "plate", shape: shape(circle(RIM - 0.05), [circle(0.25).reverse()]), thickness: 0.12, at: [0, 0, -0.12] },
  { kind: "cylinder", radius: 0.3, length: 0.6 },
  { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.12 }), thickness: 0.14, at: [0, 0, 0.3] },
  { kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.6] }, // 輪軸,往後穿過軸承座
];

export default {
  figure: 280,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.42, 5.2, 0.4], at: [1.2, -0.2, -0.45] },
        { kind: "box", size: [0.42, 5.2, 0.4], at: [-0.35, -0.2, -0.75] },
        { kind: "plate", shape: shape(thickLine([[-0.35, 1.6], [1.2, 2.55]], 0.3)), thickness: 0.3, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [T[0], T[1], -0.24] },
        { kind: "cylinder", radius: 0.03, length: 0.22, at: [PAWL.pivot[0], PAWL.pivot[1], 0.34] }, // 止回爪的樞軸銷(在輪緣的前面)
        // 樞軸銷的支架:從銷往右伸出輪外,再由立柱撐到地面
        { kind: "box", size: [0.7 - PAWL.pivot[0] + 0.1, 0.14, 0.1], at: [(PAWL.pivot[0] + 0.7) / 2, PAWL.pivot[1], 0.5] },
        { kind: "box", size: [0.16, PAWL.pivot[1] + 2.8, 0.1], at: [0.7, (PAWL.pivot[1] - 2.8) / 2, 0.5] },
        { kind: "box", size: [5.6, 0.12, 2.0], at: [-1.0, -2.86, -0.3] }, // 底座
        // 輪軸的軸承座(在輪的後面)
        ...pedestal({ at: C, z: -1.0, bore: 0.12, floor: -2.8 }),
      ],
    },
    { id: "wheel", kind: "group", center: C, spin: RIM + 0.12, pieces: [...wheelPieces, { kind: "box", size: [0.2, 0.2, 0.46], at: [RIM + 0.02, 0, 0], accent: true }] },
    { id: "pawl", kind: "plate", center: PAWL.pivot, shape: shape(PAWL_OUTLINE, [circle(0.04).reverse()]), thickness: 0.1, arrow: false },
    {
      id: "block",
      kind: "group",
      arrow: false,
      pieces: [
        // 鑄鐵塊:跨在輪緣上,兩個夾爪的凸緣扣住輪緣內側(局部 +x 朝輪外)
        { kind: "box", size: [0.3, 0.42, 0.5], at: [0.28, 0, 0] }, // 鐵塊的本體在輪緣外側,兩片爪跨在輪緣兩面
        { kind: "box", size: [0.12, 0.42, 0.16], at: [-0.28, 0, 0.28] },
        { kind: "box", size: [0.12, 0.42, 0.16], at: [-0.28, 0, -0.28] },
      ],
    },
    { id: "short", kind: "link", width: 0.14, thickness: 0.08 },
    { id: "link", kind: "link", width: 0.1, thickness: 0.06 },
    {
      id: "long",
      kind: "group",
      center: T,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [LONG - 0.6, 0]], 0.16), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, 0.28] },
        { kind: "lathe", axis: [1, 0, 0], profile: [[0.06, 0], [0.13, 0.15], [0.1, 0.6], [0, 0.65]], at: [LONG - 0.62, 0, 0.28] },
      ],
    },
  ],
  // 動力重演:只驗止回爪(輪由夾具的摩擦帶動,照模型的姿勢轉);爪鉸在銷上,靠自重搭在棘輪上
  replay: {
    to: 4 * SPAN,
    seconds: 16,
    free: { pawl: {} },
    expect: [
      // 中途:爪被齒背頂起、越過齒尖後落得比停著時深(擺動只有幾度,容許誤差收小,爪不動就不會通過)
      { at: PEAK, part: "pawl", label: "爪越過齒尖,落進齒間", tolerance: 0.03 },
      { at: 2 * SPAN, part: "pawl", label: "輪轉過兩齒,止回爪越過齒尖落回齒間", quote: "輪的向後移動則由一般的棘輪與棘爪機構所阻止" },
      { at: 4 * SPAN, part: "pawl", label: "再一個來回,爪又落回齒間" },
    ],
  },
  driver: { part: "long", type: "rotation", cycle: [FROM, TO] },
  target: "wheel", // 被夾著一步步轉的絞盤輪
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const c = capstan(v);
    return {
      parts: {
        wheel: { angle: c.wheel },
        block: { position: [c.short.pin[0], c.short.pin[1], 0.0], angle: c.block },
        short: { from: [...c.short.pin.slice(0, 2), 0.3], to: [...c.short.end.slice(0, 2), 0.3] },
        link: { from: [...c.short.end.slice(0, 2), 0.38], to: [c.joint[0], c.joint[1], 0.38] },
        long: { angle: c.long },
        pawl: { angle: pawlAngle(v) },
      },
      readouts: [],
    };
  },
};
