// 跳躍(間歇)運動的時序:純函式。
// 「推—落」:從動件被主動件上的銷推著走 push 這麼遠,到臨界點後突然自己往前落 fall 這麼遠、停住,
// 等銷追上來再推(第 64、66、67 種)。一個週期 = push + fall。
// 「頂起—落下」:主動件每經過一次,從動件被頂起再落回(第 63、76 種的撥爪與落板)。
import { smooth } from "./kit.js";

/** 推—落:主動量 v 時從動件的位置;rest0 為 v = 0 時從動件剛落定的位置(此時銷還要追 fall) */
export function pushAndFall(v, { push, fall, rest0 = 0 }) {
  const period = push + fall;
  const k = Math.floor(v / period);
  const u = v - k * period;
  return rest0 + k * period + Math.max(0, u - fall);
}

/** 主動量在一個週期內走到 u 時,是否處在「被推」的階段 */
export const pushing = (v, { push, fall }) => {
  const period = push + fall;
  return v - Math.floor(v / period) * period > fall;
};

/**
 * 頂起—落下的一個週期(u 在 [0, 1)):lift 期間緩緩升到 1,drop 期間快速落回 0,其餘時間為 0。
 * 回傳 { height, dropped }:dropped 是這個週期裡「落下」已完成的比例(0–1),用來推動星形輪、棘輪。
 */
export function liftAndDrop(u, { liftFrom, liftTo, dropTo }) {
  if (u < liftFrom) return { height: 0, dropped: 0 };
  if (u < liftTo) return { height: smooth((u - liftFrom) / (liftTo - liftFrom)), dropped: 0 };
  if (u < dropTo) {
    const f = smooth((u - liftTo) / (dropTo - liftTo));
    return { height: 1 - f, dropped: f };
  }
  return { height: 0, dropped: 1 };
}

/** 主動量 v、週期 period 的累計計數與週期內的位置 */
export const cycleOf = (v, period) => {
  const k = Math.floor(v / period);
  return { k, u: (v - k * period) / period };
};
