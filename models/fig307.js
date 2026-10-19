// 第 307 種:第 306 種三腳式擺式擒縱的變形,有較長的止動齒 D 和 E;A 和 B 是擒縱叉瓦。擺下端是瓶形的板,
// 板上開一個橢圓形的口,三腳輪的輪轂在口中,三根長腳伸出口外、蓋在瓶身前面。
// 擺每擺一次,三腳輪轉過六分之一圈。主動件是擺(累計擺動);目標件是三腳輪(擒縱讓它一格一格地放行)。
//
// 照 525 px 原圖的讀法(維護者 2026-10-14 決定、2026-10-16 維持):D、E 是釘在橢圓口左右兩端外側、瓶身上的擋塊,
// 長腳的腳尖頂在上面(長的止動齒 = 在大半徑處鎖住);A、B 是口緣靠輪轂的台階——上緣左半高、右半低,台階 A 的面朝左;
// 下緣左半高、右半低,台階 B 的面朝右(和第 306 種上、下叉瓦的台階同一個作法);從 A 往左、從 B 往右的虛線是口緣
// 被腳蓋住的部分。每根腳的根部在輪轂旁有一個彎鉤(原圖三個彎鉤形的短齒),和口緣在同一層,推 A、B。
// 三腳輪照原圖台階的高低順時針轉(和第 306 種相同)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,分兩層:腳與 D、E 在瓶身前面一層,鉤與口緣在瓶身那一層):
// 三腳輪受重錘的固定力矩順時針轉。擺往右擺:E 退到腳尖圓外面,放開右邊的腳;輪轉動,左上的鉤從口緣下方進到台階 A
// 的左邊、推著 A 往右(衝量,擺與鉤同向走),鉤滑到 A 右邊較低的口緣下面就放開;再轉一點,下一根腳的腳尖往上頂在
// D 的下面,停住。擺往左擺時反過來:D 放開,右下的鉤推著 B 往左,腳尖往下落在 E 上。每擺一次輪轉六分之一圈。
// D、E 頂著腳尖的面做成以擺的樞軸為圓心的弧(近乎水平),鎖住時 D、E 沿著它滑、輪不回退;鎖住時三個鉤都在口緣的
// 高度以內,碰不到 A、B。
// 偏離插圖(照作圖推算,原文 > 實物可行 > 插圖外形):台階的高低差照鉤的半徑推算(原圖上緣右半更低,照原圖的高度,
// 鎖住時鉤會卡在台階右邊的口緣下);A、B 的左右位置照衝量的時序推算(原圖 A 在輪轂右邊較遠)。
// 推斷:瓶頸往上收成擺桿,頂端套在樞軸銷上(原圖瓶頸上端撕斷,表示擺往上延伸);擺幅;機架是瓶身後面的夾板條,
// 從三腳輪的軸往上到擺的樞軸(原圖沒畫,和第 305 種相同)。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 306 種一樣):輪軸上、瓶身與夾板條之間有一個鼓,
// 繩從鼓的右側垂下(在瓶身後面),重錘吊在瓶底下方;重錘的重量就是讓三腳輪順時針轉的固定力矩,輪停住時重錘也停。
// 擺兩個來回(輪轉三分之二圈)重錘捲回最高處一次(上鍊)。實物也可能用發條;重錘只是示意。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle } from "./shapes.js";
import { plateBar } from "./supports.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const STEP = TAU / 6;
export const SWING = deg(4.1);
const P = 3.8; // 擺的樞軸在輪心上方
const PIVOT = [0, P];
const R_T = 1.7; // 腳尖圓
const LOCK = 0.04; // D、E 的內端伸進腳尖圓的量(擺居中時)
const HOOK = 0.4; // 腳根的鉤尖半徑
const RIM = { high: 0.46, low: 0.36 }; // 口緣離輪心的高度:上緣左半 / 右半(下緣點對稱:右半 / 左半)
const STEP_X = -0.03; // 台階 A 的面在輪心右邊的距離(擺居中時;B 在 −STEP_X)
const OVAL = { half: 1.575, r: (RIM.high + RIM.low) / 2 }; // 橢圓口的半長、兩端圓頭的半徑

// 以擺的樞軸為原點的局部座標(擺居中時)
const local = ([x, y]) => [x - PIVOT[0], y - PIVOT[1]];
const arc = (c, r, a0, a1, n = 16) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });

// 橢圓口(逆時針):下緣(左半高、在 B 下到右半)→ 右端圓頭 → 上緣(右半低、在 A 上到左半)→ 左端圓頭
const capX = OVAL.half - OVAL.r;
const capY = (RIM.high - RIM.low) / 2;
const OVAL_HOLE = [
  [-capX, -RIM.low],
  [-STEP_X, -RIM.low],
  [-STEP_X, -RIM.high],
  ...arc([capX, -capY], OVAL.r, -Math.PI / 2, Math.PI / 2),
  [STEP_X, RIM.low],
  [STEP_X, RIM.high],
  ...arc([-capX, capY], OVAL.r, Math.PI / 2, (3 * Math.PI) / 2).slice(0, -1),
].map(local);
// 口緣的實體(檢查接觸用,輪轂附近):上緣(A 是台階的面)、下緣(B)
const UPPER_RIM = [[STEP_X, RIM.low], [0.95, RIM.low], [0.95, 1.2], [-0.95, 1.2], [-0.95, RIM.high], [STEP_X, RIM.high]];
const LOWER_RIM = UPPER_RIM.map(([x, y]) => [-x, -y]);

