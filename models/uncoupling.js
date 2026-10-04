// 第 176、177 種:引擎脫鉤(uncoupling)的裝置。另一支曲柄臂(原圖未畫,這裡畫在後面)上的手腕銷,伸進圖中這支
// 曲柄臂末端的環裡。環可在臂端的眼中轉動,環面上有一道溝槽:溝槽沿臂的方向(第 176 種)時,手腕銷卡在槽裡、
// 被槽壁擋住,兩支曲柄一起轉;把環轉成溝槽與手腕的路徑同向(第 177 種)時,手腕銷沿溝槽穿過去,這支曲柄不動。
// 主動件是後面那支(帶手腕銷的)曲柄;接上 / 脫開是狀態。
// 推斷:後面的曲柄與圖中曲柄同軸、同長;脫開時圖中曲柄停在原圖位置(朝上);溝槽是直的。
import { polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

export const ARM = 4.05;
// 眼與環做得小:脫開時手腕銷沿圓弧穿過直的溝槽,環越小,圓弧偏離溝槽的量越小
export const EYE = 0.65;
export const INSERT = 0.45;
export const GROOVE = 0.37; // 溝槽半寬
export const WRIST = 0.343; // 手腕銷貼著溝槽的兩壁
const TURN = { coupled: 0, uncoupled: Math.PI / 2 }; // 環相對臂的轉角

/** 主動曲柄轉 theta、狀態:手腕銷位置、圖中曲柄與環的轉角 */
export function coupling(theta, state) {
  const wrist = polar(ARM, Math.PI / 2 + theta);
  const arm = state === "coupled" ? theta : 0;
  return { wrist, arm, insert: arm + TURN[state], eye: polar(ARM, Math.PI / 2 + arm) };
}

// 環:圓盤去掉中間一道(沿局部 y)的溝槽,剩左右兩塊
const half = (sign) => {
  const a = Math.acos(GROOVE / INSERT);
  const pts = arcPoints(INSERT, -a, a).map(([x, y]) => [x * sign, y]);
  return shape(sign > 0 ? pts : pts.reverse());
};

// 眼的上半或下半:一段弧形,兩側留出手腕銷通過的開口
const eyeHalf = (sign) => {
  const open = GROOVE + 0.08;
  const outer = Math.asin(open / EYE);
  const inner = Math.asin(open / INSERT);
  const pts = [...arcPoints(EYE, outer, Math.PI - outer), ...arcPoints(INSERT, Math.PI - inner, inner)];
  return sign > 0 ? pts : pts.map(([x, y]) => [x, -y]).reverse();
};

export function uncouplingModel({ figure, initial }) {
  return {
    figure,
    parts: [
      {
        id: "crank",
        kind: "group",
        spin: 1.2,
        posed: true,
        pieces: [
          // 臂端的眼兩側開口(與溝槽同寬):脫開時手腕銷從眼中橫穿而過(原圖的眼看起來是整圈,照畫銷出不去)
          { kind: "plate", shape: shape([[-0.88, 0], [0.88, 0], [0.76, ARM - INSERT - 0.02], [-0.76, ARM - INSERT - 0.02]], [circle(0.68).reverse()]), thickness: 0.25 },
          ...[1, -1].map((s) => ({ kind: "plate", shape: shape(eyeHalf(s)), thickness: 0.35, at: [0, ARM, 0] })),
          { kind: "cylinder", radius: 1.0, inner: 0.68, length: 0.35 },
          { kind: "cylinder", radius: 0.68, length: 0.6, mark: true },
        ],
      },
      { id: "ring", kind: "group", posed: true, arrow: false, pieces: [{ kind: "plate", shape: half(1), thickness: 0.3 }, { kind: "plate", shape: half(-1), thickness: 0.3 }] },
      {
        id: "wristArm",
        kind: "group",
        spin: 1.2,
        pieces: [
          { kind: "plate", shape: shape([[-0.45, 0], [0.45, 0], [0.35, ARM], [-0.35, ARM]]), thickness: 0.15, at: [0, 0, -0.75] },
          { kind: "cylinder", radius: 0.55, length: 0.7, at: [0, 0, -0.65] }, // 輪轂頂著曲柄軸的端面(同一條軸線)
          { kind: "cylinder", radius: WRIST, length: 0.75, at: [0, ARM, -0.35], accent: true },
        ],
      },
    ],
    driver: { part: "wristArm", type: "rotation" },
    target: "crank", // 被手腕銷帶著轉(或脫開不動)的曲柄
    states: {
      options: [
        { id: "coupled", label: "接上(第 176 種)" },
        { id: "uncoupled", label: "脫開(第 177 種)" },
      ],
      initial,
    },
    view: { direction: [0.1, 0.08, 1] },
    pose(theta, state = initial) {
      const { arm, insert, eye } = coupling(theta, state);
      return {
        parts: {
          wristArm: { angle: theta },
          crank: { angle: arm },
          ring: { position: eye, angle: insert },
        },
        readouts: [],
      };
    },
  };
}
