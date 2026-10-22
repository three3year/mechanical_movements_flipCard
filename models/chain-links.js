// 共用(所有鍊條,第 46、227、228、229、254、334、342、462 種):鍊條的鏈節擺法。第 k 節的兩銷落在路徑弧長 k·節距 + 相位 與下一個節距處,
// 鏈節是兩銷之間的弦,繞過鏈輪時自然成多邊形。繪圖層(viewer/paths.js 的 ChainPart)、實體驗證的鍊條碰撞體(verify/scene.js)
// 與模型測試共用這一份擺法,不依賴 Three.js。

/** 環式鏈節的外形(viewer/paths.js 畫的圓環):圓環半徑 0.5、管半徑 tube × 鍊寬,沿弦拉長 stretch 倍、垂直弦壓扁成 squash 倍,弦長再乘上兩銷距離 */
export const RING_LINK = { stretch: 1.15, squash: 0.62, tube: 0.18 };

/** 環式鏈節(寬 width)的管半徑,與鏈環中心離管外緣的高度(垂直弦、在鏈環平面上量) */
export const ringSize = (width = 0.2) => {
  const tube = RING_LINK.tube * width;
  return { tube, half: RING_LINK.squash * (0.5 + tube), tubeHalf: RING_LINK.squash * tube };
};

/** 折線:各點的累積弧長;at(s) 取弧長 s 處的點(封閉的繞圈取,開放的夾在兩端) */
export function polyline(points, closed) {
  const pts = closed ? [...points, points[0]] : points;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const total = cum[cum.length - 1] || 1;
  const at = (s) => {
    const u = closed ? ((s % total) + total) % total : Math.min(Math.max(s, 0), total);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < u) i++;
    const span = cum[i] - cum[i - 1] || 1;
    const t = (u - cum[i - 1]) / span;
    const a = pts[i - 1];
    const b = pts[i];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  return { points, closed, total, at };
}

export const LINKS_PER_SEGMENT = 3; // 每幾節一個色段(第一節是黑色記號)
export const SEGMENT_COUNT = 3; // 色段輪流的顏色數

const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((c) => c / l);
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dotOf = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * 鍊條 part 在路徑 curve(polyline 的回傳)上、行進相位 phase 時的每一節:
 * { k, a, b(兩銷), length(兩銷距離), axes: [X, Y, Z](鏈節局部軸;X 沿弦), origin(局部原點 = 銷 a 加上抬高), upright }。
 * 鏈節的外形在局部座標:X 由 0 到 1(乘上 length)、Y 是鏈節平面上垂直弦的方向、Z 是厚度方向。
 * 鏈節平面:part.normal 扣掉沿弦的分量是 Z;環式的相鄰節互相垂直(偶數節 upright:平面含 normal × 行進方向;奇數節平躺:平面含 normal)。
 * 板式的內外節沿 normal 錯開 part.offset(預設 0.12)。
 * part.uprightLift(只給環式):繞在輪上時直立鏈節比平躺鏈節高出這麼多(第 254 種:直立鏈節坐在叉齒的分岔處、平躺鏈節貼著輪緣)。
 *   直立鏈節留在路徑上(路徑是直立鏈節的中心線),平躺鏈節往轉彎的內側降這麼多;直的一段不降(拉直的鍊條各節在同一條中心線上)。
 *   轉彎多少照這一節前後兩節的弦夾角,達到 FULL_BEND 就全降,中間按比例(剛離開輪的平躺鏈節只降一部分,浮在輪緣上方)。
 * 封閉鍊條一圈要是整數個色段,節距因此微調,回傳實際用的 pitch。
 */
export const FULL_BEND = (20 * Math.PI) / 180;

export function chainLinks(part, curve, phase = 0) {
  const style = part.style ?? "plate";
  const normal = unit(part.normal ?? [0, 0, 1]);
  const offset = part.offset ?? 0.12;
  const uprightLift = style === "ring" ? (part.uprightLift ?? 0) : 0;
  const { closed, total: length } = curve;
  let pitch = part.pitch ?? 0.4;
  if (closed) {
    const unitCount = LINKS_PER_SEGMENT * SEGMENT_COUNT;
    pitch = length / Math.max(unitCount, unitCount * Math.round(length / (pitch * unitCount)));
  }
  const first = closed ? 0 : Math.ceil(-phase / pitch);
  const last = closed ? Math.round(length / pitch) - 1 : Math.floor((length - pitch - phase) / pitch);
  const shift = closed ? ((phase % length) + length) % length : phase;
  const links = [];
  for (let k = first; k <= last; k++) {
    const s = k * pitch + shift;
    const a = curve.at(s);
    const b = curve.at(s + pitch);
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d) || 1e-6;
    const x = d.map((c) => c / l);
    const dot = dotOf(normal, x);
    const z = unit(normal.map((c, i) => c - dot * x[i]));
    const y = cross(z, x);
    const odd = ((k % 2) + 2) % 2 === 1;
    const upright = style === "ring" && !odd;
    const axes = style === "ring" && odd ? [x, z, y.map((c) => -c)] : [x, y, z];
    let lift = [0, 0, 0];
    if (style === "ring" && odd && uprightLift) {
      const before = unit(sub(a, curve.at(s - pitch)));
      const after = unit(sub(curve.at(s + 2 * pitch), b));
      const bend = Math.atan2(Math.hypot(...cross(before, after)), dotOf(before, after));
      const inward = dotOf(sub(after, before), y) > 0 ? 1 : -1; // 鍊條往 +y 彎時,內側是 +y
      lift = y.map((c) => c * uprightLift * inward * Math.min(1, bend / FULL_BEND));
    } else if (style !== "ring" && style !== "ladder") lift = normal.map((c) => c * (odd ? offset : -offset * 0.2));
    links.push({ k, a, b, length: l, axes, origin: a.map((c, i) => c + lift[i]), upright });
  }
  return { pitch, links };
}
