// 第 415 種:P. Dickson 的專利裝置,把擺動變成朝任一方向的間歇圓周運動。擺動傳給槓桿 A,A 上側靠近輪 D 的軸處
// 以鉸鏈裝著兩個棘爪 B 與 C;A 上側的小曲柄 E 用繩子連到每一個棘爪。棘爪 C 貼著輪 D 的內緣時,輪朝一個方向轉,
// 此時棘爪 B 脫開;抬起作動中的 C、經曲柄 E 讓對面的 B 嚙合,輪 D 的轉向就反過來。
// 主動件是槓桿 A(由下方的拉桿往復擺動);狀態按鈕切換由 C 或 B 嚙合。
// 槓桿 A 中央是套在輪 D 軸上的圓轂(原圖),B、C 鉸在圓轂兩旁的耳上,曲柄 E 裝在圓轂上方的短柱上;
// 輪 D 只有一圈輪緣,棘爪長到輪緣內側(原圖),整根槓桿都在輪緣以內、輻板前面;拉桿在輪緣前面掃過。
// 一根繩從 B 經 E 到 C(原圖的虛線):E 朝被抬起的那一邊傾,那一側的繩拉直、把棘爪抬離輪緣,作動那側的繩鬆垂,繩長不變。
// 推斷:槓桿 A 繞輪 D 的軸擺動;棘爪是靠楔住內緣摩擦帶動的楔形爪:朝一邊擺時楔住、帶著輪轉,擺回來時滑過,輪停住。
import { deg, swingPhase, rot2, dist } from "./kit.js";
import { shape, circle, rect, thickLine, arcPoints } from "./shapes.js";

export const SWING = deg(18); // 槓桿擺動的半幅
const OUTER = 1.75; // 輪 D 的外緣
const RIM_IN = OUTER - 0.12; // 輪緣內側(棘爪貼著的那一圈)
const RIM_Z = 0.15; // 輪緣正面的 z
const HUB_HOLE = 0.085; // 槓桿圓轂的孔(輪軸半徑 0.08)
const PIVOT = { B: [-0.3, 0.12], C: [0.3, 0.12] };
const PIN = 0.05; // 棘爪鉸銷的半徑
const AIM = { B: deg(148), C: deg(32) }; // 棘爪從鉸銷指向輪緣的方向
const PAWL_W = 0.13;
const LIFT = deg(20); // 被繩子抬起的棘爪繞鉸銷轉開的角度
const E_AT = [0, 0.5];
const E_LEN = 0.22; // 曲柄 E 的長度
const E_TILT = deg(20); // 曲柄 E 朝被抬起那一邊傾的角度
const ATTACH = 0.6; // 繩繫在棘爪上的位置(從鉸銷到尖端的比例)
const SLACK = 0.1; // 繩比兩側都拉直時長出的量(作動那側鬆垂)
const STEM = -1.3; // 槓桿下端(接拉桿)
const ROD_Z = 0.24; // 拉桿在輪緣前面

/** 累計行程 v → 槓桿的轉角與輪 D 的轉角(C 嚙合:逆時針擺時帶著輪逆時針轉;B 嚙合時相反) */
export function motion(v, state = "C") {
  const span = 2 * SWING;
  const { at, forward, f } = swingPhase(v, -SWING, SWING);
  const k = Math.floor(v / span);
  let wheel;
  if (state === "C") wheel = span * Math.floor((k + 1) / 2) + (forward ? f * span : 0);
  else wheel = -span * (Math.floor(k / 2) + (forward ? 0 : f));
  return { lever: at, wheel, driving: state === "C" ? forward : !forward };
}

