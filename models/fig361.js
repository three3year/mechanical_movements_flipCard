// 第 361 種:簡易的皮帶輪離合器。下方軸上固定一根銷(銷臂),皮帶輪鬆套在軸上,側面也有一根銷;以槓桿把皮帶輪沿軸推動,
// 讓兩根銷碰在一起(接合)或分開(脫開)。上方軸由右邊的曲柄轉動(左端有飛輪),經皮帶帶動下方的皮帶輪。
// 接合時下方軸跟著皮帶輪轉;脫開時皮帶輪在軸上空轉,下方軸停住。主動件是上方的曲柄;狀態按鈕切換接合 / 脫開。
// 推斷:脫開時下方軸停在銷剛分開的位置;兩輪同大。
import { X, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const UP = { center: [0.15, 1.6, 0], r: 0.6 };
const LOW = { center: [0.15, -0.8, 0], r: 0.6 };
export const SHIFT = 0.35; // 皮帶輪被槓桿推動的距離

/** 曲柄轉 a、狀態 → 皮帶輪與下方軸的轉角 */
export function clutch(a, state = "on") {
  const travel = beltTravel(a, UP.r, 1);
  const pulley = wheelAngle(travel, LOW.r, 1);
  return { travel, pulley, shaft: state === "on" ? pulley : 0 };
}


export default {
  figure: 361,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 4.6, 0.4], at: [-1.7, 0.4, -0.2] },
        { kind: "box", size: [0.3, 4.6, 0.4], at: [1.7, 0.4, -0.2] },
      ],
    },
    {
      id: "upper",
      kind: "group",
      axis: X,
      center: UP.center,
      spin: UP.r,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.4 },
        { kind: "cylinder", radius: UP.r, length: 0.35, mark: true },
        { kind: "cylinder", radius: UP.r + 0.08, length: 0.05, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: UP.r + 0.08, length: 0.05, at: [0, 0, -0.2] },
        // 左端飛輪、右端曲柄
        { kind: "cylinder", radius: 0.9, inner: 0.75, length: 0.18, at: [0, 0, -2.3] },
        { kind: "box", size: [0.1, 0.7, 0.1], at: [0, -0.35, 2.15] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [0, -0.7, 2.3], accent: true },
      ],
    },
    {
      id: "lowerShaft",
      kind: "group",
      axis: X,
      center: LOW.center,
      spin: 0.5,
      spinOffset: -0.9,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.4 },
        // 固定在軸上的銷臂
        { kind: "box", size: [0.1, 0.55, 0.1], at: [0, 0.3, -0.75], accent: true },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0, 0.5, -0.6] },
      ],
    },
    {
      id: "pulley",
      kind: "group",
      axis: X,
      spin: LOW.r,
      pieces: [
        { kind: "cylinder", radius: LOW.r, length: 0.35, mark: true },
        { kind: "cylinder", radius: LOW.r + 0.08, length: 0.05, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: LOW.r + 0.08, length: 0.05, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.05, length: 0.25, at: [0, 0.5, -0.3] },
        { kind: "cylinder", radius: 0.16, length: 0.6, at: [0, 0, 0.35] },
      ],
    },
    // 推動皮帶輪的彎曲槓桿(右下)
    { id: "lever", kind: "group", center: [0.95, -0.8, 0.4], arrow: false, pieces: [{ kind: "box", size: [0.12, 1.8, 0.12], at: [0, -0.7, 0] }, { kind: "cylinder", radius: 0.08, length: 0.3, at: [0, -1.55, 0] }] },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "upper", type: "rotation" },
  target: "lowerShaft", // 接合時才跟著轉的下方軸
  states: {
    initial: "on",
    options: [
      { id: "on", label: "接合" },
      { id: "off", label: "脫開" },
    ],
  },
  view: { direction: [0.6, 0.15, 1] },
  pose(a, state = "on") {
    const c = clutch(a, state);
    const dx = state === "on" ? 0 : SHIFT;
    const x = LOW.center[0] + dx;
    const path = routeBelt([
      { center: UP.center, axis: X, radius: UP.r, sense: 1 },
      { center: [x, LOW.center[1], 0], axis: X, radius: LOW.r, sense: 1 },
    ]);
    return {
      parts: {
        upper: { angle: a },
        pulley: { position: [x, LOW.center[1], 0], angle: c.pulley },
        lowerShaft: { angle: c.shaft },
        lever: { position: [0.95 + dx, -0.8, 0.4] },
      },
      paths: { belt: { points: path.points, closed: true, phase: c.travel } },
      readouts: [],
    };
  },
};
