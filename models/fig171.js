// 第 171 種:擺動式船舶引擎的閥門運動與換向齒輪。上方曲柄軸上的兩個偏心輪,偏心桿往下接到開槽連桿的兩端
// (與機車頭的連桿運動相同,見第 185 種);連桿可用左邊的柄左右移動。槽中的滑塊接著往下的閥桿,
// 閥桿帶動樞軸(trunnion)上方的曲面滑塊;曲面滑塊的溝槽裡有一根銷,接在搖臂軸的搖臂上,搖臂軸再把運動傳給閥門。
// 溝槽是以樞軸中心為圓心的圓弧,所以圓筒擺動時不影響閥門的行程(此處圓筒不動,只畫出樞軸)。
// 主動件是曲柄軸;連桿的位置是狀態(前進、中位、後退,原機構由司機扳動換向桿切換)。
// 偏心桿的上端是套在偏心輪外面的偏心環(原圖:兩個偏心輪外各有一圈),不是接在偏心輪的中心,所以曲柄軸可以整根穿過兩個偏心輪。
// 推斷(原圖沒畫):閥桿穿過的導套(橫樑架在兩根立柱之間)、搖臂軸的軸承(托在左邊的立柱上)。
import { deg, polar } from "./kit.js";
import { linkMotion, eccentricStrap } from "./link-motion.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [0, 3.4, 0];
const ECC = 0.3;
const DISC_R = 0.62; // 偏心輪半徑
const DISC_Z = [0.25, 0.72]; // 兩個偏心輪(A 在後、B 在前)的深度;連桿在兩者之間
const ROD = 3.2;
const HALF = 0.85;
const motion = linkMotion({ shaft: SHAFT, dir: [0, -1, 0], ecc: ECC, rod: ROD, half: HALF, leads: [deg(110), deg(-110)] });
const SHIFT = { forward: -HALF * 0.7, mid: 0, backward: HALF * 0.7 }; // 全程時滑塊離連桿端頭留一點距離(不碰偏心桿端頭的銷)
const VALVE_ROD = 1.1; // 滑塊到曲面滑塊的距離
const TRUNNION = [0, -1.45, 0];
const ARC_R = 1.25; // 曲面溝槽的半徑(以樞軸為圓心)
const ARM = { pivot: [-1.65, 0, 0], length: 1.6 }; // 搖臂軸在左邊

/** 軸轉 theta、連桿在 state:閥桿(滑塊)的高度與搖臂的轉角 */
export function valveGear(theta, state) {
  const g = motion(theta, SHIFT[state]);
  const blockY = g.block[1];
  const arcTop = blockY - VALVE_ROD; // 曲面滑塊頂端的高度
  const pinY = arcTop - 0.15;
  const armAngle = Math.asin(Math.max(-1, Math.min(1, (pinY - ARM.pivot[1]) / ARM.length)));
  return { g, blockY, arcTop, armAngle };
}
export const states = Object.keys(SHIFT);
const REST_TOP = valveGear(0, "mid").arcTop;
ARM.pivot[1] = REST_TOP - 0.15;
const GUIDE_Y = -0.35; // 閥桿導套的高度(閥桿上下行程中始終穿過它)

