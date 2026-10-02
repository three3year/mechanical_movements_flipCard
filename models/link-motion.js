// 連桿運動(link motion)閥門齒輪共用(第 171、185 種):軸上兩個偏心輪,一個管前進、一個管後退,
// 兩根偏心桿的末端鉸接在一根開槽的「連桿」兩端;連桿可被抬起或降下,槽裡的滑塊高度不動、接到閥桿。
// 滑塊在槽的哪個位置,就得到兩個偏心輪動作的哪種混合:在一端時得到那個偏心輪的全部行程,
// 在中間時兩者互相抵消、閥門幾乎不動。純函式,在一個局部平面上計算:偏心桿從軸沿 dir 方向伸出。
import { polar, add, scale } from "./kit.js";

/**
 * shaft:軸心;dir:偏心桿伸出的方向(單位向量);ecc:偏心距;rod:偏心桿長;
 * half:連桿兩端離連桿中心的距離;leads:[前進, 後退] 偏心輪相對曲柄的角度。
 */
export function linkMotion({ shaft, dir, ecc, rod, half, leads }) {
  const across = [-dir[1], dir[0], 0]; // 連桿的方向(與偏心桿大致垂直);局部座標 (u, v) 沿 (dir, across)
  const toWorld = (u, v) => add(shaft, add(scale(dir, u), scale(across, v)));
  /**
   * 軸轉 theta、連桿被移動 lift(沿 across):兩偏心輪中心、連桿兩端、滑塊(槽中固定高度 v = 0)的位置與閥的位移。
   * 偏心輪中心在局部座標 (u, v) = ecc·(cos, sin)(theta + lead);偏心桿沿 dir 伸出。
   */
  return (theta, lift) => {
    const e = leads.map((lead) => {
      const [x, y] = polar(ecc, theta + lead);
      return [x, y];
    });
    // 連桿兩端的 across 座標固定(連桿中心在 lift),dir 座標由偏心桿長求出
    const ends = [lift + half, lift - half].map((v, i) => {
      const [eu, ev] = e[i];
      const u = eu + Math.sqrt(rod * rod - (v - ev) ** 2);
      return [u, v];
    });
    // 滑塊在 across = 0 處:在連桿兩端之間內插
    const f = (0 - ends[1][1]) / (ends[0][1] - ends[1][1]);
    const block = ends[1][0] + (ends[0][0] - ends[1][0]) * f;
    return {
      eccentrics: e.map(([u, v]) => toWorld(u, v)),
      ends: ends.map(([u, v]) => toWorld(u, v)),
      block: toWorld(block, 0),
      valve: block,
      fraction: f, // 1:滑塊在前進端;0:後退端;0.5:中間
      linkAngle: Math.atan2(ends[0][1] - ends[1][1], ends[0][0] - ends[1][0]),
      toWorld,
    };
  };
}
