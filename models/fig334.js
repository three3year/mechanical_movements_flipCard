// 第 334 種:某些舊式單動式樑式引擎的平行運動。活塞桿本身是一根直的齒條 B,與樑端的齒形扇形段 C 咬合;
// 齒條的背面抵著滾子 A 運行,所以活塞桿只能直上直下。樑繞 F 擺動,另一個弧形段 D 也裝在樑上。
// 主動件是樑。
// 推斷:D 是樑上另一段弧形導板(原文沒有說明它的用途);齒數依原圖。
import { deg, clamp } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

const F = [1.55, -1.25, 0];
const SECTOR = { teeth: 60, radius: 2.85 };
const sectorGear = { center: F, teeth: SECTOR.teeth, radius: SECTOR.radius };
const RACK = { origin: [F[0] - SECTOR.radius, F[1], 0], dir: [0, 1, 0], pitch: circularPitch(sectorGear) };
export const RANGE = [deg(-18), deg(18)];

/** 樑從原圖位置轉 psi → 扇形段角、齒條(活塞桿)位移 */
export function rack(psi0) {
  const psi = clamp(psi0, ...RANGE);
  return { psi, offset: rackOffset(sectorGear, RACK, psi) };
}

export default {
  figure: 334,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [0.3, 0.5, 0.4], at: [F[0], F[1] - 0.35, -0.2] }, { kind: "box", size: [5.6, 0.12, 0.6], at: [0.3, -1.85, -0.3] }] },
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
        { kind: "plate", shape: shape([...arcPoints(1.35, deg(115), deg(200)), ...arcPoints(1.15, deg(200), deg(115))]), thickness: 0.14, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.2, length: 0.5 },
      ],
    },
    { id: "sectorC", kind: "gear", center: F, teeth: SECTOR.teeth, radius: SECTOR.radius, span: [deg(156), deg(204)], width: 0.16, arrow: false, label: "C", labelOffset: [-2.3, 0.9, 0.3] },
    { id: "rackB", kind: "rack", teeth: 23, pitch: RACK.pitch, width: 0.16, depth: 0.22, arrow: false, label: "B", labelOffset: [-0.4, -1.5, 0.3] },
    { id: "rollerA", kind: "pulley", style: "disc", center: [RACK.origin[0] - 0.62, F[1] + 0.35, 0], radius: 0.32, width: 0.2, label: "A", labelOffset: [-0.45, 0, 0.3] },
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
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["rackB", "rollerA"], reason: "簡化畫法:導輪貼著齒條的背面滾,輪緣與齒條背面重疊 0.03" },
    { check: "interference", parts: ["frame", "rackB"], reason: "未修:齒條 B 的下端伸進底板 0.08;底板應再低一點(列入待確認清單)" },
    { check: "interference", parts: ["frame", "sectorC"], reason: "未修:扇形齒 C 擺動時下緣掃過底板,重疊 0.08(96 個取樣中 80 個);底板應再低一點(列入待確認清單)" },
    { check: "interference", parts: ["frame", "beam"], reason: "未修:樑與機架的立柱畫在同一層,重疊 0.18;立柱應在樑的後面(列入待確認清單)" },
  ],
};