// 連桿畫成直的(原圖略彎):滑塊的位置是在連桿兩端之間直線內插的,槽是直的才對得上。
// 偏心桿端頭的銷只頂到連桿的板面(連桿的升降是近似算的,兩端的距離會略變,銷不穿進板裡)
const linkShape = shape(
  [[-HALF - 0.2, -0.16], [HALF + 0.2, -0.16], [HALF + 0.2, 0.16], [-HALF - 0.2, 0.16]],
  [[[-0.78, -0.06], [0.78, -0.06], [0.78, 0.06], [-0.78, 0.06]].reverse()],
);
const arcPiece = shape(
  [...arcPoints(ARC_R + 0.3, deg(20), deg(160)), ...arcPoints(ARC_R - 0.25, deg(160), deg(20))],
  [[...arcPoints(ARC_R + 0.07, deg(40), deg(140)), ...arcPoints(ARC_R - 0.07, deg(140), deg(40))].reverse()],
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
        { kind: "cylinder", radius: 0.22, length: 1.6, at: [0, 0, 0.2], mark: true }, // 曲柄軸整根穿過兩個偏心輪
        { kind: "plate", shape: shape(circle(DISC_R, ...polar(ECC, deg(110) - Math.PI / 2).slice(0, 2)), [circle(0.23).reverse()]), thickness: 0.18, at: [0, 0, DISC_Z[0]] },
        { kind: "plate", shape: shape(circle(DISC_R, ...polar(ECC, deg(-110) - Math.PI / 2).slice(0, 2)), [circle(0.23).reverse()]), thickness: 0.18, at: [0, 0, DISC_Z[1]] },
      ],
    },
    eccentricStrap({ id: "rodA", disc: DISC_R, rod: ROD, pinZ: 0.45 - DISC_Z[0] - 0.1 - 0.01 }), // 銷從環的那一層往前頂到連桿的背面
    eccentricStrap({ id: "rodB", disc: DISC_R, rod: ROD, pinZ: 0.57 - DISC_Z[1] + 0.1 + 0.01 }), // 銷往後頂到連桿的正面
    { id: "link", kind: "group", posed: true, arrow: false, pieces: [{ kind: "plate", shape: linkShape, thickness: 0.12 }] },
    { id: "valveRod", kind: "group", pieces: [{ kind: "box", size: [0.1, VALVE_ROD, 0.08], at: [0, -VALVE_ROD / 2, 0] }, { kind: "cylinder", radius: 0.055, length: 0.16, at: [0, 0, 0.23] }] }, // 滑塊畫成一根在連桿槽裡滑的銷(閥桿在連桿後面)
    { id: "arcPiece", kind: "plate", shape: arcPiece, thickness: 0.15 },
    { id: "arm", kind: "group", center: ARM.pivot, arrow: false, pieces: [{ kind: "box", size: [ARM.length, 0.12, 0.08], at: [ARM.length / 2, 0, 0.36] }, { kind: "cylinder", radius: 0.06, length: 0.85, at: [0, 0, 0.075] }, { kind: "cylinder", radius: 0.15, inner: 0.06, length: 0.2 }] },
    {
      id: "trunnion",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.25).reverse()]), thickness: 0.3, at: TRUNNION },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [-1.45, TRUNNION[1] + 0.9, -0.2] },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [1.45, TRUNNION[1] + 0.9, -0.2] },
        // 閥桿的導套:橫樑架在兩根立柱上,中間圍住閥桿
        { kind: "box", size: [1.3, 0.12, 0.1], at: [-0.8, GUIDE_Y, 0.27] },
        { kind: "box", size: [1.3, 0.12, 0.1], at: [0.8, GUIDE_Y, 0.27] },
        { kind: "box", size: [0.3, 0.12, 0.06], at: [0, GUIDE_Y, 0.34] },
        { kind: "box", size: [0.3, 0.12, 0.06], at: [0, GUIDE_Y, 0.2] },
        { kind: "box", size: [0.12, 0.12, 0.47], at: [-1.45, GUIDE_Y, 0.06] },
        { kind: "box", size: [0.12, 0.12, 0.47], at: [1.45, GUIDE_Y, 0.06] },
        // 搖臂軸的軸承,托在左邊的立柱上
        { kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.14, at: [ARM.pivot[0], ARM.pivot[1], -0.26] },
        { kind: "box", size: [0.2, 0.1, 0.1], at: [-1.47, ARM.pivot[1], -0.24] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "arm",
  states: {
    options: [
      { id: "forward", label: "前進" },
      { id: "mid", label: "中位" },
      { id: "backward", label: "後退" },
    ],
    initial: "forward",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "forward") {
    const { g, blockY, arcTop, armAngle } = valveGear(theta, state);
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
        valveRod: { position: [0, blockY, 0.27] },
        arcPiece: { position: [TRUNNION[0], arcTop - ARC_R - 0.3, 0.235] }, // 貼著閥桿的背面;搖臂在它的前面
        arm: { angle: armAngle },
      },
      readouts: [],
    };
  },
};
