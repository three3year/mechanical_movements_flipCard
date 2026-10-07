// 第 162 種:水車的調速器,原理與第 161 種相同。調速器由頂部的水平軸經斜齒輪帶動;心軸下部鬆套著兩個裝有凸柱的
// 斜齒輪,同咬左邊下方水平軸上的斜齒輪(它控制水車閘門的升降)。速度正常時兩個齒輪都靜止;
// 速度增加,球飛開、把套筒上的銷往上拉,銷碰到上齒輪的凸柱,上齒輪隨心軸轉,把下方水平軸往抬起閘門的方向轉;
// 速度太低時銷下降、帶動下齒輪,水平軸反向轉。
//
// 主動件是虛擬的「進程」(心軸已轉了幾圈)。原文的效果是自動調節,所以播放時速度自己起伏(水量變化):
// 正常 → 過快(球飛開,銷升到上齒輪的凸柱那一層)→ 正常 → 過慢(銷降到下齒輪的凸柱那一層)→ 正常,一輪 12 圈。
// 銷隨心軸轉,碰到凸柱才推著齒輪走(由接觸算);離開那一層後齒輪停在原處。兩個鬆套的齒輪同咬水平軸的斜齒輪,
// 所以一個被推著轉時,另一個反向轉。
// 立體化:銷裝在從調速器套筒往下伸的套管上,套管穿過上齒輪的軸孔(上齒輪鬆套在套管上)。這段套管與頂部、
// 左側兩根軸的軸承是推斷(原圖看不出銷怎麼接到套筒)。
import { Y, X, TAU, deg } from "./kit.js";
import { flyBall } from "./governor.js";

const GOV = flyBall({ top: 2.9, arm: 1.95, at: 1.0, link: 1.25, ball: 0.4, range: [deg(16), deg(46)], below: true });
const PERIOD = 12; // 速度起伏一輪,心軸轉的圈數
const ALPHA = { mean: deg(30), swing: deg(12) }; // 球的張角:正常 30°,最快 42°,最慢 18°
const INPUT_Y = 3.2; // 心軸頂端的斜齒輪(由頂部的水平軸帶動)
const UPPER_Y = -0.75; // 下部兩個鬆套的斜齒輪
const LOWER_Y = -1.75;
const NORMAL_SLEEVE = GOV.geometry(ALPHA.mean).sleeve;
const DROP = NORMAL_SLEEVE - (UPPER_Y + LOWER_Y) / 2; // 套筒到銷的距離:速度正常時銷在兩齒輪正中
const PIN = { radius: 0.04, from: 0.11, to: 0.27 }; // 徑向的銷
const STUD = { radius: 0.2, half: 0.04, upperBottom: GOV.geometry(deg(35)).sleeve - DROP + PIN.radius, lowerTop: GOV.geometry(deg(25)).sleeve - DROP - PIN.radius };
const CONTACT = (PIN.radius + STUD.half) / STUD.radius; // 銷與凸柱相碰時兩者中心的角距
const SAMPLES = 2400; // 一輪的取樣數

/** 進程 p:球的張角(水量起伏造成的速度變化) */
export const alphaAt = (p) => ALPHA.mean + ALPHA.swing * Math.sin((TAU * p) / PERIOD);
/** 進程 p:銷的高度 */
export const pinY = (p) => GOV.geometry(alphaAt(p)).sleeve - DROP;
export const studs = STUD;

// 逐步推算:G 是上齒輪的轉角(下齒輪 −G,水平軸跟著轉);銷升到凸柱那一層後,轉到凸柱就推著它走。
// 銷要升進那一層時若正好在凸柱的正下方(或正上方),會被凸柱擋住,等轉過凸柱才升上去(這段時間銷的高度被壓住,
// 銷升降很慢,壓住的量不到 0.01)
const wrap = (a) => ((a % TAU) + TAU) % TAU;
function simulate(p0, p1, G0) {
  let G = G0;
  let inUpper = false;
  let inLower = false;
  const out = [];
  const n = Math.round(((p1 - p0) / PERIOD) * SAMPLES);
  for (let i = 0; i <= n; i++) {
    const p = p0 + (i / n) * (p1 - p0);
    const theta = TAU * p;
    let y = pinY(p);
    // 上齒輪的凸柱在局部角 0(轉角 G);下齒輪的凸柱在局部角 π(轉角 π − G)。ahead:凸柱在銷前方多遠
    const aheadUp = wrap(G - theta);
    const aheadDown = wrap(Math.PI - G - theta);
    const clear = (ahead) => ahead >= CONTACT && ahead <= TAU - CONTACT;
    if (y + PIN.radius > STUD.upperBottom) {
      if (!inUpper && clear(aheadUp)) inUpper = true;
      if (!inUpper) y = STUD.upperBottom - PIN.radius - 1e-3;
    } else inUpper = false;
    if (y - PIN.radius < STUD.lowerTop) {
      if (!inLower && clear(aheadDown)) inLower = true;
      if (!inLower) y = STUD.lowerTop + PIN.radius + 1e-3;
    } else inLower = false;
    if (inUpper && aheadUp < CONTACT) G += CONTACT - aheadUp;
    if (inLower && aheadDown < CONTACT) G -= CONTACT - aheadDown;
    out.push({ G, y, state: inUpper ? "fast" : inLower ? "slow" : "normal" });
  }
  return out;
}
// 先走一輪讓起點的凸柱位置落定,再取一輪當週期
const { TABLE, GAIN } = (() => {
  const warm = simulate(0, PERIOD, 0);
  const table = simulate(0, PERIOD, warm[warm.length - 1].G);
  return { TABLE: table, GAIN: table[table.length - 1].G - table[0].G };
})();

