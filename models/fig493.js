// 第 493 種:「路易斯吊楔」,在建築中吊起石塊。它由中央一根錐形的銷(楔子)與兩側各一塊楔形的填塊組成。
// 三塊一起插進石塊上鑽出的孔,吊起中央的楔子時,它把填塊緊緊楔進孔壁,石塊就被吊起。
// 主動件是虛擬的「吊起」:吊繩等速拉起(進度 = 拉起的量 / 全程)。剖面圖。
// 由接觸算:吊繩先只提起中央的楔子,楔子的斜面把填塊往外推到剛好不重疊(推到不重疊);填塊一碰到孔壁就推不動,
// 楔子也就提不上去,之後再拉,整組連同石塊一起上升。「先擠緊再吊起」的分界是填塊碰到孔壁的那一刻(重疊判斷 + 二分),
// 不是寫死的進度。填塊一開始離孔壁有一點空隙;填塊的內面與楔子的斜面平行、一直貼著。
// 孔照原圖是直壁(孔底和孔口一樣寬),填塊外面直、裡面隨楔子斜:三塊合起來在每個高度都比孔窄 2 × SPREAD,插得進孔裡;
// 吊起時靠楔子把填塊擠緊在孔壁上的摩擦吊起石塊。
// 推斷:楔子頂端往上伸出一段頸,頸上橫穿一根螺栓,U 形吊環的兩腳夾在頸的兩側、螺栓穿過兩腳(原圖吊環下緣兩端的螺栓頭),
// 吊繩繫在吊環頂上。
import { clamp } from "./kit.js";
import { shape, thickLine, arcPoints } from "./shapes.js";
import { placeOutline, polygonsOverlap, pushUntilClear } from "./contact.js";

const HOLE = { width: 0.5, depth: 1.3 }; // 孔寬、孔深(孔頂在 y = 0;直壁)
export const SPREAD = 0.025; // 填塊一開始離孔壁的空隙 = 擠緊時往外推的量
const PIN = { halfTop: 0.06, halfBottom: 0.16, top: -0.05, bottom: -HOLE.depth + 0.05 }; // 楔子的斜面:上窄下寬
const SLOPE = (PIN.halfBottom - PIN.halfTop) / (PIN.top - PIN.bottom); // 斜面每提起 1 往外推多少(楔子與填塊的外形用)
export const LIFT = 1.0;
const STONE = { w: 3.4, h: 2.0 };

// 孔的形狀(直壁)與三塊楔子
const WALL = HOLE.width / 2; // 孔壁的 x
const holeShape = [[-WALL, 0], [-WALL, -HOLE.depth], [WALL, -HOLE.depth], [WALL, 0]];
const pinX = (y) => PIN.halfTop + SLOPE * (PIN.top - y); // 楔子斜面在高度 y 的 x
// 石塊(剖面):外形上方開著直壁的孔
const stoneShape = shape([[-STONE.w / 2, -STONE.h], [STONE.w / 2, -STONE.h], [STONE.w / 2, 0], ...holeShape.slice().reverse(), [-STONE.w / 2, 0]]);
// 填塊:外面與孔壁平行、一開始退 SPREAD;內面與楔子的斜面平行、貼著
const PACKER_BOTTOM = -HOLE.depth + 0.02;
const packer = (s) =>
  shape([
    [s * PIN.halfTop, 0.25],
    [s * (WALL - SPREAD), 0.25],
    [s * (WALL - SPREAD), PACKER_BOTTOM],
    [s * pinX(PACKER_BOTTOM), PACKER_BOTTOM],
    [s * PIN.halfTop, PIN.top],
  ]);
