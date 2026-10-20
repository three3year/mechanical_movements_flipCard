// 旋轉式引擎的汽缸壁(第 425、427 種共用):汽缸是內半徑 bore、外半徑 outer 的環,頂端缺擋板的槽或兩條汽道的開口;
// 汽道是從頂端 top 直下到汽缸外緣的兩道壁,蒸汽經汽缸壁中層的開口進缸膛,路徑的端點停在缸膛表面。純函式,不依賴 Three.js。
import { TAU } from "./kit.js";
import { arcPoints, thickLine } from "./shapes.js";

/** 半徑 r 的圓在 x 處(上半)的高度 */
export const yOn = (r, x) => Math.sqrt(r * r - x * x);

/** 汽缸壁的外形與汽道:channel 是汽道中線的 x(進汽道在右 +channel、排汽道在左 −channel) */
export function cylinderWall({ bore, outer, top, channel }) {
  return {
    /** 環在 x0 < x < x1 之間(上半)的一段:兩側是垂直的切口 */
    band: (x0, x1) => [...arcPoints(outer, Math.acos(x1 / outer), Math.acos(x0 / outer)), ...arcPoints(bore, Math.acos(x0 / bore), Math.acos(x1 / bore))],
    /** 環缺掉頂端 |x| < g 那一段(垂直的切口),其餘整圈 */
    cRing: (g) => [...arcPoints(outer, Math.PI - Math.acos(g / outer), TAU + Math.acos(g / outer)), ...arcPoints(bore, TAU + Math.acos(g / bore), Math.PI - Math.acos(g / bore))],
    /** 一道汽道壁(粗線的外形):在 x 處從頂端直下到汽缸外緣 */
    portWall: (x) => thickLine([[x, top], [x, yOn(outer, Math.abs(x)) - 0.01]], 0.06),
    /** 蒸汽的路徑(進汽道:由上往下進缸膛;排汽道反向) */
    inlet: [[channel, top, 0.2], [channel, bore + 0.3, 0.2], [channel, yOn(bore, channel), 0.2]],
    exhaust: [[-channel, yOn(bore, channel), 0.2], [-channel, bore + 0.3, 0.2], [-channel, top, 0.2]],
  };
}
