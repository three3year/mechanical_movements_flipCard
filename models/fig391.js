// 第 391 種:把往復運動轉成旋轉。兩根加重的齒條 A、A¹ 以樞軸接在活塞桿的末端(底下的橫件),齒條末端的銷在固定的導引溝槽
// b、b 裡走;溝槽的形狀讓一根齒條上升時咬著中間的齒輪,另一根下降時咬著,所以齒輪連續朝同一方向轉。
// 肘節槓桿 C 與彈簧 d 負責把右邊齒條上的銷帶過溝槽 b 的上角。主動件是活塞桿(累計行程:上、下)。
// 推斷:每一程只有一根齒條咬合(另一根被溝槽擺開);齒數;C 與 d 只畫外形。
import { TAU, swingPhase, smooth } from "./kit.js";
import { shape, thickLine, rect, circle } from "./shapes.js";

const GEAR = { center: [0, 0.3, 0], teeth: 18, r: 0.75 };
const PITCH = (TAU * GEAR.r) / GEAR.teeth;
export const STROKE = 2.0;
const AWAY = 0.28; // 不咬合的齒條被擺開的距離

/** 累計行程 v → 活塞桿高度、兩根齒條的橫向偏移、齒輪轉角 */
export function racks(v) {
  const { at, cycle, forward, f } = swingPhase(v, 0, STROKE);
  // 上升(forward)時左齒條 A 咬合(在齒輪左側,往上推 → 齒輪順時針);下降時右齒條 A¹ 咬合(在右側往下 → 也是順時針)
  const shift = (x) => AWAY * smooth(x);
  const edge = Math.min(f, 1 - f) * 8; // 行程兩端換咬合
  const leftAway = forward ? AWAY - shift(Math.min(1, edge)) : AWAY;
  const rightAway = forward ? AWAY : AWAY - shift(Math.min(1, edge));
  const gear = -(cycle * 2 * STROKE + (forward ? at : STROKE + (STROKE - at))) / GEAR.r;
  return { y: at, leftAway, rightAway, gear };
}
export const geometry = { GEAR, STROKE };

const rackPiece = (s) => {
  const teeth = [];
  for (let i = 0; i < 16; i++) {
    const y = -2.2 + i * PITCH;
    teeth.push({ kind: "box", size: [0.14, PITCH * 0.45, 0.2], at: [-s * 0.07, y, 0] });
  }
  return [{ kind: "box", size: [0.2, 4.4, 0.2], at: [s * 0.1, -0.2, 0] }, ...teeth, { kind: "cylinder", radius: 0.08, length: 0.35, at: [s * 0.1, 1.95, 0.15] }];
};

export default {
  figure: 391,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩條導引溝槽 b(以兩條邊框表示)
        { kind: "plate", shape: shape(thickLine([[-1.75, 2.3], [-1.35, 2.5], [-1.35, 1.6], [-1.75, 1.4], [-1.75, 2.3]], 0.08)), thickness: 0.2, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(thickLine([[1.75, 2.3], [1.35, 2.5], [1.35, 1.6], [1.75, 1.4], [1.75, 2.3]], 0.08)), thickness: 0.2, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.5, at: GEAR.center },
      ],
    },
    { id: "labelB1", kind: "group", center: [-1.55, 2.5, 0], label: "b", labelOffset: [-0.25, 0.2, 0.3] },
    { id: "labelB2", kind: "group", center: [1.55, 2.5, 0], label: "b", labelOffset: [0.25, 0.2, 0.3] },
    { id: "gear", kind: "gear", center: GEAR.center, teeth: GEAR.teeth, radius: GEAR.r, width: 0.25, bore: 0.1 },
    { id: "rackA", kind: "group", arrow: false, label: "A", labelOffset: [-0.35, -1.2, 0.3], pieces: rackPiece(-1) },
    { id: "rackA1", kind: "group", arrow: false, label: "A¹", labelOffset: [0.35, -1.2, 0.3], pieces: rackPiece(1) },
    {
      id: "piston",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2.4, 0.18)), thickness: 0.2 },
        { kind: "box", size: [0.14, 1.4, 0.14], at: [0, -0.75, 0] },
        { kind: "sphere", radius: 0.22, at: [-1.0, -0.25, 0] },
        { kind: "sphere", radius: 0.22, at: [1.0, -0.25, 0] },
      ],
    },
    { id: "toggleC", kind: "group", center: [1.15, 2.35, 0.2], arrow: false, label: "C", labelOffset: [-0.3, 0.1, 0.2], pieces: [{ kind: "plate", shape: shape(thickLine([[-0.6, -0.6], [0, 0], [0.3, 0.35]], 0.08), [circle(0.03).reverse()]), thickness: 0.06 }] },
    { id: "springD", kind: "spring", coils: 6, radius: 0.06, wire: 0.015, label: "d", labelOffset: [0.2, 0.2, 0.2] },
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: [0, STROKE] },
  target: "gear",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = racks(v);
    const base = -2.6 + r.y;
    const xL = GEAR.center[0] - GEAR.r - 0.07 - r.leftAway;
    const xR = GEAR.center[0] + GEAR.r + 0.07 + r.rightAway;
    return {
      parts: {
        piston: { position: [0, base, 0.0] },
        rackA: { position: [xL, base + 2.6, 0.1] },
        rackA1: { position: [xR, base + 2.6, 0.1] },
        gear: { angle: r.gear },
        springD: { from: [1.45, 2.7, 0.2], to: [2.1, 3.0, 0.2] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["gear", "rackA"], reason: "簡化齒形:齒條的齒畫成方塊,與齒輪的梯形齒重疊 0.12(96 個取樣中 32 個)" },
    { check: "interference", parts: ["gear", "rackA1"], reason: "簡化齒形:齒條的齒畫成方塊,與齒輪的梯形齒重疊 0.13(96 個取樣中 31 個)" },
    { check: "interference", parts: ["rackA1", "toggleC"], reason: "接合處的簡化畫法:肘節 C 的端頭鉸接在齒條頂端的銷上,軸眼與銷重疊 0.09" },
  ],
};
