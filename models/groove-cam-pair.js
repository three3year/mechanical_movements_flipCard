// 第 106、107 種共用:水平軸上的圓筒,表面切出一道溝(106 斜繞一圈、107 彎繞成幾個波);
// 上方兩個吊架之間有一根水平桿,桿上的銷插進溝裡。圓筒均勻旋轉時,桿做均勻的往復直線運動。
import { X, TAU } from "./kit.js";
import { grooveRidges, roundedTriangle } from "./groove-drum.js";

const R = 1.0;
const PIN = Math.PI / 2; // 銷在圓筒正上方(圓筒局部角 90°)

export function grooveCam({ figure, waves, amp, length, view }) {
  const g = (phi) => roundedTriangle(phi, amp, TAU / waves);
  const ridges = grooveRidges(g, { radius: R + 0.02, width: 0.24 });
  /** 圓筒轉 θ:桿的位置 */
  const rodX = (theta) => g(PIN - theta);
  return {
    rodX,
    amp,
    waves,
    def: {
      figure,
      parts: [
        {
          id: "drum",
          kind: "group",
          axis: X,
          spin: R,
          spinOffset: length / 2 + 0.1,
          pieces: [
            { kind: "cylinder", radius: R, length, mark: true },
            ...ridges.map((points) => ({ kind: "tube", points, radius: 0.05, closed: true })),
            { kind: "cylinder", radius: 0.22, length: length + 2.6 },
          ],
        },
        {
          id: "rod",
          kind: "group",
          pieces: [
            { kind: "cylinder", axis: X, radius: 0.1, length: 4.4, at: [0, R + 0.75, 0] },
            { kind: "box", size: [0.28, 0.36, 0.28], at: [0, R + 0.75, 0] },
            { kind: "box", size: [0.1, 0.5, 0.1], at: [0, R + 0.3, 0] },
          ],
        },
        {
          id: "frame",
          kind: "group",
          pieces: [
            { kind: "box", size: [5.0, 0.35, 1.2], at: [0, R + 1.55, 0] },
            { kind: "box", size: [0.3, 0.75, 0.3], at: [-1.6, R + 1.0, 0] },
            { kind: "box", size: [0.3, 0.75, 0.3], at: [1.6, R + 1.0, 0] },
          ],
        },
      ],
      driver: { part: "drum", type: "rotation", speed: 0.7 },
      target: "rod", // 均勻往復直線運動的桿
      view: view ?? { direction: [0.05, 0.12, 1], fov: 22 },
      pose(theta) {
        return { parts: { drum: { angle: theta }, rod: { position: [rodX(theta), 0, 0] } }, readouts: [] };
      },
    },
  };
}
