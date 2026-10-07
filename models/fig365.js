// 第 365 種:一根圓桿夾在兩個滾子之間,兩滾子的軸彼此傾斜(一個在桿的前面、一個在後面)。
// 滾子轉動時,接觸處的表面速度一部分沿桿的長度方向、一部分沿桿的圓周方向,所以桿同時縱向移動與旋轉。
// 主動件是前面的滾子;後面的滾子以相反方向轉(兩者在接觸處的速度一致)。
// 推斷:滾子的傾角與尺寸(依原圖);滾子與桿之間不打滑。兩個滾子的軸兩端各有一個軸承環,立柱托在兩側的底座上
// (原圖沒畫機架;底座分在左右兩邊,讓桿上下穿過)。
import { deg, clamp, quatMul, quatAxisAngle, quatFromZ, Z, X } from "./kit.js";

const TILT = deg(18); // 每個滾子的軸與水平的夾角(一正一負)
const RR = 0.42; // 滾子半徑
const ROD = 0.22; // 桿半徑
export const RANGE = [-4, 4]; // 前滾子的轉角範圍

/** 前滾子轉 theta → 桿沿軸前進的距離、桿的轉角、後滾子的轉角 */
export function rodMotion(theta0) {
  const theta = clamp(theta0, ...RANGE);
  return { theta, advance: theta * RR * Math.cos(TILT), spin: (-theta * RR * Math.sin(TILT)) / ROD, back: -theta };
}
export const geometry = { TILT, RR, ROD };

const roller = (id, z) => ({
  id,
  kind: "cylinder",
  center: [0, 0, z],
  radius: RR,
  length: 3.6,
  mark: true,
  spin: RR,
  spinOffset: 1.5,
  pieces: [{ kind: "cylinder", radius: 0.1, length: 4.6 }],
});

// 軸承:滾子軸上離中心 2.15 處,front 在前(z > 0)、back 在後
const BEARING_AT = 2.15;
const FLOOR = -2.6;
const bearings = [
  [TILT, RR + ROD],
  [-TILT, -(RR + ROD)],
].flatMap(([tilt, z]) =>
  [1, -1].flatMap((s) => {
    const axis = [Math.cos(tilt), Math.sin(tilt), 0];
    const [x, y] = [s * BEARING_AT * axis[0], s * BEARING_AT * axis[1]];
    return [
      { kind: "cylinder", axis, radius: 0.22, inner: 0.12, length: 0.2, at: [x, y, z] },
      { kind: "box", size: [0.2, y - 0.2 - FLOOR, 0.2], at: [x, (y - 0.2 + FLOOR) / 2, z] },
    ];
  }),
);

export default {
  figure: 365,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [...bearings, ...[1, -1].map((s) => ({ kind: "box", size: [0.8, 0.15, 2.0], at: [s * BEARING_AT * Math.cos(TILT), FLOOR - 0.075, 0] }))],
    },
    roller("front", RR + ROD),
    roller("back", -(RR + ROD)),
    { id: "rod", kind: "cylinder", axis: [0, 1, 0], radius: ROD, length: 5.0, mark: true, spin: ROD, spinOffset: 2.2 },
  ],
  driver: { part: "front", type: "rotation", range: RANGE, initial: 0 },
  target: "rod", // 同時移動與旋轉的圓桿
  view: { direction: [0.45, 0.25, 1] },
  pose(theta0) {
    const m = rodMotion(theta0);
    // 滾子:局部 z(軸)先轉到 x,再繞 z 傾斜 ±TILT,最後繞自己的軸轉
    const roll = (tilt, angle) => quatMul(quatAxisAngle(Z, tilt), quatMul(quatFromZ(X), quatAxisAngle(Z, angle)));
    return {
      parts: {
        front: { rotation: roll(TILT, m.theta) },
        back: { rotation: roll(-TILT, m.back) },
        rod: { position: [0, m.advance, 0], angle: m.spin },
      },
      readouts: [],
    };
  },
};
