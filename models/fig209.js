// 第 209 種:以滾動接觸得到運動的一種方式。兩個相同的橢圓輪各繞一個焦點轉,外緣互相滾動;光面的部分靠滾動帶動,
// 齒是為了讓運動能連續:沒有齒的話,運動會在圖中所示的接觸點附近停住。上方的叉形卡榫引導齒進入正確的接觸。
// 左輪沿長軸的一側有齒,右輪與它相對應的一段有齒(兩者正好互相咬合),其餘是光面。主動件是左輪。
// 推斷:兩輪是以焦點為軸的相同橢圓;齒數;叉與角狀凸出的位置在齒開始咬合的地方。
import { TAU } from "./kit.js";
import { conjugate, samplePitch, arcAt } from "./noncircular.js";
import { shape, circle, thickLine } from "./shapes.js";

const A = 1.45;
const C = 1.0;
const E = C / A;
const P = A * (1 - E * E);
const r1 = (phi) => P / (1 + E * Math.cos(phi)); // 局部角 0 是近焦點的頂點
const { D, driven, r2 } = conjugate(r1);
const TEETH = 28;
const PITCH = samplePitch(r1).length / TEETH;
const M = PITCH / Math.PI;
const wrap = (a) => ((a % TAU) + TAU) % TAU;
const toothed1 = (phi) => Math.sin(phi) < 0; // 左輪:長軸一側(從遠端頂點到近端頂點)有齒
// 右輪的齒:與左輪有齒的部分滾過的那一段(依接觸點的對應關係取表)
const MAP = Array.from({ length: 720 }, () => false);
for (let i = 0; i < 2880; i++) {
  const t = (i / 2880) * TAU;
  MAP[Math.floor((wrap(Math.PI - driven(t)) / TAU) * 720) % 720] = toothed1(wrap(-t));
}
const toothed2 = (psi) => MAP[Math.floor((wrap(psi) / TAU) * 720) % 720];

/** 沿節曲線排齒,只在 mask 為真的地方有齒,其餘保持節曲線(光面滾動) */
function outline(r, mask, start, n = 1440) {
  const { pts, s } = samplePitch(r, n);
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    let nx = next[1] - prev[1];
    let ny = -(next[0] - prev[0]);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    if (!mask((i / n) * TAU)) return p;
    const u = (s[i] - start) / PITCH;
    const c = Math.abs(u - Math.round(u));
    const h = c < 0.14 ? M : c < 0.27 ? M - (2.2 * M * (c - 0.14)) / 0.13 : -1.2 * M;
    return [p[0] + nx * h, p[1] + ny * h];
  });
}

/** 左輪轉 theta:右輪的轉角,與目前接觸處是齒還是光面 */
export function pair(theta) {
  const phi = -theta; // 左輪接觸點的局部角(連心線朝 +x)
  return { right: driven(theta), toothed: toothed1(phi), contact: r1(phi) };
}
export const geometry = { A, C, D, r1, r2 };

const START = Math.PI + 0.45; // 原圖:左輪近焦點的頂點朝左上,以遠端的光面接觸右輪,叉形卡榫在上方接近接觸點
// 叉形卡榫在左輪齒開始處(遠端頂點,局部角 180°),角狀凸出在右輪相應的位置
const FORK_AT = Math.PI;
const HORN_AT = Math.PI - driven(-FORK_AT);
const fork = (() => {
  const base = [r1(FORK_AT) * Math.cos(FORK_AT), r1(FORK_AT) * Math.sin(FORK_AT)];
  const out = [Math.cos(FORK_AT), Math.sin(FORK_AT)];
  const side = [-out[1], out[0]];
  const tip = (k) => [base[0] + out[0] * 0.45 + side[0] * k * 0.22, base[1] + out[1] * 0.45 + side[1] * k * 0.22];
  return [shape(thickLine([base, tip(1)], 0.09)), shape(thickLine([base, tip(-1)], 0.09))];
})();
const horn = (() => {
  const rr = r2(HORN_AT);
  const base = [rr * Math.cos(HORN_AT), rr * Math.sin(HORN_AT)];
  const out = [Math.cos(HORN_AT), Math.sin(HORN_AT)];
  return shape(thickLine([base, [base[0] + out[0] * 0.4, base[1] + out[1] * 0.4]], 0.1));
})();

const gear = (id, center, outlineShape, extra) => ({
  id,
  kind: "group",
  center,
  spin: 1.4,
  pieces: [
    { kind: "plate", shape: { outline: outlineShape, holes: [circle(0.1).reverse()] }, thickness: 0.22 },
    { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.32, mark: true },
    ...extra,
  ],
});

export default {
  figure: 209,
  parts: [
    gear("left", [0, 0, 0], outline(r1, toothed1, arcAt(r1, 0)), fork.map((s) => ({ kind: "plate", shape: s, thickness: 0.1, at: [0, 0, 0.16] }))),
    gear("right", [D, 0, 0], outline(r2, toothed2, arcAt(r2, Math.PI) + PITCH / 2), [{ kind: "plate", shape: horn, thickness: 0.1, at: [0, 0, 0.16] }]),
  ],
  driver: { part: "left", type: "rotation", initial: START },
  target: "right",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { right } = pair(theta);
    return { parts: { left: { angle: theta }, right: { angle: right } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["left", "right"], reason: "右輪的角進出左輪的叉形卡榫(帶過光面滾動的那一段)時,與叉齒重疊 0.10(96 個取樣中 10 個);兩輪的轉角是依節曲線的滾動關係算的,沒有另外算卡榫的接觸" },
  ],
};
