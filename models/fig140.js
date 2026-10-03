// 第 140 種:衝床的肘節接頭。上連桿掛在機架頂部的樞軸,下連桿接著在導座裡上下滑動的衝頭,兩桿在膝部鉸接;
// 右側槓桿的短臂經一根水平連桿拉動膝部。把槓桿的長柄往下扳,膝部被拉向直線,衝頭被往下推——
// 越接近伸直,下推的力越大。主動件是槓桿。
import { deg, polar, add, dist } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape } from "./shapes.js";

const T = [-1.0, 2.25, 0]; // 上連桿的固定樞軸
const K0 = [-1.6, 1.15, 0]; // 膝部(原圖位置)
const XP = -1.0; // 衝頭的導座
const B0 = [XP, 0.0, 0];
const L1 = dist(T, K0);
const L2 = dist(K0, B0);
const P = [0.55, 0.95, 0]; // 槓桿的樞軸
const ARM = { short: 0.62, at: deg(150), handle: 2.6, handleAt: deg(22) };
const E0 = add(P, polar(ARM.short, ARM.at));
const LH = dist(K0, E0);
const RANGE = [deg(-52), 0]; // 扳到底時膝部接近伸直

/** 槓桿轉 psi(往下扳為負):膝部、衝頭高度 */
export function toggle(psi) {
  const e = add(P, polar(ARM.short, ARM.at + psi));
  const k = circleCircle(T, L1, e, LH, -1).point;
  const y = k[1] - Math.sqrt(Math.max(0, L2 * L2 - (XP - k[0]) ** 2));
  return { e, k, y };
}
export const links = { L1, L2 };

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 140,
  parts: [
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM.handle, 0.22, 0.12], at: [(ARM.handle / 2) * Math.cos(ARM.handleAt), (ARM.handle / 2) * Math.sin(ARM.handleAt), 0.3], angle: ARM.handleAt },
        { kind: "box", size: [ARM.short, 0.2, 0.12], at: [(ARM.short / 2) * Math.cos(ARM.at), (ARM.short / 2) * Math.sin(ARM.at), 0.3], angle: ARM.at },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.3, at: [0, 0, 0.3] },
      ],
    },
    { id: "upperLink", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "lowerLink", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "pullLink", kind: "link", width: 0.13, thickness: 0.06 },
    {
      id: "punch",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.34, 0.75, 0.3], at: [0, -0.4, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.07, length: 0.35, at: [0, -0.95, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.7, -1.3], [-0.55, -1.3], [-0.55, 0.62], [-0.3, 0.95], [0.35, 0.95], [0.4, 0.6], [0.9, -0.2], [1.1, -1.6], [1.7, -2.0], [1.7, -2.2], [-2.0, -2.2], [-2.0, -2.0], [-0.95, -2.0], [-0.7, -1.6]]), thickness: 0.4, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape([[-1.3, -1.3], [-1.3, 2.45], [-0.85, 2.45], [-0.85, 1.6], [-0.35, 1.6], [-0.35, 1.25], [-0.75, 1.25], [-0.75, -1.3]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "box", size: [4.5, 0.1, 1.2], at: [-0.15, -2.25, 0] },
      ],
    },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE },
  target: "punch",
  view: { direction: [0.06, 0.05, 1] },
  pose(psi) {
    const { e, k, y } = toggle(psi);
    const b = [XP, y, 0];
    return {
      parts: {
        lever: { angle: psi },
        upperLink: { from: z(T, 0.2), to: z(k, 0.2) },
        lowerLink: { from: z(k, 0.2), to: z(b, 0.2) },
        pullLink: { from: z(k, 0.32), to: z(e, 0.32) },
        punch: { position: b },
      },
      readouts: [],
    };
  },
};