const unit = (a) => [Math.cos(a), Math.sin(a)];
// 一端有圓凸台(銷孔在原點)的臂:朝方向 a 伸 L、寬 w,尖端平的
const armOutline = (a, L, w, boss) => {
  const tip = [L * Math.cos(a), L * Math.sin(a)];
  const n = unit(a + Math.PI / 2);
  return [
    [tip[0] + (n[0] * w) / 2, tip[1] + (n[1] * w) / 2],
    [tip[0] - (n[0] * w) / 2, tip[1] - (n[1] * w) / 2],
    ...arcPoints(boss, a - Math.PI / 2, a - (3 * Math.PI) / 2),
  ];
};
// 棘爪(局部,鉸銷在原點):鉸銷周圍的圓凸台 + 往輪緣伸的臂,臂長取到尖端的角剛好落在輪緣內側(外形放到相碰)
export function pawlReach(side) {
  const P = PIVOT[side];
  const d = unit(AIM[side]);
  const n = [-d[1], d[0]];
  // 尖端的兩個角 P + d·L ± n·w 落在半徑 RIM_IN 的圓上:L² + 2 (q·d) L + |q|² − R² = 0,取先碰到的那個角
  const reach = (s) => {
    const q = [P[0] + s * n[0] * (PAWL_W / 2), P[1] + s * n[1] * (PAWL_W / 2)];
    const qd = q[0] * d[0] + q[1] * d[1];
    return -qd + Math.sqrt(qd * qd - (q[0] * q[0] + q[1] * q[1]) + RIM_IN * RIM_IN);
  };
  return Math.min(reach(1), reach(-1));
}
const pawlShape = (side) => shape(armOutline(AIM[side], pawlReach(side), PAWL_W, 0.1), [circle(PIN + 0.005).reverse()]);
const pawlPoint = (side, f) => {
  const L = pawlReach(side) * f;
  return [L * Math.cos(AIM[side]), L * Math.sin(AIM[side])];
};

// 鬆垂的繩:從 a 到 b、長度 length 的折線,往世界的下方垂
function sag(a, b, length, z) {
  const straight = dist(a, b);
  let lo = 0;
  let hi = Math.max(0.01, length);
  const curve = (s) => Array.from({ length: 13 }, (_, i) => {
    const u = i / 12;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - s * 4 * u * (1 - u), z];
  });
  const lengthOf = (pts) => pts.reduce((sum, q, i) => (i ? sum + dist(q, pts[i - 1]) : 0), 0);
  if (length <= straight + 1e-9) return [[a[0], a[1], z], [b[0], b[1], z]];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (lengthOf(curve(mid)) < length) lo = mid;
    else hi = mid;
  }
  return curve((lo + hi) / 2);
}

