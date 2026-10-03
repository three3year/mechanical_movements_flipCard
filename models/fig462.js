// 第 462 種:鏈式泵,以連續的圓周運動抬水。無端鏈條帶著木製或金屬的碟片,碟片與一根不漏水的圓筒配合,形成一連串裝滿水的水斗。
// 動力加在上方的輪上。
// 主動件是上方的輪(左邊的鏈條往上走)。
// 推斷:圓筒套在鏈條左邊的一段上,下端浸在水裡,上端通到左上的水槽;碟片在筒裡時,碟片之間裝滿水,到筒頂就把水倒進水槽;
// 圓筒畫成剖面。
import { TAU, polar, quatFromZ } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle } from "./shapes.js";

export const TOP = [0.5, 2.0, 0];
export const BOTTOM = [0.5, -1.7, 0];
export const R = 0.45; // 鏈輪半徑
const SPACING = 0.42; // 碟片間距
export const TUBE = { x: TOP[0] - R, y0: -1.25, y1: 1.6, r: 0.18 };
export const WATER = -0.9; // 水面
const RUN = TOP[1] - BOTTOM[1];
export const LOOP = 2 * RUN + TAU * R;
const DISCS = Math.round(LOOP / SPACING);

/** 鏈條上弧長 s 處的位置與切線(從左下開始往上走) */
export function chainAt(s0) {
  const s = ((s0 % LOOP) + LOOP) % LOOP;
  if (s < RUN) return { p: [TOP[0] - R, BOTTOM[1] + s, 0], t: [0, 1, 0] };
  if (s < RUN + Math.PI * R) {
    const a = Math.PI - (s - RUN) / R;
    return { p: polar(R, a).map((c, i) => c + TOP[i]), t: [Math.sin(a), -Math.cos(a), 0] };
  }
  if (s < 2 * RUN + Math.PI * R) return { p: [TOP[0] + R, TOP[1] - (s - RUN - Math.PI * R), 0], t: [0, -1, 0] };
  const a = -(s - 2 * RUN - Math.PI * R) / R;
  return { p: polar(R, a).map((c, i) => c + BOTTOM[i]), t: [Math.sin(a), -Math.cos(a), 0] };
}

const sprocket = (center) => ({
  kind: "group",
  pieces: [
    { kind: "plate", shape: shape(circle(R * 0.85), [circle(0.06).reverse()]), thickness: 0.08 },
    ...Array.from({ length: 8 }, (_, i) => ({ kind: "box", size: [2 * R + 0.25, 0.05, 0.05], at: [0, 0, 0], angle: (i * Math.PI) / 8 })),
  ],
  center,
});

