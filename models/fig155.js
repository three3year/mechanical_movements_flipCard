// 第 155 種:往復直線運動轉換為間歇的圓周運動。肘節槓桿套在齒輪的軸上擺動,右臂接著上下往復的桿,
// 上臂頂端鉸著棘爪,爪尖靠自重落在齒輪的齒間。桿往一個方向動時棘爪推動齒輪,往回時爪背沿齒頂滑過、
// 落進下一個齒間;依棘爪作用在哪一側(爪尖朝右或朝左),齒輪朝相反的方向轉。用於刨床等工具的進給運動。
// 主動量是桿的累計行程(見 kit.swing)。
//
// 接觸:棘爪是鉸在上臂銷上的自由零件,爪尖的前面沿齒輪的半徑方向(推得住齒),爪背斜(往回時被齒頂推開)。
// 每一步先讓爪尖推齒(推程時齒輪被推到剛好不重疊),再讓棘爪靠自重擺回、停在碰到齒的位置;
// 齒輪每程被推多遠、棘爪何時滑過齒頂落進下一格,都由兩者的外形算出。齒輪沒被推時靠軸上的摩擦停住。
// 原圖的棘爪是一個可以翻面的雙頭爪;模型把兩個方向畫成兩個棘爪,依狀態只顯示一個。
import { swing, rot2 } from "./kit.js";
import { gearProfile, shape, circle } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact } from "./contact.js";

const GEAR = { teeth: 28, radius: 1.9 };
const ARM = 2.15; // 右臂(接桿處)離軸心的距離
const PITCH = (2 * Math.PI) / GEAR.teeth;
const SWING = 2.5 * PITCH; // 槓桿每程擺過兩齒半:回程時爪尖滑過兩個齒、落進齒間,推程先空走一段再推兩齒
const STROKE = 2 * ARM * Math.sin(SWING / 2);
const TOP = 2.35; // 棘爪樞軸離軸心的距離
const LAYER = 0.07; // 棘爪的中層(齒輪在 z = 0,槓桿在 0.3)
const FALL = 3e-4; // 棘爪落下的角加速度(每一取樣步的平方):落進齒間約要播放時的 6 格

// 棘爪的輪廓(右爪,局部座標以樞軸為原點、未擺動時):長爪往右下伸,爪尖窄、落在樞軸右下方的齒間——
// 爪身接近順著齒輪的圓周,靠自重擺下時爪尖幾乎沿半徑往內落。A→B 是沿齒輪半徑的前面(推得住齒),
// F→A′ 是斜 60° 的爪背(回程時被齒頂推開)
const RIGHT = [
  [0.577, -0.666], // A 爪尖前緣
  [0.687, -0.344], // B
  [0.45, -0.02],
  [0.05, 0.13],
  [-0.13, 0.07],
  [-0.12, -0.08],
  [0.25, -0.23],
  [0.414, -0.378], // F
  [0.463, -0.627], // A′ 爪尖後緣
];
const outline = (side) => (side > 0 ? RIGHT : RIGHT.map(([x, y]) => [-x, y]).reverse());

// 齒輪的外形拆成一顆顆的齒(齒 0 的中心在局部 +X),加上齒根圓;只取棘爪附近的齒來算接觸
const toothRing = gearProfile(GEAR);
const TOOTH = [...toothRing.filter(([x, y]) => Math.abs(Math.atan2(y, x)) <= PITCH / 2 + 1e-9).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])), [1.5 * Math.cos(PITCH / 2), 1.5 * Math.sin(PITCH / 2)], [1.5 * Math.cos(PITCH / 2), -1.5 * Math.sin(PITCH / 2)]];
const ROOT = circle(GEAR.radius - 0.17, 0, 0, 72);
/** 齒輪轉 angle 時,中心角在 near 附近(±2 齒)的齒:{ i, at(齒中心的角), poly } */
function teethAt(angle, near) {
  const k = Math.round((near - angle) / PITCH);
  return [-2, -1, 0, 1, 2].map((d) => {
    const at = angle + (k + d) * PITCH;
    return { at, poly: TOOTH.map((p) => rot2(p, at)) };
  });
}
const gearAt = (angle, near = Math.PI / 2) => [ROOT, ...teethAt(angle, near).map((t) => t.poly)];
const pivotAt = (lever) => rot2([0, TOP], lever);
const leverAt = (v) => Math.asin(swing(v, STROKE / 2, -STROKE / 2) / ARM); // 桿從高處往下

