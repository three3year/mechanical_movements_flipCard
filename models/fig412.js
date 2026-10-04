// 第 412 種:絞盤底部的齒輪機構,讓絞盤可當簡單或複合機器用(單倍、雙倍或三倍的機械利益)。鼓頭與鼓輪可以各自轉;
// 鼓頭固定在心軸上(中央的齒輪),轉鼓頭就帶心軸轉;鼓頭與鼓輪鎖在一起時鼓輪也跟著轉,這是單倍機械利益;
// 解鎖時齒輪機構作動,鼓頭與鼓輪朝相反方向轉,速度比為三比一。
// 主動件是鼓頭(心軸與中央齒輪);狀態按鈕切換「鎖定」與「解鎖」。
// 推斷:三個小齒輪裝在底座的固定銷上,鼓輪內面是內齒輪(齒數為中央齒輪的三倍);鎖定時整組一起轉(小齒輪隨著公轉);
// 外側的兩個鉤是鎖定用的掣子,只畫成固定在底座上;原文提到的雙倍機械利益沒有說明做法,沒有畫出。
import { TAU } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, thickLine, circle } from "./shapes.js";

const M = 0.08;
export const SUN = { center: [0, 0, 0], teeth: 14, radius: (14 * M) / 2 };
const BACKLASH = 0.008; // 齒隙:中心距稍微拉開
export const RING = { center: [0, 0, 0], teeth: 42, radius: (42 * M) / 2 + 2 * BACKLASH, internal: true };
const PLANET_TEETH = (RING.teeth - SUN.teeth) / 2;
const ORBIT = SUN.radius + (PLANET_TEETH * M) / 2 + BACKLASH;
// 三個小齒輪要同時咬中央齒輪與內齒輪,位置角須是 2π/(14+42) 的整數倍(約在 150°、30°、270°)
const PLANET_AT = [23, 5, 42].map((k) => (k * TAU) / (SUN.teeth + RING.teeth));
export const PLANETS = PLANET_AT.map((a) => ({ center: [ORBIT * Math.cos(a), ORBIT * Math.sin(a), 0], teeth: PLANET_TEETH, radius: (PLANET_TEETH * M) / 2 }));
const BARREL = 2.05;

/** 鼓頭轉 theta → 各零件的轉角;鎖定時整組像一個剛體 */
export function angles(theta, state = "free") {
  if (state === "locked") {
    const base = angles(0, "free");
    return { sun: theta, planets: base.planets.map((a) => a + theta), ring: base.ring + theta, carrier: theta };
  }
  const planets = PLANETS.map((p) => meshAngle(SUN, p, theta));
  return { sun: theta, planets, ring: meshAngle(PLANETS[0], RING, planets[0]), carrier: 0 };
}

const hook = (s) => thickLine([[2.75 * s, 1.95 * s], [1.6 * s, 2.1 * s], [0.5 * s, 2.12 * s], [0.25 * s, 2.0 * s]], 0.09);
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];

export default {
  figure: 412,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(hook(1)), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(hook(-1)), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(circle(0.1)), thickness: 0.14, at: [2.75, 1.95, 0.1] },
        { kind: "plate", shape: shape(circle(0.1)), thickness: 0.14, at: [-2.75, -1.95, 0.1] },
      ],
    },
    {
      id: "barrel",
      kind: "gear",
      internal: true,
      center: RING.center,
      teeth: RING.teeth,
      radius: RING.radius,
      rim: BARREL,
      width: 0.24,
      pieces: [{ kind: "plate", shape: shape(circle(BARREL + 0.04), [circle(BARREL - 0.06).reverse()]), thickness: 0.3 }],
    },
    { id: "sun", kind: "gear", center: SUN.center, teeth: SUN.teeth, radius: SUN.radius, width: 0.3, bore: 0.1, pieces: [{ kind: "cylinder", radius: 0.1, length: 0.6 }] },
    ...PLANETS.map((p, i) => ({ id: `planet${i + 1}`, kind: "gear", center: p.center, teeth: p.teeth, radius: p.radius, width: 0.26, bore: 0.07, arrow: i === 0, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.45 }] })),
  ],
  states: {
    initial: "free",
    options: [
      { id: "locked", label: "鎖定(單倍)" },
      { id: "free", label: "解鎖(三倍)" },
    ],
  },
  driver: { part: "sun", type: "rotation" },
  target: "barrel",
  view: { direction: [0.05, 0.06, 1] },
  pose(theta, state = "free") {
    const a = angles(theta, state);
    const parts = { sun: { angle: a.sun }, barrel: { angle: a.ring } };
    PLANETS.forEach((p, i) => {
      parts[`planet${i + 1}`] = { position: rot(p.center, a.carrier), angle: a.planets[i] };
    });
    return {
      parts,
      readouts: [
        { label: "機械利益", value: state === "locked" ? "單倍" : "三倍" },
        { label: "鼓輪 / 鼓頭", value: state === "locked" ? "同向 1 : 1" : "反向 1 : 3" },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["base", "barrel"], reason: "接合處的簡化畫法:發條盒坐在底板的凹座裡,重疊 0.10" },
  ],
};
