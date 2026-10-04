// 第 228 種:另一種類型的鏈條與皮帶輪。厚輪的輪緣上有一圈楔形凸塊,
// 梯形鍊(兩股環節以橫檔相連)掛在輪上,橫檔卡進凸塊之間;轉動輪,鍊條跟著走。
import { TAU, polar } from "./kit.js";
import { chainOver } from "./chain-over-sprocket.js";

const R = 1.9;
const WIDTH = 0.8;
const LUGS = 12;
const PINS = R + 0.12;
const chain = chainOver({ pins: PINS, left: [-PINS, -4.0, 0], right: [PINS, -4.0, 0] });

const lugs = Array.from({ length: LUGS }, (_, i) => {
  const a = ((i + 0.5) * TAU) / LUGS;
  const p = polar(R + 0.1, a);
  return { kind: "box", size: [0.22, 0.32, 0.36], at: [p[0], p[1], 0], angle: a };
});

export const travel = chain.travel;

export default {
  figure: 228,
  parts: [
    {
      id: "wheel",
      kind: "cylinder",
      radius: R,
      length: WIDTH,
      mark: true,
      spin: R,
      pieces: [...lugs, { kind: "cylinder", radius: 0.22, length: 2.6, at: [0, 0, -0.2] }, { kind: "cylinder", radius: 0.32, length: 0.25, at: [0, 0, 0.5] }],
    },
    { id: "chain", kind: "chain", style: "ladder", pitch: (TAU * PINS) / LUGS, width: 0.3, span: WIDTH + 0.25 },
  ],
  driver: { part: "wheel", type: "rotation" },
  view: { direction: [-0.55, 0.3, 1] },
  pose(angle) {
    return {
      parts: { wheel: { angle } },
      paths: { chain: { points: chain.route.points, closed: false, phase: chain.travel(angle) } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "chain"], reason: "鏈輪的齒塊伸進鏈節之間是正常的咬合;鍊條以中心線加寬度檢查,齒塊越過中心線 0.10" },
  ],
};
