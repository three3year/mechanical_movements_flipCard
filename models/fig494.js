// 第 494 種:吊石塊等用的吊鉗。拉動連接兩根連桿的鉤環時,連桿作用在吊鉗的上臂,使它的尖端壓緊或嵌進石塊。
// 重量越大,吊鉗咬得越緊。
// 主動件是虛擬的「拉起」:鉤環被拉高的量。
// 推斷:兩支鉗臂交叉在中間的鉸點上(剪刀式),一根銷穿過兩支鉗臂(銷裝在左鉗臂上,右鉗臂開孔);上臂端各用銷接一根連桿,
// 兩根連桿的上端分在鉤環的前後兩側、由鉤環連接(鉤環頂上的眼繫吊繩)。上臂與連桿成菱形(照原圖上臂抬起約 40–50°)。
// 鉗臂的下半段照原圖是繞過石塊上角的大弧,從鉸點往外上方彎出、再往下到石塊兩側,尖端往內壓在石塊側面;
// 鉤環被拉起時兩個上臂端互相靠近,尖端往內收,碰到石塊側面為止(由接觸算:鉗臂的外形碰到石塊),之後整組連同石塊一起上升。
// 尖端只壓在石塊側面(壓緊),沒有畫嵌進的凹口。
// 「重量越大,咬得越緊」:吊起時兩根連桿撐起石重,連桿拉上臂、石重經尖端的摩擦往下拉鉗臂,兩者都讓鉗臂往收攏的方向轉,
// 由石塊推回尖端的力平衡;這個推力(夾緊力)和石重成正比,讀數寫出它是石重的幾倍(鉗子本身的重量不計)。
import { clamp, rot2 } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, thickLine, rect, circle, disc, stadium, arcPoints } from "./shapes.js";
import { placeOutline, polygonsOverlap, edgeDistance } from "./contact.js";

const PIVOT = [0, 1.25, 0];
const STONE = { w: 1.9, h: 2.0, y: -0.05 }; // 石塊(頂在 y = 0.95)
export const GRIP_X = STONE.w / 2; // 石塊側面
const stoneOutline = rect(STONE.w, STONE.h, 0, STONE.y);
const ARM_W = 0.1;
const UPPER = 0.55; // 上臂長(鉸點到連桿銷)
const LINK = UPPER; // 連桿長(菱形)
const LIFT_UP = (48 * Math.PI) / 180; // 設計時(夾住)上臂抬起的角度
const U_LOCAL = [-UPPER * Math.cos(LIFT_UP), UPPER * Math.sin(LIFT_UP)]; // 左鉗臂的上臂端(局部,鉸點在原點)
const LINK_PIN = 0.018; // 連桿銷孔
const PIVOT_PIN = 0.03; // 中間鉸點的銷
// 左鉗臂的下半段:圓心 ARC_C、通過鉸點的大弧,從鉸點往右上彎出、繞過石塊右上角,到 −10° 處再往內下伸出尖端
const ARC_C = [0.43, -0.6];
const ARC_R = Math.hypot(...ARC_C);
const ARC_FROM = Math.atan2(-ARC_C[1], -ARC_C[0]) - 0.06 / ARC_R; // 從轂邊開始(轂蓋住鉸點)
const ARC_TO = (-10 * Math.PI) / 180;
const TIP = [0.96, -0.8];
const LOWER_PATH = [...arcPoints(ARC_R, ARC_FROM, ARC_TO, ARC_C[0], ARC_C[1]), TIP];
const Z = { arm: 0.05, link: 0.12 }; // 左鉗臂、左連桿在 +z(右邊的在 −z)

// 左鉗臂的各塊(局部座標;右鉗臂左右鏡像):下半段(本體)、上臂(兩端圓頭,上臂端開連桿銷孔)、鉸點的轂
const mirror = (loop, s) => (s > 0 ? loop : loop.map(([x, y]) => [-x, y]).reverse());
const upperArm = (s, pivotHole) => {
  const a = Math.atan2(U_LOCAL[1], U_LOCAL[0]);
  const st = stadium(UPPER, ARM_W);
  const turn = (loop) => mirror(loop.map((p) => rot2(p, a)), s);
  const holes = [circle(LINK_PIN, UPPER, 0).reverse(), ...(pivotHole ? [circle(PIVOT_PIN + 0.001).reverse()] : [])];
  return shape(turn(st.outline), holes.map(turn));
};
const armParts = (s) => ({
  shape: shape(mirror(thickLine(LOWER_PATH, ARM_W), s)),
  pieces: [
    { kind: "plate", shape: upperArm(s, s < 0), thickness: 0.08 },
    { kind: "plate", shape: disc(0.09, s < 0 ? PIVOT_PIN + 0.001 : 0), thickness: 0.08 },
    // 中間鉸點的銷(推斷):裝在左鉗臂上,穿過右鉗臂的孔
    ...(s > 0 ? [{ kind: "cylinder", radius: PIVOT_PIN, length: 0.22, at: [0, 0, -Z.arm], role: "pivotPin" }] : []),
  ],
});
const LEFT = armParts(1);
const RIGHT = armParts(-1);

