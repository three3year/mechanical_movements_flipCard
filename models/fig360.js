// 第 360 種:由擺動運動得到連續旋轉。樑在 A 形架頂上擺動,兩端是弧形頭;右端弧形頭的繩往下繞在鼓輪上,
// 鼓輪鬆套在飛輪軸上,鼓輪上的棘爪推著固定在軸上的棘輪。樑往一邊擺時繩拉著鼓輪轉,棘爪帶動棘輪與飛輪;
// 往回擺時鼓輪反轉,棘爪滑過棘輪,飛輪不受影響(繼續往前)。左端弧形頭的繩吊著一個球形配重,讓繩保持拉緊。
// 主動件是樑(累計擺動)。
// 推斷:鼓輪反轉時由繩把它帶回(繩在鼓輪上纏繞);棘輪齒數。棘輪固定在軸上、裝在鼓輪前面,
// 棘爪的銷立在鼓輪的前面上(右上方),棘爪靠自重垂下、爪尖落在齒根:鼓輪往前轉時爪尖頂著齒的直面推棘輪,
// 往回轉時爪尖沿齒背滑上去、過了齒尖落進下一格(棘爪的轉角由接觸算,contact.swingUntilContact)。
// 「連續旋轉」:飛輪不跟著鼓輪停下——鼓輪往回轉時飛輪憑動量繼續轉、越轉越慢(速度按指數衰減)。
// 回程裡飛輪滑行不到一齒,所以下一程棘爪碰上的是它面前的第一個齒面(往回轉時爪滑過的那幾齒之後),
// 碰上之後推到這一程的終點。鼓輪每程轉過的角度剛好是 3 齒(鼓輪半徑依此選定),每圈飛輪前進 3 齒,
// 棘爪每一程都在同一個相位碰上齒面;碰上的時刻由「飛輪滑到的位置 = 鼓輪轉到的位置」算出。
import { deg, swingPhase, rot2, TAU } from "./kit.js";
import { ratchetShape, shape, circle, arcPoints, thickLine } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, fallingRest } from "./contact.js";
import { solve } from "./linkage.js";

const PIVOT = [-0.6, 2.3, 0];
const ARC = 1.9; // 樑端弧形頭的半徑(以樞軸為圓心)
export const SWING = deg(14);
const RATCHET_TEETH = 12;
const STROKE_TEETH = 3; // 鼓輪每程轉過的齒數
const DRUM = { center: [1.3, -0.35, 0], r: (2 * SWING * ARC) / ((STROKE_TEETH * TAU) / RATCHET_TEETH) };
const RATCHET = { teeth: RATCHET_TEETH, outer: 0.5, inner: 0.34, dir: -1 };
const Z = { ratchet: 0.45, pawl: 0.45 }; // 棘輪與棘爪在鼓輪前面
// 棘爪的銷在鼓輪前面上,爪尖在銷的順時針方向 25° 處(爪短、銷在爪尖推的那條線的外側):齒面推回爪尖時,
// 反力讓爪往齒根轉(自鎖),不會被擠出來。銷的位置選在推動的那一段(鼓輪轉過 45°–90°)時位於棘輪頂上,
// 爪靠自重往下、壓向棘輪。
const PIVOT_R = 0.57;
const LEAD = deg(25);
const PIVOT_AT = deg(157); // 銷在鼓輪上的角(鼓輪轉角 0 時)
const TIP_R = RATCHET.inner + 0.04; // 爪尖貼在(外擴過的)齒根圓上
export const PAWL = (() => {
  const pivot = [PIVOT_R * Math.cos(PIVOT_AT), PIVOT_R * Math.sin(PIVOT_AT)];
  const tip = [TIP_R * Math.cos(PIVOT_AT - LEAD), TIP_R * Math.sin(PIVOT_AT - LEAD)];
  return { pivot, length: Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]), hang: Math.atan2(tip[1] - pivot[1], tip[0] - pivot[0]) + deg(25) };
})();

const SPAN = (2 * SWING * ARC) / DRUM.r; // 鼓輪每程的轉角
// 飛輪滑行時速度按 e^(−COAST·t/T) 衰減(T 是一程的時間);衰減率取得夠大,回程裡滑行不到一齒
const COAST = 3.5;
const coasted = (t) => (SPAN * (1 - Math.exp(-COAST * t))) / COAST; // 推完後滑行 t 程的時間走過的量
// 下一程從起點走到 CATCH(比例)時,鼓輪追上滑行中的飛輪:coasted(1 + f) = SPAN·f
const CATCH = solve((f) => coasted(1 + f) - SPAN * f, 0, 0, 1);
// 棘爪的轉角:從抬起的角度順時針往下擺,停在爪的外形第一次碰到棘輪齒形的地方(由接觸算)
const PAWL_OUTLINE = thickLine([[0, 0], [PAWL.length, 0]], 0.08);
function pawlAngle(pivot, from, center, wheel) {
  return swingUntilContact({ pivot, outline: PAWL_OUTLINE, from, into: -1, sweep: 1.6, steps: 80 }, ratchetObstacles(RATCHET, wheel, center));
}

