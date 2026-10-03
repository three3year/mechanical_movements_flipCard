// 第 70、71 種共用:右側的驅動輪(逆時針)上有一支撥爪與一圈開了口的輪緣,左側的輪面上有一圈凸柱。
// 撥爪每轉一圈撥動一根凸柱,左輪轉過一個凸柱的距離(順時針);其餘時間凸柱靠在輪緣上被鎖住。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, shape } from "./shapes.js";
import { indexStep } from "./jumps.js";

/**
 * rim:{ radius, inner, gaps: [[from, to], …] }(驅動輪局部角);tappet:撥爪長度;
 * wheel / driver:{ center, radius };studs:{ count, radius };labels:{ wheel, driver, tappet }。
 */
export function studIndex({ figure, wheel, driver, studs, rim, tappet, labels, span = deg(40), view }) {
  const step = TAU / studs.count;
  const toward = Math.atan2(wheel.center[1] - driver.center[1], wheel.center[0] - driver.center[0]);
  // 撥爪在驅動輪局部角 π(主動量 0 時指向左輪);撥動視窗以正對左輪為中心
  const window = { from: toward - Math.PI - span / 2, span };
  const index = (v) => -indexStep(v, { ...window, step });
  // 左輪的凸柱:鎖住時兩根凸柱對稱地落在連心線兩側
  const studAt = (i) => polar(studs.radius, (i + 0.5) * step);
  const rimShape = (() => {
    const outline = [];
    const holes = [];
    // 以幾段弧組成有開口的輪緣
    const segments = [];
    let start = rim.gaps[rim.gaps.length - 1][1] - TAU;
    for (const [g0, g1] of rim.gaps) {
      segments.push([start, g0]);
      start = g1;
    }
    return segments.map(([a0, a1]) => shape([...arcPoints(rim.radius, a0, a1), ...arcPoints(rim.inner, a1, a0)], holes));
  })();
  return {
    index,
    step,
    def: {
      figure,
      parts: [
        {
          id: "wheel",
          kind: "plate",
          center: wheel.center,
          shape: shape(circle(wheel.radius), [circle(0.14).reverse()]),
          thickness: 0.2,
          hub: 0.3,
          circles: [0.38],
          spin: wheel.radius,
          pieces: Array.from({ length: studs.count }, (_, i) => ({
            kind: "cylinder",
            radius: 0.1,
            length: 0.6,
            at: [...studAt(i).slice(0, 2), 0.35],
            accent: i === 0,
          })),
          label: labels.wheel,
          labelOffset: [0, 0.6, 0.3],
        },
        // 驅動輪的輪板在左輪後面(像原圖,左輪畫在前面);輪緣與撥爪從輪板往前伸到凸柱那一層
        {
          id: "driver",
          kind: "group",
          center: [driver.center[0], driver.center[1], -0.5],
          spin: driver.radius,
          spinOffset: 0.9,
          pieces: [
            { kind: "plate", shape: shape(circle(driver.radius), [circle(0.14).reverse()]), thickness: 0.14 },
            ...rimShape.map((s) => ({ kind: "plate", shape: s, thickness: 0.7, at: [0, 0, 0.42] })),
            { kind: "plate", shape: shape(circle(0.36), [circle(0.14).reverse()]), thickness: 0.6, at: [0, 0, 0.3] },
            {
              kind: "plate",
              shape: shape([[0, 0.12], [-tappet, 0.06], [-tappet - 0.06, 0], [-tappet, -0.06], [0, -0.12]]),
              thickness: 0.14,
              at: [0, 0, 0.6],
              accent: true,
            },
          ],
          label: labels.driver,
          labelOffset: [0.2, -0.65, 1.2],
        },
        ...(labels.tappet ? [{ id: "labelTappet", kind: "group", label: labels.tappet, labelOffset: [0, 0, 0.6] }] : []),
      ],
      driver: { part: "driver", type: "rotation", initial: window.from + span / 2, speed: 1.2 },
      target: "wheel",
      view: view ?? { direction: [0.06, 0.05, 1] },
      pose(v) {
        const mid = polar(tappet * 0.55, Math.PI + v);
        return {
          parts: {
            driver: { angle: v },
            wheel: { angle: index(v) },
            ...(labels.tappet ? { labelTappet: { position: [driver.center[0] + mid[0], driver.center[1] + mid[1] + 0.2, 0.4] } } : {}),
          },
          readouts: [],
        };
      },
    },
  };
}
