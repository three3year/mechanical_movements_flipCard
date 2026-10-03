// 第 239 種:用於正齒輪的擋止裝置(止動爪)的配置。齒輪上方左右各一支擋爪,外端以樞軸固定,內端的尖頭靠彈簧壓在
// 齒間;轉動齒輪時齒把擋爪頂起、越過齒尖再落進下一個齒間,所以齒輪停下時總停在一個齒的位置上。主動件是齒輪。
// 推斷:原文只有一句;兩支擋爪都是止動爪(不分方向),爪尖靠在齒面上;彈簧與齒數依原圖。
import { TAU, deg, add } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, gearProfile, thickLine } from "./shapes.js";
import { resample } from "./noncircular.js";

const N = 14;
const R = 1.55;
const TIP = R + 0.2;
const ROOT = R - 0.24;
const PITCH = TAU / N;
const PAWLS = {
  left: { pivot: [-2.45, 0.6, 0], length: 2.25, side: 1 },
  right: { pivot: [3.4, 0.55, 0], length: 2.75, side: -1 },
};

/** 齒輪表面在局部角 u 處離中心的距離(近似 gearProfile:齒頂佔半個齒距,兩側斜面) */
export function surface(u) {
  const f = (((u / PITCH) % 1) + 1) % 1;
  const d = Math.abs(f - 0.5) * 2; // 0 在齒頂中心,1 在齒槽中心
  if (d < 0.35) return TIP;
  if (d > 0.7) return ROOT;
  return TIP - ((TIP - ROOT) * (d - 0.35)) / 0.35;
}

/** 齒輪轉 theta:擋爪尖頭的位置(沿著齒面) */
export function pawlTip(which, theta) {
  const p = PAWLS[which];
  let r = ROOT;
  let tip = circleCircle(p.pivot, p.length, [0, 0, 0], r, p.side).point;
  for (let i = 0; i < 16; i++) {
    r = surface(Math.atan2(tip[1], tip[0]) - theta);
    tip = circleCircle(p.pivot, p.length, [0, 0, 0], r, p.side).point;
  }
  return { tip, r };
}
export const geometry = { N, PITCH, TIP, ROOT };

const pawl = (which) => {
  const L = PAWLS[which].length;
  return shape([[-0.22, -0.12], [L - 0.35, -0.16], [L + 0.05, 0], [L - 0.25, 0.22], [-0.22, 0.16]], [circle(0.07).reverse()]);
};

export default {
  figure: 239,
  parts: [
    { id: "gear", kind: "plate", shape: shape(resample(gearProfile({ teeth: N, radius: R }), 0.03), [circle(0.25).reverse()]), thickness: 0.2, hub: 0.55, circles: [0.55], mark: [-0.9, -0.4], markSize: 0.08, spin: TIP },
    { id: "pawlLeft", kind: "plate", center: [PAWLS.left.pivot[0], PAWLS.left.pivot[1], 0.18], shape: pawl("left"), thickness: 0.12, arrow: false },
    { id: "pawlRight", kind: "plate", center: [PAWLS.right.pivot[0], PAWLS.right.pivot[1], 0.18], shape: pawl("right"), thickness: 0.12, arrow: false },
    {
      id: "springs",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([add(PAWLS.left.pivot, [0.6, 1.0, 0]).slice(0, 2), add(PAWLS.left.pivot, [1.2, 0.45, 0]).slice(0, 2)], 0.05)), thickness: 0.05, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([add(PAWLS.right.pivot, [-0.8, 0.95, 0]).slice(0, 2), add(PAWLS.right.pivot, [-1.4, 0.35, 0]).slice(0, 2)], 0.05)), thickness: 0.05, at: [0, 0, 0.1] },
      ],
    },
  ],
  driver: { part: "gear", type: "rotation", initial: deg(4) },
  targets: ["pawlLeft", "pawlRight"], // 兩支止動爪
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const angle = (which) => {
      const { tip } = pawlTip(which, theta);
      const p = PAWLS[which].pivot;
      return Math.atan2(tip[1] - p[1], tip[0] - p[0]);
    };
    return { parts: { gear: { angle: theta }, pawlLeft: { angle: angle("left") }, pawlRight: { angle: angle("right") } }, readouts: [] };
  },
};

