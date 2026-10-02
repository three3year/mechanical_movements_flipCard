// 第 42 種:用於兩軸斜向配置的齒輪——交錯軸斜齒輪。上輪的軸水平,下輪的軸在水平面內斜轉 30°,
// 兩輪的齒都是斜齒,螺旋角相加等於兩軸夾角;轉速比為齒數反比。
import { X, deg, norm } from "./kit.js";
import { meshAngle } from "./gears.js";

const SHAFT = deg(30);
const TOP = { center: [0, 1.15, 0], axis: X, teeth: 24, radius: 1.15 };
const BOTTOM = { center: [0, -1.0, 0], axis: norm([Math.cos(SHAFT), 0, Math.sin(SHAFT)]), teeth: 20, radius: 1.0 };
const CONTACT = [0, 0, 0];
const helix = (g, beta, width) => (width * Math.tan(beta)) / g.radius;

const gear = (id, g, width, beta) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  width,
  slices: 7,
  twist: helix(g, beta, width),
  web: false,
  pieces: [
    { kind: "cylinder", radius: 0.11, length: width + 1.8 },
    { kind: "cylinder", radius: 0.26, length: width + 0.25 },
  ],
});

export const gears = { TOP, BOTTOM, CONTACT };

export default {
  figure: 42,
  parts: [gear("top", TOP, 0.6, deg(15)), gear("bottom", BOTTOM, 0.5, deg(15))],
  driver: { part: "top", type: "rotation" },
  view: { direction: [0.05, 0.08, 1] },
  pose(angle) {
    return { parts: { top: { angle }, bottom: { angle: meshAngle(TOP, BOTTOM, angle, CONTACT) } }, readouts: [] };
  },
};
