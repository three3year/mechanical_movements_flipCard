// 第 400 種:四向進料(A. B. Wilson 的專利,用在 Wheeler & Wilson、Sloat 等縫紉機上)。桿 A 是叉形的,第二根桿 B(帶著進料齒)
// 以樞軸接在叉口裡。凸輪 C 上的徑向凸起把桿 A 抬起,同時兩根桿被一起往前帶;彈簧產生回程,桿 B 靠自重落下。
// 進料齒因此走一個四向的循環:上、前、下、後(布每次被往前送一步)。主動件是凸輪 C。
// 推斷:循環的四段各佔凸輪的四分之一圈;彈簧與帶動往前的機構只以位移表示。
// 結構(原圖與原文):凸輪 C 在桿 A 右段、叉口左邊的正下方,頂著 A 的底面把 A 抬起;B 以銷裝在 A 的叉口裡。
// 模型原本把凸輪放在離 A 底面 0.1–0.2 的地方,從頭到尾碰不到桿,看不出是凸輪在推。現在凸輪中心放在 A 的底面
// 正下方一個基圓半徑處,輪廓由 A 的升程曲線反推(平底從動件的包絡線:接觸點 = h·n + h'·n'),
// 所以每一刻凸輪的最高點都剛好貼著 A 的底面——A 的位置就是接觸決定的,四向循環本身沒動。
// 另補上 A 的叉口(兩片頰板)與穿過 B 的銷,銷隨 B 在叉口裡升降。
import { TAU, smooth } from "./kit.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

export const LIFT = 0.18;
export const FEED = 0.4;
const A_LIFT = 0.5; // 桿 A 的升程是進料齒升程的這個比例
const A_BOTTOM = -0.06; // 桿 A 底面(相對桿 A 的位置)
export const CAM_BASE = 0.42; // 凸輪基圓半徑
const CAM = [0.6, A_BOTTOM - CAM_BASE, 0]; // 基圓頂剛好貼著 A 在最低位置時的底面
const FORK_X = 0.85; // 叉口(B 的銷)在 A 上的位置

/** 凸輪轉 theta → 進料齒的抬起與前進量(四向循環) */
export function fourMotion(theta) {
  const f = (((theta / TAU) % 1) + 1) % 1;
  let up;
  let fwd;
  if (f < 0.25) [up, fwd] = [smooth(f / 0.25), 0]; // 上
  else if (f < 0.5) [up, fwd] = [1, smooth((f - 0.25) / 0.25)]; // 前
  else if (f < 0.75) [up, fwd] = [1 - smooth((f - 0.5) / 0.25), 1]; // 下
  else [up, fwd] = [0, 1 - smooth((f - 0.75) / 0.25)]; // 後
  return { lift: up * LIFT, feed: fwd * FEED };
}

/** 凸輪轉 theta 時,A 的底面離凸輪中心的高度 */
export const camHeight = (theta) => CAM_BASE + A_LIFT * fourMotion(theta).lift;

// 凸輪輪廓:平底從動件(A 的底面水平)的包絡線。凸輪轉 theta 時與底面接觸的那一點,在凸輪自己的座標裡是
// h·n + h'·n',n = (sin θ, cos θ) 是「轉了 θ 之後朝上」的局部方向,n' = (cos θ, −sin θ)。逆時針排列。
export function camOutline(samples = 144) {
  const d = 1e-4;
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * TAU;
    const h = camHeight(t);
    const dh = (camHeight(t + d) - camHeight(t - d)) / (2 * d);
    pts.push([h * Math.sin(t) + dh * Math.cos(t), h * Math.cos(t) - dh * Math.sin(t)]);
  }
  return pts.reverse();
}

export default {
  figure: 400,
  parts: [
    { id: "bed", kind: "group", pieces: [{ kind: "box", size: [4.6, 0.1, 1.0], at: [0, 0.32, -0.1] }] },
    {
      id: "barA",
      kind: "group",
      arrow: false,
      label: "A",
      labelOffset: [-2.0, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.0, 0], [-1.6, 0], [-1.6, -0.35], [-1.35, -0.35]], 0.12)), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(2.4, 0.12, -0.3, 0)), thickness: 0.3 },
        // 叉口:兩片頰板夾著 B,B 的銷在裡面升降
        { kind: "box", size: [0.16, 0.5, 0.08], at: [FORK_X, 0.19, 0.19] },
        { kind: "box", size: [0.16, 0.5, 0.08], at: [FORK_X, 0.19, -0.19] },
      ],
    },
    { id: "pinB", kind: "cylinder", radius: 0.05, length: 0.5 },
    {
      id: "barB",
      kind: "group",
      arrow: false,
      label: "B",
      labelOffset: [0.9, -0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(1.6, 0.12, 0, 0)), thickness: 0.2 },
        // 進料齒
        { kind: "plate", shape: shape(Array.from({ length: 9 }, (_, i) => [0.2 + i * 0.08, i % 2 ? 0.16 : 0.06]).concat([[0.84, 0.06], [0.2, 0.06]])), thickness: 0.2 },
      ],
    },
    { id: "cam", kind: "plate", center: CAM, shape: shape(camOutline(), [circle(0.08).reverse()]), thickness: 0.25, hub: 0.12, mark: [0.3, 0], markSize: 0.05, spin: 0.6, label: "C", labelOffset: [-0.65, 0, 0.3] },
  ],
  driver: { part: "cam", type: "rotation" },
  target: "barB", // 帶著進料齒走四向循環的桿
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const m = fourMotion(theta);
    return {
      parts: {
        cam: { angle: theta },
        barA: { position: [m.feed, A_LIFT * m.lift, 0] },
        barB: { position: [1.35 + m.feed, m.lift + 0.12, 0] },
        pinB: { position: [FORK_X + m.feed, m.lift + 0.12, 0] },
      },
      readouts: [],
    };
  },
};
