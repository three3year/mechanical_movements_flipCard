// 第 400 種:四向進料(A. B. Wilson 的專利,用在 Wheeler & Wilson、Sloat 等縫紉機上)。桿 A 是叉形的,第二根桿 B(帶著進料齒)
// 以樞軸接在叉口裡。凸輪 C 上的徑向凸起把桿 A 抬起,同時兩根桿被一起往前帶;彈簧產生回程,桿 B 靠自重落下。
// 進料齒因此走一個四向的循環:上、前、下、後(布每次被往前送一步)。主動件是凸輪 C。
// 推斷:循環的四段各佔凸輪的四分之一圈;彈簧與帶動往前的機構只以位移表示。
import { TAU, smooth } from "./kit.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

export const LIFT = 0.18;
export const FEED = 0.4;
const CAM = [0.35, -0.7, 0];

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
        { kind: "cylinder", radius: 0.06, length: 0.4, at: [0.85, 0, 0] },
      ],
    },
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
    { id: "cam", kind: "plate", center: CAM, shape: shape(Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * TAU; const r = 0.42 + 0.18 * Math.max(0, Math.cos(a)) ** 2; return [r * Math.cos(a), r * Math.sin(a)]; }), [circle(0.08).reverse()]), thickness: 0.25, hub: 0.12, mark: [0.3, 0], markSize: 0.05, spin: 0.6, label: "C", labelOffset: [-0.65, 0, 0.3] },
  ],
  driver: { part: "cam", type: "rotation" },
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const m = fourMotion(theta);
    return {
      parts: {
        cam: { angle: theta },
        barA: { position: [m.feed, 0.0 + m.lift * 0.5, 0] },
        barB: { position: [1.35 + m.feed, m.lift + 0.12, 0] },
      },
      readouts: [],
    };
  },
};
