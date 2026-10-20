// 第 422 種:擺動活塞引擎。汽缸 A 的剖面是扇形;活塞 B 裝在搖臂軸 C 上,蒸汽經滑閥 D 輪流引進汽缸、作用在活塞的一側
// 或另一側,方式與一般的往復式引擎相同。搖臂軸接到曲柄上產生旋轉運動。
// 主動件是曲柄(在汽缸後面);活塞 B 隨之來回擺動。
// 推斷:曲柄、搖臂與連桿的位置與長度(原圖沒有畫出);汽缸前面剖開;汽缸裡的蒸汽以點表示。
// 兩條汽道照原圖各走自己那一側:從扇形的兩端穿過弧壁、沿弧壁外面上到閥箱底下的口(左口通左端、右口通右端);
// 閥箱坐在汽缸頂上,閥座上的兩個口被滑閥 D 蓋住一個、另一個開著:開著的口那一端進汽、蓋住的那一端排汽。
// 閥動(推斷,原圖沒有畫;2026-10-04 定案補撥桿式閥動):搖臂軸前端一根朝上的撥臂,臂端的銷在一支反向槓桿下端的長槽裡,
// 槓桿的支點在閥箱垂下的托架上(推斷),槓桿上端的銷在滑閥垂下的叉架兩指之間;活塞擺到行程的末端時,銷碰到叉指、
// 把滑閥推到另一邊,其餘時間滑閥停在原位。反向槓桿讓滑閥往撥臂銷的反方向走,汽道才不用交叉。
import { deg } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stream } from "./flow.js";
import { shape, thickLine, arcPoints, circle, rect } from "./shapes.js";

export const RADIUS = 2.2; // 扇形汽缸的內半徑
export const HALF = deg(33); // 扇形的半張角
const ARM = 0.8; // 搖臂(在汽缸後面,朝下)
export const CRANK = { center: [1.9, -1.0, 0], radius: 0.3 };
const COUPLER = Math.hypot(CRANK.center[0], CRANK.center[1] + ARM);
const BACK = -0.75;

const crankPin = (phi) => [CRANK.center[0] + CRANK.radius * Math.cos(phi), CRANK.center[1] + CRANK.radius * Math.sin(phi), 0];
/** 曲柄轉 phi → 活塞偏離中線的角度(逆時針為正) */
export function vane(phi) {
  const end = circleCircle(crankPin(phi), COUPLER, [0, 0, 0], ARM, 1).point;
  return Math.atan2(end[1], end[0]) + Math.PI / 2;
}

// 閥箱與閥座:閥箱坐在汽缸頂上,閥座上兩個口(寬 PORT_W,內緣離中線 PORT_X)各通自己那一側的汽道
const CHEST_BOTTOM = RADIUS + 0.1;
const SEAT_H = 0.1;
const CHEST_TOP = CHEST_BOTTOM + 0.5;
const CHEST_HALF = 0.6;
const HOLLOW_HALF = 0.5;
export const PORT_X = 0.3;
export const PORT_W = 0.1;
export const VALVE_HALF = PORT_X + PORT_W; // 滑閥的半寬:在中間時剛好蓋住兩個口
export const VALVE_TRAVEL = 2 * PORT_W; // 滑閥的行程:推到一邊時一口全開、另一口蓋住
const VALVE_H = 0.26;
export const VALVE_Y = CHEST_BOTTOM + SEAT_H + VALVE_H / 2; // 滑閥的中心高度
const ROD_Y = 0.08; // 閥桿接在滑閥上的高度(相對滑閥中心)