// 楔子(含往上伸出的頸)、頸上的螺栓與吊環
const [packerL, packerR] = [packer(-1), packer(1)];
const NECK_TOP = 0.85;
const BOLT_Y = 0.78;
const pin = shape([[-PIN.halfTop, NECK_TOP], [PIN.halfTop, NECK_TOP], [PIN.halfTop, PIN.top], [PIN.halfBottom, PIN.bottom], [-PIN.halfBottom, PIN.bottom], [-PIN.halfTop, PIN.top]]);
const SHACKLE = { half: 0.12, bar: 0.06, foot: BOLT_Y - 0.04, crown: 0.95 }; // 兩腳中心線離中線、圓桿粗、腳下緣、頂弧的圓心高
const SHACKLE_TOP = SHACKLE.crown + SHACKLE.half + SHACKLE.bar / 2;
const shackle = [
  { kind: "plate", shape: shape(thickLine([[-SHACKLE.half, SHACKLE.foot], ...arcPoints(SHACKLE.half, Math.PI, 0, 0, SHACKLE.crown), [SHACKLE.half, SHACKLE.foot]], SHACKLE.bar)), thickness: 0.06 },
  { kind: "cylinder", radius: 0.03, length: 0.36, axis: [1, 0, 0], at: [0, BOLT_Y, 0] },
  ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.05, length: 0.04, axis: [1, 0, 0], at: [s * 0.17, BOLT_Y, 0] })),
];

// 楔子相對填塊提起 rise 時,右填塊被斜面推出去多少:往外推到和楔子剛好不重疊(左填塊對稱)
const pinAt = (rise) => placeOutline(pin.outline, [0, rise], 0);
const packerAt = (x) => placeOutline(packerR.outline, [x, 0], 0);
const spreadFor = (rise) => pushUntilClear(0, 1, HOLE.width, (x) => polygonsOverlap(pinAt(rise), packerAt(x)));
// 擠緊:楔子提到右填塊碰到孔壁的那一點(由接觸算:提起量的二分,判斷填塊和石塊是否重疊)
export const WEDGE_UP = (() => {
  const hitsWall = (rise) => polygonsOverlap(packerAt(spreadFor(rise)), stoneShape.outline);
  let [lo, hi] = [0, PIN.top - PIN.bottom];
  if (hitsWall(lo) || !hitsWall(hi)) throw new Error("第 493 種:楔子提到頂,填塊還碰不到孔壁");
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (hitsWall(mid)) hi = mid;
    else lo = mid;
  }
  return lo;
})();
export const TIGHT_AT = WEDGE_UP / (WEDGE_UP + LIFT); // 填塊碰到孔壁時吊繩的進度

/** 吊起 u(吊繩拉起的量 / 全程)→ 楔子相對提起量、填塊往外移、整組(連石塊)上升 */
export function lewis(u0) {
  const pulled = clamp(u0, 0, 1) * (WEDGE_UP + LIFT);
  const wedge = Math.min(pulled, WEDGE_UP);
  return { wedge, spread: spreadFor(wedge), lift: pulled - wedge, tight: pulled >= WEDGE_UP };
}

export default {
  figure: 493,
  parts: [
    { id: "ground", kind: "box", center: [0, -STONE.h - 0.1, 0], size: [5, 0.2, 1.4] }, // 石塊放在地上(吊起前)
    { id: "stone", kind: "plate", shape: stoneShape, thickness: 1.0, arrow: false },
    { id: "packerL", kind: "plate", shape: packerL, thickness: 0.5, arrow: false },
    { id: "packerR", kind: "plate", shape: packerR, thickness: 0.5, arrow: false },
    { id: "pin", kind: "plate", shape: pin, thickness: 0.5, arrow: false, pieces: shackle },
    { id: "rope", kind: "rope", radius: 0.04 },
  ],
  // 動力重演:只重演吊起之前(楔子把填塊擠到孔壁)。兩塊填塊沿水平滑動,只受楔子斜面與孔壁的推。
  // 滑軌裝在地上:裝在石塊上的話,重演會關掉填塊與石塊的碰撞(孔壁就擋不住了)
  replay: {
    from: 0,
    to: TIGHT_AT,
    free: { packerL: { slide: [1, 0, 0], gravity: false }, packerR: { slide: [1, 0, 0], gravity: false } },
    expect: [
      { at: TIGHT_AT / 2, part: "packerL", label: "楔子提起一半,左填塊被斜面往外推了一半" },
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
      paths: { rope: { points: [[0, l.lift + l.wedge + SHACKLE_TOP, 0.1], [0, 3.2, 0.1]], closed: false, phase: 0 } },
      readouts: [{ label: "填塊", value: l.tight ? "被楔子擠緊在孔壁上" : "楔子提起中" }],
    };
  },
};
