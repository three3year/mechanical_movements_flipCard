// 第 26 種:右側的齒輪是冠狀齒輪(齒長在輪面上),與它咬合的是一般的正齒輪。
// 正齒輪的軸直立、冠狀齒輪的軸水平;冠狀齒輪的齒必須做得很薄,只適用於輕載。
import { X, Y } from "./kit.js";
import { meshAngle } from "./gears.js";

const M = 0.11;
const SPUR = { center: [0, 2.6, 0], axis: Y, teeth: 26, radius: (26 * M) / 2 };
const CROWN = { center: [SPUR.radius + 0.28, 1.05, 0], axis: [-1, 0, 0], teeth: 32, radius: (32 * M) / 2 };
// 接觸點:正齒輪最右側的齒,落在冠狀齒輪輪面頂端的齒上
const CONTACT = [SPUR.radius, SPUR.center[1], 0];

export const gears = { SPUR, CROWN };

export default {
  figure: 26,
  parts: [
    {
      id: "spur",
      kind: "gear",
      center: SPUR.center,
      axis: Y,
      teeth: SPUR.teeth,
      radius: SPUR.radius,
      width: 0.3,
      pieces: [{ kind: "cylinder", radius: 0.14, length: 1.6, at: [0, 0, 0.8] }],
    },
    {
      id: "crown",
      kind: "gear",
      crown: true,
      center: CROWN.center,
      axis: CROWN.axis,
      teeth: CROWN.teeth,
      radius: CROWN.radius,
      width: 0.36,
      toothDepth: 0.2,
      faceWidth: 0.42,
      pieces: [{ kind: "cylinder", radius: 0.13, length: 1.6, at: [0, 0, -0.9] }],
    },
  ],
  driver: { part: "spur", type: "rotation" },
  view: { direction: [0.12, 0.12, 1] },
  pose(angle) {
    return { parts: { spur: { angle }, crown: { angle: meshAngle(SPUR, CROWN, angle, CONTACT) } }, readouts: [] };
  },
};
