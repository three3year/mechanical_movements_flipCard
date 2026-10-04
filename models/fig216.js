// 第 216 種:外側(內齒)與內側(外齒)兩個缺齒輪裝在同一根軸上、一起轉,交替地與下方的小齒輪咬合:
// 外側大圈的上半有朝內的齒,內側小輪的下半有朝外的齒。輪連續旋轉時,小齒輪先被內側小輪的齒帶著反向慢慢轉
// (正向的慢運動),等外側大圈的齒轉到下方,換成被它帶著同向快轉(快速的反向運動)。主動件是輪(兩個缺齒輪一起)。
// 推斷:兩個缺齒輪各有半圈齒;齒數 12(內)、40(外)、小齒輪 14,同齒距,小齒輪軸心到輪心 = 內輪半徑 + 小齒輪半徑。
import { TAU } from "./kit.js";
import { shape, circle, gearProfile } from "./shapes.js";
import { resample } from "./noncircular.js";

const PITCH = 0.38;
const NS = 12;
const NP = 14;
const NI = NS + 2 * NP;
const r = (n) => (n * PITCH) / TAU;
const RS = r(NS);
const RP = r(NP);
const RI = r(NI);
const D = RS + RP;
const wrap = (a) => ((a % TAU) + TAU) % TAU;
// 外圈:局部角 [0, π](上半)有齒;內輪:[π, 2π](下半)有齒
const H = (x) => Math.floor(x / TAU) * Math.PI + Math.min(wrap(x), Math.PI);

/** 輪轉 theta(逆時針):小齒輪的轉角,與目前由哪一圈帶動 */
export function pinion(theta) {
  // 接觸點在輪的局部角 −π/2 − theta;外圈在接觸時 wrap(theta − π/2) < π
  const outer = H(theta - Math.PI / 2) - H(-Math.PI / 2);
  const inner = theta - outer;
  return { angle: (RI / RP) * outer - (RS / RP) * inner, by: wrap(theta - Math.PI / 2) < Math.PI ? "outer" : "inner" };
}
export const radii = { RS, RP, RI };

const half = (n, from) => (i) => {
  const a = wrap((i * TAU) / n);
  return a >= from - 1e-9 && a <= from + Math.PI + 1e-9;
};
const innerGear = resample(gearProfile({ teeth: NS, radius: RS, has: half(NS, Math.PI) }), 0.03);
const outerTeeth = resample(gearProfile({ teeth: NI, radius: RI, internal: true, has: half(NI, 0) }), 0.03);

export default {
  figure: 216,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: RI + 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(RI + 0.4), [[...outerTeeth].reverse()]), thickness: 0.2 },
        { kind: "plate", shape: shape(circle(RI + 0.4), [circle(RI + 0.28).reverse()]), thickness: 0.05, at: [0, 0, -0.2], mark: [0, -(RI + 0.34)], markSize: 0.06 },
        { kind: "plate", shape: shape(innerGear, [circle(0.2).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.42, inner: 0.2, length: 0.3, mark: true },
      ],
    },
    { id: "pinion", kind: "gear", center: [0, -D, 0], teeth: NP, radius: RP, width: 0.2, bore: 0.2 },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "pinion",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { angle } = pinion(theta);
    return { parts: { wheel: { angle: theta }, pinion: { angle: Math.PI / 2 + Math.PI / NP + angle } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "pinion"], reason: "簡化齒形:節曲線半徑變化的輪以折線近似排齒,半徑轉折處齒頂與小齒輪的齒重疊 0.13(96 個取樣中 15 個)" },
  ],
};