/** 一側的棘爪走過主動量:每一步先推齒、再讓棘爪靠自重落定 */
function run(side, cycles, samples) {
  const into = -side; // 右爪的重心在樞軸右邊,自重讓它順時針擺(爪尖往下壓);左爪相反
  const sweep = 0.5;
  let gear = 0;
  let pawl = 0;
  let prev = leverAt(0);
  let falling = 0;
  const out = [];
  for (let i = 0; i <= cycles * samples; i++) {
    const v = (2 * STROKE * i) / samples;
    const lever = leverAt(v);
    const pivot = pivotAt(lever);
    // 棘爪隨槓桿一起轉(相對槓桿的角度不變);推程時若爪尖的前面頂到齒,齒輪跟著槓桿轉同樣的角度——
    // 兩者一起轉,接觸處不再互相擠入。右爪在槓桿往順時針擺(轉角減少)時推,左爪相反
    const driving = side > 0 ? lever < prev : lever > prev;
    pawl += lever - prev;
    // 頂到的必須是爪尖前方的齒(右爪推的是右邊、也就是順時針方向那一顆);爪背擦著後方的齒不算
    const poly = placeOutline(outline(side), pivot, pawl);
    const tip = Math.atan2(poly[0][1], poly[0][0]);
    if (driving && teethAt(gear, tip).some((t) => -side * (t.at - tip) > 0 && polygonsOverlap(poly, t.poly))) gear += lever - prev;
    // 棘爪靠自重往齒輪擺,停在碰到齒的地方;被齒頂(或回程時的齒)擋住時先往外退開
    // 往下落時不是瞬間到位:從滑過齒頂起加速落下(每一步多落 FALL),碰到東西就停;被擠開的退讓則立即生效
    const rest = swingUntilContact({ pivot, outline: outline(side), from: pawl, into, sweep, steps: 40 }, gearAt(gear, tip));
    if (into * (rest - pawl) > 1e-6) {
      falling += FALL;
      pawl += into * Math.min(into * (rest - pawl), falling);
    } else [pawl, falling] = [rest, 0];
    prev = lever;
    out.push({ gear, pawl });
  }
  return out;
}

// 走三個來回,取最後一個來回當週期;每個來回推進整數個齒,逐步推開的微小誤差按比例攤掉
const SAMPLES = 480;
function table(side) {
  const all = run(side, 3, SAMPLES);
  const t = all.slice(2 * SAMPLES);
  const raw = t[SAMPLES].gear - t[0].gear;
  const advance = Math.round(raw / PITCH) * PITCH;
  return { rows: t.map((r) => ({ gear: t[0].gear + ((r.gear - t[0].gear) * advance) / raw, pawl: r.pawl })), advance, start: t[0].gear };
}
const TABLES = { 1: table(1), [-1]: table(-1) };

function lookup(v, side) {
  const T = TABLES[side];
  const period = 2 * STROKE;
  const k = Math.floor(v / period);
  const x = ((v - k * period) / period) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [T.rows[i], T.rows[i + 1]];
  return { gear: k * T.advance + a.gear + (b.gear - a.gear) * t - T.start, pawl: a.pawl + (b.pawl - a.pawl) * t };
}

