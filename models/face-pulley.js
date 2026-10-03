// 第 254–259 種共用:裝在橫軸上的單一個皮帶輪(或鏈輪),從輪緣正面看(原圖的畫法)。
// 這些插圖本身是靜止的器具;模型重現它被使用時的動作(推斷):皮帶(或繩、鍊條)
// 繞過輪的後半圈,兩股往前方伸出,轉動輪子,皮帶跟著走。
import { X, routeRope, beltTravel } from "./kit.js";

const REACH = [2.9, 1.5]; // 兩股的端點:上下各伸出這麼高、往前這麼遠

/**
 * wheel:輪的零件定義(不含 id、axis);seat:皮帶中心線所在的半徑;
 * strand:皮帶的路徑零件({ kind, radius? } 或鍊條定義)。輪的軸沿 X,皮帶在 yz 平面。
 */
export function facePulley({ figure, wheel, seat, strand }) {
  // 皮帶從上方前端往後繞過輪的後半圈,回到下方前端(兩股斜向上下伸出,不擋住輪緣正面);上股往後走時輪繞 X 負向轉(sense −1)
  const circle = { center: [0, 0, 0], axis: X, radius: seat, sense: -1 };
  const route = routeRope([{ point: [0, REACH[0], REACH[1]] }, { circle }, { point: [0, -REACH[0], REACH[1]] }]);
  const travel = (angle) => beltTravel(angle, seat, circle.sense);
  return {
    travel,
    route,
    def: {
      figure,
      parts: [{ id: "wheel", ...wheel, axis: X, center: [0, 0, 0] }, { id: "strand", ...strand }],
      driver: { part: "wheel", type: "rotation" },
      view: { direction: [0.08, 0.32, 1] },
      pose(angle) {
        return {
          parts: { wheel: { angle } },
          paths: { strand: { points: route.points, closed: false, phase: travel(angle) } },
          readouts: [],
        };
      },
    },
  };
}

/** 輪上一起轉的橫軸與兩側輪轂(原圖輪兩側的方形輪轂與伸出的軸) */
export const shaftPieces = (hub, hubLength, width) => [
  { kind: "cylinder", radius: 0.2, length: 4.6 },
  { kind: "cylinder", radius: hub, length: hubLength, at: [0, 0, width / 2 + hubLength / 2 - 0.02] },
  { kind: "cylinder", radius: hub, length: hubLength, at: [0, 0, -width / 2 - hubLength / 2 + 0.02] },
];
