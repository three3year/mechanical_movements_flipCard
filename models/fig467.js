// 第 467 種:Robertson 的液壓千斤頂。柱塞立在中空的底座上不動,附有爪鉤的液壓缸在柱塞上滑動。泵從中空底座取水,
// 經柱塞裡的一根管子把水壓進液壓缸,把液壓缸抬起。管子底部有一個翼形螺絲操作的閥門,需要時讓水流回,把負載慢慢放下。
// 主動件是泵的手柄;狀態按鈕切換「壓手柄抬升」與「開閥放下」(開閥時抓的是翼形螺絲,手柄不動)。剖面圖。
// 照原圖重讀(2026-10-20 決定 (a)):手柄從缸後面往左下伸出,下端有兩個銷——上面的銷接泵柱塞,下面的銷以一節搖桿
// 接到底座左上角(托架)的固定銷;手柄的支點就是會擺的搖桿上銷(同第 450 種的吊環)。泵筒(原圖缸左下斜放的方塊)
// 斜靠在底座上、下端伸進底座的水裡,壓下手柄時柱塞沿泵筒往下,水經泵道推開出水閥進柱塞裡的管子、送上液壓缸;
// 提起時吸水閥開、底座的水進泵筒。管子從柱塞中心往下到底座底部、轉彎往左到管底的閥座,翼形螺絲從底座左壁外
// 旋進去頂住閥座;開閥時螺絲退出,水從管底流回底座。泵筒、兩個閥、托架、閥座與螺絲的塞子都是推斷;
// 每壓一下液壓缸升起的量照面積比放大約 6 倍才看得出來。
import { Y, X, deg, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, valveOpening, flap, pipeWalls, leverPart } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, stadium } from "./shapes.js";

export const BASE = { x0: -1.1, x1: 1.1, y0: -1.8, y1: -1.0, wall: 0.1, slab: 0.08, depth: 1.0 }; // 中空的底座(外側)
const RAM = { r: 0.32, bore: 0.09, top: 1.6 }; // 固定的柱塞,中心的孔就是通到液壓缸的管子
export const CYL = { r: 0.35, len: 1.6 }; // 滑動的液壓缸(內半徑、長)
export const LIFT = 0.9; // 液壓缸最多升起
const PER = 0.05; // 每壓一下升起(放大約 6 倍)
export const SWING = [deg(50), deg(30)]; // 手柄:上 → 下(壓)
/** 搖桿:底座左上角托架上的固定銷、長 */
export const ROCKER = { anchor: [-1.05, -0.9], length: 0.8 };
export const SHORT = 0.9; // 手柄下端的銷 F 到柱塞銷 P
const ALPHA = deg(70); // 泵筒的斜度(離水平)
/** 泵筒的軸線:從底座裡的彎點 K 往上(dir 是單位向量);柱塞銷 P = origin + s·dir */
export const LINE = { origin: [-0.45, -1.25], dir: [-Math.cos(ALPHA), Math.sin(ALPHA)] };
/** 泵筒(剖面的兩道壁)沿軸線的範圍:lo 是彎點 K、hi 是筒口 */
export const BARREL = { lo: 0, hi: 1.0, w: 0.2 };
export const PLUNGER = 0.85; // 柱塞長(銷到底)
const PIPE_W = 0.24; // 柱塞裡的管子與底座裡的管:壁中心線相距 0.24、壁厚 0.06 → 內寬 0.18、外寬 0.3
export const PIPE_END = -0.7; // 管底(閥座)的 x
/** 底座裡的管子:從柱塞底往下,轉彎往左到管底的閥座 */
export const PIPE = [[0, BASE.y1], [0, -1.55], [PIPE_END, -1.55]];
const JUNCTION_Y = LINE.origin[1]; // 泵道接進管子左壁的高度
const HANDLE_Z = -0.55; // 手柄在液壓缸後面(缸外半徑 0.47);搖桿再後一層
const SCREW = { r: 0.045, plugR: 0.085, plugL: 0.12, x: -1.5, y: -1.55, open: 0.18, turns: 8 }; // 翼形螺絲:閉著時從 x 到塞子右端 PIPE_END + plugL
const OPEN_V = 0.5; // 開閥狀態:主動量走到這裡閥全開
const OPEN = deg(55);
const OPEN_D = deg(45);
const along = (s) => [LINE.origin[0] + s * LINE.dir[0], LINE.origin[1] + s * LINE.dir[1]];
const OUT = [Math.sin(ALPHA), Math.cos(ALPHA)]; // 泵筒軸線的法線(朝柱塞那一側);外壁在 −OUT 那一側
const wallAt = (s) => along(s).map((c, i) => c - (BARREL.w / 2) * OUT[i]); // 泵筒外壁(朝底座左邊)中心線上的點
const SUCTION = { lo: 0.02, hi: 0.18 }; // 吸水閥:泵筒外壁在底座裡的這一段開口(沿軸線的里程),閥瓣鉸在下端
/** 吸水閥關著時的角(貼著斜的泵筒壁) */
export const SUCTION_CLOSED = Math.PI - ALPHA;
const K = LINE.origin;
const T = along(BARREL.hi);
const J = [-(PIPE_W - 0.06) / 2, JUNCTION_Y]; // 泵道接到管子左壁的內面

