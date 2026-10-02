// 第 123 種:曲柄的替代裝置。直立的雙齒條往復運動,使中央齒輪連續旋轉。齒條兩側的齒分別作用在左右兩個
// 半圓形齒扇形段上;每個扇形段固定著一個正齒輪,兩個正齒輪都咬著中央齒輪(這裡把中央齒輪與正齒輪畫在齒條後方)。
// 齒條往上時左扇形段咬合、往下時右扇形段咬合(原文的擋止裝置使兩者交替嚙合),兩個扇形段都朝同一方向轉,
// 中央齒輪因此一直朝同一方向轉。主動量是齒條的累計行程。
import { swing } from "./kit.js";
import { rackOffset, meshAngle, circularPitch } from "./gears.js";

const RS = 1.15; // 扇形段節圓半徑
const NS = 24;
const RG = 0.62; // 扇形段上正齒輪的半徑
const NG = 12;
const NC = 16; // 中央齒輪的齒數
const RC = (NC * RG) / NG; // 與正齒輪同模數
const W = RC + RG - RS; // 齒條的半寬(兩側節線在 x = ±W);中央齒輪剛好與兩個正齒輪都咬合
const Z_BACK = -0.45;
const LEFT = { center: [-W - RS, 0, 0], teeth: NS, radius: RS };
const RIGHT = { center: [W + RS, 0, 0], teeth: NS, radius: RS };
const CENTRAL = { center: [0, 0, Z_BACK], teeth: NC, radius: RC };
const GEAR_L = { center: [LEFT.center[0], 0, Z_BACK], teeth: NG, radius: RG };
const GEAR_R = { center: [RIGHT.center[0], 0, Z_BACK], teeth: NG, radius: RG };
const PITCH = circularPitch(LEFT);
const STROKE = Math.PI * RS; // 一程:扇形段轉半圈

/** 主動量 v(累計行程):齒條高度、兩個扇形段的轉角(同向,逆時針)與中央齒輪的轉角 */
export function substitute(v) {
  const y = swing(v, -STROKE / 2, STROKE / 2);
  const sector = v / RS - Math.PI / 2; // 兩扇形段的有齒半邊(局部 −90°…90°)輪流朝向齒條
  const central = meshAngle(GEAR_L, CENTRAL, sector);
  return { y, sector, central };
}
export const stroke = STROKE;

// 齒條兩側齒的相位:咬合中段「需要的齒條位置 − 齒條實際位置」為定值
const phaseOf = (gear, rack, v) => {
  const { y, sector } = substitute(v);
  const p = rackOffset(gear, rack, sector) - y;
  return ((p % PITCH) + PITCH) % PITCH;
};
const PHASE_L = phaseOf(LEFT, { origin: [-W, 0, 0], dir: [0, 1, 0], pitch: PITCH }, STROKE / 2);
const PHASE_R = phaseOf(RIGHT, { origin: [W, 0, 0], dir: [0, 1, 0], pitch: PITCH }, STROKE * 1.5);

// 右扇形段上的正齒輪相對扇形段轉一點,才與中央齒輪咬合(扇形段本身與左邊同角)
const SPUR_R = (() => {
  const { sector: s0, central } = substitute(0);
  return meshAngle(CENTRAL, GEAR_R, central) - s0;
})();

const sector = (id, g, spur = 0) => ({
  id,
  kind: "group",
  center: g.center,
  spin: RS,
  pieces: [
    { kind: "gear", teeth: NS, radius: RS, span: [-Math.PI / 2, Math.PI / 2], width: 0.2 },
    { kind: "gear", teeth: NG, radius: RG, width: 0.2, web: false, at: [0, 0, Z_BACK], angle: spur },
    { kind: "cylinder", radius: 0.16, length: 0.9, at: [0, 0, Z_BACK / 2] },
  ],
});

export default {
  figure: 123,
  parts: [
    sector("left", LEFT),
    sector("right", RIGHT, SPUR_R),
    { id: "central", kind: "gear", center: CENTRAL.center, teeth: NC, radius: RC, width: 0.2, web: false },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "box", size: [2 * W - 0.25, 2 * STROKE + 1.6, 0.25], at: [0, 0, 0] },
        { kind: "rack", teeth: 25, pitch: PITCH, depth: 0.05, width: 0.25, at: [-W, PHASE_L, 0], angle: Math.PI / 2 },
        { kind: "rack", teeth: 25, pitch: PITCH, depth: 0.05, width: 0.25, at: [W, PHASE_R, 0], angle: -Math.PI / 2 },
        { kind: "box", size: [1.3, 0.12, 0.25], at: [0, STROKE + 0.85, 0] },
        { kind: "box", size: [1.3, 0.12, 0.25], at: [0, -STROKE - 0.85, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, length: 1.4, at: [0, STROKE + 1.55, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, length: 1.4, at: [0, -STROKE - 1.55, 0] },
      ],
    },
  ],
  driver: { part: "rack", type: "translation", direction: [0, 1, 0], cycle: [-STROKE / 2, STROKE / 2] },
  view: { direction: [0.08, 0.05, 1], fit: ["left", "right", "central"] },
  pose(v) {
    const { y, sector: s, central } = substitute(v);
    return {
      parts: { rack: { position: [0, y, 0] }, left: { angle: s }, right: { angle: s }, central: { angle: central } },
      readouts: [],
    };
  },
};

