// 第 43 種:用於兩軸斜向配置的齒輪——兩軸相交但不成直角的傘齒輪。
// 節錐角依兩軸夾角與齒數決定(兩節錐角之和等於兩軸夾角),轉速比為齒數反比。
import { norm, dot } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";

const M = 0.1;
const UA = norm([1, -0.35, 0]); // 大輪:在左上,朝右下的錐頂
const UB = norm([0.6, 0.7, 0.4]); // 小輪:在左下,朝右上的錐頂
const SHAFT = Math.acos(dot(UA, UB));
const [CONE_A, CONE_B] = pitchCones(32, 22, SHAFT);
export const BIG = bevelGear({ apex: [0, 0, 0], axis: UA, teeth: 32, radius: (32 * M) / 2, cone: CONE_A, width: 0.5 });
export const SMALL = bevelGear({ apex: [0, 0, 0], axis: UB, teeth: 22, radius: (22 * M) / 2, cone: CONE_B, width: 0.5 });
const CONTACT = bevelContact(BIG, SMALL);

const bevel = (id, g, shaft) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  pieces: [{ kind: "cylinder", radius: 0.12, length: shaft, at: [0, 0, 0.3] }],
});

export default {
  figure: 43,
  parts: [bevel("big", BIG, 4.2), bevel("small", SMALL, 4.2)],
  driver: { part: "big", type: "rotation" },
  target: "small", // 被帶動的傘齒輪
  view: { direction: [0.05, 0.1, 1] },
  pose(angle) {
    return { parts: { big: { angle }, small: { angle: meshAngle(BIG, SMALL, angle, CONTACT) } }, readouts: [] };
  },
};
