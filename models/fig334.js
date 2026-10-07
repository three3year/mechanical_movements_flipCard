// 第 334 種:某些舊式單動式樑式引擎的平行運動。活塞桿本身是一根直的齒條 B,與樑端的齒形扇形段 C 咬合;
// 齒條的背面抵著滾子 A 運行,所以活塞桿只能直上直下。樑繞 F 擺動,另一個弧形段 D 也裝在樑上。
// 主動件是樑。
// 推斷:D 是樑上的弓頭(原文沒有說明):原圖 D 的弧上畫著一串鏈節,下面垂著一根桿,判讀為以鏈條吊著抽水桿的弓頭,
// 抽水桿隨樑上下(位移 = 弓頭半徑 × 樑的轉角)。齒數依原圖。樑的樞軸 F 架在軸承座上,滾子 A 的軸由托架撐著(推斷)。
import { deg, clamp } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, thickLine, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const F = [1.55, -1.25, 0];
const SECTOR = { teeth: 60, radius: 2.85 };
const sectorGear = { center: F, teeth: SECTOR.teeth, radius: SECTOR.radius };
const RACK = { origin: [F[0] - SECTOR.radius, F[1], 0], dir: [0, 1, 0], pitch: circularPitch(sectorGear) };
export const RANGE = [deg(-18), deg(18)];
const ARCH = 1.35; // 弓頭 D 的半徑(鏈條貼在它的外緣)
const ANCHOR = deg(118); // 鏈條上端固定在弓頭上的位置(樑的局部角)
const CHAIN = 2.1; // 鏈條全長
const PUMP_ROD = 1.6;
const Z_FRONT = 0.22; // 弓頭、鏈條、抽水桿在扇形段的前面
const ROLLER_C = [F[0] - SECTOR.radius - 0.62, F[1] + 0.35, 0];

/** 樑從原圖位置轉 psi → 扇形段角、齒條(活塞桿)位移 */
export function rack(psi0) {
  const psi = clamp(psi0, ...RANGE);
  return { psi, offset: rackOffset(sectorGear, RACK, psi) };
}

/** 樑轉 psi → 抽水桿頂端的高度(鏈條從弓頭的固定點繞到最左的切點,再垂直往下) */
export function pumpTop(psi0) {
  const psi = clamp(psi0, ...RANGE);
  const wrapped = ARCH * (Math.PI - ANCHOR - psi);
  return F[1] - (CHAIN - wrapped);
}

// 鏈條:上端固定在弓頭上(隨樑轉),沿弓頭外緣繞到最左的切點,再垂直往下到抽水桿頂
function chainPoints(psi) {
  const a0 = ANCHOR + psi;
  const wrapped = Array.from({ length: 9 }, (_, i) => {
    const t = a0 + ((Math.PI - a0) * i) / 8;
    return [F[0] + (ARCH + 0.07) * Math.cos(t), F[1] + (ARCH + 0.07) * Math.sin(t), Z_FRONT];
  });
  return [...wrapped, [F[0] - ARCH - 0.07, pumpTop(psi), Z_FRONT]];
}

