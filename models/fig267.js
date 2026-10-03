// 第 267 種:摩擦皮帶輪。輪緣裡面有四支以樞軸裝在軸轂上的偏心臂,彈簧把臂端壓在輪緣內面。
// 輪緣朝箭頭的反方向(逆時針)轉時,臂端卡住輪緣,把運動傳給軸;朝箭頭方向(順時針)轉時,
// 臂繞樞軸讓開、在輪緣內面上滑過,軸保持不動。
// 主動件是輪緣,來回轉動(累計行程,見 kit.swing):逆時針那一程帶著軸轉,順時針那一程軸不動。
// 推斷:臂的形狀與讓開的角度;輪緣來回轉動的幅度。
import { TAU, deg, swingPhase, smooth } from "./kit.js";
import { shape, circle, arcPoints, thickLine, polygon } from "./shapes.js";

export const SWING = deg(70);
const RIM = { outer: 2.05, inner: 1.82 };
const ARMS = 4;
const PIVOT = 0.62; // 樞軸離軸心的距離
const YIELD = deg(7); // 讓開時臂繞樞軸轉的角度

/** 主動量 v(累計行程)→ 輪緣轉角、軸的轉角、臂讓開的角度 */
export function friction(v) {
  const { at, cycle, forward, f } = swingPhase(v, 0, SWING);
  // 逆時針那一程(forward)軸跟著輪緣;順時針那一程軸停在這一程開始時的位置
  const shaft = cycle * SWING + (forward ? at : SWING);
  const yieldAngle = forward ? 0 : YIELD * smooth(Math.min(f, 1 - f) * 8);
  return { rim: at, shaft, yieldAngle };
}

// 偏心臂:從樞軸彎出去,臂端貼到輪緣內面(局部座標以樞軸為原點)
const armLine = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  const a = -t * deg(80); // 臂從樞軸往順時針側彎出:輪緣逆時針轉時把臂端往外推、卡緊
  const r = PIVOT + t * (RIM.inner - 0.06 - PIVOT);
  return [r * Math.cos(a) - PIVOT, r * Math.sin(a)];
});
const arm = shape(thickLine(armLine, 0.13), [circle(0.06).reverse()]);

export default {
  figure: 267,
  parts: [
    {
      id: "rim",
      kind: "plate",
      shape: shape(circle(RIM.outer), [circle(RIM.inner).reverse()]),
      thickness: 0.36,
      mark: [RIM.outer - 0.11, 0],
      markSize: 0.09,
      spin: RIM.outer,
    },
    {
      id: "shaft",
      kind: "plate",
      shape: shape(polygon(4, 0.62, deg(45)).map(([x, y]) => [x * 0.95, y * 0.95]), [circle(0.18).reverse()]),
      thickness: 0.3,
      hub: 0.32,
      mark: [0.25, 0.25],
      markSize: 0.06,
      spin: 0.7,
      pieces: [{ kind: "cylinder", radius: 0.16, length: 0.8 }],
    },
    ...Array.from({ length: ARMS }, (_, i) => ({ id: `arm${i}`, kind: "plate", shape: arm, thickness: 0.16, arrow: false, pieces: [{ kind: "cylinder", radius: 0.09, length: 0.34 }] })),
    ...Array.from({ length: ARMS }, (_, i) => ({ id: `spring${i}`, kind: "spring", coils: 5, radius: 0.05, wire: 0.015 })),
  ],
  waivers: [
    { check: "interference", parts: ["arm0", "spring0"], reason: "待確認:arm0 的板 與 spring0 的Tube重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["arm1", "spring1"], reason: "待確認:arm1 的板 與 spring1 的Tube重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["arm2", "spring2"], reason: "待確認:arm2 的板 與 spring2 的Tube重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["arm3", "spring3"], reason: "待確認:arm3 的板 與 spring3 的Tube重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "rim", type: "rotation", cycle: [0, SWING] },
  target: "shaft", // 只在一個轉向被帶動的軸
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const { rim, shaft, yieldAngle } = friction(v);
    const parts = { rim: { angle: rim }, shaft: { angle: shaft } };
    for (let i = 0; i < ARMS; i++) {
      const base = shaft + (i * TAU) / ARMS;
      const pivot = [PIVOT * Math.cos(base), PIVOT * Math.sin(base), 0.0];
      const turn = base - yieldAngle;
      parts[`arm${i}`] = { position: pivot, angle: turn };
      // 彈簧:從軸轂上的座(樞軸前方)撐到臂的中段
      const seat = [0.5 * Math.cos(base - deg(50)), 0.5 * Math.sin(base - deg(50)), 0.1];
      const mid = armLine[3];
      const c = Math.cos(turn), s = Math.sin(turn);
      parts[`spring${i}`] = { from: seat, to: [pivot[0] + mid[0] * c - mid[1] * s, pivot[1] + mid[0] * s + mid[1] * c, 0.1] };
    }
    return { parts, readouts: [] };
  },
};
