// 第 171 種:擺動式船舶引擎的閥門運動與換向機構。上方曲柄軸上的兩個偏心輪,偏心桿往下接到開槽連桿的兩端
// (與機車頭的連桿運動相同,見第 185 種);連桿可用左邊的柄左右移動。槽中的滑塊接著往下的閥桿,
// 閥桿帶動樞軸(trunnion)上方的曲面滑塊;曲面滑塊的溝槽裡有一根銷,接在搖臂軸的搖臂上,搖臂軸再把運動傳給閥門。
// 主動件是曲柄軸;連桿的位置是狀態(前進、中位、後退,原機構由司機扳動換向桿切換)。
// 偏心桿的上端是套在偏心輪外面的偏心環(原圖:兩個偏心輪外各有一圈),不是接在偏心輪的中心,所以曲柄軸可以整根穿過兩個偏心輪。
//
// 下半部(原文的重點):汽缸以樞軸裝在機架的軸承上,活塞桿直接接曲柄,所以曲柄軸每轉一圈汽缸來回擺一次。
// 搖臂軸裝在汽缸上、跟著汽缸繞樞軸擺;它前面的搖臂末端的銷插在曲面滑塊的溝槽裡。溝槽是以樞軸中心為圓心的圓弧,
// 汽缸擺動時銷只是沿著溝槽滑,離樞軸的距離不變,搖臂(和閥門)不動;只有曲面滑塊被閥桿推上推下時,
// 銷才被推著沿半徑方向走,搖臂軸轉動,後面的搖臂經十字頭推動汽缸側面閥箱裡的閥門。
// 推斷(原圖沒畫):汽缸、活塞、活塞桿、曲柄(擺動式引擎的汽缸由曲柄帶著擺,第 344 種)、樞軸的前後兩個軸承座與底座、
// 汽缸側面的閥箱(前面開口,看得到閥門)與閥門、搖臂軸的軸承架(裝在閥箱上)、後面的搖臂與閥桿的十字頭、
// 閥桿穿過的導套(橫樑架在兩根立柱之間)。曲面滑塊兩端的套筒套在兩根立柱上上下滑(原圖:兩端的方塊套在立柱上)。
import { deg, polar, TAU } from "./kit.js";
import { linkMotion, eccentricStrap } from "./link-motion.js";
import { oscillating } from "./oscillating.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [0, 3.4, 0];
const ECC = 0.3;
const DISC_R = 0.62; // 偏心輪半徑
const DISC_Z = [0.25, 0.72]; // 兩個偏心輪(A 在後、B 在前)的深度;連桿在兩者之間
const ROD = 3.2;
const HALF = 0.85;
const motion = linkMotion({ shaft: SHAFT, dir: [0, -1, 0], ecc: ECC, rod: ROD, half: HALF, leads: [deg(110), deg(-110)] });
const SHIFT = { forward: -HALF * 0.7, mid: 0, backward: HALF * 0.7 }; // 全程時滑塊離連桿端頭留一點距離(不碰偏心桿端頭的銷)

const VALVE_ROD = 1.1; // 連桿槽中的滑塊到曲面滑塊頂上的眼
export const ARC_R = 1.1; // 曲面滑塊溝槽的半徑
const EYE = ARC_R + 0.33; // 眼離溝槽圓心的高度
// 前進時滑塊行程的中點:此時溝槽的圓心正好在樞軸中心
const Y0 = (() => {
  const ys = Array.from({ length: 360 }, (_, i) => motion((TAU * i) / 360, SHIFT.forward).block[1]);
  return (Math.max(...ys) + Math.min(...ys)) / 2;
})();
export const TRUNNION = [0, Y0 - VALVE_ROD - EYE, 0];

// 汽缸(在閥動機構後面),以樞軸為中心擺動;曲柄在曲柄軸的後端,和汽缸同一層
const ZC = -1.3; // 汽缸、活塞桿、曲柄銷的深度
const CYL = { length: 2.5, radius: 0.75, offset: 0 };
const CRANK_R = 1.0;
const PISTON_ROD = Math.hypot(SHAFT[0] - TRUNNION[0], SHAFT[1] - TRUNNION[1]); // 活塞在行程中點時恰在樞軸處
const engine = oscillating({ trunnion: TRUNNION, crank: SHAFT, r: CRANK_R, cyl: CYL, rod: PISTON_ROD });

