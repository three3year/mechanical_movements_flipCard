// 第 6 種:對固定在半圓扇形段上的槓桿施加擺動,繫在扇形段上的皮帶
// 把往復的旋轉運動傳給下方兩個皮帶輪。皮帶兩端繫在扇形段兩端、交叉而下繞過兩輪,
// 所以槓桿往一邊擺時,兩輪同向、與槓桿反向轉動。
import { Z, clamp, routeRope, beltTravel, wheelAngle, add } from "./kit.js";

const RANGE = [-0.32, 0.32];
const PIVOT = [0, 1.4, 0];
const SECTOR = 1.0;
const R = 0.5;
const LIFT = 0.05; // 皮帶畫在輪緣外側
const LEFT = { center: [-1.45, -1.5, 0], axis: Z, radius: R + LIFT, sense: -1 };
const RIGHT = { center: [1.45, -1.5, 0], axis: Z, radius: R + LIFT, sense: -1 };
const SECTOR_PATH = { center: PIVOT, axis: Z, radius: SECTOR + LIFT, sense: 1 };

const onSector = (a) => add(PIVOT, [(SECTOR + LIFT) * Math.cos(a), (SECTOR + LIFT) * Math.sin(a), 0]);

export default {
  figure: 6,
  parts: [
    { id: "lever", kind: "sectorLever", center: PIVOT, axis: Z, radius: SECTOR, barLength: 3.2, width: 0.25 },
    { id: "left", kind: "pulley", style: "spoked", center: LEFT.center, axis: Z, radius: R, width: 0.3 },
    { id: "right", kind: "pulley", style: "spoked", center: RIGHT.center, axis: Z, radius: R, width: 0.3 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE },
  pose(value) {
    const angle = clamp(value, ...RANGE);
    const travel = beltTravel(angle, SECTOR, 1);
    // 皮帶由扇形段左端出發,沿弧往下、交叉到右輪,經底部到左輪,再交叉回扇形段右端
    const belt = routeRope([
      { point: onSector(Math.PI + angle) },
      { circle: SECTOR_PATH },
      { circle: RIGHT },
      { circle: LEFT },
      { circle: SECTOR_PATH },
      { point: onSector(angle) },
    ]);
    return {
      parts: {
        lever: { angle },
        left: { angle: wheelAngle(travel, R, LEFT.sense) },
        right: { angle: wheelAngle(travel, R, RIGHT.sense) },
      },
      paths: { belt: { points: belt.points, closed: false } },
      readouts: [],
    };
  },
};
