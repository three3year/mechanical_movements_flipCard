// 第 493 種:「路易斯吊楔」,在建築中吊起石塊。它由中央一根錐形的銷(楔子)與兩側各一塊楔形的填塊組成。
// 三塊一起插進石塊上鑽出的孔(孔底較寬),吊起中央的楔子時,它把填塊緊緊楔進孔壁,石塊就被吊起。
// 主動件是虛擬的「吊起」。剖面圖。
// 推斷:先把中央的楔子提起一點、把兩塊填塊往外擠緊,之後整組連同石塊一起上升;各階段所佔的進度。
// 物理:填塊一開始離孔壁有一點空隙,楔子提起時斜面把填塊往外推,推到貼上孔壁為止(往外推的量 = 提起量 × 斜面斜率,
// 不能再多,否則填塊會穿進石塊);填塊的內面與楔子的斜面平行、一直貼著。
import { clamp, smooth } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const HOLE = { top: 0.45, bottom: 0.68, depth: 1.3 }; // 孔口寬、孔底寬、孔深(孔頂在 y = 0)
export const SPREAD = 0.04; // 填塊一開始離孔壁的空隙 = 擠緊時往外推的量
const PIN = { halfTop: 0.06, halfBottom: 0.22, top: -0.05, bottom: -HOLE.depth + 0.05 }; // 楔子的斜面:上窄下寬
const SLOPE = (PIN.halfBottom - PIN.halfTop) / (PIN.top - PIN.bottom); // 斜面每提起 1 往外推多少
export const WEDGE_UP = SPREAD / SLOPE; // 中央楔子相對填塊提起多少才擠緊
export const LIFT = 1.0;
const STONE = { w: 3.4, h: 2.0 };

/** 吊起 u → 楔子相對提起量、填塊往外移、整組(連石塊)上升 */
export function lewis(u0) {
  const u = clamp(u0, 0, 1);
  const wedge = WEDGE_UP * smooth(clamp(u / 0.3, 0, 1));
  const spread = SLOPE * wedge;
  const lift = LIFT * smooth(clamp((u - 0.3) / 0.7, 0, 1));
  return { wedge, spread, lift, tight: wedge >= WEDGE_UP - 1e-9 };
}

// 孔的形狀(鳩尾:上窄下寬)與三塊楔子
const holeShape = [[-HOLE.top / 2, 0], [-HOLE.bottom / 2, -HOLE.depth], [HOLE.bottom / 2, -HOLE.depth], [HOLE.top / 2, 0]];
const wallX = (y) => HOLE.top / 2 + ((HOLE.bottom / 2 - HOLE.top / 2) * -y) / HOLE.depth; // 孔壁在高度 y 的 x
const pinX = (y) => PIN.halfTop + SLOPE * (PIN.top - y); // 楔子斜面在高度 y 的 x
// 石塊(剖面):外形上方開著鳩尾形的孔
const stoneShape = shape([[-STONE.w / 2, -STONE.h], [STONE.w / 2, -STONE.h], [STONE.w / 2, 0], ...holeShape.slice().reverse(), [-STONE.w / 2, 0]]);
// 填塊:外面與孔壁平行、一開始退 SPREAD;內面與楔子的斜面平行、貼著
const PACKER_BOTTOM = -HOLE.depth + 0.02;
const packer = (s) =>
  shape([
    [s * PIN.halfTop, 0.25],
    [s * (wallX(0) - SPREAD), 0.25],
    [s * (wallX(0) - SPREAD), 0],
    [s * (wallX(PACKER_BOTTOM) - SPREAD), PACKER_BOTTOM],
    [s * pinX(PACKER_BOTTOM), PACKER_BOTTOM],
    [s * PIN.halfTop, PIN.top],
  ]);
const pin = shape([[-PIN.halfTop, 0.6], [PIN.halfTop, 0.6], [PIN.halfTop, PIN.top], [PIN.halfBottom, PIN.bottom], [-PIN.halfBottom, PIN.bottom], [-PIN.halfTop, PIN.top]]);

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
  // 動力重演:只重演吊起之前(楔子把填塊擠到孔壁)。兩塊填塊沿水平滑動,只受楔子斜面與孔壁的推。
  // 滑軌裝在地上:裝在石塊上的話,重演會關掉填塊與石塊的碰撞(孔壁就擋不住了)
  replay: {
    from: 0,
    to: 0.3,
    free: { packerL: { slide: [1, 0, 0], gravity: false }, packerR: { slide: [1, 0, 0], gravity: false } },
    expect: [
      { at: 0.15, part: "packerL", label: "楔子提起一半,左填塊被斜面往外推了一半" },
      { part: "packerL", label: "楔子提到底,斜面把左填塊擠到孔壁為止", quote: "當吊起中央楔子時,它會將填塊緊緊楔入孔壁" },
      { part: "packerR", label: "右填塊同樣被擠到孔壁" },
    ],
  },
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "吊起", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  target: "stone", // 要被吊起的石塊
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
