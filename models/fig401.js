// 第 401 種:E. P. Brownell 的專利曲柄運動,用來消除死點。飛輪上有一個開槽滑塊 A,曲柄手腕裝在滑塊上;踏板經連桿拉手腕。
// 踩踏板時,壓力讓滑塊 A 連同手腕一起沿槽往前移,直到手腕越過中心點(死點);之後彈簧 B 把滑塊推回擋止處,
// 直到下一次需要往前移為止。所以連桿永遠不會停在與曲柄成一直線的位置。主動件是飛輪(原圖箭頭方向,逆時針)。
// 推斷:滑塊沿槽滑動的距離與時機(在手腕接近頂部死點時往前移、越過後彈回);踏板與連桿的尺寸。
//
// 2026-10-07 複查:
// - 原圖的開槽滑塊是一塊橫在輪轂上方的板,兩個長孔都是橫的(沿切線),手腕在板的中間;原本的模型卻讓滑塊沿半徑往外移,
//   和橫的槽對不上。改成滑塊沿槽(切線方向)往前(轉動的方向)移,手腕因此比曲柄先越過死點。
// - 彈簧 B 是一根壓縮彈簧,一端頂在槽前端的耳上、一端頂著滑塊;越過死點後把滑塊加速推回、撞上槽後端的擋止為止(原本是平順地回去)。
//   原圖的 B 畫在輪轂旁,看不出是哪一種彈簧,這裡畫成沿槽的壓縮彈簧(推斷)。
// - 原文的輸入是踏板,但踏板不能像第 374 種那樣當主動件(主動量取轉動件的相位):手腕越過死點後彈簧把滑塊推回,
//   連桿把踏板往回拉約 2.4°(飛輪轉 8°–25° 之間),踏板一程裡不是單調的,同一個踏板角對應三個飛輪位置。
//   所以仍以飛輪(等速轉、軸固定在機架上)當主動件;滑塊 A 是這個專利的重點,標成目標件。
//   飛輪的軸往後伸進軸承座(推斷)。
import { TAU, deg, smooth, clamp } from "./kit.js";
import { falling } from "./jumps.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, rect, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = 0.6; // 手腕離軸心的距離(槽在這個半徑上,沿切線)
const SLIDE = 0.3; // 滑塊可以往前移的距離
const SLIDER = 0.4; // 滑塊沿槽的長度
const PEDAL = { pivot: [3.0, -3.0, 0.21], length: 2.6 }; // 踏板與連桿同一層(連桿在飛輪前面)
const ROD = 3.0;
const BACK = deg(25); // 越過死點後,彈簧在這段轉角內把滑塊推回擋止

/** 飛輪轉 theta(逆時針)→ 滑塊往前移了多少(0 在擋止處)與手腕位置 */
export function wrist(theta) {
  // 手腕的角(從 +y 量起,逆時針):頂部死點在 0
  const a = (((theta + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  // 接近死點前 40° 起被踏板的壓力推著往前,到死點前 10° 推到頭;越過死點後被彈簧加速推回,撞上擋止
  const out = a < 0 ? smooth(clamp((a + deg(40)) / deg(30), 0, 1)) : 1 - falling(a / BACK);
  const s = SLIDE * clamp(out, 0, 1);
  // 局部:手腕在 (−s, R)(往前 = 逆時針 = 頂部時的 −x)
  const local = [-s, R];
  const [c, sn] = [Math.cos(theta), Math.sin(theta)];
  return { s, local, pos: [local[0] * c - local[1] * sn, local[0] * sn + local[1] * c, 0] };
}

/** 手腕位置 → 踏板的角度(連桿長度不變) */
export function pedal(theta) {
  const w = wrist(theta).pos;
  const end = circleCircle(PEDAL.pivot, PEDAL.length, w, ROD, -1).point;
  return { end, angle: Math.atan2(end[1] - PEDAL.pivot[1], end[0] - PEDAL.pivot[0]) };
}

const toWorld = (local, theta, z) => [local[0] * Math.cos(theta) - local[1] * Math.sin(theta), local[0] * Math.sin(theta) + local[1] * Math.cos(theta), z];

export default {
  figure: 401,
  parts: [
    { id: "frame", kind: "group", pieces: pedestal({ at: [0, 0], z: -0.5, bore: 0.12, floor: -2.0 }) },
    {
      id: "flywheel",
      kind: "group",
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.6), [circle(1.35).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(circle(1.35)), thickness: 0.06, at: [0, 0, -0.12] },
        // 開槽的導板:兩條沿切線的長孔,滑塊夾在導板上滑;槽後端是擋止,前端是頂彈簧的耳
        { kind: "plate", shape: shape(rect(1.3, 0.3, -0.05, R), [rect(0.95, 0.12, -0.05, R).reverse()]), thickness: 0.1, at: [0, 0, 0.05] },
        { kind: "box", size: [0.08, 0.22, 0.16], at: [SLIDER / 2 + 0.04, R, 0.17] }, // 擋止
        { kind: "box", size: [0.08, 0.22, 0.16], at: [-0.66, R, 0.17] }, // 頂彈簧的耳
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.2] },
      ],
    },
    // 滑塊 A 與它上面的手腕(連桿套在手腕上)
    { id: "slider", kind: "group", arrow: false, label: "A", labelOffset: [-0.35, 0.2, 0.3], pieces: [{ kind: "box", size: [SLIDER, 0.22, 0.12] }, { kind: "cylinder", radius: 0.04, length: 0.2, at: [0, 0, 0.1] }] },
    { id: "springB", kind: "spring", coils: 5, radius: 0.06, wire: 0.015, label: "B", labelOffset: [0.25, -0.2, 0.3] },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "pedalPost", kind: "cylinder", center: PEDAL.pivot, radius: 0.04, length: 0.5 }, // 踏板的固定樞軸(推斷)
    { id: "treadle", kind: "group", center: PEDAL.pivot, arrow: false, pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [-PEDAL.length - 0.3, 0]], 0.1)), thickness: 0.08 }, { kind: "cylinder", radius: 0.08, length: 0.3 }] },
  ],
  driver: { part: "flywheel", type: "rotation" },
  target: "slider", // 開槽滑塊 A:帶著手腕沿槽移過死點,是這個專利的重點(踏板是原文的輸入)
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const w = wrist(theta);
    const p = pedal(theta);
    return {
      parts: {
        flywheel: { angle: theta },
        slider: { position: [w.pos[0], w.pos[1], 0.17], angle: theta },
        springB: { from: toWorld([-0.62, R], theta, 0.17), to: toWorld([w.local[0] - SLIDER / 2, R], theta, 0.17) },
        rod: { from: [w.pos[0], w.pos[1], 0.25], to: [p.end[0], p.end[1], 0.25] },
        treadle: { angle: p.angle + Math.PI },
      },
      readouts: [],
    };
  },
};
