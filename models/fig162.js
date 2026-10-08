// 第 162 種:水車的調速器,原理與第 161 種相同。調速器由頂部的水平軸經斜齒輪帶動;心軸下部鬆套著兩個裝有凸柱的
// 斜齒輪,同咬左邊下方水平軸上的斜齒輪(它控制水車閘門的升降)。速度正常時兩個齒輪都靜止;
// 速度增加,球飛開、把套筒上的銷往上拉,銷碰到上齒輪的凸柱,上齒輪隨心軸轉,把下方水平軸往抬起閘門的方向轉;
// 速度太低時銷下降、帶動下齒輪,水平軸反向轉。
//
// 主動件是虛擬的「進程」。原文的效果是自動調節,所以播放時速度自己起伏(上游的水量變化):
// 正常 → 過快(球飛開,銷升到上齒輪的凸柱那一層)→ 正常 → 過慢(銷降到下齒輪的凸柱那一層)→ 正常,一輪 12 圈。
// 心軸的轉速跟著起伏(最快 1.25 倍、最慢 0.75 倍;進程 1 是正常速度下心軸轉一圈,一輪之內心軸恰好轉 12 圈)。
// 銷進入凸柱那一層的張角(過快 40°、過慢 22°)取得讓一輪之內上齒輪被推的量與下齒輪被推回的量相等(淨轉角 0),
// 閘門才不會一輪一輪往上爬;一輪之內閘門軸正轉約 2.2 圈又反轉回來。
// 銷隨心軸轉,碰到凸柱才推著齒輪走(由接觸算);離開那一層後齒輪停在原處。兩個鬆套的齒輪同咬水平軸的斜齒輪,
// 所以一個被推著轉時,另一個反向轉。
// 立體化:銷裝在從調速器套筒往下伸的套管上,套管穿過傳動斜齒輪與上齒輪的軸孔(傳動齒輪經套管上的長槽鍵在心軸上,
// 槽沒畫出來;上齒輪鬆套在套管上)。這段套管與兩根水平軸的軸承是推斷(原圖看不出銷怎麼接到套筒)。
// 原圖只畫到兩根水平軸的左端。水車與閘門是推斷,補上是為了看得出這組調速器在調什麼:上方的水平軸由水車帶動
// (軸的左端經一對斜齒輪接到水車的軸,水車立在前面一層,下方是水道);下方的水平軸左端有一支蝸桿,帶動機架柱旁的蝸輪
// (減速),蝸輪軸上的繩鼓捲著繩,繩經兩個滑輪吊著水道上游的閘門——軸往抬起閘門的方向轉時繩捲起、閘門升高,
// 水流變多;反向則閘門放下。上游的水位代表水量的起伏:
// 水位高、水衝得快,調速器過快就把閘門抬起減少進水(原文「減少流向水車的水量」);水位低則相反。
import { Y, X, Z, TAU, deg, wrap, polar, routeRope, sheaveAngle } from "./kit.js";
import { flyBall } from "./governor.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { stream } from "./flow.js";
import { pedestal } from "./supports.js";

const GOV = flyBall({ top: 2.9, arm: 1.95, at: 1.0, link: 1.25, ball: 0.4, range: [deg(16), deg(46)], below: true });
const PERIOD = 12; // 速度起伏一輪,心軸轉的圈數
const ALPHA = { mean: deg(30), swing: deg(12) }; // 球的張角:正常 30°,最快 42°,最慢 18°
const SPEED_SWING = 0.25; // 心軸轉速的起伏:正常 1,最快 1.25,最慢 0.75
const UPPER_Y = -1.0; // 下部兩個鬆套的斜齒輪
const LOWER_Y = -2.0;
const GATE_SHAFT_Y = (UPPER_Y + LOWER_Y) / 2;
const NORMAL_SLEEVE = GOV.geometry(ALPHA.mean).sleeve;
const DROP = NORMAL_SLEEVE - GATE_SHAFT_Y; // 套筒到銷的距離:速度正常時銷在兩齒輪正中
const PIN = { radius: 0.04, from: 0.11, to: 0.27 }; // 徑向的銷
const STUD = { radius: 0.2, half: 0.04, upperBottom: GOV.geometry(deg(40)).sleeve - DROP + PIN.radius, lowerTop: GOV.geometry(deg(22)).sleeve - DROP - PIN.radius };
const CONTACT = (PIN.radius + STUD.half) / STUD.radius; // 銷與凸柱相碰時兩者中心的角距
const SAMPLES = 2400; // 一輪的取樣數

