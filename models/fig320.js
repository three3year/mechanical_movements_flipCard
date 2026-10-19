// 第 320 種:無端鏈(惠更斯的維持動力)。右側是動力輪(動力輪部分的主輪),滑輪 P 用兩顆螺絲固定在它上面(表面粗糙,
// 繩不打滑);左側是報時輪(報時輪部分的主輪),類似的滑輪(棘輪滑輪)騎在報時輪的軸 p 上,以棘輪與制動爪附著在
// 報時輪上,只能往一個方向轉(照原圖與原文開頭「左側的則為報時輪」,不用「沒有報時部件時附於框架」的裝法)。
// 一條無端的繩依序繞過 P、下方掛大重物 W 的滑輪、棘輪滑輪、掛小重物 w 的滑輪,再回到 P:繩段 d(P 右側)、c(棘輪
// 滑輪右側)吊著 W,b(棘輪滑輪左側)、a(P 左側)吊著 w(w 只重到讓繩保持在輪上);a、c 在中間交叉,照原圖。
// 時鐘走時,W 下降帶動 P 與動力輪;上發條時把繩段 b 往下拉,棘輪滑輪在制動爪下轉動、c 把 W 拉上來,而 d 仍掛在 P 上,
// 動力輪一刻也不失去 W 的壓力,往擒縱的小齒輪照轉。主動件是虛擬的「進程」:每一輪前段時鐘照走,後段同時上發條(拉 b)。
// 棘輪滑輪的棘輪是鋸齒形(只能逆時針轉),照原圖比繩槽大(齒根也在繩外),在滑輪前面;制動爪鉸在報時輪的樁上,
// 由爪簧(原圖左上的淚滴形片,也裝在報時輪上)與自重壓在棘輪上:上發條時齒背從爪尖底下滑過、爪被抬起又落下,
// 爪尖的位置由爪尖和齒面相碰算(ratchets.pawlRest),片簧的末端跟著爪背走。
// 模型裡不報時:報時輪由報時輪系鎖住、停著不動,W 經 c 拉棘輪滑輪往回轉的力由爪傳到報時輪上。
// 推斷:每一輪上發條的時機與快慢;各輪尺寸依原圖;兩個主輪的齒數;往擒縱的小齒輪(代表動力輪帶動的輪系)與報時輪系的
// 小齒輪(停著);爪簧的片簧形狀(原圖只看得出淚滴形的座);P 的軸、軸 p 與兩個小齒輪的軸裝在後面的夾板條上;兩個重物
// 用叉形吊帶掛在滑輪軸上(原圖畫成一根吊桿)。爪身與片簧在棘輪前面那一層、只有爪尖往後伸到棘輪那一層
// (原圖是平面圖;這樣片簧與爪身才不會掃過棘齒)。
import { Z, smooth, routeBelt, deg } from "./kit.js";
import { ratchetShape, shape, thickLine } from "./shapes.js";
import { pawlRest, pawlTrack } from "./ratchets.js";
import { plateBar } from "./supports.js";
import { meshAngle } from "./gears.js";

