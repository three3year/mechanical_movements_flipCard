// 第 121 種:連在碟形輪上的桿做交替直線運動,碟形輪來回擺動;碟形輪上裝的制動爪(click)推動中間的棘輪
// (cog-wheel)做間歇旋轉。把制動爪翻到另一邊,運動就反向。用於刨床等工具的進給運動。
// 主動件是桿(原文的輸入:桿的交替直線運動):桿的上端接在直立導槽裡的滑塊上,主動量是滑塊的累計行程;
// 下端接在碟形輪的銷上,帶碟形輪來回擺 30°。
//
// 接觸:制動爪鉸在碟形輪的銷上,靠自重(加一根小彈簧,推斷)搭在棘輪的齒上。碟形輪往爪尖那一邊擺時,爪尖頂住齒面把棘輪推著走;
// 擺回來時爪背被齒背頂起、滑過齒尖,再靠自重加速落進下一格。棘輪被推多遠、爪擺到哪裡都由接觸算
// (逐步模擬幾個來回,取已經穩定的那一個來回當作週期)。每一程碟形輪擺 30° = 兩個齒距,棘輪每程前進兩齒。
// 碟形輪鬆套在棘輪的軸上,軸後面一個軸承座;桿上端的滑塊與導槽是推斷(原圖的桿伸出畫面外)。
import { deg, swing, polar, TAU } from "./kit.js";
import { gearProfile, shape, circle } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact, pushUntilClear } from "./contact.js";
import { pedestal } from "./supports.js";

const DISC = 2.1;
const COG = { teeth: 24, radius: 1.12 };
const TOOTH = TAU / COG.teeth;
const SWING = deg(30); // 碟形輪擺動的角度(兩個齒距)
const PIN = { r: 1.55, at: deg(-20) }; // 桿接在碟形輪上的位置
const CLICK = { r: 1.62, at: deg(78) }; // 制動爪樞軸在碟形輪上的位置
const HEAD_X = 1.25; // 桿上端的滑塊沿 x = 1.25 的直立導槽上下
const ROD = 3.2;
const COG_PROFILE = gearProfile(COG);

// 制動爪:一端繞樞軸,另一端是削尖、落得進齒溝的爪尖;side = +1 時爪朝順時針方向(推棘輪順時針)
const clickOutline = (side) => [
  [0.0, 0.12],
  [side * 0.55, 0.08],
  [side * 0.7, -0.44],
  [side * 0.64, -0.47],
  [side * 0.38, -0.04],
  [0.0, -0.12],
];

