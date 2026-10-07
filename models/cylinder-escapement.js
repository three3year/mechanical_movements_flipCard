// 第 294–295 種共用:圓筒式擒縱。擺輪軸下端是一段切掉將近一半的空心圓筒(A、B 為兩側的切口邊緣);
// 擒縱輪的齒是立在細柄上的楔形叉瓦(a、b、c),交替地停靠在圓筒的外側與內側。擺輪往一邊擺時,
// 切口轉到停在外側的齒前面,齒尖滑過切口邊緣 A 進到圓筒裡,楔形的斜面推著邊緣走(給擺輪衝量),
// 齒尖接著停在圓筒的內壁上;擺回來時另一側的邊緣 B 轉過齒尖,齒從切口出去,斜面再推一次,
// 下一齒的齒尖落在圓筒的外壁上。擺輪每擺一次,擒縱輪前進半個齒。
// 主動件是擺輪(累計擺動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。第 294 種以立體圖看圓筒,第 295 種從上方看擒縱輪的一段。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受發條的固定力矩往順時針轉,被圓筒的壁擋住就停,
// 齒的斜面滑過切口邊緣時推著走,脫開後加速落到圓筒的另一面。算接觸的是叉瓦那一層的圓筒截面(切開的圓環)。
// 推斷:齒數、齒形、擺幅與切口的大小;圓筒上方接擺輪軸,軸的上端裝在橫跨的軸承架上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { escapeByContact, placePoly, ccw } from "./escapement.js";
import { shape, circle, arcPoints } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(110);
const RC = 2.2; // 圓筒軸心到輪心的距離(在齒走的圓上)
const CYL = { r: 0.24, inner: 0.19, cut: deg(150) }; // 圓筒外徑、內徑、切口張開的角度
const OPEN = deg(-90); // 擺輪居中時切口朝的方向(朝輪心)
const AT = [0, RC];
const WEDGE = { length: 0.34, half: 0.06 }; // 叉瓦:沿走向的長度、根部(後端)的半寬

/** 擺輪累計擺動 v → 擺輪角 */
export const balanceAngle = (v) => swing(v, -SWING, SWING);

// 叉瓦(輪的局部座標,第 i 齒):齒尖在前(順時針轉時在前,角度小的一側)、在齒走的圓上,往後漸寬成楔形
const wedge = (i) => {
  const a0 = Math.PI / 2 + i * PITCH; // 齒尖的方位
  const a1 = a0 + WEDGE.length / RC; // 後端
  const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  return ccw([p(RC, a0), p(RC + WEDGE.half, a1), p(RC - WEDGE.half, a1)]);
};
const teeth = Array.from({ length: N }, (_, i) => wedge(i));

// 叉瓦那一層的圓筒截面:切開的圓環(擺輪居中時切口朝 OPEN)
const ringSection = (() => {
  const a0 = OPEN + CYL.cut / 2;
  const a1 = OPEN - CYL.cut / 2 + TAU;
  return [...arcPoints(CYL.r, a0, a1), ...arcPoints(CYL.inner, a1, a0)];
})();

export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth, dir: -1, period: 4 * SWING, samples: 1440, stops: (v) => [placePoly(ringSection, AT, balanceAngle(v))] }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角、擒縱輪轉角(順時針為負) */
export function cylinder(v) {
  return { balance: balanceAngle(v), wheel: escapement.angle(v) };
}

const WEDGE_Z = 0.17; // 叉瓦那一層
// 輪:輪緣與輪輻在 z = 0;每齒一根細柄斜上去接叉瓦的後端
const stalk = (i) => {
  const a = Math.PI / 2 + i * PITCH + WEDGE.length / RC;
  return { kind: "box", size: [0.5, 0.05, 0.06], at: [(RC - 0.3) * Math.cos(a), (RC - 0.3) * Math.sin(a), 0.07], angle: a };
};

