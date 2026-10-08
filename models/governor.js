// 離心式(飛球)調速器共用:搖臂在心軸頂部樞接,末端是球;連桿從搖臂中段接到在心軸上滑動的套筒。
// 心軸轉得越快,球飛得越開(圓錐擺:cos α = g / (ω²L),α 有上下限),套筒被拉得越高。純函式,平面在 xy。
import { Y, deg, clamp } from "./kit.js";

/**
 * top:搖臂樞軸的高度;arm:樞軸到球心;at:連桿接在搖臂上的位置(離樞軸);link:連桿長;
 * spread:左右兩支搖臂樞軸離心軸的距離;ball:球半徑;range:[最小, 最大] 張角;max:轉速範圍上限。
 * below:連桿往下接套筒(true,套筒在下方)或往上(false)。
 */
const PLANE = 0.26; // 搖臂與連桿所在的那一層(套筒半徑 0.22 的前面)

export function flyBall({ top = 2.4, arm = 2.2, at = 1.1, link = 1.25, spread = 0.18, ball = 0.42, range = [deg(14), deg(52)], max = 10, below = true }) {
  const c = max * max * Math.cos(range[1]);
  /** 轉速 s:張角 */
  const angleAt = (s) => {
    const w2 = Math.max(1e-9, s * s);
    return clamp(Math.acos(clamp(c / w2, -1, 1)), range[0], range[1]);
  };
  /** 張角 α:兩邊搖臂、球、連桿接點與套筒高度 */
  function geometry(alpha) {
    const side = (k) => {
      const pivot = [k * spread, top, 0];
      const dir = [k * Math.sin(alpha), -Math.cos(alpha), 0];
      const joint = [pivot[0] + at * dir[0], pivot[1] + at * dir[1], 0];
      const ballAt = [pivot[0] + arm * dir[0], pivot[1] + arm * dir[1], 0];
      return { pivot, joint, ball: ballAt };
    };
    const L = side(-1);
    const R = side(1);
    const dx = R.joint[0] - 0.12;
    const sleeve = R.joint[1] + (below ? -1 : 1) * Math.sqrt(Math.max(0, link * link - dx * dx));
    return { L, R, sleeve };
  }
  const parts = (prefix = "") => [
    { id: `${prefix}armL`, kind: "link", width: 0.1, thickness: 0.08 },
    { id: `${prefix}armR`, kind: "link", width: 0.1, thickness: 0.08 },
    { id: `${prefix}linkL`, kind: "link", width: 0.08, thickness: 0.06 },
    { id: `${prefix}linkR`, kind: "link", width: 0.08, thickness: 0.06 },
    { id: `${prefix}ballL`, kind: "sphere", radius: ball },
    { id: `${prefix}ballR`, kind: "sphere", radius: ball },
    { id: `${prefix}sleeve`, kind: "cylinder", axis: Y, radius: 0.22, length: 0.22 },
    // 頂座:搖臂掛在它的前面(搖臂、連桿都在心軸前面一層,不穿過頂座與套筒)
    { id: `${prefix}head`, kind: "box", center: [0, top, 0.145], size: [2 * spread + 0.3, 0.22, 0.15] },
  ];
  function pose(alpha, prefix = "") {
    const { L, R, sleeve } = geometry(alpha);
    const z = (p) => [p[0], p[1], PLANE];
    return {
      [`${prefix}armL`]: { from: z(L.pivot), to: z(L.ball) },
      [`${prefix}armR`]: { from: z(R.pivot), to: z(R.ball) },
      [`${prefix}linkL`]: { from: z(L.joint), to: [-0.12, sleeve, PLANE] },
      [`${prefix}linkR`]: { from: z(R.joint), to: [0.12, sleeve, PLANE] },
      [`${prefix}ballL`]: { position: L.ball },
      [`${prefix}ballR`]: { position: R.ball },
      [`${prefix}sleeve`]: { position: [0, sleeve, 0] },
    };
  }
  return { angleAt, geometry, parts, pose, range };
}
