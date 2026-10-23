// 第 310 種:三腳式重力擒縱。擒縱輪中央附近有三根銷,負責把擒縱叉瓦 A、B 抬起;兩個叉瓦各自繞擺懸掛點附近的一個中心擺動;
// 擒縱輪由叉瓦上的擋止 D、E 鎖住。主動件是擺;目標件是擒縱輪(擒縱讓它一格一格地放行)。
//
// 讀圖(照 525 px 原圖,2026-10-14 決定 (a)):豎琴形的左、右兩條彎帶就是兩支重力臂(叉瓦),各自鉸在頂上橫樑的一根螺絲上
// (擺懸掛點兩旁),往下繞過輪的外側、在輪的下方各以一根帶鎖緊螺帽的調整螺絲頂住擺桿上的方塊(右臂的螺絲在上、從右邊頂;
// 左臂的在下、從左邊頂);D、E 是釘在左、右彎帶上的開槽小板,擋三腳輪的長腳;彎帶在輪心的高度各有一段往內伸到輪心旁,
// 末端就是叉瓦 A(右臂,輪心右下)、B(左臂,輪心左上)。擺是中間以虛線畫的一根桿(藏在輪後面),從頂上的懸掛座垂下。
// 原圖從輪心往上標「FLY」的細線是調速風扇,跟著擒縱輪轉(照第 311 種)。
//
// 由接觸算(models/escapement.js 的 periodic、gravityArm、clearance、approach):兩支臂靠重量往內倒、靠在擋銷上(角度 0),
// 擒縱輪受重錘的固定力矩逆時針轉。輪轉動時,中央的銷碰到叉瓦就把那支臂往外抬,抬起的臂的擋止擋住下一隻腳,輪停住——銷托著抬起的臂。
// 擺往右擺時,方塊碰到右臂的螺絲、把右臂再推開一點,擋止 E 滑開腳尖,輪轉六分之一圈,中央的銷把左臂抬起、它的擋止 D 擋住下一隻腳;
// 擺回來時右臂壓在擺上、貼著擺一起落回,直到靠上擋銷才和擺分開(臂的重量推著擺,這就是衝量)。往左擺時左右相反。
// 銷托住叉瓦的位置在銷離輪心最遠的方向之前 5°(右臂的 A 在輪心右方、左臂的 B 在左方):擺把臂推開、放開輪之後,
// 銷繼續轉就離開叉瓦,不會把臂抬得比擺還遠(臂才能一路貼著擺落下)。擋止的面是以臂的軸為圓心的弧,腳尖壓在上面推不開臂。
// 叉瓦、擋止的形狀與位置是依原文與作圖推算的(原圖只看得出大致的位置)。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件)。放開後輪撞開臂、重演做不出來,原因見 waivers。
// 推斷:擺幅、各部尺寸;擋銷;輪軸、兩臂的軸裝在後面的機架上(原圖沒畫機架,頂上的橫樑畫成機架的上端);
// 中央的三根銷裝在輪轂外一圈的小圓盤上。
// 推斷的擺(原圖只畫到方塊下面一小段):擺掛在機架頂端背面的懸掛座上,擺桿在機架後面往下(不蓋住輪,原圖的虛線),
// 過了輪的下方才往前伸到彎帶那一層、接上被兩根螺絲頂著的方塊,方塊下面的擺桿一直往下到擺錘。
// 偏離插圖:原圖的懸掛座畫在橫樑上方的前面、擺桿上段也畫在前面;擺整根放到機架後面(懸掛座在機架頂端的背面),
// 擺桿才不會蓋住輪心、抬升銷與叉瓦(原圖擺桿經過輪的那一段就是虛線)。
// 推斷的驅動(原文只說擋止鎖住輪,沒說輪為什麼轉;共用 weight-drive.js):輪軸上、輪的背面有一個鼓,繩從鼓頂往左拉到
// 機架托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪逆時針轉的固定力矩,輪被擋止擋住時重錘也停。
// 擺四個來回(輪轉三分之四圈)重錘捲回最高處一次(上鍊)。實物也可能用發條;重錘只是示意。
import { TAU, deg, swing, Y, Z as ZAXIS } from "./kit.js";
import { placePoly, periodic, anyOverlap, clearance, approach, gravityArm } from "./escapement.js";
import { shape, thickLine, circle, rect, roundEnd } from "./shapes.js";
import { circlePolygon, edgeDistance } from "./contact.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const STEP = TAU / 6;
export const SWING = deg(3.5);
export const LEG = 1.05;
const W = [0, 0]; // 擒縱輪心
const TOP = [0, 4.55]; // 擺的懸掛點
const PIV = { right: [0.38, 4.2], left: [-0.38, 4.2] }; // 兩支臂的樞軸(頂上橫樑的兩根螺絲)
const PIN = { r: 0.32, size: 0.04, lag: deg(25) }; // 中央的抬升銷:在腳後 25°
const LOCK = deg(20); // 擋止 E 擋住的腳在輪的方位(D 在對面)
const ROD = 0.1; // 擺桿寬
const BLOCK = { w: 0.24, h: 0.7, y: -2.1 }; // 擺桿上的方塊(輪的下方)
const SCREW = { right: -1.98, left: -2.29 }; // 兩根調整螺絲的高度(原圖右臂的在上)
const GAP = deg(0.5); // 臂落到底、擺在正中時,螺絲和方塊之間的空隙(以擺角計)
const Z = { plate: -0.7, pend: -1.0, drum: -0.3, leg: 0, pin: 0.17, arm: 0.35, fly: 0.52 };

