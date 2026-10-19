// 第 346 種:桌式引擎。汽缸固定在桌形的底座上;活塞桿頂有一個十字頭,在固定於汽缸頂部的直線開槽導件裡上下,
// 再經兩根側連桿(前後各一,原圖看到前面那根)接到桌面下方軸上的兩個平行曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機;各部尺寸依原圖。
// 兩片曲柄臂固定在同一根曲柄軸的兩端(曲柄軸和臂、兩根曲柄銷是一件),軸架在桌面下兩個吊架的軸承環裡;
// 兩根側連桿的下端各套在一根曲柄銷上,上端由一根橫穿十字頭的銷接起。
import { TAU } from "./kit.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, thickLine, rect } from "./shapes.js";

const CYL = { x: 0, top: 0.47, length: 1.6, radius: 0.55 }; // 下蓋底面落在桌面上(-1.25)
const CRANK = [-0.15, -2.3, 0]; // 桌面下方的曲柄軸
const R = 0.45;
const SIDE = 0.65; // 側連桿在汽缸前後的距離
// 十字頭在曲柄「上方」:側連桿往上接十字頭
const ROD = 4.0;
const PISTON_ROD = 1.25;
const SHAFT_R = 0.12; // 曲柄軸(吊架的軸承環孔 0.13)
const GUIDE_X = 0.35; // 導件兩腳的中心線;腳寬 0.12,內側在 ±0.29
const GUIDE_W = 0.12;
// 汽缸上蓋的頂面:導件的腳踩在上面(固定在汽缸頂部)
const CAP_TOP = (() => {
  const c = cylinderParts(CYL)[0];
  return c.center[1] + Math.max(...c.profile.map(([, h]) => h));
})();

/** 進程 p → 曲柄角、曲柄銷、十字頭高度、活塞高度 */
export function table(p) {
  const theta = -Math.PI / 2 - TAU * p;
  const pin = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta), 0];
  const head = pin[1] + Math.sqrt(ROD * ROD - pin[0] ** 2);
  const pin2 = [CRANK[0] + R * Math.cos(theta - 1e-4), CRANK[1] + R * Math.sin(theta - 1e-4)];
  const next = pin2[1] + Math.sqrt(ROD * ROD - pin2[0] ** 2);
  return { theta, pin, head, piston: head - PISTON_ROD - 0.9, downward: next < head };
}

export default {
  figure: 346,
  parts: [
    {
      id: "table",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.6, 0.2, 1.4], at: [0, -1.35, 0] }, // 桌面比兩根側連桿的間距窄:側連桿從桌面前後兩側通過
        { kind: "box", size: [0.2, 1.3, 0.2], at: [-1.6, -2.1, 0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [1.6, -2.1, 0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [-1.6, -2.1, -0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [1.6, -2.1, -0.7] },
        // 汽缸頂上的開槽導件(倒 U 形)
        { kind: "plate", shape: shape(thickLine([[-GUIDE_X, CAP_TOP], [-GUIDE_X, CYL.top + 2.9], [0, CYL.top + 3.15], [GUIDE_X, CYL.top + 2.9], [GUIDE_X, CAP_TOP]], GUIDE_W)), thickness: 0.2 },
        // 曲柄軸的兩個吊架:從桌面底下垂下來托著軸(推斷,原圖桌下的軸承看不清楚)
        ...[1, -1].flatMap((s) => [
          { kind: "box", size: [0.3, -1.45 - CRANK[1], 0.14], at: [CRANK[0], (-1.45 + CRANK[1]) / 2, s * 0.42] },
          { kind: "cylinder", radius: 0.26, inner: SHAFT_R + 0.01, length: 0.14, at: [CRANK[0], CRANK[1], s * 0.42] },
        ]),
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.05, // 箭頭在曲柄臂外緣與桌面下緣之間,畫在前面那根側連桿的前面(不被吊架與桌面擋住)
      spinOffset: SIDE + 0.3,
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: 2 * SIDE + 0.14, at: [0, 0, 0] }, // 曲柄軸:兩端伸出臂外 0.02
        ...[1, -1].flatMap((s) => [
          { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.3)), thickness: 0.1, at: [0, 0, s * SIDE] },
          { kind: "cylinder", radius: 0.07, length: 0.3, at: [R, 0, s * (SIDE + 0.1)], accent: true }, // 曲柄銷往外伸,穿過側連桿的下端
        ]),
      ],
    },
    { id: "sideRod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "sideRodBack", kind: "link", width: 0.12, thickness: 0.06 },
    {
      id: "crosshead",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(2 * (GUIDE_X - GUIDE_W / 2), 0.25)), thickness: 2 * SIDE + 0.2 }, // 寬度等於導件兩腳的內側距離
        { kind: "box", size: [0.09, PISTON_ROD + 0.9, 0.09], at: [0, -(PISTON_ROD + 0.9) / 2, 0] },
        { kind: "cylinder", radius: 0.05, length: 2 * (SIDE + 0.2), accent: true }, // 橫穿十字頭的銷,兩端套著兩根側連桿的上端
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.08, 0.06, 1] },
  pose(p) {
    const t = table(p);
    const cyl = cylinderPose(CYL, t.piston, t.downward, p);
    return {
      parts: {
        crank: { angle: t.theta },
        sideRod: { from: [t.pin[0], t.pin[1], SIDE + 0.15], to: [0, t.head, SIDE + 0.15] },
        sideRodBack: { from: [t.pin[0], t.pin[1], -SIDE - 0.15], to: [0, t.head, -SIDE - 0.15] },
        crosshead: { position: [0, t.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
