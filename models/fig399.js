// 第 399 種:修理鏈條、或把當拉索與支柱用的鏈條拉緊的方法。這個鏈節由兩半做成,每一半的一端有旋轉螺帽、另一端有螺絲,
// 每一半的螺絲旋進另一半的螺帽裡。轉動兩個螺帽,兩半就互相拉近(把鏈條拉緊)或推開。
// 推斷:這是一個靜止的器具,模型重現它被使用時的動作(轉螺帽把鏈節收緊);螺距與可調的長度。
//
// 2026-10-07 複查:原本主動件是上半的平移(往下拉等於轉螺帽),螺帽不會轉;改成以上半的旋轉螺帽為主動件,
// 兩個螺帽都看得出轉向。兩根螺絲並排拉著兩半,一根拉近、另一根也得拉近同樣的量,所以兩個螺帽要一起轉
// (操作的人兩個一起轉;模型讓下半的螺帽照同樣的圈數轉——推斷)。兩半每轉一圈共拉近一個螺距,各移半個螺距
// (原本算成各移一個螺距)。
//
// 2026-10-20(model-audit-fixes-3 票 42):旋轉螺帽照原圖改成套在側桿上的長圓環(原本是夾在兩片耳之間的六角螺帽,
// 下片耳懸空;收到底時螺絲穿進另一半實心的側桿 0.8)。原圖左右兩側各一個長圓環,環裡上面一塊、下面一塊:
// 上半在左側的側桿以頸穿過左環上端的孔,頸下的端頭(比孔粗)留在環裡,環可以繞頸轉、拉不脫;下半在左側的螺絲
// (打斜線)從下端的螺孔旋進環裡。右側的環同理,屬於下半。所以每一半是「一側的側桿接旋轉螺帽、另一側接螺絲」。
// 鏈條受拉時端頭頂著環端的內面。螺絲收緊的行程收在環裡:收到底時端頭離另一半的端頭還有一段,側桿也碰不到環。
// 收緊的範圍改成螺帽轉 6 圈(原本 10 圈,環裡放不下那麼長的行程);頸、端頭的粗細與環的尺寸照原圖比例取(推斷)。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

export const PITCH = 0.12;
export const RANGE = [0, 6 * TAU];
const W = 0.75; // 鏈節半寬(兩根側桿中心的距離的一半)
const BAR = 0.22; // 鏈節的桿粗
const LEG = 0.28; // 側桿從彎頭到下端的長度(原圖彎頭到環頂很短)
// 旋轉螺帽(長圓環):外形寬 RING_W、高 RING_H,環的桿粗 RING_T(兩端的橫條就是這麼厚),環板厚 RING_Z
const RING_W = 0.8;
const RING_H = 1.6;
const RING_T = 0.16;
const RING_Z = 0.22;
const RING_GAP = 0.03; // 側桿下端到環頂的間隙
const NECK = 0.07; // 頸的半徑(穿過環上端的孔)
const HEAD = 0.17; // 端頭的半徑
const HEAD_H = 0.1;
const SCREW = 0.09; // 螺絲的半徑
const SCREW_L = 1.18;
const REST = 1.21; // 收緊前兩半各離中心多遠

/** 螺帽轉 a → 兩半拉近的總量(兩根螺絲並排,每轉一圈一個螺距) */
export const tighten = (a) => screwAdvance(clamp(a, ...RANGE), PITCH);

// 圓角矩形(逆時針),寬 w、高 h、圓角 r
function roundedRect(w, h, r) {
  const [x, y] = [w / 2 - r, h / 2 - r];
  return [
    ...arcPoints(r, -Math.PI / 2, 0, x, -y),
    ...arcPoints(r, 0, Math.PI / 2, x, y),
    ...arcPoints(r, Math.PI / 2, Math.PI, -x, y),
    ...arcPoints(r, Math.PI, (3 * Math.PI) / 2, -x, -y),
  ];
}

// 半個鏈節(局部:彎頭朝上,側桿下端在 y = 0):彎頭、兩根側桿;左側桿下接頸與端頭(套著旋轉螺帽),右側桿下接螺絲
const HEAD_TOP = -(RING_GAP + RING_T); // 端頭頂面 = 環上端橫條的內面(鏈條受拉時頂著)
const half = [
  { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (i / 12); return [W * Math.cos(t), LEG + W * Math.sin(t)]; }), BAR)), thickness: BAR },
  { kind: "box", role: "leg", size: [BAR, LEG, BAR], at: [-W, LEG / 2, 0] },
  { kind: "box", role: "leg", size: [BAR, LEG, BAR], at: [W, LEG / 2, 0] },
  { kind: "cylinder", role: "neck", axis: Y, radius: NECK, length: -HEAD_TOP, at: [-W, HEAD_TOP / 2, 0] },
  { kind: "cylinder", role: "head", axis: Y, radius: HEAD, length: HEAD_H, at: [-W, HEAD_TOP - HEAD_H / 2, 0] },
  { kind: "worm", role: "screw", axis: Y, radius: SCREW, length: SCREW_L, pitch: PITCH, thread: 0.03, at: [W, -SCREW_L / 2, 0] },
];
// 旋轉螺帽:長圓環,繞 y 轉(環在 xy 平面;板件的法線沿群組局部 y,也就是世界的 z)。記號在一側的環桿上
const swivel = (id) => ({
  id,
  kind: "group",
  axis: Y,
  spin: 0.55,
  pieces: [
    { kind: "plate", role: "ring", axis: [0, 1, 0], shape: shape(roundedRect(RING_W, RING_H, 0.22), [roundedRect(RING_W - 2 * RING_T, RING_H - 2 * RING_T, 0.06).reverse()]), thickness: RING_Z },
    { kind: "box", size: [0.04, RING_Z + 0.02, 0.3], at: [RING_W / 2 - RING_T / 2, 0, 0], accent: true },
  ],
});

export default {
  figure: 399,
  parts: [
    { id: "upper", kind: "group", arrow: false, pieces: half },
    // 下半是上半轉半圈:它的螺絲在左邊、旋進上半的環,它的環在右邊、上半的螺絲旋進來
    { id: "lower", kind: "group", arrow: false, pieces: half },
    swivel("nutU"),
    swivel("nutL"),
  ],
  driver: { part: "nutU", type: "rotation", range: RANGE, initial: 0 },
  target: "lower", // 鏈節的另一半:被螺帽拉近
  view: { direction: [0.08, 0.05, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const d = tighten(a) / 2; // 兩半各移一半
    const yu = REST - d;
    const yl = -REST + d;
    const ring = RING_GAP + RING_H / 2; // 環心在側桿下端之下多遠
    return {
      parts: {
        upper: { position: [0, yu, 0] },
        lower: { position: [0, yl, 0], rotation: [0, 0, 1, 0] },
        nutU: { position: [-W, yu - ring, 0], angle: a },
        nutL: { position: [W, yl + ring, 0], angle: -a },
      },
      readouts: [],
    };
  },
};
