// 第 468 種:撓性輸水幹管(平面圖與剖面圖)。兩條內徑 15 吋與 18 吋的管子,部分接頭做成這樣,把水送過克萊德河,
// 供應格拉斯哥自來水廠。管子固定在堅固的原木框架上,框架之間以帶水平樞軸的鉸鏈相連。框架與管子在南岸組好,
// 管子北端封堵後,用機械從北岸拖過河;它的撓性使它能順著河床的起伏。
// 主動件是虛擬的「拖曳」:管子被拖過河的進度。畫面是剖面(側視),左邊是南岸、右邊是北岸。
// 原圖只畫接頭的平面與剖面:模型照原文演整條管過河。推斷:河床的起伏(起伏的尺度比一節長);每節管子與框架是剛體,
// 節與節之間以水平銷鉸接;每節由接觸算——繞前一個鉸點往下擺到碰著河床為止(被拖的管子靠自重躺在河床上,
// 直的一節跨過凹處、擱在凸處上,不切進河床);接頭是套著兩邊管端的套筒,套筒兩側的耳軸就是框架的鉸銷;
// 相鄰兩節的框架一內一外交錯(像鏈條的內外鏈片),同一根耳軸穿過兩節的銷孔;北岸的絞盤(推斷)架高在岸上,
// 拖纜從管頭直接到絞盤,鼓上捲著收進來的纜,管頭拖到絞盤前面為止。
import { TAU, Z, clamp, routeRope, rot2 } from "./kit.js";
import { shape, stadium, arcPoints } from "./shapes.js";
import { swingUntilContact } from "./contact.js";

export const SEGMENT = 1.0; // 每節長
export const COUNT = 8;
export const PIPE_R = 0.14;
export const GAP = 0.08; // 管端離鉸點(接頭套筒套著這一段)
export const SLEEVE = { outer: 0.21, inner: 0.175, length: 0.26 }; // 接頭套筒(軸沿管):兩節夾 37° 時管端的邊緣離套筒內壁還有 0.017、離套筒口 0.01
const TRUNNION = { r: 0.05, from: 0.15, to: 0.47 }; // 套筒兩側的耳軸:從套筒壁伸出、穿過兩層框架的銷孔
const TIMBER = { width: 0.3, thick: 0.12, eye: 0.15, hole: 0.055 }; // 框架側木:兩端是繞鉸點的圓眼
const LAYER = [0.26, 0.4]; // 偶數節的側木在內層、奇數節在外層(z 的中心)
export const BOTTOM = 0.235; // 一節最低處(橫擔底)離鉸點;接頭套筒的角落離鉸點 0.247,兩節夾 37° 時它比這裡低 0.005(貼合誤差內)
const SADDLE = { w: 0.1, h: BOTTOM - PIPE_R }; // 把管子綁在框架上的橫擔(推斷)
const TOP = 0.15;
const NOSE = { r: 0.17, x0: -0.15, x1: -0.05 }; // 管頭的封堵(原文:北端封堵)

/** 河床(兩岸 y = 0):一個 6.4 寬、1.0 深的凹處,加上尺度比一節長的起伏;最陡處 30°,相鄰兩節的夾角不超過 37° */
const HALF = 3.2;
export const bed = (x) => {
  if (x <= -HALF || x >= HALF) return 0;
  const t = (x + HALF) / (2 * HALF);
  return -1.0 * Math.sin(Math.PI * t) ** 2 + 0.08 * Math.sin(Math.PI * t) * Math.sin(4 * Math.PI * t);
};
export const X0 = -12; // 南岸地面板的左端:拖曳開始時整條管都在南岸上
const X1 = 6.0;
const DEPTH = -2.2; // 地面板的底
const bankPoints = (() => {
  const pts = [[X0, 0]];
  for (let x = -HALF; x <= HALF + 1e-9; x += 0.05) pts.push([Number(x.toFixed(3)), bed(x)]);
  pts.push([X1, 0]);
  return pts;
})();
/** 地面板(河床與兩岸)的輪廓:由接觸算時當障礙物 */
export const BED_POLY = [...bankPoints, [X1, DEPTH], [X0, DEPTH]];

