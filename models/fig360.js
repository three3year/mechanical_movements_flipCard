// 第 360 種:由擺動運動得到連續旋轉。樑在 A 形架頂上的樞銷上擺動,兩端是弧形頭;照原圖,右端弧形頭的繩貼著弧頭外緣、
// 從弧頭最右邊鉛直落下,沿鼓輪右側繞在鼓輪上。鼓輪鬆套在飛輪軸上,鼓輪上的棘爪推著固定在軸上的棘輪。
// 樑右端往上時繩把鼓輪右側往上拉,鼓輪逆時針轉(原圖),棘爪帶動棘輪與飛輪;往回擺時鼓輪反轉,
// 棘爪滑過棘輪,飛輪不受影響(繼續往前)。左端弧形頭的繩鉛直垂下、穿過一個球,球下還垂著一段:
// 這是讓人拉動樑的拉繩,球是握把(推斷;原文只說「樑被設定為擺動」)。主動件是樑(累計擺動)。
// 繩只能拉:樑往回擺時繩鬆掉,鼓輪要靠鼓輪後面的渦卷彈簧轉回(推斷,原圖與原文都沒畫回復的來源;
// 維護者的決定 2026-10-14 (a)):彈簧內端固定在鼓輪的輪轂上,外端插在從底座立起的柱頂;繩拉鼓輪逆時針轉時把彈簧上緊,
// 樑往回擺時彈簧把鼓輪轉回、把繩捲回鼓輪上,繩一直拉緊。鼓輪的轉角照舊由繩長算(繩長不變:弧頭上的一段 + 鉛直的一段 +
// 捲在鼓輪上的一段)。
// 推斷:棘輪齒數(12 齒,原圖約 20,為了每程整數齒)。棘輪固定在軸上、裝在鼓輪前面,棘爪的銷立在鼓輪的前面上
// (推完一程時在左上方,和原圖一樣),爪尖在銷的逆時針方向,棘爪靠自重垂下、爪尖落在齒根:鼓輪往前轉時爪尖頂著齒的直面推棘輪,
// 往回轉時爪尖沿齒背滑上去、過了齒尖落進下一格(棘爪的轉角由接觸算,contact.swingUntilContact)。
// 「連續旋轉」:飛輪不跟著鼓輪停下——鼓輪往回轉時飛輪憑動量繼續轉、越轉越慢(速度按指數衰減)。
// 回程裡飛輪滑行不到一齒,所以下一程棘爪碰上的是它面前的第一個齒面(往回轉時爪滑過的那幾齒之後),
// 碰上之後推到這一程的終點。鼓輪每程轉過的角度剛好是 3 齒(鼓輪半徑依此選定),每圈飛輪前進 3 齒,
// 棘爪每一程都在同一個相位碰上齒面;碰上的時刻由「飛輪滑到的位置 = 鼓輪轉到的位置」算出。
import { deg, swingPhase, rot2, around, TAU } from "./kit.js";
import { ratchetShape, shape, circle, arcPoints, thickLine, roundEnd, spanBox } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, fallingRest } from "./contact.js";
import { solve } from "./linkage.js";

