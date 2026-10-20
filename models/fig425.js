// 第 425 種:眾多旋轉式引擎中的一種。A 是汽缸,軸 B 從它的中心穿過;活塞 C 就是一個固定在軸上的偏心輪,
// 在一點與汽缸接觸。蒸汽依箭頭進出,作用在活塞一側的壓力使活塞與軸旋轉。
// 進汽口與排汽口之間的滑動擋板 D 會退出活塞的行經路線,讓活塞通過。
// 主動件是軸 B(原圖箭頭:順時針)。
// 推斷:擋板 D 靠蒸汽或彈簧壓著,始終貼著偏心輪;蒸汽從擋板右邊進來,充滿擋板與接觸點之間(順時針方向)的月牙形空間,
// 擋板左邊與接觸點之間的蒸汽經左邊的汽道排出。
// 2026-10-20 複查 #425-1:擋板的槽真的開在汽缸壁上(汽缸環分成前、中、後三層,三層在頂端都缺一道槽,擋板在槽裡滑;
// 導槽座是 U 形、頂端封住),進、排汽道的端頭停在汽缸外緣、中層的環在汽道處開口,不再伸進缸膛頂到偏心輪。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { cylinderWall } from "./rotary-cylinder.js";

export const BORE = 1.6; // 汽缸內半徑
export const ECC = 0.42; // 偏心距
export const PISTON = BORE - ECC; // 偏心輪半徑:剛好在一點碰到汽缸
export const SLOT = 0.16; // 擋板半寬
const OUTER = BORE + 0.18; // 汽缸外半徑
const GAP = SLOT + 0.01; // 擋板槽的半寬(擋板兩側各留 0.01)
const GUIDE = 0.3; // 導槽座的半寬(外壁)
const CHANNEL = 0.45; // 汽道的外側(汽道在導槽座外壁與汽道壁之間)
const TRAVEL = 1.2; // 擋板的高度
const SLOT_TOP = BORE + TRAVEL + 0.02; // 擋板完全退出時頂端在 BORE + TRAVEL
const Z = { ring: 0.3, port: 0.15 }; // 汽缸環的半厚;汽道(與中層環)的半厚

/** 軸轉 theta(逆時針為正;原圖是順時針)→ 偏心輪中心、接觸點方向 */
export function piston(theta) {
  const c = [ECC * Math.cos(theta), ECC * Math.sin(theta)];
  return { c, contact: theta };
}
/**
 * 擋板 D 的下端高度:擋板是平底(寬 2·SLOT),被壓著貼在偏心輪上,停在平底寬度內偏心輪最高的那一點
 * (2026-10-07 複查:原本只算中線上那一點,平底的角會切進偏心輪)
 */
export function abutment(theta) {
  const { c } = piston(theta);
  const x = Math.max(-SLOT, Math.min(SLOT, c[0])); // 平底範圍內離偏心輪中心最近(最高)的那一點
  return c[1] + Math.sqrt(PISTON * PISTON - (x - c[0]) ** 2);
}

/** 月牙形空間裡、從角度 a0 到 a1 的蒸汽點 */
function crescent(theta, a0, a1, travel) {
  const { c } = piston(theta);
  const dots = [];
  const span = a1 - a0;
  const n = Math.max(2, Math.round(Math.abs(span) / 0.12));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (span * ((i + ((travel % 1) + 1) % 1) % (n + 1))) / n;
    const u = [Math.cos(a), Math.sin(a)];
    const cu = c[0] * u[0] + c[1] * u[1];
    const inner = cu + Math.sqrt(PISTON * PISTON - (c[0] * c[0] + c[1] * c[1]) + cu * cu);
    const gap = BORE - inner;
    if (gap < 0.08) continue;
    for (const f of gap > 0.35 ? [0.3, 0.7] : [0.5]) dots.push([(inner + gap * f) * u[0], (inner + gap * f) * u[1], 0.05]);
  }
  return dots;
}

