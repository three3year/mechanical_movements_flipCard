// 第 176、177 種:引擎脫鉤(uncoupling)的裝置。另一支曲柄臂(原圖未畫,這裡畫在後面)上的手腕銷,伸進圖中這支
// 曲柄臂末端的環裡。環可在臂端的眼中轉動,環面上有一道溝槽:溝槽沿臂的方向(第 176 種)時,手腕銷卡在槽裡、
// 被槽壁擋住,兩支曲柄一起轉;把環轉成溝槽與手腕的路徑同向(第 177 種)時,手腕銷沿溝槽穿過去,這支曲柄不動。
// 主動件是後面那支(帶手腕銷的)曲柄;接上 / 脫開是狀態。
// 推斷:後面的曲柄與圖中曲柄同軸、同長;脫開時圖中曲柄停在原圖位置(朝上);溝槽是直的。
import { polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

export const ARM = 4.05;
export const EYE = 0.9;
export const INSERT = 0.7;
export const GROOVE = 0.37; // 溝槽半寬
export const WRIST = 0.28;
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
          { kind: "plate", shape: shape([[-0.88, 0], [0.88, 0], [0.75, ARM], [-0.75, ARM]], [circle(0.68).reverse(), circle(INSERT, 0, ARM).reverse()]), thickness: 0.25 },
          { kind: "cylinder", radius: 1.0, inner: 0.68, length: 0.35 },
          { kind: "cylinder", radius: 0.68, length: 0.6, mark: true },
          { kind: "cylinder", radius: EYE, inner: INSERT, length: 0.35, at: [0, ARM, 0] },
        ],
      },
      { id: "ring", kind: "group", posed: true, arrow: false, pieces: [{ kind: "plate", shape: half(1), thickness: 0.3 }, { kind: "plate", shape: half(-1), thickness: 0.3 }] },
      {
        id: "wristArm",
        kind: "group",
        spin: 1.2,
        pieces: [
          { kind: "plate", shape: shape([[-0.45, 0], [0.45, 0], [0.35, ARM], [-0.35, ARM]]), thickness: 0.15, at: [0, 0, -0.75] },
          { kind: "cylinder", radius: 0.55, length: 0.3, at: [0, 0, -0.85] },
          { kind: "cylinder", radius: WRIST, length: 0.75, at: [0, ARM, -0.35], accent: true },
        ],
      },
    ],
    driver: { part: "wristArm", type: "rotation" },
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