// 搖臂軸在汽缸上的位置(汽缸座標:原點在樞軸,+Y 沿汽缸軸指向曲柄)。前面的搖臂水平往右,銷在溝槽頂上;
// 搖臂軸在立柱外側(立柱在 x = ±1.45,搖臂軸隨汽缸擺動時不碰立柱與套筒)
const ARM = 2.0; // 前面搖臂的長度
export const ROCK = [-ARM, ARC_R]; // 搖臂軸
const BACK_ARM = 0.975; // 後面搖臂的長度(末端在閥桿的十字頭上)
const VALVE_X = ROCK[0] + BACK_ARM; // 閥桿(汽缸座標)
const CHEST_Y = -0.45; // 閥箱中心(汽缸座標;在曲面滑塊下方,從前面看得到)
const POST_X = 1.45;
const GUIDE_Y = -0.35; // 閥桿導套的高度(閥桿上下行程中始終穿過它)
const BASE_Y = TRUNNION[1] - 1.6; // 底座頂面

const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const world = (p, phi, z = 0) => {
  const [x, y] = rot(p, phi);
  return [TRUNNION[0] + x, TRUNNION[1] + y, z];
};

/**
 * 溝槽圓心比樞軸高 d、汽缸擺了 phi:搖臂軸相對汽缸轉的角度(銷要在溝槽上)。
 * 汽缸座標裡,銷 = 搖臂軸 + ARM·(cos, sin)α,要離溝槽圓心 ARC_R。
 */
