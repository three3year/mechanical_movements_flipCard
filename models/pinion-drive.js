// 曼格輪、曼格式齒條(第 192–194、197 種)的小齒輪要沿溝槽內外移動,它的驅動軸因此不能固定:
// 原文(第 194 種)說「該軸配備有萬向接頭,使其某一部分可以擁有必要的振動運動」。這裡畫成一根從小齒輪往前下方
// 伸到固定軸承的驅動軸,兩端各一個萬向接頭(以小球表示),小齒輪移動時整根軸繞固定的那一端擺動。
// 驅動軸、軸承與立柱都是推斷(原圖沒畫)。

/**
 * fixed:驅動軸固定端(萬向接頭)的位置;floor:立柱落地的高度。
 * 回傳 { part(驅動軸的零件), pieces(機架上軸承與立柱的群組 pieces), pose(小齒輪前端的位置) }。
 */
export function pinionDrive({ fixed, floor }) {
  return {
    part: { id: "driveShaft", kind: "link", width: 0.07, thickness: 0.07, pins: false },
    joint: { id: "joint", kind: "sphere", radius: 0.11 }, // 小齒輪端的萬向接頭
    pieces: [
      { kind: "sphere", radius: 0.13, at: fixed },
      { kind: "box", size: [0.2, fixed[1] - 0.1 - floor, 0.2], at: [fixed[0], (fixed[1] - 0.1 + floor) / 2, fixed[2]] }, // 托著固定端萬向接頭的立柱
      { kind: "box", size: [1.0, 0.12, 0.6], at: [fixed[0], floor - 0.06, fixed[2]] },
    ],
    // 軸身的兩端停在兩個萬向接頭的球面上(略伸進一點,看得出接在一起)
    pose: (front) => {
      const d = [fixed[0] - front[0], fixed[1] - front[1], fixed[2] - front[2]];
      const l = Math.hypot(...d);
      const at = (p, t) => p.map((v, k) => v + (d[k] / l) * t);
      return { driveShaft: { from: at(front, 0.125), to: at(fixed, -0.145) }, joint: { position: front } };
    },
  };
}
