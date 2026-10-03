// 跳躍(間歇)運動的時序:純函式。
// 「推—落」:從動件被主動件上的銷推著走 push 這麼遠,到臨界點後突然自己往前落 fall 這麼遠、停住,
// 等銷追上來再推(第 64、66、67 種)。一個週期 = push + fall。
// 「頂起—落下」:主動件每經過一次,從動件被頂起再落回(第 63、76 種的撥爪與落板)。
import { smooth } from "./kit.js";

/** 落下的過程(0 → 1):像從頂點放開的擺——起步慢、越來越快,到底停住 */
export const falling = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return 0.5 - 0.5 * Math.cos(Math.PI * x ** 1.7);
};

/**
 * 推—落:主動量 v 時從動件的位置;rest0 為 v = 0 時從動件剛落定的位置(此時銷還要追 fall)。
 * drop:落下的過程佔主動量多少(0 為瞬間落下);落下期間從動件在銷前面,drop 要小於 fall。
 */
export function pushAndFall(v, { push, fall, rest0 = 0, drop = 0 }) {
  const period = push + fall;
  const k = Math.floor(v / period);
  const u = v - k * period;
  const landed = rest0 + k * period;
  if (drop > 0 && u < drop) return landed - fall + fall * falling(u / drop);
  return landed + Math.max(0, u - fall);
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

const TWO_PI = Math.PI * 2;
/** 擺線形的 0→1 過渡(起止速度為零,像撥爪推凸柱那樣平順地起動、停住) */
export const cycloid = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t - Math.sin(TWO_PI * t) / TWO_PI;
};

/**
 * 每轉一圈前進一步(單齒輪、撥爪撥凸柱):驅動角 theta 落在 [from, from + span] 時從動件前進 step,
 * 其餘時間被鎖住不動。回傳相對於 theta = from 之前的累計前進量。
 */
export function indexStep(theta, { from, span, step }) {
  const k = Math.floor((theta - from) / TWO_PI);
  const u = theta - from - k * TWO_PI;
  return (k + (u < span ? cycloid(u / span) : 1)) * step;
}

/**
 * 缺齒輪:接觸點在缺齒輪的局部角 contact − theta(theta 增加時往回掃);
 * 有齒的扇區是局部角 [start, start + len]。回傳到 theta 為止「有齒經過接觸點」的累計角度,
 * 從 theta0 = contact − start − len(第一次開始咬合)算起。
 */
export function sectorEngaged(theta, { contact, start, len }) {
  const t = theta - (contact - start - len);
  const k = Math.floor(t / TWO_PI);
  return k * len + Math.min(t - k * TWO_PI, len);
}
