// 第 15 種:懷特滑輪組(White's pulleys)。每個滑輪塊是一塊切出多道溝槽的實心輪,
// 溝槽直徑依繩速成比例:上塊 1、3、5,下塊 2、4、6,所以整塊一起轉而繩不打滑。
// 繩從下塊出發,在上下之間往返七段後由繩端往上拉,施力比 1 比 7。
import { Z, Y, clamp, routeRope, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 2.1];
const CEILING = 3.0;
const UNIT = 0.14;
const STEP = 0.2; // 每道溝槽沿軸的寬度
const UPPER = { y: 2.1, z: 0, grooves: [1, 3, 5] };
const LOWER = { y: -0.6, z: 0.1, grooves: [2, 4, 6] };
const HANGER = 1.25;
const W = { height: 0.55, radius: 0.32 };
const SEGMENTS = 7;

// 溝槽沿軸各佔一格、上下兩塊交錯;小溝槽在前,正面看去就是原圖的同心圓
const grooveZ = (block, i) => block.z + (1 - i) * STEP;
const groove = (block, i, y) => ({
  center: [0, y, grooveZ(block, i)],
  axis: Z,
  radius: block.grooves[i] * UNIT,
  sense: -1,
});

function layout(pull) {
  const rise = pull / SEGMENTS;
  const lowerY = LOWER.y + rise;
  const nodes = [{ point: [-UNIT, lowerY + 0.35, grooveZ(UPPER, 0)] }];
  for (let i = 0; i < 3; i++) nodes.push({ circle: groove(UPPER, i, UPPER.y) }, { circle: groove(LOWER, i, lowerY) });
  const end = nodes[nodes.length - 1].circle;
  const handle = [-end.radius, UPPER.y + 0.55 + pull, end.center[2]];
  nodes.push({ point: handle });
  const weight = [0, lowerY - HANGER, LOWER.z];
  return { rise, lowerY, handle, weight, rope: routeRope(nodes) };
}

const rest = layout(RANGE[0]);

const block = (id, b, y) => ({
  id,
  kind: "stepped",
  center: [0, y, b.z],
  axis: Z,
  steps: b.grooves.map((g) => ({ radius: g * UNIT, width: STEP })).reverse(), // 由後往前排
});

export default {
  figure: 15,
  parts: [
    { id: "ceiling", kind: "box", center: [0.15, CEILING + 0.08, 0.2], size: [1.1, 0.16, 1] },
    block("upper", UPPER, UPPER.y),
    block("lower", LOWER, LOWER.y),
    { id: "hanger", kind: "rod" },
    { id: "strap", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "rope", kind: "rope" },
    { id: "handle", kind: "handle", center: rest.handle },
  ],
  driver: { part: "handle", type: "translation", range: RANGE, direction: [0, 1, 0] },
  view: { direction: [0.45, 0.1, 1] },
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, lowerY, handle, weight, rope } = layout(pull);
    // 溝槽 k 上的繩速是重物速度的 k 倍、半徑是 k 個單位,所以兩塊都以「重物位移 ÷ 單位半徑」整塊轉動
    const angle = -rise / UNIT;
    return {
      parts: {
        upper: { angle },
        lower: { position: [0, lowerY, LOWER.z], angle },
        weight: { position: weight },
        handle: { position: handle },
      },
      paths: {
        rope: { points: rope.points, closed: false },
        hanger: rod([0, CEILING, UPPER.z], [0, UPPER.y, UPPER.z]),
        strap: rod([0, lowerY, LOWER.z], [0, weight[1] + W.height / 2 + 0.1, LOWER.z]),
      },
      readouts: hoistReadouts(pull, rise, SEGMENTS),
    };
  },
};
