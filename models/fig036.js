// 第 36 種:曼格輪與小齒輪。小齒輪連續旋轉,使曼格輪往復旋轉。曼格輪面上有一道 C 形的齒槽,
// 槽外緣是朝內的齒、內緣是朝外的齒;小齒輪的軸在直立靜止桿的直線溝槽內升降:
// 在下方時與外緣的齒(內咬合)嚙合,輪與小齒輪同向轉;走到槽的盡頭,小齒輪繞過端頭升到上方,
// 改與內緣的齒(外咬合)嚙合,輪就反向轉回來。輪面上沿齒槽的溝(此處以刻線表示)引導小齒輪的軸。
// 繞過端頭時輪停住,小齒輪沿端頭的半圓齒滾過去(推斷:原文未描述端頭的細節);軸心因此略偏離溝槽中線,
// 溝槽留了這點寬度(原文:小齒輪的軸有振動運動)。
import { TAU, deg } from "./kit.js";
import { arcPoints, circle } from "./shapes.js";
import { toothedLoop, resample } from "./noncircular.js";

const RP = 0.38; // 小齒輪節圓半徑
const NP = 10;
const PITCH = (TAU * RP) / NP;
const SPAN = deg(300); // 齒槽涵蓋的角度,缺口在左側
const A_LO = deg(-150);
const A_HI = deg(150);
// 外緣、內緣的節圓弧長都是齒距的整數倍;兩個端頭半圓的弧長合計 π(RO − RI) = 0.6·(NO − NI)·齒距,
// NO − NI 取 5 的倍數,整圈齒槽的齒數才是整數——否則齒的相位在 A_LO 端接不上,小齒輪沿內緣走時
// 齒會對不上內緣的齒(差 0.3 齒距)而撞進去
const NO = Math.round((SPAN * 2.15) / PITCH); // 外緣的齒數(47)
const NI = NO - 20; // 內緣的齒數(27)
const RO = NO * (PITCH / SPAN); // 外緣節圓半徑
const RI = NI * (PITCH / SPAN); // 內緣節圓半徑
const RC = (RO + RI) / 2;
const RHO = (RO - RI) / 2; // 端頭半圓的節圓半徑
const LOW = -(RO - RP); // 小齒輪軸心:與外緣嚙合時(下)
const HIGH = -(RI + RP); // 與內緣嚙合時(上)
const LA = (SPAN * RO) / RP; // 沿外緣滾一趟,小齒輪轉的角度
const LC = (SPAN * RI) / RP;
// 繞過端頭:輪停住,小齒輪在端頭半圓(節圓半徑 RHO)裡沿齒滾動——軸心繞端頭圓心走半圈(半徑 RHO − RP),
// 小齒輪本身轉 π·(RHO − RP)/RP(內擺線:軸心繞行的方向與自轉相反)。齒沿整圈齒槽以弧長均分,
// 純滾動就自然接上內緣的齒,不必湊整數齒距。
const SWAY = RHO - RP; // 軸心繞端頭時偏離直線溝槽中線的量(溝槽要留這個寬度)
const U = (Math.PI * SWAY) / RP;
const PERIOD = LA + U + LC + U;

/** 小齒輪轉 alpha 時:輪的轉角、小齒輪軸心位置、正在與哪一緣嚙合 */
export function mangle(alpha) {
  const t = ((alpha % PERIOD) + PERIOD) % PERIOD;
  if (t < LA) return { wheel: -Math.PI / 2 - (A_HI - (t * RP) / RO), x: 0, y: LOW, track: "outer" };
  if (t < LA + U) {
    // A_LO 端:端頭圓心在正下方 (0, −RC),軸心從外側(下)順時針繞到內側(上),偏向左邊
    const beta = -Math.PI / 2 - (Math.PI * (t - LA)) / U;
    return { wheel: -Math.PI / 2 - A_LO, x: SWAY * Math.cos(beta), y: -RC + SWAY * Math.sin(beta), track: "turn" };
  }
  if (t < LA + U + LC) return { wheel: -Math.PI / 2 - (A_LO + ((t - LA - U) * RP) / RI), x: 0, y: HIGH, track: "inner" };
  // A_HI 端:從內側(上)順時針繞回外側(下),偏向右邊
  const beta = Math.PI / 2 - (Math.PI * (t - LA - U - LC)) / U;
  return { wheel: -Math.PI / 2 - A_HI, x: SWAY * Math.cos(beta), y: -RC + SWAY * Math.sin(beta), track: "turn" };
}
export const radii = { RO, RI, RP };
// 小齒輪在外緣中段(輪正好轉到原圖位置)時的主動量
const START = ((A_HI + Math.PI / 2) * RO) / RP;

