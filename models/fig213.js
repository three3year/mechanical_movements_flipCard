// 第 213 種:另一種同樣用途(限制上發條的圈數)的擋止裝置。下方的輪套在發條軸(方孔)上,帶動上方的擋輪;
// 擋輪只在下緣一段切有齒,其餘輪緣是完整的圓(齒頂高度),下輪的齒碰到那裡就推不動——擋止。
// 擋輪上方的直槽與內圓是原圖的樣子(推斷:槽讓擋輪有一點彈性)。主動件是下輪。
// 推斷:兩輪的齒數(下輪原圖是鋸齒形,這裡用一般的齒形以便咬合);可轉的範圍由擋輪那段齒的齒數決定。
import { TAU, Z } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, rect, gearShape } from "./shapes.js";
import { penetrationDepth, placeOutline } from "./contact.js";

const NL = 18;
const NU = 19;
const C = 2.05;
const PITCH = (TAU * C) / (NL + NU);
const LOWER = { center: [0, -C, 0], axis: Z, teeth: NL, radius: (NL * PITCH) / TAU };
const UPPER = { center: [0, 0, 0], axis: Z, teeth: NU, radius: (NU * PITCH) / TAU };
const TOOTHED = 5;
const U0 = meshAngle(LOWER, UPPER, 0);
// 擋輪在下緣(朝下輪)那 5 個齒的編號
const bottom = (-Math.PI / 2 - U0) / ((TAU / NU));
const FIRST = Math.round(bottom) - Math.floor(TOOTHED / 2);
const TEETH = Array.from({ length: TOOTHED }, (_, i) => (((FIRST + i) % NU) + NU) % NU);
/** 下輪轉 theta:擋輪的轉角 */
export const upperAngle = (theta) => meshAngle(LOWER, UPPER, theta);

// 下輪可轉的範圍:由幾何算——下輪的齒走到擋輪那段齒的盡頭,碰到齒頂高度的輪緣(階)就停住。
// 擋輪 5 齒之間只有 4 個齒槽,下輪在原圖位置時兩齒各在中間兩個齒槽裡,所以兩邊各只能再走一個多齒槽
// (不是「那段齒的兩端各留半齒」——那樣末端的齒會整個嵌進輪緣裡)。
const lowerShape = gearShape({ teeth: NL, radius: LOWER.radius });
const upperShape = gearShape({ teeth: NU, radius: UPPER.radius, mask: (i) => TEETH.includes(i), blank: "tip" });
/** 下輪轉 theta 時,下輪的齒是否頂到擋輪的輪緣(正常咬合時齒頂只互相擦到 0.001 左右,頂到輪緣就深得多) */
export const touching = (theta) => penetrationDepth(placeOutline(lowerShape.outline, LOWER.center, theta), placeOutline(upperShape.outline, UPPER.center, upperAngle(theta))) > 0.004;
const LIMIT = (() => {
  let lo = 0;
  let hi = (TOOTHED * TAU) / NL;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (touching(mid)) hi = mid;
    else lo = mid;
  }
  return lo;
})();
export const geometry = { NL, NU, TOOTHED, LIMIT };

export default {
  figure: 213,
  parts: [
    {
      id: "lower",
      kind: "gear",
      center: LOWER.center,
      teeth: NL,
      radius: LOWER.radius,
      width: 0.22,
      pieces: [{ kind: "box", size: [0.3, 0.3, 0.35], accent: true }],
    },
    {
      id: "upper",
      kind: "gear",
      teeth: NU,
      radius: UPPER.radius,
      width: 0.2,
      toothed: TEETH,
      blank: "tip",
      hub: false,
      bore: 0.08,
      pieces: [
        { kind: "plate", shape: shape(rect(0.16, 0.62, 0, UPPER.radius - 0.2)), thickness: 0.22, at: [0, 0, 0.02] },
        { kind: "cylinder", radius: 0.66, inner: 0.6, length: 0.24 },
      ],
    },
  ],
  driver: { part: "lower", type: "rotation", range: [-LIMIT, LIMIT] },
  target: "upper",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { lower: { angle: theta }, upper: { angle: upperAngle(theta) } }, readouts: [] };
  },
};