export function cylinderEscapement(figure, view) {
  return {
    figure,
    parts: [
      {
        id: "wheel",
        kind: "group",
        spin: RC - 0.6,
        arrow: false,
        pieces: [
          { kind: "plate", shape: shape(circle(RC - 0.5), [circle(RC - 0.75).reverse()]), thickness: 0.08 },
          { kind: "box", size: [2 * (RC - 0.75), 0.12, 0.06] },
          { kind: "box", size: [0.12, 2 * (RC - 0.75), 0.06] },
          { kind: "cylinder", radius: 0.15, length: 0.3 },
          { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, -0.3] }, // 輪軸,往後伸進軸承架
          ...Array.from({ length: N }, (_, i) => stalk(i)),
          ...teeth.map((t, i) => ({ kind: "plate", shape: shape(t), thickness: 0.1, at: [0, 0, WEDGE_Z], accent: i === 0 })),
        ],
      },
      {
        id: "cylinder",
        kind: "group",
        center: [...AT, 0],
        spin: 0.5,
        label: "A",
        labelOffset: [-0.45, 0.2, 0.5],
        pieces: [
          // 切掉將近一半的空心圓筒:叉瓦那一層是切開的圓環,上面接完整的圓筒與擺輪軸
          { kind: "plate", shape: shape(ringSection), thickness: 0.16, at: [0, 0, WEDGE_Z] },
          { kind: "plate", shape: shape(circle(CYL.r), [circle(CYL.inner).reverse()]), thickness: 0.3, at: [0, 0, WEDGE_Z + 0.23] },
          { kind: "cylinder", radius: CYL.r, length: 0.1, at: [0, 0, WEDGE_Z + 0.43] },
          { kind: "cylinder", radius: 0.07, length: 1.2, at: [0, 0, WEDGE_Z + 1.0] },
          { kind: "box", size: [0.28, 0.08, 0.08], at: [0.14, 0, WEDGE_Z + 1.3], accent: true },
        ],
      },
      {
        id: "cock",
        kind: "group",
        pieces: [
          // 擺輪軸上端的軸承架與擒縱輪的軸承座(原圖沒畫)
          { kind: "cylinder", radius: 0.13, inner: 0.07, length: 0.12, at: [AT[0], AT[1], WEDGE_Z + 1.66] },
          { kind: "box", size: [0.16, 0.16, 2.1], at: [AT[0] + 0.3, AT[1] + 0.3, WEDGE_Z + 0.65] },
          { kind: "box", size: [0.5, 0.16, 0.12], at: [AT[0] + 0.2, AT[1] + 0.2, WEDGE_Z + 1.66], angle: deg(45) },
          { kind: "plate", shape: shape(circle(0.2)), thickness: 0.1, at: [0, 0, -0.65] },
          { kind: "box", size: [0.16, 2.4, 0.1], at: [0.0, 1.2, -0.65] },
          { kind: "box", size: [0.16, 0.16, 0.6], at: [AT[0] + 0.3, AT[1] + 0.3, -0.42] },
        ],
      },
      { id: "labelB", kind: "group", center: [...AT, 0], label: "B", labelOffset: [0.45, 0.2, 0.5] },
    ],
    // 動力重演:只推擺輪;擒縱輪受固定的力矩(發條)往順時針轉,由圓筒的壁擋住、放行
    replay: {
      to: 8 * SWING,
      seconds: 20,
      free: { wheel: { pivot: [0, 0, 0], spring: -1, gravity: false } },
      ignore: [["wheel", "cock"]], // 輪軸插在軸承座的孔裡(孔沒畫出來)
      expect: [
        { at: 2 * SWING, part: "wheel", label: "擺輪擺一次,輪前進半個齒", quote: "輪上的叉瓦 a、b、c 交替地停靠於圓筒的內側與外側" },
        { at: 4 * SWING, part: "wheel", label: "擺輪來回一次,輪前進一個齒" },
        { part: "wheel", label: "擺輪來回兩次,輪前進兩個齒" },
      ],
    },
    driver: { part: "cylinder", type: "rotation", cycle: [-SWING, SWING] },
    target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
    view,
    pose(v) {
      return { parts: { cylinder: { angle: balanceAngle(v) }, wheel: { angle: escapement.angle(v) } }, readouts: [] };
    },
  };
}
