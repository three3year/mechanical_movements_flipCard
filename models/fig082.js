// 第 82 種:兩個踏板 D 交替踩下時,透過振動臂 B 與臂端的棘爪,把近乎連續的運動傳給棘輪 A。
// 兩個踏板的末端以鏈條(或皮帶)繞過上方的滑輪 C 相連,一個踩下時另一個便被抬起。
// 每個踏板經一根連桿拉著一支振動臂;踩下時臂端往下,棘爪推動 A 的右側往下(A 順時針轉),
// 抬起時棘爪滑過齒背退回。主動量是前踏板的累計擺動量。
import { deg, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { ratchetShape, shape } from "./shapes.js";

const A = { center: [0, 0, 0], teeth: 28, outer: 1.6, inner: 1.38, dir: -1 };
const PIVOT = [-1.8, -2.35]; // 踏板的支點
const TREADLE = 4.6; // 踏板長
const ROD_AT = 2.65; // 連桿接在踏板上離支點的距離
const ARM = 1.55; // 振動臂長
const ROD = { front: 2.15, back: 2.05 };
const SWING = deg(9);
const Z = { front: 0.45, back: -0.45 };
const PULLEY = { center: [3.05, -0.2], radius: 0.28 };

// 踏板的轉角:前踏板 t、後踏板 −t(鏈條繞過滑輪)
const rodFoot = (which, t) => bodyPoint(PIVOT, which === "front" ? t : -t, [ROD_AT, 0]);
// 臂端:從連桿下端量一根連桿長,落在臂端的圓上(取右方的交點)
const armEnd = (which, t) => circleCircle(rodFoot(which, t), ROD[which], A.center, ARM, -1).point;
const armAngle = (which) => (t) => {
  const e = armEnd(which, t);
  return Math.atan2(e[1], e[0]);
};

/** 主動量 v:棘輪 A 的轉角(順時針為負)。前踏板踩下(t 減少)時前臂推,抬起時後臂推 */
export const wheelAngle = (v) => doubleAction(v, SWING / 2, -SWING / 2, armAngle("front"), armAngle("back"));
export const swing = SWING;

const treadle = (id, z, label) => ({
  id,
  kind: "group",
  center: [...PIVOT, z],
  arrow: false,
  pieces: [{ kind: "box", size: [TREADLE, 0.12, 0.18], at: [TREADLE / 2, 0, 0] }, { kind: "cylinder", radius: 0.12, length: 0.3 }],
  ...(label ? { label, labelOffset: [TREADLE - 0.3, -0.3, 0] } : {}),
});

const arm = (id, z) => ({
  id,
  kind: "group",
  center: [0, 0, z * 0.45],
  arrow: false,
  pieces: [
    { kind: "box", size: [ARM, 0.16, 0.08], at: [ARM / 2, 0, 0] },
    { kind: "plate", shape: shape([[ARM - 0.05, -0.05], [ARM + 0.1, 0.12], [ARM + 0.05, 0.2], [ARM - 0.15, 0.05]]), thickness: 0.06 },
  ],
});

export default {
  figure: 82,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: ratchetShape({ ...A, bore: 0.15 }),
      thickness: 0.2,
      hub: 0.32,
      circles: [1.2, 0.42],
      mark: [0.8, 0],
      markSize: 0.09,
      spin: A.outer,
      label: "A",
      labelOffset: [-0.85, 0, 0.3],
    },
    arm("armFront", Z.front),
    arm("armBack", Z.back),
    { id: "labelB", kind: "group", center: [0.8, 0.05, 0.4], label: "B" },
    treadle("front", Z.front, "D"),
    treadle("back", Z.back),
    { id: "rodFront", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "rodBack", kind: "link", width: 0.08, thickness: 0.05 },
    {
      id: "pulley",
      kind: "pulley",
      style: "disc",
      center: [...PULLEY.center, 0],
      axis: [1, 0, 0],
      radius: PULLEY.radius,
      width: 0.16,
      label: "C",
      labelOffset: [-0.2, 0.5, 0],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 2.4, 0.12], at: [2.75, -1.3, 0.6] },
        { kind: "box", size: [0.12, 2.4, 0.12], at: [3.35, -1.3, 0.6] },
        { kind: "box", size: [0.12, 2.4, 0.12], at: [2.75, -1.3, -0.6] },
        { kind: "box", size: [0.12, 2.4, 0.12], at: [3.35, -1.3, -0.6] },
        { kind: "box", size: [0.9, 0.5, 0.5], at: [-1.8, -2.65, 0] },
        { kind: "box", size: [7.0, 0.06, 2.0], at: [0.6, -2.95, 0] },
      ],
    },
    { id: "chain", kind: "rope" },
  ],
  waivers: [
    { check: "interference", parts: ["armFront", "rodFront"], reason: "待確認:armFront 的板 與 rodFront 的方塊 1×0.08×0.05重疊 0.03,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["armBack", "rodBack"], reason: "待確認:armBack 的方塊 1.55×0.16×0.08 與 rodBack 的方塊 1×0.08×0.05重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["back", "rodBack"], reason: "待確認:back 的方塊 4.6×0.12×0.18 與 rodBack 的方塊 1×0.08×0.05重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "front", type: "rotation", cycle: [SWING / 2, -SWING / 2] },
  target: "wheel", // 近乎連續旋轉的棘輪 A
  view: { direction: [0.25, 0.12, 1] },
  pose(v) {
    const t = swingAt(v, SWING / 2, -SWING / 2);
    const end = (which) => bodyPoint(PIVOT, which === "front" ? t : -t, [TREADLE * 0.98, 0]);
    const foot = (w, z) => [...rodFoot(w, t).slice(0, 2), z];
    const top = (w, z) => [...armEnd(w, t).slice(0, 2), z];
    const ef = end("front");
    const eb = end("back");
    // 鏈條:前踏板末端 → 往上繞過滑輪 C 的頂部(滑輪軸沿 x,鏈條在 yz 平面上繞)→ 後踏板末端
    const [px, py] = PULLEY.center;
    const chain = [
      [ef[0], ef[1], Z.front],
      ...Array.from({ length: 13 }, (_, i) => {
        const phi = (Math.PI * i) / 12;
        return [px, py + PULLEY.radius * Math.sin(phi), PULLEY.radius * Math.cos(phi)];
      }),
      [eb[0], eb[1], Z.back],
    ];
    return {
      parts: {
        front: { angle: t },
        back: { angle: -t },
        wheel: { angle: wheelAngle(v) },
        armFront: { angle: armAngle("front")(t) },
        armBack: { angle: armAngle("back")(t) },
        rodFront: { from: foot("front", Z.front), to: top("front", Z.front * 0.45) },
        rodBack: { from: foot("back", Z.back), to: top("back", Z.back * 0.45) },
        pulley: { angle: ef[1] / PULLEY.radius },
      },
      // 前踏板末端上升時,鏈條往前端那頭走
      paths: { chain: { points: chain, closed: false, phase: -ef[1] } },
      readouts: [],
    };
  },
};