// D、E:頂著腳尖的面是以樞軸為圓心、過腳尖圓左右兩端(輪心高度)的弧;D 在弧的上面、E 在弧的下面(樞軸為原點)
// 內端往外斜一點(不沿著往樞軸的半徑):D 的內端若沿半徑往上斜進腳尖圓,放開後腳尖往上轉會擦著它
const RHO = Math.hypot(R_T, P);
const stopBlock = (side, depth) => {
  const arcAt = (r, x0, x1) => Array.from({ length: 41 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 40;
    return [x, -Math.sqrt(r * r - x * x)];
  });
  const [x0, x1] = [side * (R_T - LOCK), side * (R_T + 0.42)];
  return [...arcAt(RHO, x0, x1), ...arcAt(RHO + depth, x1, x0 + side * 0.03)];
};
const STOP_D = stopBlock(-1, -0.12);
const STOP_E = stopBlock(1, 0.12);

// 三腳輪:長腳(前層,尖端頂在 D、E 上)與根部的鉤(口緣那一層,鉤尖在半徑 HOOK)。
// 偏離插圖:長腳的尖端削成斜的——走在前面的那一邊最後 0.37 從腳尖往回斜(每往裡 1 斜 0.6),腳尖在最前面
// (原圖那一邊沿半徑直到腳尖)。D 的弧面在腳尖圓裡往下彎,擺往右時 D 的內端沿弧面伸進腳尖圓、往下走,
// 那一邊若沿半徑,會被 D 的內端往下推(回退);斜的量在 D 伸到最裡面的地方(腳尖往裡 0.31)比弧面多 0.06。
const rot = (pts, a) => pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
const polar = (pts) => pts.map(([r, d]) => [r * Math.cos(deg(d)), r * Math.sin(deg(d))]);
const BLADE = [[0.05, 0.03], [R_T - 0.37, 0.22], [R_T, 0], [1.3, 0.36], [0.05, 0.3]]; // 前邊(根部 → 斜面 → 腳尖)、後邊
const CLAW = polar([[0.11, 0], [0.18, 4], [0.26, 4], [0.34, 2], [HOOK, 0], [0.36, 10], [0.29, 24], [0.2, 36], [0.11, 42]]);
const blades = [0, 1, 2].map((i) => rot(BLADE, (i * TAU) / 3));
const hooks = [0, 1, 2].map((i) => rot(CLAW, (i * TAU) / 3));

