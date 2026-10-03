// 第 23 種:把旋轉運動傳到可動皮帶輪(圖底部的輪)。底部輪抬升或降下時皮帶會鬆弛或繃緊;
// 為了讓皮帶保持均勻張力,皮帶輪 A 裝在可沿導軌滑動的框架裡(框架原圖未繪出,此處省略),
// 由繞過兩個導引輪 B、B 的繩懸掛,另一端掛配重 C。
// 依原圖,一條皮帶從左側主動輪頂端越過 A 的前溝、繞過底部輪,再越過 A 的後溝回到主動輪;
// A 的兩道溝是並排的兩個鬆動輪,皮帶在兩溝上方向相反。
// 底部輪升降時,A 的高度由「皮帶總長不變」算出;C 再依繩長守恆反向移動同樣的距離。
import { Z, routeBelt, routeRope, beltTravel, wheelAngle, memo, rod } from "./kit.js";

const GROOVE = 0.12; // A 的前溝與後溝沿軸的位置
const LEFT = { center: [-4.1, -0.55, 0], axis: Z, radius: 0.9, sense: -1 };
const A = { x: 0, y: 0, outer: 0.5, inner: 0.32 };
const BOTTOM = { x: 1.27, y: -2.85, radius: 0.73, sense: -1 };
const GUIDE = 0.25;
const B1 = { center: [A.x + GUIDE, 1.6, 0], axis: Z, radius: GUIDE, sense: -1 };
const B2 = { center: [2.62, 1.6, 0], axis: Z, radius: GUIDE, sense: -1 };
const HOOK = 0.62; // A 軸心到框架吊點
const C = { x: B2.center[0] + GUIDE, y: -0.55, size: [0.9, 0.65, 0.5] };
const LIFT = { raised: 0.35, middle: 0, lowered: -0.35 };

const pulleysAt = (ay, by) => ({
  outer: { center: [A.x, ay, GROOVE], axis: Z, radius: A.outer, sense: -1 },
  inner: { center: [A.x, ay, -GROOVE], axis: Z, radius: A.inner, sense: 1 },
  bottom: { center: [BOTTOM.x, by, 0], axis: Z, radius: BOTTOM.radius, sense: BOTTOM.sense },
});
const beltAt = (ay, by) => {
  const p = pulleysAt(ay, by);
  return routeBelt([LEFT, p.outer, p.bottom, p.inner]);
};
const BELT_LENGTH = beltAt(A.y, BOTTOM.y).length;

// 皮帶越過 A 的上方:A 越高皮帶越長。用二分法找出讓皮帶總長不變的 A 高度
function tensionerHeight(by) {
  let lo = A.y - 2;
  let hi = A.y + 2;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (beltAt(mid, by).length < BELT_LENGTH) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const layout = memo((state) => {
  const by = BOTTOM.y + LIFT[state];
  const ay = tensionerHeight(by);
  const hook = [A.x, ay + HOOK, 0];
  const cy = C.y - (ay - A.y); // 繩繞過兩個固定導引輪:A 升多少,C 就降多少
  const cTop = [C.x, cy + C.size[1] / 2 + 0.08, 0];
  return {
    ay,
    by,
    hook,
    c: [C.x, cy, 0],
    belt: beltAt(ay, by),
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
  labelOffset: [-0.25, GUIDE + 0.25, 0],
});

const rest = layout("middle");

export default {
  figure: 23,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: LEFT.center, axis: Z, radius: LEFT.radius, width: 0.24 },
    {
      id: "pulleyA",
      kind: "pulley",
      style: "disc",
      center: [A.x, A.y, GROOVE],
      axis: Z,
      radius: A.outer,
      width: 0.18,
      label: "A",
      labelOffset: [-0.45, -0.75, 0],
    },
    { id: "pulleyAInner", kind: "pulley", style: "disc", center: [A.x, A.y, -GROOVE], axis: Z, radius: A.inner, width: 0.18 },
    {
      id: "movable",
      kind: "pulley",
      style: "spoked",
      center: [BOTTOM.x, BOTTOM.y, 0],
      axis: Z,
      radius: BOTTOM.radius,
      width: 0.24,
    },
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
      labelOffset: [0.75, -0.3, 0],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  target: "movable", // 可動的底部皮帶輪(運動要傳到這裡)
  states: {
    options: [
      { id: "raised", label: "抬升底部皮帶輪" },
      { id: "middle", label: "原位" },
      { id: "lowered", label: "降下底部皮帶輪" },
    ],
    initial: "middle",
  },
  view: { direction: [0.1, 0.08, 1] },
  pose(angle, state = "middle") {
    const { ay, by, hook, c, belt, rope } = layout(state);
    const travel = beltTravel(angle, LEFT.radius, LEFT.sense);
    return {
      parts: {
        driver: { angle },
        pulleyA: { position: [A.x, ay, GROOVE], angle: wheelAngle(travel, A.outer, -1) },
        pulleyAInner: { position: [A.x, ay, -GROOVE], angle: wheelAngle(travel, A.inner, 1) },
        movable: { position: [BOTTOM.x, by, 0], angle: wheelAngle(travel, BOTTOM.radius, BOTTOM.sense) },
        counterweight: { position: c },
      },
      paths: {
        belt: { points: belt.points, closed: true, phase: travel },
        rope: { points: rope.points, closed: false },
        hanger: rod(hook, [A.x, ay, 0]),
      },
      readouts: [],
    };
  },
};
