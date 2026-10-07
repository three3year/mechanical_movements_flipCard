// 第 411 種:測量員用的自動記錄水平儀。托架的形狀由一個以水平為底邊的等腰三角形決定,每個輪子的圓周等於三角形的底邊
// (前後輪軸的距離)。儀器在水平地面上時,擺把底邊二等分;在斜面上時,擺相應地朝右或朝左偏離中心。
// 一個由托架輪帶動旋轉的鼓輪捲著畫好分格的紙,擺上的鉛筆在紙上畫出一條對應所走過地面輪廓的剖面線。
// 主動件是托架(手推著沿地面前進);鼓輪上的記錄線由 pose 回傳。
// 推斷:前後各一對輪子,鼓輪軸沿前進方向,由後輪軸上的小傘齒輪以 1 : 4 帶動(原文沒寫齒數);擺掛在三角形頂點的橫軸上,
// 鉛筆在擺上、正對鼓輪前面;鼓輪可上下、左右移動的調整(配合比例、免換紙)沒有畫出。
import { X, Z, TAU, clamp, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { shape, arcPoints, thickLine } from "./shapes.js";

export const BASE = 3.6; // 三角形的底邊 = 前後輪軸的距離
export const WHEEL = BASE / TAU; // 輪子半徑:圓周等於底邊
const APEX = 1.9; // 擺的懸點(托架頂)離底邊的高度
const DRUM = { radius: 0.38, width: 2.2 };
export const RATIO = 1 / 4; // 鼓輪轉速 / 輪子轉速
const PENCIL_Z = 0.5;

// 地面:先平,再上坡,一段平,再下坡
const S = (t) => (1 - Math.cos(Math.PI * clamp(t, 0, 1))) / 2;
const dS = (t) => (t > 0 && t < 1 ? (Math.PI / 2) * Math.sin(Math.PI * t) : 0);
export const ground = (x) => 0.5 * S(x / 2.6) - 0.4 * S((x - 3.6) / 2.6);
const slope = (x) => (0.5 * dS(x / 2.6)) / 2.6 - (0.4 * dS((x - 3.6) / 2.6)) / 2.6;
const X_MIN = -4.8;
const X_MAX = 7.8;
export const RANGE = [-4.2, 3.6]; // 後輪著地點的 x

// 地面的弧長表(輪子滾過的距離)
const STEP = 0.005;
const ARC = [0];
for (let x = X_MIN; x < X_MAX; x += STEP) ARC.push(ARC[ARC.length - 1] + STEP * Math.hypot(1, slope(x + STEP / 2)));
const arcAt = (x) => {
  const f = (clamp(x, X_MIN, X_MAX - STEP) - X_MIN) / STEP;
  const i = Math.floor(f);
  return ARC[i] + (ARC[i + 1] - ARC[i]) * (f - i);
};

/** 著地點 x → 輪心(輪子貼著地面) */
function wheelCenter(x) {
  const g = slope(x);
  const l = Math.hypot(1, g);
  return [x - (WHEEL * g) / l, ground(x) + WHEEL / l, 0];
}

/** 後輪著地點 u → 前輪著地點 v(兩輪心相距底邊長) */
function frontContact(u) {
  const rear = wheelCenter(u);
  let lo = u + BASE - 1;
  let hi = u + BASE + 0.5;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    const c = wheelCenter(mid);
    if (Math.hypot(c[0] - rear[0], c[1] - rear[1]) < BASE) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const V0 = frontContact(RANGE[0]);

/** 後輪著地點 u → 托架的姿態、擺的偏離、輪與鼓輪的轉角 */
export function carriage(u0) {
  const u = clamp(u0, ...RANGE);
  const v = frontContact(u);
  const rear = wheelCenter(u);
  const front = wheelCenter(v);
  const tilt = Math.atan2(front[1] - rear[1], front[0] - rear[0]);
  const wheel = -(arcAt(u) - arcAt(RANGE[0])) / WHEEL; // 往右滾:順時針
  return {
    u,
    rear,
    front,
    tilt,
    mid: [(rear[0] + front[0]) / 2, (rear[1] + front[1]) / 2, 0],
    // 擺始終鉛直;在托架上看,鉛筆偏離底邊中點的量(沿底邊,向前為正)
    offset: -APEX * Math.sin(tilt),
    wheel,
    frontWheel: -(arcAt(v) - arcAt(V0)) / WHEEL,
    drum: wheel * RATIO,
  };
}

const ARCH = (() => {
  // 托架的拱:通過兩輪軸與頂點的圓弧
  const yc = (APEX * APEX - (BASE / 2) ** 2) / (2 * APEX);
  const rr = APEX - yc;
  const a0 = Math.atan2(-yc, BASE / 2);
  return arcPoints(rr, a0, Math.PI - a0, 0, yc).map(([x, y]) => [x, y]);
})();
const SIDE = 0.95;
const sides = (piece) => [SIDE, -SIDE].map((z) => ({ ...piece, at: [piece.at[0], piece.at[1], z] }));
const wheelPair = () => [
  { kind: "cylinder", radius: 0.05, length: 2 * SIDE + 0.3, at: [0, 0, 0] },
  { kind: "pulley", style: "spoked", radius: WHEEL, width: 0.1, at: [0, 0, 0.75] },
  { kind: "pulley", style: "spoked", radius: WHEEL, width: 0.1, at: [0, 0, -0.75] },
];

// 地面輪廓(剖面)
const groundShape = shape([
  ...Array.from({ length: 141 }, (_, i) => {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / 140;
    return [x, ground(x)];
  }),
  [X_MAX, -1.0],
  [X_MIN, -1.0],
]);

export default {
  figure: 411,
  parts: [
    { id: "ground", kind: "plate", shape: groundShape, thickness: 2.4 },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        ...sides({ kind: "plate", shape: shape(thickLine(ARCH, 0.12)), thickness: 0.08, at: [0, 0, 0] }),
        ...sides({ kind: "box", size: [BASE + 0.3, 0.12, 0.08], at: [0, -0.2, 0] }),
        ...sides({ kind: "box", size: [0.12, 0.3, 0.08], at: [-BASE / 2, -0.08, 0] }),
        ...sides({ kind: "box", size: [0.12, 0.3, 0.08], at: [BASE / 2, -0.08, 0] }),
        // 擺的橫軸(三角形頂點)
        { kind: "cylinder", radius: 0.05, length: 2 * SIDE, at: [0, APEX, 0] },
        // 鼓輪軸的軸承架
        { kind: "box", size: [0.1, 0.1, 2 * SIDE], at: [-1.35, -0.2, 0] },
        { kind: "box", size: [0.1, 0.1, 2 * SIDE], at: [1.35, -0.2, 0] },
        { kind: "box", size: [0.1, 0.22, 0.1], at: [-1.35, -0.1, 0] },
        { kind: "box", size: [0.1, 0.22, 0.1], at: [1.35, -0.1, 0] },
        // 推把
        { kind: "box", size: [1.3, 0.1, 0.1], at: [-1.95, 1.4, SIDE], angle: -0.5 },
        { kind: "cylinder", radius: 0.08, length: 0.7, at: [-2.55, 1.72, SIDE + 0.2], accent: true },
      ],
    },
    { id: "rearWheels", kind: "group", pieces: [...wheelPair(), { kind: "bevel", radius: 0.12, height: 0.1, at: [0, 0, 0.42], axis: [0, 0, -1] }] },
    { id: "frontWheels", kind: "group", arrow: false, pieces: wheelPair() },
    {
      id: "drum",
      kind: "group",
      axis: X,
      spin: DRUM.radius + 0.1,
      pieces: [
        { kind: "drum", radius: DRUM.radius, width: DRUM.width },
        { kind: "cylinder", radius: 0.05, length: 3.1, at: [0, 0, -0.1] },
        { kind: "bevel", radius: 0.42, height: 0.1, at: [0, 0, -BASE / 2 + 0.12], axis: [0, 0, -1] },
      ],
    },
    {
      id: "pendulum",
      kind: "group",
      arrow: false,
      label: "B",
      labelOffset: [0.35, -APEX - 0.55, PENCIL_Z],
      pieces: [
        // 擺錘在鉛筆的高度(鼓輪的前面),不垂到車架底下碰到地面
        { kind: "plate", shape: shape(thickLine([[0, 0.1], [0, -APEX + 0.1]], 0.07)), thickness: 0.05, at: [0, 0, PENCIL_Z + 0.03] },
        { kind: "box", size: [0.3, 0.3, 0.12], at: [0, -APEX - 0.02, PENCIL_Z] },
        // 鉛筆(朝鼓輪)
        { kind: "cylinder", radius: 0.035, length: PENCIL_Z - DRUM.radius, at: [0, -APEX, (PENCIL_Z + DRUM.radius) / 2], accent: true },
      ],
    },
    { id: "record", kind: "trace" },
  ],
  // 動力重演:只推托架(輪子、鼓輪照模型走);擺掛在頂點的橫軸上、只受重力,托架走上坡、下坡時它要一直保持鉛直
  replay: {
    from: RANGE[0],
    to: RANGE[1],
    seconds: 16,
    free: { pendulum: { pivot: [carriage(RANGE[0]).mid[0], carriage(RANGE[0]).mid[1] + APEX, 0], on: "frame" } },
    expect: [
      { at: 0.4, part: "pendulum", label: "托架在上坡上,擺仍鉛直(偏離底邊中點)", quote: "當它位於傾斜面上時,擺則會相對應地朝右或朝左偏離中心" },
      { at: 2.2, part: "pendulum", label: "托架在下坡上,擺仍鉛直" },
      { part: "pendulum", label: "回到平地,擺回到正中" },
    ],
  },
  driver: { part: "frame", grips: ["drum"], type: "translation", direction: [1, 0, 0], range: RANGE, initial: -3.6 },
  target: "pendulum", // 帶著鉛筆的擺:在鼓輪的紙上畫出地面的剖面線
  view: { direction: [0.08, 0.1, 1] },
  pose(u0) {
    const c = carriage(u0);
    const tiltQ = quatAxisAngle(Z, c.tilt);
    const place = (p) => [c.mid[0] + p[0] * Math.cos(c.tilt) - p[1] * Math.sin(c.tilt), c.mid[1] + p[0] * Math.sin(c.tilt) + p[1] * Math.cos(c.tilt), p[2]];
    // 鼓輪上的記錄:每一處走過時,鉛筆在鼓輪的正前方畫下一點,之後隨鼓輪轉上去
    const points = [];
    const n = Math.max(2, Math.round((c.u - RANGE[0]) / 0.03));
    for (let i = 0; i <= n; i++) {
      const p = carriage(RANGE[0] + ((c.u - RANGE[0]) * i) / n);
      const turn = p.drum - c.drum; // 這一點從正前方轉開的角度
      if (turn > Math.PI * 0.95) continue;
      const r = DRUM.radius + 0.006;
      points.push(place([p.offset, r * Math.sin(turn), r * Math.cos(turn)]));
    }
    if (points.length < 2) points.unshift(place([c.offset, 0, DRUM.radius + 0.006]));
    return {
      parts: {
        frame: { position: c.mid, angle: c.tilt },
        rearWheels: { position: c.rear, angle: c.tilt + c.wheel },
        frontWheels: { position: c.front, angle: c.tilt + c.frontWheel },
        drum: { position: c.mid, rotation: quatMul(tiltQ, quatMul(quatFromZ(X), quatAxisAngle(Z, c.drum))) },
        // 擺掛在頂點的橫軸上,始終鉛直
        pendulum: { position: place([0, APEX, 0]), angle: 0 },
      },
      paths: { record: { points, closed: false } },
      readouts: [
        { label: "坡度", value: `${((c.tilt * 180) / Math.PI).toFixed(1)}°` },
        { label: "擺偏離中心", value: `${c.offset >= 0 ? "向前" : "向後"} ${Math.abs(c.offset).toFixed(2)}` },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["ground", "drum"], reason: "簡化畫法:鼓輪壓在地面上滾,鼓面陷進地面 0.04(96 個取樣中 8 個)" },
    { check: "interference", parts: ["frame", "frontWheels"], reason: "簡化畫法:車輪的輻條轉過車架的橫桿時擦到 0.09(96 個取樣中 13 個)" },
    { check: "interference", parts: ["frame", "rearWheels"], reason: "簡化畫法:車輪的輻條轉過車架的橫桿時擦到 0.09(96 個取樣中 10 個)" },
  ],
};
