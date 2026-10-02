// 第 9、10 種共用:兩個方向相反的錐形皮帶輪,皮帶沿錐面移到不同位置,轉速逐漸改變。
// 上下兩輪在同一位置的半徑和固定,皮帶長度不變。
import { X, routeBelt, beltTravel, wheelAngle, memo } from "./kit.js";

const LENGTH = 2.2;
const TOP_Y = 1.6;
const BOTTOM_Y = -1.6;
const SAMPLES = 20;
const POSITIONS = [0.1, 0.3, 0.5, 0.7, 0.9];
const LABELS = ["左端", "偏左", "中央", "偏右", "右端"];

/** driverRadius(f):f 由 0(左端)到 1(右端);sum:上下兩輪半徑和 */
export function conePair({ figure, driverRadius, sum }) {
  const drivenRadius = (f) => sum - driverRadius(f);
  const profile = (radius) => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, radius(i / SAMPLES)]);
  const states = POSITIONS.map((f, i) => ({ id: `pos${i + 1}`, label: LABELS[i], f }));
  const at = (state) => states.find((s) => s.id === state).f;

  const paths = memo((state) => {
    const f = at(state);
    const x = (f - 0.5) * LENGTH;
    return routeBelt([
      { center: [x, TOP_Y, 0], axis: X, radius: driverRadius(f), sense: 1 },
      { center: [x, BOTTOM_Y, 0], axis: X, radius: drivenRadius(f), sense: 1 },
    ]);
  });

  return {
    figure,
    parts: [
      { id: "driver", kind: "cone", center: [0, TOP_Y, 0], axis: X, length: LENGTH, profile: profile(driverRadius) },
      { id: "driven", kind: "cone", center: [0, BOTTOM_Y, 0], axis: X, length: LENGTH, profile: profile(drivenRadius) },
      { id: "topShaft", kind: "shaft", center: [0, TOP_Y, 0], axis: X, radius: 0.08, length: LENGTH + 0.9 },
      { id: "bottomShaft", kind: "shaft", center: [0, BOTTOM_Y, 0], axis: X, radius: 0.08, length: LENGTH + 0.9 },
      { id: "belt", kind: "belt" },
    ],
    driver: { part: "driver", type: "rotation" },
    states: { options: states.map(({ id, label }) => ({ id, label })), initial: "pos3" },
    view: { direction: [0.35, 0.25, 1] },
    pose(angle, state = "pos3") {
      const f = at(state);
      const travel = beltTravel(angle, driverRadius(f), 1);
      const driven = wheelAngle(travel, drivenRadius(f), 1);
      return {
        parts: {
          driver: { angle },
          topShaft: { angle },
          driven: { angle: driven },
          bottomShaft: { angle: driven },
        },
        paths: { belt: { points: paths(state).points, closed: true, phase: travel } },
        readouts: [],
      };
    },
  };
}
