// 第 401 種:E. P. Brownell 的專利曲柄運動,用來消除死點。飛輪上有一個開槽滑塊 A,曲柄的腕銷裝在滑塊上;踏板經連桿接腕銷。
// 踩踏板時,壓力讓滑塊 A 連同腕銷一起沿槽往前移,直到腕銷越過中心點(死點);之後彈簧 B 把滑塊推回擋止處,
// 直到下一次需要往前移為止。所以連桿永遠不會停在與曲柄成一直線的位置。主動件是飛輪(原圖箭頭方向,逆時針)。
//
// 2026-10-20 複查(model-audit-fixes-4 票 04;#401-1、#401-2、#401-3):
// - 照原圖,連桿幾乎垂直往下接到地上的踏板(原本取了兩圓交點的另一解,連桿幾乎水平、踏板直立,死點跑到 9 點、3 點鐘)。
//   死點在頂部與底部。踏板水平躺在地上:原圖踏板上有兩個圓——左端接連桿、中段一個,右端尖。
//   讀成中段那個是固定在地上的樞軸(推斷)、右端的尖是腳踩的踏板:踩下時左端的連桿往上推腕銷,
//   所以踏板的壓力要推過的是底部死點——滑塊的進度表放在底部(接近底部死點前 40° 起被推著往前,到前 10° 推到頭,
//   越過後彈簧在 25° 內把它推回擋止)。
// - 原文「slotted slide, A」:長孔開在滑塊 A 上(原圖 A 板上兩道橫的長孔),滑在輪面的兩根柱上(推斷,柱頭擋住滑塊不掉);
//   原本做成固定在輪上的開槽導板,而且懸在輻板前面 0.09。擋止就是長孔的端:滑塊在擋止處時柱靠著孔的一端。
// - 彈簧 B 照原圖是繞在輪轂上兩圈的渦卷彈簧,內端在輪轂上、外端彎上去接滑塊(原本畫成沿槽的壓縮彈簧,推到頭時比實心還短)。
//   滑塊往前移時外端被帶著走、彈簧繞緊(長度不變:每個姿勢解一個鼓起量讓弧長守恆,再等弧長取點)。
// - 原文的輸入是踏板,但踏板不能當主動件:越過死點後彈簧把滑塊推回,連桿把踏板往回拉,踏板一程裡不是單調的。
//   所以仍以飛輪(等速轉、軸固定在機架上)當主動件;滑塊 A 是這個專利的重點,標成目標件。
//   飛輪的軸往後伸進軸承座、踏板樞軸的托架與地板(推斷)。
import { TAU, deg, smooth, clamp, signedAngle, wrap, rot2 } from "./kit.js";
import { falling } from "./jumps.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, rect, stadium, arcPoints, zCylinder, spanBox } from "./shapes.js";
import { pedestal } from "./supports.js";

export const R = 0.5; // 槽的中心線離軸心的距離(腕銷在擋止處時離軸心 R;槽沿切線)
export const SLIDE = 0.3; // 滑塊可以往前移的距離
const SLIDE_LEN = 1.3;
const SLIDE_H = 0.26;
const SLIDE_Z = -0.04; // 滑塊板的中面(貼在輻板正面上滑)
export const STUD_R = 0.05;
/** 輪面上的兩根柱(推斷,飛輪局部座標):滑塊的長孔套在柱上滑 */
export const STUDS = [
  [0.25, R],
  [-0.55, R],
];
/** 滑塊 A 的板(滑塊局部座標,腕銷在原點):兩道橫的長孔;s = 0 時柱靠著孔的一端(擋止),推到頭時靠著另一端 */
export const SLIDE_SHAPE = shape(
  rect(SLIDE_LEN, SLIDE_H),
  STUDS.map(([x]) => stadium(SLIDE, 2 * STUD_R + 0.01).outline.map(([px, py]) => [px + x, py]).reverse())
);
const FLOOR = -3.2;
// 踏板:中段的樞軸固定在地上(推斷),左端接連桿(離樞軸 arm),右端是腳踩的尖端(離樞軸 foot)
const PEDAL = { pivot: [0.9, -3.0, 0.09], arm: 1.2, foot: 1.6 };
export const ROD = 3.0;
const ROD_Z = 0.22;
const BACK = deg(25); // 越過死點後,彈簧在這段轉角內把滑塊推回擋止