// 推動時棘輪相對鼓輪的角度:爪尖落在齒根、貼著齒的直面(在一個齒距裡找爪尖最深的位置)
const PITCH = TAU / RATCHET_TEETH;
const ENGAGED = (() => {
  let best = { depth: Infinity, rho: 0 };
  for (let i = 0; i <= 400; i++) {
    const rho = (-PITCH * i) / 400;
    const angle = pawlAngle([...PAWL.pivot, 0], PAWL.hang, [0, 0], rho);
    const depth = Math.hypot(PAWL.pivot[0] + PAWL.length * Math.cos(angle), PAWL.pivot[1] + PAWL.length * Math.sin(angle));
    if (depth < best.depth - 1e-9) best = { depth, rho };
  }
  return best.rho + 1e-3; // 往推的方向差一點點:爪尖貼著齒面、不壓進去
})();

/** 累計擺動 v → 樑角、鼓輪轉角、飛輪(棘輪)轉角;engaged:棘爪正推著棘輪 */
export function beam(v) {
  const { at, cycle, forward, f } = swingPhase(v, -SWING, SWING);
  // 樑右端往上擺(at 增加)時,繩從鼓輪左側被拉起,鼓輪順時針轉(負角)
  const pulled = ((at + SWING) * ARC) / DRUM.r;
  // 飛輪往前(順時針)的累計量:棘爪追上之後跟著鼓輪;其餘時間滑行
  let ahead;
  const engaged = forward && f >= CATCH;
  if (engaged) ahead = cycle * SPAN + SPAN * f;
  else {
    const t = forward ? 1 + f : f; // 從上一程推完算起滑行了幾程的時間
    const base = forward ? cycle * SPAN : (cycle + 1) * SPAN;
    ahead = base + coasted(t);
  }
  return { psi: at, drum: -pulled, fly: ENGAGED - ahead, forward, engaged };
}
export const stroke = { SPAN, PITCH, STROKE_TEETH, CATCH, returnCoast: coasted(1) };

const head = (s) => shape([...arcPoints(ARC + 0.12, s > 0 ? deg(-12) : deg(168), s > 0 ? deg(12) : deg(192)), ...arcPoints(ARC - 0.05, s > 0 ? deg(12) : deg(192), s > 0 ? deg(-12) : deg(168))]);

