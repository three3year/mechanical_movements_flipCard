// 第 106、107 種共用:水平軸上的圓筒,表面切出一道溝(106 斜繞一圈、107 彎繞成幾個波);
// 上方兩個吊架之間有一根水平桿,桿上的銷插進溝裡。圓筒均勻旋轉時,桿做均勻的往復直線運動。
// 桿穿過吊架下端的軸套;圓筒的軸兩端架在軸承座上(原圖只畫出軸,軸承座是推斷)。
// 桿的位置由溝推銷決定(動力重演:桿是沿 x 的自由滑塊,只被溝的兩側推動)。
import { X, TAU } from "./kit.js";
import { grooveRidges, roundedTriangle } from "./groove-drum.js";
import { pedestalX } from "./supports.js";

const R = 1.0;
const PIN = Math.PI / 2; // 銷在圓筒正上方(圓筒局部角 90°)

export function grooveCam({ figure, waves, amp, length, width = 0.24, view }) {
  const g = (phi) => roundedTriangle(phi, amp, TAU / waves);
  // 凸條高出圓筒 0.1、銷伸到離筒面 0.01:銷夾在兩條凸條之間,不會越過去。取樣數只取畫得圓滑所需(每個波約 32 點),
  // 動力重演把凸條切成一段段凸塊,點越多越慢
  const ridges = grooveRidges(g, { radius: R + 0.05, width, samples: Math.max(96, waves * 32) });
  /** 圓筒轉 θ:桿的位置 */
  const rodX = (theta) => g(PIN - theta);
  const period = TAU / waves;
  const shaft = length / 2 + 1.0; // 軸承座的位置(圓筒端面外)
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
            { kind: "cylinder", axis: [0, 1, 0], radius: 0.05, length: 0.54, at: [0, R + 0.28, 0] }, // 插進溝裡的圓銷
          ],
        },
        {
          id: "frame",
          kind: "group",
          pieces: [
            { kind: "box", size: [5.0, 0.35, 1.2], at: [0, R + 1.55, 0] },
            // 吊架:立柱下端一個軸套,桿穿在裡面滑動
            ...[-1.6, 1.6].flatMap((x) => [
              { kind: "box", size: [0.3, 0.42, 0.3], at: [x, R + 1.17, 0] },
              { kind: "cylinder", axis: X, radius: 0.22, inner: 0.12, length: 0.3, at: [x, R + 0.75, 0] },
            ]),
            ...pedestalX({ x: -shaft, y: 0, z: 0, bore: 0.22, floor: -R - 0.5 }),
            ...pedestalX({ x: shaft, y: 0, z: 0, bore: 0.22, floor: -R - 0.5 }),
          ],
        },
      ],
      driver: { part: "drum", type: "rotation", speed: 0.7 },
      target: "rod", // 均勻往復直線運動的桿
      replay: {
        free: { rod: { slide: [1, 0, 0], gravity: false } },
        expect: [
          { at: PIN, part: "rod", label: "溝的一側把銷推到一端", quote: "均勻的往復直線運動,由開槽凸輪的旋轉運動所產生" },
          { at: PIN + period / 2, part: "rod", label: "溝的另一側把銷推回另一端" },
          { part: "rod", label: "圓筒轉完一圈,桿回到起點" },
        ],
      },
      view: view ?? { direction: [0.05, 0.12, 1], fov: 22 },
      pose(theta) {
        return { parts: { drum: { angle: theta }, rod: { position: [rodX(theta), 0, 0] } }, readouts: [] };
      },
    },
  };
}