export default {
  figure: 415,
  parts: [
    {
      id: "wheel",
      kind: "group",
      label: "D",
      labelOffset: [1.25, -0.95, 0.3],
      spin: OUTER + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(OUTER), [circle(RIM_IN).reverse()]), thickness: 2 * RIM_Z, mark: [OUTER - 0.06, 0], markSize: 0.1 },
        { kind: "plate", shape: shape(circle(OUTER)), thickness: 0.04, at: [0, 0, -0.17] },
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      label: "A",
      labelOffset: [0.12, -0.95, 0.3],
      arrow: false,
      pieces: [
        // 圓轂(套在輪 D 的軸上)、兩旁裝鉸銷的耳、橫頭、往下的柄、往上的短柱(裝曲柄 E);都在同一層
        { kind: "plate", shape: shape(circle(0.2), [circle(HUB_HOLE).reverse()]), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[-0.36, 0.12], [0.36, 0.12]], 0.16)), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[-0.62, 0.05], [-0.4, -0.2], [0.4, -0.2], [0.62, 0.05]], 0.16)), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.16, 1.2, 0, -0.75)), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.07, 0.5, 0, 0.3)), thickness: 0.1 },
        { kind: "cylinder", radius: 0.07, length: 0.32, at: [0, STEM, 0.14] }, // 拉桿的銷(伸到輪緣前面)
        { kind: "cylinder", radius: PIN, length: 0.22, at: [PIVOT.B[0], PIVOT.B[1], 0.09] },
        { kind: "cylinder", radius: PIN, length: 0.22, at: [PIVOT.C[0], PIVOT.C[1], 0.09] },
        { kind: "cylinder", radius: 0.022, length: 0.22, at: [E_AT[0], E_AT[1], 0.09] }, // 曲柄 E 的銷
      ],
    },
    { id: "pawlB", posed: true, kind: "plate", shape: pawlShape("B"), thickness: 0.06, label: "B", labelOffset: [-0.15, 0.2, 0.2], arrow: false },
    { id: "pawlC", posed: true, kind: "plate", shape: pawlShape("C"), thickness: 0.06, label: "C", labelOffset: [0.15, 0.2, 0.2], arrow: false },
    { id: "crank", posed: true, kind: "plate", shape: shape(armOutline(0, E_LEN, 0.06, 0.045), [circle(0.025).reverse()]), thickness: 0.05, label: "E", labelOffset: [0, 0.22, 0.2], arrow: false, accent: true },
    { id: "cord", kind: "rope", radius: 0.012 },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  states: {
    initial: "C",
    options: [
      { id: "C", label: "C 嚙合" },
      { id: "B", label: "B 嚙合" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [-SWING, SWING], initial: SWING },
  target: "wheel",
  view: { direction: [0.05, 0.06, 1] },
  pose(v, state = "C") {
    const m = motion(v, state);
    const a = m.lever;
    const place = (p, z) => [...rot2(p, a), z];
    // 被抬起的棘爪繞自己的鉸銷轉開(C 逆時針、B 順時針,爪尖離開內緣)
    const lift = { B: state === "B" ? 0 : -LIFT, C: state === "C" ? 0 : LIFT };
    // 曲柄 E 從銷往上伸,朝被抬起的那一邊傾(拉直那邊的繩)
    const tilt = Math.PI / 2 + (state === "C" ? E_TILT : -E_TILT);
    const eTip = [E_AT[0] + E_LEN * Math.cos(tilt), E_AT[1] + E_LEN * Math.sin(tilt)];
    // 繩繫在棘爪上的點(槓桿座標)
    const tie = (side) => {
      const P = PIVOT[side];
      const q = rot2(pawlPoint(side, ATTACH), lift[side]);
      return [P[0] + q[0], P[1] + q[1]];
    };
    const CORD_Z = 0.14;
    const tieB = place(tie("B"), CORD_Z);
    const tieC = place(tie("C"), CORD_Z);
    const eTipW = place(eTip, CORD_Z);
    const taut = state === "C" ? dist(tieB, eTipW) : dist(tieC, eTipW);
    // 繩長固定:兩側都拉直時的長度(兩個狀態一樣,幾何左右對稱)再加鬆垂的量
    const slackLength = dist(tieB, eTipW) + dist(tieC, eTipW) + SLACK - taut;
    const cordPoints = state === "C" ? [tieB, ...sag(eTipW, tieC, slackLength, CORD_Z)] : [...sag(tieB, eTipW, slackLength, CORD_Z), tieC];
    const stem = place([0, STEM], ROD_Z);
    return {
      parts: {
        wheel: { angle: m.wheel },
        lever: { angle: a },
        pawlB: { position: place(PIVOT.B, 0.11), angle: a + lift.B },
        pawlC: { position: place(PIVOT.C, 0.11), angle: a + lift.C },
        crank: { position: place(E_AT, 0.14), angle: a + tilt },
        rod: { from: stem, to: [stem[0] + 2.6, stem[1], ROD_Z] },
      },
      paths: {
        cord: { points: cordPoints, closed: false, phase: 0 },
      },
      readouts: [{ label: "輪 D", value: m.driving ? (state === "C" ? "被帶著逆時針轉" : "被帶著順時針轉") : "停住(棘爪滑過)" }],
    };
  },
};