// 傳動:心軸上的斜齒輪(套筒下方)與上方水平軸的斜齒輪;水平軸左端再經一對斜齒輪接到水車的軸(軸朝前,水車在前面一層)
const M = 0.055;
const [CONE_A, CONE_B] = pitchCones(20, 20);
const DRIVE_APEX = [0, -0.2, 0]; // 心軸上的傳動齒輪:在套筒最低處的下面、上齒輪的上面
const SPINDLE_GEAR = bevelGear({ apex: DRIVE_APEX, axis: [0, -1, 0], teeth: 20, radius: 10 * M, cone: CONE_A, width: 0.18 });
const INPUT_GEAR = bevelGear({ apex: DRIVE_APEX, axis: X, teeth: 20, radius: 10 * M, cone: CONE_B, width: 0.18 });
const INPUT_CONTACT = bevelContact(SPINDLE_GEAR, INPUT_GEAR);
const WHEEL_X = -3.9; // 水車在滑輪 A 與吊閘門的繩的左邊,不擋住它們
const WHEEL_APEX = [WHEEL_X, DRIVE_APEX[1], 0];
const INPUT_END_GEAR = bevelGear({ apex: WHEEL_APEX, axis: [-1, 0, 0], teeth: 20, radius: 10 * M, cone: CONE_A, width: 0.18 });
const WHEEL_GEAR = bevelGear({ apex: WHEEL_APEX, axis: Z, teeth: 20, radius: 10 * M, cone: CONE_B, width: 0.18 });
const WHEEL_CONTACT = bevelContact(INPUT_END_GEAR, WHEEL_GEAR);
const POST_X = -2.1; // 左邊的機架柱(兩根水平軸的軸承)

// 水車(下射式)、水道、閘門與吊閘門的繩
const WHEEL = { z: 1.15, rim: 1.05, float: 1.3, floats: 12, width: 0.6 };
const BED = -1.7; // 水道底
const FLUME = { from: -6.8, to: -2.4, z: WHEEL.z, width: 1.1 };
const GATE_X = -5.65;
const GATE = { height: 1.2, open: 0.3 }; // 閘門板高;一輪的起點(剛過慢完)閘門開著 0.3,過快時抬起、過慢時放回
// 吊閘門:下方水平軸左端的蝸桿(左旋)帶動蝸輪,蝸輪的軸上有繩鼓;軸轉 2.2 圈,蝸輪轉 1/6 圈,閘門升 0.3
const WORM = { x: -2.6, radius: 0.1, length: 0.5, pitch: 0.14, thread: 0.03, hand: -1 };
const WINCH_GEAR = { teeth: 14, radius: (14 * 0.14) / TAU, width: 0.14 };
const WINCH = [WORM.x, GATE_SHAFT_Y - WORM.radius - WINCH_GEAR.radius - 0.01, 0]; // 蝸輪在蝸桿下面(齒頂不碰軸)
const DRUM = { r: 0.3, z: 0.4 }; // 繩鼓:在蝸輪前面,繩從它的右側往上(在上方水平軸的前面經過)
const PULLEY = { r: 0.18, y: 1.1, z: DRUM.z };
const PULLEY_A = { center: [WORM.x + DRUM.r - 0.18, PULLEY.y, PULLEY.z], axis: Z, radius: PULLEY.r };
const PULLEY_B = { center: [GATE_X + PULLEY.r, PULLEY.y, PULLEY.z], axis: Z, radius: PULLEY.r };
const HANGER = 1.5; // 閘門底邊到繩端的高度
const HEAD = { x: (FLUME.from + GATE_X) / 2, width: GATE_X - FLUME.from, depth: 0.75, swing: 0.3 }; // 上游的水:水位起伏
const FLOW = [[FLUME.from + 0.2, BED + 0.8, WHEEL.z], [GATE_X - 0.15, BED + 0.2, WHEEL.z], [GATE_X + 0.15, BED + 0.12, WHEEL.z], [WHEEL_X, BED + 0.1, WHEEL.z], [FLUME.to - 0.2, BED + 0.12, WHEEL.z], [FLUME.to + 0.1, BED - 0.05, WHEEL.z], [FLUME.to + 0.25, BED - 0.6, WHEEL.z]];

