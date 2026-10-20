// 第 449 種:現代的提升泵。運作與前一種相同,只是活塞桿穿過填料函,出水口由一個向上開的瓣閥封住;水可以抬到泵上方的任何高度。
// 主動件是活塞桿(上下往復)。
// 照原圖(2026-10-20):活塞是中間有水道的環,環上立一個弓形架,活塞桿接在架頂、不伸進水道;活塞閥在架底下翻開。
// 出水管從泵筒側壁的開口往右、往上接進鼓起的閥室(閥室的底就是出水瓣閥的閥座),閥室頂端收成管子往上、
// 頂端畫成斷管(原圖:管子往上接、沒畫完);出水時水在管裡往上走到斷口,不從口緣溢出。
// 推斷:泵已經引過水;出水管與閥室的位置依原圖;剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, flap, barrel, water, pipeWalls, openedLathe, valveOpening } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, thickLine } from "./shapes.js";

export const BARREL = { r: 0.42, y0: -1.1, y1: 1.1 };
const SUCTION = { r: 0.22, y0: -2.3 };
export const STROKE = [-0.55, 0.45]; // 活塞高度(下 → 上)
const PISTON_H = 0.25;
const ROD = 2.3;
const BOW = { leg: 0.28, rise: 0.27, top: 0.45 }; // 活塞上的弓形架:腳的 x、腳高、架頂的高(都從活塞環頂面起算)
const BOW_TOP = PISTON_H / 2 + BOW.top + 0.03; // 架頂的上面(活塞局部),活塞桿從這裡往上
/** 出水管:軸線 x、從泵筒接出的高度、壁中心線相距 w(內半寬 inner)、閥室的底(閥座)、斷口的高 */
export const OUT = { x: 0.95, y: 0.75, w: 0.3, inner: 0.12, floor: 1.95, top: 3.2 };
const OUT_PIPE = [[BARREL.r, OUT.y], [OUT.x, OUT.y], [OUT.x, OUT.floor]];
const OUT_OPENING = { y0: OUT.y - OUT.w / 2 - 0.03, y1: OUT.y + OUT.w / 2 + 0.03, side: 1, depth: 0.4 };
const CHAMBER = { r: 0.26, wall: 0.06, straight: 0.55, shoulder: 0.85, neck: 1.0 }; // 閥室:內半徑、壁厚、直壁高、收口高、頸口高(都從閥室底起算)
const OPEN = deg(55);