const R = 0.55;
const RW = 0.48; // W 的滑輪
const Rw = 0.32; // w 的滑輪
const PP = [1.3, 1.6, 0]; // P
const Pp = [-1.3, 1.6, 0]; // p
const W0 = -1.6; // W 滑輪的起始高度
const w0 = -1.0; // w 滑輪的起始高度
export const FEED = 0.55 * Math.PI; // 每一輪時鐘走過、經 P 送出的繩長(上發條時棘輪滑輪轉半圈,正好 6 個棘齒)
const WIND = 0.75; // 每一輪的後段(0.75–1)同時上發條
// 棘輪滑輪的棘輪:只能逆時針轉;原圖齒尖半徑約 53 px、繩繞的半徑約 42 px,棘輪比繩槽大
export const RATCHET = { teeth: 12, outer: 0.69, inner: 0.58, dir: 1 };
// 制動爪:樞軸在報時輪上、棘輪滑輪的上方偏右(棘輪外),爪往左下斜,爪尖搭在棘輪的頂上
// (爪不能太長:太長就近乎沿切線躺在齒上,爪尖兩側會切進鄰齒)
const CLICK = { pivot: [Pp[0] + 0.9 * Math.cos(deg(70)), Pp[1] + 0.9 * Math.sin(deg(70)), 0], length: 0.42, width: 0.08 };
const Z_FRAME = -0.35;
const Z_WHEEL = -0.2; // 兩個主輪與小齒輪那一層(滑輪後面、夾板條前面)
// 爪:爪身在棘輪前面(0.205–0.265),只有爪尖往後伸到棘輪那一層(0.12–0.265;棘輪 0.1–0.2)
const Z_CLICK = 0.235;
const Z_LEAF = 0.23; // 片簧在棘輪前面那一層
// 兩個主輪(推斷齒數)與小齒輪:往擒縱的在動力輪右上,報時輪系的在報時輪左上
const GOING = { center: [PP[0], PP[1], Z_WHEEL], teeth: 48, radius: 0.96 };
const STRIKING = { center: [Pp[0], Pp[1], Z_WHEEL], teeth: 48, radius: 0.96 };
const PINION = { teeth: 12, radius: 0.24 };
const BACKLASH = 0.01; // 齒隙:中心距稍微拉開(直齒側的小齒輪和大輪的齒頂才不相碰)
const onRim = (c, a) => [c[0] + (0.96 + PINION.radius + BACKLASH) * Math.cos(a), c[1] + (0.96 + PINION.radius + BACKLASH) * Math.sin(a), Z_WHEEL];
const GOING_PINION = { ...PINION, center: onRim(PP, deg(35)) };
const STRIKING_PINION = { ...PINION, center: onRim(Pp, deg(145)) };

// 上發條的行程(0→1):拉 b 時多拉 0.4 個棘齒,爪落進齒根後放手,W 把棘輪滑輪拉回來、齒的直面靠上爪尖
const OVER = (0.4 * (2 * Math.PI) / 12 * 0.55) / FEED;
const winding = (x) => (x <= 0 ? 0 : x < 0.85 ? (1 + OVER) * smooth(x / 0.85) : 1 + OVER * (1 - smooth((Math.min(x, 1) - 0.85) / 0.15)));

/** 進程 p → 經 P 送出的繩長、經棘輪滑輪拉過的繩長、兩重物的高度 */
export function chain(p) {
  const k = Math.floor(p);
  const f = p - k;
  const fed = FEED * p; // 時鐘一直在走
  const wound = FEED * (k + winding((f - WIND) / (1 - WIND)));
  return { fed, wound, W: W0 - fed / 2 + wound / 2, w: w0 + fed / 2 - wound / 2 };
}

/** 棘輪滑輪轉到 angle 時,制動爪落到碰上棘輪面的角度(爪尖的方位,繞樞軸) */
const rest = (angle) => pawlRest({ pivot: CLICK.pivot, length: CLICK.length, from: deg(190), into: 1, sweep: 1.2 }, { center: Pp, angle, ...RATCHET });
// 棘輪的相位:停著時爪尖落在齒根、頂著齒的直面(W 的拉力讓棘輪滑輪往回轉,直到被爪擋住)
const PHASE = (() => {
  const pitch = (2 * Math.PI) / RATCHET.teeth;
  let best = 0;
  let deepest = Infinity;
  for (let i = 0; i < 240; i++) {
    const phase = (pitch * i) / 240;
    const [x, y] = rest(phase).tip;
    const r = Math.hypot(x - Pp[0], y - Pp[1]);
    if (r < deepest - 1e-9) [deepest, best] = [r, phase];
  }
  return best;
})();
/** 經棘輪滑輪拉過的繩長 → 棘輪滑輪的轉角(逆時針) */
export const ratchetAngle = (wound) => PHASE + wound / R;
// 制動爪逐步跟著上發條的行程走:被齒背抬起,過了齒尖加速落回(一輪裡只有上發條那一段棘輪滑輪會轉)
const track = pawlTrack({ rest: (f) => rest(ratchetAngle(chain(f).wound)).angle, x0: WIND, x1: 1, acc: 6000, samples: 2400 });
/** 進程 p → 制動爪的角度(爪尖的方位,繞樞軸) */
export const clickAngle = (p) => track(p - Math.floor(p));
/** 進程 p → 制動爪最深能落到的角度(爪尖碰到棘輪面;爪不會比它更深) */
export const clickLimit = (p) => rest(ratchetAngle(chain(p).wound)).angle;

