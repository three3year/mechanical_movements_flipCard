// 第 490 種:普通的操舵裝置(平面圖)。舵輪的軸上有一個鼓輪,繞著一條繩;繩經過導引滑輪,兩端接到舵柄(舵頂上的槓桿)。
// 轉動舵輪時,繩的一端被捲進、另一端放出,舵柄便依舵輪轉的方向擺向一側。
// 主動件是舵輪。
// 推斷:鼓輪在左、舵柄在右,上下各一個導引滑輪。繩是一整條:從舵柄端往上繞過上方滑輪、往下到鼓輪,在鼓輪上繞兩圈,
// 再往下繞過下方滑輪回到舵柄端。鼓輪的軸沿 x(平面圖上舵輪是側面),繩在鼓輪朝上(+z)的那一面切線離開,
// 兩段繩都從鼓輪正上方(沿 y)走到滑輪,所以滑輪在鼓輪的上下兩側;轉舵輪時鼓面往 −y 走,上段捲進、下段放出。
// 鼓輪上繩離開的位置照畫成固定(實物上繩會沿鼓輪橫移一點,忽略)。
// 舵柄端繞舵頭畫圓,兩段繩加起來的長度一般會隨擺角變;導引滑輪放在讓繩從滑輪下來幾乎順著舵柄端的圓走的位置
// (舵柄居中時兩段繩都差不多垂直接到舵柄端),兩段繩的總長在擺角 ±32° 內差不到 0.2%(決定 2026-10-20 (a);
// 原圖滑輪在鼓輪上下、舵柄端在滑輪右邊,照原圖排的話擺到 32° 下段繩要被拉長 13%:實物可行優先於插圖外形)。
// 舵柄的擺角由兩段繩一起解:上段捲進、下段放出各是 鼓輪上繩的半徑 × 轉角,兩段的長度差決定擺角。
// 推斷的支撐:甲板,舵輪軸架在兩個軸承座上,每個導引滑輪的軸頭插在支架的軸承環裡,舵柄套在舵桿的方頭上,
// 舵桿穿過甲板、甲板上有軸承。
import { X, Z, deg, routeRope } from "./kit.js";
import { solve } from "./linkage.js";
import { shape, circle, rect, stadium, spanBox } from "./shapes.js";

const ROPE_R = 0.02;
const DRUM = { center: [-0.8, 0, -0.3], r: 0.28, length: 0.4 };
const WIND = DRUM.r + ROPE_R; // 鼓輪上繩的中心線半徑(繩在鼓輪朝上那一面的 z = 0 離開)
const TURNS = 2; // 繩在鼓輪上繞的圈數
const LEAVE = [DRUM.center[0] - 0.06, DRUM.center[0] + 0.06]; // 上、下段繩離開鼓輪處的 x(繞兩圈,每圈橫移 0.06)
const PULLEY_R = 0.2;
const SHEAVE = PULLEY_R + ROPE_R; // 繩繞滑輪的中心線半徑
const H = 1.35; // 導引滑輪離鼓輪軸的距離(照原圖)
// 繩從鼓輪垂直往上(下)接到滑輪的左側,繞過滑輪從右側下來
const PULLEYS = [[LEAVE[0] + SHEAVE, H, 0], [LEAVE[1] + SHEAVE, -H, 0]];
export const TILLER = 1.6;
const TIP0 = DRUM.center[0] + 2 * SHEAVE - 0.13; // 舵柄居中時舵柄端的 x(兩段繩的總長在 ±32° 內變得最少的位置)
export const RUDDER = [TIP0 + TILLER, 0, 0]; // 舵頭(舵柄的支點)
export const MAX = deg(32);
const STOCK_R = 0.1; // 舵桿半徑
const DECK = -1.6; // 甲板頂面
const SHAFT = { r: 0.05, x0: DRUM.center[0] - 1.5, x1: DRUM.center[0] + 0.5 }; // 舵輪軸
const BEARINGS = [DRUM.center[0] - 0.45, DRUM.center[0] + 0.38]; // 兩個軸承座的 x

const tillerEnd = (psi) => [RUDDER[0] - TILLER * Math.cos(psi), RUDDER[1] + TILLER * Math.sin(psi), 0];
const sheave = (P) => ({ circle: { center: P, axis: Z, radius: SHEAVE, sense: 1 } });
/** 舵柄擺角 psi → 上段(舵柄端 → 上方滑輪 → 鼓輪)、下段(鼓輪 → 下方滑輪 → 舵柄端)兩段繩的路徑 */
function runs(psi) {
  const T = tillerEnd(psi);
  return [routeRope([{ point: T }, sheave(PULLEYS[0]), { point: [LEAVE[0], 0, 0] }]), routeRope([{ point: [LEAVE[1], 0, 0] }, sheave(PULLEYS[1]), { point: T }])];
}
/** 舵柄擺角 psi → 上、下兩段繩(舵柄端到鼓輪)的長度 */
export const ropes = (psi) => runs(psi).map((r) => r.length);
const gap = (psi) => {
  const [top, bottom] = ropes(psi);
  return top - bottom;
};
const GAP0 = gap(0);
/** 舵輪轉 theta → 舵柄擺角:上段捲進、下段放出各 WIND × theta,兩段的長度差少了 2 × WIND × theta */
export const tiller = (theta) => solve(gap, GAP0 - 2 * WIND * theta, -MAX, MAX);
export const RANGE = [(GAP0 - gap(-MAX)) / (2 * WIND), (GAP0 - gap(MAX)) / (2 * WIND)];

