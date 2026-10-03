// 第 394 種:C. Parsons 的專利裝置,把往復運動轉成旋轉。一個無端齒條(跑道形的框,齒朝內)由往復的桿推拉;框的內側有一道溝槽,
// 小齒輪的兩個凸緣(一大一小,同心)在溝槽裡導引:框往一個方向走時小齒輪咬著上排的齒,走到盡頭時小齒輪繞過一端的半圓齒,
// 換咬下排的齒;框往回走時,小齒輪仍朝同一方向轉。可以代替擺動式汽缸引擎的曲柄。
// 主動件是小齒輪(連續轉動);框的往復由它決定(模型讓讀者轉小齒輪,看框怎麼來回)。
// 推斷:齒數與跑道的尺寸;小齒輪繞過半圓端時,框暫停並橫移(示意,依溝槽的導引)。
import { TAU, smooth } from "./kit.js";
import { shape, rect } from "./shapes.js";

const NP = 10;
const RP = 0.42; // 小齒輪節圓半徑
const LEN = 2.6; // 直線段的長度(框的單程行程)
const PITCH = (TAU * RP) / NP;
const TURN = Math.PI; // 繞過一端時小齒輪轉的角度

/** 小齒輪轉 theta(順時針為負)→ 框的位移(x)與小齒輪相對框的上下位置 */
export function parsons(theta) {
  const s = (-theta * RP); // 小齒輪節圓走過的弧長
  const straight = LEN;
  const endArc = TURN * RP;
  const period = 2 * (straight + endArc);
  const u = ((s % period) + period) % period;
  let x;
  let y;
  if (u < straight) {
    x = -u; // 咬上排:框往左走
    y = 1;
  } else if (u < straight + endArc) {
    const f = (u - straight) / endArc;
    x = -straight;
    y = 1 - 2 * smooth(f);
  } else if (u < 2 * straight + endArc) {
    x = -straight + (u - straight - endArc); // 咬下排:框往右走
    y = -1;
  } else {
    const f = (u - 2 * straight - endArc) / endArc;
    x = 0;
    y = -1 + 2 * smooth(f);
  }
  return { x: x + LEN / 2, y };
}
export const geometry = { LEN, RP };

// 跑道形框:外框+上下兩排朝內的齒
const H = 2 * RP + 0.15; // 上下兩排齒的距離
const teeth = [];
for (let i = 0; i <= Math.floor(LEN / PITCH) + 1; i++) {
  const x = -LEN / 2 - 0.1 + i * PITCH;
  teeth.push({ kind: "box", size: [PITCH * 0.45, 0.16, 0.2], at: [x, H / 2 + 0.02, 0] });
  teeth.push({ kind: "box", size: [PITCH * 0.45, 0.16, 0.2], at: [x + PITCH / 2, -H / 2 - 0.02, 0] });
}
const OUT = { w: LEN + 2 * H + 0.6, h: H + 0.75 };

export default {
  figure: 394,
  parts: [
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(OUT.w, OUT.h), [rect(LEN + 2 * H, H + 0.2).reverse()]), thickness: 0.22 },
        ...teeth,
        // 往右伸出的推拉桿
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.6, at: [OUT.w / 2 + 0.8, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 0.15, at: [OUT.w / 2 + 1.55, 0, 0] },
      ],
    },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.25, bore: 0.06, pieces: [{ kind: "cylinder", radius: RP * 0.55, length: 0.36 }, { kind: "cylinder", radius: 0.06, length: 0.9 }] },
  ],
  driver: { part: "pinion", type: "rotation", speed: -0.8 },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const p = parsons(theta);
    // 小齒輪的軸固定;框相對它左右往復、上下移(小齒輪咬上排時框在下,咬下排時框在上)
    return { parts: { pinion: { angle: theta, position: [0, 0, 0.05] }, frame: { position: [p.x, -p.y * (H / 2 - RP + 0.02), 0] } }, readouts: [] };
  },
};
