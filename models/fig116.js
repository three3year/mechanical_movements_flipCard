// 第 116 種:曲柄的替代裝置。雙齒條框架往復直線運動,使小齒輪軸均勻地(單向)旋轉。
// 兩個齒條各配一個小齒輪,位於不同的平面上(前、後),都鬆套在軸上;每個小齒輪外側的軸上固定一個棘輪,
// 小齒輪上的棘爪與它嚙合。框架往右時上齒條使前小齒輪順時針轉,經棘爪帶軸;往左時換後小齒輪順時針轉、帶軸。
// 總有一個小齒輪在軸上空轉。原文說兩棘輪的齒方向相反——相對於它們各自的小齒輪(兩小齒輪在同一程中反向轉),
// 這裡兩個棘輪都讓軸朝順時針方向轉。主動量是框架的累計行程。
import { deg, swingPhase, polar } from "./kit.js";
import { pinionAngle, circularPitch } from "./gears.js";
import { pawlRest } from "./ratchets.js";
import { ratchetShape, arcPoints, shape, stadium } from "./shapes.js";

const R = 0.8;
export const FRONT = { center: [0, 0, 0.22], teeth: 12, radius: R };
export const BACK = { center: [0, 0, -0.22], teeth: 12, radius: R };
const PITCH = circularPitch(FRONT);
const TOP = { origin: [0, R, 0], dir: [1, 0, 0], pitch: PITCH };
const BOTTOM = { origin: [0, -R, 0], dir: [1, 0, 0], pitch: PITCH };
const STROKE = 2.2;
const RATCHET = { teeth: 10, outer: 0.42, inner: 0.32, dir: -1 };
const PAWL = { at: 0.52, length: 0.28 };

/** 主動量 v(累計行程):框架位置、前後小齒輪轉角、軸(與棘輪)的轉角 */
export function motion(v) {
  const { at } = swingPhase(v, -STROKE / 2, STROKE / 2);
  return {
    x: at,
    front: pinionAngle(FRONT, TOP, at),
    back: pinionAngle(BACK, BOTTOM, at),
    shaft: -v / R, // 每一程軸都順時針轉過 行程 ÷ 半徑
  };
}
export const stroke = STROKE;

const pawlPose = (pinion, shaft) => {
  const pivotAngle = pinion + deg(90);
  const pivot = polar(PAWL.at, pivotAngle);
  const rest = pawlRest({ pivot, length: PAWL.length, from: pivotAngle - deg(90), into: -1, sweep: 1.6 }, { center: [0, 0], angle: shaft, ...RATCHET });
  return { pivot, angle: rest.angle };
};

const W = 2.1;
const loop = (h) => [...arcPoints(h, -Math.PI / 2, Math.PI / 2, W, 0), ...arcPoints(h, Math.PI / 2, (3 * Math.PI) / 2, -W, 0)];
const pawlPart = (id) => ({
  id,
  kind: "plate",
  shape: shape([[-0.04, 0.04], [PAWL.length, 0.0], [-0.04, -0.04]]),
  thickness: 0.06,
  arrow: false,
});

export default {
  figure: 116,
  parts: [
    // 小齒輪做成環形(中間挖空),看得到裡面固定在軸上的棘輪與棘爪
    { id: "front", kind: "gear", center: FRONT.center, teeth: 12, radius: R, width: 0.16, bore: 0.55, hub: false },
    { id: "back", kind: "gear", center: BACK.center, teeth: 12, radius: R, width: 0.16, bore: 0.55, hub: false },
    {
      id: "shaft",
      kind: "group",
      spin: 0.36,
      spinOffset: 0.6,
      pieces: [
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.08 }), thickness: 0.1, at: [0, 0, 0.36] },
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.08 }), thickness: 0.1, at: [0, 0, -0.36] },
        { kind: "cylinder", radius: 0.1, length: 1.6, mark: true },
      ],
    },
    { ...pawlPart("pawlFront") },
    { ...pawlPart("pawlBack") },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(R + 0.62), [loop(R + 0.42).reverse()]), thickness: 0.6 },
        { kind: "rack", teeth: 13, pitch: PITCH, depth: 0.22, width: 0.16, at: [0, R, 0.22], angle: Math.PI },
        { kind: "rack", teeth: 13, pitch: PITCH, depth: 0.22, width: 0.16, at: [0, -R, -0.22] },
        { kind: "plate", shape: stadium(1.2, 0.3), thickness: 0.3, at: [-W - R - 0.62 - 1.0, 0, 0] },
        { kind: "plate", shape: stadium(1.2, 0.3), thickness: 0.3, at: [W + R + 0.62 - 0.2, 0, 0] },
      ],
    },
  ],
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], cycle: [-STROKE / 2, STROKE / 2] },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { x, front, back, shaft } = motion(v);
    const pf = pawlPose(front, shaft);
    const pb = pawlPose(back, shaft);
    return {
      parts: {
        frame: { position: [x, 0, 0] },
        front: { angle: front },
        back: { angle: back },
        shaft: { angle: shaft },
        pawlFront: { position: [pf.pivot[0], pf.pivot[1], 0.36], angle: pf.angle },
        pawlBack: { position: [pb.pivot[0], pb.pivot[1], -0.36], angle: pb.angle },
      },
      readouts: [],
    };
  },
};