/** 底部死點:腕銷在擋止處、連桿與曲柄共線(踏板的連桿端在離軸心 ROD + R 處)時飛輪的轉角 */
export const DEAD = (() => {
  const end = circleCircle([0, 0, 0], ROD + R, PEDAL.pivot, PEDAL.arm, -1).point;
  return wrap(Math.atan2(end[1], end[0]) - Math.PI / 2);
})();

/** 飛輪轉 theta(逆時針)→ 滑塊往前移了多少(0 在擋止處)與腕銷位置 */
export function wrist(theta) {
  // 離底部死點的角(逆時針為正)
  const a = signedAngle(theta - DEAD);
  // 接近死點前 40° 起被踏板的壓力推著往前,到死點前 10° 推到頭;越過死點後被彈簧加速推回,撞上擋止
  const out = a < 0 ? smooth(clamp((a + deg(40)) / deg(30), 0, 1)) : 1 - falling(a / BACK);
  const s = SLIDE * clamp(out, 0, 1);
  // 局部:腕銷在 (−s, R)(往前 = 逆時針 = 頂部時的 −x)
  const local = [-s, R];
  const [x, y] = rot2(local, theta);
  return { s, local, pos: [x, y, 0] };
}

/** 腕銷位置 → 踏板:連桿端 end、腳踩的尖端 foot、踏板的角度(連桿長度不變) */
export function pedal(theta) {
  const w = wrist(theta).pos;
  const end = circleCircle(PEDAL.pivot, PEDAL.arm, w, ROD, 1).point;
  const angle = Math.atan2(end[1] - PEDAL.pivot[1], end[0] - PEDAL.pivot[0]) + Math.PI; // 連桿端在踏板局部的 −x
  const foot = [PEDAL.pivot[0] + PEDAL.foot * Math.cos(angle), PEDAL.pivot[1] + PEDAL.foot * Math.sin(angle), PEDAL.pivot[2]];
  return { end, angle, foot };
}