// 爪簧:淚滴形的座在報時輪左上(原圖),片簧從座的尖端伸出,末端壓在爪背靠爪尖的一端(爪身與爪尖的交界)
const LEAF_R = 0.02;
const PRESS = CLICK.length - 0.14; // 片簧壓在爪身上離樞軸多遠
/** 爪轉到 psi 時,片簧末端(中心)的位置:爪背上、離爪背一個片簧半徑 */
const pressAt = (psi) => {
  const u = [Math.cos(psi), Math.sin(psi)];
  const back = [u[1], -u[0]]; // 爪往左下斜,右法線朝上,是離棘輪的一側
  const off = CLICK.width / 2 + LEAF_R + 0.002;
  return [CLICK.pivot[0] + PRESS * u[0] + off * back[0], CLICK.pivot[1] + PRESS * u[1] + off * back[1]];
};
const SEAT_AT = [Pp[0] + 0.86 * Math.cos(deg(128)), Pp[1] + 0.86 * Math.sin(deg(128))];
const LEAF_DIR = (() => {
  const [x, y] = pressAt(clickAngle(0));
  const d = Math.hypot(x - SEAT_AT[0], y - SEAT_AT[1]);
  return [(x - SEAT_AT[0]) / d, (y - SEAT_AT[1]) / d];
})();
const SEAT = { at: SEAT_AT, r: 0.1 }; // r:座的尖端離座心多遠(片簧從那裡伸出)
const LEAF_ROOT = [SEAT_AT[0] + SEAT.r * LEAF_DIR[0], SEAT_AT[1] + SEAT.r * LEAF_DIR[1]];
/** 進程 p → 片簧的折線:根部固定在座上、沿座的方向伸出,末端被爪背頂著(彎曲吸收在片簧裡) */
export function leafPoints(p) {
  const end = pressAt(clickAngle(p));
  const span = Math.hypot(end[0] - LEAF_ROOT[0], end[1] - LEAF_ROOT[1]);
  const p1 = [LEAF_ROOT[0] + (LEAF_DIR[0] * span) / 3, LEAF_ROOT[1] + (LEAF_DIR[1] * span) / 3];
  const p2 = [end[0] - (LEAF_DIR[0] * span) / 3, end[1] - (LEAF_DIR[1] * span) / 3];
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, e = t ** 3;
    pts.push([a * LEAF_ROOT[0] + b * p1[0] + c * p2[0] + e * end[0], a * LEAF_ROOT[1] + b * p1[1] + c * p2[1] + e * end[1], Z_LEAF]);
  }
  return pts;
}
// 淚滴形的座:半徑 0.05 的圓,尖端朝片簧
const seatOutline = (() => {
  const a0 = Math.atan2(LEAF_DIR[1], LEAF_DIR[0]);
  const t = Math.acos(0.05 / SEAT.r);
  const pts = [[SEAT.r * Math.cos(a0), SEAT.r * Math.sin(a0)]];
  for (let i = 0; i <= 16; i++) {
    const a = a0 + t + ((2 * Math.PI - 2 * t) * i) / 16;
    pts.push([0.05 * Math.cos(a), 0.05 * Math.sin(a)]);
  }
  return pts;
})();
export const geometry = { CLICK, Pp, SEAT };

// 叉形吊帶:從重物頂面伸到滑輪軸的兩端(軸頭長 1.6 倍輪寬),前後各一條
const hanger = (top, width) => [1, -1].map((side) => ({ kind: "box", size: [0.1, top, 0.04], at: [0, top / 2, side * (0.8 * width + 0.02)] }));
// 小齒輪的軸(和小齒輪固定在一起),後端插進夾板條
const pinionArbor = { kind: "cylinder", radius: 0.05, length: 0.15, at: [0, 0, -0.015] };
// 主輪上的附件(局部座標,原點在主輪中心、z 從主輪中面算起)
const local = ([x, y], c, z) => [x - c[0], y - c[1], z - Z_WHEEL];

