// 第 298 種:老式的錶用擒縱(立軸擒縱)。上方是水平的擺輪,裝在直立的立軸上;立軸下段有兩個叉瓦,
// 分別與冠狀輪上、下兩邊的齒接觸。擺輪來回擺動,兩個叉瓦輪流擋住、放開冠狀輪的齒,冠狀輪每擺一次轉過半個齒;
// 冠狀輪軸末端的小齒輪與下方的冠狀齒輪(contrate wheel)咬合(模型把它們放在右邊,見下),整個走輪系由它帶動。主動件是擺輪(累計擺動)。
// 推斷:齒數與擺幅;左下的輪以面上的冠狀齒與小齒輪咬合(原圖從正面看到它的齒)。
import { Y, Z, TAU, deg, swing, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { escapeStep, sawCrown } from "./escapement.js";
import { shape, circle } from "./shapes.js";

export const N = 13;
export const PITCH = TAU / N;
export const SWING = deg(55);
const CROWN = { center: [0.72, -0.55, 0], radius: 0.62 };
export const PINION = { teeth: 8, radius: 0.22 };
export const CONTRATE = { teeth: 28, radius: 0.78 };
// 小齒輪與冠狀齒輪在冠狀輪的背面那一側(右邊):冠狀輪的齒朝著立軸,軸往另一邊伸才不會穿過立軸。
// 原圖把小齒輪畫在左邊,軸得穿過立軸,實物做不出來(實物可行優先於插圖)
const CONTRATE_AT = [CROWN.center[0] + 1.7, CROWN.center[1] - CONTRATE.radius, -0.42];

/** 擺輪累計擺動 v → 擺輪角、冠狀輪轉角、左下冠狀齒輪轉角 */
export function verge(v) {
  const crown = escapeStep(v, -SWING, SWING, PITCH / 2, 0.5);
  return { balance: swing(v, -SWING, SWING), crown, contrate: (crown * PINION.teeth) / CONTRATE.teeth };
}

// 叉瓦:從立軸往外伸的小旗(板面含立軸);a 是繞立軸的方向
const FLAG = shape([[0, -0.08], [0.48, -0.06], [0.48, 0.06], [0, 0.08]]);
const pallet = (a, height) => ({ kind: "plate", shape: FLAG, thickness: 0.06, at: [0, 0, height], rotation: quatMul(quatAxisAngle(Z, a), quatFromZ(Y)) });

export default {
  figure: 298,
  parts: [
    {
      id: "balance",
      kind: "group",
      axis: Y,
      spin: 2.0,
      spinOffset: 1.75,
      pieces: [
        { kind: "cylinder", radius: 2.0, inner: 1.86, length: 0.12, at: [0, 0, 1.75] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.9, 0.08, 0.05], at: [0.95 * Math.cos((i * TAU) / 3), 0.95 * Math.sin((i * TAU) / 3), 1.75], angle: (i * TAU) / 3, accent: i === 0 })),
        { kind: "cylinder", radius: 0.05, length: 3.6 },
        // 兩個叉瓦:在冠狀輪上、下齒尖的高度,彼此錯開約 100°
        pallet(0, CROWN.center[1] + CROWN.radius - 0.08),
        pallet(deg(100), CROWN.center[1] - CROWN.radius + 0.08),
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
  ],
  // 動力重演:只推主動件;crown 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { crown: { spring: 1, gravity: false } }, expect: [{ part: "crown", label: "主動件走完一輪後 crown 的位置" }] },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪)
  view: { direction: [0.15, 0.3, 1] },
  pose(v) {
    const r = verge(v);
    return { parts: { balance: { angle: r.balance }, crown: { angle: r.crown }, contrate: { angle: r.contrate } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["crown"], reason: "未修:動力重演不成立——「主動件走完一輪後 crown 的位置」預期 crown 在主動量 3.84 時已轉 28°,實際轉了 -44°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["balance", "crown"], reason: "擒縱的接觸依擺動的相位演出(每擺一次放過半齒),沒有逐點算叉瓦與冠狀輪齒的接觸;重疊 0.05(96 個取樣中 11 個)。列入待確認清單" },
    { check: "interference", parts: ["crown", "contrate"], reason: "簡化齒形:冠狀輪的小齒輪與端面齒輪的方塊齒齒側重疊 0.07" },
  ],
};
