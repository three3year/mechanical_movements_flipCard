// 第 298 種:老式的錶用擒縱(立軸擒縱)。上方是水平的擺輪,裝在直立的立軸上;立軸下段有兩個叉瓦,
// 分別與冠狀輪上、下兩邊的齒接觸。擺輪來回擺動,兩個叉瓦輪流擋住、放開冠狀輪的齒,冠狀輪每擺一次轉過半個齒;
// 冠狀輪軸左端的小齒輪與左下方的冠狀齒輪(contrate wheel)咬合,整個走輪系由它帶動。主動件是擺輪(累計擺動)。
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
const CONTRATE_AT = [-1.75, CROWN.center[1] - CONTRATE.radius, -0.42];

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
        // 冠狀輪軸往左伸到左下輪的上方,末端的小齒輪
        { kind: "cylinder", radius: 0.04, length: 2.6, at: [0, 0, 1.1] },
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
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪)
  view: { direction: [0.15, 0.3, 1] },
  pose(v) {
    const r = verge(v);
    return { parts: { balance: { angle: r.balance }, crown: { angle: r.crown }, contrate: { angle: r.contrate } }, readouts: [] };
  },
};
