// 第 35 種:由均勻的旋轉運動產生變速旋轉運動。小齒輪等速轉動,與橢圓齒輪咬合;小齒輪的軸承在桿上的
// 溝槽裡滑動(彈簧使它保持嚙合),桿則鬆套在橢圓齒輪的軸上——溝槽容納了橢圓半徑的變化。
// 小齒輪沿橢圓滾動時,橢圓齒輪轉過的角度 = 滾過的弧長 ÷ 接觸處的半徑,所以轉速隨半徑而變。
// 這裡桿的方向保持不動(推斷:原文只說桿鬆套在軸上,桿的擺動很小,略去)。
import { TAU, deg } from "./kit.js";
import { cumulative, periodic, inverseOf, samplePitch, noncircularOutline, arcAt } from "./noncircular.js";
import { gearShape, circle, stadium, shape } from "./shapes.js";

const A = 2.0;
const B = 1.2;
const TEETH = 36;
const PINION_TEETH = 10;
const ARM = deg(135); // 桿的方向:小齒輪在橢圓的左上方
const ellipse = (a) => (A * B) / Math.sqrt((B * Math.cos(a)) ** 2 + (A * Math.sin(a)) ** 2);
const { length } = samplePitch(ellipse);
const PITCH = length / TEETH;
const RP = (PINION_TEETH * PITCH) / TAU; // 小齒輪節圓半徑:齒距與橢圓齒輪相同
const M = PITCH / Math.PI;

// 橢圓齒輪順時針轉 φ 時(接觸處在它的局部角 ARM + φ),小齒輪轉過的角度:dα/dφ = r(接觸處) ÷ r小齒輪
const table = cumulative((phi) => ellipse(ARM + phi) / RP, TAU);
const pinionOf = periodic(table, TAU);
const wheelOf = periodic(inverseOf(table), table.ys[table.ys.length - 1]);

/** 小齒輪逆時針轉 alpha 時橢圓齒輪的轉角(外咬合,反向) */
export const wheelAngle = (alpha) => -wheelOf(alpha);
/** 接觸處橢圓的半徑 */
export const contactRadius = (alpha) => ellipse(ARM - wheelAngle(alpha));
export const pinionRadius = RP;

const S0 = arcAt(ellipse, ARM);
const outline = noncircularOutline(ellipse, { teeth: TEETH, addendum: M, dedendum: 1.2 * M, start: S0 });
const inner = Array.from({ length: 120 }, (_, i) => {
  const a = (i / 120) * TAU;
  const r = ellipse(a) - 0.35;
  return [r * Math.cos(a), r * Math.sin(a)];
});

export default {
  figure: 35,
  parts: [
    {
      id: "pinion",
      kind: "gear",
      teeth: PINION_TEETH,
      radius: RP,
      width: 0.24,
      center: [0, 0, 0],
      web: false,
    },
    {
      id: "wheel",
      kind: "plate",
      shape: { outline, holes: [circle(0.12).reverse()] },
      thickness: 0.22,
      engrave: [inner],
      hub: 0.22,
      mark: [1.4, 0],
      markSize: 0.09,
      spin: 2.2,
    },
    {
      id: "bar",
      kind: "plate",
      center: [0, 0, 0.25],
      shape: shape(stadium(3.05, 0.42).outline, [circle(0.12).reverse(), [
        ...[[1.6, -0.08], [2.95, -0.08], [2.95, 0.08], [1.6, 0.08]],
      ].reverse()]),
      thickness: 0.08,
    },
  ],
  driver: { part: "pinion", type: "rotation" },
  view: { direction: [0.08, 0.06, 1] },
  pose(alpha) {
    const wheel = wheelAngle(alpha);
    const d = ellipse(ARM - wheel) + RP;
    const center = [d * Math.cos(ARM), d * Math.sin(ARM), 0];
    // 小齒輪的齒對準橢圓齒輪:接觸方向(朝橢圓中心)上是齒槽
    const pinion = ARM + Math.PI + Math.PI / PINION_TEETH + alpha;
    return { parts: { pinion: { position: center, angle: pinion }, wheel: { angle: wheel }, bar: { angle: ARM } }, readouts: [] };
  },
};
