// 第 64、66、67 種共用:底部的蝸桿帶動蝸輪 B,蝸輪軸上套著空心軸(帶凸輪、重物或擺錘)。
// 空心軸切掉一段,蝸輪軸上的銷 C 從缺口伸出,推著空心軸走;到臨界點後空心軸(靠彈簧或重力)
// 突然往前落過缺口的寬度、停住,等銷追上來再推(見 jumps.pushAndFall)。主動件是蝸桿。
import { X, TAU } from "./kit.js";
import { pushAndFall } from "./jumps.js";
import { arcPoints } from "./shapes.js";

const N = 24;
const R = 1.2; // 蝸輪節圓半徑
const PITCH = (TAU * R) / N;
const WORM = { radius: 0.34, length: 1.3, y: -(R + 0.34 - 0.03) };
const SIDE = Math.PI / 2; // 蝸桿朝上那一側(朝蝸輪)的局部角:axis X 時局部 +Y 為世界 +Y
const HOLLOW = { outer: 0.5, inner: 0.36 };

/** 蝸桿轉 theta 時蝸輪的轉角(逆時針為正;蝸輪的齒落在兩道螺紋之間) */
export function wormWheel(theta) {
  // 左旋螺紋:局部角 a 處在 z = −L/2 − a·節距/2π;轉 theta 後朝上那一點 a = SIDE − theta
  const crest = -WORM.length / 2 - ((SIDE - theta) / TAU) * PITCH;
  return -Math.PI / 2 + (crest + PITCH / 2) / R;
}

/**
 * fall:往前落的角度(= 缺口寬度);push:被推的角度;rest0:蝸輪轉角為 0 時空心軸剛落定的轉角。
 * hollowPieces:固定在空心軸上的零件(凸輪、重物);startFraction:初始時推到臨界點的幾成。
 */
export function wormJump({ figure, fall, push, rest0, hollowPieces, hollowLabel, wheelLabel = "B", pinLabel, view, extraParts = [], extraPose }) {
  const period = fall + push;
  const hollowAt = (wheel) => pushAndFall(wheel - B0, { push, fall, rest0 });
  // 銷推著缺口在局部角 0 的那一面:推的時候銷的角度 = 空心軸轉角
  const B0 = wormWheel(0);
  const PIN = rest0 - fall - B0;
  const start = N * (fall + 0.93 * push) + 0.0;
  const gap = [...arcPoints(HOLLOW.outer, 0, TAU - fall), ...arcPoints(HOLLOW.inner, TAU - fall, 0)];
  return {
    hollowAt,
    period,
    def: {
      figure,
      parts: [
        {
          id: "worm",
          kind: "worm",
          axis: X,
          center: [0, WORM.y, 0],
          radius: WORM.radius,
          length: WORM.length,
          pitch: PITCH,
          hand: -1,
          thread: 0.12,
          pieces: [{ kind: "cylinder", radius: 0.08, length: 3.0 }],
        },
        {
          id: "wheel",
          kind: "gear",
          teeth: N,
          radius: R,
          width: 0.2,
          center: [0, 0, -0.25],
          bore: 0.12,
          label: wheelLabel,
          labelOffset: [0, -0.75, 0.4],
          pieces: [
            { kind: "cylinder", radius: 0.22, length: 1.1, at: [0, 0, 0.55] },
            { kind: "box", size: [0.12, 0.12, 0.3], at: [0.27 * Math.cos(PIN), 0.27 * Math.sin(PIN), 0.7], angle: PIN, accent: true },
          ],
        },
        {
          id: "hollow",
          kind: "group",
          center: [0, 0, 0.45],
          spin: 0.9,
          pieces: [{ kind: "plate", shape: { outline: gap, holes: [] }, thickness: 0.3 }, ...hollowPieces],
          label: hollowLabel,
          labelOffset: [-0.65, 0.2, 0.4],
        },
        ...(pinLabel ? [{ id: "pinMark", kind: "group", label: pinLabel, labelOffset: [0, 0, 0.9] }] : []),
        ...extraParts,
      ],
      driver: { part: "worm", type: "rotation", initial: start, speed: 6 },
      view: view ?? { direction: [0.06, 0.05, 1] },
      pose(theta) {
        const wheel = wormWheel(theta);
        const hollow = hollowAt(wheel);
        const pin = wheel + PIN;
        return {
          parts: {
            worm: { angle: theta },
            wheel: { angle: wheel },
            hollow: { angle: hollow },
            ...(pinLabel ? { pinMark: { position: [0.3 * Math.cos(pin), 0.3 * Math.sin(pin), 0.5] } } : {}),
            ...(extraPose ? extraPose(hollow) : {}),
          },
          readouts: [],
        };
      },
    },
  };
}

export const WHEEL_TEETH = N;
