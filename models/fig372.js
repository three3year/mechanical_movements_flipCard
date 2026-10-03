// 第 372 種:懷特氏測功計。環形框架可以繞水平軸的中點自由轉動,框架裡上下各裝一個水平的斜齒輪;軸上兩個垂直的斜齒輪
// 與它們咬合,一個固定在軸上(左)、一個在軸上鬆轉(右)。若把框架保持靜止,傳給一個垂直斜齒輪的運動會經水平齒輪
// 傳給另一個(反向轉);若讓框架自由,另一個垂直齒輪受到負載而不動時,框架就跟著轉——讓框架保持靜止所需的力
// (繞在框架周圍的皮帶上吊的重量)對應傳過去的動力。主動件是左邊固定在軸上的斜齒輪(軸)。
// 狀態按鈕:框架保持靜止 / 框架放開(右邊的齒輪被負載擋住)。
// 推斷:兩種狀態的設定;齒數。
import { X, Z, deg, quatMul, quatAxisAngle, quatFromZ, rotateAbout } from "./kit.js";
import { bevelGear } from "./gears.js";

const R = 0.5;
const N = 16;
const cone = deg(45);
const S1 = bevelGear({ apex: [0, 0, 0], axis: [1, 0, 0], teeth: N, radius: R, cone, width: 0.24 });
const S2 = bevelGear({ apex: [0, 0, 0], axis: [-1, 0, 0], teeth: N, radius: R, cone, width: 0.24 });
const P0 = bevelGear({ apex: [0, 0, 0], axis: [0, -1, 0], teeth: N, radius: R, cone, width: 0.24 });

/** 軸(左齒輪)轉 a、狀態 → 框架轉角與右齒輪的轉角(都以繞 +x 計) */
export function dynamometer(a, state = "held") {
  if (state === "held") return { carrier: 0, sun2: -a };
  return { carrier: a / 2, sun2: 0 };
}

const gear = (g) => ({ kind: "gear", teeth: N, radius: R, cone, width: g.width });

export default {
  figure: 372,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.25, 3.2, 0.4], at: [-2.0, -0.55, 0] },
        { kind: "box", size: [0.25, 3.2, 0.4], at: [2.0, -0.55, 0] },
        { kind: "lathe", axis: X, profile: [[0, -1.9], [0.08, -1.9], [0.06, -0.5], [0.14, -0.15], [0.14, 0.15], [0.06, 0.5], [0.08, 1.9], [0, 1.9]], at: [0, -1.5, 0] },
      ],
    },
    { id: "shaft", kind: "group", center: S1.center, axis: X, spin: R + 0.1, pieces: [gear(S1), { kind: "cylinder", radius: 0.08, length: 4.6, at: [0, 0, -0.3] }] },
    { id: "sun2", kind: "group", center: S2.center, axis: [-1, 0, 0], spin: R + 0.1, pieces: [gear(S2), { kind: "cylinder", radius: 0.14, length: 0.6, at: [0, 0, -0.35] }] },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        // 環形框架:方框,左右兩端的軸承套在軸上
        { kind: "cylinder", axis: X, radius: 0.18, length: 0.3, at: [1.25, 0, 0] },
        { kind: "cylinder", axis: X, radius: 0.18, length: 0.3, at: [-1.25, 0, 0] },
        { kind: "box", size: [2.5, 0.12, 0.6], at: [0, 1.15, 0] },
        { kind: "box", size: [2.5, 0.12, 0.6], at: [0, -1.15, 0] },
        { kind: "box", size: [0.12, 2.4, 0.6], at: [1.2, 0, 0] },
        { kind: "box", size: [0.12, 2.4, 0.6], at: [-1.2, 0, 0] },
      ],
    },
    { id: "planetTop", kind: "group", arrow: false, pieces: [gear(P0), { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, -0.3] }] },
    { id: "planetBottom", kind: "group", arrow: false, pieces: [gear(P0), { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, -0.3] }] },
  ],
  driver: { part: "shaft", type: "rotation" },
  states: {
    initial: "held",
    options: [
      { id: "held", label: "框架保持靜止" },
      { id: "free", label: "框架放開" },
    ],
  },
  view: { direction: [0.2, 0.25, 1] },
  pose(a, state = "held") {
    const d = dynamometer(a, state);
    const spin = a - d.carrier;
    const planet = (extra) => {
      const center = rotateAbout(P0.center, X, d.carrier + extra);
      return { position: center, rotation: quatMul(quatAxisAngle(X, d.carrier + extra), quatMul(quatFromZ([0, -1, 0]), quatAxisAngle(Z, spin))) };
    };
    return {
      parts: {
        shaft: { angle: a },
        sun2: { angle: -d.sun2 },
        frame: { rotation: quatAxisAngle(X, d.carrier) },
        planetTop: planet(0),
        planetBottom: planet(Math.PI),
      },
      readouts: [],
    };
  },
};