// 沿河床的弧長表:拖曳進度 → 管頭的位置
const STEP = 0.01;
const ARC = [{ x: X0, s: 0 }];
for (let x = X0; x < X1; x += STEP) {
  const last = ARC[ARC.length - 1];
  ARC.push({ x: x + STEP, s: last.s + Math.hypot(STEP, bed(x + STEP) - bed(x)) });
}
const xAt = (s0) => {
  const s = clamp(s0, 0, ARC[ARC.length - 1].s);
  let lo = 0;
  let hi = ARC.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ARC[mid].s < s) lo = mid;
    else hi = mid;
  }
  const a = ARC[lo];
  const b = ARC[hi];
  return a.x + ((b.x - a.x) * (s - a.s)) / (b.s - a.s || 1);
};
const sOf = (x) => ARC.find((p) => p.x >= x).s;
export const WINCH = { center: [4.0, 0.85, 0], radius: 0.3 }; // 北岸的絞盤:鼓架高在岸上,拖纜越過岸邊不碰河床
const ROPE_R = WINCH.radius + 0.03; // 纜心離鼓軸
const POSTS_X = WINCH.center[0] - 0.15; // 絞盤架的立柱
export const START = sOf(-3.6); // 管頭(北端)從南岸邊出發
export const END = sOf(POSTS_X - 0.2); // 管頭拖到絞盤架前面為止

/**
 * 一節在局部座標(鉸點在原點,+x 朝後一個鉸點)的接觸輪廓:橫擔底到後一個鉸點,後端是繞鉸點、半徑 BOTTOM 的圓
 * (蓋住接頭套筒與框架的圓眼)。前端 0.2 以內不算——那一段由前一節的後端圓蓋住(前一個鉸點的高度就是它擱出來的)
 */
export const SEG_OUTLINE = [[0.2, TOP], [0.2, -BOTTOM], ...arcPoints(BOTTOM, -Math.PI / 2, Math.PI / 2, SEGMENT, 0)];

/** 拖曳進度 u → 每個鉸點的位置(管頭在前)與每節的方向角(由接觸算:繞前一個鉸點往下擺到碰著河床) */
export function joints(u) {
  const xh = xAt(START + (END - START) * clamp(u, 0, 1));
  let ground = -Infinity;
  for (let x = xh - 0.2; x <= xh + 0.2 + 1e-9; x += 0.02) ground = Math.max(ground, bed(x));
  const pts = [[xh, ground + BOTTOM + 0.01, 0]];
  const angles = [];
  for (let k = 0; k < COUNT; k++) {
    const pivot = pts[k];
    // 從水平朝後開始往下擺(河床在後面升高時先退到離開再擺),停在後端碰著河床的角度
    const a = swingUntilContact({ pivot, outline: SEG_OUTLINE, from: Math.PI, into: 1, sweep: Math.PI / 2 + 0.3, steps: 60 }, [BED_POLY]);
    angles.push(a);
    pts.push([pivot[0] + SEGMENT * Math.cos(a), pivot[1] + SEGMENT * Math.sin(a), 0]);
  }
  return { pts, angles };
}

/** 管頭(封堵的前端面中心):拖纜繫在這裡 */
export const nose = ({ pts, angles }) => {
  const [dx, dy] = rot2([NOSE.x0, 0], angles[0]);
  return [pts[0][0] + dx, pts[0][1] + dy, 0];
};

/** 拖纜:從管頭直接到鼓的切點(straight),鼓上捲著的部分照收進的長度加圈(wound 是捲著的弧度) */
export function hawser(j) {
  const route = routeRope([{ point: nose(j) }, { circle: { center: WINCH.center, axis: Z, radius: ROPE_R, sense: -1 } }]);
  return { points: route.points, straight: route.length };
}
const REST = hawser(joints(0)).straight;
const COIL = { turns0: 2, pitch: 0.06, z0: -0.2 }; // 開始時鼓上已捲兩圈;每圈沿軸挪一個間距
/** 收進的纜長 → 鼓上捲著的弧度 */
export const wound = (hauled) => COIL.turns0 * TAU + hauled / ROPE_R;

const timber = (k, side) => ({
  kind: "plate",
  shape: stadium(SEGMENT, TIMBER.width, TIMBER.hole),
  thickness: TIMBER.thick,
  at: [0, 0, side * LAYER[k % 2]],
});
const saddle = (k, x) => ({ kind: "box", size: [SADDLE.w, SADDLE.h, 2 * (LAYER[k % 2] + TIMBER.thick / 2)], at: [x, -PIPE_R - SADDLE.h / 2, 0] });
const segmentPieces = (k) => [
  // 管子:兩端留在接頭套筒裡;管頭那一節往前多伸一段,前端封堵
  k === 0
    ? { kind: "cylinder", axis: [1, 0, 0], radius: PIPE_R, length: SEGMENT - GAP - NOSE.x1, at: [(NOSE.x1 + SEGMENT - GAP) / 2, 0, 0] }
    : { kind: "cylinder", axis: [1, 0, 0], radius: PIPE_R, length: SEGMENT - 2 * GAP, at: [SEGMENT / 2, 0, 0] },
  ...(k === 0 ? [{ kind: "cylinder", axis: [1, 0, 0], radius: NOSE.r, length: NOSE.x1 - NOSE.x0, at: [(NOSE.x0 + NOSE.x1) / 2, 0, 0] }] : []),
  timber(k, 1),
  timber(k, -1),
  saddle(k, 0.3),
  saddle(k, 0.7),
];