// 閥動的尺寸:撥臂長、反向槓桿的支點與兩臂
export const TAPPET = 1.0;
const FULCRUM = [0, 1.5];
const UPPER = 0.95; // 支點到上端的銷
const LOWER = 0.85; // 下臂長(長槽在裡面)
/** 曲柄轉 phi → 撥臂銷的 x */
export const tipX = (phi) => -TAPPET * Math.sin(vane(phi));
const tip = (phi) => [tipX(phi), TAPPET * Math.cos(vane(phi))];
/** 曲柄轉 phi → 反向槓桿的角度(從正上方量,逆時針為正):下臂指向撥臂銷 */
export function leverAngle(phi) {
  const [x, y] = tip(phi);
  return Math.atan2(x - FULCRUM[0], FULCRUM[1] - y);
}
/** 曲柄轉 phi → 槓桿上端的銷(推叉架的銷)的位置 */
export const pusher = (phi) => { const a = leverAngle(phi); return [FULCRUM[0] - UPPER * Math.sin(a), FULCRUM[1] + UPPER * Math.cos(a)]; };
export const pusherX = (phi) => pusher(phi)[0];
const PUSH = (() => {
  const xs = Array.from({ length: 720 }, (_, i) => pusherX((i * Math.PI) / 360));
  return { min: Math.min(...xs), max: Math.max(...xs) };
})();
export const GAP = PUSH.max - PUSH.min - VALVE_TRAVEL; // 銷在兩根叉指之間的空行程
export const YOKE0 = (PUSH.max + PUSH.min) / 2; // 叉架中心相對滑閥的位置
/** 曲柄轉 phi → 滑閥的位置:銷往右走時推右叉指,往左走時推左叉指,沒碰到時滑閥停在上一次被推到的地方 */
export function valveAt(phi) {
  const u = pusherX(phi);
  const right = pusherX(phi + 0.01) > u;
  const yoke = right ? Math.max(PUSH.min + GAP / 2, u - GAP / 2) : Math.min(PUSH.max - GAP / 2, u + GAP / 2);
  return yoke - YOKE0;
}
/** 曲柄轉 phi → 第 s 側(+1 左、−1 右)的口開了幾成 */
export function portOpen(phi, s) {
  const x = valveAt(phi);
  const [p0, p1] = s > 0 ? [-PORT_X - PORT_W, -PORT_X] : [PORT_X, PORT_X + PORT_W];
  const covered = Math.max(0, Math.min(p1, x + VALVE_HALF) - Math.max(p0, x - VALVE_HALF));
  return 1 - covered / PORT_W;
}
/** 曲柄轉 phi → 哪一側進汽(+1 左、−1 右;兩口都蓋住時 0) */
export function admitting(phi) {
  const [l, r] = [portOpen(phi, 1), portOpen(phi, -1)];
  return l > r ? 1 : r > l ? -1 : 0;
}

// 汽缸壁:扇形加上搖臂軸的軸轂
const sector = (r, half, hub) => [
  ...arcPoints(r, Math.PI / 2 + half, Math.PI / 2 - half),
  ...arcPoints(hub, Math.PI / 2 - half - 0.3, -Math.PI * 1.5 + half + 0.3),
];
const wall = shape(sector(RADIUS + 0.16, HALF + deg(5), 0.62), [sector(RADIUS, HALF, 0.38).reverse()]);
const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
export const PASSAGE_W = 0.12;
const PASSAGE_R = RADIUS + 0.21; // 汽道沿弧壁外面走的半徑(貼著外壁)
/** 第 s 側的汽道(+1 左、−1 右):從汽缸裡那一端的角落穿出弧壁,沿外壁上到閥座的口 */
export function passage(s) {
  const a = (d) => Math.PI / 2 + s * d;
  return [polar(RADIUS - 0.15, a(HALF - deg(1))), ...arcPoints(PASSAGE_R, a(HALF + deg(4)), a(deg(14))), [-s * (PORT_X + PORT_W / 2), CHEST_BOTTOM - 0.02]]; // 口的下方:汽道從閥座的缺口底下接上來,缺口本身留空
}
// 閥箱:倒 U 形(底下開口是閥室),坐在汽缸頂上;閥座分三塊,兩塊之間的缺口就是口
const chest = [
  [-CHEST_HALF, CHEST_BOTTOM], [-HOLLOW_HALF, CHEST_BOTTOM], [-HOLLOW_HALF, CHEST_TOP - 0.1], [HOLLOW_HALF, CHEST_TOP - 0.1],
  [HOLLOW_HALF, CHEST_BOTTOM], [CHEST_HALF, CHEST_BOTTOM], [CHEST_HALF, CHEST_TOP], [-CHEST_HALF, CHEST_TOP],
];
const seat = (x0, x1) => ({ kind: "box", size: [x1 - x0, SEAT_H, 0.8], at: [(x0 + x1) / 2, CHEST_BOTTOM + SEAT_H / 2, 0] });