/** 手柄角 theta → 搖桿上銷 F(手柄下端)、柱塞銷 P(在泵筒軸線上,離 K 的里程 s) */
export function place(theta) {
  const u = [Math.cos(theta), Math.sin(theta)];
  const { anchor, length } = ROCKER;
  // P = K + s·dir,F = P − SHORT·u,|F − anchor| = length:解 s(取柱塞在上面的那個解)
  const C = [K[0] - SHORT * u[0] - anchor[0], K[1] - SHORT * u[1] - anchor[1]];
  const b = C[0] * LINE.dir[0] + C[1] * LINE.dir[1];
  const c = C[0] ** 2 + C[1] ** 2 - length ** 2;
  const s = -b + Math.sqrt(Math.max(0, b * b - c));
  const P = along(s);
  return { s, P, F: [P[0] - SHORT * u[0], P[1] - SHORT * u[1]] };
}

/** 累計主動量 v、狀態 → 液壓缸升起多少、手柄角、是否在壓、手柄下端 F、柱塞銷 P 與里程 s、閥開多少(0–1)、螺絲退出多少 */
export function jack(v, state = "lift") {
  const phase = stroke(v, ...SWING);
  const { at, forward, f, n } = phase;
  if (state === "release") {
    // 轉翼形螺絲:閥由關到全開,流回的量是開度對主動量的積分,液壓缸隨著慢慢降下
    const open = clamp(v / OPEN_V, 0, 1);
    const flowed = v < OPEN_V ? (v * v) / (2 * OPEN_V) : OPEN_V / 2 + (v - OPEN_V);
    return { rise: clamp(LIFT - flowed * 0.3, 0, LIFT), handle: SWING[0], pressing: false, ...place(SWING[0]), open, screwOut: SCREW.open * open, phase };
  }
  const strokes = Math.floor((n + 1) / 2) + (forward ? f : 0);
  return { rise: clamp(strokes * PER, 0, LIFT), handle: at, pressing: forward, ...place(at), open: 0, screwOut: 0, phase };
}

const slab = (x0, x1, y0, y1) => ({ kind: "box", size: [x1 - x0, y1 - y0, BASE.depth], at: [(x0 + x1) / 2, (y0 + y1) / 2, 0] });
// 泵筒穿過底座頂板的地方開口(斜的管,開口的寬度照斜度算)
const crossTop = (y) => along((y - K[1]) / LINE.dir[1])[0];
const GAP = (BARREL.w / 2 + 0.03) / Math.sin(ALPHA);
const topGap = [Math.min(crossTop(BASE.y1), crossTop(BASE.y1 - BASE.slab)) - GAP, Math.max(crossTop(BASE.y1), crossTop(BASE.y1 - BASE.slab)) + GAP];

