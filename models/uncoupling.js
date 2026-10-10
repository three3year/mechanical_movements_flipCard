// 第 176、177 種:引擎脫鉤(uncoupling)的裝置。另一支曲柄臂(原圖未畫,這裡畫在後面)上的手腕銷,伸進圖中這支
// 曲柄臂末端的環裡。環可在臂端的眼中轉動,環上有一道溝槽:溝槽沿臂的方向(第 176 種)時,手腕銷卡在槽裡、
// 被槽壁擋住,兩支曲柄一起轉;把環轉成溝槽與手腕的路徑同向(第 177 種)時,手腕銷沿溝槽穿過去,這支曲柄不動。
// 主動件是後面那支(帶手腕銷的)曲柄;接上 / 脫開是狀態。
// 環是一整件:中段套在眼裡,前面一圈壓邊、後面一圈凸緣都比眼的內孔大,把環留在眼裡;溝槽只開在後面的凸緣上
// (手腕銷從後面伸進來),前面兩段相連,溝槽兩側的凸緣不會散開。眼是整圈,和臂連成一片(手腕銷從眼的後面過,碰不到眼)。
// 溝槽是圓弧:轉到第 177 種位置時與手腕銷的圓形路徑重合(原圖第 177 種溝槽的兩邊略彎)。
// 環前面的把手沿溝槽的方向,從前面看得出溝槽轉到哪個位置。
// 推斷:後面的曲柄與圖中曲柄同軸、同長;脫開時圖中曲柄停在原圖位置(朝上);環的三段式構造與把手。
// 兩支曲柄各有自己的軸:圖中曲柄的軸往前伸進前面的軸承座,後面曲柄的軸往後伸進後面的軸承座(原圖沒畫,推斷)。
import { polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

export const ARM = 4.05;
const FLOOR = -(ARM + 0.9); // 曲柄朝下時眼的最低處之下
export const EYE = 1.1; // 眼的外半徑
const BORE = 0.77; // 眼的內孔
const CORE = 0.75; // 環套在眼裡的中段
export const FLANGE = 1.0; // 環後面的凸緣(溝槽開在這裡)
export const GROOVE = 0.37; // 溝槽半寬
export const WRIST = 0.343; // 手腕銷貼著溝槽的兩壁
const TURN = { coupled: 0, uncoupled: Math.PI / 2 }; // 環相對臂的轉角
// 深度:臂與眼在 −0.125…0.125;環的凸緣在眼的後面;手腕銷從後面的臂伸進凸緣的溝槽
const FLANGE_Z = [-0.425, -0.13]; // 前面貼著中段的背面(溝槽底)
const WRIST_ARM_Z = -0.75;

/** 主動曲柄轉 theta、狀態:手腕銷位置、圖中曲柄與環的轉角 */
export function coupling(theta, state) {
  const wrist = polar(ARM, Math.PI / 2 + theta);
  const arm = state === "coupled" ? theta : 0;
  return { wrist, arm, insert: arm + TURN[state], eye: polar(ARM, Math.PI / 2 + arm) };
}

/** 溝槽中線(半徑 ARM 的圓弧)的圓心:在環的局部座標是 (−ARM, 0),依環的位置與轉角換到世界座標 */
export function grooveCenter(theta, state) {
  const { eye, insert } = coupling(theta, state);
  return [eye[0] - ARM * Math.cos(insert), eye[1] - ARM * Math.sin(insert), 0];
}

// 凸緣:半徑 FLANGE 的圓盤去掉溝槽(以 (−ARM, 0) 為圓心、半徑 ARM ± GROOVE 的圓弧帶),剩左右兩塊
const flangePiece = (side) => {
  const rad = ARM + side * GROOVE;
  const x = (rad * rad - FLANGE * FLANGE - ARM * ARM) / (2 * ARM); // 兩圓交點的 x
  const phi = Math.acos(x / FLANGE);
  const psi = Math.atan2(Math.sqrt(FLANGE * FLANGE - x * x), x + ARM);
  return side < 0
    ? shape([...arcPoints(FLANGE, phi, 2 * Math.PI - phi), ...arcPoints(rad, -psi, psi, -ARM, 0)]) // 溝槽內側(靠軸心那側)
    : shape([...arcPoints(FLANGE, -phi, phi), ...arcPoints(rad, psi, -psi, -ARM, 0)]);
};
const flangeZ = (FLANGE_Z[0] + FLANGE_Z[1]) / 2;

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
          { kind: "plate", shape: shape([[-0.88, 0], [0.88, 0], [0.65, ARM - 0.9], [-0.65, ARM - 0.9]], [circle(0.68).reverse()]), thickness: 0.25 },
          { kind: "plate", shape: shape(circle(EYE, 0, ARM), [circle(BORE, 0, ARM).reverse()]), thickness: 0.25 }, // 眼:整圈,與臂連成一片
          { kind: "cylinder", radius: 1.0, inner: 0.68, length: 0.35 },
          { kind: "cylinder", radius: 0.68, length: 0.6, mark: true },
          { kind: "cylinder", radius: 0.3, length: 0.75, at: [0, 0, 0.6] }, // 軸:往前伸進軸承座
        ],
      },
      {
        id: "ring",
        kind: "group",
        posed: true,
        arrow: false,
        pieces: [
          { kind: "plate", shape: shape(circle(0.9)), thickness: 0.08, at: [0, 0, 0.17] }, // 前面的壓邊
          { kind: "cylinder", radius: CORE, length: 0.26, at: [0, 0, 0] }, // 套在眼裡的中段;背面是溝槽底
          { kind: "plate", shape: flangePiece(-1), thickness: FLANGE_Z[1] - FLANGE_Z[0], at: [0, 0, flangeZ] },
          { kind: "plate", shape: flangePiece(1), thickness: FLANGE_Z[1] - FLANGE_Z[0], at: [0, 0, flangeZ] },
          { kind: "box", size: [0.22, 1.5, 0.14], at: [0, 0, 0.275], accent: true }, // 把手:沿溝槽的方向
        ],
      },
      {
        id: "wristArm",
        kind: "group",
        spin: 1.2,
        pieces: [
          { kind: "plate", shape: shape([[-0.45, 0], [0.45, 0], [0.35, ARM], [-0.35, ARM]]), thickness: 0.15, at: [0, 0, WRIST_ARM_Z] },
          { kind: "cylinder", radius: 0.55, length: 0.7, at: [0, 0, -0.65] }, // 輪轂頂著曲柄軸的端面(同一條軸線)
          // 手腕銷:從後面的臂往前伸進凸緣的溝槽,前端停在溝槽底的後面
          { kind: "cylinder", radius: WRIST, length: FLANGE_Z[1] - 0.01 - (WRIST_ARM_Z + 0.075), at: [0, ARM, (FLANGE_Z[1] - 0.01 + WRIST_ARM_Z + 0.075) / 2], accent: true },
          { kind: "cylinder", radius: 0.3, length: 0.85, at: [0, 0, -1.35] }, // 軸:往後伸進軸承座
        ],
      },
      {
        id: "frame",
        kind: "group",
        pieces: [...pedestal({ at: [0, 0], z: 0.8, bore: 0.3, floor: FLOOR }), ...pedestal({ at: [0, 0], z: -1.55, bore: 0.3, floor: FLOOR })],
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
