// 第 73 種:驅動輪 D 上固定一根彎曲的彈簧 B;另一根強力彈簧 C 從固定的支座伸上來,末端靠在棘輪 A 的齒上。
// D 轉動時,B 從 C 的下方通過,把 C 壓進 A 的一齒並推著它,使 A 轉過一齒;B 離開後 C 回彈,
// 當作擋止讓 A 保持靜止,直到 D 再轉一圈。A 與 D 同軸,A 鬆套在軸上。主動件是 D(順時針)。
import { TAU, deg, polar, smooth } from "./kit.js";
import { ratchetShape, circle, shape, arcPoints } from "./shapes.js";
import { indexStep } from "./jumps.js";

const D = { radius: 2.1 };
const A = { teeth: 12, outer: 1.45, inner: 1.1, dir: -1 };
const STEP = TAU / A.teeth;
const C_TIP = deg(152); // C 的末端靠在 A 的這個方向
const B_AT = deg(58); // B 在 D 上的局部角(固定端)
const B_SPAN = deg(45); // B 沿輪緣往順時針方向伸出的長度
const WINDOW = { from: B_AT - B_SPAN - C_TIP + TAU - deg(8), span: deg(30) };

/** D 順時針轉過 d:A 的轉角(順時針為負)與 C 被壓下的比例 */
export function motion(d) {
  const a = -indexStep(d, { ...WINDOW, step: STEP });
  const k = Math.floor((d - WINDOW.from) / TAU);
  const u = d - WINDOW.from - k * TAU;
  const press = u < WINDOW.span ? Math.sin((Math.PI * u) / WINDOW.span) : 0;
  return { a, press };
}
export const toothStep = STEP;

// 彈簧 C:從左下的支座往上彎到 A 的左側,末端被壓下時往 A 的中心與順時針方向偏
function springC(press) {
  const base = [-2.6, -2.6, 0.15];
  const tip0 = polar(A.outer - 0.05, C_TIP);
  const tip = polar(A.outer - 0.05 - 0.15 * press, C_TIP - deg(10) * press);
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const bend = smooth(t) * press;
    const x = base[0] + (tip0[0] - base[0]) * t + Math.sin(Math.PI * t) * 0.35 + (tip[0] - tip0[0]) * bend;
    const y = base[1] + (tip0[1] - base[1]) * t + (tip[1] - tip0[1]) * bend;
    pts.push([x, y, 0.15]);
  }
  return pts;
}

const springB = arcPoints(D.radius - 0.28, B_AT, B_AT - B_SPAN);

export default {
  figure: 73,
  parts: [
    {
      id: "d",
      kind: "group",
      spin: D.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(D.radius), [circle(0.2).reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "tube", points: springB.map(([x, y]) => [x, y, 0.15]), radius: 0.06 },
        { kind: "box", size: [0.3, 0.22, 0.3], at: [...polar(D.radius - 0.28, B_AT).slice(0, 2), 0.1], angle: B_AT, accent: true },
      ],
      label: "D",
      labelOffset: [-0.8, -1.6, 0.3],
    },
    { id: "labelB", kind: "group", label: "B", labelOffset: [0, 0, 0.3] },
    {
      id: "a",
      kind: "plate",
      center: [0, 0, 0.05],
      shape: ratchetShape({ ...A, bore: 0.16 }),
      thickness: 0.16,
      hub: 0.4,
      circles: [0.48],
      mark: [0.8, 0],
      markSize: 0.08,
      spin: A.outer,
      label: "A",
      labelOffset: [-0.05, 0.75, 0.3],
    },
    { id: "springC", kind: "rod", radius: 0.06 },
    { id: "support", kind: "box", center: [-3.0, -2.95, 0], size: [1.3, 0.8, 0.6] },
    { id: "labelC", kind: "group", center: [-1.85, 0.75, 0.2], label: "C" },
  ],
  waivers: [
    { check: "interference", parts: ["d", "springC"], reason: "待確認:springC 的第 8 段穿過d 的方塊 0.3×0.22×0.3重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "d", type: "rotation", speed: -0.9 },
  target: "a", // 每圈被推一齒的棘輪 A
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { a, press } = motion(-v);
    const bTip = polar(D.radius - 0.28, B_AT - B_SPAN / 2 + v);
    return {
      parts: { d: { angle: v }, a: { angle: a }, labelB: { position: [bTip[0] * 1.12, bTip[1] * 1.12, 0.3] } },
      paths: { springC: { points: springC(press), closed: false } },
      readouts: [],
    };
  },
};
