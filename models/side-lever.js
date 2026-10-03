// 船舶側槓桿引擎(第 332、336 種)共用:下方的側槓桿繞左端的樞軸 A 擺動,側桿從槓桿右端往上接到活塞桿頂的十字頭 E;
// 十字頭由平行運動機構導引,沿直線上下:半徑桿從固定樞軸 C 伸出,末端 F 與十字頭 E 之間是短連桿,
// 平行桿 D–E 與 C–F 構成平行四邊形(兩組對邊等長、平行)。汽缸在十字頭下方,蒸汽推動活塞。
// 主動件是虛擬的「進程」(蒸汽推動);側槓桿隨活塞往復擺動。
import { TAU } from "./kit.js";
import { circleCircle } from "./linkage.js";

/**
 * A:側槓桿樞軸;lever:槓桿長;rod:側桿長;x:十字頭所在的直線;C:半徑桿的固定樞軸;radius:半徑桿長;
 * drop:十字頭 E 到半徑桿末端 F 的距離;swing:側槓桿擺幅(單邊)。
 */
export function sideLever({ A, lever, rod, x, C, radius, drop, swing, tilt = 0 }) {
  return (p) => {
    const psi = tilt + swing * Math.sin(TAU * p);
    const S = [A[0] + lever * Math.cos(psi), A[1] + lever * Math.sin(psi), 0];
    const E = [x, S[1] + Math.sqrt(rod * rod - (x - S[0]) ** 2), 0];
    const F = circleCircle(C, radius, E, drop, -1).point; // F 在十字頭 E 的下方
    const D = [C[0] + E[0] - F[0], C[1] + E[1] - F[1], 0];
    const next = tilt + swing * Math.sin(TAU * (p + 1e-4));
    return { psi, S, E, F, D, downward: next < psi };
  };
}
