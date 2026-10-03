// 第 55 種:藉由小齒輪,使同一軸線上的兩個齒輪 A 與 C 產生不同的轉速。
// A 是中央的正齒輪,C 是同心的內齒輪,兩者之間的小齒輪 B 裝在固定的銷上當惰輪。
// A 轉動時 C 反向轉,轉速比為齒數反比。
import { meshAngle } from "./gears.js";

const M = 0.1;
export const A = { center: [0, 0, 0], teeth: 14, radius: (14 * M) / 2 };
export const B = { center: [-(14 + 10) * (M / 2), 0, 0], teeth: 10, radius: (10 * M) / 2 };
export const C = { center: [0, 0, 0], teeth: 34, radius: (34 * M) / 2, internal: true };

export default {
  figure: 55,
  parts: [
    { id: "a", kind: "gear", center: A.center, teeth: A.teeth, radius: A.radius, width: 0.3, bore: 0.12, label: "A", labelOffset: [0.45, 0, 0.3] },
    { id: "b", kind: "gear", center: B.center, teeth: B.teeth, radius: B.radius, width: 0.3, web: false, label: "B", labelOffset: [0.2, -0.55, 0.3] },
    { id: "c", kind: "gear", internal: true, center: C.center, teeth: C.teeth, radius: C.radius, rim: C.radius + 0.22, width: 0.24, label: "C", labelOffset: [0, -1.05, 0.3] },
  ],
  driver: { part: "a", type: "rotation" },
  view: { direction: [0.08, 0.06, 1] },
  pose(angle) {
    const b = meshAngle(A, B, angle);
    return { parts: { a: { angle }, b: { angle: b }, c: { angle: meshAngle(B, C, b) } }, readouts: [] };
  },
};
