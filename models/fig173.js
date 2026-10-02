// 第 173 種:絲織機械上變化橫移導桿行程的裝置(用途同第 142 種)。圓盤(背面是斜齒輪,由右邊軸上的小齒輪帶動)
// 的盤面上沿一條直徑裝著一根螺桿,螺桿右上端有一個撥爪輪(tappet-wheel)。螺桿上的螺帽帶著一根手腕銷(wrist),
// 銷伸進 T 形桿的直立長槽;T 形桿的橫臂往右彎下接到導桿,導桿把絲線引到紗管上。圓盤每轉一圈,撥爪輪碰到
// 右上方固定的銷一次、被撥轉一齒,螺桿跟著轉一點,螺帽在螺桿上移一小段——手腕銷離圓盤中心的距離改變,
// 導桿的行程就跟著改變。原文說螺桿裝在圓盤背面,原圖畫在看得到的一面,這裡照原圖。
// 推斷:撥爪輪 8 齒、每次撥一齒;螺紋的旋向取讓螺帽往中心走(行程逐圈縮短);小齒輪齒數。主動件是圓盤。
import { deg, polar, add, X, Z, TAU, quatAxisAngle, quatMul, quatFromZ, screwAdvance } from "./kit.js";
import { indexStep } from "./jumps.js";
import { meshAngle } from "./gears.js";
import { shape, circle, rect } from "./shapes.js";

const CENTER = [0, 0, 0];
const RADIUS = 1.9;
const SCREW_DIR = deg(30.5); // 螺桿在圓盤上的方向(原圖的轉角)
const TAPPET = { at: 2.25, teeth: 8 }; // 撥爪輪在螺桿上的位置與齒數
const PIN = deg(22); // 固定銷所在的方向(圓盤轉角 0 時撥爪輪剛被撥過)
const WINDOW = { from: PIN - deg(8) - SCREW_DIR, span: deg(16), step: 1 };
const PITCH = 0.8; // 螺距:撥一齒螺帽移 PITCH / 8 = 0.1
const WRIST0 = -0.6; // 原圖:手腕銷在中心左下方 0.6
const REVS = { back: 6, ahead: 4 };
const SLOT_X = 0; // T 形桿的直立槽在 x = 手腕銷的 x

const M = 0.12;
const CROWN = { center: [0, 0, -0.2], axis: [0, 0, -1], teeth: 28, radius: (28 * M) / 2 };
const PINION = { center: [CROWN.radius - 0.15, 0, -0.2 - 0.28 - (12 * M) / 2], axis: X, teeth: 12, radius: (12 * M) / 2 };
const CONTACT = [CROWN.radius - 0.15, 0, -0.2 - 0.28];

/** 圓盤轉 theta:撥爪輪被撥了幾齒、螺桿轉角、手腕銷在螺桿上的位置與導桿(T 形桿)的位移 */
export function traverse(theta) {
  const steps = indexStep(theta, WINDOW) - 1; // 原圖(theta = 0)時已撥過一次,以此為零
  const screw = (steps * TAU) / TAPPET.teeth;
  const s = WRIST0 + screwAdvance(screw, PITCH);
  const dir = SCREW_DIR + theta;
  const wrist = add(CENTER, polar(s, dir));
  return { steps, screw, s, wrist, x: wrist[0], stroke: 2 * Math.abs(s) };
}

const T_BAR = shape(
  [
    [-0.18, -1.55], [0.18, -1.55], [0.18, -0.12], [1.9, -0.12], [2.3, -0.75], [2.3, -1.35], [3.85, -1.35], [3.85, -0.75],
    [2.6, -0.75], [2.2, 0.12], [0.18, 0.12], [0.18, 1.55], [-0.18, 1.55],
  ],
  [[[-0.07, -1.38], [0.07, -1.38], [0.07, 1.38], [-0.07, 1.38]].reverse()],
);
const FRAME = shape(rect(3.95, 0.5), [rect(3.2, 0.24).reverse()]);

export default {
  figure: 173,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: CENTER,
      spin: RADIUS + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(RADIUS), [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, -0.12] },
        { kind: "gear", crown: true, teeth: CROWN.teeth, radius: CROWN.radius, width: 0.16, toothDepth: 0.16, faceWidth: 0.35, axis: CROWN.axis, at: [0, 0, -0.12] },
        // 盤面上夾住螺桿的框
        { kind: "plate", shape: FRAME, thickness: 0.18, angle: SCREW_DIR, accent: true },
      ],
    },
    {
      id: "screw",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "worm", radius: 0.1, length: 3.6, pitch: PITCH / 4, thread: 0.04 },
        { kind: "cylinder", radius: 0.05, length: 4.7, at: [0, 0, 0.15] },
        { kind: "gear", teeth: TAPPET.teeth, radius: 0.32, width: 0.08, at: [0, 0, TAPPET.at] },
        { kind: "box", size: [0.08, 0.36, 0.09], at: [0, 0.2, TAPPET.at], accent: true },
      ],
    },
    { id: "nut", kind: "group", arrow: false, pieces: [{ kind: "box", size: [0.4, 0.26, 0.24] }, { kind: "cylinder", radius: 0.07, length: 0.5, at: [0, 0, 0.25] }] },
    { id: "lever", kind: "plate", shape: T_BAR, thickness: 0.1 },
    // 右上方固定的銷:撥爪輪經過時碰到它的上半齒
    { id: "pin", kind: "group", pieces: [{ kind: "box", size: [1.0, 0.5, 0.5], at: [3.05, 0.84, 0.35] }, { kind: "cylinder", axis: X, radius: 0.05, length: 0.5, at: [2.3, 0.84, 0.35] }] },
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      axis: PINION.axis,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.2,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 2.2, at: [0, 0, 1.1] }],
    },
  ],
  driver: { part: "disc", type: "rotation", range: [-REVS.back * TAU, REVS.ahead * TAU] },
  view: { direction: [0.3, 0.2, 1] },
  pose(theta) {
    const { screw, wrist } = traverse(theta);
    const along = quatMul(quatAxisAngle(Z, theta), quatFromZ(polar(1, SCREW_DIR)));
    return {
      parts: {
        disc: { angle: theta },
        screw: { position: [0, 0, 0.1], rotation: quatMul(along, quatAxisAngle(Z, screw)) },
        nut: { position: [wrist[0], wrist[1], 0.1], angle: SCREW_DIR + theta },
        lever: { position: [SLOT_X + wrist[0], 0, 0.42] },
        pinion: { angle: meshAngle(CROWN, PINION, theta, CONTACT) },
      },
      readouts: [],
    };
  },
};