const PIVOT = [-0.6, 2.3, 0];
const ARC = 1.9; // 樑端弧形頭的半徑(以樞軸為圓心)
const HEAD = { inner: ARC - 0.05, outer: ARC + 0.12, half: deg(22) }; // 弧形頭的內外半徑與半個張角
const ROPE_R = 0.04;
const AR = HEAD.outer + ROPE_R; // 繩中心線貼著弧頭外緣的半徑
const TIE = deg(20); // 繩頭繫在弧形頭上端(離弧頭中線的角)
export const SWING = deg(14);
const RATCHET_TEETH = 12;
const STROKE_TEETH = 3; // 鼓輪每程轉過的齒數
const PITCH = TAU / RATCHET_TEETH;
const LEAD = 0.08; // 繩在鼓輪上每捲一圈沿軸挪的距離
// 繩捲在鼓輪上每一弧度的長度 DL:樑擺一程(2·SWING)放出的繩剛好讓鼓輪轉 3 齒
const DL = (2 * SWING * AR) / (STROKE_TEETH * PITCH);
const DR = Math.sqrt(DL * DL - (LEAD / TAU) ** 2); // 繩中心線捲在鼓輪上的半徑
// 繩從弧頭最右邊鉛直落下,落在鼓輪右側的切點:鼓輪中心在繩的左邊 DR
const DRUM = { center: [PIVOT[0] + AR - DR, -0.35, 0], r: DR - ROPE_R, len: 0.35 };
const WOUND0 = 1.5 * TAU; // 樑在最低處(鼓輪轉角 0)時鼓輪上捲著的繩(弧度)
const ROPE_END_Z = -0.12; // 繩尾(固定在鼓輪上)的深度;往切點每捲一圈往前 LEAD
const RATCHET = { teeth: RATCHET_TEETH, outer: 0.5, inner: 0.34, dir: 1 };
const Z = { ratchet: 0.25, pawl: 0.25, fly: -0.45, spring: -0.27 }; // 棘輪與棘爪在鼓輪前面;飛輪在後面;彈簧夾在中間
// 渦卷彈簧(推斷):內端在鼓輪輪轂上,外端在正下方插進柱頂;順時針往外繞 SPRING.turns 圈
const SPRING = { r0: 0.225, r1: 0.95, turns: 4, wire: 0.025 };
// 棘爪的銷在鼓輪前面上,爪尖在銷的逆時針方向 25° 處(爪短、銷在爪尖推的那條線的外側):齒面推回爪尖時,
// 反力讓爪往齒根轉(自鎖),不會被擠出來。銷的位置選在推動的那一段(鼓輪轉過 45°–90°)時位於棘輪頂上,
// 爪靠自重往下、壓向棘輪(推完時銷在左上方,和原圖一樣)。
const PIVOT_R = 0.57;
const LEAD_ANGLE = deg(25);
const PIVOT_AT = deg(23); // 銷在鼓輪上的角(鼓輪轉角 0 時)
const TIP_R = RATCHET.inner + 0.04; // 爪尖貼在(外擴過的)齒根圓上
export const PAWL = (() => {
  const pivot = [PIVOT_R * Math.cos(PIVOT_AT), PIVOT_R * Math.sin(PIVOT_AT)];
  const tip = [TIP_R * Math.cos(PIVOT_AT + LEAD_ANGLE), TIP_R * Math.sin(PIVOT_AT + LEAD_ANGLE)];
  return { pivot, length: Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]), hang: Math.atan2(tip[1] - pivot[1], tip[0] - pivot[0]) - deg(25) };
})();

const SPAN = STROKE_TEETH * PITCH; // 鼓輪每程的轉角
// 飛輪滑行時速度按 e^(−COAST·t/T) 衰減(T 是一程的時間);衰減率取得夠大,回程裡滑行不到一齒
const COAST = 3.5;
const coasted = (t) => (SPAN * (1 - Math.exp(-COAST * t))) / COAST; // 推完後滑行 t 程的時間走過的量
// 下一程從起點走到 CATCH(比例)時,鼓輪追上滑行中的飛輪:coasted(1 + f) = SPAN·f
const CATCH = solve((f) => coasted(1 + f) - SPAN * f, 0, 0, 1);
// 棘爪的轉角:從抬起的角度逆時針往下擺,停在爪的外形第一次碰到棘輪齒形的地方(由接觸算)
const PAWL_OUTLINE = thickLine([[0, 0], [PAWL.length, 0]], 0.08);
// 畫出來的棘爪:銷那一端畫成圓頭(半徑 = 爪身半寬),銷孔周圍留一圈肉。圓頭離棘輪中心至少 PIVOT_R − 0.04 = 0.53,
// 在齒頂圓(0.5)外,碰不到棘輪,所以接觸照舊用平頭的 PAWL_OUTLINE(頂點少、算得快)
const PAWL_BODY = roundEnd(PAWL_OUTLINE, [0, 0], 0.04);
function pawlAngle(pivot, from, center, wheel) {
  return swingUntilContact({ pivot, outline: PAWL_OUTLINE, from, into: 1, sweep: 1.6, steps: 80 }, ratchetObstacles(RATCHET, wheel, center));
}