// 渦卷彈簧 B:內端在輪轂的正下方(飛輪局部),順時針往外繞 SPRING.turns 圈到滑塊下緣的外端。
// 外端接在滑塊下緣、腕銷的右下方(偏離原圖:原圖的外端彎上去接在腕銷左邊;接在左邊的話滑塊往前移時外端離軸心越來越遠,
// 彈簧要拉長一大截,接在右邊則外端繞著軸心掃過去、半徑幾乎不變,弧長守恆解得出來)
const HUB_R = 0.12;
export const SPRING_WIRE = 0.02;
const SPRING = { r0: HUB_R + SPRING_WIRE + 0.005, turns: 2, a0: -Math.PI / 2, samples: 400, segments: 80 };
const SPRING_ATTACH = [0.12, -SLIDE_H / 2 - SPRING_WIRE - 0.005]; // 外端(滑塊局部):滑塊下緣、腕銷的右邊
/** 彈簧外端(世界座標) */
export function springEnd(theta) {
  const w = wrist(theta);
  const [x, y] = rot2([w.local[0] + SPRING_ATTACH[0], w.local[1] + SPRING_ATTACH[1]], theta);
  return [x, y, SLIDE_Z];
}
const polyLength = (pts) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
// 以極座標畫的螺線(飛輪局部):半徑從 r0 線性增到外端,bulge 讓中段鼓出或收進,改變弧長而不動兩端
function spiral(s, bulge) {
  const end = [SPRING_ATTACH[0] - s, R + SPRING_ATTACH[1]];
  const r1 = Math.hypot(end[0], end[1]);
  const sweep = SPRING.turns * TAU + wrap(SPRING.a0 - Math.atan2(end[1], end[0]));
  return Array.from({ length: SPRING.samples + 1 }, (_, i) => {
    const t = i / SPRING.samples;
    const r = SPRING.r0 + (r1 - SPRING.r0) * t + bulge * t * (1 - t);
    const a = SPRING.a0 - sweep * t;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}
const SPRING_LENGTH = polyLength(spiral(0, 0)); // 彈簧的弧長(滑塊在擋止處時的形狀)
/** 彈簧的折線(世界座標):弧長守恆,等弧長取點 */
export function spring(theta) {
  const { s } = wrist(theta);
  let [lo, hi] = [-0.5, 0.5];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (polyLength(spiral(s, mid)) < SPRING_LENGTH) lo = mid;
    else hi = mid;
  }
  const dense = spiral(s, (lo + hi) / 2);
  const step = SPRING_LENGTH / SPRING.segments;
  const out = [dense[0]];
  let walked = 0;
  let next = step;
  for (let i = 1; i < dense.length && out.length < SPRING.segments; i++) {
    const seg = Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
    while (walked + seg >= next && out.length < SPRING.segments) {
      const t = (next - walked) / seg;
      out.push([dense[i - 1][0] + (dense[i][0] - dense[i - 1][0]) * t, dense[i - 1][1] + (dense[i][1] - dense[i - 1][1]) * t]);
      next += step;
    }
    walked += seg;
  }
  out.push(dense.at(-1));
  return out.map((p) => {
    const [x, y] = rot2(p, theta);
    return [x, y, SLIDE_Z];
  });
}

// 踏板的板:左端圓頭接連桿,右端收尖(原圖)
const TREADLE = [
  ...arcPoints(0.08, Math.PI / 2, (3 * Math.PI) / 2, -PEDAL.arm, 0),
  [PEDAL.foot - 0.7, -0.08],
  [PEDAL.foot, -0.02],
  [PEDAL.foot, 0.02],
  [PEDAL.foot - 0.7, 0.08],
];

export default {
  figure: 401,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.5, bore: 0.12, floor: FLOOR }),
        // 地板與踏板樞軸的托架、樞軸銷(推斷)
        spanBox(-0.5, 2.9, FLOOR - 0.18, FLOOR, -0.8, -0.2),
        spanBox(PEDAL.pivot[0] - 0.08, PEDAL.pivot[0] + 0.08, FLOOR - 0.05, PEDAL.pivot[1] + 0.08, -0.35, -0.2),
        zCylinder(-0.3, PEDAL.pivot[2] + 0.1, 0.04, PEDAL.pivot),
      ],
    },
    {
      id: "flywheel",
      kind: "group",
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.6), [circle(1.35).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(circle(1.35)), thickness: 0.06, at: [0, 0, -0.12] },
        { kind: "cylinder", radius: HUB_R, length: 0.7, at: [0, 0, -0.2] },
        // 輪面上的兩根柱(推斷):從輻板立起、穿過滑塊的長孔,柱頭擋住滑塊
        ...STUDS.flatMap(([x, y]) => [zCylinder(-0.13, SLIDE_Z + 0.07, STUD_R, [x, y]), zCylinder(SLIDE_Z + 0.055, SLIDE_Z + 0.105, 0.1, [x, y])]),
      ],
    },
    // 開槽滑塊 A 與它上面的腕銷(連桿套在腕銷上)
    {
      id: "slider",
      kind: "group",
      arrow: false,
      label: "A",
      labelOffset: [-0.35, 0.25, 0.3],
      pieces: [{ kind: "plate", shape: SLIDE_SHAPE, thickness: 0.1 }, zCylinder(0, 0.34, 0.04)],
    },
    { id: "springB", kind: "rod", radius: SPRING_WIRE, label: "B", labelOffset: [0.3, -0.35, 0.3] },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    {
      id: "treadle",
      kind: "group",
      center: PEDAL.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(TREADLE, [circle(0.045).reverse()]), thickness: 0.08 },
        { kind: "cylinder", radius: 0.09, inner: 0.045, length: 0.2 },
        zCylinder(-0.04, 0.2, 0.04, [-PEDAL.arm, 0]), // 連桿的銷
      ],
    },
  ],
  driver: { part: "flywheel", type: "rotation" },
  target: "slider", // 開槽滑塊 A:帶著腕銷沿槽移過死點,是這個專利的重點(踏板是原文的輸入)
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const w = wrist(theta);
    const p = pedal(theta);
    return {
      parts: {
        flywheel: { angle: theta },
        slider: { position: [w.pos[0], w.pos[1], SLIDE_Z], angle: theta },
        rod: { from: [w.pos[0], w.pos[1], ROD_Z], to: [p.end[0], p.end[1], ROD_Z] },
        treadle: { angle: p.angle },
      },
      paths: { springB: { points: spring(theta), closed: false } },
      readouts: [],
    };
  },
};
