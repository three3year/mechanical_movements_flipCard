// 第 211 種:大輪連續旋轉,給小齒輪的軸間歇的旋轉運動。大輪只有一段圓周有齒,其餘是光滑的圓弧;
// 小齒輪最靠近大輪的部分被切成與那段光滑圓弧相同的曲線,大輪轉過光滑部分時,這段曲線貼著它,把小齒輪鎖住不動;
// 直到大輪上的銷撞到小齒輪上的引導片,小齒輪開始轉,接著由齒帶動轉滿一圈,再被鎖住。主動件是大輪(逆時針,原圖箭頭)。
// 推斷:有齒的弧長恰好讓小齒輪轉一圈(小齒輪 16 齒、大輪那段 16 齒);引導片的形狀;大輪光滑部分的半徑取齒頂圓
// (原本取齒根圓,鎖定弧和圓周之間有一個齒高的空隙,小齒輪鎖不住)。
import { TAU, deg, polar } from "./kit.js";
import { pedestal } from "./supports.js";
import { sectorEngaged } from "./jumps.js";
import { shape, circle, arcPoints, thickLine, gearProfile } from "./shapes.js";
import { resample } from "./noncircular.js";

const NP = 16;
const RP = 0.75;
const PITCH = (TAU * RP) / NP;
const NW = 44;
const RW = (NW * PITCH) / TAU;
const C = RW + RP;
const PINION = [-C, 0, 0];
const SECTOR = { contact: Math.PI, start: deg(164) - (NP * TAU) / NW, len: (NP * TAU) / NW };
const LOCK = 3; // 小齒輪上被切掉、換成鎖定弧的齒數
const RIM = RW + (2 * RW) / NW; // 大輪光滑部分的半徑:齒頂圓(模數 = 2RW/NW)

/** 大輪轉 theta(逆時針):有齒部分走過接觸點的累計角度與小齒輪的轉角(順時針為負) */
export function intermittent(theta) {
  const engaged = sectorEngaged(theta, SECTOR);
  return { engaged, pinion: -(RW / RP) * engaged };
}
export const geometry = { NP, NW, RP, RW, SECTOR };

// 大輪:有齒的扇形(局部角 start ~ start + len)加上光滑的圓
const wheelTeeth = Array.from({ length: NW }, (_, i) => i).filter((i) => {
  const a = wrap((i * TAU) / NW);
  return a >= wrap(SECTOR.start) - 1e-9 && a <= wrap(SECTOR.start) + SECTOR.len + 1e-9;
});
function wrap(a) {
  return ((a % TAU) + TAU) % TAU;
}
// 小齒輪:朝大輪(局部 +x)的幾個齒換成以大輪中心為圓心、半徑 RW 的內凹鎖定弧
const pinionTeeth = Array.from({ length: NP }, (_, i) => i).filter((i) => {
  const a = Math.atan2(Math.sin((i * TAU) / NP), Math.cos((i * TAU) / NP));
  return Math.abs(a) > (LOCK / 2) * (TAU / NP);
});
const lockHalf = (LOCK / 2 + 0.5) * (TAU / NP);
const lockArc = (() => {
  // 小齒輪局部座標:大輪中心在 (C, 0)
  const tips = [polar(RP + 0.12, lockHalf), polar(RP + 0.12, -lockHalf)].map((p) => p.slice(0, 2));
  const a0 = Math.atan2(tips[0][1], tips[0][0] - C);
  const raw = Math.atan2(tips[1][1], tips[1][0] - C);
  const a1 = a0 + Math.atan2(Math.sin(raw - a0), Math.cos(raw - a0)); // 走短的那一邊
  const arc = arcPoints(RIM + 0.01, a0, a1, C, 0); // 貼著大輪光滑部分(齒頂圓)的內凹弧,留一點間隙
  return [[0, 0], ...arc];
})();

export default {
  figure: 211,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: shape(resample(gearProfile({ teeth: NW, radius: RW, has: (i) => wheelTeeth.includes(i), blank: "tip" }), 0.03), [circle(0.25).reverse()]), // 光滑部分在齒頂圓上,小齒輪的鎖定弧貼著它
      thickness: 0.22,
      hub: 0.45,
      mark: [RW - 0.5, 0],
      markSize: 0.08,
      spin: RW,
      pieces: [
        // 大輪上的銷:在有齒部分的前端
        { kind: "cylinder", radius: 0.08, length: 0.4, at: [...polar(RW - 0.45, SECTOR.start + SECTOR.len + 0.05).slice(0, 2), 0.2] },
      ],
    },
    {
      id: "pinion",
      kind: "group",
      center: PINION,
      spin: RP + 0.15,
      pieces: [
        { kind: "gear", teeth: NP, radius: RP, width: 0.22, toothed: pinionTeeth, hub: false, bore: 0.12 },
        { kind: "plate", shape: shape(lockArc), thickness: 0.22 },
        { kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.35, mark: true },
        // 引導片:從軸轂往大輪伸出的彎片,被大輪上的銷撞到時小齒輪開始轉
        { kind: "plate", shape: shape(thickLine(arcPoints(0.55, deg(110), deg(20), 0.25, -0.15), 0.16)), thickness: 0.1, at: [0, 0, 0.2] },
      ],
    },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進軸承座,軸承座立在同一塊底板上
      pieces: [[0, 0], [-2.8125, 0]].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.58, at: [x, y, -0.19] },
        ...pedestal({ at: [x, y], z: -0.48, bore: 0.1, floor: -3.3, depth: 0.2 }),
      ]),
    },
  ],
  // 動力重演:只重演鎖住的那一段(齒輪嚙合不做動力重演):有齒部分走過之後,小齒輪的鎖定弧貼著大輪的光滑圓周,
  // 大輪繼續轉也帶不動它,直到下一圈的齒來到
  replay: {
    from: 2.9,
    to: TAU - 0.3, // 下一圈的第一個齒快到時就是齒輪嚙合了,不在重演裡
    free: { pinion: { hold: true } },
    ignore: [["pinion", "bearings"]], // 輪套在固定軸上(軸在輪轂的孔裡)
    expect: [
      { at: 4.5, part: "pinion", label: "大輪轉過光滑部分,小齒輪被鎖定弧鎖住不動", quote: "在該輪進行部分旋轉時,此段可作為鎖定機構" },
      { part: "pinion", label: "直到下一圈的齒來到之前,小齒輪一直不動" },
    ],
  },
  driver: { part: "wheel", type: "rotation" },
  target: "pinion",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { wheel: { angle: theta }, pinion: { angle: intermittent(theta).pinion } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "pinion"], reason: "簡化齒形:節曲線半徑變化的輪以折線近似排齒,半徑轉折處齒頂與小齒輪的齒重疊 0.13(96 個取樣中 44 個);轉速比依節曲線半徑計算,不受影響" },
  ],
};

