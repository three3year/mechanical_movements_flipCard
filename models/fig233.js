// 第 233 種:兩種用於燈籠輪的擋止裝置。原圖是同一個燈籠輪(輪面上一圈銷)配兩種擋止:
// 右邊是一端斜切的平桿,靠自重落在銷之間——輪逆時針轉時銷從下方把桿頂起、滑過去;
// 輪要順時針倒轉時,銷撞上斜切端面,桿的推力指向樞軸,轉不動,輪被擋住。
// 左邊是端頭為圓盤的槓桿,落在兩銷之間,兩個方向都會被銷頂起(只定位、不擋)。
// 兩者的作用方式為推斷(原文只說是兩種擋止裝置)。主動件是輪;往回轉只能轉到擋止處。
import { TAU, deg, polar } from "./kit.js";
import { circle, stadium, shape } from "./shapes.js";
import { swingUntilContact, circlePolygon, dropValue, lastStop } from "./contact.js";

const WHEEL = { radius: 1.75, pins: 16, pinRadius: 1.45, pin: 0.12 };
const PERIOD = TAU / WHEEL.pins;
const Z = { pins: 0.15, stops: 0.32 };

// 右:斜切端的平桿,樞軸在右端
const BAR = {
  pivot: [3.2, 1.05],
  outline: [
    [0.22, 0.22],
    [-2.1, 0.24],
    [-2.36, -0.24],
    [0.22, -0.22],
  ],
};
// 左:圓盤端頭的槓桿,樞軸在左端;只用端頭圓盤判斷接觸
const LEVER = { pivot: [-2.6, 0.6], head: [1.85, 0.85], headRadius: 0.35 };

const pinsAt = (wheel) =>
  Array.from({ length: WHEEL.pins }, (_, i) => {
    const p = polar(WHEEL.pinRadius, wheel + i * PERIOD);
    return circlePolygon(p, WHEEL.pin);
  });

export const barAngle = (wheel) =>
  swingUntilContact({ pivot: BAR.pivot, outline: BAR.outline, from: deg(-14), into: 1, sweep: deg(40) }, pinsAt(wheel));

export const leverAngle = (wheel) =>
  swingUntilContact(
    { pivot: LEVER.pivot, outline: circlePolygon(LEVER.head, LEVER.headRadius, 16), from: deg(14), into: -1, sweep: deg(40) },
    pinsAt(wheel),
  );

// 桿落進兩銷之間的那一刻,就是倒轉時被擋住的位置
const STOP = dropValue(barAngle, PERIOD, 360);

export const pinPolygons = pinsAt;
export const barOutline = BAR;

export default {
  figure: 233,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: circle(WHEEL.radius), holes: [] },
      thickness: 0.12,
      hub: 0.3,
      circles: [0.18],
      spin: WHEEL.radius,
      pieces: Array.from({ length: WHEEL.pins }, (_, i) => ({
        kind: "cylinder",
        radius: WHEEL.pin,
        length: 0.42,
        at: [...polar(WHEEL.pinRadius, i * PERIOD).slice(0, 2), Z.pins],
        accent: i === 0,
      })),
    },
    {
      id: "bar",
      kind: "plate",
      center: [...BAR.pivot, Z.stops],
      shape: shape([...BAR.outline.slice(0, 3), ...BAR.outline.slice(3)], [circle(0.07).reverse()]),
      thickness: 0.12,
    },
    {
      id: "lever",
      kind: "group",
      center: [...LEVER.pivot, Z.stops],
      pieces: [
        { kind: "plate", shape: stadium(Math.hypot(...LEVER.head) - 0.2, 0.26, 0.07), thickness: 0.1, angle: Math.atan2(LEVER.head[1], LEVER.head[0]) },
        { kind: "plate", shape: shape(circle(LEVER.headRadius, ...LEVER.head), [circle(0.1, ...LEVER.head).reverse()]), thickness: 0.14 },
      ],
    },
  ],
  // 動力重演:只推主動件;bar、lever 靠摩擦定位,由接觸帶動
  replay: { from: 0.2672535417116317, to: 6.5504388488912175, free: { bar: { hold: true }, lever: { hold: true } }, expect: [{ part: "bar", label: "主動件走完一輪後 bar 的位置" }, { part: "lever", label: "主動件走完一輪後 lever 的位置" }] },
  driver: {
    part: "wheel",
    type: "rotation",
    initial: STOP,
    speed: 0.5,
    backstop: (v) => lastStop(v, STOP, PERIOD),
  },
  targets: ["bar", "lever"], // 兩種擋止裝置
  view: { direction: [0.08, 0.06, 1] },
  pose(wheel) {
    return {
      parts: {
        wheel: { angle: wheel },
        bar: { angle: barAngle(wheel) },
        lever: { angle: leverAngle(wheel) },
      },
      readouts: [],
    };
  },
};
