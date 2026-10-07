// 第 108 種:圓筒上切有右旋與左旋兩道螺旋溝,兩溝每一圈交叉兩次(菱形的網格)。
// 把一個尖點放進溝裡,圓筒均勻旋轉時,尖點(連同它在直立導桿上滑動的滑座)就從圓筒一端均勻地橫移到另一端,
// 到了端頭轉入反向的那道溝,再均勻地回來。主動件是圓筒(底部的齒輪驅動它)。
// 尖點的位置由溝壁推動(動力重演:滑座是沿直立導桿的自由滑塊)。穿過交會處時沒有溝壁帶著,
// 靠滑座原本的速度衝過去——重演裡不給滑座重量(原書沒有重量的資料;圓筒轉得快時尖點的慣性遠大於重量的影響)。
import { Y, TAU } from "./kit.js";
import { triangle } from "./groove-drum.js";

const R = 0.8;
const L = 2.6; // 溝的行程(圓筒長)
const TURNS = 3; // 尖點從一端到另一端,圓筒要轉的圈數
const PITCH = L / TURNS;
const POINT = Math.PI; // 尖點在圓筒的左側(局部角 180°)

/** 圓筒轉 θ:尖點(滑座)的高度 */
export const slideY = (theta) => triangle(POINT - theta, L / 2, 2 * TURNS * TAU);
export const pitch = PITCH;
export const travel = L;

// 兩道螺旋溝:右旋從下到上、左旋從上到下,各繞 TURNS 圈;以凸條畫出溝的兩側。
// 兩溝交會處實物是互相切通的:凸條落在另一道溝裡的那一段切掉(溝的兩端也因此連通,尖點在端頭轉入反向的溝)。
// 兩端各一圈擋環,尖點衝到端頭時被擋住,由反向那道溝的溝壁帶回來。
const HALF = 0.09; // 溝的半寬(凸條中心到溝中心)
const RIDGE = 0.035;
const PER_TURN = 48;
const grooveZ = (hand, a) => {
  // 這道溝在圓筒局部角 a 處經過的各個高度
  const base = (((hand * a) % TAU) + TAU) % TAU;
  return Array.from({ length: TURNS + 1 }, (_, m) => -L / 2 + (L * (base + m * TAU)) / (TURNS * TAU)).filter((z) => z <= L / 2 + 1e-9);
};
const inGroove = (hand, a, z) => grooveZ(hand, a).some((zc) => Math.abs(z - zc) < HALF + RIDGE + 0.01);
const helixRidges = (hand, offset) => {
  const runs = [[]];
  for (let i = 0; i <= TURNS * PER_TURN; i++) {
    const phi = (i / PER_TURN) * TAU;
    const z = -L / 2 + (L * i) / (TURNS * PER_TURN) + offset;
    const a = hand * phi;
    if (inGroove(-hand, a, z) || Math.abs(z) > L / 2 + HALF) {
      if (runs.at(-1).length) runs.push([]);
      continue;
    }
    runs.at(-1).push([(R + 0.02) * Math.cos(a), (R + 0.02) * Math.sin(a), z]);
  }
  return runs.filter((run) => run.length >= 2);
};
const ring = (z) => Array.from({ length: 49 }, (_, i) => [(R + 0.02) * Math.cos((i / 48) * TAU), (R + 0.02) * Math.sin((i / 48) * TAU), z]);
const ridges = [
  ...[1, -1].flatMap((hand) => [HALF, -HALF].flatMap((d) => helixRidges(hand, d))),
  ring(L / 2 + HALF + 0.02),
  ring(-L / 2 - HALF - 0.02),
].map((points) => ({ kind: "tube", points, radius: RIDGE }));

export default {
  figure: 108,
  parts: [
    {
      id: "drum",
      kind: "group",
      axis: Y,
      center: [0.6, 0, 0],
      spin: R,
      spinOffset: L / 2 + 0.3,
      pieces: [
        { kind: "cylinder", radius: R, length: L + 0.3, mark: true },
        ...ridges,
        { kind: "cylinder", radius: 0.1, length: L + 1.6 },
        { kind: "gear", teeth: 32, radius: 1.2, width: 0.14, web: false, at: [0, 0, -L / 2 - 0.35] },
      ],
    },
    {
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.35, 0.3, 0.4], at: [-1.35, 0, 0] },
        { kind: "plate", shape: { outline: [[-1.18, 0.07], [0.6 - R - 0.02, 0.0], [-1.18, -0.07]], holes: [] }, thickness: 0.1 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.08, length: L + 1.5, at: [-1.35, 0, 0] },
        { kind: "box", size: [2.6, 0.22, 0.5], at: [-0.2, L / 2 + 0.55, 0] },
        { kind: "box", size: [2.6, 0.22, 0.5], at: [-0.2, -L / 2 - 0.75, 0] },
      ],
    },
  ],
  driver: { part: "drum", type: "rotation", speed: 1.2 },
  target: "slide", // 均勻來回橫移的滑座
  replay: {
    free: { slide: { slide: [0, 1, 0], gravity: false } },
    ignore: [["slide", "frame"]], // 滑座套在直立導桿上(孔沒畫出來,滑座畫成實心的方塊)
    to: POINT + 2 * TURNS * TAU,
    seconds: 30,
    expect: [
      { at: POINT, part: "slide", label: "尖點走到下端" },
      { at: POINT + TURNS * TAU, part: "slide", label: "在下端轉入反向的溝,穿過交會處,走到上端", quote: "將一個點放入該溝槽中,就會使其從圓筒的一端橫移至另一端" },
      { part: "slide", label: "在上端轉入反向的溝,走回下端" },
    ],
  },
  view: { direction: [0.08, 0.1, 1] },
  waivers: [
    {
      check: "replay",
      parts: ["slide"],
      reason:
        "交會處沒有溝壁帶著尖點:原文放進溝裡的是「一個點」,實物要靠尖點的慣性衝過兩溝的交會處(不然就得改用能擺動的梭形從動件,原文與原圖都沒有)。" +
        "重演不比快慢,照預設速度推,滑座的動量不夠衝過交會處,被另一道溝帶走;把圓筒轉快(6 秒走完)尖點又在溝裡亂跳。溝的交會處切通、兩端加擋環都已照實物做了,停位對不上是這個限制",
    },
  ],
  pose(theta) {
    return { parts: { drum: { angle: theta }, slide: { position: [0, slideY(theta), 0] } }, readouts: [] };
  },
};