/** 擺累計擺動 v → 擺角(逆時針為正:擺的下端往右) */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({
    center: [0, 0],
    teeth: [...blades, ...hooks],
    layers: ["front", "front", "front", "flask", "flask", "flask"],
    dir: -1,
    period: 4 * SWING,
    pitch: TAU / 3,
    stops: (v) => [
      ...[STOP_D, STOP_E].map((b) => ({ poly: placePoly(b, PIVOT, pendulumAngle(v)), layer: "front" })),
      ...[UPPER_RIM, LOWER_RIM].map((b) => ({ poly: placePoly(b.map(local), PIVOT, pendulumAngle(v)), layer: "flask" })),
    ],
  }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、三腳輪轉角(順時針為負,由接觸算) */
export function threeLeg(v) {
  return { pendulum: pendulumAngle(v), wheel: escapement.angle(v) };
}

// 瓶形的板:照 525 px 原圖量的輪廓(輪心在原圖 y 351.7,每 px 0.01)——[原圖 y, 半寬 px]
const PROFILE = [[30, 46.5], [70, 49.5], [100, 54], [130, 61], [160, 72], [180, 81], [200, 93], [220, 111], [240, 139], [260, 172], [280, 196.5], [300, 211], [320, 219.5], [340, 223.5], [350, 224], [360, 223], [380, 217], [400, 205], [420, 184], [430, 169], [440, 148.5], [450, 120.5], [458, 90], [462, 72], [465, 52], [466.5, 30], [467, 0]];
const side = PROFILE.map(([y, w]) => [w * 0.01, (351.7 - y) * 0.01]); // 右側,從頸頂往下(輪心為原點)
const NECK = side[0][1]; // 頸頂(原圖撕斷處)
const FLASK = [...side.slice(0, -1).map(([x, y]) => [-x, y]).reverse(), ...side].map(local).reverse(); // 逆時針

// ── 推斷的重錘驅動與機架 ──
const BACK_Z = -0.6; // 夾板條
const ROPE_R = 0.03;
const DRUM_R = 0.12;
const DRUM = { center: [0, 0, -0.3], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 2 * 4 * SWING; // 擺兩個來回(輪轉三分之二圈)上鍊一次
const WEIGHT = { radius: 0.15, height: 0.4 };
const hang = weightDrive({
  drum: DRUM,
  eye: [DRUM.radius, -1.3, DRUM.center[2]],
  reserve: DRUM.radius * 2 * (TAU / 3),
  spare: TAU * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND); // 輪往前(順時針)轉的角度
/** 量測與檢查用 */
export const geometry = { P, R_T, HOOK, RIM, STEP_X, OVAL, DRUM, REWIND };

const PALLET = { w: 0.07, t: 0.16 }; // 台階 A、B 的面(原圖的黑塊),嵌在口緣的實心那一側

export default {
  figure: 307,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: [...PIVOT, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(FLASK, [OVAL_HOLE.slice().reverse()]), thickness: 0.12 }, // 瓶身,開著橢圓口
        { kind: "box", size: [0.24, P - NECK + 0.1, 0.12], at: [0, (NECK - P - 0.1) / 2, 0] }, // 擺桿:瓶頸往上收到樞軸(推斷)
        { kind: "cylinder", radius: 0.17, inner: 0.05, length: 0.12 }, // 擺桿頂端的轂,套在樞軸銷上
        // 叉瓦 A、B:口緣的台階面
        { kind: "box", size: [PALLET.w, RIM.high - RIM.low + 0.04, PALLET.t], at: [STEP_X + PALLET.w / 2, (RIM.high + RIM.low) / 2 + 0.02 - P, 0], accent: true },
        { kind: "box", size: [PALLET.w, RIM.high - RIM.low + 0.04, PALLET.t], at: [-STEP_X - PALLET.w / 2, -(RIM.high + RIM.low) / 2 - 0.02 - P, 0], accent: true },
        // 止動齒 D、E:釘在瓶身前面的擋塊,伸到腳那一層;各兩顆螺絲
        { kind: "plate", shape: shape(STOP_D), thickness: 0.14, at: [0, 0, 0.13] },
        { kind: "plate", shape: shape(STOP_E), thickness: 0.14, at: [0, 0, 0.13] },
        ...[-1, 1].flatMap((s) => [R_T + 0.08, R_T + 0.3].map((x) => ({ kind: "cylinder", radius: 0.035, length: 0.04, at: [s * x, -Math.sqrt(RHO * RHO - x * x) - s * 0.06, 0.22] }))), // 螺絲在擋塊厚度的中間
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: 0.7,
      spinOffset: 0.25, // 轉向箭頭擺到腳的前面
      pieces: [
        ...blades.map((b, i) => ({ kind: "plate", shape: shape(b), thickness: 0.08, at: [0, 0, 0.14], accent: i === 0 })), // 長腳(瓶身前面)
        { kind: "plate", shape: shape(circle(0.13)), thickness: 0.1 }, // 輪轂(在橢圓口裡)
        ...hooks.map((h) => ({ kind: "plate", shape: shape(h), thickness: 0.1 })), // 腳根的鉤(和口緣同一層)
        { kind: "cylinder", radius: 0.12, length: 0.23, at: [0, 0, 0.065] }, // 輪轂往前接到長腳
        { kind: "cylinder", radius: 0.05, length: -BACK_Z - 0.05, at: [0, 0, (BACK_Z - 0.05) / 2] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.16, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 夾板條(推斷):從三腳輪的軸往上到擺的樞軸
        ...plateBar({ points: [[0, 0], PIVOT], z: BACK_Z }),
        { kind: "cylinder", radius: 0.05, length: 0.1 - BACK_Z, at: [...PIVOT, (0.1 + BACK_Z) / 2] }, // 擺的樞軸銷
      ],
    },
    { id: "labelA", kind: "group", center: [STEP_X + 0.05, RIM.high, 0.3], label: "A", labelOffset: [0.2, 0.15, 0] },
    { id: "labelB", kind: "group", center: [-STEP_X - 0.05, -RIM.high, 0.3], label: "B", labelOffset: [-0.2, -0.2, 0] },
    { id: "labelD", kind: "group", center: [-(R_T + 0.2), -0.05, 0.3], label: "D", labelOffset: [0, -0.3, 0] },
    { id: "labelE", kind: "group", center: [R_T + 0.2, 0.05, 0.3], label: "E", labelOffset: [0, 0.3, 0] },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺;三腳輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘照模型的姿勢走),
  // 長腳的腳尖由 D、E 輪流擋住,放開後腳根的鉤推 A、B
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [0, 0, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,三腳輪轉六分之一圈" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,三腳輪轉三分之一圈" },
      { part: "wheel", label: "擺兩個來回,三腳輪轉三分之二圈", quote: "具有較長的止動齒 D 和 E。A 和 B 為擒縱叉瓦" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 三腳輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    const w = weightAt(v);
    return {
      parts: {
        pendulum: { angle: t.pendulum },
        wheel: { angle: t.wheel },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
