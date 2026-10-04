// 第 227 種:鏈條與鏈條皮帶輪。各鏈節位於不同平面(內節、外節交錯),鏈節之間留有空隙,
// 皮帶輪的六個齒嵌進空隙。轉動皮帶輪,鍊條跟著走,一側上升、一側下降。
import { chainOver } from "./chain-over-sprocket.js";
import { polarOutline, circle } from "./shapes.js";

const PINS = 1.82;
const chain = chainOver({ pins: PINS, left: [-PINS, -4.4, 0], right: [PINS, -4.4, 0] });
// 六角星形輪:齒尖在 2.35,齒間凹成弧
const STAR = polarOutline((a) => 1.62 + 0.75 * ((1 + Math.cos(6 * a)) / 2) ** 3, 240);
const PHASE = 0.47; // 讓星形的齒落在鏈節的空隙裡(依畫面調整)

export const travel = chain.travel;

export default {
  figure: 227,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: STAR, holes: [circle(0.2).reverse()] },
      thickness: 0.2,
      hub: 0.55,
      circles: [0.4],
      mark: [1.95, 0],
      markSize: 0.11,
      spin: 2.35,
    },
    { id: "chain", kind: "chain", style: "plate", pitch: 0.94, width: 0.36, offset: 0.2 },
  ],
  driver: { part: "wheel", type: "rotation" },
  view: { direction: [0.1, 0.06, 1] },
  pose(angle) {
    return {
      parts: { wheel: { angle } },
      paths: { chain: { points: chain.route.points, closed: false, phase: chain.travel(angle) + PHASE } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "chain"], reason: "鏈輪的齒伸進鏈節之間是正常的咬合;鍊條以中心線加寬度檢查,齒尖越過中心線 0.10" },
  ],
};
