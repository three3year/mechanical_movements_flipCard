// 第 58–62 種共用:上方的鼓輪(或皮帶輪)以皮帶帶動下方軸上並排的幾個皮帶輪;
// 狀態是皮帶在哪一個輪上。所有軸都沿 x,皮帶在 yz 平面內。
import { X, routeBelt, beltTravel, wheelAngle, memo } from "./kit.js";

/** 沿 x 的皮帶輪(或鼓輪)零件 */
export const pulleyOnX = (id, x, y, radius, width, extra = {}) => ({
  id,
  kind: "pulley",
  style: "disc",
  axis: X,
  center: [x, y, 0],
  radius,
  width,
  ...extra,
});

/** 皮帶路徑:上輪 (x, yTop, rTop) 到下輪 (x, yBottom, rBottom);crossed 為交叉皮帶 */
export const beltBetween = memo((key) => {
  const [x, yTop, rTop, yBottom, rBottom, crossed] = JSON.parse(key);
  return routeBelt([
    { center: [x, yTop, 0], axis: X, radius: rTop, sense: 1 },
    { center: [x, yBottom, 0], axis: X, radius: rBottom, sense: crossed ? -1 : 1 },
  ]);
});
export const belt = (x, yTop, rTop, yBottom, rBottom, crossed = false) => beltBetween(JSON.stringify([x, yTop, rTop, yBottom, rBottom, crossed]));

/** 上輪轉 angle 時,皮帶帶動的下輪轉角(開口皮帶同向、交叉皮帶反向) */
export const driven = (angle, rTop, rBottom, crossed = false) => wheelAngle(beltTravel(angle, rTop, 1), rBottom, crossed ? -1 : 1);
export const travel = (angle, rTop) => beltTravel(angle, rTop, 1);
