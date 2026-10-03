// 第 493 種:「路易斯吊楔」,在建築中吊起石塊。它由中央一根錐形的銷(楔子)與兩側各一塊楔形的填塊組成。
// 三塊一起插進石塊上鑽出的孔(孔底較寬),吊起中央的楔子時,它把填塊緊緊楔進孔壁,石塊就被吊起。
// 主動件是虛擬的「吊起」。剖面圖。
// 推斷:先把中央的楔子提起一點、把兩塊填塊往外擠緊,之後整組連同石塊一起上升;各階段所佔的進度。
import { clamp, smooth } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const HOLE = { top: 0.45, bottom: 0.68, depth: 1.3 }; // 孔口寬、孔底寬、孔深(孔頂在 y = 0)
export const WEDGE_UP = 0.12; // 中央楔子相對填塊提起
export const LIFT = 1.0;
const STONE = { w: 3.4, h: 2.0 };

/** 吊起 u → 楔子相對提起量、填塊往外移、整組(連石塊)上升 */
export function lewis(u0) {
  const u = clamp(u0, 0, 1);
  const wedge = WEDGE_UP * smooth(clamp(u / 0.3, 0, 1));
  const spread = 0.04 * (wedge / WEDGE_UP);
  const lift = LIFT * smooth(clamp((u - 0.3) / 0.7, 0, 1));
  return { wedge, spread, lift, tight: wedge >= WEDGE_UP - 1e-9 };
}

// 孔的形狀(鳩尾:上窄下寬)與三塊楔子
const holeShape = [[-HOLE.top / 2, 0], [-HOLE.bottom / 2, -HOLE.depth], [HOLE.bottom / 2, -HOLE.depth], [HOLE.top / 2, 0]];
// 石塊(剖面):外形上方開著鳩尾形的孔
const stoneShape = shape([[-STONE.w / 2, -STONE.h], [STONE.w / 2, -STONE.h], [STONE.w / 2, 0], ...holeShape.slice().reverse(), [-STONE.w / 2, 0]]);
const packer = (s) => shape([[s * 0.06, 0.25], [s * (HOLE.top / 2), 0.25], [s * (HOLE.top / 2), 0], [s * (HOLE.bottom / 2 - 0.01), -HOLE.depth + 0.02], [s * 0.2, -HOLE.depth + 0.02], [s * 0.06, -0.05]]);
const pin = shape([[-0.06, 0.6], [0.06, 0.6], [0.06, -0.05], [0.2, -HOLE.depth + 0.05], [-0.2, -HOLE.depth + 0.05], [-0.06, -0.05]]);

export default {
  figure: 493,
  parts: [
    { id: "ground", kind: "box", center: [0, -STONE.h - 0.12, 0], size: [5, 0.2, 1.4] },
    { id: "stone", kind: "plate", shape: stoneShape, thickness: 1.0, arrow: false },
    { id: "packerL", kind: "plate", shape: packer(-1), thickness: 0.5, arrow: false },
    { id: "packerR", kind: "plate", shape: packer(1), thickness: 0.5, arrow: false },
    { id: "pin", kind: "plate", shape: pin, thickness: 0.5, arrow: false, pieces: [{ kind: "plate", shape: shape(thickLine([[-0.25, 0.75], [-0.25, 1.05], [0.25, 1.05], [0.25, 0.75]], 0.07), [circle(0.03, 0, 0.9).reverse()]), thickness: 0.12 }] },
    { id: "rope", kind: "rope", radius: 0.04 },
  ],
  driver: { type: "virtual", label: "吊起", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  view: { direction: [0.06, 0.06, 1] },
  pose(u) {
    const l = lewis(u);
    return {
      parts: {
        stone: { position: [0, l.lift, 0] },
        packerL: { position: [-l.spread, l.lift, 0.05] },
        packerR: { position: [l.spread, l.lift, 0.05] },
        pin: { position: [0, l.lift + l.wedge, 0.1] },
      },
      paths: { rope: { points: [[0, l.lift + l.wedge + 1.05, 0.1], [0, 3.2, 0.1]], closed: false, phase: 0 } },
      readouts: [{ label: "填塊", value: l.tight ? "被楔子擠緊在孔壁上" : "楔子提起中" }],
    };
  },
};