// 鼓輪上的繩:從朝上那一面(z = 0)開始,往 −y 繞 TURNS 圈,同時沿 x 從上段離開處移到下段離開處
const coil = Array.from({ length: 24 * TURNS + 1 }, (_, i) => {
  const phi = (-i / 24) * Math.PI * 2;
  return [LEAVE[0] + ((LEAVE[1] - LEAVE[0]) * i) / (24 * TURNS), WIND * Math.sin(phi), DRUM.center[2] + WIND * Math.cos(phi)];
});

// 舵柄:兩端圓頭的長條,從舵頭(局部原點)沿 −x 到舵柄端(逆時針輪廓)
const tillerShape = (() => {
  const s = stadium(TILLER, 0.16);
  return shape(s.outline.map(([x, y]) => [-x, y]).reverse());
})();

export default {
  figure: 490,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 甲板(推斷),舵桿穿過的孔
        { kind: "plate", shape: shape(rect(4.4, 4.6, -0.5, 0), [circle(STOCK_R, RUDDER[0], RUDDER[1]).reverse()]), thickness: 0.1, at: [0, 0, DECK - 0.05] },
        // 舵輪軸的兩個軸承座(推斷):立在甲板上的座,頂上是軸承環
        ...BEARINGS.flatMap((x) => [
          spanBox(x - 0.05, x + 0.05, -0.1, 0.1, DECK, DRUM.center[2] - 0.12),
          { kind: "cylinder", radius: 0.13, inner: SHAFT.r, length: 0.1, axis: X, at: [x, 0, DRUM.center[2]] },
        ]),
        // 導引滑輪的支架(推斷):立柱、伸到滑輪下的臂、臂上的軸承環(滑輪的軸頭插在環裡)
        ...PULLEYS.flatMap(([x, y]) => {
          const s = Math.sign(y);
          return [
            spanBox(x - 0.07, x + 0.07, y + s * 0.55 - 0.07, y + s * 0.55 + 0.07, DECK, -0.14),
            { kind: "plate", shape: shape(rect(0.16, 0.71, x, y + s * 0.3)), thickness: 0.06, at: [0, 0, -0.11] },
            { kind: "cylinder", radius: 0.07, inner: 0.035, length: 0.025, at: [x, y, -0.0675] },
          ];
        }),
        // 舵桿在甲板上的軸承(推斷)
        { kind: "cylinder", radius: 0.22, inner: STOCK_R, length: 0.2, at: [RUDDER[0], RUDDER[1], DECK + 0.1] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      axis: X,
      center: DRUM.center,
      spin: 1.0,
      pieces: [
        { kind: "cylinder", radius: DRUM.r, length: DRUM.length },
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.x1 - SHAFT.x0, at: [0, 0, (SHAFT.x0 + SHAFT.x1) / 2 - DRUM.center[0]], role: "shaft" },
        // 舵輪(在左端,平面圖上看是側面)與把手
        { kind: "cylinder", radius: 0.9, inner: 0.82, length: 0.08, at: [0, 0, -1.3] },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [1.7, 0.05, 0.05], at: [0, 0, -1.3], angle: (k * Math.PI) / 4, ...(k === 0 ? { accent: true } : {}) })),
        ...Array.from({ length: 8 }, (_, k) => ({ kind: "cylinder", radius: 0.04, length: 0.25, axis: [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4), 0], at: [1.02 * Math.cos((k * Math.PI) / 4), 1.02 * Math.sin((k * Math.PI) / 4), -1.3] })),
      ],
    },
    // 兩個導引滑輪:繩都繞在外側,轉向相同
    ...PULLEYS.map((P, k) => ({ id: `pulley${k}`, kind: "pulley", style: "disc", center: P, radius: PULLEY_R, width: 0.1 })),
    {
      id: "tiller",
      kind: "plate",
      shape: tillerShape,
      thickness: 0.1,
      center: RUDDER,
      arrow: false,
      pieces: [
        // 舵頭的方頭(舵柄套在上面)與往下穿過甲板的舵桿(推斷)
        { kind: "box", size: [0.2, 0.2, 0.14] },
        { kind: "cylinder", radius: STOCK_R, length: 2.0, at: [0, 0, -0.95], role: "stock" },
      ],
    },
    { id: "rope", kind: "rope", radius: ROPE_R },
  ],
  driver: { part: "wheel", type: "rotation", range: RANGE, initial: 0 },
  target: "tiller",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const psi = tiller(theta);
    const [top, bottom] = runs(psi);
    // 一整條繩,從上段的舵柄端起算:兩端都繫在舵柄端,材料座標 = 離起點的弧長(phase 0)
    const points = [...top.points, ...coil.slice(1), ...bottom.points.slice(1)];
    const turn = (theta * WIND) / SHEAVE; // 滑輪輪緣和繩同速;兩個滑輪都是逆時針
    return {
      parts: { wheel: { angle: theta }, tiller: { angle: -psi }, pulley0: { angle: turn }, pulley1: { angle: turn } },
      paths: { rope: { points, closed: false, phase: 0 } },
      readouts: [{ label: "舵柄", value: `${psi >= 0 ? "往上" : "往下"} ${Math.abs((psi * 180) / Math.PI).toFixed(0)}°` }],
    };
  },
};