/** 一側汽缸裡的蒸汽(從活塞到該側的端壁) */
function chamberDots(from, to, travel) {
  const dots = [];
  const n = Math.max(1, Math.round(Math.abs(to - from) / deg(6)));
  for (let r = 0.55; r < RADIUS - 0.1; r += 0.3) {
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * (i + 0.5 + 0.3 * Math.sin(travel * 3 + r * 5))) / (n + 1);
      dots.push([...polar(r, a), 0.05]);
    }
  }
  return dots;
}
// 反向槓桿的長槽:撥臂銷離支點的距離在這個範圍裡滑
const SLOT = (() => {
  const ds = Array.from({ length: 720 }, (_, i) => { const [x, y] = tip((i * Math.PI) / 360); return Math.hypot(x - FULCRUM[0], y - FULCRUM[1]); });
  return { near: Math.min(...ds) - 0.03, far: Math.max(...ds) + 0.03 };
})();
const slot = [...arcPoints(0.055, 0, Math.PI, 0, -SLOT.near), ...arcPoints(0.055, Math.PI, 2 * Math.PI, 0, -SLOT.far)];

export default {
  figure: 422,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      label: "A",
      labelOffset: [-1.55, 0.6, 0.4],
      pieces: [
        { kind: "plate", shape: wall, thickness: 0.6 },
        { kind: "plate", shape: shape(sector(RADIUS + 0.16, HALF + deg(5), 0.62)), thickness: 0.05, at: [0, 0, -0.33] },
        // 底座
        { kind: "plate", shape: shape(rect(2.2, 0.3, 0, -0.75)), thickness: 0.7 },
        // 兩條通到汽缸兩端的汽道(各走自己那一側)
        { kind: "plate", shape: shape(thickLine(passage(1), PASSAGE_W)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(passage(-1), PASSAGE_W)), thickness: 0.3 },
        // 閥箱、閥座(兩個缺口是口)、頂上的進汽管、旁邊的排汽管(推斷)
        { kind: "plate", shape: shape(chest), thickness: 0.8 },
        seat(-CHEST_HALF, -PORT_X - PORT_W),
        seat(-PORT_X, PORT_X),
        seat(PORT_X + PORT_W, CHEST_HALF),
        { kind: "box", size: [0.14, 0.5, 0.14], at: [0, CHEST_TOP + 0.23, 0] },
        { kind: "box", size: [0.9, 0.14, 0.14], at: [CHEST_HALF + 0.43, VALVE_Y, 0] },
        // 反向槓桿的托架(推斷):從閥箱底下垂到汽缸前面,支點銷在它上面
        { kind: "plate", shape: shape(rect(0.22, CHEST_BOTTOM + SEAT_H - FULCRUM[1] + 0.1, 0, (CHEST_BOTTOM + SEAT_H + FULCRUM[1] - 0.1) / 2)), thickness: 0.12, at: [0, 0, 0.35] },
        { kind: "cylinder", radius: 0.06, length: 0.22, at: [...FULCRUM, 0.51] },
      ],
    },
    {
      id: "piston",
      kind: "group",
      label: "B",
      labelOffset: [0.25, 1.1, 0.4],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(0.14, RADIUS - 0.31, 0, (RADIUS + 0.29) / 2)), thickness: 0.56 }, // 葉片的根部伸進軸轂
        { kind: "cylinder", radius: 0.36, length: 0.56 },
        { kind: "cylinder", radius: 0.1, length: 1.3, at: [0, 0, -0.3] },
        // 搖臂(汽缸後面;端頭過了銷孔再收尾)
        { kind: "plate", shape: shape(thickLine([[0, 0.05], [0, -ARM - 0.1]], 0.14), [circle(0.04, 0, -ARM).reverse()]), thickness: 0.08, at: [0, 0, BACK] },
        // 軸的前端與撥臂、臂端的銷(銷往後伸進反向槓桿的長槽)
        { kind: "cylinder", radius: 0.07, length: 0.25, at: [0, 0, 0.475] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, TAPPET]], 0.1)), thickness: 0.06, at: [0, 0, 0.54] },
        { kind: "cylinder", radius: 0.05, length: 0.14, at: [0, TAPPET, 0.47] },
      ],
    },
    { id: "shaftC", kind: "group", label: "C", labelOffset: [0, -0.05, 0.45], pieces: [{ kind: "cylinder", radius: 0.12, length: 0.1, at: [0, 0, 0.33] }] },
    {
      id: "lever",
      kind: "group",
      center: [...FULCRUM, 0],
      pieces: [
        // 反向槓桿:下臂的長槽套著撥臂的銷,上端的銷往前伸到叉架兩指之間
        { kind: "plate", shape: shape(thickLine([[0, -LOWER], [0, UPPER]], 0.16), [circle(0.065).reverse(), slot.slice().reverse()]), thickness: 0.06, at: [0, 0, 0.45] },
        { kind: "cylinder", radius: 0.05, length: 0.14, at: [0, UPPER, 0.55] },
      ],
    },
    {
      id: "valve",
      kind: "group",
      label: "D",
      labelOffset: [0, 0.35, 0.3],
      pieces: [
        { kind: "box", size: [2 * VALVE_HALF, VALVE_H, 0.3] },
        // 閥桿往前伸出閥箱,接著垂下的叉架
        { kind: "cylinder", radius: 0.04, length: 0.45, at: [YOKE0, ROD_Y, 0.375] },
        { kind: "box", size: [GAP + 0.26, 0.08, 0.1], at: [YOKE0, ROD_Y, 0.55] },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.08, 0.48, 0.1], at: [YOKE0 + s * (GAP / 2 + 0.09), ROD_Y - 0.2, 0.55] })),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, BACK - 0.12] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [CRANK.radius, 0, BACK] },
      ],
    },
    { id: "coupler", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "piston",
  view: { direction: [0.15, 0.1, 1] },
  pose(phi) {
    const psi = vane(phi);
    const ahead = vane(phi + 0.01) - psi; // 活塞的擺動方向
    const swing = ahead < 0 ? 1 : -1; // 推活塞往這個方向走的是哪一側(+1 左側)
    const side = admitting(phi) || swing; // 蒸汽在哪一側推(+1 左側):由滑閥開著的口決定
    const pin = crankPin(phi);
    const end = polar(ARM, psi - Math.PI / 2);
    const travel = phi * 1.2;
    const wallAngle = Math.PI / 2 + side * HALF;
    return {
      parts: {
        piston: { angle: psi },
        lever: { angle: leverAngle(phi) },
        valve: { position: [valveAt(phi), VALVE_Y, 0] },
        crank: { angle: phi },
        coupler: { from: [pin[0], pin[1], BACK + 0.08], to: [end[0], end[1], BACK + 0.08] },
      },
      flows: [
        { fluid: "steam", points: chamberDots(Math.PI / 2 + psi + side * deg(5), wallAngle, travel) },
        { fluid: "steam", points: stream(passage(side).map(([x, y]) => [x, y, 0.2]).reverse(), travel, { spacing: 0.2 }) },
      ],
      readouts: [{ label: "蒸汽推活塞", value: (side > 0 ? "左側進汽、右側排汽" : "右側進汽、左側排汽") + (side === swing ? "" : "(行程末端:滑閥已撥向另一側,蒸汽緩衝)") }],
    };
  },
};
