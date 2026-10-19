// 第 395 種:四通旋塞(four-way cock),多年前用在蒸汽引擎上,讓蒸汽進出汽缸。閥殼上有四個口:上方進汽、下方排汽、
// 左右兩個口通汽缸的兩端;閥塞裡有兩道彎曲的通道,各連通相鄰的兩個口。原圖的兩個位置相差閥塞轉 1/4 圈:上圖中蒸汽從上方
// 進入、經通道到左口(汽缸左端),廢汽從汽缸右端經右口、通道到下方排出;下圖中相反,蒸汽到右端、廢汽從左端排出。
// 主動件是虛擬的「進程」:引擎每一個來回,閥塞在兩個位置之間轉 1/4 圈、再轉回來;蒸汽與廢汽以流體示意,通道沒對準時不流動。
// 推斷:轉換的時機與通道對準的容許角度;進汽與排汽以同一種顏色(蒸汽)表示。
//
// 2026-10-20(model-audit-fixes-3 #395-1~3):
// - 通道照 525 px 原圖畫成大弧:弧心在閥殼外的角上(上口與左口那一道的弧心在左上角 (−R, R))、半徑 R,從一個口的中心
//   彎到相鄰的口的中心(原本半徑算成 hypot(R, R) − R,壁伸出閥塞、穿進殼體,碰不到口);原圖的虛線弧是轉 1/4 圈後的
//   通道位置(預覽),不畫成零件。通道的兩道壁坐在閥塞盤面上、在盤之內,中央的方塊(抓取處)也坐在盤面上。
// - 流動沿通道的中心弧走,不再斜穿過盤面。
// - 補示意的汽缸(推斷):左右兩口各接一段管到汽缸的兩端,汽缸畫成剖開的(看得到活塞);蒸汽進的那一端推活塞,
//   活塞走到另一端時旋塞轉 1/4 圈換向。閥殼也畫成剖開的:四個口是開口朝前的槽,殼體後面一片蓋板。
import { deg, clamp, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, arcPoints, thickLine, rect } from "./shapes.js";

const R = 1.4; // 閥殼內半徑(口的中心在這個圓上)
const CASE_R = 1.65; // 閥殼外半徑
const PLUG_R = 1.38; // 閥塞盤半徑
const HALF_W = 0.2; // 通道與口的半寬
const WALL = 0.08; // 通道壁厚
const SIDE = 0.1; // 口、管、汽缸的壁厚
const PORT_END = 2.3; // 上下兩口的管口
const PIPE_X = 2.25; // 左右兩口接到汽缸的直管(中心線)
const CYL = { y: -4.3, radius: 0.6, half: 2.6 }; // 汽缸(內徑的一半、內腔的半長)
const STROKE = 1.3; // 活塞離中間最遠
const Z = { back: -0.42, floor: -0.32, face: -0.2, top: 0 }; // 蓋板、槽底、閥塞盤面、殼體與管壁頂
const FLOW_Z = -0.12; // 流動畫在槽與通道的底上
export const RANGE = [0, deg(90)];

/** 進程 p → 閥塞轉角:每一輪的前半停在位置 0、後半停在位置 1,中間以 1/4 圈轉換 */
export function plugAngle(p) {
  const f = ((p % 1) + 1) % 1;
  if (f < 0.4) return 0;
  if (f < 0.5) return deg(90) * smooth((f - 0.4) / 0.1);
  if (f < 0.9) return deg(90);
  return deg(90) * (1 - smooth((f - 0.9) / 0.1));
}

/** 進程 p → 活塞的位置:位置 0 時蒸汽進左端、活塞往右;位置 1 時往左;旋塞轉換時活塞停在一端 */
export function pistonX(p) {
  const f = ((p % 1) + 1) % 1;
  if (f < 0.4) return -STROKE + 2 * STROKE * smooth(f / 0.4);
  if (f < 0.5) return STROKE;
  if (f < 0.9) return STROKE - 2 * STROKE * smooth((f - 0.5) / 0.4);
  return -STROKE;
}
const TOL = deg(12); // 通道與口對準的容許角度

/** 閥塞轉角 a → 哪一個位置(0 或 1,中間為 null:沒對準) */
export function position(a0) {
  const a = clamp(a0, ...RANGE);
  if (a < TOL) return 0;
  if (a > deg(90) - TOL) return 1;
  return null;
}

