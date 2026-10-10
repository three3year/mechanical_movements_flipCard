// 第 244 種:測功計(普朗尼制動器)。平滑的皮帶輪 A 裝在動力源的軸上;上方一塊木塊、下方一串木塊繫在帶上,
// 由槓桿 D 頂部的螺絲與螺帽夾緊在輪上。槓桿 D 的末端掛秤盤 B,放入砝碼;兩個擋止 C、C' 把槓桿限制在水平附近。
// 主動件是軸(輪 A 照箭頭方向轉,木塊與條板在輪面上滑)。狀態按鈕是螺絲夾得太鬆、剛好、太緊:
// 太鬆時摩擦不夠,槓桿被砝碼拉下靠在擋止 C 上;太緊時槓桿被帶上去頂住 C';剛好時槓桿停在水平位置(原圖)。
// 原文只描述軸照圖示方向運轉時的調整;反轉時槓桿會被帶往另一邊,這裡不演出,狀態按鈕旁的說明(states.note)與讀數都寫明「軸照箭頭方向轉」。
// 下方照 507movements 的 525 px 原圖:一條用銷鉸接的鏈,內側繫著一段段木條(條板),從輪的左側包到右側;
// 兩根螺栓從槓桿頂上的螺帽往下,在上方木塊的左右兩側(輪外)穿過鏈兩端的耳,下面用螺帽鎖住。
// 推斷:三種夾緊程度的狀態(原文說鎖緊螺絲、加砝碼,直到槓桿呈現圖中的位置);軸後面的軸承座、托著兩個擋止的立柱與底板;
// 鏈的節數與耳、螺帽的尺寸。
import { deg, rot2 } from "./kit.js";
import { shape, rect, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const DRUM = 0.75;
const PIVOT = [-2.1, -0.15, 0]; // 輪 A 的軸心(槓桿繞它擺)
const ARM = 4.4; // 槓桿從軸心到掛秤盤處的長度
const TILT = deg(4.5); // 碰到擋止時槓桿的傾角
const PAN_DROP = 2.1;
export const TILTS = { loose: -TILT, right: 0, tight: TILT };
const FLOOR = PIVOT[1] - 3.8; // 軸承座與擋止立柱的底板頂面
const POST_TOP = PIVOT[1] + 0.95 + 0.56 + 0.1; // 立柱頂:上面那個擋止的托臂上緣

// ── 夾在輪上的制動器(槓桿的局部座標,原點是輪 A 的軸心;整組跟著槓桿擺) ──
const SHOE_GAP = 0.01; // 木塊、條板與輪面之間(貼著輪面)
const LEVER_Y = [0.83, 1.07]; // 槓桿 D 的下緣、上緣
const CHAIN_R = DRUM + 0.22; // 鏈的節線(銷的中心)半徑
const LINKS = 7; // 鏈包住輪的下半圈:七節、八根銷
const LUG_Y = 0.36; // 鏈兩端的耳的高度(在輪軸心之上、上方木塊之下)
const BOLT = { x: CHAIN_R + 0.17, r: 0.05 };
const LEVER_X = [-(BOLT.x + 0.3), ARM + 0.25]; // 槓桿往左伸過左邊的螺栓
const NUT = 0.1; // 螺帽的高度
const pins = Array.from({ length: LINKS + 1 }, (_, i) => rot2([CHAIN_R, 0], Math.PI + (i * Math.PI) / LINKS));
// 上方木塊:橫跨在兩根螺栓之間,底面挖成貼著輪頂的凹弧
const blockHalf = BOLT.x - BOLT.r - 0.2;
const blockFoot = Math.asin(LUG_Y / (DRUM + SHOE_GAP));
const block = [
  [-blockHalf, LEVER_Y[0]], [-blockHalf, LUG_Y],
  ...arcPoints(DRUM + SHOE_GAP, Math.PI - blockFoot, blockFoot),
  [blockHalf, LUG_Y], [blockHalf, LEVER_Y[0]],
];
// 條板:每一節鏈的內側一根,貼著輪的下半圈
const strapGap = deg(1.5);
const straps = pins.slice(1).map((_, i) => {
  const a0 = Math.PI + (i * Math.PI) / LINKS + strapGap;
  const a1 = Math.PI + ((i + 1) * Math.PI) / LINKS - strapGap;
  return [...arcPoints(DRUM + SHOE_GAP, a0, a1), ...arcPoints(CHAIN_R - 0.05, a1, a0)];
});
const lugs = [-1, 1].map((s) => {
  const [x0, x1] = [s * (CHAIN_R - 0.05), s * (BOLT.x + 0.17)].sort((a, b) => a - b);
  return { x0, x1, y0: LUG_Y - 0.05, y1: LUG_Y + 0.05 };
});
const bolts = [-1, 1].map((s) => ({
  x: s * BOLT.x,
  r: BOLT.r,
  y0: LUG_Y - 0.05 - NUT - 0.04,
  y1: LEVER_Y[1] + NUT + 0.06,
  nutBelow: [LUG_Y - 0.05 - NUT, LUG_Y - 0.05],
  nutAbove: [LEVER_Y[1], LEVER_Y[1] + NUT],
}));
/** 制動器的外形(測試用):上方木塊、條板、鏈的銷、耳、螺栓與螺帽、槓桿的範圍 */
export const brake = { drum: DRUM, block, straps, pins, lugs, bolts, lever: { x0: LEVER_X[0], x1: LEVER_X[1], y0: LEVER_Y[0], y1: LEVER_Y[1] } };

const lever = shape(rect(LEVER_X[1] - LEVER_X[0], LEVER_Y[1] - LEVER_Y[0], (LEVER_X[0] + LEVER_X[1]) / 2, (LEVER_Y[0] + LEVER_Y[1]) / 2), []);
const brakePieces = [
  { kind: "plate", shape: shape(block), thickness: 0.56 },
  ...straps.map((outline) => ({ kind: "plate", shape: shape(outline), thickness: 0.46 })),
  // 鏈:每一節是一片鏈板,兩端套在銷上
  ...pins.slice(1).map((b, i) => {
    const a = pins[i];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { kind: "box", size: [Math.hypot(b[0] - a[0], b[1] - a[1]), 0.1, 0.3], at: [mid[0], mid[1], 0], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }),
  ...pins.map(([x, y]) => ({ kind: "cylinder", radius: 0.045, length: 0.4, at: [x, y, 0] })),
  // 鏈的兩端各往上一節,接到耳
  ...[-1, 1].map((s) => ({ kind: "box", size: [0.1, LUG_Y + 0.05, 0.3], at: [s * CHAIN_R, (LUG_Y + 0.05) / 2, 0] })),
  ...lugs.map((l) => ({ kind: "box", size: [l.x1 - l.x0, l.y1 - l.y0, 0.3], at: [(l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2, 0] })),
  // 螺栓穿過耳與槓桿,兩頭用螺帽鎖住
  ...bolts.flatMap((b) => [
    { kind: "cylinder", axis: [0, 1, 0], radius: b.r, length: b.y1 - b.y0, at: [b.x, (b.y0 + b.y1) / 2, 0] },
    { kind: "box", size: [0.18, NUT, 0.18], at: [b.x, (b.nutBelow[0] + b.nutBelow[1]) / 2, 0] },
    { kind: "box", size: [0.2, NUT, 0.2], at: [b.x, (b.nutAbove[0] + b.nutAbove[1]) / 2, 0] },
  ]),
];

const LEVER_TEXT = { loose: "太鬆:被砝碼拉下,靠在 C", right: "剛好:停在水平位置", tight: "太緊:被帶上去,頂住 C'" };

export default {
  figure: 244,
  parts: [
    {
      id: "drumA",
      kind: "pulley",
      style: "disc",
      center: PIVOT,
      radius: DRUM,
      width: 0.5,
      label: "A",
      labelOffset: [-0.15, -0.05, 0.6],
      spinOffset: 0.42, // 轉向箭頭放在制動器前面(輪頂被上方木塊與槓桿圍住);狀態說明的「軸照箭頭方向轉」指它
      pieces: [{ kind: "cylinder", radius: 0.14, length: 2.2, at: [0, 0, -0.4] }],
    },
    {
      id: "leverD",
      kind: "group",
      center: PIVOT,
      arrow: false,
      label: "D",
      labelOffset: [2.0, 1.25, 0.3],
      pieces: [
        { kind: "plate", shape: lever, thickness: 0.3 },
        // 上方木塊、鏈與條板、兩根夾緊螺栓
        ...brakePieces,
        // 掛秤盤的環
        { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.1, axis: [1, 0, 0], at: [ARM, 0.75, 0] },
      ],
    },
    {
      id: "stops",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.42, 0.26, 0.3], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 + 0.56, 0] },
        { kind: "box", size: [0.42, 0.26, 0.3], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 - 0.56, 0] },
        // 托著兩個擋止的立柱(在槓桿後面)與底板:立柱從底板一直立到上面那個擋止的托臂
        { kind: "box", size: [0.2, POST_TOP - FLOOR, 0.2], at: [PIVOT[0] + ARM - 1.05, (POST_TOP + FLOOR) / 2, -0.4] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 + 0.56, -0.22] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.95 - 0.56, -0.22] },
        { kind: "box", size: [1.0, 0.18, 0.8], at: [PIVOT[0] + ARM - 1.05, FLOOR - 0.09, -0.4] },
        // 皮帶輪 A 的軸往後伸進軸承座
        ...pedestal({ at: [PIVOT[0], PIVOT[1]], z: -0.9, bore: 0.14, floor: FLOOR }),
      ],
    },
    { id: "labelC1", kind: "group", center: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 1.38, 0], label: "C'", labelOffset: [0.5, 0.05, 0.2] },
    { id: "labelC", kind: "group", center: [PIVOT[0] + ARM - 1.05, PIVOT[1] + 0.52, 0], label: "C", labelOffset: [0.5, -0.05, 0.2] },
    { id: "pan", kind: "group", label: "B", labelOffset: [0, 0.55, 0.6], pieces: [
      { kind: "box", size: [1.6, 0.08, 1.0], at: [0, 0, 0] },
      { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, length: 0.3, at: [-0.15, 0.19, 0] },
      { kind: "box", size: [0.3, 0.22, 0.3], at: [0.35, 0.15, 0] },
    ] },
    ...[0, 1, 2, 3].map((i) => ({ id: `string${i}`, kind: "rod", radius: 0.012 })),
  ],
  driver: { part: "drumA", type: "rotation" },
  target: "leverD",
  states: {
    initial: "right",
    note: "軸照箭頭方向轉", // 顯示在狀態按鈕旁:三個狀態都是軸照圖示方向轉時的調整
    options: [
      { id: "loose", label: "夾得太鬆" },
      { id: "right", label: "剛好" },
      { id: "tight", label: "夾得太緊" },
    ],
  },
  view: { direction: [0.05, 0.12, 1] },
  pose(angle, state = "right") {
    const tilt = TILTS[state];
    const [hx, hy] = rot2([ARM, 0.75], tilt);
    const hook = [PIVOT[0] + hx, PIVOT[1] + hy, 0];
    const pan = [hook[0], hook[1] - PAN_DROP, 0];
    const corners = [[-0.75, -0.45], [0.75, -0.45], [0.75, 0.45], [-0.75, 0.45]];
    // 吊繩繫在環的下緣(環外面),往下分到秤盤的四角
    const [tx, ty] = rot2([ARM, 0.75 - 0.115], tilt);
    const tie = [PIVOT[0] + tx, PIVOT[1] + ty, 0];
    const paths = {};
    corners.forEach(([x, z], i) => (paths[`string${i}`] = { points: [tie, [pan[0] + x, pan[1] + 0.04, z]], closed: false }));
    return { parts: { drumA: { angle }, leverD: { angle: tilt }, pan: { position: pan } }, paths, readouts: [{ label: "槓桿 D(軸照箭頭方向轉)", value: LEVER_TEXT[state] }] };
  },
};
