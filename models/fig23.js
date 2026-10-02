// 第 23 種:把旋轉運動傳到可動皮帶輪。皮帶輪 A 裝在可沿導軌滑動的框架裡(框架原圖未繪出,此處省略),
// 由繞過兩個導引輪 B、B 的繩懸掛,另一端掛配重 C,讓皮帶維持均勻張力。
// A 抬升或降下時,配重 C 依繩長守恆反向移動同樣的距離。
import { Z, routeBelt, routeRope, beltTravel, wheelAngle, memo, rod } from "./kit.js";

const FRONT = 0.12; // 左輪 ↔ A 外溝的皮帶在前,A 內溝 ↔ 下方輪的皮帶在後
const LEFT = { center: [-2.6, 0, FRONT], axis: Z, radius: 0.9, sense: 1 };
const A = { x: 0, y: 0.35, outer: 0.42, inner: 0.26 };
const BOTTOM = { center: [0.45, -2.1, -FRONT], axis: Z, radius: 0.55, sense: 1 };
const GUIDE = 0.2;
const B1 = { center: [A.x + GUIDE, 2.0, 0], axis: Z, radius: GUIDE, sense: -1 };
const B2 = { center: [1.7, 2.0, 0], axis: Z, radius: GUIDE, sense: -1 };
const HOOK = 0.62; // A 軸心到框架吊點
const C = { x: B2.center[0] + GUIDE, y: 0.8, size: [0.5, 0.45, 0.4] };
const LIFT = { raised: 0.3, middle: 0, lowered: -0.3 };

const layout = memo((state) => {
  const h = LIFT[state];
  const ay = A.y + h;
  const outer = { center: [A.x, ay, FRONT], axis: Z, radius: A.outer, sense: 1 };
  const inner = { center: [A.x, ay, -FRONT], axis: Z, radius: A.inner, sense: 1 };
  const hook = [A.x, ay + HOOK, 0];
  const cy = C.y - h; // 繩繞過兩個固定導引輪:A 升多少,C 就降多少
  const cTop = [C.x, cy + C.size[1] / 2 + 0.08, 0];
  return {
    a: [A.x, ay, 0],
    hook,
    c: [C.x, cy, 0],
    belt1: routeBelt([LEFT, outer]),
    belt2: routeBelt([inner, BOTTOM]),
    rope: routeRope([{ point: hook }, { circle: B1 }, { circle: B2 }, { point: cTop }]),
  };
});

const guide = (id, c) => ({
  id,
  kind: "pulley",
  style: "disc",
  center: c.center,
  axis: Z,
  radius: GUIDE,
  width: 0.16,
  label: "B",
  labelOffset: [0, GUIDE + 0.28, 0],
});

const rest = layout("middle");

export default {
  figure: 23,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: LEFT.center, axis: Z, radius: LEFT.radius, width: 0.24 },
    {
      id: "pulleyA",
      kind: "pulley",
      style: "spoked",
      center: [A.x, A.y, FRONT],
      axis: Z,
      radius: A.outer,
      width: 0.2,
      label: "A",
      labelOffset: [-0.35, -0.6, 0],
    },
    { id: "pulleyAInner", kind: "pulley", style: "disc", center: [A.x, A.y, -FRONT], axis: Z, radius: A.inner, width: 0.2 },
    { id: "bottom", kind: "pulley", style: "spoked", center: BOTTOM.center, axis: Z, radius: BOTTOM.radius, width: 0.24 },
    guide("guide1", B1),
    guide("guide2", B2),
    { id: "hanger", kind: "rod" },
    { id: "rope", kind: "rope" },
    {
      id: "counterweight",
      kind: "box",
      center: rest.c,
      size: C.size,
      label: "C",
      labelOffset: [0.5, 0, 0],
    },
    { id: "belt1", kind: "belt" },
    { id: "belt2", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  states: {
    options: [
      { id: "raised", label: "抬升 A" },
      { id: "middle", label: "原位" },
      { id: "lowered", label: "降下 A" },
    ],
    initial: "middle",
  },
  view: { direction: [0.15, 0.1, 1] },
  pose(angle, state = "middle") {
    const { a, hook, c, belt1, belt2, rope } = layout(state);
    const travel1 = beltTravel(angle, LEFT.radius, LEFT.sense);
    const angleA = wheelAngle(travel1, A.outer, 1);
    const travel2 = beltTravel(angleA, A.inner, 1);
    return {
      parts: {
        driver: { angle },
        pulleyA: { position: [a[0], a[1], FRONT], angle: angleA },
        pulleyAInner: { position: [a[0], a[1], -FRONT], angle: angleA },
        bottom: { angle: wheelAngle(travel2, BOTTOM.radius, BOTTOM.sense) },
        counterweight: { position: c },
      },
      paths: {
        belt1: { points: belt1.points, closed: true, phase: travel1 },
        belt2: { points: belt2.points, closed: true, phase: travel2 },
        rope: { points: rope.points, closed: false },
        hanger: rod(hook, a),
      },
      readouts: [],
    };
  },
};