/** 進程 p:水量的起伏(−1 最少、+1 最多) */
export const surge = (p) => Math.sin((TAU * p) / PERIOD);
/** 進程 p:球的張角(水量起伏造成的速度變化) */
export const alphaAt = (p) => ALPHA.mean + ALPHA.swing * surge(p);
/** 進程 p:心軸的轉角(轉速 1 + SPEED_SWING·surge 的積分;一輪之內恰好轉 PERIOD 圈) */
export const spindleAngle = (p) => TAU * (p - SPEED_SWING * (PERIOD / TAU) * (Math.cos((TAU * p) / PERIOD) - 1));
/** 進程 p:銷的高度 */
export const pinY = (p) => GOV.geometry(alphaAt(p)).sleeve - DROP;
// 蝸桿轉 theta 時,螺紋在蝸桿底部(朝蝸輪)的軸向位置,與蝸輪的轉角(頂端的齒落在兩道螺紋之間;算法見第 31 種)
const crestX = (theta) => -WORM.length / 2 + (WORM.hand * (-Math.PI / 2 - theta) * WORM.pitch) / TAU;
const winchAngle = (theta) => Math.PI / 2 - (crestX(theta) + WORM.pitch / 2) / WINCH_GEAR.radius;
export const studs = STUD;

// 逐步推算:G 是上齒輪的轉角(下齒輪 −G,水平軸跟著轉);銷升到凸柱那一層後,轉到凸柱就推著它走。
// 銷要升進那一層時若正好在凸柱的正下方(或正上方),會被凸柱擋住,等轉過凸柱才升上去(這段時間銷的高度被壓住,
// 銷升降很慢,壓住的量不到 0.01)
function simulate(p0, p1, G0) {
  let G = G0;
  let inUpper = false;
  let inLower = false;
  const out = [];
  const n = Math.round(((p1 - p0) / PERIOD) * SAMPLES);
  for (let i = 0; i <= n; i++) {
    const p = p0 + (i / n) * (p1 - p0);
    const theta = spindleAngle(p);
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
const G0 = TABLE[0].G; // 一輪起點的上齒輪轉角:閘門的高度從這裡量

/** 進程 p:心軸轉角、銷的高度、上齒輪轉角(下齒輪反向)、閘門軸轉角、閘門升起的量與速度狀態(銷在哪一層) */
export function regulator(p) {
  const k = Math.floor(p / PERIOD);
  const x = ((p - k * PERIOD) / PERIOD) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  const G = k * GAIN + a.G + (b.G - a.G) * t; // 齒輪的轉角就是凸柱的位置,不能扣掉起點
  const winch = winchAngle(-G);
  return { spindle: spindleAngle(p), pin: a.y + (b.y - a.y) * t, upper: G, lower: -G, gate: -G, winch, lift: DRUM.r * (winch - winchAngle(-G0)), state: t < 0.5 ? a.state : b.state };
}
/** 進程 p:閘門底邊離水道底的高度(開口) */
export const gateOpening = (p) => GATE.open + regulator(p).lift;

// 鬆套齒輪所在的群組以 Y 為軸(局部 Z 沿心軸),facing = −1 時錐頂朝下
const bevel = (z, facing) => ({ kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, facing], at: [0, 0, z], bore: 0.12 });
// 凸柱:從齒輪的輪轂往銷的那一層伸出(上齒輪往下、下齒輪往上)
const stud = (from, to, angle) => ({ kind: "box", size: [STUD.half * 2, STUD.half * 2, Math.abs(to - from)], at: [STUD.radius * Math.cos(angle), STUD.radius * Math.sin(angle), (from + to) / 2] });
// 繩:從閘門的吊桿頂端(會動的那一頭)經兩個滑輪到繩鼓
const ropeAt = (lift) =>
  routeRope([
    { point: [GATE_X, BED + GATE.open + lift + HANGER, PULLEY.z] },
    { circle: { ...PULLEY_B, sense: -1 } },
    { circle: { ...PULLEY_A, sense: -1 } },
    { circle: { center: [WINCH[0], WINCH[1], DRUM.z], axis: Z, radius: DRUM.r, sense: -1 } },
  ]);
const ROPE_REST = ropeAt(0);
const sheave = (id, g) => ({ id, kind: "pulley", center: g.center, axis: g.axis, radius: g.radius, width: 0.1, arrow: false });
const bevelPiece = (g, facing, at) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, axis: [0, 0, facing], at });

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
        // 傳動斜齒輪:在套筒下方,鍵在心軸上(套管從它的軸孔穿過)
        { ...bevelPiece(SPINDLE_GEAR, -1, [0, 0, SPINDLE_GEAR.center[1]]), bore: 0.12 },
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
      center: INPUT_GEAR.center,
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        bevelPiece(INPUT_GEAR, 1, [0, 0, 0]),
        { kind: "cylinder", radius: 0.07, length: INPUT_GEAR.center[0] - INPUT_END_GEAR.center[0], at: [0, 0, (INPUT_END_GEAR.center[0] - INPUT_GEAR.center[0]) / 2] },
        bevelPiece(INPUT_END_GEAR, -1, [0, 0, INPUT_END_GEAR.center[0] - INPUT_GEAR.center[0]]),
      ],
    },
    {
      // 水車的軸(朝前)與水車:下方的浮板浸在水道裡,水由左往右衝
      id: "wheelShaft",
      kind: "group",
      axis: Z,
      center: [WHEEL_X, WHEEL_APEX[1], 0],
      spin: WHEEL.float + 0.1,
      spinOffset: WHEEL.z,
      pieces: [
        bevelPiece(WHEEL_GEAR, 1, [0, 0, WHEEL_GEAR.center[2]]),
        { kind: "cylinder", radius: 0.08, length: 2.6, at: [0, 0, 0.3] },
        { kind: "pulley", style: "spoked", spokes: 8, radius: WHEEL.rim, width: WHEEL.width, at: [0, 0, WHEEL.z] },
        ...Array.from({ length: WHEEL.floats }, (_, i) => {
          const a = (i * TAU) / WHEEL.floats;
          return { kind: "box", size: [WHEEL.float - WHEEL.rim + 0.1, 0.07, WHEEL.width * 0.9], at: polar((WHEEL.rim + WHEEL.float) / 2 - 0.05, a, WHEEL.z), angle: a };
        }),
      ],
    },
    {
      id: "gateShaft",
      kind: "group",
      axis: X,
      center: [-0.5, GATE_SHAFT_Y, 0],
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.4, at: [0, 0, -1.2] },
        { kind: "worm", radius: WORM.radius, length: WORM.length, pitch: WORM.pitch, thread: WORM.thread, hand: WORM.hand, at: [0, 0, WORM.x + 0.5] }, // 左端的蝸桿
      ],
    },
    {
      // 蝸輪、它的軸與軸上的繩鼓(兩側有凸緣)
      id: "winch",
      kind: "group",
      axis: Z,
      center: WINCH,
      spin: DRUM.r + 0.08,
      spinOffset: DRUM.z,
      pieces: [
        { kind: "gear", teeth: WINCH_GEAR.teeth, radius: WINCH_GEAR.radius, width: WINCH_GEAR.width, bore: 0.1 },
        { kind: "cylinder", radius: 0.05, length: 1.0, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: DRUM.r, length: 0.24, at: [0, 0, DRUM.z] },
        { kind: "cylinder", radius: DRUM.r + 0.06, length: 0.03, at: [0, 0, DRUM.z - 0.135] },
        { kind: "cylinder", radius: DRUM.r + 0.06, length: 0.03, at: [0, 0, DRUM.z + 0.135] },
      ],
    },
    sheave("pulleyA", PULLEY_A),
    sheave("pulleyB", PULLEY_B),
    { id: "rope", kind: "rope" },
    {
      // 閘門:板立在水道裡,頂上的吊桿往後接到繩端
      id: "gate",
      kind: "group",
      center: [GATE_X, BED + GATE.open, 0],
      pieces: [
        { kind: "box", size: [0.1, GATE.height, FLUME.width - 0.24], at: [0, GATE.height / 2, WHEEL.z] },
        { kind: "box", size: [0.1, 0.1, WHEEL.z - PULLEY.z + 0.1], at: [0, GATE.height + 0.05, (WHEEL.z + PULLEY.z) / 2] }, // 吊桿:從閘門頂往後到繩的那一層
        { kind: "box", size: [0.1, HANGER - GATE.height, 0.1], at: [0, (HANGER + GATE.height) / 2, PULLEY.z] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 左邊的機架柱:兩根水平軸的軸承、托著心軸下端的軸承與滑輪 A 的軸(推斷)
        { kind: "cylinder", axis: X, radius: 0.16, inner: 0.07, length: 0.24, at: [POST_X, INPUT_GEAR.center[1], 0] },
        { kind: "cylinder", axis: X, radius: 0.16, inner: 0.07, length: 0.24, at: [POST_X, GATE_SHAFT_Y, 0] },
        { kind: "box", size: [0.22, PULLEY.y + 0.3 + 3.0, 0.22], at: [POST_X, (PULLEY.y + 0.3 - 3.0) / 2, 0] },
        { kind: "box", size: [POST_X - PULLEY_A.center[0], 0.12, 0.12], at: [(PULLEY_A.center[0] + POST_X) / 2, PULLEY.y, -0.1] },
        { kind: "cylinder", radius: 0.04, length: 0.7, at: [PULLEY_A.center[0], PULLEY.y, 0.2] },
        // 蝸輪軸的軸承,由機架柱伸出的臂托著
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.14, at: [WINCH[0], WINCH[1], -0.2] },
        { kind: "box", size: [POST_X - WINCH[0], 0.12, 0.12], at: [(POST_X + WINCH[0]) / 2, WINCH[1], -0.2] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.2, at: [0, -2.5, 0] },
        { kind: "box", size: [-POST_X, 0.12, 0.12], at: [POST_X / 2, -2.5, 0] },
        // 水車軸的軸承座(在水車後面)
        ...pedestal({ at: [WHEEL_X, WHEEL_APEX[1]], z: -0.95, bore: 0.08, floor: -2.6 }),
        // 水道:底、後牆(高)、前牆(低,看得到水)
        { kind: "box", size: [FLUME.to - FLUME.from, 0.2, FLUME.width], at: [(FLUME.from + FLUME.to) / 2, BED - 0.1, FLUME.z] },
        { kind: "box", size: [FLUME.to - FLUME.from, 1.4, 0.1], at: [(FLUME.from + FLUME.to) / 2, BED + 0.7, FLUME.z - FLUME.width / 2 + 0.05] },
        { kind: "box", size: [FLUME.to - FLUME.from, 0.5, 0.1], at: [(FLUME.from + FLUME.to) / 2, BED + 0.25, FLUME.z + FLUME.width / 2 - 0.05] },
        // 閘門旁的立柱,托著滑輪 B 的軸
        { kind: "box", size: [0.14, PULLEY.y + 0.3 - BED, 0.14], at: [GATE_X - 0.2, (PULLEY.y + 0.3 + BED) / 2, -0.16] },
        { kind: "box", size: [PULLEY_B.center[0] - GATE_X + 0.2, 0.12, 0.12], at: [(PULLEY_B.center[0] + GATE_X - 0.2) / 2, PULLEY.y, -0.16] },
        { kind: "cylinder", radius: 0.04, length: 0.7, at: [PULLEY_B.center[0], PULLEY.y, 0.2] },
      ],
    },
    { id: "headWater", kind: "fill", fluid: "water", center: [HEAD.x, BED + 0.65, FLUME.z], size: [HEAD.width, 1.3, FLUME.width - 0.2], level: HEAD.depth / 1.3 },
    { id: "tailWater", kind: "fill", fluid: "water", center: [(GATE_X + FLUME.to) / 2, BED + 0.15, FLUME.z], size: [FLUME.to - GATE_X, 0.3, FLUME.width - 0.2], level: 1 },
  ],
  powered: ["wheelShaft"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "gate",
  view: { direction: [0.2, 0.1, 1] },
  pose(p) {
    const { spindle, pin, upper, lower, gate, winch, lift, state } = regulator(p);
    const input = meshAngle(SPINDLE_GEAR, INPUT_GEAR, -spindle, INPUT_CONTACT); // 心軸齒輪的軸朝下,心軸轉 spindle 是它繞自己的軸轉 −spindle
    const wheel = meshAngle(INPUT_END_GEAR, WHEEL_GEAR, -input, WHEEL_CONTACT); // 水平軸左端的齒輪軸朝左,同理
    const rope = ropeAt(lift);
    return {
      parts: {
        spindle: { angle: spindle },
        inputShaft: { angle: input },
        wheelShaft: { angle: wheel },
        ...GOV.pose(alphaAt(p)),
        pinSleeve: { position: [0, pin, 0], angle: spindle },
        upperGear: { angle: upper },
        lowerGear: { angle: lower },
        gateShaft: { angle: gate },
        winch: { angle: winch },
        gate: { position: [GATE_X, BED + GATE.open + lift, 0] },
        pulleyB: { angle: sheaveAngle(rope, ROPE_REST, 0, { ...PULLEY_B, sense: -1 }) },
        pulleyA: { angle: sheaveAngle(rope, ROPE_REST, 1, { ...PULLEY_A, sense: -1 }) },
        headWater: { level: (HEAD.depth + HEAD.swing * surge(p)) / 1.3 },
      },
      paths: { rope: { points: rope.points, closed: false, phase: -lift } },
      flows: [{ fluid: "water", points: stream(FLOW, WHEEL.float * spindle, { spacing: 0.22 }) }],
      readouts: [{ label: "速度", value: state === "fast" ? "過快:抬起閘門" : state === "slow" ? "過慢:放下閘門" : "正常" }],
    };
  },
};
