// 第 293 種:雙合式擒縱(錶用),兼具正齒輪與冠狀輪的特性:輪緣外的長齒(原圖的 D、c)負責鎖住,輪面上一圈立起的冠狀齒
// (原圖端面看到的小圓 a)負責給衝量。
// 擺輪軸 A 上帶著叉瓦 B,每次往一個方向擺時從冠狀齒接收一個衝量;軸 A 上切有一道凹槽,
// 長齒的齒尖平時靠在軸上(輪不動),凹槽轉過來時齒尖落進凹槽、被軸帶過去(解鎖),輪轉起來,冠狀齒趕上叉瓦 B、推著它走(給衝量),
// 再落到下一個長齒靠上軸為止。擺回來時齒尖只落進凹槽一點、又被推回(不放行),叉瓦 B 從兩個冠狀齒之間掃過。擺輪每來回一次,輪轉過一齒(原圖箭頭:輪的上緣往右,順時針)。
// 主動件是擺輪(累計擺動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,兩層分開算):長齒只碰軸上的滾子(凹槽),冠狀齒只碰叉瓦 B。
// 推斷:擺幅、齒數、凹槽的大小與方位、叉瓦 B 的長度與方位(B 只伸進冠狀齒圈 0.04,擺回來時才掃得過兩齒之間;
// 原圖 B 朝正下方,模型的 B 在擺輪居中時斜 20°,掃過冠狀齒圈的時段才排在解鎖之後;滾子伸進齒尖圓 0.06,
// 齒尖才真的頂在滾子上);冠狀齒相對長齒的位置(CROWN.offset):B 掃進冠狀齒圈時正好落在剛過去的一根冠狀齒後面、
// 兩齒之間,接著由下一根追上推它走(衝量)——錯開一點,B 就會落在冠狀齒頂上、把輪往回推,或根本等不到冠狀齒;
// 輪軸與擺輪軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的擺輪(原圖沒畫):擺輪軸往後穿過夾板條,擺輪(輪緣與一根橫臂)在夾板條後面——放在前面會擋住滾子與凹槽。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 234、238 種一樣):輪軸往後穿過夾板條,
// 軸上的鼓繞著繩,繩從鼓的右側垂下吊著重錘,重錘的重量就是讓輪順時針轉的固定力矩;輪轉多少,重錘降多少,
// 被滾子擋住時重錘也停。重錘每降一段(擺輪來回八次)捲回最高處一次(上鍊,畫面上一下子回到上面)。
// 錶實際上用發條經輪系帶動,這裡用重錘只是示意。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { escapeByContact, placePoly, ccw } from "./escapement.js";
import { shape, circle, arcPoints, rect } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 18;
export const PITCH = TAU / N;
export const SWING = deg(100);
const W = [0, -2.2]; // 輪心(原圖只畫出上方一段輪緣)
const R = 2.3; // 輪緣
const TIP = 2.5; // 長齒的齒尖
const CROWN = { r: 2.12, offset: 0.38, size: [0.14, 0.06], height: 0.45 }; // 冠狀齒:半徑、相對長齒的位置(齒距的比例)
const ROLL = 0.35; // 軸上的滾子
const NOTCH = { at: deg(258), width: deg(40), depth: 0.1 }; // 凹槽(擺輪居中時的方位)
const A = [W[0] + (TIP + ROLL - 0.06) * Math.sin(deg(10)), W[1] + (TIP + ROLL - 0.06) * Math.cos(deg(10))]; // 滾子伸進長齒的齒尖圓 0.06
const B_LEN = 0.63; // 叉瓦 B 的尖端離輪心 2.11,伸進冠狀齒圈 0.04

// 長齒:細長的尖齒,齒尖往前(順時針)略傾
const lockTooth = (i) => {
  const a = i * PITCH;
  const p = (r, da) => [r * Math.cos(a + da), r * Math.sin(a + da)];
  return [p(R - 0.05, deg(1.4)), p(TIP, deg(-0.5)), p(R - 0.05, deg(-1.9))];
};
const crownTooth = (i) => {
  const a = (i + CROWN.offset) * PITCH;
  return ccw(rect(...CROWN.size, 0, 0).map(([x, y]) => [CROWN.r * Math.cos(a) - y * Math.cos(a) - x * Math.sin(a), CROWN.r * Math.sin(a) - y * Math.sin(a) + x * Math.cos(a)]));
};
const teeth = [...Array.from({ length: N }, (_, i) => lockTooth(i)), ...Array.from({ length: N }, (_, i) => crownTooth(i))];
const layers = teeth.map((_, i) => (i < N ? "lock" : "crown"));

