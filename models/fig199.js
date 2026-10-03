// 第 199 種:另一種曼格式齒條。燈籠式小齒輪(lantern-pinion,幾根銷夾在兩片半圓板之間)持續朝同一方向轉,
// 把往復運動傳給方形框架;框架由上下的滾子引導。小齒輪只在不到一半的圓周上有銷,所以當它與一側的齒條
// 嚙合時,沒有銷的那一半正朝向另一側。每根齒條起始處的大齒確保小齒輪的銷正確地嚙合。主動件是小齒輪。
// 推斷:5 根銷、銷距 36°(上下各嚙合半圈,框架往返的速度相同、換向瞬間完成);小齒輪順時針轉。
import { deg, TAU } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";

const RL = 0.6; // 銷所在的節圓半徑
const PINS = 5;
const STEP = deg(36);
const PITCH = RL * STEP;
const WINDOW = STEP / 2; // 銷在正上(下)方 ±18° 內與齒條嚙合
const X_MIN = -RL * WINDOW; // 框架的最左位置(原圖時框架在 X_MIN + RL·18° = 0)
const TRAVEL = RL * Math.PI;
const ROLLER = 0.35;

/** 小齒輪順時針轉 v:框架的位移,以及正在與哪一根齒條嚙合 */
export function frame(v) {
  // 上齒條嚙合:v ∈ [−18°, 162°](框架往右);下齒條:[162°, 342°](往左)
  const u = (((v + WINDOW) % TAU) + TAU) % TAU;
  if (u < Math.PI) return { x: X_MIN + RL * u, rack: "top" };
  return { x: X_MIN + TRAVEL - RL * (u - Math.PI), rack: "bottom" };
}
/** 第 i 根銷在小齒輪轉 v 時的角度 */
export const pinAngle = (i, v) => deg(90) + i * STEP - v;
export const geometry = { RL, PINS, STEP, WINDOW, TRAVEL };

// 齒條的齒間(框架座標):銷正好在正上方(下方)時框架的位置
const spaces = (rack) =>
  Array.from({ length: PINS }, (_, i) => {
    const v = rack === "top" ? i * STEP : Math.PI + i * STEP;
    return -frame(v).x;
  }).sort((a, b) => a - b);
const TOP = spaces("top");
const BOTTOM = spaces("bottom");
const GAP = 0.2; // 齒間寬
const EDGE = 0.8; // 開口上下緣離中心線
const TIP = 0.56; // 齒尖離中心線

/** 一排齒(在開口邊緣上的凸出):齒間 list,big:起始大齒在左(-1)或右(+1) */
function teeth(list, big) {
  const out = [];
  for (let i = 0; i < list.length - 1; i++) out.push([list[i] + GAP / 2, list[i + 1] - GAP / 2]);
  const first = list[0];
  const last = list[list.length - 1];
  out.unshift(big < 0 ? [first - GAP / 2 - 0.3, first - GAP / 2] : [first - GAP / 2 - PITCH + GAP, first - GAP / 2]);
  out.push(big > 0 ? [last + GAP / 2, last + GAP / 2 + 0.3] : [last + GAP / 2, last + GAP / 2 + PITCH - GAP]);
  return out;
}
const LEFT = -2.4;
const RIGHT = 0.45;
// 開口(逆時針):下緣往右(齒朝上)→ 右端半圓 → 上緣往左(齒朝下)→ 左端半圓
const opening = [
  ...teeth(BOTTOM, -1).flatMap(([a, b]) => [[a, -EDGE], [a, -TIP], [b, -TIP], [b, -EDGE]]),
  ...arcPoints(EDGE, -Math.PI / 2, Math.PI / 2, RIGHT, 0),
  ...teeth(TOP, 1).reverse().flatMap(([a, b]) => [[b, EDGE], [b, TIP], [a, TIP], [a, EDGE]]),
  ...arcPoints(EDGE, Math.PI / 2, (3 * Math.PI) / 2, LEFT, 0),
];
// 框架外形:上下兩條橫桿,左端內凹
const outline = [[-4.45, -1.3], [1.5, -1.3], [1.5, 1.3], [-4.45, 1.3], [-4.45, 0.85], ...arcPoints(1.35, deg(39), deg(-39), -5.5, 0).slice(1, -1), [-4.45, -0.85]];
const ROLLERS = [[-1.0, 1.65, 1], [0.85, 1.65, 1], [-1.15, -1.65, -1], [0.83, -1.65, -1]];

export default {
  figure: 199,
  parts: [
    { id: "frame", kind: "plate", shape: shape(outline, [[...opening].reverse()]), thickness: 0.2 },
    {
      id: "pinion",
      kind: "group",
      center: [0, 0, 0.3],
      spin: 0.8,
      pieces: [
        // 兩片半圓板夾著銷;沒有銷的一半只有軸轂
        { kind: "plate", shape: shape([...arcPoints(0.75, deg(72), deg(252))], []), thickness: 0.05, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape([...arcPoints(0.75, deg(72), deg(252))], []), thickness: 0.05, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.14, length: 0.6, mark: true },
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: 0.08, length: 0.52, at: [RL * Math.cos(pinAngle(i, 0)), RL * Math.sin(pinAngle(i, 0)), 0], accent: i === 0 })),
      ],
    },
    ...ROLLERS.map(([x, y], i) => ({ id: `roller${i}`, kind: "group", center: [x, y, 0], spin: ROLLER, arrow: i === 0 || i === 2, pieces: [{ kind: "cylinder", radius: ROLLER, inner: 0.07, length: 0.25, mark: true }] })),
  ],
  driver: { part: "pinion", type: "rotation" },
  target: "frame",
  view: { direction: [0.06, 0.05, 1] },
  pose(a) {
    const { x } = frame(-a); // 主動量是小齒輪的轉角(逆時針為正);小齒輪順時針轉時框架照原文往返
    const parts = { frame: { position: [x, 0, 0] }, pinion: { angle: a } };
    ROLLERS.forEach(([, , side], i) => (parts[`roller${i}`] = { angle: (side * x) / ROLLER }));
    return { parts, readouts: [] };
  },
};