// 推動時棘輪相對鼓輪的角度:爪尖落在齒根、貼著齒的直面(在一個齒距裡找爪尖最深的位置)
const ENGAGED = (() => {
  let best = { depth: Infinity, rho: 0 };
  for (let i = 0; i <= 400; i++) {
    const rho = (PITCH * i) / 400;
    const angle = pawlAngle([...PAWL.pivot, 0], PAWL.hang, [0, 0], rho);
    const depth = Math.hypot(PAWL.pivot[0] + PAWL.length * Math.cos(angle), PAWL.pivot[1] + PAWL.length * Math.sin(angle));
    if (depth < best.depth - 1e-9) best = { depth, rho };
  }
  return best.rho - 1e-3; // 往推的方向差一點點:爪尖貼著齒面、不壓進去
})();

/** 累計擺動 v → 樑角、鼓輪轉角、飛輪(棘輪)轉角;engaged:棘爪正推著棘輪 */
export function beam(v) {
  const { at, cycle, forward, f } = swingPhase(v, -SWING, SWING);
  // 樑右端往上擺(at 增加)時,繩從鼓輪右側被拉起,鼓輪逆時針轉(正角);往回擺時彈簧把鼓輪轉回
  const pulled = ((at + SWING) * AR) / DL;
  // 飛輪往前(逆時針)的累計量:棘爪追上之後跟著鼓輪;其餘時間滑行
  let ahead;
  const engaged = forward && f >= CATCH;
  if (engaged) ahead = cycle * SPAN + SPAN * f;
  else {
    const t = forward ? 1 + f : f; // 從上一程推完算起滑行了幾程的時間
    const base = forward ? cycle * SPAN : (cycle + 1) * SPAN;
    ahead = base + coasted(t);
  }
  return { psi: at, drum: pulled, fly: ENGAGED + ahead, forward, engaged };
}
export const stroke = { SPAN, PITCH, STROKE_TEETH, CATCH, returnCoast: coasted(1) };

const head = (s) => {
  const mid = s > 0 ? 0 : Math.PI;
  return shape([...arcPoints(HEAD.outer, mid - HEAD.half, mid + HEAD.half), ...arcPoints(HEAD.inner, mid + HEAD.half, mid - HEAD.half)]);
};

// 右繩:繩頭在右弧頭上端,貼著弧頭外緣繞到最右邊,鉛直落到鼓輪右側的切點,再繞進鼓輪(繩尾固定在鼓輪上)
function rightRope(psi, drum) {
  const top = TIE + psi; // 繩頭的世界角
  const n = Math.max(2, Math.ceil(top / deg(2)));
  const onHead = Array.from({ length: n + 1 }, (_, i) => around(PIVOT, AR, top * (1 - i / n), 0));
  const wound = WOUND0 - drum; // 鼓輪上還捲著的繩(弧度)
  const zAt = (w) => ROPE_END_Z + (LEAD * w) / TAU; // 離繩尾 w 弧度處的深度
  const m = Math.ceil((wound / TAU) * 96);
  // 從切點(鼓輪角 0)順時針往繩尾繞
  const onDrum = Array.from({ length: m + 1 }, (_, i) => {
    const a = -(wound * i) / m;
    return around(DRUM.center, DR, a, zAt(wound + a));
  });
  return [...onHead, ...onDrum];
}
// 左繩:繩頭在左弧頭上端,貼著弧頭外緣繞到最左邊,鉛直垂下穿過球,球下還垂著 TAIL
const TAIL = 1.05; // 球心以下的繩長
const BALL_R = 0.22;
const BALL_HOLE = ROPE_R + 0.005; // 球心鉛直的孔(繩從孔裡穿過)
// 球的剖面:從孔的下緣沿球面繞到孔的上緣,孔壁(r = BALL_HOLE)把剖面封起來
const BALL_PROFILE = (() => {
  const top = Math.acos(BALL_HOLE / BALL_R);
  return Array.from({ length: 25 }, (_, i) => {
    const a = -top + (2 * top * i) / 24;
    return [BALL_R * Math.cos(a), BALL_R * Math.sin(a)];
  });
})();
const HANG0 = 2.0; // 樑在中間(psi = 0)時從弧頭最左邊到球心的距離
function leftRope(psi) {
  const top = Math.PI - TIE + psi; // 繩頭的世界角
  const n = Math.max(2, Math.ceil((Math.PI - top) / deg(2)));
  const onHead = Array.from({ length: n + 1 }, (_, i) => around(PIVOT, AR, top + (Math.PI - top) * (i / n), 0));
  // 繩長不變:弧頭上少一段,垂下的就多一段
  const ball = PIVOT[1] - HANG0 - AR * psi;
  const x = PIVOT[0] - AR;
  return { points: [...onHead, [x, ball + BALL_R, 0], [x, ball - BALL_R, 0], [x, ball - TAIL, 0]], ball };
}