// ── 汽缸壁(rotary-cylinder.js):環在頂端缺一道擋板的槽(前、中、後三層都缺),中層另在兩條汽道處開口 ──
const CH = (GUIDE + CHANNEL) / 2; // 汽道中線
const { band, cRing, portWall, inlet, exhaust } = cylinderWall({ bore: BORE, outer: OUTER, top: BORE + 1.0, channel: CH });
/** 蒸汽的路徑(進汽道:由上往下進缸膛;排汽道反向);端點停在缸膛表面 */
export { inlet, exhaust };
// 導槽座:U 形,兩腳立在汽缸外緣上、頂端封住;擋板在 |x| < GAP 的槽裡滑
const housing = [
  ...arcPoints(OUTER, Math.acos(-GUIDE / OUTER), Math.acos(-GAP / OUTER)),
  [-GAP, SLOT_TOP],
  [GAP, SLOT_TOP],
  ...arcPoints(OUTER, Math.acos(GAP / OUTER), Math.acos(GUIDE / OUTER)),
  [GUIDE, SLOT_TOP + 0.15],
  [-GUIDE, SLOT_TOP + 0.15],
];
// 汽道壁:從頂端的汽口直下到汽缸外緣;汽道在它和導槽座外壁之間,經中層環的開口進缸膛
const WALL_X = CHANNEL + 0.03;

export default {
  figure: 425,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      label: "A",
      labelOffset: [-BORE - 0.15, 0.5, 0.4],
      pieces: [
        // 汽缸環:前、後層缺擋板的槽;中層另缺兩條汽道的開口(汽道與導槽座之間),導槽座兩腳下方那兩段補上
        { kind: "plate", shape: shape(cRing(GAP)), thickness: Z.ring - Z.port, at: [0, 0, (Z.ring + Z.port) / 2] },
        { kind: "plate", shape: shape(cRing(GAP)), thickness: Z.ring - Z.port, at: [0, 0, -(Z.ring + Z.port) / 2] },
        { kind: "plate", shape: shape(cRing(CHANNEL)), thickness: 2 * Z.port },
        { kind: "plate", shape: shape(band(GAP, GUIDE)), thickness: 2 * Z.port },
        { kind: "plate", shape: shape(band(-GUIDE, -GAP)), thickness: 2 * Z.port },
        { kind: "plate", shape: shape(circle(OUTER)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "plate", shape: shape(housing), thickness: 2 * Z.ring },
        { kind: "plate", shape: shape(portWall(WALL_X)), thickness: 2 * Z.port },
        { kind: "plate", shape: shape(portWall(-WALL_X)), thickness: 2 * Z.port },
        { kind: "box", size: [2.4, 0.25, 0.9], at: [0, -BORE - 0.3, 0] },
      ],
    },
    {
      id: "pistonC",
      kind: "group",
      label: "C",
      labelOffset: [-0.3, -1.1, 0.4],
      spin: 0.35,
      pieces: [
        { kind: "plate", shape: shape(circle(PISTON, ECC, 0), [circle(0.12).reverse()]), thickness: 0.56, mark: [ECC + PISTON - 0.2, 0], markSize: 0.09 },
        { kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", label: "B", labelOffset: [0, 0, 0.6], pieces: [] },
    { id: "abutment", kind: "box", size: [2 * SLOT, TRAVEL, 0.56], label: "D", labelOffset: [0.35, 0.2, 0.3] },
  ],
  // 動力重演:只推軸;擋板 D 沿汽缸壁與導槽座的槽上下滑,被彈簧(或蒸汽)往下壓著貼住偏心輪,活塞轉過時把它頂起
  replay: {
    free: { abutment: { slide: [0, 1, 0], spring: -1, gravity: false } },
    expect: [
      { at: -Math.PI / 2 - Math.PI / 2, part: "abutment", label: "偏心輪轉到擋板下面,把擋板頂出活塞的路線", quote: "滑動擋板 D,會移出活塞的行經路線,讓活塞得以通過" },
      { at: -Math.PI / 2 - Math.PI, part: "abutment", label: "偏心輪轉開,擋板被壓回、貼著它" },
      { part: "abutment", label: "轉完一圈,擋板回到原處" },
    ],
  },
  driver: { part: "pistonC", type: "rotation", speed: -0.8, initial: -Math.PI / 2 },
  target: "abutment", // 軸 B 就是主動件(偏心活塞);標被活塞推開讓路的滑動擋板 D
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const tip = abutment(theta);
    const contact = ((theta % TAU) + TAU) % TAU;
    const top = Math.PI / 2;
    // 順時針轉:蒸汽在擋板(頂)與接觸點之間、從頂往順時針方向
    const steamTo = contact > top ? contact - TAU : contact;
    const travel = -theta * 0.6;
    return {
      parts: {
        pistonC: { angle: theta },
        abutment: { position: [0, tip + TRAVEL / 2, 0] },
      },
      flows: [
        { fluid: "steam", points: [...stream(inlet, travel, { spacing: 0.18 }), ...crescent(theta, top - 0.2, steamTo + 0.15, travel)] },
        { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.18 }) },
      ],
      readouts: [{ label: "擋板 D 退出", value: (BORE - tip).toFixed(2) }],
    };
  },
};
