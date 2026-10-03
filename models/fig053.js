// 第 53 種:直立軸可依需要以任一方向驅動水平軸——雙離合器與斜齒輪。上方直立軸的斜齒輪
// 帶動水平軸上左右兩個鬆動的斜齒輪,兩者轉向相反;中間的雙離合器在水平軸的鍵條上滑動,
// 與左輪的爪接合時水平軸隨左輪轉,與右輪接合時隨右輪(反向)轉,置中時水平軸不動。
import { X, deg } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { bellCrank } from "./clutch-parts.js";

const M = 0.095;
const [CONE_TOP, CONE_SIDE] = pitchCones(44, 40);
const APEX = [0, 0, 0];
export const TOP = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: 44, radius: (44 * M) / 2, cone: CONE_TOP, width: 0.75 });
export const LEFT = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: 40, radius: (40 * M) / 2, cone: CONE_SIDE, width: 0.75 });
export const RIGHT = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: 40, radius: (40 * M) / 2, cone: CONE_SIDE, width: 0.75 });
const CL = bevelContact(TOP, LEFT);
const CR = bevelContact(TOP, RIGHT);
const JAWS = 5;
const J = 0.22; // 雙離合器兩面的爪離中心的距離
const SLIDE = { left: -0.28, neutral: 0, right: 0.28 };
const Y = -0.0;
const LEVER = { pivot: [0.0, -1.3], up: 1.0, out: 0.8 };

export const STATES = SLIDE;

const jaw = (radius, x, facing) => ({ kind: "gear", crown: true, teeth: JAWS, radius, width: 0.4, toothDepth: 0.22, faceWidth: radius * 0.6, at: [0, 0, x], axis: [0, 0, facing] });

const bevel = (id, g, extra = {}) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  ...extra,
});

export default {
  figure: 53,
  parts: [
    bevel("top", TOP, { pieces: [{ kind: "cylinder", radius: 0.16, length: 1.4, at: [0, 0, -1.05] }] }),
    bevel("left", LEFT, { pieces: [{ kind: "cylinder", radius: 0.32, length: 0.55, at: [0, 0, 0.3] }, jaw(0.42, 0.6, 1)] }),
    bevel("right", RIGHT, { pieces: [{ kind: "cylinder", radius: 0.32, length: 0.55, at: [0, 0, 0.3] }, jaw(0.42, 0.6, 1)] }),
    { id: "shaft", kind: "cylinder", axis: X, center: [0, Y, 0], radius: 0.12, length: 6.2, arrow: false },
    {
      id: "clutch",
      kind: "group",
      axis: X,
      center: [0, Y, 0],
      posed: true,
      spin: 0.55,
      pieces: [jaw(0.42, -J, -1), jaw(0.42, J, 1), { kind: "cylinder", radius: 0.28, length: 0.5 }],
    },
    bellCrank({ ...LEVER, z: 0.5 }),
  ],
  driver: { part: "top", type: "rotation" },
  target: "shaft", // 可正反轉的水平軸
  states: {
    options: [
      { id: "left", label: "接合左輪" },
      { id: "neutral", label: "置中(脫開)" },
      { id: "right", label: "接合右輪" },
    ],
    initial: "left",
  },
  view: { direction: [0.05, 0.12, 1], fov: 20 },
  pose(angle, state = "left") {
    const left = meshAngle(TOP, LEFT, angle, CL);
    const right = meshAngle(TOP, RIGHT, angle, CR);
    // 水平軸繞 +x 的轉角:左輪的軸朝 +x,右輪的軸朝 −x
    const shaft = state === "left" ? left : state === "right" ? -right : 0;
    const x = SLIDE[state];
    return {
      parts: {
        top: { angle },
        left: { angle: left },
        right: { angle: right },
        shaft: { angle: shaft },
        clutch: { position: [x, Y, 0], angle: shaft + Math.PI / JAWS },
        lever: { angle: -Math.asin(x / LEVER.up) },
      },
      readouts: [],
    };
  },
};
