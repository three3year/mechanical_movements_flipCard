// 第 204 種:以滾動接觸把旋轉運動從一根軸傳到另一根與它斜交(不相交也不平行)的軸。兩個滾子是相同的
// 雙曲面(中間細、兩端粗的沙漏形),沿一條直線互相接觸;一個轉動時另一個反向轉。主動件是上方的滾子。
// 推斷:兩軸各偏離接觸線 ±BETA,中間最細處的半徑相同,所以轉速相同。
import { deg, X, quatRotate, quatAxisAngle } from "./kit.js";

const BETA = deg(22);
const THROAT = 0.75; // 喉部半徑 = 兩軸到接觸線(x 軸)的距離
const HALF = 2.6; // 滾子半長(沿軸)
const radius = (s) => Math.hypot(THROAT, s * Math.tan(BETA));
const profile = Array.from({ length: 27 }, (_, i) => {
  const s = -HALF + (i / 26) * 2 * HALF;
  return [radius(s), s];
});
export const geometry = { BETA, THROAT, radius };
// 上滾子的軸繞 y 轉 +BETA,下滾子轉 −BETA;兩軸的公垂線是 y 軸
const axisOf = (sign) => quatRotate(quatAxisAngle([0, 1, 0], -sign * BETA), X);

/** 接觸線上 x 處,兩滾子表面的速度(上滾子轉 1):兩者在垂直接觸線的方向相同(滾動),沿接觸線方向不同(滑動) */
export function surfaceSpeeds(x) {
  const speedAt = (sign, w) => {
    const a = axisOf(sign);
    const c = [0, sign * THROAT, 0];
    const p = [x, 0, 0];
    const r = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    return [w * (a[1] * r[2] - a[2] * r[1]), w * (a[2] * r[0] - a[0] * r[2]), w * (a[0] * r[1] - a[1] * r[0])];
  };
  return { upper: speedAt(1, 1), lower: speedAt(-1, -1) };
}

const roller = (id, sign) => ({
  id,
  kind: "group",
  center: [0, sign * THROAT, 0],
  axis: axisOf(sign),
  spin: radius(HALF) + 0.1,
  pieces: [
    { kind: "lathe", profile },
    // 一端的凸緣與兩端的軸頭
    { kind: "cylinder", radius: radius(HALF) + 0.05, length: 0.12, at: [0, 0, sign * (HALF - 0.1)], mark: true },
    { kind: "cylinder", radius: 0.12, length: 6.4 },
  ],
});

export default {
  figure: 204,
  parts: [roller("upper", 1), roller("lower", -1)],
  driver: { part: "upper", type: "rotation" },
  view: { direction: [-0.35, 0.25, 1] },
  pose(theta) {
    return { parts: { upper: { angle: theta }, lower: { angle: -theta } }, readouts: [] };
  },
};
