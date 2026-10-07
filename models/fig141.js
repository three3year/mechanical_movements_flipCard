// 第 141 種:無端帶鋸。帶鋸繞過上下兩個皮帶輪,下輪連續旋轉時,鋸帶穿過工作台的那一段(直線部分)連續往下走。
// 主動件是下輪。
// 上輪的軸裝在機架頂端往前伸的臂上,下輪的軸裝在底座上的軸承座裡(照原圖:上輪掛在 C 形機架頂端;
// 臂與軸承座的樣子是推斷)。
import { Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";
import { shape } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = 0.85;
const TOP = { center: [0.6, 3.0, 0], axis: Z, radius: R, sense: -1 };
const BOTTOM = { center: [0.6, -1.65, 0], axis: Z, radius: R, sense: -1 };
const band = routeBelt([TOP, BOTTOM]);

/** 下輪轉 angle:鋸帶前進的距離 */
export const bandTravel = (angle) => beltTravel(angle, R, -1);

const wheel = (id, c) => ({
  id,
  kind: "pulley",
  style: "spoked",
  spokes: 5,
  center: c.center,
  radius: R,
  width: 0.16,
  pieces: [{ kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.2] }], // 軸:往後伸進臂 / 軸承座
});

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
        // 鋸台:鋸帶從台面的一道縫穿過(台面分成左右兩塊,後緣相連)
        { kind: "box", size: [0.88, 0.1, 1.4], at: [0.94, -0.12, 0] },
        { kind: "box", size: [2.58, 0.1, 1.4], at: [2.81, -0.12, 0] },
        { kind: "box", size: [3.6, 0.1, 0.4], at: [2.3, -0.12, -0.5] },
        { kind: "box", size: [0.45, 1.9, 0.45], at: [2.3, -1.6, 0] },
        { kind: "box", size: [5.6, 0.12, 1.2], at: [0.4, -2.65, 0] },
        { kind: "box", size: [1.15, 0.4, 0.3], at: [0.3, TOP.center[1], -0.35] }, // 頂端往前伸、撐著上輪軸的臂
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.3, at: [TOP.center[0], TOP.center[1], -0.35] },
        ...pedestal({ at: [BOTTOM.center[0], BOTTOM.center[1]], z: -0.35, bore: 0.1, floor: -2.59 }),
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
