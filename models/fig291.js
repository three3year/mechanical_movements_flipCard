// 第 291 種:Arnold 的天文台計時器擒縱(自由式擒縱)。彈簧 A 的右端 b 鎖在錶板上,下側有小擋止 d,擒縱輪 B 的齒
// 依序抵在 d 上;A 上方的凸柱 i 握著一根更細的彈簧,穿過 A 左端的鉤 k 下方。擺輪軸上有小凸柱 a:
// 擺輪往箭頭方向(順時針)擺時,a 把細彈簧往下壓過去(A 不動);擺回來時,a 把細彈簧連同 A 與擋止 d 一起抬起,
// 放走擒縱輪的一齒;同時另一齒撞擊擺輪滾子上凹槽 g 的側邊,補回擺輪損失的力;A 落回,擋止 d 抓住下一齒。
// 擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪(累計擺動);目標件是擒縱輪 B(擒縱讓輪系一齒一齒地放行)。
// 機構與接觸的算法見 detent-escapement.js(與第 313 種共用)。
import { detentEscapement } from "./detent-escapement.js";

export { N, PITCH, SWING, balanceAngle, chronometer, escapement } from "./detent-escapement.js";

export default detentEscapement({
  figure: 291,
  ids: { wheel: "wheelB", detent: "detentA", spring: "spring" },
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
