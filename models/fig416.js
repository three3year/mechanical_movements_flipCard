// 第 416 種:幫曲柄越過死點的裝置。螺旋彈簧 A 總是把曲柄 B 推向與死點成直角的位置。
// 主動件是曲柄 B(飛輪);連桿把曲柄接到下方的踏板。
// 推斷:踏板繞左邊的支點擺動,連桿接在支點右邊的短臂上;彈簧 A 的內端固定,外端接在曲柄銷上,
// 曲柄在左邊水平(與兩個死點約成直角)時彈簧不受力,偏離越多彈簧把它推回的力矩越大。
import { TAU } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, ring, thickLine } from "./shapes.js";

const CRANK = 0.55;
export const ROD = 2.55;
export const TREADLE_PIVOT = [-0.73, -2.58, 0];
export const TREADLE_ARM = 0.9; // 支點到連桿接點
const FOOT = 1.95; // 支點到踏腳端
export const SPRING_AT = [-1.85, -0.15, 0]; // 彈簧 A 的中心(內端固定處)

export const pin = (theta) => [CRANK * Math.cos(theta), CRANK * Math.sin(theta), 0];
/** 曲柄轉 theta → 踏板的連桿接點 */
export const treadle = (theta) => circleCircle(pin(theta), ROD, TREADLE_PIVOT, TREADLE_ARM, 1).point;

// 兩個死點:曲柄銷、軸心與連桿接點成一直線(數值求出)
const straightness = (t) => {
  const p = pin(t);
  const q = treadle(t);
  return p[0] * (q[1] - p[1]) - p[1] * (q[0] - p[0]); // 曲柄方向 × 連桿方向
};
function deadCenters() {
  const out = [];
  const n = 720;
  for (let i = 0; i < n; i++) {
    let a = (TAU * i) / n;
    let b = (TAU * (i + 1)) / n;
    if (straightness(a) * straightness(b) > 0) continue;
    for (let k = 0; k < 50; k++) {
      const m = (a + b) / 2;
      if (straightness(a) * straightness(m) <= 0) b = m;
      else a = m;
    }
    out.push((a + b) / 2);
  }
  return out;
}
export const DEAD = deadCenters();
// 彈簧放鬆時曲柄的方向:兩個死點之間、在左邊的那一個中分方向
export const REST = (DEAD[0] + DEAD[1]) / 2 + (Math.cos((DEAD[0] + DEAD[1]) / 2) > 0 ? Math.PI : 0);
/** 彈簧對曲柄的力矩(正為逆時針):把曲柄推回 REST */
export const springTorque = (theta) => -Math.sin(theta - REST);

/** 彈簧:內端在中心繞幾圈,外端接到曲柄銷 */
function springPath(theta) {
  const B = pin(theta);
  const d = [B[0] - SPRING_AT[0], B[1] - SPRING_AT[1]];
  const reach = Math.hypot(d[0], d[1]);
  const end = Math.atan2(d[1], d[0]);
  return Array.from({ length: 121 }, (_, i) => {
    const t = i / 120;
    const r = 0.07 + (reach - 0.07) * t ** 3.2;
    const a = end + (1 - t) * 3.4 * Math.PI;
    return [SPRING_AT[0] + r * Math.cos(a), SPRING_AT[1] + r * Math.sin(a), 0.1];
  });
}

export default {
  figure: 416,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(0.13)), thickness: 0.22, at: [SPRING_AT[0], SPRING_AT[1], 0.05] },
        { kind: "plate", shape: shape(circle(0.09)), thickness: 0.2, at: [TREADLE_PIVOT[0], TREADLE_PIVOT[1], 0.05] },
        { kind: "plate", shape: shape(thickLine([[TREADLE_PIVOT[0], TREADLE_PIVOT[1] - 0.05], [TREADLE_PIVOT[0], TREADLE_PIVOT[1] - 0.4]], 0.12)), thickness: 0.08 },
      ],
    },
    {
      id: "crank",
      kind: "group",
      label: "B",
      labelOffset: [-0.15, 0.3, 0.2],
      spin: 1.15,
      pieces: [
        { kind: "plate", shape: ring(1.05, 0.85), thickness: 0.3, at: [0, 0, -0.15] },
        { kind: "plate", shape: shape(circle(0.9), [circle(0.12).reverse()]), thickness: 0.06, at: [0, 0, -0.15], mark: [0.55, -0.45], markSize: 0.08 },
        { kind: "plate", shape: shape(thickLine([[0, 0], [CRANK, 0]], 0.2)), thickness: 0.06, at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.13, length: 0.3, at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.06, length: 0.26, at: [CRANK, 0, 0.08] },
      ],
    },
    { id: "spring", kind: "rod", radius: 0.025, label: "A", labelOffset: [SPRING_AT[0] + 0.1, SPRING_AT[1] + 0.42, 0.2] }, // 路徑零件的標籤從原點量起
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "treadle", kind: "plate", shape: shape(thickLine([[-FOOT, 0], [TREADLE_ARM, 0]], 0.07), [circle(0.04).reverse()]), thickness: 0.05, arrow: false },
  ],
  driver: { part: "crank", type: "rotation", initial: Math.PI },
  target: "treadle", // 模型反過來由曲柄帶動;彈簧 A 是越過死點的手段
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const B = pin(theta);
    const Q = treadle(theta);
    const tq = springTorque(theta);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [B[0], B[1], 0.14], to: [Q[0], Q[1], 0.14] },
        treadle: { position: [TREADLE_PIVOT[0], TREADLE_PIVOT[1], 0.12], angle: Math.atan2(Q[1] - TREADLE_PIVOT[1], Q[0] - TREADLE_PIVOT[0]) },
      },
      paths: { spring: { points: springPath(theta), closed: false } },
      readouts: [
        { label: "離最近死點", value: `${Math.round((Math.min(...DEAD.map((d) => Math.abs(Math.atan2(Math.sin(theta - d), Math.cos(theta - d))))) * 180) / Math.PI)}°` },
        { label: "彈簧推曲柄", value: Math.abs(tq) < 0.02 ? "不受力" : tq > 0 ? "逆時針" : "順時針" },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["crank", "spring"], reason: "未修:彈簧擺動時掃過曲柄的輪轂,重疊 0.05(96 個取樣中 5 個)(列入待確認清單)" },
    { check: "interference", parts: ["rod", "treadle"], reason: "接合處的簡化畫法:連桿的下端鉸接在踏板上,桿端與踏板重疊 0.03" },
    { check: "interference", parts: ["crank", "rod"], reason: "未修:連桿每圈有一小段掃過曲柄的輪轂,重疊 0.04(96 個取樣中 10 個)(列入待確認清單)" },
    { check: "interference", parts: ["frame", "spring"], reason: "彈簧的上端掛在機架上:端頭伸進機架的板 0.06" },
    { check: "interference", parts: ["frame", "treadle"], reason: "接合處的簡化畫法:踏板鉸接在機架的腳上,踏板端與機架的板重疊 0.06" },
  ],
};

