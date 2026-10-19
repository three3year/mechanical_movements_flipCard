// 第 304 種:銷輪式擒縱(與第 292 種凸柱式相似)。擒縱輪的盤面上靠近邊緣立著一圈銷(原圖畫出兩種形式:左邊 A 是 D 形、
// 右下 B 是楔形,原文說右側的形式較佳);右上方的錨形件繞軸擺動,伸下來的兩個叉瓦夾著銷圈,輪流擋住、放開銷,
// 擺每擺一次輪轉過半個銷距。銷損壞時可以單獨更換,不必整個輪報廢。主動件是錨形件(擺);目標件是擒縱輪(擒縱讓它一個銷一個銷地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact、anchorPallet):輪受重錘的固定力矩順時針轉,銷被叉瓦的鎖面擋住就停
// (鎖面是以錨形件軸為圓心的弧,鎖住時輪不回退),滑過叉瓦尖端的斜面時推動錨形件,脫開後加速走半個銷距落到另一個叉瓦上。
// 照 525 px 原圖:兩個叉瓦沿銷圈相隔半個銷距,上面的(右臂直下)從銷圈外往裡伸、下面的(左臂經輪面前方往下,底端的橫條)
// 從銷圈裡往外伸,錨形件往一邊擺時一個退出、一個伸進來;銷約 20 個(銷距約 17.6°)、輪輻 5 根;錨形件軸在銷圈切線上、
// 離叉瓦約 1.6 倍銷圈半徑(原圖約 1.7 倍)。
// 銷都做成原文說較佳的「右側」那一種——原圖右下 B 的楔形:截面是沿半徑長的梯形,後面(背著轉向)寬、朝前的一面窄,
// 兩端的斜面朝前收。原圖左邊 A 那一群 D 形銷沒有畫出(全輪的銷同一種,擒縱的接觸才每個銷都一樣),所以不標 A。
// 推斷:擺幅、叉瓦的寬度、銷的大小;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的擺(原圖沒畫;同第 292 種):錨形件的軸往後穿過夾板條的軸座,擺桿與擺錘固定在軸的後端、往下垂到輪的下方,
// 和錨形件一起擺。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 292 種一樣):輪軸上、輪與夾板條之間有一個鼓,
// 繩從鼓的右側垂下(在輪的後面),吊著輪下方的重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪轉多少重錘降多少,
// 銷被叉瓦擋住時重錘也停。擺八個來回(輪轉八個銷距)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, circle, thickLine } from "./shapes.js";
import { plateBar } from "./supports.js";

export const PINS = 20;
export const PITCH = TAU / PINS;
export const SWING = deg(5);
export const LIFT = deg(2);
const W = [-0.75, -0.55];
const R = 1.95; // 銷所在的半徑
const HOLE = R - 0.3; // 輪緣的內緣
const PIN = { back: 0.11, front: 0.05, thick: 0.09 }; // 楔形銷:後面、朝前一面的半長(沿半徑)與厚(沿轉向)
const AT = deg(-10); // 下叉瓦在銷圈上的方位
const TANGENT = [Math.sin(AT), -Math.cos(AT)]; // 順時針轉時銷的走向
const P0 = [W[0] + R * Math.cos(AT), W[1] + R * Math.sin(AT)];
const P = [P0[0] - 3.2 * TANGENT[0], P0[1] - 3.2 * TANGENT[1]]; // 錨形件軸:在銷圈的切線上

const pallet = (at, outside) => anchorPallet({ P, O: W, R, at, dir: -1, width: 0.14, lift: LIFT, lock: deg(1.2), back: 0.2, outside });
const UPPER = pallet(AT + PITCH / 2, false); // 上游半個銷距,從銷圈外往裡伸
const LOWER = pallet(AT, true); // 從銷圈裡往外伸

// 楔形銷(輪的局部座標):u 沿半徑朝外、t 是順時針轉時往前的方向;後面寬、朝前的一面窄
const pinPoly = (i) => {
  const a = i * PITCH;
  const u = [Math.cos(a), Math.sin(a)];
  const t = [Math.sin(a), -Math.cos(a)];
  const p = (s, h) => [R * u[0] + s * u[0] + h * t[0], R * u[1] + s * u[1] + h * t[1]];
  return [p(-PIN.back, -PIN.thick / 2), p(PIN.back, -PIN.thick / 2), p(PIN.front, PIN.thick / 2), p(-PIN.front, PIN.thick / 2)];
};
const pins = Array.from({ length: PINS }, (_, i) => pinPoly(i));

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: W, teeth: pins, dir: -1, period: 4 * SWING, stops: (v) => [UPPER.poly, LOWER.poly].map((p) => placePoly(p, P, anchorAngle(v))) }),
  period: 4 * SWING,
};