export default {
  figure: 467,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        // 中空的底座(裝水;剖開):底、左右壁(左壁留螺絲穿過的孔與螺孔的套)、頂板(讓開管子與泵筒)
        slab(BASE.x0, BASE.x1, BASE.y0, BASE.y0 + BASE.slab),
        slab(BASE.x0, BASE.x0 + BASE.wall, BASE.y0, SCREW.y - 0.08),
        slab(BASE.x0, BASE.x0 + BASE.wall, SCREW.y + 0.08, BASE.y1),
        slab(BASE.x1 - BASE.wall, BASE.x1, BASE.y0, BASE.y1),
        slab(BASE.x0, topGap[0], BASE.y1 - BASE.slab, BASE.y1),
        slab(topGap[1], -(PIPE_W / 2 + 0.03), BASE.y1 - BASE.slab, BASE.y1),
        slab(PIPE_W / 2 + 0.03, BASE.x1, BASE.y1 - BASE.slab, BASE.y1),
        { kind: "cylinder", radius: 0.09, inner: SCREW.r + 0.005, length: 0.2, axis: X, at: [BASE.x0 + BASE.wall / 2, SCREW.y, 0] }, // 螺絲的螺孔套
        // 固定的柱塞(中心的孔是管子)
        { kind: "lathe", axis: Y, profile: [[RAM.bore, 0], [RAM.r, 0], [RAM.r, RAM.top - BASE.y1], [RAM.bore, RAM.top - BASE.y1]], at: [0, BASE.y1, 0], ...backHalf(Y) },
        // 底座裡的管子(剖面):柱塞底 → 底座底部 → 往左到管底;左壁在泵道接進處斷開
        ...pipeWalls(PIPE, PIPE_W, 0.06, 0.4, { breaks: [{ at: [-PIPE_W / 2, JUNCTION_Y], width: BARREL.w + 0.06, side: -1 }] }),
        // 泵筒與泵道(剖面;推斷):斜的泵筒從筒口 T 到底座裡的彎點 K,再往右接進管子;下壁在吸水閥處開口
        ...pipeWalls([T, K, J], BARREL.w, 0.06, 0.4, { breaks: [{ at: wallAt((SUCTION.lo + SUCTION.hi) / 2), width: SUCTION.hi - SUCTION.lo, side: -1 }], back: true }),
        // 底座左上角往後伸的托架(推斷):臂從底座背面伸到搖桿後面,柱立在臂上,固定銷從柱往前穿過搖桿
        { kind: "box", size: [0.2, 0.13, 0.45], at: [ROCKER.anchor[0], BASE.y1 - 0.08 + 0.065, -BASE.depth / 2 - 0.225] },
        { kind: "box", size: [0.2, 0.2, 0.15], at: [ROCKER.anchor[0], ROCKER.anchor[1] - 0.02, HANDLE_Z - 0.325] },
        { kind: "cylinder", radius: 0.03, length: 0.23, at: [ROCKER.anchor[0], ROCKER.anchor[1], HANDLE_Z - 0.135] },
      ],
    },
    { id: "baseWater", kind: "fill", fluid: "water", center: [0, (BASE.y0 + BASE.y1) / 2, 0], size: [BASE.x1 - BASE.x0 - 2 * BASE.wall - 0.02, BASE.y1 - BASE.y0 - 2 * BASE.slab, BASE.depth - 0.1], level: 0.95 },
    {
      id: "cylinder",
      kind: "lathe",
      axis: Y,
      profile: [[CYL.r, 0], [CYL.r + 0.12, 0], [CYL.r + 0.12, CYL.len], [0, CYL.len], [0, CYL.len - 0.12], [CYL.r, CYL.len - 0.12]],
      ...backHalf(Y),
      arrow: false,
      pieces: [
        // 頂上的托座(lathe 的局部 z 是世界的 +Y)與側面的爪鉤
        { kind: "plate", shape: shape([[-0.5, 0], [-0.55, 0.35], [-0.2, 0.12], [0.2, 0.12], [0.55, 0.35], [0.5, 0]]), thickness: 0.6, at: [0, 0, CYL.len], rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
        { kind: "plate", shape: shape([[CYL.r + 0.1, 0.3], [CYL.r + 0.6, 0.3], [CYL.r + 0.6, 0.75], [CYL.r + 0.48, 0.75], [CYL.r + 0.48, 0.42], [CYL.r + 0.1, 0.42]]), thickness: 0.4, at: [0, 0, 0], rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
      ],
    },
    { id: "cylWater", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * CYL.r - 0.02, LIFT + 0.1, 0], level: 0 },
    // 手柄:下端的銷孔套在搖桿的上銷,離它 SHORT 的銷孔套著柱塞的銷;把手往右上伸出、彎向右邊
    leverPart("handle", { short: SHORT, long: 3.4, side: 1, bend: [1.6, -0.02], grip: [3.4, -0.9] }),
    { id: "rocker", kind: "link", width: 0.08, thickness: 0.05 },
    // 泵柱塞(沿泵筒的軸線);頂端的銷往後穿過手柄的銷孔
    {
      id: "plunger",
      kind: "cylinder",
      axis: [LINE.dir[0], LINE.dir[1], 0],
      radius: 0.06,
      length: PLUNGER,
      arrow: false,
      // 附件的 axis 是零件的局部座標:局部 z 對齊世界的 dir 之後,世界 +z 對應局部的 −dir
      pieces: [{ kind: "cylinder", radius: 0.03, length: 0.62, axis: [-LINE.dir[0], -LINE.dir[1], 0], at: [0.31 * LINE.dir[0], 0.31 * LINE.dir[1], PLUNGER / 2] }],
    },
    // 翼形螺絲:桿從底座左壁外旋進去,右端的塞子頂在管底的閥座裡;翼在壁外
    {
      id: "screw",
      kind: "cylinder",
      axis: X,
      radius: SCREW.r,
      length: PIPE_END + SCREW.plugL - SCREW.x,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: SCREW.plugR, length: SCREW.plugL, at: [0, 0, (PIPE_END + SCREW.plugL - SCREW.x) / 2 - SCREW.plugL / 2] },
        { kind: "plate", shape: shape(stadium(0.5, 0.12).outline.map(([x, y]) => [y, x - 0.25])), thickness: 0.05, at: [0, 0, -(PIPE_END + SCREW.plugL - SCREW.x) / 2 + 0.2], accent: true }, // 翼(直立,轉螺絲時看得到它轉)
      ],
    },
    flap("suction", SUCTION.hi - SUCTION.lo - 0.02),
    flap("delivery", BARREL.w - 0.06),
  ],
  states: {
    initial: "lift",
    options: [
      { id: "lift", label: "壓手柄抬升" },
      { id: "release", label: "開閥放下" },
    ],
  },
  powered: ["cylinder", "suction", "delivery"], // 外力來源:液壓缸是被泵進來的水頂起的、閥瓣是被水頂開的(液壓傳動,沒有實體相連)
  driver: { part: "handle", grips: ["plunger", "screw"], type: "rotation", cycle: SWING },
  target: "cylinder",
  view: { direction: [0.15, 0.1, 1] },
  pose(v, state = "lift") {
    const j = jack(v, state);
    const bottom = RAM.top - (CYL.len - 0.12) + 0.02 + j.rise; // 液壓缸底;液壓缸內頂碰到柱塞頂時 rise = 0
    const travel = v * 5;
    const flows = [];
    const plungerBottom = along(j.s - PLUNGER);
    const plungerMid = along(j.s - PLUNGER / 2);
    const screwX = SCREW.x - j.screwOut;
    const vp = state === "lift" ? j.phase : { f: 1, n: 0 }; // 開閥時兩個閥都關著
    if (state === "lift" && j.pressing && j.rise < LIFT) {
      // 壓下:水從柱塞下方經泵道、推開出水閥進管子,沿柱塞中心的管子上到液壓缸
      flows.push({ fluid: "water", points: stream([[...along(j.s - PLUNGER - 0.05), 0.1], [...K, 0.1], [-0.2, JUNCTION_Y, 0.1], [0, JUNCTION_Y + 0.06, 0.1], [0, RAM.top + 0.05 + j.rise * 0.5, 0.1]], travel, { spacing: 0.15 }) });
    } else if (state === "lift" && !j.pressing) {
      // 提起:底座左邊的水推開泵筒外壁的吸水閥進泵筒
      const mid = (SUCTION.lo + SUCTION.hi) / 2;
      flows.push({ fluid: "water", points: stream([[-0.85, BASE.y0 + 0.25, 0.1], [...wallAt(mid).map((c, i) => c - 0.12 * OUT[i]), 0.1], [...along(mid), 0.1], [...along(j.s - PLUNGER - 0.05), 0.1]], travel, { spacing: 0.15 }) });
    }
    if (state === "release" && j.rise > 0 && j.open > 0.3) {
      // 開閥:液壓缸的水從管子下來、到管底,從退開的閥座流回底座
      flows.push({ fluid: "water", points: stream([[0, RAM.top + 0.05, 0.1], [0, PIPE[1][1], 0.1], [PIPE_END, PIPE[2][1], 0.1], [PIPE_END - 0.06, PIPE[2][1] + 0.15, 0.1], [PIPE_END - 0.1, PIPE[2][1] + 0.35, 0.1]], travel, { spacing: 0.15 }) });
    }
    return {
      parts: {
        cylinder: { position: [0, bottom, 0] },
        cylWater: { position: [0, RAM.top + (LIFT + 0.1) / 2, 0], level: j.rise / (LIFT + 0.1) },
        handle: { position: [j.F[0], j.F[1], HANDLE_Z], angle: j.handle },
        rocker: { from: [ROCKER.anchor[0], ROCKER.anchor[1], HANDLE_Z - 0.09], to: [j.F[0], j.F[1], HANDLE_Z - 0.09] },
        plunger: { position: [plungerMid[0], plungerMid[1], 0] },
        screw: { position: [screwX + (PIPE_END + SCREW.plugL - SCREW.x) / 2, SCREW.y, 0], angle: state === "release" ? v * SCREW.turns : 0 },
        // 閥瓣被水頂開、回程加速落回閥座:吸水閥在泵道的下壁、出水閥鉸在管子左壁開口的下緣、往管子裡張開
        suction: { position: [...wallAt(SUCTION.lo), 0.05], angle: SUCTION_CLOSED - OPEN * valveOpening(!j.pressing, vp) },
        delivery: { position: [-PIPE_W / 2, JUNCTION_Y - (BARREL.w - 0.06) / 2, 0.05], angle: Math.PI / 2 - OPEN_D * valveOpening(j.pressing, vp) },
      },
      flows,
      readouts:
        state === "release"
          ? [
              { label: "翼形螺絲", value: j.open < 1 ? `轉開中(閥開 ${Math.round(j.open * 100)}%)` : "閥全開,水流回底座" },
              { label: "液壓缸", value: j.rise > 0 ? `慢慢降下,還有 ${j.rise.toFixed(2)}` : "已降到底" },
            ]
          : [{ label: "液壓缸升起", value: j.rise.toFixed(2) }],
    };
  },
};