// 閥塞的通道(閥塞局部座標):中心弧以閥殼外的角為圓心、半徑 R。P1 從上口 (0, R) 彎到左口 (−R, 0),P2 從右口彎到下口
const PASSAGES = [
  { center: [-R, R], from: deg(0), to: deg(-90) },
  { center: [R, -R], from: deg(90), to: deg(180) },
];
const passageArc = ({ center, from, to }, r = R) => arcPoints(r, from, to, ...center);
const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? [...poly].reverse() : poly;
};
// 通道壁:中心弧兩側各一道,只留在閥塞盤之內(壁的外緣不超出盤)
const wall = (p, r) => ccw(thickLine(passageArc(p, r).filter(([x, y]) => Math.hypot(x, y) <= PLUG_R - WALL), WALL));
const WALLS = PASSAGES.flatMap((p) => [wall(p, R - HALF_W - WALL / 2), wall(p, R + HALF_W + WALL / 2)]);

const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const at = (pts) => pts.map(([x, y]) => [x, y, FLOW_Z]);
const inCyl = (side) => [[side * PIPE_X, 0], [side * PIPE_X, CYL.y + CYL.radius], [side * PIPE_X, CYL.y]];

/**
 * 位置 pos 的兩道流(世界座標的折線):蒸汽從上方的管口經通道到一端的口、沿直管進汽缸;
 * 廢汽從汽缸的另一端沿直管上來,經另一道通道從下方的管口排出。
 * 位置 0:蒸汽到左端、廢汽從右端排出(原圖上方的圖);位置 1:蒸汽到右端、廢汽從左端排出。
 */
export function routes(pos) {
  const a = pos === 1 ? deg(90) : 0;
  const arcs = PASSAGES.map((p) => passageArc(p).map((q) => rot(q, a)));
  // 位置 0:P1 連上口與左口、P2 連右口與下口;位置 1(轉 1/4 圈):P2 連上口與右口、P1 連左口與下口
  const [inlet, outlet] = pos === 1 ? [arcs[1], arcs[0]] : [arcs[0], arcs[1]];
  const side = pos === 1 ? 1 : -1; // 蒸汽進的那一端
  return [
    at([[0, PORT_END], ...inlet, ...inCyl(side)]),
    at([...inCyl(-side).reverse(), ...outlet, [0, -PORT_END]]),
  ];
}

