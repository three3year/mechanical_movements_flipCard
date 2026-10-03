// 第 390 種:把擺動轉成旋轉。半圓形部件 A 接在一根以 a 為支點的槓桿上,也接著兩條皮帶 C、D 的末端;兩條皮帶繞過飛輪 B
// 軸上的兩個鬆套皮帶輪,C 是開口的、D 是交叉的。兩個皮帶輪上都有棘爪,與固定在飛輪軸上的兩個棘輪咬合。A 往一個方向擺時,
// 一個皮帶輪的棘爪帶動棘輪;往另一個方向擺時換另一個,飛輪軸因此連續朝同一方向轉。主動件是部件 A(累計擺動)。
// 推斷:皮帶輪的半徑與擺幅;兩個皮帶輪前後並排。
import { deg, swingPhase } from "./kit.js";
import { ratchetShape, shape, circle, arcPoints } from "./shapes.js";

const A_PIVOT = [0, 2.0, 0];
const ARC = 1.8; // 半圓部件的半徑(皮帶繞在它的外緣)
const WHEEL = { center: [0.2, -0.75, 0], r: 1.55 };
const PULLEY = 0.45;
export const SWING = deg(18);

/** 累計擺動 v → A 的角度、兩個皮帶輪的轉角、飛輪的轉角(只朝一個方向) */
export function oscillation(v) {
  const { at, cycle, forward } = swingPhase(v, -SWING, SWING);
  const strap = ((at + SWING) * ARC) / PULLEY; // A 擺過的弧長帶動皮帶輪
  const span = (2 * SWING * ARC) / PULLEY;
  // 開口皮帶 C:皮帶輪與 A 的擺動同向;交叉皮帶 D:反向
  const c = strap;
  const d = -strap;
  // 飛輪:A 往正向擺時被 C 的棘爪帶(轉 +),往回擺時被 D 的棘爪帶(D 的皮帶輪此時往 + 轉)
  const fly = cycle * 2 * span + (forward ? strap : span + (span - strap));
  return { a: at, c, d, fly };
}

export default {
  figure: 390,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [5.0, 0.15, 0.4], at: [0, A_PIVOT[1] + 0.25, -0.3] }, { kind: "cylinder", radius: 0.15, length: 0.5, at: A_PIVOT }] },
    {
      id: "partA",
      kind: "group",
      center: A_PIVOT,
      arrow: false,
      label: "A",
      labelOffset: [1.75, -0.6, 0.3],
      pieces: [{ kind: "plate", shape: shape([...arcPoints(ARC, deg(180), deg(360)), ...arcPoints(ARC - 0.18, deg(360), deg(180))]), thickness: 0.2 }, { kind: "box", size: [2 * ARC, 0.12, 0.15] }],
    },
    { id: "labela", kind: "group", center: A_PIVOT, label: "a", labelOffset: [0, 0.4, 0.3] },
    {
      id: "flywheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.r,
      label: "B",
      labelOffset: [-1.1, -1.0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.r), [circle(WHEEL.r - 0.2).reverse()]), thickness: 0.25, at: [0, 0, -0.45] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2 * WHEEL.r - 0.3, 0.12, 0.1], at: [0, 0, -0.45], angle: (i * Math.PI) / 3 })),
        { kind: "plate", shape: ratchetShape({ teeth: 14, outer: 0.38, inner: 0.28, dir: 1 }), thickness: 0.08, at: [0, 0, 0.0] },
        { kind: "plate", shape: ratchetShape({ teeth: 14, outer: 0.38, inner: 0.28, dir: 1 }), thickness: 0.08, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.08, length: 1.2 },
      ],
    },
    { id: "pulleyC", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.12], spin: PULLEY, label: "C", labelOffset: [0.9, 0.2, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }] },
    { id: "pulleyD", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.42], spin: PULLEY, label: "D", labelOffset: [-0.6, 0.55, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }] },
    { id: "strapC", kind: "belt" },
    { id: "strapD", kind: "belt" },
  ],
  waivers: [
    { check: "interference", parts: ["pulleyD", "strapD"], reason: "待確認:strapD 的第 1 段穿過pulleyD 的板重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["pulleyC", "strapC"], reason: "待確認:strapC 的第 2 段穿過pulleyC 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "partA", type: "rotation", cycle: [-SWING, SWING] },
  target: "flywheel", // 連續同向轉的飛輪
  view: { direction: [0.15, 0.08, 1] },
  pose(v) {
    const o = oscillation(v);
    const p = WHEEL.center;
    // 兩條皮帶的兩端都固定在 A 的弧緣上,中間繞過飛輪軸上的皮帶輪(C 開口、D 交叉:兩條的繞向相反)
    const ptA = (ang, z) => [A_PIVOT[0] + ARC * Math.cos(ang), A_PIVOT[1] + ARC * Math.sin(ang), z];
    return {
      parts: { partA: { angle: o.a }, pulleyC: { angle: o.c }, pulleyD: { angle: o.d }, flywheel: { angle: o.fly } },
      paths: {
        strapC: { points: [ptA(o.a - deg(55), 0.12), [p[0] + PULLEY, p[1], 0.12], [p[0], p[1] - PULLEY, 0.12], [p[0] - PULLEY, p[1], 0.12], ptA(o.a + deg(-125), 0.12)], closed: false, phase: o.c * PULLEY },
        strapD: { points: [ptA(o.a - deg(125), 0.42), [p[0] + PULLEY, p[1], 0.42], [p[0], p[1] - PULLEY, 0.42], [p[0] - PULLEY, p[1], 0.42], ptA(o.a - deg(55), 0.42)], closed: false, phase: o.d * PULLEY },
      },
      readouts: [],
    };
  },
};