const pinAt = (disc) => polar(PIN.r, PIN.at + disc);
/** 碟形輪轉 disc 時桿上端(滑塊)的高度 */
const headY = (disc) => {
  const [x, y] = pinAt(disc);
  return y + Math.sqrt(ROD * ROD - (HEAD_X - x) ** 2);
};
const TOP = headY(0);
const BOTTOM = headY(-SWING);
/** 滑塊高度 h:碟形輪的轉角(二分法;h 隨轉角單調) */
function discAt(h) {
  let [lo, hi] = [-SWING, 0];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (headY(mid) < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const SPAN = TOP - BOTTOM; // 滑塊的單程行程
const GUIDE_TOP = TOP + 0.45;
/** 主動量 v(滑塊的累計行程):滑塊高度與碟形輪轉角——先往下拉,碟形輪順時針擺 */
export function rodDrive(v) {
  const h = swing(v, TOP, BOTTOM);
  return { h, disc: discAt(h) };
}

const cogAt = (cog) => COG_PROFILE.map(([x, y]) => [x * Math.cos(cog) - y * Math.sin(cog), x * Math.sin(cog) + y * Math.cos(cog)]);
const clickPivot = (disc) => polar(CLICK.r, CLICK.at + disc);
const placed = (side, disc, angle) => placeOutline(clickOutline(side), clickPivot(disc), angle);
const RAISE = deg(25);
// 制動爪從抬起的位置靠自重往齒擺(side = +1 時順時針),停在碰到齒的地方
const rest = (side, disc, cog, from) =>
  swingUntilContact({ pivot: clickPivot(disc), outline: clickOutline(side), from, into: -side, sweep: deg(60), steps: 60 }, [cogAt(cog)]);

// 逐步模擬:碟形輪帶著爪走;往爪尖那一邊擺(推程)時爪壓進齒裡,就把棘輪往前推到剛好不重疊;
// 之後爪靠自重落到碰到齒的位置——離開齒尖後是加速落下(每一步速度增加 FALL,不是一下子跳過去)
const SAMPLES = 600; // 一個來回(主動量 2·SPAN)的取樣數
const FALL = 0.0016; // 落下時每一步增加的角速度(弧度 / 步)
function simulate(side) {
  let cog = 0;
  let prev = rodDrive(0).disc;
  let rel = RAISE * side; // 爪相對碟形輪的轉角(以「爪垂直於半徑」為 0)
  let speed = 0;
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const v = (2 * SPAN * i) / SAMPLES;
    const { disc } = rodDrive(v);
    const base = CLICK.at + disc - Math.PI / 2;
    const pushing = (disc - prev) * side < 0;
    if (pushing) {
      // 推的量不超過這一步碟形輪擺過的角度(加一點餘裕);超過就表示爪不是頂在齒面上
      const pushed = pushUntilClear(0, 1, Math.abs(disc - prev) + 1e-4, (d) => polygonsOverlap(placed(side, disc, base + rel), cogAt(cog - side * d)));
      cog -= side * pushed;
    }
    // 爪靠在齒上的轉角(從抬起的位置往下擺到碰到齒)
    const target = rest(side, disc, cog, base + rel + side * RAISE) - base;
    if ((rel - target) * side > 1e-6) {
      // 爪懸空:加速往下落,碰到就停
      speed += FALL;
      rel = side > 0 ? Math.max(target, rel - speed) : Math.min(target, rel + speed);
      if (rel === target) speed = 0;
    } else {
      rel = target; // 被齒背頂起(由接觸推動)
      speed = 0;
    }
    prev = disc;
    run.push({ cog, rel });
  }
  // 每個來回推進整數個齒距;逐步推開時累積的微小誤差按比例攤掉,播久了才不會越差越多
  const table = run.slice(2 * SAMPLES);
  const raw = table[SAMPLES].cog - table[0].cog;
  const advance = Math.round(raw / TOOTH) * TOOTH;
  const c0 = table[0].cog;
  // 平移整數個齒距(齒形看起來不變),讓主動量 0 時棘輪的轉角接近 0
  return { table: table.map((s) => ({ ...s, cog: c0 + ((s.cog - c0) * advance) / raw })), advance, c0: Math.round(c0 / TOOTH) * TOOTH };
}
const TABLES = { 1: simulate(1), [-1]: simulate(-1) };

function lookup(v, side) {
  const { table, advance, c0 } = TABLES[side];
  const period = 2 * SPAN;
  const k = Math.floor(v / period);
  const x = ((v - k * period) / period) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [table[i], table[i + 1]];
  return { cog: k * advance + a.cog + (b.cog - a.cog) * t - c0, rel: a.rel + (b.rel - a.rel) * t };
}

/** 主動量 v、制動爪方向:碟形輪、棘輪的轉角與爪相對碟形輪的轉角 */
export function feed(v, side) {
  const { h, disc } = rodDrive(v);
  const { cog, rel } = lookup(v, side);
  return { h, disc, cog, rel };
}
export const swingAngle = SWING;
export const stroke = SPAN;
export const toothPitch = TOOTH;
/** 姿勢下制動爪與棘輪的外形(世界座標 2D),測試檢查接觸不穿入用 */
export function contactShapes(v, side) {
  const { disc, cog, rel } = feed(v, side);
  return { click: placed(side, disc, CLICK.at + disc - Math.PI / 2 + rel), cog: cogAt(cog) };
}

export default {
  figure: 121,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [circle(1.4).reverse()]), thickness: 0.1, at: [0, 0, -0.15] },
        { kind: "plate", shape: shape(circle(1.4), [circle(0.19).reverse()]), thickness: 0.06, at: [0, 0, -0.18] }, // 鬆套在軸上
        { kind: "cylinder", radius: 0.2, length: 0.4, at: [...polar(PIN.r, PIN.at).slice(0, 2), 0.05], accent: true },
        { kind: "cylinder", radius: 0.1, length: 0.35, at: [...polar(CLICK.r, CLICK.at).slice(0, 2), 0.05] },
      ],
    },
    {
      id: "cog",
      kind: "gear",
      teeth: COG.teeth,
      radius: COG.radius,
      width: 0.2,
      bore: 0.18,
      pieces: [
        { kind: "cylinder", radius: 0.45, inner: 0.3, length: 0.26 },
        { kind: "cylinder", radius: 0.18, length: 1.1, at: [0, 0, -0.35] }, // 軸:穿過碟形輪,後端在軸承座裡
      ],
    },
    { id: "click", kind: "plate", shape: shape(clickOutline(1), [circle(0.07).reverse()]), thickness: 0.1, arrow: false, posed: true },
    { id: "clickR", kind: "plate", shape: shape(clickOutline(-1), [circle(0.07).reverse()]), thickness: 0.1, arrow: false, posed: true },
    { id: "rod", kind: "link", width: 0.24, thickness: 0.1 },
    { id: "head", kind: "box", size: [0.42, 0.3, 0.2] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.18, floor: -DISC - 0.3 }),
        // 桿上端滑塊的直立導槽,由右邊的立柱撐著
        // 導槽的兩根直條只從滑塊最低處往上(不伸到制動爪那一層的高度)
        { kind: "box", size: [0.08, GUIDE_TOP - BOTTOM + 0.2, 0.2], at: [HEAD_X - 0.25, (GUIDE_TOP + BOTTOM - 0.2) / 2, 0.25] },
        { kind: "box", size: [0.08, GUIDE_TOP - BOTTOM + 0.2, 0.2], at: [HEAD_X + 0.25, (GUIDE_TOP + BOTTOM - 0.2) / 2, 0.25] },
        { kind: "box", size: [2.4 - HEAD_X + 0.29, 0.12, 0.2], at: [(HEAD_X - 0.29 + 2.4) / 2, GUIDE_TOP + 0.06, 0.25] },
        { kind: "box", size: [0.2, GUIDE_TOP + 0.12 + DISC + 0.3, 0.2], at: [2.4, (GUIDE_TOP + 0.12 - DISC - 0.3) / 2, 0.25] },
        { kind: "box", size: [0.8, 0.18, 0.6], at: [2.4, -DISC - 0.39, 0.25] },
      ],
    },
  ],
  driver: { part: "rod", type: "translation", direction: [0, 1, 0], cycle: [TOP, BOTTOM], grips: ["head"] },
  target: "cog", // 間歇旋轉的棘輪
  states: {
    options: [
      { id: "cw", label: "制動爪朝右(順時針進給)" },
      { id: "ccw", label: "翻轉制動爪(逆時針進給)" },
    ],
    initial: "cw",
  },
  // 動力重演:只推桿;棘輪靠摩擦定位,制動爪鉸在碟形輪的銷上,自重加上一根小彈簧把它壓在齒上
  replay: {
    free: { cog: { hold: true }, click: { pivot: [...clickPivot(rodDrive(0).disc), 0.12], on: "disc", spring: -1 } },
    to: 4 * SPAN,
    seconds: 20,
    // 棘輪的軸穿過碟形輪的孔(碟形輪鬆套在軸上,兩者之間的摩擦不算);桿只在銷上接碟形輪,和棘輪、制動爪不同層
    ignore: [["cog", "disc"], ["rod", "cog"], ["rod", "click"]],
    expect: [
      { at: SPAN, part: "cog", label: "桿往下拉,碟形輪順時針擺,爪頂住齒把棘輪推過兩齒", quote: "透過連接於碟形輪上的制動爪(click),會產生棘輪(cog-wheel)的間歇旋轉運動" },
      { at: 2 * SPAN, part: "cog", label: "桿推回去,爪滑過齒背,棘輪不動" },
      { part: "cog", label: "下一程再推過兩齒" },
    ],
  },
  view: { direction: [0.06, 0.05, 1], fit: ["disc", "cog"] },
  waivers: [
    {
      check: "replay",
      parts: ["cog"],
      reason:
        "棘輪的齒必須是對稱的(原文:翻轉制動爪就反向,鋸齒只能朝一個方向推),制動爪靠自重與彈簧往齒溝裡壓時,斜的齒面把棘輪往回頂(楔形作用);重演的「摩擦定位」是黏滯阻尼(速度越快阻力越大),擋不住這個一直存在的小力矩," +
        "棘輪一開始就被慢慢推回、爪推不到齒面(拿掉定位阻尼試過,推回得更快)。實物的棘輪接著刨床的進給螺桿,靠靜摩擦擋住;原書沒有摩擦的資料。" +
        "爪推齒的接觸改由測試檢查:每個來回推兩齒、回程不動、爪不穿進齒",
    },
  ],
  pose(v, state = "cw") {
    const side = state === "cw" ? 1 : -1;
    const { h, disc, cog, rel } = feed(v, side);
    const pivot = clickPivot(disc);
    const angle = CLICK.at + disc - Math.PI / 2 + rel;
    const pin = polar(PIN.r, PIN.at + disc, 0.25);
    return {
      parts: {
        disc: { angle: disc },
        cog: { angle: cog },
        click: { position: [pivot[0], pivot[1], 0.12], angle, visible: side > 0 },
        clickR: { position: [pivot[0], pivot[1], 0.12], angle, visible: side < 0 },
        rod: { from: pin, to: [HEAD_X, h, 0.25] },
        head: { position: [HEAD_X, h, 0.25] },
      },
      readouts: [],
    };
  },
};