/** 錨形件累計擺動 v → 擺角、輪轉角(順時針為負,由接觸算) */
export function pinWheel(v) {
  return { anchor: anchorAngle(v), wheel: escapement.angle(v) };
}

const end = (p) => {
  const a = p.psi - p.s * 0.14;
  return [p.L * Math.cos(a), p.L * Math.sin(a)];
};

// 推斷的擺:擺桿與擺錘在夾板條後面,固定在錨形件軸的後端;擺錘在輪的下方
const PENDULUM = { z: -0.85, bob: 0.3 };
const ROD = P[1] - (W[1] - R - 0.25) + 0.65; // 擺桿長(錨形件軸到擺錘中心)
// 推斷的重錘驅動:鼓在輪軸上、輪與夾板條之間;繩從鼓的右側垂下吊重錘
const ROPE_R = 0.045;
const DRUM_R = 0.2;
const DRUM = { center: [...W, -0.3], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 8 * 4 * SWING; // 擺八個來回(輪轉八個銷距)上鍊一次
const WEIGHT = { radius: 0.17, height: 0.45 };
const hang = weightDrive({
  drum: DRUM,
  eye: [W[0] + DRUM.radius, W[1] - R - 0.45, DRUM.center[2]],
  reserve: DRUM.radius * 8 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND);
export const geometry = { W, R, DRUM, REWIND };

export default {
  figure: 304,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: R + 0.25,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.25), [circle(HOLE).reverse()]), thickness: 0.12, circles: [R - 0.15] },
        // 5 根輪輻:從輪轂伸進輪緣
        ...Array.from({ length: 5 }, (_, i) => {
          const a = (i * TAU) / 5 + deg(18);
          const [r0, r1] = [0.25, HOLE + 0.06];
          return { kind: "box", size: [r1 - r0, 0.14, 0.08], at: [((r0 + r1) / 2) * Math.cos(a), ((r0 + r1) / 2) * Math.sin(a), 0], angle: a };
        }),
        { kind: "cylinder", radius: 0.35, length: 0.3 },
        { kind: "cylinder", radius: 0.08, length: 0.6, at: [0, 0, -0.35] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.26, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷)
        ...pins.map((p, i) => ({ kind: "plate", shape: shape(p), thickness: 0.3, at: [0, 0, 0.2], accent: i === 0 })),
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...P, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.6, length: 0.15, at: [0, 0, 0.55] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.4, at: [0, 0, 0.35] },
        { kind: "cylinder", radius: 0.08, length: 0.55 - PENDULUM.z + 0.06, at: [0, 0, (0.55 + PENDULUM.z - 0.06) / 2] }, // 錨形件的軸,往後穿過夾板條的軸座到擺
        // 右臂直下到上面(銷圈外)的叉瓦;左臂經輪面前方往下,底端的橫條接到下面(銷圈裡)的叉瓦(兩臂在銷的前面一層)
        { kind: "plate", shape: shape(thickLine([[0.25, 0], [0.25, -2.2], end(UPPER)], 0.2)), thickness: 0.1, at: [0, 0, 0.42] },
        { kind: "plate", shape: shape(thickLine([[-0.25, 0], [-0.85, -2.75], end(LOWER)], 0.18)), thickness: 0.1, at: [0, 0, 0.42] },
        { kind: "plate", shape: shape(UPPER.poly), thickness: 0.28, at: [0, 0, 0.26] },
        { kind: "plate", shape: shape(LOWER.poly), thickness: 0.28, at: [0, 0, 0.26] },
        // 推斷的擺:轂固定在軸的後端,擺桿往下,下端是擺錘
        { kind: "cylinder", radius: 0.18, length: 0.12, at: [0, 0, PENDULUM.z] },
        { kind: "box", size: [0.1, ROD, 0.06], at: [0, -ROD / 2, PENDULUM.z] },
        { kind: "cylinder", radius: PENDULUM.bob, length: 0.14, at: [0, -ROD, PENDULUM.z] },
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [W, P], z: -0.55 }) },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelB", kind: "group", center: [W[0] + (R + 0.5) * Math.cos(deg(-50)), W[1] + (R + 0.5) * Math.sin(deg(-50)), 0.3], label: "B", labelOffset: [0, 0, 0] },
  ],
  // 動力重演:只推錨形件;擒縱輪受重錘的固定力矩順時針轉(以彈簧代替;重錘與繩照模型的姿勢走),銷由兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,輪轉過半個銷距" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,輪轉過一個銷距" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個銷距" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一個銷一個銷地放行
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const p = pinWheel(v);
    const w = weightAt(v);
    return {
      parts: {
        anchor: { angle: p.anchor },
        wheel: { angle: p.wheel },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
