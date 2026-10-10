// 第 227 種:鏈條與鏈條滑輪。各鏈節位於不同平面(內節、外節交錯),鏈節之間留有空隙,
// 滑輪的六個齒嵌進空隙。轉動滑輪,鍊條跟著走,一側上升、一側下降。
// 推斷:滑輪的軸與後面的軸承座(原圖只畫輪轂)。
import { TAU } from "./kit.js";
import { chainOver } from "./chain-over-sprocket.js";
import { polarOutline, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const PINS = 1.82;
const DROP = 4.4; // 兩端垂下的長度(到輪心的高度)
const chain = chainOver({ pins: PINS, left: [-PINS, -DROP, 0], right: [PINS, -DROP, 0] });
// 鏈節距:每個齒隔兩節(一節藏在輪面那一層、讓齒嵌進去,一節在前面跨過齒間),6 個齒每圈剛好 12 節,
// 轉幾圈齒都落在同一種鏈節的空隙裡(第 228、229 種同樣是整數節)
const PITCH = (TAU * PINS) / 12;
// 六角星形輪:齒尖在 2.35,齒間凹成弧
const STAR = polarOutline((a) => 1.62 + 0.75 * ((1 + Math.cos(6 * a)) / 2) ** 3, 240);
// 轉角 0 時右側的齒尖在輪心正右方(路徑上從左端起 DROP + π·PINS 處):讓一個偶數節(藏在輪面那一層)的中點落在這裡,
// 前面那一層的奇數節就跨在兩齒之間的凹處(原圖頂上那一節)
const PHASE = ((((DROP + Math.PI * PINS) / PITCH - 0.5) % 2) + 2) % 2 * PITCH;

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
    { id: "chain", kind: "chain", style: "plate", pitch: PITCH, width: 0.36, offset: 0.2 },
    { id: "frame", kind: "group", pieces: [{ kind: "cylinder", radius: 0.2, length: 0.6, at: [0, 0, -0.3] }, ...pedestal({ at: [0, 0], z: -0.5, bore: 0.2, floor: -4.6 })] },
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
