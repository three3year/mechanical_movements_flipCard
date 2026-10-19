// 第 392 種:跳鋸(線鋸)。鋸條的下端接在曲柄(下方的輪)上的連桿,由曲柄帶著上下;上端接在一根彈簧(上方的彈性橫桿)上,
// 彈簧讓鋸條始終繃緊,不必用鋸框。鋸條穿過工作台中間的孔上下鋸。主動件是下方的曲柄輪。
// 推斷:各部尺寸依原圖;曲柄輪的軸往後伸進軸承座(原圖只畫出輪,軸承座是推斷)。
//
// 2026-10-20 照原圖重排(#392-1~3):
// - 上方那根水平桿就是彈簧(原圖右端夾在帶兩顆螺栓的夾座裡,507movements 的動畫把它畫成會彎的桿)。彈簧桿的右端夾死在夾座,
//   左端經一個吊環(推斷:原圖的桿端彎成鉤,鉤與吊桿頂之間的接法看不清)接到鋸條上十字頭往上伸的吊桿。桿照懸臂樑的撓曲線彎,
//   沿桿量的長度不變;鋸條在行程中點時桿是直的,不受力時的桿端比行程最高點還高(推斷),所以桿一直往上拉、鋸條始終繃緊。
// - 鋸條上、下兩端各有一個十字頭,夾在兩根導柱之間上下滑(原圖);連桿的上端接在下十字頭的銷上。
// - 工作台是一塊水平的板,中間開一道鋸縫讓鋸條穿過;台面由兩支腳撐到地上,腳、曲柄輪的軸承座與夾座的立柱站在同一根地檻上
//   (推斷:原圖只畫台面的斷面)。
import { crankPin } from "./linkage.js";
import { pedestal } from "./supports.js";
import { shape, circle, rect } from "./shapes.js";
import { Y } from "./kit.js";

const CRANK = { center: [0, -2.2, 0], r: 0.45 };
const ROD = 1.5;
const BLADE = 2.6; // 下十字頭的銷到上十字頭的中心
const HANGER = 1.0; // 上十字頭到吊桿頂的銷
const SHACKLE = 0.25; // 吊環的長度
const FLOOR = -3.3;
const TABLE = { y: 0.25, thick: 0.3, w: 4.4, d: 0.8 };
const POST_X = 0.35; // 導柱的中心;導柱 0.12 見方
const HEAD = { w: 2 * (POST_X - 0.06) - 0.01, h: 0.24, d: 0.2 }; // 十字頭:兩側各離導柱 0.005
// 彈簧桿:右端夾在 X_CLAMP,桿長 BAR_L;行程中點時是直的,在 BAR_Y
const X_CLAMP = 2.4;
const BAR_L = 2.4;
const BAR_R = 0.06;
const MID_LOW = CRANK.center[1] + Math.sqrt(ROD * ROD - CRANK.r * CRANK.r); // 曲柄銷在水平位置時(行程中點附近)
const BAR_Y = MID_LOW + BLADE + HANGER + SHACKLE;
const FREE_TIP = BAR_Y + 0.75; // 不受力時桿端的高度(推斷:比行程最高點高)

/** 曲柄轉 theta → 曲柄銷、鋸條下端(下十字頭的銷)與上端(上十字頭)的高度 */
export function gigSaw(theta) {
  const pin = crankPin(CRANK.center, CRANK.r, theta);
  const low = pin[1] + Math.sqrt(ROD * ROD - pin[0] ** 2);
  return { pin, low, top: low + BLADE };
}

/** 彈簧桿的撓曲線:桿端往上偏 d(懸臂樑、端點受力);沿桿長取 n 段,回傳折線(從夾座往左) */
function barShape(d, n = 24) {
  const pts = [[X_CLAMP + 0.2, BAR_Y, 0], [X_CLAMP, BAR_Y, 0]];
  let [x, y] = [X_CLAMP, BAR_Y];
  const ds = BAR_L / n;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * ds;
    const phi = Math.atan(((3 * d) / (2 * BAR_L ** 3)) * s * (2 * BAR_L - s));
    x -= ds * Math.cos(phi);
    y += ds * Math.sin(phi);
    pts.push([x, y, 0]);
  }
  return pts;
}

/** 吊桿頂的銷在 eye 時,彈簧桿彎到桿端離銷正好一個吊環長(桿端在銷的上方) */
export function springBar(eye) {
  const miss = (d) => {
    const tip = barShape(d).at(-1);
    return tip[1] - eye - Math.sqrt(SHACKLE ** 2 - tip[0] ** 2);
  };
  let [lo, hi] = [-1.5, 1.5];
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (miss(mid) < 0) lo = mid;
    else hi = mid;
  }
  return barShape((lo + hi) / 2);
}
export const geometry = { FLOOR, FREE_TIP, BAR_Y };

