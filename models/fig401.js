// 第 401 種:E. P. Brownell 的專利曲柄運動,用來消除死點。飛輪上有一個開槽滑塊 A,曲柄手腕裝在滑塊上;踏板經連桿拉手腕。
// 踩踏板時,壓力讓滑塊 A 連同手腕一起沿槽往前移,直到手腕越過中心點(死點);之後彈簧 B 把滑塊推回擋止處,
// 直到下一次需要往前移為止。所以連桿永遠不會停在與曲柄成一直線的位置。主動件是飛輪(原圖箭頭方向)。
// 推斷:滑塊沿槽滑動的距離與時機(在手腕接近頂部死點時滑出、越過後彈回);踏板與連桿的尺寸。
import { TAU, deg, smooth, clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

const R = 0.45; // 手腕在擋止處時離軸心的距離
const SLIDE = 0.3; // 滑塊可以往前移的距離
const PEDAL = { pivot: [3.0, -3.0, 0], length: 2.6 };
const ROD = 3.0;

/** 飛輪轉 theta(逆時針)→ 手腕離軸心的距離(滑塊的位置)與位置 */
export function wrist(theta) {
  // 手腕的角(從 +y 量起,逆時針):頂部死點在 0
  const a = (((theta + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  // 接近死點前 40° 起滑出,越過死點後 30° 內彈回
  const out = a < 0 ? smooth((a + deg(40)) / deg(30)) : 1 - smooth(a / deg(30));
  const r = R + SLIDE * clamp(out, 0, 1);
  return { r, pos: [-r * Math.sin(theta), r * Math.cos(theta), 0] };
}

/** 手腕位置 → 踏板的角度(連桿長度不變) */
export function pedal(theta) {
  const w = wrist(theta).pos;
  const end = circleCircle(PEDAL.pivot, PEDAL.length, w, ROD, -1).point;
  return { end, angle: Math.atan2(end[1] - PEDAL.pivot[1], end[0] - PEDAL.pivot[0]) };
}

export default {
  figure: 401,
  parts: [
    {
      id: "flywheel",
      kind: "group",
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.6), [circle(1.35).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(circle(1.35)), thickness: 0.06, at: [0, 0, -0.12] },
        { kind: "plate", shape: shape(rect(1.2, 0.3, 0, R + SLIDE / 2), [rect(0.9, 0.12, 0, R + SLIDE / 2).reverse()]), thickness: 0.1, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.12, length: 0.4 },
      ],
    },
    { id: "slider", kind: "box", size: [0.4, 0.22, 0.12], label: "A", labelOffset: [-0.35, 0.2, 0.3] },
    { id: "springB", kind: "spring", coils: 5, radius: 0.06, wire: 0.015, label: "B", labelOffset: [0.25, -0.2, 0.3] },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "treadle", kind: "group", center: PEDAL.pivot, arrow: false, pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [-PEDAL.length - 0.3, 0]], 0.1)), thickness: 0.08 }, { kind: "cylinder", radius: 0.08, length: 0.3 }] },
  ],
  driver: { part: "flywheel", type: "rotation" },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const w = wrist(theta);
    const p = pedal(theta);
    const up = [-Math.sin(theta), Math.cos(theta), 0];
    return {
      parts: {
        flywheel: { angle: theta },
        slider: { position: [w.pos[0], w.pos[1], 0.15], angle: theta },
        springB: { from: [up[0] * 0.12, up[1] * 0.12, 0.15], to: [w.pos[0] - up[0] * 0.12, w.pos[1] - up[1] * 0.12, 0.15] },
        rod: { from: [w.pos[0], w.pos[1], 0.25], to: [p.end[0], p.end[1], 0.25] },
        treadle: { angle: p.angle + Math.PI },
      },
      readouts: [],
    };
  },
};
