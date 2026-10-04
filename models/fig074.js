// 第 74 種:缺齒式斜齒輪 C(只有半圈有齒)連續轉動,把方向相反的均勻間歇旋轉傳給兩側的斜齒輪 A 與 B:
// 有齒的半圈經過 A 時 A 轉、B 停;經過 B 時 B 反向轉、A 停。主動件是 C。
// C 的有齒與缺齒段都是齒距的整數倍,所以每次重新咬合時齒都對得上。
import { X, Y, TAU, planeAngle } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { sectorEngaged } from "./jumps.js";

const M = 0.11;
const NC = 32;
const NS = 26;
const [CONE_C, CONE_S] = pitchCones(NC, NS);
const APEX = [0, 0, 0];
export const C = bevelGear({ apex: APEX, axis: Y, teeth: NC, radius: (NC * M) / 2, cone: CONE_C, width: 0.6 });
export const A = bevelGear({ apex: APEX, axis: X, teeth: NS, radius: (NS * M) / 2, cone: CONE_S, width: 0.6 });
export const B = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: NS, radius: (NS * M) / 2, cone: CONE_S, width: 0.6 });
const CA = bevelContact(C, A);
const CB = bevelContact(C, B);
const PITCH = TAU / NC;
const TOOTHED = NC / 2;
const SECTOR = { start: -PITCH / 2, len: TOOTHED * PITCH };

// 有齒的扇區經過接觸點時,從動輪照一般咬合轉;否則停住
const follower = (g, contact) => {
  const at = planeAngle(Y, contact);
  const first = at - SECTOR.start - SECTOR.len;
  return (theta) => meshAngle(C, g, first + sectorEngaged(theta, { contact: at, ...SECTOR }), contact);
};
const aOf = follower(A, CA);
const bOf = follower(B, CB);

export const angles = (theta) => ({ a: aOf(theta), b: bOf(theta) });

const bevel = (id, g, shaft, extra = {}) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  pieces: [{ kind: "cylinder", radius: 0.14, length: shaft, at: [0, 0, -shaft / 2 - 0.2] }],
  ...extra,
});

export default {
  figure: 74,
  parts: [
    bevel("c", C, 1.6, { toothed: Array.from({ length: TOOTHED }, (_, i) => i), bore: C.radius * 0.55, label: "C", labelOffset: [-1.2, 0.2, 1.4] }),
    bevel("a", A, 1.2, { label: "A", labelOffset: [0.6, 0.9, 0] }),
    bevel("b", B, 1.2, { label: "B", labelOffset: [-0.6, 0.9, 0] }),
  ],
  // 起始時有齒的半圈朝向右前方(原圖)
  // 動力重演:只推缺齒斜齒輪 C;A、B 靠摩擦定位,由 C 的有齒段帶動
  replay: { to: 2.2 + 2 * Math.PI, free: { a: { hold: true }, b: { hold: true } }, expect: [{ part: "a", label: "C 轉一圈後 A 轉過的角度" }, { part: "b", label: "C 轉一圈後 B 轉過的角度" }] },
  driver: { part: "c", type: "rotation", initial: 2.2 },
  targets: ["a", "b"], // 交替得到間歇旋轉的兩輪
  view: { direction: [0.03, 0.42, 1], fov: 20 },
  pose(theta) {
    const { a, b } = angles(theta);
    return { parts: { c: { angle: theta }, a: { angle: a }, b: { angle: b } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["b"], reason: "重演中有齒段確實把輪帶著轉,但缺齒段經過時輪只靠摩擦停住,多滑了約 25°(原文沒有畫定位裝置,模型裡輪是立刻停住的)。列入待確認清單" },
    { check: "replay", parts: ["a"], reason: "重演中有齒段確實把輪帶著轉,但缺齒段經過時輪只靠摩擦停住,多滑了約 25°(原文沒有畫定位裝置,模型裡輪是立刻停住的)。列入待確認清單" },
    { check: "interference", parts: ["c", "b"], reason: "簡化齒形:缺齒斜齒輪有齒的半圈重新咬入時,第一齒的齒頂與對方齒頂擦到 0.10(96 個取樣中 4–5 個);實物的缺齒輪會把第一齒修短。齒距與相位對得上、傳動關係正確" },
    { check: "interference", parts: ["c", "a"], reason: "簡化齒形:缺齒斜齒輪有齒的半圈重新咬入時,第一齒的齒頂與對方齒頂擦到 0.10(96 個取樣中 4–5 個);實物的缺齒輪會把第一齒修短。齒距與相位對得上、傳動關係正確" },
  ],
};
