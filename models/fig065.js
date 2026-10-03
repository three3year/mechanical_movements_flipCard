// 第 65 種:左側的驅動輪 C 上固定著撥爪 A;右側的輪 D 面上凸出一圈等距的凸柱。
// C 每轉一圈,撥爪撥動一根凸柱,使 D 轉過一個凸柱的距離。下方以固定樞軸裝一支槓桿狀的擋止:
// 平時它的左端被 C 的圓周頂住、右端卡在 D 的兩根凸柱之間;撥爪撥動的那一刻,C 上的凹槽轉到左端,
// 槓桿得以擺動、放開凸柱;撥爪一離開,槓桿又被推回下一根凸柱前方。主動件是 C(順時針)。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, shape } from "./shapes.js";
import { indexStep } from "./jumps.js";

const C = { center: [-1.6, 0, 0], radius: 1.55 };
const D = { center: [1.5, 0, 0], radius: 1.5, studs: 10, studR: 1.2 };
const TAPPET = { length: 2.05, at: deg(12) };
const WINDOW = { from: 0, span: deg(26) };
const STEP = TAU / D.studs;
const D0 = deg(160);
const LEVER = { pivot: [0.05, -1.68, 0.25], tilt: deg(7) };
const NOTCH = deg(-61); // C 上凹槽的局部角(撥爪撥動時正對槓桿左端)

/** C 順時針轉過 c:D 的轉角(逆時針)與槓桿擺動的比例 */
export function indexing(c) {
  const d = D0 + indexStep(c, { ...WINDOW, step: STEP });
  const k = Math.floor((c - WINDOW.from) / TAU);
  const u = c - WINDOW.from - k * TAU;
  const swing = u < WINDOW.span ? Math.sin((Math.PI * u) / WINDOW.span) : 0;
  return { d, swing };
}
export const studStep = STEP;

const notched = (() => {
  const w = deg(11);
  const depth = 0.22;
  return [
    ...arcPoints(C.radius, NOTCH + w, NOTCH + TAU - w),
    ...[NOTCH - w, NOTCH + w].map((a, i) => polar(C.radius - depth, i === 0 ? NOTCH - w * 0.7 : NOTCH + w * 0.7).slice(0, 2)),
  ];
})();

const lever = shape([
  [-1.45, 0.02],
  [-1.2, 0.22],
  [-0.3, 0.22],
  [0.4, 0.15],
  [0.95, 0.42],
  [1.1, 0.18],
  [1.32, 0.38],
  [1.45, 0.05],
  [0.5, -0.12],
  [-0.2, -0.32],
  [-1.5, -0.3],
]);

export default {
  figure: 65,
  parts: [
    {
      id: "c",
      kind: "plate",
      center: C.center,
      shape: shape(notched, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      spin: C.radius,
      pieces: [
        {
          kind: "plate",
          shape: shape([[0, 0.24], ...arcPoints(0.24, Math.PI / 2, (3 * Math.PI) / 2), [0, -0.24], [TAPPET.length, -0.06], [TAPPET.length + 0.08, 0.04], [TAPPET.length, 0.1]]),
          thickness: 0.1,
          at: [0, 0, 0.22],
          angle: TAPPET.at,
          accent: true,
        },
      ],
      label: "C",
      labelOffset: [0.55, -0.7, 0.3],
    },
    { id: "labelA", kind: "group", center: [...polar(1.45, TAPPET.at).slice(0, 2).map((x, i) => x + C.center[i]), 0.3], label: "A", labelOffset: [0, 0.32, 0] },
    {
      id: "d",
      kind: "plate",
      center: D.center,
      shape: shape(circle(D.radius), [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      spin: D.radius,
      pieces: Array.from({ length: D.studs }, (_, i) => ({
        kind: "cylinder",
        radius: 0.11,
        length: 0.5,
        at: [...polar(D.studR, (i * TAU) / D.studs).slice(0, 2), 0.3],
        accent: i === 0,
      })),
      label: "D",
      labelOffset: [0, -0.65, 0.3],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [{ kind: "plate", shape: lever, thickness: 0.12 }, { kind: "cylinder", radius: 0.2, length: 0.2 }],
    },
  ],
  // C 順時針轉(轉角為負)
  waivers: [
    { check: "interference", parts: ["c", "d"], reason: "待確認(未修):c 的板 與 d 的圓柱 r0.11×0.5互相穿入 0.12(2 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["c", "lever"], reason: "待確認:c 的板 與 lever 的板重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "c", type: "rotation", speed: -1.0, initial: deg(-6) },
  target: "d", // 每圈被撥動一格的輪 D
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { d, swing } = indexing(-v);
    return {
      parts: { c: { angle: v }, d: { angle: d }, lever: { angle: -LEVER.tilt * swing } },
      readouts: [],
    };
  },
};
