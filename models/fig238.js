// 第 238 種:一種擒縱機構。D 是擒縱輪(六個尖齒),B 和 C 是擒縱叉瓦,A 是叉瓦的軸。叉瓦架是一塊彎成 U 形的板:
// 左邊的瓦 B 在擒縱輪下方,右臂繞過輪的右邊、瓦 C 在輪的右上方。叉瓦架往復擺動,B、C 輪流擋住、放開輪的齒,
// 輪就一格一格地逆時針轉(原圖箭頭)。主動件是叉瓦架。
//
// 接觸(由接觸算,共用 pawl-drive.js 的 escapeDrive):輪受固定的力矩(發條或重錘)往逆時針轉;叉瓦架往一邊擺時
// B 伸進輪齒的路徑、C 退出,往另一邊擺時反過來。輪轉到齒尖碰上伸進來的叉瓦就停,叉瓦退出時從靜止加速轉到碰上另一片。
// 兩片叉瓦在輪上的方位差三個半齒距,所以每擺一程放走半齒、一個來回一齒。轉多少、停在哪裡都由齒與叉瓦相碰算出。
// 推斷:每擺一程放走半齒(原文只說是擒縱機構,沒有比例);擺幅;叉瓦伸進輪齒的深淺與方位(太深時,一片叉瓦還頂著齒、另一片已擋在下一齒前面,輪會被夾住);
// 輪齒數依原圖為六;叉瓦做成從架子兩端伸向輪心的方塊(原圖畫成架子兩端的尖角);
// 輪軸與叉瓦架的樞軸在後面的機架上。
import { TAU, deg, polar, rot2, swing as swingAt } from "./kit.js";
import { escapeDrive } from "./pawl-drive.js";
import { shape, circle, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const D = [-0.6, 1.0];
const A = [0.1, -0.9];
const N = 6;
const PITCH = TAU / N;
const SWING = deg(6);
const STAR = { outer: 0.62, inner: 0.32, phase: deg(15) };

// 叉瓦(世界座標,叉瓦架在中間位置時):從架子端頭(離輪心 1.0)沿半徑伸到 inner(離輪心),寬 0.18
const PALLETS = { B: { at: deg(250), inner: 0.58 }, C: { at: deg(40), inner: 0.6 } };
const palletPoly = ({ at, inner }) => {
  const u = [Math.cos(at), Math.sin(at)];
  const n = [-u[1], u[0]];
  const p = (r, w) => [D[0] + u[0] * r + n[0] * w, D[1] + u[1] * r + n[1] * w];
  return [p(inner, -0.09), p(1.02, -0.09), p(1.02, 0.09), p(inner, 0.09)];
};
// 叉瓦架的局部座標(原點在 A)
const toFrame = ([x, y]) => [x - A[0], y - A[1]];
const PALLET_LOCAL = { B: palletPoly(PALLETS.B).map(toFrame), C: palletPoly(PALLETS.C).map(toFrame) };
const FRAME_PATH = [
  [-0.925, 0.107],
  [-0.95, -0.3],
  [-0.6, -0.85],
  [0.1, -0.92],
  [0.75, -0.7],
  [1.3, -0.05],
  [1.35, 0.65],
  [1.1, 1.15],
  [0.65, 1.45],
  [0.17, 1.64],
].map(toFrame);

const starOutline = Array.from({ length: 2 * N }, (_, i) => polar(i % 2 ? STAR.inner : STAR.outer, STAR.phase + (i * Math.PI) / N).slice(0, 2));
// 輪在轉角 θ 時的六個尖齒(世界座標;每齒一個三角形,加中間的六邊形)
const teethAt = (theta) => {
  const o = starOutline.map((p) => {
    const [x, y] = rot2(p, theta);
    return [D[0] + x, D[1] + y];
  });
  const out = [];
  for (let i = 0; i < N; i++) out.push([o[(2 * i + 11) % 12], o[2 * i], o[2 * i + 1]]);
  out.push(Array.from({ length: N }, (_, i) => o[2 * i + 1]));
  return out;
};
const frameAngle = (v) => swingAt(v, -SWING, SWING);
const palletsAt = (v) => {
  const a = frameAngle(v);
  return ["B", "C"].map((k) =>
    PALLET_LOCAL[k].map((p) => {
      const [x, y] = rot2(p, a);
      return [A[0] + x, A[1] + y];
    }),
  );
};
const drive = escapeDrive({ period: 4 * SWING, obstacles: teethAt, stops: palletsAt, dir: 1, pitch: PITCH, drop: 0.2 }); // 放開後輪從靜止加速,約一程的一半轉過一個齒距(太快會像跳過去)
const W0 = drive.at(0);

/** 叉瓦架累計擺動 v:擒縱輪的轉角(自起點,逆時針為正) */
export const wheelAngle = (v) => drive.at(v) - W0;
export const geometry = { N, PITCH, SWING };
/** 檢查用:主動量 v 時輪的齒與兩片叉瓦(世界座標 2D) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { teeth: s.wheel, pallets: s.stops };
};

const star = shape(starOutline, [circle(0.1).reverse()]);

export default {
  figure: 238,
  parts: [
    {
      id: "post",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 0.6, at: [...A, -0.05] }, // 叉瓦架的樞軸
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [...D, -0.15] }, // 擒縱輪的軸
        ...pedestal({ at: A, z: -0.45, bore: 0.09, floor: -1.9 }),
        { kind: "box", size: [0.3, 2.9, 0.12], at: [-1.45, -0.45, -0.45] }, // 托住輪軸的立柱與橫臂(推斷)
        { kind: "box", size: [1.0, 0.22, 0.12], at: [-1.05, D[1], -0.45] },
      ],
    },
    { id: "wheelD", kind: "plate", center: [...D, 0], shape: star, thickness: 0.16, mark: [0.45, 0], markSize: 0.06, spin: 0.7, label: "D", labelOffset: [-0.1, 0.12, 0.3] },
    {
      id: "frame",
      kind: "group",
      center: [...A, 0],
      arrow: false,
      label: "A",
      labelOffset: [0.45, 0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine(FRAME_PATH, 0.3)), thickness: 0.12, at: [0, 0, 0.18] }, // U 形架在輪的前面
        { kind: "plate", shape: shape(PALLET_LOCAL.B), thickness: 0.34, at: [0, 0, 0.07] }, // 叉瓦往後伸到輪那一層
        { kind: "plate", shape: shape(PALLET_LOCAL.C), thickness: 0.34, at: [0, 0, 0.07] },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.3, at: [0, 0, 0.1] },
      ],
    },
    { id: "tagB", kind: "group", center: [-1.25, 0.25, 0.2], pieces: [], arrow: false, label: "B" },
    { id: "tagC", kind: "group", center: [0.1, 1.95, 0.2], pieces: [], arrow: false, label: "C" },
  ],
  // 動力重演:只推叉瓦架;擒縱輪受固定的力矩(發條或重錘)往逆時針轉,由叉瓦 B、C 輪流擋住、放行
  replay: {
    to: 8 * SWING,
    seconds: 16,
    free: { wheelD: { spring: 1, gravity: false } },
    ignore: [["wheelD", "post"]],
    expect: [
      { at: 2 * SWING, part: "wheelD", label: "叉瓦架擺一程,放走半齒" },
      { at: 4 * SWING, part: "wheelD", label: "擺一個來回,輪轉一齒" },
      { at: 8 * SWING, part: "wheelD", label: "兩個來回轉兩齒" },
    ],
  },
  driver: { part: "frame", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelD",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { frame: { angle: frameAngle(v) }, wheelD: { angle: drive.at(v) } }, readouts: [] };
  },
};
