// 截圖服務的切圖:讀圖時長邊超過 2000 px 會被等比例縮小,所以高的頁切成幾段。
// 切線只取沒有任何小圖(img、canvas)跨過的高度,從上往下每段取不超過 limit 的最遠切點;
// 某張小圖本身超過 limit 就自己成一段(oversize)。boxes 是各小圖的 [上緣, 下緣]。
export const LONG_SIDE = 2000;

export function planCuts(height, boxes, limit = LONG_SIDE) {
  const spans = boxes
    .map(([top, bottom]) => [Math.max(0, Math.floor(top)), Math.min(height, Math.ceil(bottom))])
    .filter(([top, bottom]) => bottom > top);
  const crossed = (y) => spans.some(([top, bottom]) => top < y && y < bottom);
  // 能下刀的高度:每張小圖的上下緣與頁底,加上不在任何小圖裡的區間的最遠處(下面每段用 limit 往前推)
  const edges = [...new Set([height, ...spans.flat()])].filter((y) => y > 0 && !crossed(y)).sort((a, b) => a - b);
  const segments = [];
  let top = 0;
  while (height - top > limit) {
    const reach = top + limit;
    let cut = crossed(reach) ? edges.filter((y) => y > top && y <= reach).at(-1) : reach;
    let oversize = false;
    if (cut === undefined) {
      // 從 top 開始的小圖本身就超過 limit:切在它(與跟它重疊的小圖)的下緣
      cut = edges.find((y) => y > reach);
      oversize = true;
    }
    segments.push({ top, bottom: cut, oversize });
    top = cut;
  }
  segments.push({ top, bottom: height, oversize: false });
  return segments;
}
