// 第 142 種:絲織機中改變橫移導桿行程的裝置。大圓盤繞固定的中央凸柱轉,凸柱末端固定著一個小齒輪;
// 圓盤上的正齒輪(能繞自己的中心轉)與固定的小齒輪咬合,隨圓盤繞轉時也一點一點自轉。
// 正齒輪上用螺栓固定一支小曲柄,曲柄銷經連桿帶動下方的橫移導桿上下。正齒輪自轉時曲柄銷時近時遠於圓盤中心,
// 所以導桿的行程逐圈縮短、再逐圈加長;正齒輪轉滿一圈(圓盤轉 N齒輪/N小齒輪 圈)時回到原樣。主動件是大圓盤。
import { polar, add } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, circle, rect } from "./shapes.js";
import { pedestal } from "./supports.js";
// 支撐(推斷):中央凸柱往後固定在軸承座上(圓盤套在凸柱上轉);正齒輪套在圓盤上的銷上;
// 橫移導桿加長,穿在下方固定的方形導套裡(導桿走 3.4,導套要在整個行程裡都套著它)。
const GUIDE_LEN = 3.8;
const SLEEVE_Y = -4.55;

const SUN = { center: [0, 0, 0], teeth: 6, radius: 0.3 };
const GEAR = { teeth: 18, radius: 0.9 };
const D = SUN.radius + GEAR.radius;
const CRANK = 0.55; // 曲柄銷離正齒輪中心的距離
const ROD = 2.7;
const DISC = 2.25;
const G_AT = -Math.PI / 2; // 原圖:正齒輪在凸柱正下方

const SPIN0 = meshAngle(SUN, { center: polar(D, G_AT), teeth: GEAR.teeth, radius: GEAR.radius }, 0);

/** 圓盤轉 phi:正齒輪中心、正齒輪轉角、曲柄銷與導桿的高度 */
export function traverse(phi) {
  const center = polar(D, G_AT + phi);
  // 小齒輪固定:正齒輪的絕對轉角 = 圓盤轉角 × (1 + N小齒輪/N正齒輪),起點是咬合的相位
  const spin = SPIN0 + phi * (1 + SUN.teeth / GEAR.teeth);
  const pin = add(center, polar(CRANK, spin + Math.PI / 2));
  return { center, spin, pin, y: pin[1] - Math.sqrt(ROD * ROD - pin[0] * pin[0]) };
}
export const relativeTurns = GEAR.teeth / SUN.teeth;

export default {
  figure: 142,
  parts: [
    {
      id: "disc",
      kind: "plate",
      shape: shape(circle(DISC), [circle(0.12).reverse()]),
      thickness: 0.1,
      center: [0, 0, -0.25],
      circles: [DISC - 0.2],
      spin: DISC,
      mark: [0, DISC - 0.5],
      markSize: 0.08,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 0.4, at: [...polar(D, G_AT).slice(0, 2), 0.18] }], // 正齒輪的銷(固定在圓盤上)
    },
    { id: "sun", kind: "gear", center: [0, 0, 0], teeth: SUN.teeth, radius: SUN.radius, width: 0.25, web: false, arrow: false },
    {
      id: "gear",
      kind: "gear",
      teeth: GEAR.teeth,
      radius: GEAR.radius,
      width: 0.22,
      web: false,
      bore: 0.1,
      pieces: [
        { kind: "plate", shape: shape(rect(0.42, CRANK + 0.5, 0, CRANK / 2), [circle(0.1, 0, 0).reverse()]), thickness: 0.08, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.4, at: [0, CRANK, 0.25], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.18, thickness: 0.08 },
    { id: "guide", kind: "group", pieces: [{ kind: "box", size: [0.2, GUIDE_LEN, 0.16], at: [0, -GUIDE_LEN / 2, 0] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.475] }, // 固定的中央凸柱(小齒輪固定在它的前端)
        ...pedestal({ at: [0, 0], z: -0.7, bore: 0.12, floor: SLEEVE_Y - 0.4 }), // 立柱一路到導套下方
        // 橫移導桿的方形導套(四片板)與立柱
        { kind: "box", size: [0.06, 0.3, 0.28], at: [-0.13, SLEEVE_Y, 0.3] },
        { kind: "box", size: [0.06, 0.3, 0.28], at: [0.13, SLEEVE_Y, 0.3] },
        { kind: "box", size: [0.2, 0.3, 0.06], at: [0, SLEEVE_Y, 0.41] },
        { kind: "box", size: [0.2, 0.3, 0.06], at: [0, SLEEVE_Y, 0.19] },
        { kind: "box", size: [0.2, 0.2, 0.72], at: [0, SLEEVE_Y - 0.25, -0.2] }, // 托架:從立柱伸到導套下緣
      ],
    },
  ],
  driver: { part: "disc", type: "rotation", speed: 1.2 },
  target: "guide",
  view: { direction: [0.06, 0.05, 1], fit: ["disc", "gear", "rod"] },
  waivers: [
    { check: "interference", parts: ["sun", "frame"], reason: "小齒輪牢固地裝在固定凸柱的前端(原文):小齒輪的轂套在凸柱上,兩者是一體的,分開畫成兩件" },
  ],
  pose(phi) {
    const { center, spin, pin, y } = traverse(phi);
    return {
      parts: {
        disc: { angle: phi },
        gear: { position: [center[0], center[1], 0], angle: spin },
        rod: { from: [pin[0], pin[1], 0.4], to: [0, y, 0.4] },
        guide: { position: [0, y, 0.3] },
      },
      readouts: [],
    };
  },
};

