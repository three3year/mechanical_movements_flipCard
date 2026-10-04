// 第 231 種:拖曳連桿運動(drag-link motion),把圓周運動從一支曲柄傳到另一支。兩根平行的軸離得很近,
// 兩支曲柄都比軸距長,以一根連桿相連:主動曲柄轉一整圈,從動曲柄也轉一整圈,但速度時快時慢。主動件是左邊的曲柄。
// 推斷:各桿長度依原圖比例。
import { polar } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const O1 = [0, 0, 0];
const O2 = [0.75, 0.15, 0];
const A = 1.6; // 主動曲柄
const B = 1.15; // 從動曲柄
const C = 1.75; // 連桿
const START = 1.05;

/** 主動曲柄轉 theta:兩支曲柄的銷與從動曲柄的轉角 */
export function dragLink(theta) {
  const p = polar(A, START + theta);
  const q = circleCircle(p, C, O2, B, 1).point;
  return { p, q, angle: Math.atan2(q[1] - O2[1], q[0] - O2[0]) };
}
export const geometry = { O1, O2, A, B, C };
const Q0 = dragLink(0).angle;

const crank = (id, center, len, angle, z, shaftZ) => ({
  id,
  kind: "group",
  center: [center[0], center[1], z],
  spin: len + 0.2,
  pieces: [
    { kind: "plate", shape: shape(stadium(len, 0.36).outline, [circle(0.1).reverse()]), thickness: 0.12, angle },
    { kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, shaftZ], mark: true },
  ],
});

export default {
  figure: 231,
  // 主動曲柄在後、軸往後伸;從動曲柄在前、軸往前伸;連桿夾在中間(兩根軸不同心,曲柄才不會掃過對方的軸)
  parts: [crank("driver", O1, A, START, 0, -1.3), crank("follower", O2, B, Q0, 0.3, 1.3), { id: "link", kind: "link", width: 0.3, thickness: 0.1 }],
  driver: { part: "driver", type: "rotation" },
  target: "follower",
  view: { direction: [0.3, 0.7, 1] },
  pose(theta) {
    const { p, q, angle } = dragLink(theta);
    return {
      parts: {
        driver: { angle: theta },
        follower: { angle: angle - Q0 },
        link: { from: [p[0], p[1], 0.15], to: [q[0], q[1], 0.15] },
      },
      readouts: [],
    };
  },
};