/** 進程 p:心軸轉角、銷的高度、上齒輪轉角(下齒輪反向)、閘門軸轉角與速度狀態(銷在哪一層) */
export function regulator(p) {
  const k = Math.floor(p / PERIOD);
  const x = ((p - k * PERIOD) / PERIOD) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  const G = k * GAIN + a.G + (b.G - a.G) * t; // 齒輪的轉角就是凸柱的位置,不能扣掉起點
  return { spindle: TAU * p, pin: a.y + (b.y - a.y) * t, upper: G, lower: -G, gate: -G, state: t < 0.5 ? a.state : b.state };
}

// 鬆套齒輪所在的群組以 Y 為軸(局部 Z 沿心軸),facing = −1 時錐頂朝下
const bevel = (z, facing) => ({ kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, facing], at: [0, 0, z], bore: 0.12 });
// 凸柱:從齒輪的輪轂往銷的那一層伸出(上齒輪往下、下齒輪往上)
const stud = (from, to, angle) => ({ kind: "box", size: [STUD.half * 2, STUD.half * 2, Math.abs(to - from)], at: [STUD.radius * Math.cos(angle), STUD.radius * Math.sin(angle), (from + to) / 2] });

export default {
  figure: 162,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.3,
      spinOffset: 1.5,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 5.6, at: [0, 0, 0.55] },
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, INPUT_Y] },
      ],
    },
    ...GOV.parts(),
    {
      id: "pinSleeve",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.11, length: DROP - 0.08, at: [0, 0, (DROP - 0.08) / 2 - 0.02] }, // 套管:從銷往上接到調速器的套筒
        { kind: "cylinder", axis: X, radius: PIN.radius, length: PIN.to - PIN.from, at: [(PIN.from + PIN.to) / 2, 0, 0], accent: false },
      ],
    },
    // 兩個鬆套的斜齒輪:上面的錐頂朝下、下面的錐頂朝上,中間夾著水平軸的斜齒輪
    { id: "upperGear", kind: "group", center: [0, UPPER_Y, 0], axis: Y, spin: 0.55, pieces: [bevel(0, -1), stud(-0.08, STUD.upperBottom - UPPER_Y, 0)] },
    { id: "lowerGear", kind: "group", center: [0, LOWER_Y, 0], axis: Y, spin: 0.55, pieces: [bevel(0, 1), stud(0.08, STUD.lowerTop - LOWER_Y, Math.PI)] },
    {
      id: "inputShaft",
      kind: "group",
      axis: X,
      center: [-0.5, INPUT_Y + 0.5, 0],
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -1.0] },
      ],
    },
    {
      id: "gateShaft",
      kind: "group",
      axis: X,
      center: [-0.5, (UPPER_Y + LOWER_Y) / 2, 0],
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -1.0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩根水平軸遠端的軸承,與托著心軸下端的軸承,都立在左邊的機架柱上(推斷)
        { kind: "cylinder", axis: X, radius: 0.16, inner: 0.07, length: 0.2, at: [-2.1, INPUT_Y + 0.5, 0] },
        { kind: "cylinder", axis: X, radius: 0.16, inner: 0.07, length: 0.2, at: [-2.1, (UPPER_Y + LOWER_Y) / 2, 0] },
        { kind: "box", size: [0.22, INPUT_Y + 0.5 + 3.0, 0.22], at: [-2.3, (INPUT_Y + 0.5 - 3.0) / 2, 0] },
        { kind: "box", size: [0.2, 0.12, 0.12], at: [-2.2, INPUT_Y + 0.5, 0] },
        { kind: "box", size: [0.2, 0.12, 0.12], at: [-2.2, (UPPER_Y + LOWER_Y) / 2, 0] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.2, at: [0, -2.5, 0] },
        { kind: "box", size: [2.3, 0.12, 0.12], at: [-1.15, -2.5, 0] },
      ],
    },
  ],
  powered: ["inputShaft"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "gateShaft",
  view: { direction: [0.2, 0.08, 1] },
  pose(p) {
    const { spindle, pin, upper, lower, gate, state } = regulator(p);
    return {
      parts: {
        spindle: { angle: spindle },
        inputShaft: { angle: spindle }, // 頂端的斜齒輪錐頂朝上、水平軸在它上方(與下方水平軸的配置上下相反)
        ...GOV.pose(alphaAt(p)),
        pinSleeve: { position: [0, pin, 0], angle: spindle },
        upperGear: { angle: upper },
        lowerGear: { angle: lower },
        gateShaft: { angle: gate },
      },
      readouts: [{ label: "速度", value: state === "fast" ? "過快:抬起閘門" : state === "slow" ? "過慢:放下閘門" : "正常" }],
    };
  },
};
