// 第 229 種:鏈條與皮帶輪的另一種變形。鏈節是內側帶齒的板節,齒嵌進輪緣的缺口;
// 鍊條掛過輪頂,兩端斜斜垂下。轉動輪,鍊條跟著走。
import { TAU } from "./kit.js";
import { ratchetShape, circle } from "./shapes.js";
import { chainOver } from "./chain-over-sprocket.js";

const TEETH = 16;
const PINS = 2.3;
const chain = chainOver({ pins: PINS, left: [-3.05, -2.4, 0], right: [3.1, -1.25, 0] });

export const travel = chain.travel;

export default {
  figure: 229,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: ratchetShape({ teeth: TEETH, outer: 2.11, inner: 1.78, dir: 1 }).outline, holes: [circle(0.15).reverse()] },
      thickness: 0.2,
      hub: 0.35,
      circles: [0.25],
      mark: [1.4, 0],
      markSize: 0.11,
      spin: 2.1,
    },
    { id: "shaft", kind: "cylinder", radius: 0.14, length: 0.6 }, // 輪的固定軸(推斷)
    { id: "chain", kind: "chain", style: "toothed", pitch: (TAU * PINS) / TEETH, width: 0.36, offset: 0.12 },
  ],
  driver: { part: "wheel", type: "rotation" },
  view: { direction: [0.08, 0.06, 1] },
  pose(angle) {
    return {
      parts: { wheel: { angle } },
      paths: { chain: { points: chain.route.points, closed: false, phase: chain.travel(angle) } },
      readouts: [],
    };
  },
};