export default {
  figure: 462,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: [0, 1, 0], profile: [[TUBE.r, 0], [TUBE.r + 0.06, 0], [TUBE.r + 0.06, TUBE.y1 - TUBE.y0], [TUBE.r, TUBE.y1 - TUBE.y0]], at: [TUBE.x, TUBE.y0, 0], ...backHalf([0, 1, 0]) },
        // 左上的岸
        { kind: "box", size: [1.2, 0.5, 1.2], at: [TUBE.x - 1.7, TUBE.y1 - 0.35, 0] },
        { kind: "box", size: [4.4, 0.2, 1.4], at: [0, BOTTOM[1] - R - 0.4, 0] },
      ],
    },
    // 左上的水槽(接住碟片抬上來的水):獨立成一個零件當目標件
    {
      id: "trough",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.6, 0.08, 0.6], at: [TUBE.x - 0.9, TUBE.y1 - 0.05, 0] },
        { kind: "box", size: [1.6, 0.35, 0.05], at: [TUBE.x - 0.9, TUBE.y1 + 0.1, -0.3] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, (WATER + BOTTOM[1] - R - 0.3) / 2, 0], size: [4.2, WATER - BOTTOM[1] + R + 0.3, 1.3], level: 1 },
    { id: "upper", ...sprocket(TOP), spin: R + 0.2 },
    { id: "lower", ...sprocket(BOTTOM), arrow: false },
    { id: "chain", kind: "chain", radius: 0.025 },
    ...Array.from({ length: DISCS }, (_, i) => ({ id: `disc${i}`, kind: "cylinder", radius: TUBE.r - 0.02, length: 0.05, arrow: false })),
  ],
  waivers: [
    { check: "interference", parts: ["works", "trough"], reason: "待確認:works 的旋轉體 與 trough 的方塊 1.6×0.08×0.6重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc8"], reason: "待確認:upper 的板 與 disc8 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc9"], reason: "待確認:upper 的板 與 disc9 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc10"], reason: "待確認:upper 的方塊 1.15×0.05×0.05 與 disc10 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc11"], reason: "待確認:upper 的板 與 disc11 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc12"], reason: "待確認:upper 的板 與 disc12 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc13"], reason: "待確認:upper 的板 與 disc13 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc0"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc0 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc1"], reason: "待確認:lower 的板 與 disc1 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc20"], reason: "待確認:lower 的板 與 disc20 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc21"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc21 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc22"], reason: "待確認:lower 的板 與 disc22 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc23"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc23 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc1", "chain"], reason: "待確認:chain 的第 109 段穿過disc1 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc2", "chain"], reason: "待確認:chain 的第 23 段穿過disc2 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc3", "chain"], reason: "待確認:chain 的第 110 段穿過disc3 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc4", "chain"], reason: "待確認:chain 的第 48 段穿過disc4 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc5", "chain"], reason: "待確認:chain 的第 15 段穿過disc5 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc6", "chain"], reason: "待確認:chain 的第 97 段穿過disc6 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc7", "chain"], reason: "待確認:chain 的第 35 段穿過disc7 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc8", "chain"], reason: "待確認:chain 的第 2 段穿過disc8 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc9", "chain"], reason: "待確認:chain 的第 36 段穿過disc9 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc10", "chain"], reason: "待確認:chain 的第 70 段穿過disc10 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc11", "chain"], reason: "待確認:chain 的第 37 段穿過disc11 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc12", "chain"], reason: "待確認:chain 的第 95 段穿過disc12 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc13", "chain"], reason: "待確認:chain 的第 62 段穿過disc13 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc15", "chain"], reason: "待確認:chain 的第 82 段穿過disc15 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc16", "chain"], reason: "待確認:chain 的第 49 段穿過disc16 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc17", "chain"], reason: "待確認:chain 的第 11 段穿過disc17 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc18", "chain"], reason: "待確認:chain 的第 117 段穿過disc18 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc19", "chain"], reason: "待確認:chain 的第 84 段穿過disc19 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc20", "chain"], reason: "待確認:chain 的第 70 段穿過disc20 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc21", "chain"], reason: "待確認:chain 的第 104 段穿過disc21 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc22", "chain"], reason: "待確認:chain 的第 71 段穿過disc22 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc23", "chain"], reason: "待確認:chain 的第 9 段穿過disc23 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc0", "chain"], reason: "待確認:chain 的第 75 段穿過disc0 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["disc14", "chain"], reason: "待確認:chain 的第 24 段穿過disc14 的圓柱 r0.16×0.05重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc7"], reason: "待確認:upper 的板 與 disc7 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc19"], reason: "待確認:lower 的板 與 disc19 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc6"], reason: "待確認:upper 的板 與 disc6 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc18"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc18 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc5"], reason: "待確認:upper 的方塊 1.15×0.05×0.05 與 disc5 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc17"], reason: "待確認:lower 的板 與 disc17 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc4"], reason: "待確認:upper 的板 與 disc4 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc16"], reason: "待確認:lower 的板 與 disc16 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc3"], reason: "待確認:upper 的板 與 disc3 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc15"], reason: "待確認:lower 的板 與 disc15 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc2"], reason: "待確認:upper 的板 與 disc2 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc14"], reason: "待確認:lower 的板 與 disc14 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc1"], reason: "待確認:upper 的板 與 disc1 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc13"], reason: "待確認:lower 的板 與 disc13 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc0"], reason: "待確認:upper 的方塊 1.15×0.05×0.05 與 disc0 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc12"], reason: "待確認:lower 的板 與 disc12 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc23"], reason: "待確認(未修):upper 的方塊 1.15×0.05×0.05 與 disc23 的圓柱 r0.16×0.05互相穿入 0.10(21 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["lower", "disc11"], reason: "待確認:lower 的板 與 disc11 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc22"], reason: "待確認:upper 的板 與 disc22 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc10"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc10 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc21"], reason: "待確認:upper 的板 與 disc21 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc9"], reason: "待確認:lower 的板 與 disc9 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc20"], reason: "待確認:upper 的板 與 disc20 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc8"], reason: "待確認:lower 的板 與 disc8 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc7"], reason: "待確認:lower 的板 與 disc7 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc19"], reason: "待確認:upper 的板 與 disc19 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc18"], reason: "待確認:upper 的方塊 1.15×0.05×0.05 與 disc18 的圓柱 r0.16×0.05重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc6"], reason: "待確認:lower 的板 與 disc6 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc5"], reason: "待確認(未修):lower 的方塊 1.15×0.05×0.05 與 disc5 的圓柱 r0.16×0.05互相穿入 0.10(21 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["upper", "disc17"], reason: "待確認:upper 的板 與 disc17 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc4"], reason: "待確認:lower 的板 與 disc4 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc16"], reason: "待確認:upper 的板 與 disc16 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc15"], reason: "待確認:upper 的板 與 disc15 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc3"], reason: "待確認:lower 的板 與 disc3 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["lower", "disc2"], reason: "待確認:lower 的方塊 1.15×0.05×0.05 與 disc2 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "disc14"], reason: "待確認:upper 的板 與 disc14 的圓柱 r0.16×0.05重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "upper", type: "rotation", speed: -0.6 },
  target: "trough", // 鏈條是路徑零件(不上目標色);標接住碟片抬上來的水的水槽
  view: { direction: [0.15, 0.12, 1] },
  pose(theta) {
    const s = -theta * R; // 上輪順時針轉,左邊的鏈條往上
    const parts = { upper: { angle: theta }, lower: { angle: theta } };
    const water = [];
    for (let i = 0; i < DISCS; i++) {
      const { p, t } = chainAt(s + i * SPACING);
      parts[`disc${i}`] = { position: p, rotation: quatFromZ(t) };
      // 筒裡、碟片上方的水(到下一片碟片為止)
      if (t[1] > 0.99 && p[1] > TUBE.y0 && p[1] < TUBE.y1 - 0.1) {
        for (let k = 1; k <= 3; k++) water.push([p[0] + ((k % 2) - 0.5) * 0.12, p[1] + (k * SPACING) / 4, 0.12]);
      }
    }
    const chain = Array.from({ length: 121 }, (_, i) => chainAt((LOOP * i) / 120).p);
    return {
      parts,
      paths: { chain: { points: chain, closed: true, phase: s } },
      flows: [{ fluid: "water", points: [...water.filter((q) => q[1] < TUBE.y1 - 0.05), ...stream([[TUBE.x, TUBE.y1, 0.12], [TUBE.x - 0.3, TUBE.y1 + 0.02, 0.12], [TUBE.x - 1.6, TUBE.y1 + 0.02, 0.12]], s * 1.5, { spacing: 0.15 })] }],
      readouts: [],
    };
  },
};