export default {
  figure: 334,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 樑的樞軸 F 的軸承座、滾子 A 的托架、底板,都在樑、扇形齒、齒條的後面
        ...pedestal({ at: [F[0], F[1]], z: -0.45, bore: 0.11, floor: -1.79, depth: 0.3 }),
        { kind: "box", size: [5.6, 0.12, 0.6], at: [0.3, -1.85, -0.5] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2, at: [ROLLER_C[0], ROLLER_C[1], -0.25] },
        { kind: "box", size: [0.2, ROLLER_C[1] - 0.15 + 1.79, 0.2], at: [ROLLER_C[0], (ROLLER_C[1] - 0.15 - 1.79) / 2, -0.25] },
        // 抽水桿的導套
        // (托架從導套往右繞到扇形段掃不到的地方,再往後、往上接底板)
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.16, inner: 0.08, length: 0.25, at: [F[0] - ARCH - 0.07, -2.6, Z_FRONT] },
        { kind: "box", size: [0.6, 0.1, 0.1], at: [F[0] - ARCH + 0.38, -2.6, Z_FRONT] },
        { kind: "box", size: [0.1, 0.1, 0.6], at: [F[0] - ARCH + 0.63, -2.6, -0.05] },
        { kind: "box", size: [0.1, 0.75, 0.1], at: [F[0] - ARCH + 0.63, -2.225, -0.3] },
      ],
    },
    {
      id: "beam",
      kind: "group",
      center: F,
      arrow: false,
      label: "F",
      labelOffset: [-0.15, -0.45, 0.3],
      pieces: [
        // 樑:從 F 往左上伸到扇形段,往右也伸出一段
        { kind: "plate", shape: shape(thickLine([[1.6, 0.6], [0, 0], [-2.2, 0]], 0.5)), thickness: 0.16, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(thickLine([[-2.7, 0.0], [-1.8, 1.1], [-0.6, 0.5]], 0.14)), thickness: 0.1, at: [0, 0, -0.1] },
        // 弧形段 D(樑上的另一段弧)
        { kind: "plate", shape: shape([...arcPoints(ARCH, deg(115), deg(200)), ...arcPoints(ARCH - 0.2, deg(200), deg(115))]), thickness: 0.14, at: [0, 0, Z_FRONT] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [1.25 * Math.cos(deg(150)), 1.25 * Math.sin(deg(150))]], 0.12)), thickness: 0.1, at: [0, 0, Z_FRONT - 0.1] },
        { kind: "cylinder", radius: 0.2, length: 0.5 },
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.45] }, // 樞軸,往後伸進軸承座
      ],
    },
    { id: "sectorC", kind: "gear", center: F, teeth: SECTOR.teeth, radius: SECTOR.radius, span: [deg(156), deg(204)], width: 0.16, arrow: false, label: "C", labelOffset: [-2.3, 0.9, 0.3] },
    { id: "rackB", kind: "rack", teeth: 23, pitch: RACK.pitch, width: 0.16, depth: 0.22, arrow: false, label: "B", labelOffset: [-0.4, -1.5, 0.3] },
    { id: "rollerA", kind: "pulley", style: "disc", center: ROLLER_C, radius: 0.32, width: 0.2, label: "A", labelOffset: [-0.45, 0, 0.3], pieces: [{ kind: "cylinder", radius: 0.08, length: 0.35, at: [0, 0, -0.15] }] },
    { id: "chain", kind: "chain", style: "plate", pitch: 0.2, width: 0.12, offset: 0.05 },
    { id: "pumpRod", kind: "group", pieces: [{ kind: "box", size: [0.1, PUMP_ROD, 0.1], at: [0, -PUMP_ROD / 2, 0] }, { kind: "box", size: [0.22, 0.12, 0.14], at: [0, 0, 0] }] },
    { id: "labelD", kind: "group", center: [F[0] - 1.25, F[1] + 0.25, 0], label: "D", labelOffset: [0.25, 0.25, 0.3] },
  ],
  driver: { part: "beam", grips: ["sectorC"], type: "rotation", range: RANGE, initial: 0 },
  target: "rackB", // 直上直下的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const { psi, offset } = rack(psi0);
    return {
      parts: {
        beam: { angle: psi },
        sectorC: { angle: psi },
        // 齒條沿 y、齒朝 +x(朝扇形段):局部 x 轉到世界 +y
        rackB: { position: [RACK.origin[0], RACK.origin[1] + offset, 0], angle: -Math.PI / 2 },
        // 滾子貼著齒條背面滾動
        rollerA: { angle: -offset / 0.32 },
        pumpRod: { position: [F[0] - ARCH - 0.07, pumpTop(psi0), Z_FRONT] },
      },
      paths: { chain: { points: chainPoints(clamp(psi0, ...RANGE)), closed: false, phase: 0 } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["rackB", "rollerA"], reason: "簡化畫法:導輪貼著齒條的背面滾,輪緣與齒條背面重疊 0.03" },
  ],
};
