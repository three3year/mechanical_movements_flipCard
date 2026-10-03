// 第 42 種:用於兩軸斜向配置的齒輪——交錯軸斜齒輪。上輪的軸水平,下輪的軸在水平面內斜轉 25°。
// 照原圖:上輪是斜齒(從正面看齒紋左低右高),下輪是直齒;上輪的螺旋角等於兩軸夾角,
// 接觸處上輪的齒正好順著下輪的軸向。轉速比為齒數反比。
import { X, deg, norm } from "./kit.js";
import { meshAngle } from "./gears.js";

const SHAFT = deg(25);
const TOP = { center: [0, 1.15, 0], axis: X, teeth: 24, radius: 1.15 };
const BOTTOM = { center: [0, -1.0, 0], axis: norm([Math.cos(SHAFT), 0, Math.sin(SHAFT)]), teeth: 20, radius: 1.0 };
const CONTACT = [0, 0, 0];
// 斜齒兩端相差的角度:齒寬 width、螺旋角 beta(負號:從正面看齒紋左低右高)
const helix = (g, beta, width) => -(width * Math.tan(beta)) / g.radius;

const gear = (id, g, width, beta) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  width,
  ...(beta ? { slices: 7, twist: helix(g, beta, width) } : {}),
  web: false,
  pieces: [
    { kind: "cylinder", radius: 0.11, length: width + 1.8 },
    { kind: "cylinder", radius: 0.26, length: width + 0.25 },
  ],
});

export const gears = { TOP, BOTTOM, CONTACT, SHAFT };

export default {
  figure: 42,
  parts: [gear("top", TOP, 0.6, SHAFT), gear("bottom", BOTTOM, 0.6, 0)],
  driver: { part: "top", type: "rotation" },
  target: "bottom", // 斜軸上的從動輪
  view: { direction: [0.05, 0.08, 1] },
  pose(angle) {
    return { parts: { top: { angle }, bottom: { angle: meshAngle(TOP, BOTTOM, angle, CONTACT) } }, readouts: [] };
  },
};
