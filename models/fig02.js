// 第 2 種:交叉皮帶使兩輪反向。從動軸上並排三個皮帶輪,中間固定、兩側鬆動;
// 開口與交叉皮帶同時掛著,哪一條在固定輪上,軸就往哪個方向轉——不必停下或反轉驅動端。
import { Z, routeBelt, beltTravel, wheelAngle, memo } from "./kit.js";

const DRUM = { center: [0, 1.6, 0], radius: 0.8, width: 1.7 };
const PULLEY_Y = -1.6;
const R = 0.72;
const SPACING = 0.52;
const LANES = { looseLeft: -SPACING, fixed: 0, looseRight: SPACING };

// 兩條皮帶在各狀態下所在的軸向位置(z)
const LAYOUT = {
  "crossed-on-fixed": { crossBelt: LANES.fixed, openBelt: LANES.looseLeft },
  "open-on-fixed": { openBelt: LANES.fixed, crossBelt: LANES.looseRight },
};

const circle = (y, radius, z, sense) => ({ center: [0, y, z], axis: Z, radius, sense });

const paths = memo((state) => {
  const { openBelt, crossBelt } = LAYOUT[state];
  return {
    openBelt: routeBelt([circle(DRUM.center[1], DRUM.radius, openBelt, 1), circle(PULLEY_Y, R, openBelt, 1)]),
    crossBelt: routeBelt([circle(DRUM.center[1], DRUM.radius, crossBelt, 1), circle(PULLEY_Y, R, crossBelt, -1)]),
  };
});

const pulley = (id, z, style) => ({
  id,
  kind: "pulley",
  style,
  center: [0, PULLEY_Y, z],
  axis: Z,
  radius: R,
  width: 0.36,
});

export default {
  figure: 2,
  parts: [
    { id: "drum", kind: "drum", center: DRUM.center, axis: Z, radius: DRUM.radius, width: DRUM.width },
    pulley("looseLeft", LANES.looseLeft, "disc"),
    pulley("fixed", LANES.fixed, "spoked"),
    pulley("looseRight", LANES.looseRight, "disc"),
    { id: "shaft", kind: "shaft", center: [0, PULLEY_Y, 0], axis: Z, radius: 0.06, length: 2.2 },
    { id: "openBelt", kind: "belt" },
    { id: "crossBelt", kind: "belt" },
  ],
  driver: { part: "drum", type: "rotation" },
  states: {
    options: [
      { id: "crossed-on-fixed", label: "交叉皮帶在固定輪上" },
      { id: "open-on-fixed", label: "開口皮帶在固定輪上" },
    ],
    initial: "crossed-on-fixed",
  },
  view: { direction: [0.5, 0.3, 1] },
  pose(angle, state = "crossed-on-fixed") {
    const travel = beltTravel(angle, DRUM.radius, 1); // 兩條皮帶都由同一個驅動筒帶動
    const onLane = { [LAYOUT[state].openBelt]: wheelAngle(travel, R, 1), [LAYOUT[state].crossBelt]: wheelAngle(travel, R, -1) };
    // 沒有皮帶的鬆動輪停著;鬆動輪就算在轉,也不傳給軸
    const lane = (z) => onLane[z] ?? 0;
    const route = paths(state);
    return {
      parts: {
        drum: { angle },
        looseLeft: { angle: lane(LANES.looseLeft) },
        fixed: { angle: lane(LANES.fixed) },
        looseRight: { angle: lane(LANES.looseRight) },
        shaft: { angle: lane(LANES.fixed) },
      },
      paths: {
        openBelt: { points: route.openBelt.points, closed: true, phase: travel },
        crossBelt: { points: route.crossBelt.points, closed: true, phase: travel },
      },
      readouts: [],
    };
  },
};
