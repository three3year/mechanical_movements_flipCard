// 第 227–229 種共用:鍊條掛在一個鏈輪上,兩端往下垂。鏈輪轉動時鍊條跟著走,
// 一側上升、一側下降;鍊條行進量 = 鏈輪轉角 × 鏈節銷所在圓的半徑(不計多邊形效應)。
import { Z, routeRope, beltTravel } from "./kit.js";

/** pins:鏈節銷所在圓的半徑;left、right:兩端垂下的位置;路徑由左端繞過頂部到右端(順時針繞輪) */
export function chainOver({ center = [0, 0, 0], axis = Z, pins, left, right, normal }) {
  const circle = { center, axis, radius: pins, sense: -1 };
  // 路徑上的鏈節銷就在 pins 圓上
  const route = routeRope([{ point: left }, { circle }, { point: right }]);
  return {
    route,
    /** 鏈輪轉 angle(繞 axis 逆時針為正)時鍊條沿路徑的行進量 */
    travel: (angle) => beltTravel(angle, pins, circle.sense),
    normal: normal ?? axis,
  };
}