// 渦卷彈簧:內端跟著鼓輪轉(鼓輪轉角 0 時在正下方),順時針往外繞到正下方的外端;鼓輪逆時針轉多少,就多繞多少
function spring(drum) {
  const sweep = SPRING.turns * TAU + drum;
  const n = Math.ceil((sweep / TAU) * 40);
  const a0 = -Math.PI / 2 + drum;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return around(DRUM.center, SPRING.r0 + (SPRING.r1 - SPRING.r0) * t, a0 - sweep * t, Z.spring);
  });
}

const BASE_TOP = -2.6;
const SPRING_FOOT = DRUM.center[1] - SPRING.r1; // 彈簧外端的高度

export default {
  figure: 360,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // A 形架在飛輪後面,頂上的凸台(推斷)托著樑的樞銷
        { kind: "plate", shape: shape(thickLine([[-2.3, -2.6], [-0.6, 2.3], [1.1, -2.6]], 0.2)), thickness: 0.2, at: [0, 0, -0.65] },
        { kind: "plate", shape: shape(circle(0.22, PIVOT[0], PIVOT[1])), thickness: 0.2, at: [0, 0, -0.65] },
        spanBox(-2.3, 2.6, BASE_TOP - 0.2, BASE_TOP, -0.8, 0.2),
        // 樑的樞銷:從 A 形架穿過樑的輪轂,前端有銷頭擋住;銷上套一段隔套,讓樑貼著銷頭轉、不往後滑
        // (凸台、隔套與銷頭都是推斷:原圖只畫出架頂的一個圓)
        { kind: "cylinder", radius: 0.08, length: 0.95, at: [PIVOT[0], PIVOT[1], -0.275] },
        { kind: "cylinder", radius: 0.13, length: 0.05, at: [PIVOT[0], PIVOT[1], 0.18] },
        { kind: "cylinder", radius: 0.14, inner: 0.08, length: 0.395, at: [PIVOT[0], PIVOT[1], -0.3525] },
        // 飛輪軸的軸承座:立柱在飛輪的後面,頂上一個軸承環(軸穿過環孔)
        spanBox(DRUM.center[0] - 0.125, DRUM.center[0] + 0.125, BASE_TOP, DRUM.center[1] - 0.25, -0.8, -0.6),
        { kind: "cylinder", radius: 0.27, inner: 0.1, length: 0.1, at: [DRUM.center[0], DRUM.center[1], -0.55] },
        // 渦卷彈簧外端的柱(推斷):從底座立在飛輪前面、鼓輪正下方,彈簧外端插進柱頂
        spanBox(DRUM.center[0] - 0.06, DRUM.center[0] + 0.06, BASE_TOP, SPRING_FOOT + 0.04, Z.spring - 0.05, Z.spring + 0.05),
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
        { kind: "cylinder", radius: 0.16, inner: 0.08, length: 0.3 },
      ],
    },
    {
      id: "flywheel",
      kind: "group",
      center: [DRUM.center[0], DRUM.center[1], Z.fly],
      spin: 2.0,
      pieces: [
        { kind: "plate", shape: shape(circle(2.0), [circle(1.85).reverse()]), thickness: 0.15 },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [3.8, 0.1, 0.08], angle: (i * Math.PI) / 4 })),
        { kind: "box", size: [0.25, 0.25, 0.17], at: [1.92, 0, 0], accent: true }, // 輪緣上的記號
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.1 }), thickness: 0.1, at: [0, 0, Z.ratchet - Z.fly] },
        // 軸:從後面的軸承環穿過飛輪、彈簧、鼓輪到棘輪前面
        { kind: "cylinder", radius: 0.1, length: 0.95, at: [0, 0, (-0.15 + 0.8) / 2] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      center: DRUM.center,
      spin: DRUM.r,
      pieces: [
        // 鼓輪鬆套在飛輪軸上(軸孔沒有畫出來)
        { kind: "cylinder", radius: DRUM.r, length: DRUM.len, mark: true },
        { kind: "cylinder", radius: DRUM.r + 0.12, length: 0.05, at: [0, 0, -DRUM.len / 2 - 0.025] },
        // 往後伸的輪轂:彈簧內端固定在它的外緣
        { kind: "cylinder", radius: SPRING.r0 - SPRING.wire, length: 0.15, at: [0, 0, -DRUM.len / 2 - 0.075] },
        { kind: "cylinder", radius: 0.03, length: 0.125, at: [PAWL.pivot[0], PAWL.pivot[1], DRUM.len / 2 + 0.0625] }, // 棘爪的銷
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(PAWL_BODY, [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
    { id: "spring", kind: "rod", radius: SPRING.wire, stretch: "渦卷彈簧:內端在鼓輪輪轂上、外端插在柱頂,鼓輪轉動時捲緊放鬆(畫成內外半徑固定的螺線,圈數跟著鼓輪轉角變)" },
    { id: "ropeR", kind: "rope", radius: ROPE_R },
    { id: "ropeL", kind: "rope", radius: ROPE_R },
    // 球串在左繩上當握把:球心開了鉛直的孔,繩從孔裡穿過
    { id: "ball", kind: "lathe", axis: [0, 1, 0], profile: BALL_PROFILE },
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
    // 棘爪:銷在鼓輪上,從抬起的位置逆時針垂下、停在碰到棘輪的齒面處
    const [px, py] = rot2(PAWL.pivot, b.drum);
    const pivot = [DRUM.center[0] + px, DRUM.center[1] + py, Z.pawl];
    // 爪滑過齒尖後不是瞬間落下:以鼓輪為準的轉角加速落回齒上(約 0.15 秒落 30°)
    const restRel = (u) => {
      const bu = beam(u);
      const [qx, qy] = rot2(PAWL.pivot, bu.drum);
      return pawlAngle([DRUM.center[0] + qx, DRUM.center[1] + qy, Z.pawl], bu.drum + PAWL.hang, DRUM.center, bu.fly) - bu.drum;
    };
    const pawl = { angle: b.drum + fallingRest(restRel, v, { into: 1, accel: 270, window: 0.07 }) };
    const left = leftRope(b.psi);
    return {
      parts: {
        beam: { angle: b.psi },
        drum: { angle: b.drum },
        flywheel: { angle: b.fly },
        pawl: { position: pivot, angle: pawl.angle },
        ball: { position: [PIVOT[0] - AR, left.ball, 0] },
      },
      paths: {
        // 兩條繩的頭都繫在樑上:材料座標從繩頭量起,不另外移相
        ropeR: { points: rightRope(b.psi, b.drum), closed: false, phase: 0 },
        ropeL: { points: left.points, closed: false, phase: 0 },
        spring: { points: spring(b.drum), closed: false },
      },
      readouts: [],
    };
  },
};