// 軸上的滾子(切一道凹槽)與叉瓦 B(相對軸 A)
const roller = (() => {
  const a0 = NOTCH.at - NOTCH.width / 2;
  const a1 = NOTCH.at + NOTCH.width / 2;
  const inner = ROLL - NOTCH.depth;
  return [...arcPoints(ROLL, a1, a0 + TAU), [inner * Math.cos(a0), inner * Math.sin(a0)], [inner * Math.cos(a1), inner * Math.sin(a1)]];
})();
// 叉瓦 B 在軸上的方位:長齒被凹槽帶過去(解鎖)要轉約 64°,B 掃過冠狀齒圈的時段排在解鎖之後
const B_AT = deg(-20); // 擺輪轉到 +20° 時 B 朝正下方
const PALLET_B = placePoly(rect(0.07, B_LEN, 0, -B_LEN / 2 - 0.05), [0, 0], B_AT);

/** 擺輪累計擺動 v → 擺輪角(居中為 0;先往受衝量的方向——逆時針——擺) */
export const balanceAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({
    center: W,
    teeth,
    layers,
    dir: -1,
    period: 4 * SWING,
    pitch: PITCH,
    samples: 1440,
    stops: (v) => [
      { poly: placePoly(roller, A, balanceAngle(v)), layer: "lock" },
      { poly: placePoly(PALLET_B, A, balanceAngle(v)), layer: "crown" },
    ],
  }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角、輪轉角(順時針為負:上緣往右) */
export function duplex(v) {
  return { balance: balanceAngle(v), wheel: escapement.angle(v) };
}

// 推斷的擺輪(相對軸 A):輪緣、橫臂與輪轂,在夾板條後面
const BALANCE = { r: 0.9, rim: 0.09, z: -0.78 };
// 推斷的重錘驅動:鼓在輪軸上、夾板條後面;繩從鼓的右側垂下吊重錘
const ROPE_R = 0.035;
const DRUM_R = 0.18;
const DRUM_Z = -0.8;
const DRUM = { center: [...W, DRUM_Z], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 8 * 4 * SWING; // 擺輪來回八次(輪轉過八齒)上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  eye: [W[0] + DRUM.radius, -3.3, DRUM_Z],
  reserve: DRUM.radius * 8 * PITCH,
  spare: 2 * Math.PI * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND);
/** 重錘驅動的鼓與上鍊間隔(檢查用) */
export const WEIGHT_DRIVE = { drum: DRUM, every: REWIND };

// 字母跟著齒走:D、c 標在長齒的齒尖外,a 標在冠狀齒旁(照原圖:D 在左、c 在右,中間那根長齒的齒尖在 A 的凹槽口;
// B 伸到中間那個 a)
const W0 = escapement.angle(0);
const nearest = (angles, target) => angles.reduce((best, a, i) => (Math.abs(Math.atan2(Math.sin(a + W0 - target), Math.cos(a + W0 - target))) < Math.abs(Math.atan2(Math.sin(angles[best] + W0 - target), Math.cos(angles[best] + W0 - target))) ? i : best), 0);
const LOCK_ANGLES = Array.from({ length: N }, (_, i) => i * PITCH);
const CROWN_ANGLES = Array.from({ length: N }, (_, i) => (i + CROWN.offset) * PITCH);
const MIDDLE = nearest(LOCK_ANGLES, Math.atan2(A[1] - W[1], A[0] - W[0])); // 齒尖在凹槽口的那根長齒
const TAGS = [
  { id: "labelD", text: "D", at: LOCK_ANGLES[(MIDDLE + 1) % N], r: TIP + 0.18, z: 0.1 },
  { id: "labelC", text: "c", at: LOCK_ANGLES[(MIDDLE + N - 1) % N], r: TIP + 0.18, z: 0.1 },
  ...[1, 0, -1].map((k, j) => {
    const i = (nearest(CROWN_ANGLES, Math.atan2(A[1] - W[1], A[0] - W[0]) + deg(4)) + k + N) % N;
    return { id: `labelCrown${j}`, text: "a", at: CROWN_ANGLES[i], r: CROWN.r - 0.24, z: 0.56 };
  }),
];
const tagAt = (t, w) => [W[0] + t.r * Math.cos(t.at + w), W[1] + t.r * Math.sin(t.at + w), t.z];

export default {
  figure: 293,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: 1.5,
      spinOffset: 0.12, // 轉向箭頭在輪緣內側、輪面前面(輪頂上方是軸 A 與叉瓦 B)
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(R - 0.45).reverse()]), thickness: 0.12 },
        ...Array.from({ length: N }, (_, i) => ({ kind: "plate", shape: shape(lockTooth(i)), thickness: 0.12 })),
        ...Array.from({ length: N }, (_, i) => {
          const a = (i + CROWN.offset) * PITCH;
          return { kind: "box", size: [CROWN.size[1], CROWN.size[0], CROWN.height], at: [CROWN.r * Math.cos(a), CROWN.r * Math.sin(a), 0.06 + CROWN.height / 2], angle: a, accent: i === 0 };
        }),
        ...Array.from({ length: 3 }, (_, i) => ({ kind: "box", size: [2 * R - 0.6, 0.14, 0.1], angle: (i * Math.PI) / 3 + 0.2 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.95, at: [0, 0, -0.475] }, // 輪軸,往後穿過夾板條到鼓
        { kind: "cylinder", radius: DRUM_R, length: 0.26, at: [0, 0, DRUM_Z] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "staffA",
      kind: "group",
      center: [...A, 0],
      spin: 0.32,
      label: "A",
      labelOffset: [-0.3, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(roller), thickness: 0.12 }, // 軸上的滾子與凹槽(長齒那一層)
        { kind: "cylinder", radius: 0.05, length: 1.45, at: [0, 0, -0.125] }, // 擺輪軸,往後穿過夾板條到擺輪
        { kind: "plate", shape: shape(PALLET_B), thickness: 0.08, at: [0, 0, 0.3], accent: true }, // 叉瓦 B(冠狀齒那一層)
        // 擺輪(推斷):輪緣、橫臂與輪轂,固定在軸上
        { kind: "cylinder", radius: BALANCE.r, inner: BALANCE.r - BALANCE.rim, length: 0.06, at: [0, 0, BALANCE.z] },
        { kind: "box", size: [2 * BALANCE.r - 0.04, 0.08, 0.05], at: [0, 0, BALANCE.z] },
        { kind: "cylinder", radius: 0.1, length: 0.1, at: [0, 0, BALANCE.z] },
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [W, A], z: -0.55, width: 0.24, boss: 0.16 }) },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelB", kind: "group", center: [A[0] + 0.15, A[1] - 0.6, 0.5], label: "B", labelOffset: [0.25, 0, 0] },
    ...TAGS.map((t) => ({ id: t.id, kind: "group", center: tagAt(t, W0), label: t.text, labelOffset: [0, 0, 0] })),
  ],
  // 動力重演:只推擺輪;擒縱輪受固定的力矩(重錘;重錘與繩照模型的姿勢走)往順時針轉,由軸上的凹槽擋住、放行,冠狀齒推叉瓦 B
  replay: {
    to: 8 * SWING,
    seconds: 60,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "往受衝量的方向擺一次,放走一齒", quote: "每當冠狀輪其中一齒通過衝量叉瓦(impulse pallet)B 之後,輪緣上的齒便會依序落入該凹槽中" },
      { at: 4 * SWING, part: "wheel", label: "擺回來不放行:擺輪來回一次,輪轉過一齒" },
      { part: "wheel", label: "擺輪來回兩次,輪轉過兩齒" },
    ],
  },
  driver: { part: "staffA", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.05, 0.25, 1], fit: ["staffA"] },
  pose(v) {
    const w = escapement.angle(v);
    const hung = weightAt(v);
    const tags = Object.fromEntries(TAGS.map((t) => [t.id, { position: tagAt(t, w) }]));
    return {
      parts: {
        staffA: { angle: balanceAngle(v) },
        wheel: { angle: w },
        weight: { position: [hung.eye[0], hung.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, hung.eye[2]] },
        ...tags,
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