export default {
  figure: 360,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.3, -2.6], [-0.6, 2.3], [1.1, -2.6]], 0.2)), thickness: 0.2, at: [0, 0, -0.5] },
        { kind: "box", size: [4.6, 0.2, 0.8], at: [0, -2.7, -0.3] },
        // 飛輪軸的軸承座:立柱在飛輪的後面,頂上一個軸承環(軸穿過環孔)
        { kind: "box", size: [0.25, DRUM.center[1] - 0.25 + 2.6, 0.3], at: [DRUM.center[0], (DRUM.center[1] - 0.25 - 2.6) / 2, -0.55] },
        { kind: "cylinder", radius: 0.27, inner: 0.13, length: 0.1, at: [DRUM.center[0], DRUM.center[1], -0.45] },
      ],
    },
    {
      id: "beam",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-ARC + 0.05, 0], [ARC - 0.05, 0]], 0.2), [circle(0.08).reverse()]), thickness: 0.15 },
        { kind: "plate", shape: head(1), thickness: 0.15 },
        { kind: "plate", shape: head(-1), thickness: 0.15 },
        ...[1, -1].map((s) => ({ kind: "plate", shape: shape(thickLine([[0, 0.05], [s * (ARC - 0.1), 0.38]], 0.08)), thickness: 0.1 })),
        { kind: "cylinder", radius: 0.16, length: 0.3 },
      ],
    },
    {
      id: "flywheel",
      kind: "group",
      center: [DRUM.center[0], DRUM.center[1], -0.3],
      spin: 2.0,
      pieces: [
        { kind: "plate", shape: shape(circle(2.0), [circle(1.85).reverse()]), thickness: 0.15 },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [3.8, 0.1, 0.08], angle: (i * Math.PI) / 4 })),
        { kind: "box", size: [0.25, 0.25, 0.17], at: [1.92, 0, 0], accent: true }, // 輪緣上的記號
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.1 }), thickness: 0.1, at: [0, 0, Z.ratchet + 0.3] },
        { kind: "cylinder", radius: 0.1, length: 1.3, at: [0, 0, 0.45] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      center: [DRUM.center[0], DRUM.center[1], 0.25],
      spin: DRUM.r,
      pieces: [
        // 鼓輪鬆套在飛輪軸上(軸孔沒有畫出來)
        { kind: "cylinder", radius: DRUM.r, length: 0.25, mark: true },
        { kind: "cylinder", radius: DRUM.r + 0.12, length: 0.05, at: [0, 0, -0.13] },
        { kind: "cylinder", radius: 0.03, length: 0.3, at: [PAWL.pivot[0], PAWL.pivot[1], Z.pawl - 0.25] }, // 棘爪的銷
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [PAWL.length, 0]], 0.08), [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
    { id: "ropeR", kind: "rope" },
    { id: "ropeL", kind: "rope" },
    { id: "ball", kind: "sphere", radius: 0.22 },
  ],
  // 動力重演:只推樑;飛輪靠摩擦定位,由棘爪推動(重演不比快慢,飛輪沒有動量、不會滑行)。
  // 每一程推完時,飛輪的位置和模型一樣:模型裡飛輪先滑行、被追上才推,重演裡沒有滑行、棘爪一開始就推,兩者推完都正好前進一程。
  // 棘爪照模型的姿勢走(它的轉角由爪的外形與齒形的接觸算);做成鉸在鼓輪上的自由零件時,爪身短而薄,
  // 重演的剛體求解在推的時候讓爪尖穿過齒面(加厚爪身、加深齒、加彈簧都試過),所以只放飛輪自由
  replay: {
    to: 2 * SWING,
    seconds: 10,
    free: { flywheel: { hold: true, gravity: false } },
    // 鼓輪鬆套在飛輪軸上、飛輪軸在軸承環裡轉:軸與孔之間不算碰撞(孔沒有畫出來,實物是可以自由轉的軸承)
    ignore: [["drum", "flywheel"], ["frame", "flywheel"]],
    // 只比第一程:之後模型裡的飛輪在回程時繼續滑行(動量),重演的飛輪沒有動量、停在原地,照模型姿勢走的棘爪
    // 就不再對得上重演裡棘輪的齒(下一程的比較沒有意義)
    expect: [{ at: 2 * SWING, part: "flywheel", label: "樑往一邊擺完:棘爪推著棘輪,飛輪前進一程", quote: "連接繩索的鼓輪會透過棘爪與棘輪將運動傳遞給該軸" }],
  },
  driver: { part: "beam", type: "rotation", cycle: [-SWING, SWING] },
  target: "flywheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const b = beam(v);
    // 右端弧形頭的繩:從弧頭最右的切點垂下,繞到鼓輪左側
    const rightTop = [PIVOT[0] + ARC + 0.12, PIVOT[1] + (ARC + 0.12) * b.psi, 0.1]; // 繩的上端繫在樑端的弧形頭上
    const leftTop = [PIVOT[0] - ARC - 0.12, PIVOT[1] - (ARC + 0.12) * b.psi, 0.1];
    const rope = [rightTop, [DRUM.center[0] - DRUM.r, DRUM.center[1] + 0.1, 0.25], [DRUM.center[0] - DRUM.r * 0.7, DRUM.center[1] - DRUM.r * 0.7, 0.25]];
    // 棘爪:銷在鼓輪上,從抬起的位置順時針垂下、停在碰到棘輪的齒面處
    const [px, py] = rot2(PAWL.pivot, b.drum);
    const pivot = [DRUM.center[0] + px, DRUM.center[1] + py, Z.pawl];
    // 爪滑過齒尖後不是瞬間落下:以鼓輪為準的轉角加速落回齒上(約 0.15 秒落 30°)
    const restRel = (u) => {
      const bu = beam(u);
      const [qx, qy] = rot2(PAWL.pivot, bu.drum);
      return pawlAngle([DRUM.center[0] + qx, DRUM.center[1] + qy, Z.pawl], bu.drum + PAWL.hang, DRUM.center, bu.fly) - bu.drum;
    };
    const pawl = { angle: b.drum + fallingRest(restRel, v, { into: -1, accel: 270, window: 0.07 }) };
    const ballY = leftTop[1] - 1.9;
    return {
      parts: {
        beam: { angle: b.psi },
        drum: { angle: b.drum },
        flywheel: { angle: b.fly },
        pawl: { position: pivot, angle: pawl.angle },
        ball: { position: [leftTop[0], ballY, 0.1] },
      },
      paths: {
        ropeR: { points: rope, closed: false, phase: b.drum * DRUM.r },
        ropeL: { points: [leftTop, [leftTop[0], ballY + 0.2, 0.1]], closed: false, phase: -b.psi * ARC },
      },
      readouts: [],
    };
  },
};
