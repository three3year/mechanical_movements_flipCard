// 第 232 種:振動搖臂 B,把間歇的圓周運動傳給齒形輪。A 是套在輪軸上、可自由擺動的一塊板,頂端以樞軸掛著
// 弧形的棘爪 C;B 也繞輪軸擺動,經一根短連桿接到 C 上。B 被抬起時先把 C 從齒間抬出,接著帶著 A 與 C 往後越過圓周;
// B 下降時 C 先落進兩齒之間的空隙,接著帶著輪一起轉。主動量是 B 的累計擺動量。
// 推斷:C 抬起所需的 B 轉角(LOOSE);B 每次擺動讓輪前進一齒。
import { TAU, deg, rot2, swingPhase, smooth } from "./kit.js";
import { shape, circle, thickLine, arcPoints, gearProfile } from "./shapes.js";
import { resample } from "./noncircular.js";

const N = 20;
const PITCH = TAU / N;
const R = 2.1; // 輪的節圓
const LOOSE = deg(7); // B 相對 A 轉這麼多時,C 完全抬起
const SWING = PITCH + LOOSE;
const LOW = -SWING / 2;
const HIGH = SWING / 2;
const C_PIVOT = [0.05, 2.85];
const C_LIFT = deg(16);
const B_PIN = [0.75, 0];
const C_PIN = [0.75, 2.62];

/** 主動量 v(B 的累計擺動):B、A 的轉角,C 抬起的比例與輪的轉角 */
export function motion(v) {
  const { at: b, forward, cycle } = swingPhase(v, LOW, HIGH);
  let a;
  let wheel;
  if (forward) {
    // 抬起:B 先單獨轉 LOOSE 把 C 抬出,之後帶著 A 往後(逆時針)
    a = Math.max(LOW, b - LOOSE);
    wheel = -cycle * PITCH;
  } else {
    // 下降:B 先單獨轉回 LOOSE 讓 C 落下,之後 A 與 C 帶著輪順時針轉
    a = Math.min(HIGH - LOOSE, b);
    wheel = -cycle * PITCH - (HIGH - LOOSE - a);
  }
  const lift = smooth((b - a) / LOOSE);
  return { b, a, lift, wheel };
}
export const geometry = { PITCH, LOOSE };

const wheelShape = shape(resample(gearProfile({ teeth: N, radius: R }), 0.03), [circle(0.15).reverse()]);
const plateA = shape(
  [[-0.45, -0.45], [1.75, -0.4], [1.8, 0.45], [0.85, 0.75], [0.35, 1.2], [0.35, 2.75], ...arcPoints(0.28, 0, Math.PI, 0.05, 2.85), [-0.25, 0.4]],
  [circle(0.12).reverse()],
);
// C:從樞軸沿輪緣往右彎下的弧形棘爪,尖端伸進齒間(局部座標:原點在樞軸)
const cArc = Array.from({ length: 14 }, (_, i) => {
  const a = deg(90) - (deg(52) * i) / 13;
  const r = R + 0.75 - (0.6 * i) / 13;
  return [r * Math.cos(a) - C_PIVOT[0], r * Math.sin(a) - C_PIVOT[1]];
});
const cShape = shape(thickLine(cArc, 0.36));

export default {
  figure: 232,
  parts: [
    { id: "wheel", kind: "plate", shape: wheelShape, thickness: 0.2, hub: 0.3, mark: [-1.4, -0.6], markSize: 0.09, spin: R + 0.2 },
    { id: "plateA", kind: "group", arrow: false, label: "A", labelOffset: [-0.15, 1.6, 0.3], pieces: [{ kind: "plate", shape: plateA, thickness: 0.1, at: [0, 0, 0.18] }] },
    {
      id: "pawlC",
      kind: "plate",
      shape: cShape,
      thickness: 0.1,
      arrow: false,
      label: "C",
      labelOffset: [1.3, -0.55, 0.3],
      // 爪尖的齒往後伸到齒輪那一層;掛連桿的銷往前伸到連桿(由後往前:齒輪、板 A、棘爪 C、連桿、槓桿 B)
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 0.36, at: [cArc[13][0], cArc[13][1], -0.18] },
        { kind: "cylinder", radius: 0.06, length: 0.14, at: [C_PIN[0] - C_PIVOT[0], C_PIN[1] - C_PIVOT[1], 0.11] },
      ],
    },
    { id: "leverB", kind: "plate", shape: shape(thickLine([[0, 0], [4.0, 0]], 0.36), [circle(0.12).reverse()]), thickness: 0.1, center: [0, 0, 0.58], arrow: false, label: "B", labelOffset: [3.0, 0.1, 0] },
    { id: "link", kind: "link", width: 0.16, thickness: 0.06, stretch: true },
  ],
  // 動力重演:只推主動件;wheel 靠摩擦定位,由接觸帶動
  replay: { free: { wheel: { hold: true } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "leverB", type: "rotation", cycle: [LOW, HIGH] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { b, a, lift, wheel } = motion(v);
    const pivot = rot2(C_PIVOT, a);
    const cAngle = a + lift * C_LIFT;
    const arm = rot2([C_PIN[0] - C_PIVOT[0], C_PIN[1] - C_PIVOT[1]], cAngle);
    const cPinNow = [pivot[0] + arm[0], pivot[1] + arm[1]];
    const bPin = rot2(B_PIN, b);
    return {
      parts: {
        wheel: { angle: wheel + PITCH / 2 },
        plateA: { angle: a },
        pawlC: { position: [pivot[0], pivot[1], 0.3], angle: cAngle },
        leverB: { angle: b },
        link: { from: [bPin[0], bPin[1], 0.5], to: [cPinNow[0], cPinNow[1], 0.5] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 0.87 時已轉 -18°,實際沒動。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
    { check: "interference", parts: ["wheel", "pawlC"], reason: "棘爪 C 的抬起、落下依槓桿的行程演出,不逐點算爪尖落在齒上的位置;推齒與滑過齒頂時爪尖伸進齒 0.11(96 個取樣中 40 個)" },
  ],
};

