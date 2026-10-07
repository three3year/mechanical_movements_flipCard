// 第 298 種:老式的錶用擒縱(立軸擒縱)。上方是水平的擺輪,裝在直立的立軸上;立軸下段有兩個叉瓦,
// 分別與冠狀輪上、下兩邊的齒接觸。冠狀輪的齒推開一個叉瓦、從它的尖端滑過,立軸跟著轉,另一個叉瓦伸進對邊的齒間,
// 擋住齒並把輪推回一點(回退);擺輪擺回來時再換過來。冠狀輪每擺一次轉過半個齒;
// 冠狀輪軸末端的小齒輪與下方的冠狀齒輪(contrate wheel)咬合(模型把它們放在右邊,見下),整個走輪系由它帶動。
// 主動件是擺輪(累計擺動);目標件是冠狀輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 crownByContact):冠狀輪受發條的固定力矩轉動,叉瓦只在輪的上、下兩端碰到齒,
// 在那兩個水平切面上算齒與叉瓦的接觸。立軸緊貼在齒尖外 0.08,叉瓦短(離軸 0.2)、彼此相隔 96°;
// 這種擒縱的回退很大(輪來回晃),是立軸擒縱本來的樣子。
// 推斷:齒數、擺幅、叉瓦的長短與夾角;左下的輪以面上的冠狀齒與小齒輪咬合(原圖從正面看到它的齒);
// 冠狀輪軸的軸承座(原圖沒畫)。
import { Y, TAU, deg, swing } from "./kit.js";
import { crownByContact, sawCrown } from "./escapement.js";
import { shape, circle } from "./shapes.js";

export const N = 13;
export const PITCH = TAU / N;
export const SWING = deg(28);
const CROWN = { center: [0.72, -0.55, 0], radius: 0.62 };
const TOOTH = { base: 0.075, height: 0.25 }; // 冠狀齒(沿輪軸,朝立軸)
const STAFF_X = CROWN.center[0] - (TOOTH.base + TOOTH.height + 0.08); // 立軸:在齒尖外 0.08
const PALLET = { length: 0.2, width: 0.06, at: deg(48) }; // 叉瓦:離軸的長度、厚度、偏離「朝冠狀輪」方向的角度(上叉瓦 −、下叉瓦 +)
export const PINION = { teeth: 8, radius: 0.22 };
export const CONTRATE = { teeth: 28, radius: 0.78 };
// 小齒輪與冠狀齒輪在冠狀輪的背面那一側(右邊):冠狀輪的齒朝著立軸,軸往另一邊伸才不會穿過立軸。
// 原圖把小齒輪畫在左邊,軸得穿過立軸,實物做不出來(實物可行優先於插圖)
const CONTRATE_AT = [CROWN.center[0] + 1.7, CROWN.center[1] - CONTRATE.radius, -0.42];

