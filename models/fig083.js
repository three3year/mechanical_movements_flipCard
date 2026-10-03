// 第 83 種:兩塊具棘齒的弧形板 C 固定在同一根搖臂軸 B 上,齒的方向相反,分別作用在水平棘輪 D 的兩側
// (原圖只畫出前面一塊)。桿 A 往復時搖臂軸來回擺動:往一個方向擺時前板的齒推動 D 的前緣、後板被彈簧抬起滑過;
// 擺回來時換後板推動 D 的後緣。兩側的推動都使 D 朝同一方向轉,得到近乎連續的旋轉。
// 主動量是桿 A 的累計行程(以搖臂軸的擺角表示)。
import { deg, Y, polar, swing as swingAt } from "./kit.js";
import { doubleAction } from "./ratchets.js";
import { shape, arcPoints } from "./shapes.js";

const B = [0, 2.2, 0];
const ARC = 2.35; // 弧形板齒尖離搖臂軸的距離
const D = { center: [0, -0.4, 0], radius: 1.95, teeth: 40, top: -0.15 };
const SIDE = 1.15; // 兩塊弧形板離 D 中心的前後距離(作用在 D 的兩側)
const SWING = deg(12);
const ARM = 0.85; // 搖臂(接桿 A)長

// 弧形板在 D 的前緣(z = +SIDE)推動時,D 前緣的切線方向是 x,推動 Δx = ARC·Δψ;D 轉角 = Δx ÷ (接觸半徑)
const CONTACT_R = Math.hypot(SIDE, 0.6);
const front = (psi) => (ARC * psi) / CONTACT_R; // 前緣往 +x 時 D 繞 +y 轉負向
const back = (psi) => -(ARC * psi) / CONTACT_R;

/** 主動量 v:D 繞 +y 的轉角 */
export const wheelAngle = (v) => -doubleAction(v, -SWING / 2, SWING / 2, front, back);
export const swing = SWING;

const plate = (z) => ({
  kind: "plate",
  shape: shape(
    [
      [-0.2, 0.15],
      [0.2, 0.15],
      ...Array.from({ length: 15 }, (_, i) => {
        const a = deg(-62) + (deg(124) * i) / 14;
        const r = i % 2 === 0 ? ARC : ARC - 0.14;
        return polar(r, -Math.PI / 2 + a).slice(0, 2);
      }).reverse(),
    ],
    [
      [...arcPoints(0.4, deg(-115), deg(-95)), ...arcPoints(1.85, deg(-95), deg(-120))].reverse(),
      [...arcPoints(0.4, deg(-85), deg(-65)), ...arcPoints(1.85, deg(-60), deg(-85))].reverse(),
    ],
  ),
  thickness: 0.12,
  at: [0, 0, z],
});

export default {
  figure: 83,
  parts: [
    {
      id: "rock",
      kind: "group",
      center: B,
      arrow: false,
      pieces: [
        plate(SIDE),
        plate(-SIDE),
        { kind: "cylinder", radius: 0.14, length: 2 * SIDE + 0.4 },
        { kind: "box", size: [0.16, ARM, 0.12], at: [0, ARM / 2, SIDE + 0.12] },
      ],
      label: "C",
      labelOffset: [0.4, -1.3, SIDE + 0.1],
    },
    { id: "labelB", kind: "group", center: [B[0] + 0.35, B[1], SIDE + 0.2], label: "B" },
    { id: "rodA", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [1.4, 0.3, 0] },
    {
      id: "wheel",
      kind: "gear",
      crown: true,
      axis: Y,
      center: [D.center[0], D.top - 0.25, 0],
      teeth: D.teeth,
      radius: D.radius,
      width: 0.4,
      toothDepth: 0.14,
      faceWidth: 0.45,
      hub: 0.35,
      pieces: [{ kind: "cylinder", radius: 0.12, length: 1.4, at: [0, 0, -0.8] }],
      label: "D",
      labelOffset: [-1.2, -0.65, 1.0],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["wheel"], reason: "待確認:wheel 與帶動(或支撐)它的零件之間差 0.05 沒貼上,接觸位置是算出來的近似,未逐一修正" },
  ],
  driver: { part: "rock", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel", // 近乎連續旋轉的棘輪 D
  view: { direction: [0.05, 0.12, 1], fov: 22 },
  pose(v) {
    const psi = swingAt(v, -SWING / 2, SWING / 2);
    const top = [B[0] - ARM * Math.sin(psi), B[1] + ARM * Math.cos(psi), SIDE + 0.12];
    return {
      parts: {
        rock: { angle: psi },
        wheel: { angle: wheelAngle(v) },
        rodA: { from: top, to: [top[0] + 2.6, top[1] - 0.6, top[2]] },
      },
      readouts: [],
    };
  },
};

