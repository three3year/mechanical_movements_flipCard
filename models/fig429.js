// 第 429 種:Holly 的專利雙橢圓旋轉式引擎。兩個以齒互相咬合的橢圓活塞,被進到兩者之間的蒸汽推動,朝相反方向旋轉。
// (以上這些旋轉式引擎都可以改作泵用。)
// 主動件是左邊的橢圓活塞。
// 推斷:兩個橢圓一樣大,各繞自己的一個焦點轉,兩軸相距長軸長,節曲線始終在兩軸連線上相切(滾動不滑動);
// 輪齒沿節曲線等弧長排列。蒸汽從上方進來,沿兩邊的汽缸壁被輪齒帶到下方排出(左輪逆時針、右輪順時針)。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, arcPoints } from "./shapes.js";

export const A = 1.0; // 半長軸
export const E = 0.3; // 離心率
const P = A * (1 - E * E);
export const DIST = 2 * A; // 兩軸距離
export const LEFT = [-A, 0, 0];
export const RIGHT = [A, 0, 0];
const TEETH = 12;
const TOOTH = 0.12;

/** 繞焦點的橢圓:局部角 phi(從近焦點方向量起)的半徑 */
export const radius = (phi) => P / (1 + E * Math.cos(phi));

// 弧長表(齒沿節曲線等距)
const N = 720;
const ARC = [0];
for (let i = 0; i < N; i++) {
  const a = (TAU * (i + 0.5)) / N;
  const r = radius(a);
  const dr = (P * E * Math.sin(a)) / (1 + E * Math.cos(a)) ** 2;
  ARC.push(ARC[i] + (TAU / N) * Math.hypot(r, dr));
}
const LENGTH = ARC[N];

/** 帶齒的輪廓;mirror 讓右輪是左輪對切線的鏡像,phase 讓兩輪的齒錯開 */
function outline(mirror, phase) {
  return Array.from({ length: N }, (_, i) => {
    const a = (TAU * i) / N;
    const r = radius(a) + TOOTH * Math.cos((TAU * TEETH * ARC[i]) / LENGTH + phase);
    return [r * Math.cos(a), mirror * r * Math.sin(a)];
  });
}

/** 左輪轉 theta(近焦點方向的世界角)→ 右輪的近焦點方向(右輪是左輪對接觸點切線的鏡像) */
export function partner(theta) {
  // 接觸點在兩軸連線上,離左軸 r1
  const r1 = radius(-theta);
  const Pt = [LEFT[0] + r1, 0];
  // 左輪另一個焦點
  const F1b = [LEFT[0] - 2 * A * E * Math.cos(theta), -2 * A * E * Math.sin(theta)];
  // 接觸點的法線平分「左軸 – 接觸點 – 另一焦點」的角,切線與它垂直
  const u1 = [LEFT[0] - Pt[0], LEFT[1] - Pt[1]];
  const u2 = [F1b[0] - Pt[0], F1b[1] - Pt[1]];
  const l1 = Math.hypot(...u1);
  const l2 = Math.hypot(...u2);
  const n = [u1[0] / l1 + u2[0] / l2, u1[1] / l1 + u2[1] / l2];
  const nl = Math.hypot(...n);
  const nn = [n[0] / nl, n[1] / nl];
  // 左軸對切線的鏡像 = 右輪的另一個焦點;右輪近焦點方向 = 從另一焦點指向右軸
  const reflect = (q) => {
    const d = (q[0] - Pt[0]) * nn[0] + (q[1] - Pt[1]) * nn[1];
    return [q[0] - 2 * d * nn[0], q[1] - 2 * d * nn[1]];
  };
  const G = reflect([LEFT[0], LEFT[1]]);
  return { angle: Math.atan2(RIGHT[1] - G[1], RIGHT[0] - G[0]), contact: Pt, r1 };
}

const CASE = A * (1 + E) + TOOTH + 0.08;
const caseOutline = [...arcPoints(CASE, Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5, A, 0), ...arcPoints(CASE, -Math.PI / 2 - 0.5, -Math.PI * 1.5 + 0.5, -A, 0)];
// 蒸汽的路徑:從上方進來,沿左輪外側(左輪逆時針帶著走)繞到下方排出;右邊對稱
const top = Math.acos(A / (CASE - 0.15));
const inlet = [[0, CASE + 0.9, 0.3], ...arcPoints(CASE - 0.15, top, TAU - top, -A, 0).map(([x, y]) => [x, y, 0.3]), [0, -CASE - 0.9, 0.3]];
const inlet2 = inlet.map(([x, y, z]) => [-x, y, z]);

export default {
  figure: 429,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(caseOutline.map(([x, y]) => [x * 1.06, y * 1.08]), [caseOutline.slice().reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(caseOutline.map(([x, y]) => [x * 1.06, y * 1.08])), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [0.4, 0.8, 0.5], at: [0, CASE + 0.5, 0] },
        { kind: "box", size: [0.4, 0.8, 0.5], at: [0, -CASE - 0.5, 0] },
      ],
    },
    {
      id: "left",
      kind: "group",
      center: LEFT,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(outline(1, 0), [circle(0.1).reverse()]), thickness: 0.5, mark: [0.45, 0], markSize: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
    {
      id: "right",
      kind: "group",
      center: RIGHT,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(outline(-1, Math.PI), [circle(0.1)]), thickness: 0.5, mark: [0.45, 0], markSize: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
  ],
  driver: { part: "left", type: "rotation", speed: 0.5 },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const q = partner(theta);
    return {
      parts: { left: { angle: theta }, right: { angle: q.angle } },
      flows: [{ fluid: "steam", points: [...stream(inlet, theta * 1.2, { spacing: 0.2 }), ...stream(inlet2, theta * 1.2, { spacing: 0.2 })] }],
      readouts: [{ label: "右輪 / 左輪 轉速比", value: ((q.r1 / (DIST - q.r1))).toFixed(2) }],
    };
  },
};
