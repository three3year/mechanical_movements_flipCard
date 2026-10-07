// 第 291 種:Arnold 的天文台計時器擒縱(自由式擒縱)。彈簧 A 的右端 b 鎖在錶板上,下側有小擋止 d,擒縱輪 B 的齒
// 依序抵在 d 上;A 上方的凸柱 i 握著一根更細的彈簧,穿過 A 左端的鉤 k 下方。擺輪軸上有小凸柱 a:
// 擺輪往箭頭方向(順時針)擺時,a 把細彈簧往下壓過去(A 不動);擺回來時,a 把細彈簧連同 A 與擋止 d 一起抬起,
// 放走擒縱輪的一齒;同時另一齒撞擊擺輪滾子上凹槽 g 的側邊,補回擺輪損失的力;A 落回,擋止 d 抓住下一齒。
// 擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪(累計擺動);目標件是擒縱輪 B(擒縱讓輪系一齒一齒地放行)。
// 機構與接觸的算法見 detent-escapement.js(與第 313 種共用)。
// 立體化:A 在擒縱輪後面一層,擋止 d 往前伸到輪那一層;細彈簧與凸柱在輪前面一層;滾子與輪同一層。
// 推斷:擺幅、齒數(依原圖約十五齒)、凹槽的形狀與位置、A 被抬起的量;擺輪本身沒畫(原圖只畫滾子),
// 軸都裝在後面的夾板條上(原圖沒畫)。
import { deg } from "./kit.js";
import { detentMechanism, detentModel } from "./detent-escapement.js";
import { shape, rect, circle } from "./shapes.js";
import { plateBar } from "./supports.js";

const W = [-0.63, -0.13]; // 擒縱輪心
const B = [2.6, 1.45]; // 彈簧 A 的固定端 b(樞軸)
const BAL = [-1.38, 1.56]; // 擺輪軸
const I = [0.6, 1.56]; // 細彈簧的固定點(凸柱 i 上)
const PIN = { r: 0.32, size: 0.07 }; // 凸柱 a:離擺輪軸的距離、半徑
// A(相對 b):往左的細長條,擋止 d 往下伸到齒尖圓內 0.04;左端的鉤 k 蓋在細彈簧上方
const BAR = rect(3.28, 0.08, -1.64, 0);
const STOP_D = rect(0.08, 0.27, -2.906, -0.175); // d:x = −0.31(輪的 76° 方位),下緣 y = 1.14
const HOOK = [rect(0.08, 0.24, -3.32 + 0.04, 0.08), rect(0.08, 0.075, -3.32 + 0.04, 0.1625)];
const SPRING = rect(1.58, 0.03, -0.86, 0); // 細彈簧(相對 i):往左伸過鉤 k 到尖端;右端貼著凸柱 i 的左面(鉸在 i 上)

const mech = detentMechanism({
  teeth: 15,
  swing: deg(120),
  // 齒:順時針轉,前面(角度小的一側)往前傾,齒尖細
  wheel: { at: W, profile: [[1.0, 0.35], [1.35, 0.05], [1.35, 0.1], [1.0, 0.9]] },
  // 衝擊滾子:半徑 0.549(伸進齒尖圓 0.05),凹槽 g 在擺輪居中時的方位
  balance: { at: BAL, roller: 0.549, notch: { at: deg(-103), width: deg(26), depth: 0.2 }, pin: PIN },
  detent: { pivot: B, bar: [BAR], stop: STOP_D, hook: HOOK },
  spring: { at: I, shape: SPRING },
});

export const { N, PITCH, SWING, balanceAngle, chronometer, escapement } = mech;

const local = (p, origin) => p.map(([x, y]) => [x - origin[0], y - origin[1]]);

export default detentModel(mech, {
  figure: 291,
  ids: { wheel: "wheelB", detent: "detentA", spring: "spring" },
  pieces: {
    wheel: [
      { kind: "plate", shape: { outline: mech.wheel.outline, holes: mech.wheel.holes }, thickness: 0.12 },
      { kind: "cylinder", radius: 0.14, length: 0.2 },
      { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
      { kind: "cylinder", radius: 0.06, length: 0.16, at: [0.6, 0, 0.04], accent: true },
    ],
    balance: [
      { kind: "plate", shape: shape(mech.roller, [circle(0.06).reverse()]), thickness: 0.12 }, // 衝擊滾子與凹槽
      { kind: "plate", shape: shape(rect(PIN.r + 0.1, 0.1, (PIN.r + 0.1) / 2, 0)), thickness: 0.06, at: [0, 0, 0.27] }, // 托著凸柱的小臂
      { kind: "cylinder", radius: PIN.size, length: 0.2, at: [PIN.r, 0, 0.17], accent: true }, // 凸柱
      { kind: "cylinder", radius: 0.06, length: 1.05, at: [0, 0, -0.13] }, // 擺輪軸,往後伸進夾板條
    ],
    detent: [
      { kind: "plate", shape: shape(BAR), thickness: 0.08, at: [0, 0, -0.15] },
      { kind: "plate", shape: shape(STOP_D), thickness: 0.26, at: [0, 0, -0.06] }, // 擋止(鎖石),往前伸到輪那一層
      { kind: "plate", shape: shape(HOOK[0]), thickness: 0.08, at: [0, 0, -0.15] },
      { kind: "plate", shape: shape(HOOK[1]), thickness: 0.4, at: [0, 0, 0.01] }, // 鉤,往前蓋在細彈簧外側
      { kind: "plate", shape: shape(local(rect(0.1, 0.16, I[0], I[1] - 0.07), B)), thickness: 0.38, at: [0, 0, 0] }, // 細彈簧的固定座
    ],
    spring: [{ kind: "plate", shape: shape(SPRING), thickness: 0.06, at: [0, 0, 0.15] }],
    foot: [{ kind: "box", size: [0.34, 0.34, 0.5], at: [B[0] + 0.2, B[1], -0.15] }, { kind: "cylinder", radius: 0.05, length: 0.08, at: [B[0] - 0.45, B[1] - 0.085, -0.15] }],
    plate: plateBar({ points: [W, BAL, B], z: -0.5, width: 0.22, boss: 0.15 }),
  },
  labels: [
    { text: "B", at: [-0.63, -0.13], offset: [0, -0.35] },
    { text: "A", at: [1.3, 1.45], offset: [0, -0.3] },
    { text: "g", at: [-1.38, 1.56], offset: [0.25, -0.75] },
    { text: "b", at: [2.6, 1.45], offset: [0.3, 0.3] },
    { text: "k", at: [-0.72, 1.62], offset: [0.05, 0.25] },
    { text: "d", at: [-0.31, 1.2], offset: [0.25, -0.1] },
    { text: "i", at: [0.6, 1.56], offset: [0, 0.25] },
    { text: "a", at: [-1.38, 1.56], offset: [-0.25, 0.55] },
  ],
  texts: {
    pass: { label: "往箭頭方向擺:凸柱 a 壓過細彈簧,A 不動、輪不動", quote: "該凸柱在通過時會將彈簧下壓" },
    release: { label: "擺回來:抬起 A 與 d,放走一齒", quote: "在返回時會將彈簧、A 和擋止 d 一起抬起,因此允許擒縱輪的一齒通過" },
  },
  view: { direction: [0.03, 0.04, 1] },
});
