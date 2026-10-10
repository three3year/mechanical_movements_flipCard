// 第 213 種:另一種同樣用途(限制上發條的圈數)的擋止裝置。下方的輪套在發條軸(方孔)上,帶動上方的擋輪;
// 擋輪只在下緣一段切有齒,其餘輪緣是完整的圓(齒頂高度),下輪的齒碰到那裡就推不動——擋止。
// 擋輪的輪圈套在一個圓轂上(原圖的內圓),輪圈上方從內圓到外緣切開一道直槽(推斷:槽讓輪圈有一點彈性,
// 套在轂上夾緊)。主動件是下輪。
// 推斷:兩輪的齒數(下輪原圖是鋸齒形,這裡用一般的齒形以便咬合);可轉的範圍由擋輪那段齒的齒數決定。
import { TAU, Z } from "./kit.js";
import { pedestal } from "./supports.js";
import { meshAngle } from "./gears.js";
import { shape, gearShape, gearProfile, gearSize, toothOutline, arcPoints } from "./shapes.js";
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

// 擋輪的輪圈(擋輪局部座標):外緣是只有那段齒的齒廓(其餘是齒頂高度的圓),內緣是半徑 RIN 的內圓;
// 原圖位置的正上方切開一道寬 SLOT 的直槽,從內圓一直通到外緣,所以輪圈是一個開口的環(一個多邊形,沒有孔)
const RIN = 0.62;
const SLOT = 0.12;
const { addendum, dedendum } = gearSize(UPPER.radius, NU);
const TIP = UPPER.radius + addendum;
const SLOT_AT = Math.PI / 2 - U0; // 原圖位置時朝正上方的方向
const ringOutline = (() => {
  const profile = gearProfile({ teeth: NU, radius: UPPER.radius, has: (i) => TEETH.includes(i), blank: "tip" });
  const rel = ([x, y]) => (((Math.atan2(y, x) - SLOT_AT) % TAU) + TAU) % TAU; // 從槽逆時針量的角度
  const [ho, hi] = [Math.asin(SLOT / 2 / TIP), Math.asin(SLOT / 2 / RIN)];
  const outer = profile.filter((p) => rel(p) > ho && rel(p) < TAU - ho).sort((a, b) => rel(a) - rel(b));
  const at = (r, a) => [r * Math.cos(SLOT_AT + a), r * Math.sin(SLOT_AT + a)];
  // 槽左壁的外端 → 外緣逆時針繞一圈到槽右壁 → 內圓順時針繞回槽左壁
  return [at(TIP, ho), ...outer, at(TIP, -ho), ...arcPoints(RIN, SLOT_AT - hi + TAU, SLOT_AT + hi)];
})();
/** 下輪轉 theta 時,下輪的齒是否頂到擋輪的輪緣(正常咬合時齒頂只互相擦到 0.001 左右,頂到輪緣就深得多) */
export const touching = (theta) => penetrationDepth(placeOutline(lowerShape.outline, LOWER.center, theta), placeOutline(ringOutline, UPPER.center, upperAngle(theta))) > 0.004;
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
      kind: "group",
      spin: TIP + dedendum * 0.2,
      pieces: [
        { kind: "plate", shape: shape(ringOutline), thickness: 0.2 },
        // 圓轂:前後各比輪圈凸出 0.11,內圓的界線描得出來;中間的孔套在固定軸上
        { kind: "cylinder", radius: RIN, inner: 0.1, length: 0.42 },
        { kind: "plate", shape: shape(toothOutline(UPPER, TEETH[0])), thickness: 0.216, accent: true },
      ],
    },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [LOWER.center, UPPER.center].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.61, at: [x, y, -0.205] },
        ...pedestal({ at: [x, y], z: -0.51, bore: 0.1, floor: -3.75, depth: 0.2 }),
      ]),
    },
  ],
  // 動力重演:擋輪在軸上靠摩擦定位,只推下輪(從一端的擋止轉到另一端);擋輪由下輪的齒推著轉,
  // 轉到盡頭時下輪的齒頂到擋輪完整的輪緣(擋止的那一刻,主動量的範圍就停在這裡)
  replay: {
    free: { upper: { hold: true } },
    ignore: [["upper", "bearings"]], // 輪套在固定軸上(軸在輪轂的孔裡)
    expect: [
      { at: 0, part: "upper", label: "下輪轉到中間,擋輪被齒推著轉了一半" },
      { part: "upper", label: "下輪轉到另一端的擋止,擋輪轉到盡頭", quote: "另一種用於相同目的的擋止裝置" },
    ],
  },
  driver: { part: "lower", type: "rotation", range: [-LIMIT, LIMIT] },
  target: "upper",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { lower: { angle: theta }, upper: { angle: upperAngle(theta) } }, readouts: [] };
  },
};