// 齒槽的節曲線:外緣弧(逆時針)→ 上端頭半圓 → 內緣弧(順時針)→ 下端頭半圓
const end = (a, from, to) => {
  const c = [RC * Math.cos(a), RC * Math.sin(a)];
  return arcPoints(RHO, from, to, c[0], c[1]).slice(1, -1);
};
const pitchLoop = resample(
  [
    ...arcPoints(RO, A_LO, A_HI),
    ...end(A_HI, A_HI, A_HI + Math.PI),
    ...arcPoints(RI, A_HI, A_LO),
    ...end(A_LO, A_LO + Math.PI, A_LO + TAU),
  ],
  0.02,
);
const M = PITCH / Math.PI;
const toothed = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: SPAN * RO, into: -1 });
// 端頭半圓的齒修短(齒高七成):半圓的曲率緊(RHO 只比 RP 大一點),梯形齒的齒頂在那裡會與小齒輪的齒頂互相卡到
const slot = toothed.map((q, i) => {
  const p = pitchLoop[i];
  const a = Math.atan2(p[1], p[0]);
  const onCap = Math.cos(a) < Math.cos(SPAN / 2); // 局部角在 A_LO 到 A_HI 的範圍之外(缺口那一側)
  return onCap ? [p[0] + 0.7 * (q[0] - p[0]), p[1] + 0.7 * (q[1] - p[1])] : q;
});

// 引導小齒輪軸的溝:軸心的路徑(外緣弧內側、內緣弧外側、端頭繞半圓)
const guide = [
  ...arcPoints(RO - RP, A_LO, A_HI),
  ...arcPoints(SWAY, A_HI, A_HI + Math.PI, RC * Math.cos(A_HI), RC * Math.sin(A_HI)).slice(1, -1),
  ...arcPoints(RI + RP, A_HI, A_LO),
  ...arcPoints(SWAY, A_LO + Math.PI, A_LO + TAU, RC * Math.cos(A_LO), RC * Math.sin(A_LO)).slice(1, -1),
];

export default {
  figure: 36,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: circle(2.75), holes: [slot.reverse(), circle(0.14).reverse()] },
      thickness: 0.22,
      engrave: [guide],
      circles: [2.62, 0.45],
      hub: 0.3,
      mark: [-2.35, 0],
      markSize: 0.1,
      spin: 2.75,
    },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.3, web: false, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.9 }] },
    {
      id: "post",
      kind: "plate",
      center: [0, 0, 0.32],
      shape: {
        outline: [...arcPoints(0.26, 0, Math.PI, 0, HIGH + 0.2), [-0.26, -3.0], [-0.55, -3.1], [-0.55, -3.3], [0.55, -3.3], [0.55, -3.1], [0.26, -3.0]],
        // 直線溝槽:寬度留給小齒輪軸(半徑 0.06)繞端頭時的側向偏移(原文:小齒輪的軸有振動運動)
        holes: [[...arcPoints(SWAY + 0.07, 0, Math.PI, 0, HIGH), ...arcPoints(SWAY + 0.07, Math.PI, TAU, 0, LOW)].reverse()],
      },
      thickness: 0.12,
    },
  ],
  driver: { part: "pinion", type: "rotation", initial: START, speed: 2.5 },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { wheel, x, y } = mangle(alpha);
    return {
      parts: {
        wheel: { angle: wheel },
        pinion: { position: [x, y, 0], angle: -Math.PI / 2 + Math.PI / NP + alpha },
      },
      readouts: [],
    };
  },
};
