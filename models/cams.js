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

/**
 * 滾子從動件用的凸輪輪廓:滾子中心走的是節曲線 pitchAt(φ),凸輪輪廓是滾子掃過範圍的邊界
 * (沿每個方向取最先碰到任一滾子圓的距離)。滾子中心因此精確地照節曲線移動。
 */
export function outlineForRoller(pitchAt, roller, samples = 360) {
  const centers = Array.from({ length: samples * 2 }, (_, i) => {
    const a = (i / (samples * 2)) * TAU;
    const r = pitchAt(a);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  return Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * TAU;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    let best = pitchAt(a);
    for (const [cx, cy] of centers) {
      const along = cx * ux + cy * uy;
      const h2 = roller * roller - (cx * cx + cy * cy - along * along);
      if (h2 >= 0 && along > 0) best = Math.min(best, along - Math.sqrt(h2));
    }
    return [best * ux, best * uy];
  });
}

/**
 * 凸輪外形(輪局部座標的折線,依極角排列)上的弧長:回傳 S(φ)——從極角 0 量到極角 φ 的外形長度,
 * φ 可超過一圈(每圈加一個周長)。滾子貼著凸輪滾動時,經過接觸點的外形長度 ÷ 滾子半徑就是滾子轉過的角度。
 */
export function outlineArc(outline) {
  const pts = outline.map(([x, y]) => ({ a: (Math.atan2(y, x) + TAU) % TAU, x, y })).sort((p, q) => p.a - q.a);
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const [p, q] = [pts[i - 1], pts[i % pts.length]];
    cum.push(cum[i - 1] + Math.hypot(q.x - p.x, q.y - p.y));
  }
  const total = cum[pts.length];
  return (phi) => {
    const k = Math.floor(phi / TAU);
    const a = phi - k * TAU;
    const n = pts.length;
    let i = pts.findIndex((p) => p.a > a); // a 落在第 i − 1 與第 i 點之間
    if (i < 0) i = n;
    const [a0, s0] = i === 0 ? [pts[n - 1].a - TAU, cum[n - 1] - total] : [pts[i - 1].a, cum[i - 1]];
    const [a1, s1] = i === n ? [pts[0].a + TAU, total] : [pts[i].a, cum[i]];
    return k * total + s0 + ((s1 - s0) * (a - a0)) / (a1 - a0 || 1);
  };
}