/** 鉤環高 y → 左鉗臂的轉角(相對設計姿勢)、上臂端(右鉗臂對稱) */
function arms(y) {
  const U = circleCircle(PIVOT, UPPER, [0, y, 0], LINK, 1).point;
  const open = Math.atan2(U[1] - PIVOT[1], U[0] - PIVOT[0]) - Math.atan2(U_LOCAL[1], U_LOCAL[0]);
  return { U, open };
}
const placedArm = (open) => placeOutline(LEFT.shape.outline, PIVOT, open);
export const SHACKLE0 = PIVOT[1] + 2 * UPPER * Math.sin((36 * Math.PI) / 180); // 鉤環的起始高度(上臂抬起 36°,尖端張開)
// 先拉到鉗臂碰到石塊,之後整組連同石塊一起上升(由接觸算:二分找鉗臂外形剛好碰到石塊的鉤環高度)
const GRIP = (() => {
  let [lo, hi] = [SHACKLE0, PIVOT[1] + 2 * UPPER * 0.999];
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (polygonsOverlap(placedArm(arms(mid).open), stoneOutline)) hi = mid;
    else lo = mid;
  }
  return lo;
})();

/** 拉起 u → 鉤環高度、整組上升量、左鉗臂的轉角與上臂端、尖端碰石塊的點(吊起前的座標)、是否夾緊 */
export function tongs(u0) {
  const u = clamp(u0, 0, 1);
  const travel = u * 2.0;
  const close = Math.min(travel, GRIP - SHACKLE0);
  const lift = Math.max(0, travel - (GRIP - SHACKLE0));
  const g = arms(SHACKLE0 + close);
  const tip = placedArm(g.open).reduce((a, b) => (edgeDistance(b, stoneOutline) < edgeDistance(a, stoneOutline) ? b : a));
  return { shackle: SHACKLE0 + close + lift, lift, ...g, tip: [tip[0], tip[1], 0], gripped: travel >= GRIP - SHACKLE0 };
}

/**
 * 拉起 u、石重 weight → 每一邊尖端夾緊石塊的力(石塊推回尖端的力)。左鉗臂繞鉸點的力矩平衡:
 * 連桿的拉力 t(兩根連桿撐起石重:2 t × 連桿的鉛直分量 = 石重)作用在上臂端,石重的一半經尖端的摩擦往下拉,
 * 石塊推回尖端的力 N 擋住;三者對鉸點的力矩和為 0。沒夾住時是 0。
 */
export function bite(u, weight = 1) {
  const t = tongs(u);
  if (!t.gripped) return 0;
  const S = [0, t.shackle - t.lift];
  const d = [S[0] - t.U[0], S[1] - t.U[1]];
  const len = Math.hypot(...d);
  const tension = weight / (2 * (d[1] / len));
  const r = [t.U[0] - PIVOT[0], t.U[1] - PIVOT[1]];
  const linkTorque = (r[0] * d[1] - r[1] * d[0]) * (tension / len);
  const [tx, ty] = [t.tip[0] - PIVOT[0], t.tip[1] - PIVOT[1]];
  return (linkTorque - (tx * weight) / 2) / ty;
}

export default {
  figure: 494,
  parts: [
    { id: "ground", kind: "box", center: [0, STONE.y - STONE.h / 2 - 0.075, 0], size: [4, 0.15, 1.4] },
    { id: "stone", kind: "plate", shape: shape(stoneOutline), thickness: 1.0, arrow: false },
    { id: "armL", kind: "plate", ...LEFT, thickness: 0.08, arrow: false },
    { id: "armR", kind: "plate", ...RIGHT, thickness: 0.08, arrow: false },
    { id: "linkL", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkR", kind: "link", width: 0.08, thickness: 0.05 },
    // 鉤環(推斷形狀):兩根連桿的上端銷插在它的前後兩面,頂上的眼繫吊繩
    {
      id: "shackle",
      kind: "plate",
      shape: disc(0.08),
      thickness: 0.14,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, 0.25]], 0.08)), thickness: 0.14 },
        { kind: "plate", shape: shape(circle(0.08, 0, 0.3), [circle(0.04, 0, 0.3).reverse()]), thickness: 0.14 },
      ],
    },
    { id: "rope", kind: "rope", radius: 0.03 },
  ],
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "拉起", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  target: "stone", // 要被夾住吊起的石塊
  view: { direction: [0.06, 0.06, 1] },
  pose(u) {
    const t = tongs(u);
    const up = (p, z = 0) => [p[0], p[1] + t.lift, z];
    const S = [0, t.shackle - t.lift];
    const k = bite(u);
    return {
      parts: {
        stone: { position: [0, t.lift, 0] },
        armL: { position: up(PIVOT, Z.arm), angle: t.open },
        armR: { position: up(PIVOT, -Z.arm), angle: -t.open },
        linkL: { from: up(t.U, Z.link), to: up(S, Z.link) },
        linkR: { from: up([-t.U[0], t.U[1]], -Z.link), to: up(S, -Z.link) },
        shackle: { position: up(S, 0) },
      },
      paths: { rope: { points: [[0, t.shackle + 0.38, 0], [0, t.shackle + 1.4, 0]], closed: false, phase: 0 } }, // 吊繩繫在鉤環頂上的眼,往上拉
      readouts: [
        { label: "吊鉗", value: t.gripped ? "尖端壓緊石塊,一起吊起" : "收攏中" },
        { label: "夾緊力", value: t.gripped ? `每邊是石重的 ${k.toFixed(2)} 倍(石越重夾得越緊)` : "—" },
      ],
    };
  },
};
