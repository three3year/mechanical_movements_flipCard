// 第 25 種:斜齒輪(傘齒輪)。上方水平的輪(軸直立)與左方直立的輪(軸水平)節錐頂相交,
// 兩軸成直角;直徑相等時稱為等徑斜齒輪。齒數照原圖兩輪相近(30、28)。
import { X, Y } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";

const M = 0.11;
const [CONE_TOP, CONE_LEFT] = pitchCones(30, 28);
const APEX = [0, 0, 0];
export const TOP = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: 30, radius: (30 * M) / 2, cone: CONE_TOP, width: 0.55 });
export const LEFT = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: 28, radius: (28 * M) / 2, cone: CONE_LEFT, width: 0.55 });
const CONTACT = bevelContact(TOP, LEFT);

const bevel = (id, g, shaft) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  pieces: [{ kind: "cylinder", radius: 0.16, length: shaft, at: [0, 0, -shaft / 2 - 0.2] }],
});

export default {
  figure: 25,
  parts: [bevel("top", TOP, 1.6), bevel("left", LEFT, 1.4)],
  driver: { part: "top", type: "rotation" },
  target: "left", // 被帶動的斜齒輪
  view: { direction: [0.25, 0.12, 1], fov: 14 },
  pose(angle) {
    return { parts: { top: { angle }, left: { angle: meshAngle(TOP, LEFT, angle, CONTACT) } }, readouts: [] };
  },
};