export default {
  figure: 468,
  parts: [
    {
      id: "river",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(BED_POLY), thickness: 1.6 },
        // 絞盤架(推斷):兩根立柱,頂上是鼓軸的軸承
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.3, WINCH.center[1] - 0.07, 0.12], at: [WINCH.center[0], (WINCH.center[1] - 0.07) / 2, s * 0.58] },
          { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.12, at: [WINCH.center[0], WINCH.center[1], s * 0.58] },
        ]),
      ],
    },
    { id: "water", kind: "fill", fluid: "water", center: [0, -0.7, 0], size: [2 * HALF, 1.0, 1.4], level: 0.93 },
    ...Array.from({ length: COUNT }, (_, k) => ({ id: `segment${k}`, kind: "group", arrow: false, pieces: segmentPieces(k) })),
    // 接頭:套著兩邊管端的套筒,兩側的耳軸穿過兩節框架的銷孔(k = 1…COUNT−1)
    ...Array.from({ length: COUNT - 1 }, (_, i) => ({
      id: `joint${i + 1}`,
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: SLEEVE.outer, inner: SLEEVE.inner, length: SLEEVE.length },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: TRUNNION.r, length: TRUNNION.to - TRUNNION.from, at: [0, 0, (s * (TRUNNION.from + TRUNNION.to)) / 2] })),
      ],
    })),
    {
      id: "winch",
      kind: "group",
      center: WINCH.center,
      spin: WINCH.radius + 0.1,
      spinOffset: 0.4,
      pieces: [
        { kind: "cylinder", radius: WINCH.radius, length: 0.7 },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: WINCH.radius + 0.06, length: 0.04, at: [0, 0, s * 0.37] })),
        { kind: "cylinder", radius: 0.05, length: 1.42, at: [0, 0, 0.07] },
        // 搖柄(原文「用機械拖」:推斷成手搖的絞盤)
        { kind: "box", size: [0.4, 0.08, 0.06], at: [0.17, 0, 0.75] },
        { kind: "cylinder", radius: 0.03, length: 0.24, at: [0.35, 0, 0.88] },
      ],
    },
    { id: "hawser", kind: "rope", radius: 0.025 },
  ],
  powered: ["hawser"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "拖曳", mode: "balance", range: [0, 1], initial: 0.45, format: (u) => Math.round(u * 100) + "%" },
  target: "segment0", // 管頭(北端)那一節:被拖過河、順著河床起伏
  view: { direction: [0.1, 0.12, 1] },
  pose(u) {
    const j = joints(u);
    const { pts, angles } = j;
    const parts = {};
    for (let k = 0; k < COUNT; k++) parts[`segment${k}`] = { position: pts[k], angle: angles[k] };
    for (let k = 1; k < COUNT; k++) parts[`joint${k}`] = { position: pts[k], angle: (angles[k - 1] + angles[k]) / 2 };
    const rope = hawser(j);
    const hauled = REST - rope.straight;
    const turns = wound(hauled);
    // 鼓上捲著的纜:從切點起順時針繞 turns,每圈沿軸挪一個間距
    const entry = rope.points[rope.points.length - 1];
    const a0 = Math.atan2(entry[1] - WINCH.center[1], entry[0] - WINCH.center[0]);
    const n = Math.max(2, Math.ceil((turns / TAU) * 24));
    const coil = Array.from({ length: n }, (_, i) => {
      const phi = (turns * (i + 1)) / n;
      return [WINCH.center[0] + ROPE_R * Math.cos(a0 - phi), WINCH.center[1] + ROPE_R * Math.sin(a0 - phi), COIL.z0 + (COIL.pitch * phi) / TAU];
    });
    parts.winch = { angle: -hauled / ROPE_R };
    const head = pts[0];
    return {
      parts,
      paths: { hawser: { points: [...rope.points, ...coil], closed: false, phase: 0 } },
      readouts: [
        { label: "管頭", value: head[0] < HALF ? "在河裡,順著河床前進" : "到北岸" },
        { label: "收進的纜", value: hauled.toFixed(2) },
      ],
    };
  },
};
