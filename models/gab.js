// 偏心桿末端的鉤口(gab)與脫鉤(第 186–189 種共用):偏心桿從左邊(偏心輪,圖外)伸過來,末端的圓頭上有一道
// 開口的槽,搭在閥門搖臂的銷上。把桿端抬起(或壓下)超過槽深,銷就從鉤口中脫出。純函式。
// 推斷:偏心桿另一端接在圖外 ECC 處的偏心輪上,桿端被抬起時整根桿繞那一點微微轉動。
import { rot2 } from "./kit.js";
import { arcPoints, shape } from "./shapes.js";

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