/** 擺輪累計擺動 v → 擺輪角 */
export const balanceAngle = (v) => swing(v, -SWING, SWING);
// 叉瓦在切面上的截面:擺輪局部 (lx, ly) 是世界 (x, −z);切面座標 x = 前端齒走的方向(世界 −z)、y = 齒高(沿輪軸量)
const palletSection = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const w = PALLET.width / 2;
  const local = [[0.04 * c + w * s, 0.04 * s - w * c], [PALLET.length * c + w * s, PALLET.length * s - w * c], [PALLET.length * c - w * s, PALLET.length * s + w * c], [0.04 * c - w * s, 0.04 * s + w * c]];
  return local.map(([lx, ly]) => [ly, CROWN.center[0] - STAFF_X - lx]);
};
export const escapement = {
  ...crownByContact({
    radius: CROWN.radius - 0.02,
    teeth: N,
    height: TOOTH.height,
    base: TOOTH.base,
    front0: Math.PI / 2, // 冠狀輪局部角 90° 對著上端
    front: (v) => [palletSection(-PALLET.at + balanceAngle(v))],
    back: (v) => [palletSection(PALLET.at + balanceAngle(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角、冠狀輪轉角(由接觸算)、左下冠狀齒輪轉角 */
export function verge(v) {
  const crown = escapement.angle(v);
  return { balance: balanceAngle(v), crown, contrate: (crown * PINION.teeth) / CONTRATE.teeth };
}

// 叉瓦:立軸上的小方塊(沿立軸高 0.16),a 是繞立軸的方向
const pallet = (a, height) => ({ kind: "box", size: [PALLET.length - 0.04, PALLET.width, 0.16], at: [((PALLET.length + 0.04) / 2) * Math.cos(a), ((PALLET.length + 0.04) / 2) * Math.sin(a), height], angle: a });

export default {
  figure: 298,
  parts: [
    {
      id: "balance",
      kind: "group",
      axis: Y,
      center: [STAFF_X, 0, 0],
      spin: 2.0,
      spinOffset: 1.75,
      pieces: [
        { kind: "cylinder", radius: 2.0, inner: 1.86, length: 0.12, at: [0, 0, 1.75] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.9, 0.08, 0.05], at: [0.95 * Math.cos((i * TAU) / 3), 0.95 * Math.sin((i * TAU) / 3), 1.75], angle: (i * TAU) / 3, accent: i === 0 })),
        { kind: "cylinder", radius: 0.05, length: 3.6 },
        // 兩個叉瓦:在冠狀輪上、下齒尖的高度,彼此錯開 96°
        pallet(-PALLET.at, CROWN.center[1] + CROWN.radius - 0.02), // 上叉瓦
        pallet(PALLET.at, CROWN.center[1] - CROWN.radius + 0.02), // 下叉瓦
      ],
    },
    {
      id: "crown",
      kind: "group",
      axis: [-1, 0, 0],
      center: CROWN.center,
      spin: CROWN.radius,
      pieces: [
        { kind: "cylinder", radius: CROWN.radius, inner: CROWN.radius - 0.08, length: 0.15 },
        { kind: "plate", shape: shape(circle(CROWN.radius - 0.04), [circle(0.05).reverse()]), thickness: 0.04, at: [0, 0, -0.06] },
        ...sawCrown({ teeth: N, radius: CROWN.radius - 0.02, height: 0.25, base: 0.075, thick: 0.05 }),
        // 冠狀輪軸往右(背面)伸到右下輪的上方,末端的小齒輪
        { kind: "cylinder", radius: 0.04, length: 2.0, at: [0, 0, -0.95] },
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.2, at: [0, 0, CROWN.center[0] - CONTRATE_AT[0]] },
      ],
    },
    {
      id: "contrate",
      kind: "gear",
      crown: true,
      center: CONTRATE_AT,
      teeth: CONTRATE.teeth,
      radius: CONTRATE.radius,
      width: 0.12,
      toothDepth: 0.16,
      pieces: [{ kind: "cylinder", radius: 0.06, length: 0.6 }],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 冠狀輪軸右端的軸承與立柱、立軸下端的軸承(原圖沒畫)
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.1, inner: 0.04, length: 0.12, at: [2.7, CROWN.center[1], 0] },
        { kind: "box", size: [0.12, 1.3, 0.16], at: [2.7, CROWN.center[1] - 0.72, 0] },
        { kind: "cylinder", axis: Y, radius: 0.12, inner: 0.05, length: 0.12, at: [STAFF_X, -1.86, 0] },
        { kind: "box", size: [2.5, 0.1, 0.2], at: [STAFF_X + 1.2, -1.97, 0] },
      ],
    },
  ],
  // 動力重演:只推擺輪;冠狀輪受固定的力矩(發條)轉動,由上下兩個叉瓦輪流擋住、推回、放行(小齒輪與冠狀齒輪照模型帶動)
  replay: {
    to: 8 * SWING,
    free: { crown: { pivot: CROWN.center, spring: 1, gravity: false } },
    ignore: [["crown", "contrate"], ["crown", "frame"]], // 小齒輪與冠狀齒輪的咬合不做動力重演;冠狀輪軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "crown", label: "擺輪擺過一次,冠狀輪轉過半個齒" },
      { at: 4 * SWING, part: "crown", label: "擺輪一個來回,冠狀輪轉過一個齒" },
      { part: "crown", label: "擺輪兩個來回,冠狀輪轉過兩個齒" },
    ],
  },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪):擒縱讓它一齒一齒地放行
  view: { direction: [0.15, 0.3, 1] },
  pose(v) {
    const r = verge(v);
    return { parts: { balance: { angle: r.balance }, crown: { angle: r.crown }, contrate: { angle: r.contrate } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["crown", "contrate"], reason: "簡化齒形:冠狀輪的小齒輪與端面齒輪的方塊齒齒側重疊 0.07" },
  ],
};
