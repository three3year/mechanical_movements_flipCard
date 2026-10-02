// 第 36 種:曼格輪與小齒輪。小齒輪連續旋轉,使曼格輪往復旋轉。曼格輪面上有一道 C 形的齒槽,
// 槽外緣是朝內的齒、內緣是朝外的齒;小齒輪的軸在直立靜止桿的直線溝槽內升降:
// 在下方時與外緣的齒(內咬合)嚙合,輪與小齒輪同向轉;走到槽的盡頭,小齒輪繞過端頭升到上方,
// 改與內緣的齒(外咬合)嚙合,輪就反向轉回來。輪面上沿齒槽的溝(此處以刻線表示)引導小齒輪的軸。
// 繞過端頭時,這裡讓輪停住、小齒輪沿溝槽直上直下(推斷:原文未描述端頭的細節)。
import { TAU, deg, smooth } from "./kit.js";
import { arcPoints, circle } from "./shapes.js";
import { toothedLoop, resample } from "./noncircular.js";

const RP = 0.38; // 小齒輪節圓半徑
const NP = 10;
const PITCH = (TAU * RP) / NP;
const SPAN = deg(300); // 齒槽涵蓋的角度,缺口在左側
const A_LO = deg(-150);
const A_HI = deg(150);
const RO = Math.round((SPAN * 2.15) / PITCH) * (PITCH / SPAN); // 外緣節圓半徑(弧長為齒距整數倍)
const RI = Math.round((SPAN * 1.2) / PITCH) * (PITCH / SPAN); // 內緣節圓半徑
const RC = (RO + RI) / 2;
const RHO = (RO - RI) / 2; // 端頭半圓的節圓半徑
const LOW = -(RO - RP); // 小齒輪軸心:與外緣嚙合時(下)
const HIGH = -(RI + RP); // 與內緣嚙合時(上)
const LA = (SPAN * RO) / RP; // 沿外緣滾一趟,小齒輪轉的角度
const LC = (SPAN * RI) / RP;
const U = Math.round((Math.PI * (RO - RI - 2 * RP)) / 2 / RP / (TAU / NP) + 1) * (TAU / NP); // 繞過端頭時小齒輪轉的角度
const PERIOD = LA + U + LC + U;

/** 小齒輪轉 alpha 時:輪的轉角、小齒輪軸心高度、正在與哪一緣嚙合 */
export function mangle(alpha) {
  const t = ((alpha % PERIOD) + PERIOD) % PERIOD;
  if (t < LA) return { wheel: -Math.PI / 2 - (A_HI - (t * RP) / RO), y: LOW, track: "outer" };
  if (t < LA + U) {
    const f = smooth((t - LA) / U);
    return { wheel: -Math.PI / 2 - A_LO, y: LOW + (HIGH - LOW) * f, track: "turn" };
  }
  if (t < LA + U + LC) return { wheel: -Math.PI / 2 - (A_LO + ((t - LA - U) * RP) / RI), y: HIGH, track: "inner" };
  const f = smooth((t - LA - U - LC) / U);
  return { wheel: -Math.PI / 2 - A_HI, y: HIGH + (LOW - HIGH) * f, track: "turn" };
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
const slot = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: SPAN * RO, into: -1 });

// 引導小齒輪軸的溝:軸心的路徑(外緣弧內側、內緣弧外側、端頭直上直下)
const guide = [...arcPoints(RO - RP, A_LO, A_HI), ...arcPoints(RI + RP, A_HI, A_LO)];

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
        outline: [...arcPoints(0.2, 0, Math.PI, 0, HIGH + 0.2), [-0.2, -3.0], [-0.55, -3.1], [-0.55, -3.3], [0.55, -3.3], [0.55, -3.1], [0.2, -3.0]],
        holes: [[...arcPoints(0.08, 0, Math.PI, 0, HIGH), ...arcPoints(0.08, Math.PI, TAU, 0, LOW)].reverse()],
      },
      thickness: 0.12,
    },
  ],
  driver: { part: "pinion", type: "rotation", initial: START, speed: 2.5 },
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { wheel, y } = mangle(alpha);
    return {
      parts: {
        wheel: { angle: wheel },
        pinion: { position: [0, y, 0], angle: -Math.PI / 2 + Math.PI / NP + alpha },
      },
      readouts: [],
    };
  },
};
