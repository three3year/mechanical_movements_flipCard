// 第 189 種:第 186 種的另一種變形。偏心桿末端的鉤口搭在搖臂的銷上;桿尾以一根直立的短連桿吊在一支
// 直角槓桿(右上)的短臂上,槓桿的長臂往上伸成拉桿。把拉桿的上端往左拉,槓桿轉動、短臂抬起,
// 經連桿把桿端拉起,銷從鉤口中脫出。主動件是直角槓桿。
// 推斷:槓桿的樞軸固定在機架上(原圖未畫機架);拉動方向。
import { deg, add, polar, dist } from "./kit.js";
import { gab, rodAngle, onRod, ECC } from "./gab.js";
import { shape, thickLine } from "./shapes.js";

const G = gab();
const SHAFT = [-0.05, 1.52, 0];
const BELL = { pivot: [0.85, 2.02, 0], short: 0.9, long: 2.55 };
const HANGER = [1.75, 0]; // 連桿在偏心桿上的銷(以銷為原點的桿座標)
const LINK = 2.02;
const MAX = deg(60);

/** 槓桿轉 phi(逆時針):短臂端點、桿端抬起的量 */
export function unhook(phi) {
  const end = add(BELL.pivot, polar(BELL.short, phi));
  // 連桿長度不變:找出桿端的抬起量,使桿上的銷與短臂端點相距 LINK
  let lo = -0.5;
  let hi = 1.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dist(end, onRod(HANGER, mid)) > LINK) lo = mid;
    else hi = mid;
  }
  const lift = (lo + hi) / 2;
  return { end, lift, released: G.released(lift) };
}
export const max = MAX;
export const link = { HANGER, LINK };

export default {
  figure: 189,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.3, SHAFT[1]], [-0.25, 0.0], [0.25, 0.0], [0.3, SHAFT[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.45, inner: 0.3, length: 0.3, at: [SHAFT[0], SHAFT[1], -0.35] },
        { kind: "cylinder", radius: 0.3, length: 0.5, at: [SHAFT[0], SHAFT[1], -0.35], accent: true },
        { kind: "cylinder", radius: G.pin, length: 0.7 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: ECC,
      arrow: false,
      pieces: [
        { kind: "plate", shape: G.rod({ left: -3.95, right: 2.35 }), thickness: 0.25, at: [-ECC[0], 0, 0] },
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [HANGER[0] - ECC[0], HANGER[1], 0.1] },
      ],
    },
    {
      id: "bell",
      kind: "group",
      center: BELL.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [BELL.short, 0]], 0.16)), thickness: 0.12 },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, BELL.long]], 0.12)), thickness: 0.12 },
        { kind: "cylinder", radius: 0.17, inner: 0.08, length: 0.2 },
        { kind: "cylinder", radius: 0.15, inner: 0.07, length: 0.2, at: [BELL.short, 0, 0] },
      ],
    },
    { id: "hanger", kind: "link", width: 0.12, thickness: 0.08 },
  ],
  driver: { part: "bell", type: "rotation", range: [0, MAX] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { end, lift, released } = unhook(phi);
    const pin = onRod(HANGER, lift);
    return {
      parts: {
        rod: { angle: rodAngle(lift) },
        bell: { angle: phi },
        hanger: { from: [end[0], end[1], 0.2], to: [pin[0], pin[1], 0.2] },
      },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