const guide = (x, y0, y1) => ({ kind: "box", size: [0.12, y1 - y0, 0.12], at: [x, (y0 + y1) / 2, 0], role: "guide" });
const TOP = TABLE.y + TABLE.thick / 2;
const BOTTOM = TABLE.y - TABLE.thick / 2;
const legAt = (x) => ({ kind: "box", size: [0.14, BOTTOM - FLOOR, 0.14], at: [x, (BOTTOM + FLOOR) / 2, -0.45], role: "leg" });
const CLAMP = { x: X_CLAMP + 0.2, w: 0.4, h: 0.26 };

export default {
  figure: 392,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 工作台:水平的板,中間的鋸縫讓鋸條穿過(鋸條含齒 x −0.09..0.04、厚 0.02)
        { kind: "plate", axis: Y, shape: shape(rect(TABLE.w, TABLE.d), [rect(0.2, 0.1, -0.025, 0).reverse()]), thickness: TABLE.thick, at: [0, TABLE.y, 0], role: "table" },
        // 上、下兩對導柱:上段立在台面上,下段吊在台面下,十字頭在兩根之間上下滑
        guide(-POST_X, TOP, 2.75),
        guide(POST_X, TOP, 2.75),
        guide(-POST_X, -1.3, BOTTOM),
        guide(POST_X, -1.3, BOTTOM),
        // 台面的腳、曲柄輪的軸承座、彈簧桿夾座的立柱,都站在地檻上(推斷)
        legAt(-2.0),
        legAt(2.0),
        ...pedestal({ at: [CRANK.center[0], CRANK.center[1]], z: -0.45, bore: 0.08, floor: FLOOR }),
        { kind: "box", size: [4.9, 0.18, 0.85], at: [0.35, FLOOR - 0.09, -0.32] },
        { kind: "box", size: [0.16, BAR_Y - CLAMP.h / 2 - FLOOR, 0.16], at: [CLAMP.x + 0.1, (BAR_Y - CLAMP.h / 2 + FLOOR) / 2, 0] },
        // 夾座與兩顆螺栓(原圖)
        { kind: "box", size: [CLAMP.w, CLAMP.h, 0.2], at: [CLAMP.x, BAR_Y, 0], role: "clamp" },
        { kind: "cylinder", axis: Y, radius: 0.04, length: 0.12, at: [CLAMP.x - 0.1, BAR_Y + CLAMP.h / 2 + 0.06, 0] },
        { kind: "cylinder", axis: Y, radius: 0.04, length: 0.12, at: [CLAMP.x + 0.1, BAR_Y + CLAMP.h / 2 + 0.06, 0] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: 0.85,
      pieces: [
        { kind: "plate", shape: shape(circle(0.85), [circle(0.7).reverse()]), thickness: 0.12 },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.5, 0.08, 0.08], angle: (i * Math.PI) / 3 })),
        { kind: "cylinder", radius: 0.08, length: 0.6, at: [0, 0, -0.25] }, // 軸
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [CRANK.r, 0, 0.12], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.12, thickness: 0.06 },
    {
      id: "blade",
      kind: "group",
      arrow: false,
      // 局部原點在下十字頭的銷
      pieces: [
        { kind: "box", size: [HEAD.w, HEAD.h, HEAD.d], at: [0, 0, 0], role: "crosshead" },
        { kind: "cylinder", radius: 0.05, length: 0.18, at: [0, 0, 0.12] }, // 連桿的銷
        { kind: "box", size: [0.08, BLADE - HEAD.h, 0.02], at: [0, BLADE / 2, 0], role: "strip" },
        ...Array.from({ length: 15 }, (_, i) => ({ kind: "box", size: [0.05, 0.05, 0.02], at: [-0.05, 0.25 + i * 0.15, 0], angle: 0.8 })),
        { kind: "box", size: [HEAD.w, HEAD.h, HEAD.d], at: [0, BLADE, 0], role: "crosshead" },
        { kind: "box", size: [0.06, HANGER - HEAD.h / 2, 0.06], at: [0, BLADE + (HANGER + HEAD.h / 2) / 2, 0] }, // 吊桿
        { kind: "cylinder", radius: 0.035, length: 0.16, at: [0, BLADE + HANGER, 0], role: "hangerPin" },
      ],
    },
    { id: "shackle", kind: "link", width: 0.09, thickness: 0.04 },
    { id: "springBar", kind: "rod", radius: BAR_R },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "blade",
  view: { direction: [0.08, 0.05, 1] },
  pose(theta) {
    const g = gigSaw(theta);
    const eye = g.top + HANGER;
    const bar = springBar(eye);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [g.pin[0], g.pin[1], 0.15], to: [0, g.low, 0.15] },
        blade: { position: [0, g.low, 0] },
        shackle: { from: bar.at(-1), to: [0, eye, 0] },
      },
      paths: { springBar: { points: bar, closed: false } },
      readouts: [],
    };
  },
  waivers: [],
};
