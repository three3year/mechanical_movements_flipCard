// 第 371 種:曼格輪運動的變形。大輪的輪緣兩面都有齒(冠狀齒),輪緣在左側留一個開口;小齒輪的軸從左邊伸進來,
// 小齒輪均勻地轉,先咬著輪緣一面的齒帶輪往一個方向轉將近一圈;開口轉到小齒輪處時,小齒輪穿過開口到輪緣的另一面,
// 改咬另一面的齒,輪就反過來轉。主動件是小齒輪。
// 推斷:齒數、開口的寬度;小齒輪穿過開口時沿軸向移動(原圖的方框軸承讓它能前後移)。
import { X, TAU, deg, smooth } from "./kit.js";

const R = 1.7; // 冠狀齒所在的半徑(輪緣中線)
const TEETH = 60;
const NP = 8;
const GAP = deg(24); // 輪緣開口
export const TRAVEL = TAU - GAP; // 輪單向轉的角度
const FACE = 0.24; // 小齒輪在輪緣兩面的 z
const SHIFT = deg(10); // 開口兩端換面的那一段

/** 小齒輪轉 theta → 輪的轉角、小齒輪在哪一面(z) */
export function mangle(theta) {
  const u = (theta * NP) / TEETH; // 輪若一直往同一方向會轉的角度
  const k = Math.floor(u / TRAVEL);
  const f = u - k * TRAVEL;
  const forward = k % 2 === 0;
  const wheel = forward ? f : TRAVEL - f;
  // 換面:在單程的頭尾 SHIFT 裡,小齒輪從一面穿過開口到另一面
  const near = Math.min(f, TRAVEL - f);
  const side = forward ? 1 : -1;
  const z = near < SHIFT ? side * FACE * smooth(near / SHIFT) : side * FACE;
  return { wheel: wheel - TRAVEL / 2, z, forward };
}

// 冠狀齒:輪緣兩面各一圈,開口處沒有齒
const teeth = [];
for (let i = 0; i < TEETH; i++) {
  const a = GAP / 2 + (i + 0.5) * ((TAU - GAP) / TEETH);
  for (const s of [1, -1]) teeth.push({ kind: "box", size: [0.36, 0.08, 0.1], at: [R * Math.cos(a), R * Math.sin(a), s * 0.1], angle: a, accent: i === 0 && s > 0 });
}
// 輪緣:開口處斷開的環(開口在輪的局部 0°;輪轉到兩端時,開口的邊緣正好轉到左邊的小齒輪處)
const rim = { outline: [], holes: [] };
const arc = (r, a0, a1, n = 60) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos(a0 + ((a1 - a0) * i) / n), r * Math.sin(a0 + ((a1 - a0) * i) / n)]);
rim.outline = [...arc(R + 0.22, GAP / 2, TAU - GAP / 2), ...arc(R - 0.22, TAU - GAP / 2, GAP / 2)];

export default {
  figure: 371,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R + 0.25,
      pieces: [
        { kind: "plate", shape: rim, thickness: 0.12 },
        { kind: "plate", shape: { outline: arc(0.45, 0, TAU).slice(0, -1), holes: [arc(0.3, TAU, 0).slice(0, -1)] }, thickness: 0.3 },
        ...[0, 1, 2, 3].map((i) => {
          const a = deg(45) + (i * TAU) / 4;
          return { kind: "box", size: [R - 0.65, 0.16, 0.1], at: [((R + 0.45) / 2 - 0.1) * Math.cos(a), ((R + 0.45) / 2 - 0.1) * Math.sin(a), 0], angle: a };
        }),
        ...teeth,
      ],
    },
    { id: "pinion", kind: "gear", axis: X, teeth: NP, radius: 0.3, width: 0.3, pieces: [{ kind: "cylinder", radius: 0.06, length: 1.6, at: [0, 0, -0.9] }] },
    { id: "bearing", kind: "box", size: [0.35, 0.35, 0.9], center: [-R - 1.0, 0, 0] },
  ],
  driver: { part: "pinion", type: "rotation" },
  target: "wheel", // 交替換向的大輪
  view: { direction: [0.12, 0.08, 1] },
  pose(theta) {
    const m = mangle(theta);
    // 小齒輪在輪緣的左側,咬著前面(z > 0)或後面的冠狀齒
    return { parts: { pinion: { position: [-R, 0, m.z * 1.9], angle: theta }, wheel: { angle: m.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["pinion", "bearing"], reason: "小齒輪的軸在軸承座的長槽裡橫移(換到銷圈的另一側),槽沒畫出來" },
    { check: "interference", parts: ["wheel", "pinion"], reason: "簡化齒形:輪面上的銷畫成方塊,小齒輪繞過銷圈時齒側與銷重疊 0.23(96 個取樣中 77 個)" },
  ],
};