const local = (pivot) => (pts) => pts.map(([x, y]) => [x - pivot[0], y - pivot[1]]);
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// 三腳輪:三隻長腳(鎖)在 0°、120°、240°;中央三根銷(抬)在各腳後 25°。三根銷是同一個多邊形轉 120°(銷的折線角
// 對叉瓦的方位每根都一樣,三隻腳輪流鎖住時臂抬起的角度才一樣,週期才接得上)
const legs = [0, 1, 2].map((i) => [[0.06, -0.06], [LEG, -0.03], [LEG, 0.03], [0.06, 0.06]].map((p) => rot(p, (i * TAU) / 3)));
const pins = [0, 1, 2].map((i) => circlePolygon([PIN.r, 0], PIN.size, 12).map((p) => rot(p, (i * TAU) / 3 - PIN.lag)));

// 擋止(各臂的局部座標):擋腳的面是以臂的軸為圓心、通過腳尖上緣的弧(腳在 LOCK 方位時),x0..x1 是臂落到底時的世界 x。
// E 的面朝下(腳往上頂),板往上加厚;D 和 E 點對稱,面朝上(腳往下壓),板往下加厚
const CORNER = rot([LEG, 0.03], LOCK);
const arcBlock = (pivot, through, x0, x1, thick) => {
  const r = Math.hypot(through[0] - pivot[0], through[1] - pivot[1]);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 8;
    return [x - pivot[0], -Math.sqrt(r * r - (x - pivot[0]) ** 2)];
  });
  return [...pts, ...pts.slice().reverse().map(([x, y]) => [x, y + thick])];
};
const STOP_E = arcBlock(PIV.right, CORNER, 0.82, 1.22, 0.12);
const STOP_D = arcBlock(PIV.left, [-CORNER[0], -CORNER[1]], -0.8, -1.27, -0.12);
// 叉瓦(各臂的局部座標):A 在輪心右下、銷從左邊往右推它;B 在輪心左上、銷從右邊往左推它(點對稱)
const FACE_A = local(PIV.right)(rect(0.1, 0.35, 0.31, -0.125));
const FACE_B = local(PIV.left)(rect(0.1, 0.35, -0.31, 0.125));
// 調整螺絲(各臂的局部座標):從彎帶的下端往內伸,臂落到底時尖端離方塊 GAP 的擺角
const tip = (y) => BLOCK.w / 2 + (TOP[1] - y) * Math.tan(GAP);
const LUG = { right: 0.5, left: -0.5 }; // 彎帶下端(螺絲穿過的耳)的 x
const SCREW_A = local(PIV.right)(rect(LUG.right + 0.08 - tip(SCREW.right), 0.07, (LUG.right + 0.08 + tip(SCREW.right)) / 2, SCREW.right));
const SCREW_B = local(PIV.left)(rect(LUG.right + 0.08 - tip(SCREW.left), 0.07, -(LUG.right + 0.08 + tip(SCREW.left)) / 2, SCREW.left));

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const BLOCK_AT = local(TOP)(rect(BLOCK.w, BLOCK.h, 0, BLOCK.y));
const rodAt = (p) => [placePoly(BLOCK_AT, TOP, p)]; // 碰螺絲的是方塊
const armA = (a) => ({ face: [placePoly(FACE_A, PIV.right, a)], stop: [placePoly(STOP_E, PIV.right, a)], beat: [placePoly(SCREW_A, PIV.right, a)] });
const armB = (b) => ({ face: [placePoly(FACE_B, PIV.left, b)], stop: [placePoly(STOP_D, PIV.left, b)], beat: [placePoly(SCREW_B, PIV.left, b)] });
const legsAt = (w) => legs.map((l) => placePoly(l, W, w));
const pinsAt = (w) => pins.map((p) => placePoly(p, W, w));

