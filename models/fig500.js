// 第 500 種:壓力計(馬德堡壓力計)。流體壓力作用在波紋碟片 A 上,碟片變形把運動傳給
// 齒形扇形段 e,扇形段與指針心軸上的小齒輪嚙合,指針隨之轉動。
// 主動件是虛擬的「壓力」。碟片中心經一根短推桿頂起扇形段的尾臂(推桿為推斷:原文只說碟片
// 「將運動傳遞給」扇形段);錶盤只畫刻度環,中間留空,看得到裡面的機構。
import { deg, polar, Y } from "./kit.js";
import { meshAngle } from "./gears.js";
import { circleCircle, angleOf } from "./linkage.js";
import { ring, rect, stadium } from "./shapes.js";

const PINION = { center: [0, 0, 0], teeth: 10, radius: 0.15 };
const SECTOR = { center: [-0.54, -0.72, 0], teeth: 50, radius: 0.75 };
const TAIL = { length: 0.4, at: deg(-34) }; // 扇形段尾臂(局部角)
const DISC = { x: -0.21, y: -1.5, radius: 0.42, rise: 0.036 }; // 每單位壓力碟片中心升高 rise
const ZERO = deg(225); // 壓力為零時指針朝左下
const MECH_Z = -0.18;
const MAX = 10;

const pin0 = polar(TAIL.length, TAIL.at);
const tailPin0 = [SECTOR.center[0] + pin0[0], SECTOR.center[1] + pin0[1], 0];
const ROD = Math.hypot(tailPin0[0] - DISC.x, tailPin0[1] - DISC.y);

/** 壓力 p → 碟片中心升高量、扇形段轉角、小齒輪轉角、指針讀數角(從零點順時針量) */
export function gauge(p) {
  const lift = DISC.rise * p;
  const discTop = [DISC.x, DISC.y + lift, 0];
  const pin = circleCircle(discTop, ROD, SECTOR.center, TAIL.length, -1).point;
  const sector = angleOf(SECTOR.center, pin) - TAIL.at;
  const pinion = meshAngle(SECTOR, PINION, sector);
  return { lift, discTop, pin, sector, pinion };
}

const REST = gauge(0);

const ticks = Array.from({ length: 11 }, (_, i) => {
  const a = ZERO - (i / 10) * deg(270);
  return { kind: "box", size: [0.2, 0.06, 0.08], at: [1.53 * Math.cos(a), 1.53 * Math.sin(a), 0.04], angle: a };
});

const needle = {
  outline: [
    [-0.42, -0.05],
    [-0.28, -0.08],
    [-0.28, -0.03],
    [1.32, -0.012],
    [1.38, 0],
    [1.32, 0.012],
    [-0.28, 0.03],
    [-0.28, 0.08],
    [-0.42, 0.05],
  ],
  holes: [],
};

export default {
  figure: 500,
  parts: [
    {
      id: "case",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 2.0, inner: 1.82, length: 0.8, at: [0, 0, -0.25] },
        { kind: "plate", shape: ring(1.82, 1.25), thickness: 0.04, circles: [1.62, 1.44] },
        ...ticks,
        { kind: "cylinder", radius: 0.2, length: 0.75, axis: Y, at: [0, -2.35, -0.25] },
        { kind: "cylinder", radius: 0.32, length: 0.16, axis: Y, at: [0, -2.72, -0.25] },
        { kind: "plate", shape: { outline: rect(0.9, 0.12, DISC.x, DISC.y - 0.31), holes: [] }, thickness: 0.5, at: [0, 0, MECH_Z] },
      ],
    },
    {
      id: "discA",
      kind: "lathe",
      axis: Y,
      center: [DISC.x, DISC.y - 0.25, MECH_Z], // 碟片頂在 DISC.y
      // 波紋碟片:剖面上的同心波紋,整體隨壓力往上拱(縮放局部 Z)
      profile: Array.from({ length: 25 }, (_, i) => {
        const r = DISC.radius * (1 - i / 24);
        return [r, 0.25 * (1 - (r / DISC.radius) ** 2) + 0.04 * Math.sin((r / DISC.radius) * 5 * Math.PI)];
      }),
      label: "A",
      labelOffset: [-0.65, -0.05, 0],
    },
    { id: "rod", kind: "link", width: 0.07, thickness: 0.05, axis: [0, 0, 1] },
    {
      id: "sector",
      kind: "gear",
      center: [...SECTOR.center.slice(0, 2), MECH_Z],
      teeth: SECTOR.teeth,
      radius: SECTOR.radius,
      span: [deg(-12), deg(64)],
      width: 0.08,
      pieces: [{ kind: "plate", shape: stadium(TAIL.length, 0.1), thickness: 0.08, angle: TAIL.at }],
      label: "e",
      labelOffset: [0.15, 0.3, 0],
    },
    { id: "pinion", kind: "gear", center: [0, 0, MECH_Z], teeth: PINION.teeth, radius: PINION.radius, width: 0.08, arrow: false },
    { id: "arbor", kind: "cylinder", center: [0, 0, MECH_Z / 2 + 0.06], radius: 0.035, length: 0.5 },
    { id: "needle", kind: "plate", center: [0, 0, 0.16], shape: needle, thickness: 0.04, hub: 0.08, spin: 1.1 },
  ],
  driver: { type: "virtual", label: "壓力", mode: "balance", range: [0, MAX] },
  target: "needle",
  view: { direction: [0.1, 0.08, 1] },
  pose(p) {
    const { lift, discTop, pin, sector, pinion } = gauge(Math.min(MAX, Math.max(0, p)));
    const turn = pinion - REST.pinion;
    return {
      parts: {
        discA: { scale: [1, 1, (0.25 + lift) / 0.25] },
        rod: { from: [discTop[0], discTop[1], MECH_Z + 0.06], to: [pin[0], pin[1], MECH_Z + 0.06] },
        sector: { angle: sector },
        pinion: { angle: pinion },
        needle: { angle: ZERO + turn },
      },
      readouts: [],
    };
  },
};
