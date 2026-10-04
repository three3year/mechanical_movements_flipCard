// 第 195 種:驅動一對進料滾軸的方式,兩者相對的表面要朝同一方向運動。兩個輪完全相同,都與放在它們之間的
// 無端螺桿(蝸桿)咬合:上輪的齒在前面看得到,下輪在後面(兩輪前後錯開,所以在圖中重疊),齒被遮住。
// 蝸桿從上方帶上輪、從下方帶下輪,兩輪反向轉,相對的一側(靠蝸桿的一側)朝同一方向走。主動件是蝸桿。
// 推斷:兩輪前後錯開的距離;齒數;蝸桿為右旋單線;各輪另一側同軸的光面滾軸(下輪的在前,原圖可見)。
import { TAU, X } from "./kit.js";

const N = 24;
const R = 1.4;
const PITCH = (TAU * R) / N;
const WORM = { radius: 0.22, length: 1.7 };
const Y = R + WORM.radius - 0.04;
const Z = 0.22;

// 蝸桿轉 theta 時,局部角 at 處螺紋的軸向位置(右旋:z = −L/2 + a·節距/2π)
const crest = (theta, at) => -WORM.length / 2 + ((at - theta) / TAU) * PITCH;

/** 蝸桿轉 theta:上輪與下輪的轉角(齒落在螺紋之間,每圈一齒) */
export function rolls(theta) {
  const top = crest(theta, Math.PI / 2);
  const bottom = crest(theta, -Math.PI / 2);
  return { upper: -Math.PI / 2 + (top + PITCH / 2) / R, lower: Math.PI / 2 - (bottom + PITCH / 2) / R };
}
export const geometry = { N, R };

const wheel = (id, y, z) => ({
  id,
  kind: "gear",
  center: [0, y, z],
  teeth: N,
  radius: R,
  width: 0.3,
  bore: 0.14,
  pieces: [
    { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.45 },
    { kind: "cylinder", radius: 0.14, length: 1.6, at: [0, 0, -Math.sign(z) * 0.55] },
    // 同軸的進料滾軸(光面),在齒輪的另一側;下輪的滾軸在前,遮住蝸桿(原圖的虛線)
    { kind: "cylinder", radius: Y - 0.06, length: 0.35, at: [0, 0, -Math.sign(z) * 0.62] },
  ],
});

export default {
  figure: 195,
  parts: [
    { id: "worm", kind: "worm", axis: X, center: [0, 0, 0], radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: 0.08, pieces: [{ kind: "cylinder", radius: 0.12, length: 6.0 }] },
    wheel("upper", Y, Z),
    wheel("lower", -Y, -Z),
  ],
  driver: { part: "worm", type: "rotation", speed: 3 },
  targets: ["upper", "lower"], // 一對進料滾軸
  view: { direction: [0.12, 0.08, 1] },
  pose(theta) {
    const { upper, lower } = rolls(theta);
    return { parts: { worm: { angle: theta }, upper: { angle: upper }, lower: { angle: lower } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["worm", "lower"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、兩個蝸輪是直齒,齒頂伸進蝸桿的芯 0.05" },
    { check: "interference", parts: ["worm", "upper"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、兩個蝸輪是直齒,齒頂伸進蝸桿的芯 0.05" },
  ],
};
