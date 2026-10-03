// 第 37 種:均勻旋轉運動轉換為變速旋轉運動。左側倒置的錐形齒輪,齒貫穿整個輪面寬度;
// 右側的圓錐輪上有一串排成螺旋的齒栓。左輪等速轉,與它咬合的齒栓沿螺旋上下移動,
// 接觸處兩輪的半徑跟著改變,右輪轉速因而變化(右輪轉一圈,螺旋走完一圈後回到起點)。
import { TAU, Y } from "./kit.js";
import { bevelGear } from "./gears.js";
import { cumulative, periodic, inverseOf } from "./noncircular.js";

const H = 2.6; // 錐高
const D = 2.25; // 兩軸距離
const LEFT_X = -D / 2;
const RIGHT_X = D / 2;
const rLeft = (h) => 0.6 + (1.4 * h) / H; // 左輪在高度 h 的半徑(上寬下窄)
const rRight = (h) => D - rLeft(h); // 右輪(下寬上窄),兩者相加等於軸距
const STUDS = 18;
const SPIRAL = { low: 0.25, high: 2.35 };
// 螺旋:右輪局部角 φ(一圈)對應的高度
const spiralHeight = (phi) => {
  const t = (((phi / TAU) % 1) + 1) % 1;
  return SPIRAL.low + (SPIRAL.high - SPIRAL.low) * t;
};

// 右輪轉 ψ 時接觸處在它的局部角 π − ψ;左輪轉角 α 與 ψ 的關係:r左 dα = r右 dψ
const contactHeight = (psi) => spiralHeight(Math.PI - psi);
const table = cumulative((psi) => rRight(contactHeight(psi)) / rLeft(contactHeight(psi)), TAU);
const rightOf = periodic(inverseOf(table), table.ys[table.ys.length - 1]);

/** 左輪轉 alpha 時右輪的轉角(繞 +y);左輪的軸朝下,轉角 alpha 繞 −y */
export const rightAngle = (alpha) => rightOf(alpha);
export const heightAt = (alpha) => contactHeight(rightAngle(alpha));
export const radii = { rLeft, rRight };

const LEFT = bevelGear({ apex: [LEFT_X, H - (2.0 * H) / 1.4, 0], axis: [0, -1, 0], teeth: 40, radius: 2.0, cone: Math.atan(1.4 / H), width: H });

const studs = Array.from({ length: STUDS }, (_, i) => {
  const phi = (i / STUDS) * TAU;
  const h = spiralHeight(phi);
  const r = rRight(h) + 0.05;
  return { kind: "cylinder", radius: 0.07, length: 0.2, axis: [Math.cos(phi), Math.sin(phi), 0], at: [r * Math.cos(phi), r * Math.sin(phi), h - H / 2], accent: i === 0 };
});

export default {
  figure: 37,
  parts: [
    {
      id: "left",
      kind: "gear",
      center: [LEFT_X, H / 2, 0],
      axis: [0, -1, 0],
      teeth: LEFT.teeth,
      radius: LEFT.radius,
      cone: LEFT.cone,
      width: H,
      pieces: [{ kind: "cylinder", radius: 0.12, length: H + 1.6 }],
    },
    {
      id: "right",
      kind: "lathe",
      axis: Y,
      center: [RIGHT_X, H / 2, 0],
      profile: [[0, -H / 2], [rRight(0) - 0.05, -H / 2], [rRight(H) - 0.05, H / 2], [0, H / 2]],
      spin: 1.7,
      spinOffset: -H / 2 + 0.1,
      pieces: [...studs, { kind: "cylinder", radius: 0.12, length: H + 1.6 }],
    },
  ],
  waivers: [
    { check: "interference", parts: ["left", "right"], reason: "簡化齒形:右輪的齒栓是圓柱,伸進左輪錐形齒輪的齒間;齒栓與梯形齒的齒側重疊是齒形簡化" },
  ],
  driver: { part: "left", type: "rotation" },
  target: "right", // 得到變速旋轉的錐形輪
  view: { direction: [0.03, 0.08, 1] },
  pose(alpha) {
    return { parts: { left: { angle: alpha }, right: { angle: rightAngle(alpha) } }, readouts: [] };
  },
};
