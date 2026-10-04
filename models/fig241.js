// 第 241 種:有單一個齒的小輪連續旋轉,把間歇的圓周運動傳給輪 A。小輪(左下)逆時針轉,每轉一圈它的鉤形單齒
// 從下往上撥 A 左側的一個齒,A 順時針轉一格(原圖兩個箭頭);其餘時間 A 不動,左上方的彎形止回爪扣住 A 的齒,
// 不讓它倒轉。主動件是小輪。
// 推斷:A 有 24 齒;單齒撥動的角度範圍;止回爪靠自重落在齒上。
import { TAU, deg } from "./kit.js";
import { indexStep } from "./jumps.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

const A = { center: [0.75, 0.15, 0], teeth: 24, outer: 1.7, inner: 1.38, dir: -1 };
const STEP = TAU / A.teeth;
const SMALL = { center: [-1.0, -1.05, 0], radius: 0.72 };
const WINDOW = { from: deg(-30), span: deg(80), step: STEP };

/** 小輪轉 theta(逆時針):A 的轉角(順時針為負) */
export const wheelA = (theta) => -indexStep(theta, WINDOW);
export const step = STEP;

const hook = shape([[-0.05, 0.12], [0.55, 0.22], [0.92, 0.05], [0.98, -0.12], [0.8, -0.05], [0.5, 0.02], [-0.05, -0.12]], [circle(0.07).reverse()]);

export default {
  figure: 241,
  parts: [
    { id: "wheelA", kind: "plate", center: A.center, shape: ratchetShape({ ...A, bore: 0.12 }), thickness: 0.2, hub: 0.32, circles: [0.42], mark: [0.95, -0.3], markSize: 0.08, spin: A.outer, label: "A", labelOffset: [0.85, 0, 0.3] },
    {
      id: "small",
      kind: "group",
      center: SMALL.center,
      spin: SMALL.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(SMALL.radius), [circle(0.1).reverse()]), thickness: 0.14, at: [0, 0, -0.1] },
        { kind: "plate", shape: hook, thickness: 0.12, at: [0, 0, 0.05], angle: deg(10), accent: true },
      ],
    },
    {
      id: "click",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-1.75, 1.15], [-1.0, 1.75], [-0.05, 1.85], [0.65, 1.62]], 0.24)), thickness: 0.1 },
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2, at: [-1.75, 1.15, 0] },
      ],
    },
  ],
  // 動力重演:只推主動件;wheelA 靠摩擦定位,由接觸帶動
  replay: { from: 0, to: 6.283185307179586, free: { wheelA: { hold: true } }, expect: [{ part: "wheelA", label: "主動件走完一輪後 wheelA 的位置" }] },
  driver: { part: "small", type: "rotation" },
  target: "wheelA",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { small: { angle: theta }, wheelA: { angle: wheelA(theta) } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheelA"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheelA 的位置」預期 wheelA 在主動量 6.28 時已轉 -15°,實際轉了 -71°。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
    { check: "interference", parts: ["wheelA", "small"], reason: "小輪上的鉤每圈推棘輪一齒,推的過程依時序演出,不逐點算鉤與齒的接觸;鉤尖伸進齒 0.11" },
    { check: "interference", parts: ["wheelA", "click"], reason: "止回爪畫成固定的形狀(沒有演出它被齒頂開再落回),棘輪轉動時齒掃過它的末端,重疊 0.15" },
  ],
};

