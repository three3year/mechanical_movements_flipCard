// 第 8 種:車床等工具機的速度皮帶輪。兩組階梯輪方向相反,皮帶換到哪一段,
// 從動輪轉速就依那一段的半徑比改變(階梯半徑和相同,皮帶長度不變)。
import { X, routeBelt, beltTravel, wheelAngle, memo } from "./kit.js";

const RADII = [0.36, 0.5, 0.64, 0.78];
const STEP = 0.36;
const TOP_Y = 1.7;
const BOTTOM_Y = -1.7;
const steps = (radii) => radii.map((radius) => ({ radius, width: STEP }));
const DRIVER_STEPS = steps(RADII);
const DRIVEN_STEPS = steps([...RADII].reverse());
const stepX = (i) => (i - (RADII.length - 1) / 2) * STEP;

const STATES = RADII.map((_, i) => ({ id: `step${i + 1}`, label: `第 ${i + 1} 段` }));
const indexOf = (state) => STATES.findIndex((s) => s.id === state);

const paths = memo((state) => {
  const i = indexOf(state);
  return routeBelt([
    { center: [stepX(i), TOP_Y, 0], axis: X, radius: DRIVER_STEPS[i].radius, sense: 1 },
    { center: [stepX(i), BOTTOM_Y, 0], axis: X, radius: DRIVEN_STEPS[i].radius, sense: 1 },
  ]);
});

export default {
  figure: 8,
  parts: [
    { id: "driver", kind: "stepped", center: [0, TOP_Y, 0], axis: X, steps: DRIVER_STEPS },
    { id: "driven", kind: "stepped", center: [0, BOTTOM_Y, 0], axis: X, steps: DRIVEN_STEPS },
    { id: "topShaft", kind: "shaft", center: [0, TOP_Y, 0], axis: X, radius: 0.08, length: 2.6 },
    { id: "bottomShaft", kind: "shaft", center: [0, BOTTOM_Y, 0], axis: X, radius: 0.08, length: 2.6 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  target: "driven", // 變速的從動階梯輪
  states: { options: STATES, initial: "step2" },
  view: { direction: [0.35, 0.25, 1] },
  pose(angle, state = "step2") {
    const i = indexOf(state);
    const travel = beltTravel(angle, DRIVER_STEPS[i].radius, 1);
    const driven = wheelAngle(travel, DRIVEN_STEPS[i].radius, 1);
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