export function rockAngle(d, phi) {
  const c = rot([0, d], -phi); // 溝槽圓心(汽缸座標)
  const g = (a) => Math.hypot(ROCK[0] + ARM * Math.cos(a) - c[0], ROCK[1] + ARM * Math.sin(a) - c[1]) - ARC_R;
  let lo = -0.6;
  let hi = 0.6;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (g(m) < 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** 軸轉 theta、連桿在 state:連桿運動、曲面滑塊的升降 d、汽缸擺角、搖臂軸轉角、閥門位移 */
export function valveGear(theta, state) {
  const g = motion(theta, SHIFT[state]);
  const blockY = g.block[1];
  const d = blockY - Y0; // 曲面滑塊(溝槽圓心)比樞軸高多少
  const e = engine.at(theta - Math.PI / 2); // 曲柄在曲柄軸上朝下(和偏心輪的角度一致)
  const phi = e.swing - Math.PI / 2; // 汽缸擺角(0:汽缸直立)
  const armAngle = rockAngle(d, phi);
  const valve = BACK_ARM * Math.sin(armAngle); // 閥門沿汽缸軸的位移
  const pin = world([ROCK[0] + ARM * Math.cos(armAngle), ROCK[1] + ARM * Math.sin(armAngle)], phi);
  return { g, blockY, d, phi, armAngle, valve, pin, piston: e.piston, crankPin: e.pin };
}
export const states = Object.keys(SHIFT);

// 連桿畫成直的(原圖略彎):滑塊的位置是在連桿兩端之間直線內插的,槽是直的才對得上。
// 偏心桿端頭的銷只頂到連桿的板面(連桿的升降是近似算的,兩端的距離會略變,銷不穿進板裡)
const linkShape = shape(
  [[-HALF - 0.2, -0.16], [HALF + 0.2, -0.16], [HALF + 0.2, 0.16], [-HALF - 0.2, 0.16]],
  [[[-0.78, -0.06], [0.78, -0.06], [0.78, 0.06], [-0.78, 0.06]].reverse()],
);
// 曲面滑塊:拱形板,溝槽以圓心(行程中點時就是樞軸中心)為圓心
const arcShape = shape(
  [...arcPoints(ARC_R + 0.2, deg(20), deg(160)), ...arcPoints(ARC_R - 0.2, deg(160), deg(20))],
  [[...arcPoints(ARC_R + 0.075, deg(35), deg(145)), ...arcPoints(ARC_R - 0.075, deg(145), deg(35))].reverse()],
);
const SLIDE_Z = 0.225; // 曲面滑塊與立柱的深度(板厚 0.15)
// 套在立柱上的套筒(四面圍住立柱),side = ±1
const sleeve = (side) => [
  { kind: "box", size: [0.38, 0.5, 0.15], at: [side * 1.19, 0.37, SLIDE_Z] }, // 拱的末端接到套筒
  { kind: "box", size: [0.1, 0.5, 0.21], at: [side * (POST_X - 0.12), 0.37, SLIDE_Z] },
  { kind: "box", size: [0.1, 0.5, 0.21], at: [side * (POST_X + 0.12), 0.37, SLIDE_Z] },
  { kind: "box", size: [0.34, 0.5, 0.04], at: [side * POST_X, 0.37, SLIDE_Z + 0.085] },
  { kind: "box", size: [0.34, 0.5, 0.04], at: [side * POST_X, 0.37, SLIDE_Z - 0.085] },
];
// 閥門的十字頭:橫的長槽讓搖臂末端的銷左右滑(搖臂擺動時銷略為左右移)
const crosshead = shape(
  [[-0.15, -0.13], [0.15, -0.13], [0.15, 0.13], [-0.15, 0.13]],
  [[[-0.09, -0.065], [0.09, -0.065], [0.09, 0.065], [-0.09, 0.065]].reverse()],
);

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 171,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: 0.8,
      pieces: [
        { kind: "cylinder", radius: 0.22, length: 2.15, at: [0, 0, -0.075], mark: true }, // 曲柄軸整根穿過兩個偏心輪,往後伸到曲柄
        { kind: "plate", shape: shape(circle(DISC_R, ...polar(ECC, deg(110) - Math.PI / 2).slice(0, 2)), [circle(0.22).reverse()]), thickness: 0.18, at: [0, 0, DISC_Z[0]] },
        { kind: "plate", shape: shape(circle(DISC_R, ...polar(ECC, deg(-110) - Math.PI / 2).slice(0, 2)), [circle(0.22).reverse()]), thickness: 0.18, at: [0, 0, DISC_Z[1]] },
        // 推斷:曲柄(朝下,和偏心輪同一根軸),曲柄銷往後伸到活塞桿那一層
        { kind: "box", size: [0.36, CRANK_R + 0.2, 0.12], at: [0, -CRANK_R / 2, ZC + 0.3] },
        { kind: "cylinder", radius: 0.08, length: 0.42, at: [0, -CRANK_R, ZC + 0.12] },
      ],
    },
    eccentricStrap({ id: "rodA", disc: DISC_R, rod: ROD, pinZ: 0.45 - DISC_Z[0] - 0.1 - 0.01 }), // 銷從環的那一層往前頂到連桿的背面
    eccentricStrap({ id: "rodB", disc: DISC_R, rod: ROD, pinZ: 0.57 - DISC_Z[1] + 0.1 + 0.01 }), // 銷往後頂到連桿的正面
    { id: "link", kind: "group", posed: true, arrow: false, pieces: [{ kind: "plate", shape: linkShape, thickness: 0.12 }] },
    {
      // 閥桿與曲面滑塊:局部原點在溝槽的圓心。閥桿下端的眼用銷接在滑塊頂上(兩者都只上下移動)
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "plate", shape: arcShape, thickness: 0.15, at: [0, 0, SLIDE_Z] },
        { kind: "plate", shape: shape(circle(0.16), [circle(0.06).reverse()]), thickness: 0.15, at: [0, EYE, SLIDE_Z] },
        { kind: "cylinder", radius: 0.06, length: 0.22, at: [0, EYE, SLIDE_Z + 0.02] },
        { kind: "box", size: [0.1, VALVE_ROD - 0.1, 0.08], at: [0, EYE + 0.1 + (VALVE_ROD - 0.1) / 2, 0.27] },
        { kind: "cylinder", radius: 0.055, length: 0.29, at: [0, EYE + VALVE_ROD, 0.435] }, // 滑塊畫成一根在連桿槽裡滑的銷,從閥桿往前穿過連桿的槽(閥桿在連桿後面)
        ...sleeve(-1),
        ...sleeve(1),
      ],
    },
    {
      // 汽缸與它的兩根樞軸(前後各一根短軸),繞樞軸中心擺動;局部原點在樞軸中心、+Y 沿汽缸軸
      id: "cylinder",
      kind: "group",
      center: TRUNNION,
      arrow: false,
      pieces: [
        {
          kind: "lathe",
          axis: [0, 1, 0],
          at: [0, 0, ZC],
          profile: [[0.12, CYL.length / 2 + 0.12], [CYL.radius + 0.1, CYL.length / 2 + 0.12], [CYL.radius + 0.1, -CYL.length / 2 - 0.12], [0.12, -CYL.length / 2 - 0.12], [0.12, -CYL.length / 2], [CYL.radius, -CYL.length / 2], [CYL.radius, CYL.length / 2], [0.12, CYL.length / 2]],
        },
        { kind: "cylinder", radius: 0.24, length: 0.82, at: [0, 0, -0.09], mark: true }, // 前面的樞軸,伸進曲面滑塊的拱下
        { kind: "cylinder", radius: 0.24, length: 0.45, at: [0, 0, ZC - 1.025] }, // 後面的樞軸
        // 閥箱(前面開口):背板、左右側板、上下板(上板中間留閥桿穿過的縫)
        { kind: "box", size: [0.65, 1.0, 0.1], at: [-1.025, CHEST_Y, ZC - 0.25] },
        { kind: "box", size: [0.08, 1.0, 0.6], at: [-1.31, CHEST_Y, ZC] },
        { kind: "box", size: [0.08, 1.0, 0.6], at: [-0.74, CHEST_Y, ZC] },
        { kind: "box", size: [0.65, 0.08, 0.6], at: [-1.025, CHEST_Y - 0.46, ZC] },
        { kind: "box", size: [0.27, 0.08, 0.6], at: [-1.215, CHEST_Y + 0.46, ZC] },
        { kind: "box", size: [0.27, 0.08, 0.6], at: [-0.835, CHEST_Y + 0.46, ZC] },
        // 搖臂軸的軸承架:從閥箱左側立起、再橫向伸到搖臂軸
        { kind: "box", size: [0.14, 1.0 - (CHEST_Y + 0.4), 0.2], at: [-1.38, (1.0 + CHEST_Y + 0.4) / 2, ZC + 0.35] },
        { kind: "box", size: [0.72, 0.1, 0.2], at: [-1.67, 0.95, ZC + 0.35] },
        { kind: "cylinder", radius: 0.14, inner: 0.065, length: 0.2, at: [ROCK[0], ROCK[1], ZC + 0.35] },
      ],
    },
    { id: "piston", kind: "group", arrow: false, pieces: [{ kind: "cylinder", axis: [0, 1, 0], radius: CYL.radius - 0.02, length: 0.2, at: [0, 0, ZC] }] },
    { id: "pistonRod", kind: "link", width: 0.09, thickness: 0.09 },
    {
      // 搖臂軸:前面的搖臂(末端的銷往後插進溝槽)、軸、後面的搖臂(末端的銷往後插進閥桿的十字頭)
      id: "rockShaft",
      posed: true, // 姿勢由狀態決定:切換狀態時轉到新的姿勢,不接續轉角
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM, 0.14, 0.08], at: [ARM / 2, 0, 0.38] },
        { kind: "cylinder", radius: 0.13, length: 0.08, at: [0, 0, 0.38] },
        { kind: "cylinder", radius: 0.06, length: 0.26, at: [ARM, 0, 0.29] }, // 銷:穿過溝槽
        { kind: "cylinder", radius: 0.06, length: 0.42 - (ZC + 0.06), at: [0, 0, (0.42 + ZC + 0.06) / 2] },
        { kind: "box", size: [BACK_ARM, 0.12, 0.08], at: [BACK_ARM / 2, 0, ZC + 0.1] },
        { kind: "cylinder", radius: 0.11, length: 0.08, at: [0, 0, ZC + 0.1] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [BACK_ARM, 0, ZC - 0.03] }, // 銷:插進十字頭的長槽
      ],
    },
    {
      // 閥門(在閥箱裡沿汽缸軸上下滑)、閥桿與十字頭;局部原點在閥桿線上、搖臂軸的高度
      id: "valve",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [0.4, 0.4, 0.15], at: [0, CHEST_Y - ROCK[1], ZC - 0.125] },
        { kind: "box", size: [0.06, ROCK[1] - CHEST_Y - 0.33, 0.06], at: [0, (CHEST_Y - ROCK[1] + 0.2 - 0.13) / 2, ZC - 0.12] },
        { kind: "plate", shape: crosshead, thickness: 0.1, at: [0, 0, ZC - 0.12] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.0, 0.15, 3.4], at: [0, BASE_Y - 0.075, -1.1] }, // 底座
        // 兩根立柱(曲面滑塊兩端的套筒套在上面滑)
        { kind: "box", size: [0.1, GUIDE_Y + 0.06 - BASE_Y, 0.1], at: [-POST_X, (GUIDE_Y + 0.06 + BASE_Y) / 2, SLIDE_Z] },
        { kind: "box", size: [0.1, GUIDE_Y + 0.06 - BASE_Y, 0.1], at: [POST_X, (GUIDE_Y + 0.06 + BASE_Y) / 2, SLIDE_Z] },
        // 閥桿的導套:橫樑架在兩根立柱頂上,中間圍住閥桿
        { kind: "box", size: [1.3, 0.12, 0.1], at: [-0.8, GUIDE_Y, 0.27] },
        { kind: "box", size: [1.3, 0.12, 0.1], at: [0.8, GUIDE_Y, 0.27] },
        { kind: "box", size: [0.3, 0.12, 0.06], at: [0, GUIDE_Y, 0.34] },
        { kind: "box", size: [0.3, 0.12, 0.06], at: [0, GUIDE_Y, 0.2] },
        // 樞軸的前後兩個軸承座
        { kind: "plate", shape: shape(circle(0.42), [circle(0.245).reverse()]), thickness: 0.3, at: [TRUNNION[0], TRUNNION[1], 0.15] },
        { kind: "box", size: [0.44, TRUNNION[1] - 0.3 - BASE_Y, 0.3], at: [TRUNNION[0], (TRUNNION[1] - 0.3 + BASE_Y) / 2, 0.15] },
        { kind: "plate", shape: shape(circle(0.42), [circle(0.245).reverse()]), thickness: 0.3, at: [TRUNNION[0], TRUNNION[1], ZC - 1.05] },
        { kind: "box", size: [0.44, TRUNNION[1] - 0.3 - BASE_Y, 0.3], at: [TRUNNION[0], (TRUNNION[1] - 0.3 + BASE_Y) / 2, ZC - 1.05] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "valve",
  states: {
    options: [
      { id: "forward", label: "前進" },
      { id: "mid", label: "中位" },
      { id: "backward", label: "後退" },
    ],
    initial: "forward",
  },
  view: { direction: [-0.55, 0.2, 1] },
  pose(theta, state = "forward") {
    const { g, d, phi, armAngle, valve, piston, crankPin } = valveGear(theta, state);
    const [eA, eB] = g.eccentrics;
    const [aA, aB] = g.ends;
    const mid = [(aA[0] + aB[0]) / 2, (aA[1] + aB[1]) / 2, 0];
    return {
      parts: {
        shaft: { angle: theta },
        // 由後往前:偏心輪 A 與它的偏心環、連桿、偏心輪 B 與它的偏心環;閥桿在連桿後面,只有滑塊的銷伸進連桿的槽
        rodA: { from: z(eA, DISC_Z[0]), to: z(aA, DISC_Z[0]) },
        rodB: { from: z(eB, DISC_Z[1]), to: z(aB, DISC_Z[1]) },
        link: { position: z(mid, 0.51), angle: g.linkAngle + Math.PI / 2 },
        slide: { position: [TRUNNION[0], TRUNNION[1] + d, 0] },
        cylinder: { angle: phi },
        piston: { position: world([0, piston], phi), angle: phi },
        pistonRod: { from: world([0, piston], phi, ZC), to: [crankPin[0], crankPin[1], ZC] },
        rockShaft: { position: world(ROCK, phi), angle: phi + armAngle },
        valve: { position: world([VALVE_X, ROCK[1] + valve], phi), angle: phi },
      },
      // 汽缸一直在擺,閥門卻只跟著曲面滑塊的升降動(中位時曲面滑塊幾乎不動,閥門也幾乎不動)
      readouts: [
        { label: "汽缸擺角", value: `${(phi * 180 / Math.PI).toFixed(1)}°` },
        { label: "閥門位移", value: valve.toFixed(2) },
      ],
    };
  },
};
