// 第 262–263 種共用(前視圖與側視圖):螺桿 D 上偏心地裝著錐體 B,摩擦滾子 C 由重物(或彈簧)壓在錐體頂上。
// 螺桿在固定的螺帽 E 中轉動,每轉一圈連同錐體沿軸前進一個螺距。錐體偏心地轉,滾子被頂起又落下(往復);
// 錐體同時往前走,滾子壓在錐面越來越細的部位,所以每一圈往上的行程與往下的行程不等,
// 而滾子在錐面上畫出一條與螺桿同螺距的螺旋線。滾子被錐面摩擦帶著轉,轉速隨接觸處離螺桿軸的遠近一直變。
// 主動件是螺桿 D。
// 推斷:錐體尺寸、偏心量與螺距(依原圖比例);滾子以重物壓著(原文說彈簧或重物)。
import { X, TAU, clamp, screwAdvance } from "./kit.js";

export const PITCH = 0.32;
const ECC = 0.42; // 錐體軸偏離螺桿軸的距離
const CONE = { big: 1.55, small: 0.82, length: 3.1 }; // 大端半徑、小端半徑、長
const ROLLER = 0.28;
const XC = -0.55; // 滾子所在的位置(固定)
const X0 = -0.2; // 主動量 0 時錐體中心的位置
export const RANGE = [0, 4 * TAU];
const NUT = 2.85; // 螺帽 E 的位置(在錐體走到最右時小端的外側)

/** 錐體中心在 x 時,位置 xp 的錐面半徑 */
const coneRadius = (cx, xp) => {
  const f = clamp((xp - (cx - CONE.length / 2)) / CONE.length, 0, 1);
  return CONE.big + (CONE.small - CONE.big) * f;
};

/** 螺桿轉 theta:錐體中心位置、錐軸的偏心方向、滾子接觸處的高度(離螺桿軸) */
export function cone(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const cx = X0 + screwAdvance(theta, PITCH);
  // 錐軸繞螺桿軸轉:偏心向量在 yz 平面,theta = 0 時朝上(原圖前視圖螺桿 D 在錐體中心 B 的下方)
  const ey = ECC * Math.cos(theta);
  const ez = ECC * Math.sin(theta);
  const r = coneRadius(cx, XC);
  const top = ey + Math.sqrt(Math.max(0, r * r - ez * ez)); // 滾子正下方的錐面高度
  return { theta, cx, ey, ez, top };
}

/** 滾子的轉角:錐面在接觸處的線速度 = 角速度 × 接觸處離螺桿軸的高度,滾子被帶著反向轉(數值積分) */
export function rollerAngle(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const n = Math.max(1, Math.ceil(Math.abs(theta) / 0.02));
  let sum = 0;
  for (let i = 0; i < n; i++) sum += cone(((i + 0.5) * theta) / n).top;
  return (-sum * (theta / n)) / ROLLER;
}
export const geometry = { XC, ROLLER };

