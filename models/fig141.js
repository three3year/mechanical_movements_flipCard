// 第 141 種:無端帶鋸。帶鋸繞過上下兩個皮帶輪,下輪連續旋轉時,鋸帶穿過工作台的那一段(直線部分)連續往下走。
// 主動件是下輪。
import { Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";
import { shape } from "./shapes.js";

const R = 0.85;
const TOP = { center: [0.6, 3.0, 0], axis: Z, radius: R, sense: -1 };
const BOTTOM = { center: [0.6, -1.65, 0], axis: Z, radius: R, sense: -1 };
const band = routeBelt([TOP, BOTTOM]);

/** 下輪轉 angle:鋸帶前進的距離 */
export const bandTravel = (angle) => beltTravel(angle, R, -1);

const wheel = (id, c) => ({ id, kind: "pulley", style: "spoked", spokes: 5, center: c.center, radius: R, width: 0.16 });

export default {
  figure: 141,
  parts: [
    wheel("bottom", BOTTOM),
    wheel("top", TOP),
    { id: "band", kind: "belt", radius: 0.03 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-2.9, -2.6], [-1.4, -2.6], [-0.4, 1.4], [-0.15, 2.6], [0.0, 3.6], [-0.4, 3.75], [-1.0, 3.2], [-1.6, 1.8], [-2.1, 0.0]]), thickness: 0.3, at: [0, 0, -0.35] },
        { kind: "box", size: [3.6, 0.1, 1.4], at: [2.3, -0.12, 0] },
        { kind: "box", size: [0.45, 1.9, 0.45], at: [2.3, -1.6, 0] },
        { kind: "box", size: [5.6, 0.12, 1.2], at: [0.4, -2.65, 0] },
      ],
    },
  ],
  driver: { part: "bottom", type: "rotation" },
  target: "top", // 鋸帶是路徑零件不上色,標它帶動的上輪
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const travel = bandTravel(angle);
    return {
      parts: { bottom: { angle }, top: { angle: wheelAngle(travel, R, -1) } },
      paths: { band: { points: band.points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
