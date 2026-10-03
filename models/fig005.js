// 第 5 種:與第 1 種類似,加一個可移動的張緊皮帶輪 B。
// 壓向皮帶時消除鬆弛、傳遞運動;放開時皮帶過鬆,從動輪不轉。
import { Z, routeBelt, beltTravel, wheelAngle, memo, add } from "./kit.js";

const top = { center: [0.25, 1.6, 0], axis: Z, radius: 0.95, sense: 1 };
const bottom = { center: [0.25, -1.75, 0], axis: Z, radius: 0.55, sense: 1 };
const B_RADIUS = 0.26;
const B_AT = { pressed: [-0.6, 0, 0], released: [-1.25, 0, 0] };
const ARM_OFFSET = [-0.42, -0.21, -0.26]; // B 的操作桿,跟著 B 移動;在輪的背面,端頭接在輪軸上(原圖桿畫在輪前,照畫會穿過輪身)

// 壓下時 B 從外側把皮帶往內推;放開時皮帶鬆垂、向外鼓出
const slack = { center: [-0.48, 0, 0], axis: Z, radius: B_RADIUS, sense: 1 };
const paths = memo((state) =>
  state === "pressed"
    ? routeBelt([top, { center: B_AT.pressed, axis: Z, radius: B_RADIUS, sense: -1 }, bottom])
    : routeBelt([top, slack, bottom]),
);

export default {
  figure: 5,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: top.center, axis: Z, radius: top.radius, width: 0.3 },
    { id: "driven", kind: "pulley", style: "spoked", center: bottom.center, axis: Z, radius: bottom.radius, width: 0.3 },
    {
      id: "tensioner",
      kind: "pulley",
      style: "disc",
      center: B_AT.pressed,
      axis: Z,
      radius: B_RADIUS,
      width: 0.26,
      label: "B",
      labelOffset: [-0.2, 0.42, 0],
    },
    { id: "arm", kind: "bar", center: add(B_AT.pressed, ARM_OFFSET), axis: [-0.894, -0.447, 0], radius: 0.05, length: 0.95 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  target: "driven", // 靠張緊輪才被帶動的從動輪
  states: {
    options: [
      { id: "pressed", label: "壓下 B" },
      { id: "released", label: "放開 B" },
    ],
    initial: "pressed",
  },
  pose(angle, state = "pressed") {
    const pressed = state === "pressed";
    const travel = pressed ? beltTravel(angle, top.radius, top.sense) : 0; // 鬆弛時皮帶在輪上打滑,不前進
    return {
      parts: {
        driver: { angle },
        driven: { angle: pressed ? wheelAngle(travel, bottom.radius, bottom.sense) : 0 },
        tensioner: { position: B_AT[state], angle: pressed ? wheelAngle(travel, B_RADIUS, -1) : 0 },
        arm: { position: add(B_AT[state], ARM_OFFSET) },
      },
      paths: { belt: { points: paths(state).points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
