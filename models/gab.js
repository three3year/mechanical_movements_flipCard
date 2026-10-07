// 偏心桿末端的鉤口(gab)與脫鉤(第 186–189 種共用):偏心桿從左邊(偏心輪,圖外)伸過來,末端的圓頭上有一道
// 開口的槽,搭在閥門搖臂的銷上。把桿端抬起(或壓下)超過槽深,銷就從鉤口中脫出。純函式。
// 推斷:偏心桿另一端接在圖外 ECC 處的偏心輪上,桿端被抬起時整根桿繞那一點微微轉動。
import { rot2 } from "./kit.js";
import { arcPoints, shape } from "./shapes.js";
import { placeOutline, polygonsOverlap, circlePolygon } from "./contact.js";

export const ECC = [-6, 0, 0]; // 偏心桿另一端(偏心輪)在圖外的位置(相對銷)
const ROD = { bottom: -0.15, top: 0.35 };

/** 桿端(銷所在處)移動 lift 時,整根桿繞 ECC 的轉角 */
export const rodAngle = (lift) => Math.asin(lift / -ECC[0]);

/** 桿座標(以銷為原點)的點 p,在桿端移動 lift 後的世界位置 */
export function onRod(p, lift, z = 0) {
  const [x, y] = rot2([p[0] - ECC[0], p[1] - ECC[1]], rodAngle(lift));
  return [x + ECC[0], y + ECC[1], z];
}

/**
 * 一種鉤口:銷半徑 pin,桿端圓頭(圓心在銷心上方 cy、半徑 r)。
 * depth:槽口離銷心的距離;桿端移動超過 depth + pin 銷就脫出。
 */
export function gab({ pin = 0.18, cy = 0.1, r = 0.46 } = {}) {
  const ys = Math.sqrt(r * r - pin * pin);
  const depth = ys - cy;
  /** 偏心桿輪廓(以銷為原點)。open:"down" 槽口朝下(桿抬起脫開),"up" 槽口朝上(桿壓下脫開) */
  function rod({ left = -3.0, right = 1.0, open = "down", bottom = ROD.bottom, top = ROD.top } = {}) {
    const x0 = Math.sqrt(r * r - (cy - bottom) ** 2);
    const ang = (x, y) => Math.atan2(y - cy, x);
    const a1 = ang(-x0, bottom);
    let a2 = ang(-pin, cy - ys);
    if (a2 < a1) a2 += 2 * Math.PI;
    const a3 = ang(pin, cy - ys);
    let a4 = ang(x0, bottom);
    if (a4 < a3) a4 += 2 * Math.PI;
    const pts = [[left, bottom], ...arcPoints(r, a1, a2, 0, cy), [-pin, 0], ...arcPoints(pin, Math.PI, 0).slice(1, -1), [pin, 0], ...arcPoints(r, a3, a4, 0, cy)];
    pts.push([right, bottom], [right, top]);
    if (cy + r > top) {
      const t = Math.atan2(top - cy, Math.sqrt(r * r - (top - cy) ** 2));
      pts.push(...arcPoints(r, t, Math.PI - t, 0, cy));
    }
    pts.push([left, top]);
    return shape(open === "down" ? pts : pts.map(([x, y]) => [x, -y]).reverse());
  }
  return { pin, depth, rod, released: (lift) => Math.abs(lift) > depth + pin };
}

/**
 * 裝在桿上的手柄轉 phi(逆時針為正):手柄上的頂尖 tip(相對手柄樞軸)頂在一個固定點上,
 * 頂尖相對桿下降多少,桿端就被抬起多少(頂尖往上時桿被壓下,回傳負值)。
 */
export const leverLift = (tip, phi) => tip[1] - rot2(tip, phi)[1];

/** 桿端抬起 lift、手柄相對桿轉 phi 時,手柄的外形 outlines(相對手柄樞軸,樞軸在桿座標 pivot)在世界的位置(2D) */
export const handleAt = (outlines, pivot, lift, phi) => outlines.map((o) => placeOutline(o, onRod(pivot, lift), rodAngle(lift) + phi));

/**
 * 裝在桿上的手柄轉 phi(逆時針為正),手柄的外形 outlines 從上面頂在固定的凸柱 stud(世界座標多邊形)上:
 * 桿端要抬起多少,手柄才剛好不壓進凸柱(由接觸算;沒頂著時是 0,桿靠自重搭在銷上)。
 * 從 max 往下找最高的相碰位置,所以手柄轉到凸柱下方另一側的解不算(手柄一直在凸柱上面)。
 */
export function contactLift(outlines, pivot, stud, phi, max = 1.5, step = 0.01) {
  const hit = (lift) => handleAt(outlines, pivot, lift, phi).some((o) => polygonsOverlap(o, stud));
  if (hit(max)) throw new Error("手柄壓進凸柱太深");
  let lo = max;
  while (lo > 0 && !hit(lo)) lo -= step;
  if (lo <= 0 && !hit(0)) return 0;
  lo = Math.max(lo, 0);
  let hi = Math.min(lo + step, max);
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hit(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * 凸柱在原圖位置(手柄沒轉、桿搭在銷上)剛好頂在手柄下面:凸柱的中心在 x,外形是 outlineAt(中心)
 * (預設半徑 0.08 的圓);回傳中心 [x, y] 與外形。
 */
export function studUnder(outlines, pivot, x, outlineAt = (c) => circlePolygon(c, 0.08, 24)) {
  const placed = handleAt(outlines, pivot, 0, 0);
  const hit = (y) => placed.some((o) => polygonsOverlap(o, outlineAt([x, y])));
  let lo = Math.min(...placed.flat().map((p) => p[1])) - 1; // 一定碰不到
  const top = Math.max(...placed.flat().map((p) => p[1]));
  while (!hit(lo + 0.01)) {
    lo += 0.01; // 往上找到第一次碰到
    if (lo > top) throw new Error("凸柱碰不到手柄");
  }
  let hi = lo + 0.01;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hit(mid)) hi = mid;
    else lo = mid;
  }
  const center = [x, lo - 1e-4];
  return { center, outline: outlineAt(center) };
}
