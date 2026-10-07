// 第 230 種:圓周運動轉換為圓周運動。上下兩根平行的軸,右端各一個圓盤、左端各一支曲柄;右邊一根連桿連接兩個圓盤上的
// 銷,左邊一根連接兩支曲柄。兩對曲柄方向相差直角:一對在死點(與連桿成一直線,或在行程末端)時,另一對正好在直角位置,
// 所以不用飛輪也能保證運動連續。主動件是上軸。
// 推斷:兩根連桿都等於軸距、曲柄等長(平行曲柄),下軸與上軸同轉角;兩根軸穿過中間的一塊立板(軸承,原圖沒畫)。
import { polar } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const GAP = 3.2;
const R = 0.55;
const UPPER = [0, GAP / 2, 0];
const LOWER = [0, -GAP / 2, 0];
const Z = { disc: 1.0, crank: -1.0 };
const PHASE = { disc: Math.PI / 2, crank: 0 }; // 圓盤的銷朝上時,曲柄朝右:相差直角

/** 上軸轉 theta:下軸的轉角,與兩對銷離「死點」的程度(0 為死點,1 為直角) */
export function cranks(theta) {
  const offDead = (phase) => Math.abs(Math.cos(theta + phase));
  return { lower: theta, disc: offDead(PHASE.disc), crank: offDead(PHASE.crank) };
}

const shaft = (id, center) => ({
  id,
  kind: "group",
  center,
  spin: 0.9,
  pieces: [
    { kind: "cylinder", radius: 0.12, length: 2.2, mark: true },
    { kind: "plate", shape: shape(circle(0.9), [circle(0.12).reverse()]), thickness: 0.14, at: [0, 0, Z.disc] },
    { kind: "cylinder", radius: 0.07, length: 0.3, at: [...polar(R, PHASE.disc).slice(0, 2), Z.disc + 0.15] },
    { kind: "plate", shape: shape(stadium(R, 0.32).outline, [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, Z.crank], angle: PHASE.crank },
    { kind: "cylinder", radius: 0.06, length: 0.3, at: [...polar(R, PHASE.crank).slice(0, 2), Z.crank - 0.15] },
  ],
});

export default {
  figure: 230,
  parts: [
    shaft("upper", UPPER),
    shaft("lower", LOWER),
    { id: "rodDisc", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "rodCrank", kind: "link", width: 0.1, thickness: 0.06 },
    // 立板:兩根軸穿過它(軸承孔沒畫出來),底下一塊底板
    { id: "standard", kind: "group", pieces: [{ kind: "box", size: [0.9, 4.6, 0.3], at: [0, -0.3, 0] }, { kind: "box", size: [2.0, 0.15, 1.2], at: [0, -2.68, 0] }] },
  ],
  driver: { part: "upper", type: "rotation" },
  target: "lower",
  view: { direction: [-0.7, 0.25, 1] },
  pose(theta) {
    const pin = (center, which, dz) => {
      const p = polar(R, theta + PHASE[which]);
      return [center[0] + p[0], center[1] + p[1], Z[which] + dz];
    };
    return {
      parts: {
        upper: { angle: theta },
        lower: { angle: cranks(theta).lower },
        rodDisc: { from: pin(UPPER, "disc", 0.25), to: pin(LOWER, "disc", 0.25) },
        rodCrank: { from: pin(UPPER, "crank", -0.25), to: pin(LOWER, "crank", -0.25) },
      },
      readouts: [],
    };
  },
};