// 閥殼:四段環(口之間)、四個開口朝前的槽(口),後面一片蓋板
const sector = (a0, a1) => {
  const di = Math.asin(HALF_W / R);
  const dout = Math.asin(HALF_W / CASE_R);
  return [...arcPoints(R, a0 + di, a1 - di), ...arcPoints(CASE_R, a1 - dout, a0 + dout)];
};
const plate = (outline, z0, z1, extra = {}) => ({ kind: "plate", shape: shape(outline), thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2], ...extra });
const box = (x0, x1, y0, y1, z0, z1) => ({ kind: "box", size: [x1 - x0, y1 - y0, z1 - z0], at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
// 沿 +x 到 r1 的槽(兩側壁 + 槽底),再轉到角度 a;側壁從環的內緣起,槽底從閥塞盤外起
const portPieces = (a, r1) => {
  const r0 = Math.sqrt(R * R - HALF_W * HALF_W);
  const pieces = [
    { size: [r1 - r0, SIDE, Z.top - Z.floor], at: [(r0 + r1) / 2, HALF_W + SIDE / 2, (Z.top + Z.floor) / 2] },
    { size: [r1 - r0, SIDE, Z.top - Z.floor], at: [(r0 + r1) / 2, -HALF_W - SIDE / 2, (Z.top + Z.floor) / 2] },
    { size: [r1 - R, 2 * (HALF_W + SIDE), Z.face - Z.floor], at: [(R + r1) / 2, 0, (Z.face + Z.floor) / 2] },
  ];
  return pieces.map((q) => ({ kind: "box", size: q.size, at: [...rot(q.at, a), q.at[2]], angle: a }));
};
// 左右兩口接到汽缸的直管(推斷):x 在 PIPE_X ± HALF_W 的槽,從口的高度往下到汽缸頂
const pipePieces = (s) => {
  const [xi, xo] = [s * (PIPE_X - HALF_W), s * (PIPE_X + HALF_W)];
  const lo = (u, v) => Math.min(u, v);
  const hi = (u, v) => Math.max(u, v);
  const cylTop = CYL.y + CYL.radius + SIDE;
  return [
    box(lo(xi - s * SIDE, xi), hi(xi - s * SIDE, xi), cylTop, -HALF_W, Z.floor, Z.top), // 內側壁(口的下方)
    box(lo(xo, xo + s * SIDE), hi(xo, xo + s * SIDE), cylTop, HALF_W + SIDE, Z.floor, Z.top), // 外側壁
    box(lo(s * CASE_R, xo), hi(s * CASE_R, xo), HALF_W, HALF_W + SIDE, Z.floor, Z.top), // 頂(口的上側壁接過來)
    box(lo(xi - s * SIDE, xo + s * SIDE), hi(xi - s * SIDE, xo + s * SIDE), cylTop, HALF_W + SIDE, Z.back, Z.face), // 槽底與後蓋
  ];
};
// 汽缸(推斷,剖開畫):後蓋、上下壁、兩端的缸蓋(右端留活塞桿的孔);上壁在兩根直管進來的地方開口
const cylinderPieces = () => {
  const { y, radius, half } = CYL;
  const [top, bottom] = [y + radius, y - radius];
  const end = half + SIDE;
  const rodR = 0.07;
  return [
    box(-end, end, bottom - SIDE, top + SIDE, Z.back, Z.floor),
    box(-end, end, bottom - SIDE, bottom, Z.floor, Z.top),
    box(-(PIPE_X - HALF_W), PIPE_X - HALF_W, top, top + SIDE, Z.floor, Z.top),
    box(PIPE_X + HALF_W, end, top, top + SIDE, Z.floor, Z.top),
    box(-end, -(PIPE_X + HALF_W), top, top + SIDE, Z.floor, Z.top),
    box(-end, -half, bottom, top, Z.floor, Z.top),
    box(half, end, y + rodR + 0.005, top, Z.floor, Z.top),
    box(half, end, bottom, y - rodR - 0.005, Z.floor, Z.top),
  ];
};

export const geometry = { R, PLUG_R, HALF_W, CYLINDER: CYL };

export default {
  figure: 395,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        plate(circle(CASE_R), Z.back, Z.floor), // 蓋板
        ...[0, 90, 180, 270].map((d) => plate(sector(deg(d), deg(d + 90)), Z.floor, Z.top)),
        ...[90, 270].flatMap((d) => portPieces(deg(d), PORT_END)),
        ...[0, 180].flatMap((d) => portPieces(deg(d), PIPE_X - HALF_W)),
        ...pipePieces(1),
        ...pipePieces(-1),
        ...cylinderPieces(),
      ],
    },
    {
      id: "plug",
      kind: "group",
      spin: R,
      pieces: [
        // 閥塞:圓盤,盤面上兩道彎曲通道的邊壁
        plate(circle(PLUG_R), Z.floor + 0.005, Z.face),
        ...WALLS.map((w) => plate(w, Z.face, Z.face + 0.14)),
        { kind: "box", size: [0.25, 0.25, 0.32], at: [0, 0, Z.face + 0.16], accent: true },
      ],
    },
    {
      // 活塞與活塞桿(推斷):桿從右端的缸蓋穿出
      id: "piston",
      kind: "group",
      center: [0, CYL.y, 0],
      pieces: [
        { kind: "box", size: [0.24, 2 * CYL.radius - 0.02, Z.top - Z.floor - 0.04], at: [0, 0, (Z.top + Z.floor) / 2] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.07, length: 4.2, at: [2.1, 0, (Z.top + Z.floor) / 2] },
        { kind: "box", size: [0.2, 0.36, 0.3], at: [4.2, 0, (Z.top + Z.floor) / 2] },
      ],
    },
  ],
  powered: ["plug", "piston"], // 外力來源:旋塞由進程轉動;活塞由蒸汽推動(和旋塞之間沒有實體相連)
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  target: "plug",
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const a = plugAngle(p);
    const pos = position(a);
    const flows = pos === null ? [] : routes(pos).map((path) => ({ fluid: "steam", points: stream(path, p * 12, { spacing: 0.22 }) }));
    return { parts: { plug: { angle: a }, piston: { position: [pistonX(p), CYL.y, 0] } }, flows, readouts: [] };
  },
};
