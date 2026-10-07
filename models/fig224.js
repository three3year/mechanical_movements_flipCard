// 第 224 種:可擴展的皮帶輪。六支輻臂各沿一條固定的導槽 b 徑向滑動,外端各帶一段輪緣;臂上的凸柱 a 伸進
// 中央輪 c 上的一道曲線槽。轉動小齒輪 d,c 跟著轉,曲線槽把六根凸柱同時往外或往內推,皮帶輪就變大或變小。
// 主動件是小齒輪 d。
// 推斷:曲線槽是等角度的螺旋(c 每轉一度,凸柱離中心的距離變化相同);c 可轉 60°;齒數。
import { TAU, deg, polar } from "./kit.js";
import { pedestal } from "./supports.js";
import { shape, circle, arcPoints, thickLine, stadium, gearProfile } from "./shapes.js";
import { resample } from "./noncircular.js";

const PITCH = 0.2;
const NC = 34;
const ND = 9;
const RC = (NC * PITCH) / TAU;
const RD = (ND * PITCH) / TAU;
const D = [0, RC + RD, 0]; // 小齒輪 d 在 c 的正上方
const ARMS = 6;
const STUD = { min: 0.42, max: 0.88 }; // 凸柱離中心的距離
const C_TURN = deg(60); // c 可轉的角度
const KAPPA = (STUD.max - STUD.min) / C_TURN;
const RIM = 1.55; // 凸柱到輪緣的距離

/** 小齒輪 d 轉 alpha(0 為最小):c 的轉角、凸柱與輪緣的半徑 */
export function expand(alpha) {
  const c = -(RD / RC) * alpha; // 外咬合:反向
  const stud = STUD.min + KAPPA * -c;
  return { c, stud, rim: stud + RIM };
}
export const range = [0, C_TURN * (RC / RD)];

// c 上的曲線槽:第 i 根凸柱(世界角 φi)在 c 的局部角 φi − c;c 轉 −Δ 時半徑增加 KAPPA·Δ
const slot = (phi) => {
  const pts = [];
  for (let j = 0; j <= 20; j++) {
    const d = (C_TURN * j) / 20;
    const rr = STUD.min + KAPPA * d;
    pts.push(polar(rr, phi + d).slice(0, 2));
  }
  return pts;
};
const slots = Array.from({ length: ARMS }, (_, i) => {
  const line = slot((i * TAU) / ARMS);
  return thickLine(line, 0.16).reverse();
});
// 輪緣的一段:以皮帶輪中心為圓心(臂在最內位置時),隨臂一起徑向平移
const R0 = STUD.min + RIM;
const segment = shape([...arcPoints(R0 + 0.1, deg(-26), deg(26), -STUD.min, 0), ...arcPoints(R0 - 0.05, deg(26), deg(-26), -STUD.min, 0)]);

export default {
  figure: 224,
  parts: [
    {
      id: "guides",
      kind: "group",
      pieces: Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", shape: shape(stadium(1.15, 0.34).outline, [stadium(1.0, 0.16).outline.map(([x, y]) => [x + 0.075, y]).reverse()]), thickness: 0.08, angle: (i * TAU) / ARMS, at: [...polar(1.2, (i * TAU) / ARMS).slice(0, 2), -0.25] })),
      label: "b",
      labelOffset: [-2.6, 0.25, 0],
    },
    {
      id: "wheelC",
      kind: "group",
      spin: RC + 0.15,
      label: "c",
      labelOffset: [-0.3, 0.65, 0.3],
      pieces: [
        { kind: "plate", shape: shape(resample(gearProfile({ teeth: NC, radius: RC }), 0.03), [...slots, circle(0.15).reverse()]), thickness: 0.18, mark: [RC - 0.2, 0], markSize: 0.06 },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.3 },
      ],
    },
    { id: "pinionD", kind: "gear", center: D, teeth: ND, radius: RD, width: 0.2, label: "d", labelOffset: [-0.45, 0.2, 0.3] },
    ...Array.from({ length: ARMS }, (_, i) => ({
      id: `arm${i}`,
      kind: "group",
      arrow: false,
      ...(i === 3 ? { label: "a", labelOffset: [-0.65, 0.25, 0.3] } : {}),
      pieces: [
        { kind: "box", size: [RIM, 0.12, 0.08], at: [RIM / 2, 0, -0.15] },
        { kind: "cylinder", radius: 0.07, length: 0.45 },
        { kind: "box", size: [0.3, 0.26, 0.12], at: [0.6, 0, -0.15] },
        { kind: "plate", shape: segment, thickness: 0.3, at: [0, 0, -0.15] },
      ],
    })),
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [[0, 0], D].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.69, at: [x, y, -0.245] },
        ...pedestal({ at: [x, y], z: -0.59, bore: 0.1, floor: -2.89, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "pinionD", type: "rotation", range, initial: range[1] * 0.6 },
  target: "arm3", // 六支輻臂(連輪緣段)一起縮放,只標有凸柱 a 標號的那一支作代表
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { c, stud, rim } = expand(alpha);
    const parts = { pinionD: { angle: alpha }, wheelC: { angle: c } };
    for (let i = 0; i < ARMS; i++) {
      const phi = (i * TAU) / ARMS;
      parts[`arm${i}`] = { position: [...polar(stud, phi).slice(0, 2), 0.3], angle: phi }; // 臂在輪面的前面,只有凸柱伸進輪上的槽
    }
    return { parts, readouts: [{ label: "皮帶輪直徑", value: (2 * (rim + 0.1)).toFixed(2) }] };
  },
  waivers: [
    { check: "interference", parts: ["wheelC", "pinionD"], reason: "簡化齒形:梯形齒的齒頂互相擦到 0.05" },
  ],
};
