// 第 233 種:兩種用於燈籠輪的擋止裝置。原圖是同一個燈籠輪(輪面上一圈銷)配兩種擋止:
// 右邊是一端斜切的平桿,靠自重落在銷之間——輪逆時針轉時銷從下方把桿頂起、滑過去;
// 輪要順時針倒轉時,銷撞上斜切端面,桿的推力指向樞軸,轉不動,輪被擋住。
// 左邊是端頭為圓盤的槓桿,落在兩銷之間,兩個方向都會被銷頂起(只定位、不擋)。
// 兩者的作用方式為推斷(原文只說是兩種擋止裝置)。主動件是輪;往回轉只能轉到擋止處。
// 接觸(由接觸算,共用 pawl-drive.js):兩個擋止都靠自重搭在銷上;被銷頂起多高、何時越過,由外形相碰算出,
// 越過之後從當下的速度起加速落下,碰到下一根銷或輪面就停(不瞬移)。
// 推斷:兩個擋止的樞軸銷、輪軸與後面的軸承座(原圖只畫輪轂)。
import { TAU, deg, polar } from "./kit.js";
import { circle, stadium, shape } from "./shapes.js";
import { circlePolygon, lastStop } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

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

// 輪是主動件:擋止隨輪的轉角起落,每個銷距一個週期
const LEVER_HEAD = circlePolygon(LEVER.head, LEVER.headRadius, 16);
const drive = pawlDrive({
  period: PERIOD,
  samples: 360,
  pins: () => ({ bar: BAR.pivot, lever: LEVER.pivot }),
  wheel: { obstacles: pinsAt, angle: (w) => w },
  pawls: {
    bar: { outline: BAR.outline, into: 1, angle: deg(-14), limits: [deg(-30), deg(12)] },
    lever: { outline: LEVER_HEAD, into: -1, angle: deg(14), limits: [deg(-12), deg(30)] },
  },
});
export const barAngle = (wheel) => drive.at(wheel).angles.bar;
export const leverAngle = (wheel) => drive.at(wheel).angles.lever;

// 桿落進兩銷之間、落定的那一刻,就是倒轉時被擋住的位置:找轉角驟降(落下)之後第一個不再變的取樣
const STOP = (() => {
  const n = 720;
  const at = (i) => barAngle((PERIOD * i) / n);
  let start = 0;
  let best = 0;
  for (let i = 1; i <= n; i++) {
    const d = at(i) - at(i - 1);
    if (d > best) [best, start] = [d, i];
  }
  let i = start;
  while (at(i + 1) - at(i) > 1e-6 && i < start + n / 4) i++; // 還在往下落(轉角增加)
  return (PERIOD * i) / n;
})();

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
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.14, length: 0.5, at: [0, 0, -0.25] }, // 輪軸
        ...pedestal({ at: [0, 0], z: -0.4, bore: 0.14, floor: -2.2 }),
        { kind: "cylinder", radius: 0.065, length: 0.7, at: [...BAR.pivot, 0.05] }, // 平桿的樞軸銷
        { kind: "cylinder", radius: 0.065, length: 0.7, at: [...LEVER.pivot, 0.05] }, // 槓桿的樞軸銷
        { kind: "box", size: [0.3, 3.3, 0.12], at: [BAR.pivot[0] + 0.3, BAR.pivot[1] - 1.55, -0.4] },
        { kind: "box", size: [0.5, 0.25, 0.12], at: [BAR.pivot[0] + 0.15, BAR.pivot[1], -0.4] },
        { kind: "box", size: [0.3, 2.9, 0.12], at: [LEVER.pivot[0] - 0.3, LEVER.pivot[1] - 1.35, -0.4] },
        { kind: "box", size: [0.5, 0.25, 0.12], at: [LEVER.pivot[0] - 0.15, LEVER.pivot[1], -0.4] },
      ],
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
        { kind: "cylinder", radius: 0.14, inner: 0.07, length: 0.14 },
        { kind: "plate", shape: shape(circle(LEVER.headRadius, ...LEVER.head), [circle(0.1, ...LEVER.head).reverse()]), thickness: 0.14 },
      ],
    },
  ],
  // 動力重演:只推輪;兩個擋止鉸在銷上、靠自重搭在銷上,由銷頂起、越過後落下
  replay: {
    from: STOP,
    to: STOP + 2 * PERIOD,
    seconds: 16,
    free: { bar: {}, lever: {} },
    expect: [
      { at: STOP + PERIOD * 0.6, part: "bar", label: "下一根銷把平桿頂起" },
      { at: STOP + PERIOD, part: "bar", label: "銷越過斜切端,平桿落進下一個銷間" },
      { at: STOP + PERIOD * 0.6, part: "lever", label: "銷把槓桿的圓盤頂起" },
      { at: STOP + 2 * PERIOD, part: "lever", label: "兩個銷距後槓桿落回原位" },
      { at: STOP + 2 * PERIOD, part: "bar", label: "兩個銷距後平桿落回原位" },
    ],
  },
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