export default {
  figure: 320,
  parts: [
    {
      // 動力輪:P 用兩顆螺絲固定在它前面(原圖 P 上的兩個黑點),一起轉
      id: "goingWheel",
      kind: "gear",
      center: GOING.center,
      teeth: GOING.teeth,
      radius: GOING.radius,
      width: 0.1,
      bore: 0.05,
      label: "P",
      labelOffset: [0, 0.15, 0.5],
      pieces: [
        { kind: "cylinder", radius: 0.4, length: 0.06, at: [0, 0, 0.08] }, // 輪轂:從動力輪正面接到 P 的背面
        { kind: "pulley", style: "disc", radius: R, width: 0.2, at: [0, 0, -Z_WHEEL] },
        ...[1, -1].map((s) => ({ kind: "cylinder", radius: 0.035, length: 0.28, at: [s * 0.3, 0, 0.19] })), // 固定螺絲,穿過 P 與輪轂鎖在動力輪上,頭露在 P 前面
      ],
    },
    // 往擒縱的小齒輪(推斷,代表動力輪帶動的輪系)
    { id: "goingPinion", kind: "gear", center: GOING_PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.1, pieces: [pinionArbor] },
    {
      // 報時輪:固定在它的軸 p 上,模型裡不報時、停著;制動爪的樁與爪簧的座都裝在它上面
      id: "strikingWheel",
      kind: "gear",
      center: STRIKING.center,
      teeth: STRIKING.teeth,
      radius: STRIKING.radius,
      width: 0.1,
      label: "p",
      labelOffset: [-0.12, 0.15, 0.5],
      pieces: [
        // 軸 p:從夾板條伸出,穿過報時輪與棘輪滑輪的中心到前面(棘輪滑輪騎在它上面轉)
        { kind: "cylinder", radius: 0.05, length: 0.64, at: [0, 0, 0.02 - Z_WHEEL] },
        { kind: "cylinder", radius: 0.035, length: 0.42, at: local(CLICK.pivot, Pp, 0.06) }, // 制動爪的樁(-0.15–0.27)
        { kind: "cylinder", radius: 0.04, length: 0.35, at: local(SEAT.at, Pp, 0.025) }, // 爪簧座的柱(-0.15–0.2)
        { kind: "plate", shape: { outline: seatOutline, holes: [] }, thickness: 0.06, at: local(SEAT.at, Pp, Z_LEAF) }, // 淚滴形的座
      ],
    },
    // 報時輪系的小齒輪(推斷;不報時,停著)
    { id: "strikingPinion", kind: "gear", center: STRIKING_PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.1, pieces: [pinionArbor] },
    {
      id: "pulleyp",
      kind: "group",
      center: Pp,
      spin: 0.25, // 轉向箭頭畫在棘輪正面靠中心(畫在輪外會蓋住爪尖、爪與爪簧)
      spinOffset: 0.26,
      pieces: [
        { kind: "pulley", style: "disc", radius: R, width: 0.2 },
        { kind: "plate", shape: ratchetShape(RATCHET), thickness: 0.1, at: [0, 0, 0.15] }, // 棘輪,固定在棘輪滑輪上
      ],
    },
    {
      id: "click",
      kind: "group",
      center: CLICK.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CLICK.length - 0.1, 0]], CLICK.width)), thickness: 0.06, at: [0, 0, Z_CLICK] },
        { kind: "plate", shape: { outline: [[CLICK.length - 0.12, 0.04], [CLICK.length - 0.12, -0.04], [CLICK.length, 0]], holes: [] }, thickness: 0.145, at: [0, 0, 0.1925] }, // 爪尖
      ],
    },
    { id: "clickSpring", kind: "rod", radius: LEAF_R },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [STRIKING_PINION.center, Pp, PP, GOING_PINION.center], z: Z_FRAME, width: 0.24, boss: 0.16 }),
        { kind: "cylinder", radius: 0.05, length: 0.14, at: [PP[0], PP[1], -0.23] }, // P 的軸,從夾板條伸出
      ],
    },
    { id: "sheaveW", kind: "pulley", style: "disc", radius: RW, width: 0.16 },
    { id: "sheavew", kind: "pulley", style: "disc", radius: Rw, width: 0.14 },
    { id: "weightW", kind: "group", label: "W", labelOffset: [0, -1.05, 0.5], pieces: [{ kind: "box", size: [1.7, 1.0, 0.7], at: [0, -1.05, 0] }, ...hanger(0.55, 0.16).map((p) => ({ ...p, at: [0, -0.55 + p.at[1], p.at[2]] }))] },
    { id: "weightw", kind: "group", label: "w", labelOffset: [0, -0.75, 0.35], pieces: [{ kind: "box", size: [0.45, 0.55, 0.4], at: [0, -0.75, 0] }, ...hanger(0.475, 0.14).map((p) => ({ ...p, at: [0, -0.475 + p.at[1], p.at[2]] }))] },
    { id: "rope", kind: "rope" },
    // a、c 標在交叉點上方(原圖的位置):a 在 P 下到 w 的繩段右邊,c 在棘輪滑輪下到 W 的繩段左邊
    { id: "labelA", kind: "group", center: [0.66, 0.9, 0], label: "a", labelOffset: [0, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-1.95, 0.4, 0], label: "b", labelOffset: [-0.2, 0, 0.3] },
    { id: "labelC", kind: "group", center: [-0.63, 0.9, 0], label: "c", labelOffset: [0, 0, 0.3] },
    { id: "labelD", kind: "group", center: [1.95, 0.3, 0], label: "d", labelOffset: [0.2, 0, 0.3] },
  ],
  // 動力重演:制動爪鉸在報時輪的樁上,由爪簧(線狀零件,重演裡以 spring 代表)與自重壓在棘輪上;上發條時棘輪從爪尖底下
  // 轉過,爪被齒背抬起又落下
  replay: {
    from: 0.7,
    to: 1.05,
    free: { click: { pivot: CLICK.pivot, on: "strikingWheel", spring: 1 } },
    ignore: [["click", "strikingWheel"]],
    expect: [
      { at: 0.85, part: "click", label: "上發條:棘輪在制動爪下方運行,爪搭在齒上", quote: "棘輪滑輪(ratchet-pulley)會在制動爪下方運行" },
      { part: "click", label: "上完發條:爪落回齒根,擋住棘輪" },
    ],
  },
  powered: ["weightW"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.08 },
  target: "goingWheel", // 一刻不失去動力的動力輪
  view: { direction: [0.03, 0.04, 1] },
  pose(p) {
    const c = chain(p);
    const W = [PP[0], c.W, 0];
    const w = [Pp[0], c.w, 0];
    const going = -c.fed / R;
    // 無端繩:P(順時針)→ W 的滑輪 → 棘輪滑輪(逆時針)→ w 的滑輪 → 回到 P
    const loop = routeBelt([
      { center: PP, axis: Z, radius: R, sense: -1 },
      { center: W, axis: Z, radius: RW, sense: -1 },
      { center: Pp, axis: Z, radius: R, sense: 1 },
      { center: w, axis: Z, radius: Rw, sense: 1 },
    ]);
    return {
      parts: {
        goingWheel: { angle: going },
        goingPinion: { angle: meshAngle(GOING, GOING_PINION, going) },
        strikingWheel: { angle: 0 },
        strikingPinion: { angle: meshAngle(STRIKING, STRIKING_PINION, 0) },
        pulleyp: { angle: ratchetAngle(c.wound) },
        click: { angle: clickAngle(p) },
        sheaveW: { position: W, angle: -(c.fed + c.wound) / (2 * RW) },
        sheavew: { position: w, angle: (c.fed + c.wound) / (2 * Rw) },
        weightW: { position: W },
        weightw: { position: w },
      },
      paths: { rope: { points: loop.points, closed: true, phase: c.fed }, clickSpring: { points: leafPoints(p), closed: false } },
      readouts: [],
    };
  },
};
