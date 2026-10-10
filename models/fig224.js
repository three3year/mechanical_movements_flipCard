// 第 224 種:可擴展的皮帶輪。六支輻臂各沿一條固定的導槽 b 徑向滑動,外端各帶一段輪緣;臂上的凸柱 a 伸進
// 中央輪 c 上的一道曲線槽。轉動小齒輪 d,c 跟著轉,曲線槽把六根凸柱同時往外或往內推,皮帶輪就變大或變小。
// 主動件是小齒輪 d。
// 這是皮帶輪:實物上 c、d 與導槽都裝在皮帶輪本體上一起轉,皮帶繞在六段輪緣外;模型只演皮帶輪變大變小,
// 輪本身不轉、不畫皮帶(維護者決定,2026-10-10),讀數另寫一行說明。
// 層次(由後往前,同原圖 c 蓋在導槽前面):導槽 b 與臂(臂上的滑塊夾在導槽的兩條軌之間);輪 c 與小齒輪 d;
// 凸柱從臂往前穿過 c 的曲線槽,前端露在槽口。
// 推斷:曲線槽是等角度的螺旋(c 每轉一度,凸柱離中心的距離變化相同);c 可轉 60°;齒數;
// 導槽做成兩條平行的軌、內端接到中央固定的輪轂(輪轂套在 c 的固定軸上、c 的後面),外端開口讓臂伸出去接輪緣。
import { TAU, deg, polar } from "./kit.js";
import { pedestal } from "./supports.js";
import { shape, circle, arcPoints, thickLine, rect, gearProfile } from "./shapes.js";
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
const LAYER = -0.16; // 導槽與臂的中心面(c 的板在 −0.09–0.09、d 在 −0.1–0.1,後面留 0.01)
const SLIDER = { at: 0.6, length: 0.3, width: 0.26, thickness: 0.1 }; // 臂上的滑塊(離凸柱 at)
const RAIL = { gap: SLIDER.width / 2 + 0.01, width: 0.08, from: 0.12, to: 1.72 }; // 導槽的兩條軌:離中線 gap 起、寬 width,沿徑向 from–to
const HUB = 0.32; // 導槽中央輪轂的半徑(凸柱最靠內時離中心 STUD.min − 0.07 = 0.35)
const STUD_Z = [-0.2, 0.12]; // 凸柱的深度範圍:從臂往前穿過 c 的整個厚度,前端露在槽口

/** 小齒輪 d 轉 alpha(0 為最小):c 的轉角、凸柱與輪緣的半徑 */
export function expand(alpha) {
  const c = -(RD / RC) * alpha; // 外咬合:反向
  const stud = STUD.min + KAPPA * -c;
  return { c, stud, rim: stud + RIM };
}
export const range = [0, C_TURN * (RC / RD)];

// c 上的曲線槽:第 i 根凸柱(世界角 φi)在 c 的局部角 φi − c;c 轉 −Δ 時半徑增加 KAPPA·Δ。
// 槽的兩端各多延伸 END(沿槽量),凸柱走到行程盡頭時整個仍在槽裡(槽的端口是平的)
const END = 0.09;
const slot = (phi) => {
  const pts = [];
  const d0 = -END / Math.hypot(KAPPA, STUD.min);
  const d1 = C_TURN + END / Math.hypot(KAPPA, STUD.max);
  for (let j = 0; j <= 24; j++) {
    const d = d0 + ((d1 - d0) * j) / 24;
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
      // 固定的導槽 b:每支臂兩條軌,內端都接到中央輪轂(套在 c 的固定軸上),和臂在同一層
      pieces: [
        { kind: "cylinder", radius: HUB, inner: 0.1, length: 0.1, at: [0, 0, LAYER] },
        ...Array.from({ length: ARMS }, (_, i) =>
          [1, -1].map((side) => ({
            kind: "plate",
            shape: shape(rect(RAIL.to - RAIL.from, RAIL.width, (RAIL.from + RAIL.to) / 2, side * (RAIL.gap + RAIL.width / 2))),
            thickness: 0.1,
            angle: (i * TAU) / ARMS,
            at: [0, 0, LAYER],
          })),
        ).flat(),
      ],
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
        { kind: "plate", shape: shape(resample(gearProfile({ teeth: NC, radius: RC }), 0.03), [...slots, circle(0.15).reverse()]), thickness: 0.18, mark: polar(0.9, deg(30)).slice(0, 2), markSize: 0.06 }, // 記號在兩道槽之間的實心處
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.24, at: [0, 0, 0.03] }, // 輪轂只往前伸(後面是導槽的輪轂)
      ],
    },
    { id: "pinionD", kind: "gear", center: D, teeth: ND, radius: RD, width: 0.2, label: "d", labelOffset: [-0.45, 0.2, 0.3] },
    ...Array.from({ length: ARMS }, (_, i) => ({
      id: `arm${i}`,
      kind: "group",
      arrow: false,
      ...(i === 3 ? { label: "a", labelOffset: [-0.65, 0.25, 0.3] } : {}),
      // 臂的原點在凸柱上、z = LAYER
      pieces: [
        { kind: "box", size: [RIM, 0.12, 0.08], at: [RIM / 2, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: STUD_Z[1] - STUD_Z[0], at: [0, 0, (STUD_Z[0] + STUD_Z[1]) / 2 - LAYER] },
        { kind: "box", size: [SLIDER.length, SLIDER.width, SLIDER.thickness], at: [SLIDER.at, 0, 0] },
        { kind: "plate", shape: segment, thickness: 0.3, at: [0, 0, 0] },
      ],
    })),
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座;c 的軸穿過導槽的中央輪轂
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
      parts[`arm${i}`] = { position: [...polar(stud, phi).slice(0, 2), LAYER], angle: phi }; // 臂在導槽那一層(c 的後面),凸柱往前伸進輪上的槽
    }
    return {
      parts,
      readouts: [
        { label: "皮帶輪直徑", value: (2 * (rim + 0.1)).toFixed(2) },
        { label: "皮帶輪", value: "皮帶繞在六段輪緣外(未畫);這裡只演直徑變化,輪本身不轉" },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheelC", "pinionD"], reason: "簡化齒形:梯形齒的齒頂互相擦到 0.05" },
  ],
};