const RATE = 30; // 臂沒靠在擺上時落回的角加速度(重力)
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  const prev = rodAt(pendulumAngle(v - dv));
  let { a, aw, b, bw, w, ww } = s;
  // 1. 方塊推螺絲(右臂往外是逆時針、a 增加;左臂往外是順時針、b 減少);擺返回時臂貼著擺落回,碰到擋銷(0)或抬升銷才停
  const p = pinsAt(w);
  ({ q: a, w: aw } = gravityArm({ beat: (x, r) => anyOverlap(r, armA(x).beat), rest: (x) => anyOverlap(armA(x).face, p) }, { q: a, w: aw }, { rod, prev, sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = gravityArm({ beat: (x, r) => anyOverlap(r, armB(x).beat), rest: (x) => anyOverlap(armB(x).face, p) }, { q: b, w: bw }, { rod, prev, sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  // 2. 擒縱輪:腳被擋止擋住就停;銷碰到叉瓦時把臂往外推(推得動才前進)
  const stops = [...armA(a).stop, ...armB(b).stop];
  const lift = (x) => {
    const pp = pinsAt(x);
    let na = a;
    let nb = b;
    if (anyOverlap(armA(na).face, pp)) na = a + clearance((y) => anyOverlap(armA(y).face, pp), a, 1, 0.3);
    if (anyOverlap(armB(nb).face, pp)) nb = b - clearance((y) => anyOverlap(armB(y).face, pp), b, -1, 0.3);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return null;
    if (anyOverlap([...armA(na).stop, ...armB(nb).stop], legsAt(x))) return null;
    if (anyOverlap(rod, armA(na).beat) || anyOverlap(rod, armB(nb).beat)) return null;
    return { na, nb };
  };
  if (anyOverlap(stops, legsAt(w))) [w, ww] = [w - clearance((x) => anyOverlap(stops, legsAt(x)), w, -1, STEP), 0];
  const dist = (ww + ((2 * STEP) / (0.06 * 4 * SWING) ** 2) * dv) * dv;
  const reached = approach((x) => lift(x) == null, w, 1, dist, 16);
  const r = lift(reached) ?? { na: a, nb: b };
  [a, b] = [r.na, r.nb];
  ww = (reached - w) / dv;
  w = reached;
  return { a, aw, b, bw, w, ww };
}

// 起始:兩臂落到底、腳不碰擋止(叉瓦若壓在銷上,第一步就被銷推開;之後空走兩個週期才記錄)
const W0 = (() => {
  for (let i = 0; i < 96; i++) {
    const x = (STEP * 2 * i) / 96;
    if (!anyOverlap([...armA(0).stop, ...armB(0).stop], legsAt(x))) return x;
  }
  throw new Error("找不到起始位置");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: STEP * 2 }, forward: { w: 1 } });

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度(正值)、擒縱輪轉角(逆時針為正) */
export function gravity(v) {
  const s = run.at(v);
  return { pendulum: pendulumAngle(v), right: s.a, left: -s.b, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    // 分層:腳在前一層、抬升銷與叉瓦在後一層;擋止從彎帶往後伸到腳那一層,兩層都有
    const stop = [...armA(s.a).stop, ...armB(s.b).stop];
    const face = [...armA(s.a).face, ...armB(s.b).face];
    return {
      teeth: [...legsAt(s.w), ...pinsAt(s.w)],
      layers: ["leg", "leg", "leg", "pin", "pin", "pin"],
      stops: [...stop, ...face, ...stop],
      stopLayers: [...stop.map(() => "leg"), ...face.map(() => "pin"), ...stop.map(() => "pin")],
      rod: rodAt(pendulumAngle(v)),
      beats: [...armA(s.a).beat, ...armB(s.b).beat],
    };
  },
};

// 臂(相對各自的軸):彎帶從軸往下繞過輪的外側到下端的耳;頂上往外伸的一段橫翼(原圖);在輪心的高度往內伸到叉瓦的一段;
// 釘在彎帶上的擋止;下端的調整螺絲與鎖緊螺帽;往後伸進機架的軸(前端是螺絲頭)
const BAND = {
  right: [[0.38, 4.2], [0.46, 3.85], [0.72, 2.6], [1.0, 1.45], [1.17, 0.45], [1.24, -0.4], [1.2, -1.05], [1.02, -1.55], [0.76, -1.87], [LUG.right, SCREW.right]],
  left: [[-0.38, 4.2], [-0.46, 3.85], [-0.72, 2.6], [-1.03, 1.45], [-1.2, 0.3], [-1.26, -0.5], [-1.2, -1.25], [-1.0, -1.85], [-0.76, -2.18], [LUG.left, SCREW.left]],
};
const BRANCH = { right: [[1.217, -0.12], [0.33, -0.12]], left: [[-1.2, 0.12], [-0.33, 0.12]] };
const armPieces = (pivot, sgn, band, branch, stop, face, screwY) => {
  const L = local(pivot);
  const lug = sgn * (LUG.right + 0.08);
  const t = sgn * tip(screwY);
  const zFace = [0.12, Z.arm + 0.04]; // 叉瓦從抬升銷那一層到彎帶那一層
  const zStop = [Z.leg - 0.04, Z.arm + 0.04]; // 擋止從彎帶往後伸到腳那一層
  return [
    { kind: "plate", shape: shape(roundEnd(thickLine(L(band), 0.14), [0, 0], 0.08), [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, Z.arm] }, // 彎帶(軸那端畫成圓頭,軸孔四周留一圈肉)
    { kind: "plate", shape: shape(thickLine([[0, 0], [sgn * 0.72, -0.12]], 0.12)), thickness: 0.08, at: [0, 0, Z.arm] }, // 頂上的橫翼
    { kind: "plate", shape: shape(thickLine(L(branch), 0.1)), thickness: 0.08, at: [0, 0, Z.arm] }, // 往內伸到叉瓦的一段
    { kind: "plate", shape: shape(face), thickness: zFace[1] - zFace[0], at: [0, 0, (zFace[0] + zFace[1]) / 2] }, // 叉瓦
    { kind: "plate", shape: shape(stop), thickness: zStop[1] - zStop[0], at: [0, 0, (zStop[0] + zStop[1]) / 2] }, // 擋止 D / E
    { kind: "cylinder", radius: 0.035, length: Math.abs(lug - t), axis: [1, 0, 0], at: [(lug + t) / 2 - pivot[0], screwY - pivot[1], Z.arm] }, // 調整螺絲
    { kind: "cylinder", radius: 0.065, length: 0.05, axis: [1, 0, 0], at: [lug - sgn * 0.17 - pivot[0], screwY - pivot[1], Z.arm] }, // 鎖緊螺帽
    { kind: "cylinder", radius: 0.05, length: Z.arm + 0.06 - (Z.plate - 0.02), at: [0, 0, (Z.arm + 0.06 + Z.plate - 0.02) / 2] }, // 臂的軸,往後伸進機架
    { kind: "cylinder", radius: 0.08, length: 0.04, at: [0, 0, Z.arm + 0.06] }, // 軸前端的螺絲頭
  ];
};

// 推斷的擺(相對懸掛點):懸點的轂與銷(插進機架背面的懸掛座)、機架後面的擺桿、輪下方往前伸的一段、方塊、方塊下的擺桿與擺錘
const JOG = BLOCK.y + BLOCK.h / 2 + 0.06 - TOP[1]; // 往前伸的那一段的高度(方塊頂上)
const BOB = { y: -3.5 - TOP[1], r: 0.4 };
const pendulumPieces = [
  { kind: "cylinder", radius: 0.09, length: 0.16, at: [0, 0, Z.pend] }, // 懸點的轂
  { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, Z.pend + 0.08] }, // 懸點的銷,往前插進懸掛座
  { kind: "box", size: [ROD, -JOG + 0.06, 0.08], at: [0, (JOG - 0.06) / 2, Z.pend] }, // 擺桿(機架後面)
  { kind: "box", size: [ROD, 0.12, Z.arm - 0.06 - (Z.pend - 0.04)], at: [0, JOG, (Z.arm - 0.06 + Z.pend - 0.04) / 2] }, // 輪的下方往前伸到彎帶那一層
  { kind: "box", size: [BLOCK.w, BLOCK.h, 0.2], at: [0, BLOCK.y - TOP[1], Z.arm] }, // 方塊(兩根調整螺絲頂著它)
  { kind: "box", size: [ROD, BLOCK.y - BLOCK.h / 2 - TOP[1] - BOB.y, 0.08], at: [0, (BLOCK.y - BLOCK.h / 2 - TOP[1] + BOB.y) / 2, Z.arm] }, // 方塊下的擺桿
  { kind: "cylinder", radius: BOB.r, length: 0.14, at: [0, BOB.y, Z.arm] }, // 擺錘
];

// 推斷的重錘驅動:鼓在輪的背面、套在輪軸上,繩從鼓頂往左拉到滑輪頂上(滑輪在左臂的外側,裝在機架伸出的托臂上),再垂下吊重錘
const ROPE_R = 0.04;
const DRUM_R = 0.18;
const DRUM = { center: [...W, Z.drum], axis: ZAXIS, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前(逆時針)轉時繩從鼓上放出
const PULLEY_R = 0.13;
const PULLEY = { center: [-1.85, W[1] + DRUM.radius - PULLEY_R - ROPE_R, Z.drum], axis: ZAXIS, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = 4 * 4 * SWING; // 擺四個來回上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, -0.6, PULLEY.center[2]],
  reserve: DRUM.radius * 8 * STEP,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => run.at(v).w, REWIND); // 輪往前(逆時針)轉的角度
export const geometry = { DRUM, REWIND };

// 擋銷(推斷):在兩條彎帶的內側、樞軸下方 0.9,臂落到底時正好貼著彎帶,往後伸到機架
const REST = [0.42, PIV.right[1] - 0.9];
const restR = (pivot, band, sgn) => edgeDistance([sgn * REST[0], REST[1]], placePoly(thickLine(local(pivot)(band), 0.14), pivot, 0));
const REST_R = Math.min(restR(PIV.right, BAND.right, 1), restR(PIV.left, BAND.left, -1));
const REST_Z = [Z.plate + 0.04, Z.arm + 0.04];

const REPLAY_WAIVER = "重演做不出來:兩支重力臂鉸在樞軸上、靠自重靠在擋銷上,擺推開右臂、放開擋止 E 之後,輪在重演裡受固定的力矩從靜止加速,轉了約 15° 中央的抬升銷就以那個速度撞上左臂的叉瓦 B,把左臂撞開約 6°(擋止 D 離開腳的路徑),再撞開右臂(到 43°),輪就一路轉走。實物靠調速風扇(FLY)的空氣阻力讓輪轉得慢,銷是慢慢把叉瓦抬起的;重演沒有空氣阻力,質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(試過以 hold 的阻尼代替風扇:阻尼和輪的轉動慣量成正比,這個輪很輕,一樣撞開)。臂被抬起、擋住腳、貼著擺落回的過程由模型的測試檢查(擋止與叉瓦不穿入輪的腳與銷、兩臂交替被抬起、臂貼著擺落下、輪不回退)";

export default {
  figure: 310,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: LEG,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.1, at: [0, 0, Z.leg], accent: i === 0 })),
        { kind: "cylinder", radius: 0.12, length: 0.16, at: [0, 0, Z.leg] }, // 輪轂
        { kind: "cylinder", radius: 0.3, length: 0.07, at: [0, 0, 0.075] }, // 輪轂外一圈的小圓盤(推斷),裝著三根銷
        ...pins.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.14, at: [0, 0, Z.pin] })), // 中央的三根抬升銷
        { kind: "cylinder", radius: 0.06, length: Z.fly + 0.02 - (Z.plate - 0.02), at: [0, 0, (Z.fly + 0.02 + Z.plate - 0.02) / 2] }, // 輪軸:往後伸進機架、往前伸到風扇
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, Z.drum] }, // 繞繩的鼓(推斷),在輪的背面
        { kind: "cylinder", radius: 0.08, length: 0.06, at: [0, 0, Z.fly] }, // 風扇的轂
        { kind: "box", size: [3.0, 0.06, 0.04], at: [0, 0, Z.fly], angle: deg(95) }, // 調速風扇(FLY),在最前面一層
      ],
    },
    { id: "armA", kind: "group", center: [...PIV.right, 0], arrow: false, pieces: armPieces(PIV.right, 1, BAND.right, BRANCH.right, STOP_E, FACE_A, SCREW.right) },
    { id: "armB", kind: "group", center: [...PIV.left, 0], arrow: false, pieces: armPieces(PIV.left, -1, BAND.left, BRANCH.left, STOP_D, FACE_B, SCREW.left) },
    { id: "pendulum", kind: "group", center: [...TOP, 0], arrow: false, pieces: pendulumPieces },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.3, 3.5, 0, 1.45)), thickness: 0.1, at: [0, 0, Z.plate] }, // 機架板(推斷):往下到輪軸
        { kind: "plate", shape: shape(rect(1.3, 1.65, 0, 3.925)), thickness: 0.1, at: [0, 0, Z.plate] }, // 頂上的橫樑:兩臂的軸、擋銷裝在上面
        { kind: "box", size: [0.4, 0.4, 0.17], at: [0, TOP[1], Z.plate - 0.135] }, // 擺的懸掛座:橫樑頂端的背面
        // 機架板往左伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [-PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] - 0.04) / 2, PULLEY.center[1], Z.plate] },
        { kind: "cylinder", radius: 0.035, length: PULLEY.center[2] + 0.1 - Z.plate, at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + 0.1 + Z.plate) / 2] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂的擋銷:臂靠重量往內倒、落到底時彎帶靠在上面;往後伸到橫樑
        { kind: "cylinder", radius: REST_R, length: REST_Z[1] - REST_Z[0], at: [REST[0], REST[1], (REST_Z[0] + REST_Z[1]) / 2] },
        { kind: "cylinder", radius: REST_R, length: REST_Z[1] - REST_Z[0], at: [-REST[0], REST[1], (REST_Z[0] + REST_Z[1]) / 2] },
        { kind: "box", size: [2 * REST[0], 0.12, 0.06], at: [0, REST[1], Z.plate + 0.08] }, // 兩根擋銷的座,貼在橫樑前面
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: ZAXIS, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [0.42, -0.42, Z.arm], label: "A", labelOffset: [0, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-0.45, 0.45, Z.arm], label: "B", labelOffset: [0, 0, 0.3] },
    { id: "labelD", kind: "group", center: [-0.95, -0.75, Z.arm], label: "D", labelOffset: [0, 0, 0.3] },
    { id: "labelE", kind: "group", center: [0.95, 0.75, Z.arm], label: "E", labelOffset: [0, 0, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)逆時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),兩支臂鉸在樞軸上、
  // 靠自重靠在擋銷上。從輪鎖住的時刻(擺在正中、往右擺)開始。
  replay: {
    from: SWING,
    to: 9 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: 1, gravity: false }, armA: { pivot: [...PIV.right, 0] }, armB: { pivot: [...PIV.left, 0] } },
    ignore: [["wheel", "frame"], ["armA", "frame"], ["armB", "frame"]],
    expect: [
      { at: 3 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開擋止 E,輪轉六分之一圈、被擋止 D 擋住", quote: "擒縱輪由擒縱叉瓦上的擋止 D 和 E 加以鎖定" },
      { at: 3 * SWING, part: "armA", label: "擺往右擺:右臂被擺推開" },
      { at: 5 * SWING, part: "wheel", label: "擺往左擺:推開左臂、放開擋止 D,輪再轉六分之一圈" },
      { at: 5 * SWING, part: "armB", label: "擺往左擺:左臂被擺推開" },
      { part: "wheel", label: "擺兩個來回,輪轉過三分之二圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: REPLAY_WAIVER },
    { check: "replay", parts: ["armA"], reason: REPLAY_WAIVER },
  ],
  pose(v) {
    const s = run.at(v);
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        pendulum: { angle: pendulumAngle(v) },
        armA: { angle: s.a },
        armB: { angle: s.b },
        wheel: { angle: s.w },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
