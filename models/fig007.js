// 第 7 種:嚙合、脫離與反轉左側直立軸。下方軸上三個皮帶輪:
// 左輪固定在空心軸 b 上帶動斜齒輪 B,右輪固定在 b 內的軸 a 上帶動斜齒輪 A,中輪鬆動。
// A、B 從兩側嚙合直立軸上的齒輪,所以皮帶在左輪或右輪時直立軸轉向相反,在中輪時不轉。
// 結構推斷:原圖下方水平軸架在兩個拱形軸承座(A 外側與 B、皮帶輪之間)上,直立軸 C 往上伸出圖外;
// 這裡補上三個軸承座(左端、B 與皮帶輪之間、右端)、連接它們的底板,以及直立軸上方的軸承
// (從底板後方立一支柱,伸一支臂到軸上套一個軸承環),讓直立軸不是懸空的。不改任何傳動比。
import { X, Y, routeBelt, beltTravel, wheelAngle, memo } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT_Y = -1.4;
const DRUM = { center: [2.0, 2.0, 0], radius: 0.5, width: 1.7 };
const R = 0.5;
const PULLEY_X = { left: 1.5, middle: 2.0, right: 2.5 };
const GEAR = { radius: 0.42, height: 0.3, offset: 0.52 };
const C_X = -1.0;

const paths = memo((state) => {
  const x = PULLEY_X[state];
  return routeBelt([
    { center: [x, DRUM.center[1], 0], axis: X, radius: DRUM.radius, sense: 1 },
    { center: [x, SHAFT_Y, 0], axis: X, radius: R, sense: 1 },
  ]);
});

const pulley = (id, state, style) => ({
  id,
  kind: "pulley",
  style,
  center: [PULLEY_X[state], SHAFT_Y, 0],
  axis: X,
  radius: R,
  width: 0.4,
});

const gear = (id, center, axis, extra) => ({
  id,
  kind: "bevel",
  center,
  axis,
  radius: GEAR.radius,
  height: GEAR.height,
  ...extra,
});

const C_CENTER = [C_X, SHAFT_Y + GEAR.offset, 0];
const SHAFT_C_TOP = 1.6;

// 機架:底板、三個拱形軸承座(側面輪廓在 yz 平面,軸孔在原點)、直立軸的上軸承
const BASE_TOP = -2.09;
const pedestal = (bore) =>
  shape([[-0.45, BASE_TOP - SHAFT_Y], [0.45, BASE_TOP - SHAFT_Y], ...arcPoints(0.3, -0.4, Math.PI + 0.4)], [circle(bore).reverse()]);
const bearing = (x, bore) => ({ kind: "plate", axis: X, shape: pedestal(bore), thickness: 0.2, at: [x, SHAFT_Y, 0] });
const C_BEARING_Y = 1.2;
const POST_Z = -0.7;

export default {
  figure: 7,
  parts: [
    { id: "drum", kind: "drum", center: DRUM.center, axis: X, radius: DRUM.radius, width: DRUM.width },
    pulley("pulleyLeft", "left", "spoked"),
    pulley("pulleyMiddle", "middle", "disc"),
    pulley("pulleyRight", "right", "spoked"),
    {
      id: "shaftA",
      kind: "shaft",
      center: [0.5, SHAFT_Y, 0],
      axis: X,
      radius: 0.06,
      length: 5.0, // 兩端伸進左右軸承座
      label: "a",
      labelOffset: [2.3, 0.22, 0],
    },
    {
      id: "shaftB",
      kind: "shaft",
      center: [0.7, SHAFT_Y, 0],
      axis: X,
      radius: 0.11,
      length: 2.1,
      label: "b",
      labelOffset: [0.15, 0.3, 0],
    },
    // 齒輪的 axis 指向錐尖(朝直立軸)
    gear("gearA", [C_X - GEAR.offset, SHAFT_Y, 0], X, { label: "A", labelOffset: [-0.25, 0.6, 0] }),
    gear("gearB", [C_X + GEAR.offset, SHAFT_Y, 0], [-1, 0, 0], { label: "B", labelOffset: [0.25, 0.6, 0] }),
    gear("gearC", C_CENTER, [0, -1, 0]),
    {
      id: "shaftC",
      kind: "shaft",
      center: [C_X, (C_CENTER[1] + SHAFT_C_TOP) / 2, 0],
      axis: Y,
      radius: 0.07,
      length: SHAFT_C_TOP - C_CENTER[1],
      marker: true,
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.3, 0.12, 1.0], at: [0.5, BASE_TOP - 0.06, 0] }, // 底板
        bearing(-1.85, 0.1), // 左端:軸 a
        bearing(0.4, 0.15), // B 與皮帶輪之間:空心軸 b
        bearing(2.9, 0.1), // 右端:軸 a
        // 直立軸的上軸承:底板後方的立柱、伸到軸上的臂、套在軸上的軸承環
        { kind: "box", size: [0.22, C_BEARING_Y + 0.15 - BASE_TOP, 0.22], at: [C_X, (C_BEARING_Y + 0.15 + BASE_TOP) / 2, POST_Z] },
        { kind: "box", size: [0.2, 0.2, -POST_Z], at: [C_X, C_BEARING_Y, POST_Z / 2] },
        { kind: "cylinder", axis: Y, radius: 0.18, inner: 0.09, length: 0.3, at: [C_X, C_BEARING_Y, 0] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "drum", type: "rotation" },
  target: "gearC", // 直立軸的齒輪
  states: {
    options: [
      { id: "left", label: "左輪" },
      { id: "middle", label: "中輪" },
      { id: "right", label: "右輪" },
    ],
    initial: "middle",
  },
  view: { direction: [0.35, 0.45, 1] },
  pose(angle, state = "middle") {
    const travel = beltTravel(angle, DRUM.radius, 1);
    const belted = wheelAngle(travel, R, 1); // 皮帶所在那個輪的轉角(繞 +x)
    // 以繞 +x 量 A、B,繞 +y 量直立軸 C;等大的斜齒輪:C = −B,A = −B
    let b = 0;
    if (state === "left") b = belted;
    if (state === "right") b = -belted;
    const a = -b;
    const c = -b;
    return {
      parts: {
        drum: { angle },
        pulleyLeft: { angle: b },
        pulleyMiddle: { angle: state === "middle" ? belted : 0 },
        pulleyRight: { angle: a },
        shaftA: { angle: a },
        shaftB: { angle: b },
        gearA: { angle: a },
        gearB: { angle: -b }, // 軸向朝 −x
        gearC: { angle: -c }, // 軸向朝 −y
        shaftC: { angle: c },
      },
      paths: { belt: { points: paths(state).points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
