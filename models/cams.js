// 凸輪與從動件:從動件的位移由凸輪輪廓決定、始終貼著輪廓。純函式,平面在 xy。
// 輪廓以極座標函式 radiusAt(φ)(凸輪局部角)或局部座標折線描述。
import { TAU, rot2 } from "./kit.js";

/** 尖頂從動件沿世界角 dirAngle 的徑向直線:凸輪轉 camAngle 時接觸點離軸心的距離 */
export const knifeEdge = (radiusAt, camAngle, dirAngle) => radiusAt(dirAngle - camAngle);

/** 平底從動件(底面垂直於 dirAngle):凸輪轉 camAngle 時底面離軸心的距離 */
export function flatFace(outline, camAngle, dirAngle) {
  const ux = Math.cos(dirAngle);
  const uy = Math.sin(dirAngle);
  let best = -Infinity;
  for (const p of outline) {
    const [x, y] = rot2(p, camAngle);
    best = Math.max(best, x * ux + y * uy);
  }
  return best;
}

/** 滾子從動件(半徑 roller,中心在世界角 dirAngle 的徑向直線上):滾子中心離軸心的距離 */
export function rollerFace(outline, camAngle, dirAngle, roller, offset = 0) {
  const ux = Math.cos(dirAngle);
  const uy = Math.sin(dirAngle);
  let best = -Infinity;
  for (const p of outline) {
    const [x, y] = rot2(p, camAngle);
    const along = x * ux + y * uy;
    const across = -x * uy + y * ux - offset;
    if (Math.abs(across) <= roller) best = Math.max(best, along + Math.sqrt(roller * roller - across * across));
  }
  return best;
}

/** 依極座標函式取樣成折線(與 shapes.polarOutline 相同取樣,接觸計算與畫面一致) */
export function sampleOutline(radiusAt, samples = 360) {
  return Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * TAU;
    const r = radiusAt(a);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}