export default {
  figure: 449,
  parts: [
    barrel("barrel", {
      ...BARREL,
      openings: [OUT_OPENING],
      pieces: [
        // 泵筒底的法蘭(接吸水管)、頂蓋與填料函
        { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [0, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.05, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.1], [0.05, 0.1]], at: [0, BARREL.y1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.05, 0], [0.13, 0], [0.13, 0.3], [0.05, 0.3]], at: [0, BARREL.y1 + 0.1, 0], ...backHalf(Y) },
        // 出水管(接進筒壁的開口)、頂上鼓起的閥室(底是閥座環,坐在管壁上;頂端收成頸)
        ...pipeWalls(OUT_PIPE, OUT.w),
        ...openedLathe({
          x: OUT.x,
          y0: OUT.floor,
          profile: [
            [OUT.inner, 0],
            [CHAMBER.r + CHAMBER.wall, 0],
            [CHAMBER.r + CHAMBER.wall, CHAMBER.straight],
            [OUT.inner + CHAMBER.wall, CHAMBER.shoulder],
            [OUT.inner + CHAMBER.wall, CHAMBER.neck],
            [OUT.inner, CHAMBER.neck],
            [OUT.inner, CHAMBER.shoulder - 0.03],
            [CHAMBER.r, CHAMBER.straight - 0.03],
            [CHAMBER.r, CHAMBER.wall],
            [OUT.inner, CHAMBER.wall],
          ],
        }),
        // 頸口以上的管子:兩道壁高低不齊、頂端斜切,畫成斷管(往上接、沒畫完)
        { kind: "plate", shape: shape(thickLine([[OUT.x - OUT.inner - 0.03, OUT.floor + CHAMBER.neck - 0.05], [OUT.x - OUT.inner - 0.03, OUT.top + 0.02], [OUT.x - OUT.inner - 0.05, OUT.top + 0.07]], 0.06)), thickness: 0.4 },
        { kind: "plate", shape: shape(thickLine([[OUT.x + OUT.inner + 0.03, OUT.floor + CHAMBER.neck - 0.05], [OUT.x + OUT.inner + 0.03, OUT.top - 0.08], [OUT.x + OUT.inner + 0.01, OUT.top - 0.04]], 0.06)), thickness: 0.4 },
      ],
    }),
    barrel("suction", { r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0 + 0.05, wall: 0.06 }),
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.55, 0], size: [2.2, 0.5, 1.2], level: 1 },
    { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
    { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "above", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "outWater", kind: "fill", fluid: "water", center: [OUT.x, (OUT.y - OUT.inner + OUT.top) / 2, 0], size: [2 * OUT.inner, OUT.top - (OUT.y - OUT.inner), 0.3], level: 1 },
    flap("footValve", 2 * SUCTION.r),
    {
      id: "piston",
      kind: "group",
      arrow: false,
      pieces: [
        // 活塞環(中間是水道)、環上的弓形架、接在架頂的活塞桿(往上穿過填料函)
        { kind: "lathe", axis: Y, profile: [[0.16, -PISTON_H / 2], [BARREL.r - 0.01, -PISTON_H / 2], [BARREL.r - 0.01, PISTON_H / 2], [0.16, PISTON_H / 2]], ...backHalf(Y) },
        {
          kind: "plate",
          shape: shape(thickLine([[-BOW.leg, -0.02], [-BOW.leg, BOW.rise], [-0.12, BOW.top], [-0.04, BOW.top], [0.04, BOW.top], [0.12, BOW.top], [BOW.leg, BOW.rise], [BOW.leg, -0.02]], 0.06)),
          thickness: 0.12,
          at: [0, PISTON_H / 2, 0],
        },
        { kind: "cylinder", axis: Y, radius: 0.035, length: ROD - BOW_TOP, at: [0, (ROD + BOW_TOP) / 2, 0] },
      ],
    },
    flap("pistonValve", 0.32),
    flap("outValve", 0.3),
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: STROKE },
  powered: ["footValve", "pistonValve", "outValve"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  target: "outValve", // 出水口向上開的瓣閥:水從這裡被送到泵上方
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const phase = stroke(v, ...STROKE);
    const { at: y, forward: up } = phase;
    const travel = v * 4;
    const top = y + PISTON_H / 2;
    const flows = up
      ? [{ fluid: "water", points: [...stream([[0, -2.45, 0.1], [0, BARREL.y0 + 0.1, 0.1]], travel, { spacing: 0.2 }), ...stream([[0.1, OUT.y + 0.07, 0.1], [OUT.x, OUT.y, 0.1], [OUT.x, OUT.top, 0.1]], travel, { spacing: 0.16 })] }]
      : [{ fluid: "water", points: stream([[0.05, y - 0.35, 0.1], [0.05, top + 0.15, 0.1]], travel, { spacing: 0.12 }) }];
    return {
      parts: {
        piston: { position: [0, y, 0] },
        // 閥瓣關上時坐在管口 / 活塞 / 閥室底的閥座上
        // (2026-10-07 複查:原本換向的瞬間直接翻開 / 闔上;改成被水頂開、靠自重加速落回閥座)
        footValve: { position: [-SUCTION.r, BARREL.y0 + 0.05 + 0.025, 0], angle: OPEN * valveOpening(up, phase) },
        pistonValve: { position: [-0.16, top + 0.025, 0], angle: OPEN * valveOpening(!up, phase) },
        // 出水口的瓣閥:鉸在閥室底的閥座上,上行時被水頂開(向上開)
        outValve: { position: [OUT.x - 0.15, OUT.floor + CHAMBER.wall + 0.025, 0], angle: OPEN * valveOpening(up, phase) },
        below: water(0, BARREL.y0, y - PISTON_H / 2, BARREL.y1 - BARREL.y0),
        above: water(0, top, BARREL.y1, BARREL.y1 - BARREL.y0),
      },
      flows,
      readouts: [{ label: "活塞", value: up ? "上行:下閥開、活塞閥關,出水瓣閥被頂開" : "下行:下閥關、活塞閥開,出水瓣閥關上" }],
    };
  },
};