/** 主動量 v(桿的累計行程)、棘爪方向:槓桿、齒輪(自起點)與棘爪的轉角 */
export function feed(v, side) {
  const lever = leverAt(v);
  const { gear, pawl } = lookup(v, side);
  return { lever, gear, pawl, y: ARM * Math.sin(lever) };
}
/** 每個來回齒輪轉過的角度(帶正負號) */
export const advance = (side) => TABLES[side].advance;
export const step = PITCH;
export const stroke = STROKE;
/** 檢查用:主動量 v 時棘爪與齒輪的外形(世界座標 2D) */
export function contactAt(v, side) {
  const { lever, gear, pawl } = feed(v, side);
  const poly = placeOutline(outline(side), pivotAt(lever), pawl);
  return { pawl: poly, gear: gearAt(gear + TABLES[side].start, Math.atan2(poly[0][1], poly[0][0])) };
}

const pawlPart = (id, side) => ({
  id,
  kind: "group",
  center: [0, TOP, LAYER],
  arrow: false,
  pieces: [{ kind: "plate", shape: shape(outline(side), [circle(0.1).reverse()]), thickness: 0.32 }], // 從齒輪那一層往前伸到槓桿的背面
});

export default {
  figure: 155,
  parts: [
    { id: "gear", kind: "gear", teeth: GEAR.teeth, radius: GEAR.radius, width: 0.22, bore: 0.3, hub: false, pieces: [{ kind: "cylinder", radius: 1.45, inner: 1.38, length: 0.24 }] },
    {
      id: "lever",
      kind: "group",
      center: [0, 0, 0.3],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.55, -0.45], [ARM, -0.25], [ARM, 0.25], [0.65, 0.35], [0.4, TOP], [-0.4, TOP], [-0.6, 0.3]], [circle(0.45).reverse(), circle(0.12, ARM, 0).reverse(), circle(0.12, 0, TOP).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.6, inner: 0.45, length: 0.2 },
        { kind: "cylinder", radius: 0.09, length: 0.5, at: [0, TOP, -0.17] }, // 棘爪的樞軸銷:往後穿過棘爪
      ],
    },
    pawlPart("pawlRight", 1),
    pawlPart("pawlLeft", -1),
    { id: "axle", kind: "cylinder", radius: 0.29, length: 0.9, center: [0, 0, 0.1] }, // 齒輪與槓桿共用的固定軸(原圖沒畫,推斷)
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.3, 2.6, 0.12], at: [0, 1.4, 0] }, { kind: "cylinder", radius: 0.26, inner: 0.12, length: 0.18 }] },
  ],
  // 動力重演:只推桿;齒輪在軸上靠摩擦定位,棘爪鉸在上臂的銷上、靠自重搭在齒上,推齒與滑過齒頂都由接觸決定
  replay: {
    free: {
      gear: { hold: true, gravity: false },
      pawlRight: { on: "lever", pivot: [...pivotAt(leverAt(0)), LAYER] },
    },
    expect: [
      { at: STROKE, part: "gear", label: "桿往下一程,棘爪推齒輪順時針轉", quote: "透過裝設於肘節槓桿上、作動於齒形輪內的棘爪來達成" },
      { at: 2 * STROKE, part: "gear", label: "桿往上回程,棘爪滑過齒背,齒輪停住" },
      { at: 4 * STROKE, part: "gear", label: "第二個來回,齒輪再被推一次" },
    ],
    to: 4 * STROKE,
    seconds: 20,
  },
  driver: { part: "rod", type: "translation", direction: [0, -1, 0], cycle: [0, STROKE] },
  target: "gear",
  states: {
    options: [
      { id: "cw", label: "棘爪在右側(順時針)" },
      { id: "ccw", label: "棘爪在左側(逆時針)" },
    ],
    initial: "cw",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(v, state = "cw") {
    const side = state === "cw" ? 1 : -1;
    const { lever, gear, pawl } = feed(v, side);
    const end = rot2([ARM, 0], lever);
    const pivot = pivotAt(lever);
    const start = TABLES[side].start;
    return {
      parts: {
        gear: { angle: gear + start },
        lever: { angle: lever },
        pawlRight: { position: [...pivot, LAYER], angle: pawl, visible: side > 0 },
        pawlLeft: { position: [...pivot, LAYER], angle: pawl, visible: side < 0 },
        rod: { position: [end[0], end[1], 0.45] },
      },
      readouts: [],
    };
  },
};