/** 建立第 figure 種的定義;view 是初始視角 */
export function coneRoller(figure, view) {
  const profile = [[0, -CONE.length / 2], [CONE.big, -CONE.length / 2], [CONE.small, CONE.length / 2], [0, CONE.length / 2]];
  // 兩端面另以薄圓板蓋上:旋轉體的端面法線會被錐面抹成漸層
  const ends = [
    { kind: "cylinder", radius: CONE.big - 0.002, length: 0.02, at: [0, 0, -CONE.length / 2 - 0.005] },
    { kind: "cylinder", radius: CONE.small - 0.002, length: 0.02, at: [0, 0, CONE.length / 2 + 0.005] },
  ];
  return {
    figure,
    parts: [
      {
        id: "base",
        kind: "group",
        pieces: [
          { kind: "box", size: [6.6, 0.12, 2.6], at: [0.2, -2.3, 0] },
          // 螺帽 E 的支架
          { kind: "plate", shape: { outline: [[NUT - 0.55, -2.25], [NUT + 0.55, -2.25], [NUT + 0.14, -1.6], [NUT + 0.14, -0.3], [NUT - 0.14, -0.3], [NUT - 0.14, -1.6]], holes: [] }, thickness: 0.4 },
          { kind: "cylinder", axis: X, radius: 0.3, length: 0.35, at: [NUT, 0, 0] },
          // 滾子的直立導架(重物壓著)
          { kind: "box", size: [0.12, 1.5, 0.12], at: [XC, 2.85, -0.42] }, // 導桿只在錐體掃過的範圍之上
          // 頂上的方形導套(四片板圍住立桿),由一根短臂接到導桿
          ...[-1, 1].map((k) => ({ kind: "box", size: [0.06, 0.12, 0.22], at: [XC + k * 0.08, 3.5, 0] })),
          ...[-1, 1].map((k) => ({ kind: "box", size: [0.1, 0.12, 0.06], at: [XC, 3.5, k * 0.08] })),
          { kind: "box", size: [0.1, 0.12, 0.27], at: [XC, 3.5, -0.245] },
        ],
        label: "E",
        labelOffset: [NUT, 0.55, 0.3],
      },
      {
        id: "screwD",
        kind: "worm",
        axis: X,
        radius: 0.13,
        length: 4.4,
        pitch: PITCH,
        thread: 0.04,
        label: "D",
        labelOffset: [0.6, -0.35, 0.35],
        pieces: [{ kind: "cylinder", radius: 0.09, length: 3.7, at: [0, 0, -3.1] }],
      },
      { id: "coneB", kind: "lathe", axis: X, profile, pieces: ends, mark: true, label: "B", labelOffset: [-0.6, 0.75, 0], arrow: false },
      {
        id: "rollerC",
        kind: "cylinder",
        axis: X,
        radius: ROLLER,
        length: 0.1, // 滾子窄:錐面有斜度,寬的滾子邊緣會陷進錐面
        mark: true,
        spin: ROLLER,
        label: "C",
        labelOffset: [0.45, 0.5, 0.3],
        pieces: [{ kind: "cylinder", radius: 0.05, length: 0.5 }],
      },
      { id: "stemC", kind: "group", pieces: [{ kind: "box", size: [0.1, 1.7, 0.1], at: [0, 0.85, 0] }, { kind: "box", size: [0.9, 0.1, 0.1], at: [0, 1.0, 0] }] }, // 立桿穿過頂上的導套
    ],
    // 動力重演:只轉螺桿;滾子連同它的立桿沿導架上下、受重力,被偏心錐體頂起又落下(滾子被錐面摩擦帶著轉)
    replay: {
      seconds: 16,
      free: { stemC: { slide: [0, 1, 0] }, rollerC: { on: "stemC" } },
      ignore: [["stemC", "base"]], // 立桿在導套裡滑(重演不算立桿與導套壁的摩擦)
      expect: [
        { at: Math.PI, part: "stemC", label: "錐體轉半圈,滾子被頂起" },
        { at: 2 * Math.PI, part: "stemC", label: "轉一圈,滾子落回(錐體前進一個螺距,接觸處變細)" },
        { at: 3 * Math.PI, part: "stemC", label: "再轉半圈,滾子又被頂起,但比上一次低", quote: "會使滾子 C 產生一連串的速度與方向變化" },
      ],
    },
    driver: { part: "screwD", type: "rotation", range: RANGE, initial: 0 },
    target: "rollerC", // 被頂起落下又被摩擦帶轉的滾子
    view: { direction: view },
    pose(theta0) {
      const { theta, cx, ey, ez, top } = cone(theta0);
      const screwX = cx + 0.9; // 螺桿與錐體一起前進
      return {
        parts: {
          screwD: { angle: theta, position: [screwX, 0, 0] },
          // 錐體:中心偏離螺桿軸,隨螺桿轉(轉角與偏心方向一起)
          coneB: { position: [cx, ey, ez], angle: theta },
          rollerC: { position: [XC, top + ROLLER, 0], angle: rollerAngle(theta) },
          stemC: { position: [XC, top + ROLLER, 0] },
        },
        readouts: [],
      };
    },
  };
}
