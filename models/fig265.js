// 第 265 種:變速運動。內凹的圓錐形鼓輪以規則的圓周運動轉動,摩擦滾子壓在鼓輪頂上,沿鼓輪的長度方向
// 來回橫移;滾子在粗的一端轉得快、在細的一端轉得慢,得到變速的旋轉運動。
// 主動件是鼓輪。原圖穿過滾子中心、往右下斜的細直線是滾子的軸:滾子用滑鍵套在這根斜的輸出軸上,
// 跟著軸轉、可以沿軸滑;軸的右端鉸在機架上,左端由重物壓著,滾子因此壓在鼓面上,軸隨鼓面的凹弧上下擺
// (傾角由滾子和鼓面的接觸算)。一支撥叉夾在滾子輪轂的兩片凸緣之間,推滾子沿軸橫移。
// 推斷:撥叉照主動量走(鼓輪轉 TRAVERSE 圈走完一趟;原文只說使滾子沿長度方向橫移,沒說怎麼推);
// 擺架(兩端的軸承、導桿、重物)、滾子輪轂上夾撥叉的兩片凸緣、樞軸的支架、輸出軸右端的小皮帶輪;鼓輪的輪廓;鼓輪軸的軸承。
// 偏離插圖:樞軸比原圖斜線的右端低、離鼓輪近一些(輸出軸傾角約 14–17°,原圖約 13°)——滾子走到細端時,
// 軸往左上仍要從粗端的上方越過、不碰鼓面(實物可行優先於插圖外形)。
import { X, Z, TAU, swing, quatFromZ, quatAxisAngle, quatMul, add, scale } from "./kit.js";
import { swingUntilContact } from "./contact.js";

const LEN = 3.4;
const R = { big: 1.45, small: 0.62 };
const ROLLER = 0.42;
const WIDTH = 0.1; // 滾子窄:鼓面有斜度,寬的滾子邊緣會陷進鼓面
const SHAFT = 0.06; // 輸出軸半徑
const TRAVERSE = 6; // 鼓輪轉幾圈,滾子橫移一趟
const PIVOT = [3.3, 0.45]; // 擺架的樞軸(輸出軸的右端),在鼓輪細端的右下方,照原圖那條斜線的走向
const D = [2.0, 4.8]; // 滾子中心離樞軸的距離(沿軸):細端到粗端
const GROOVE = -0.22; // 輪轂上兩片凸緣之間的溝(撥叉在溝裡),在滾子靠樞軸的一側
const BAR = 0.62; // 擺架的導桿在輸出軸上方多高(撥叉的滑套套在上面)
const END = D[1] + 0.5; // 擺架左端的軸承(離樞軸)
const STUB = -0.45; // 輸出軸伸出樞軸外的一段(裝小皮帶輪)

/** 鼓輪在 x 處的半徑:左粗右細、母線內凹 */
export const drumRadius = (x) => {
  const f = (x + LEN / 2) / LEN;
  return R.small + (R.big - R.small) * (1 - f) ** 2;
};

// 鼓輪在軸線所在的直立面上的斷面(上半),作為滾子靠上去的障礙物
const DRUM = [[-LEN / 2, 0], ...Array.from({ length: 201 }, (_, i) => [-LEN / 2 + (i / 200) * LEN, drumRadius(-LEN / 2 + (i / 200) * LEN)]), [LEN / 2, 0]];

/**
 * 滾子在離樞軸 d 處時擺架的傾角:擺架(局部 −X 沿輸出軸)被重物壓著往下擺(逆時針),停在滾子斷面碰到鼓面時。
 * 回傳傾角 tilt(輸出軸往右下斜的角度)與接觸處鼓面的半徑。
 */
function seat(d) {
  const outline = [[-d - WIDTH / 2, -ROLLER], [-d + WIDTH / 2, -ROLLER], [-d + WIDTH / 2, 0], [-d - WIDTH / 2, 0]];
  const phi = swingUntilContact({ pivot: PIVOT, outline, from: -0.7, into: 1, sweep: 1.0, steps: 60 }, [DRUM]);
  const tilt = -phi;
  // 鼓面母線內凹,滾子斷面的底邊只會以一角碰到鼓面:取離鼓面較近的那一角
  const u = [-Math.cos(tilt), Math.sin(tilt)];
  const n = [Math.sin(tilt), Math.cos(tilt)];
  const corners = [-1, 1].map((k) => [PIVOT[0] + (d + (k * WIDTH) / 2) * u[0] - ROLLER * n[0], PIVOT[1] + (d + (k * WIDTH) / 2) * u[1] - ROLLER * n[1]]);
  const [near, far] = corners.map(([x, y]) => ({ x, gap: y - drumRadius(x) }));
  return { tilt, contact: drumRadius((near.gap < far.gap ? near : far).x), corners: [drumRadius(near.x), drumRadius(far.x)], lead: near.gap - far.gap };
}

// 滾子的轉角 = 接觸處鼓面線速度的積分 / 滾子半徑。接觸處的半徑隨 d 變:兩角處鼓面的半徑與哪一角較近先沿 d 算成表,
// 再分段線性內插;擺架傾角等於鼓面斜度的那一點,接觸從一角換到另一角,半徑在那裡跳一下(用二分法找準,不抹平)。
// 撥叉等速走,所以對鼓輪轉角的積分可以換成對 d 的積分(累計表 cum)。
const TABLE = 160;
const STEP = (D[1] - D[0]) / TABLE;
const nodeAt = (i) => D[0] + STEP * i;
let table = null;
function buildTable() {
  const rows = Array.from({ length: TABLE + 1 }, (_, i) => seat(nodeAt(i)));
  for (let i = 0; i < TABLE; i++) {
    if (rows[i].lead < 0 === rows[i + 1].lead < 0) continue;
    let [lo, hi] = [nodeAt(i), nodeAt(i + 1)];
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (seat(mid).lead < 0 === rows[i].lead < 0) lo = mid;
      else hi = mid;
    }
    rows[i].switchAt = lo;
  }
  const cum = [0];
  for (let i = 0; i < TABLE; i++) cum.push(cum[i] + span(rows, i, nodeAt(i), nodeAt(i + 1)));
  return { rows, cum };
}
// 第 i 格裡 d 處接觸那一角的編號(0 = 靠鼓輪粗端那一角)
const cornerIn = (rows, i, d) => {
  const [a, b] = [rows[i], rows[i + 1]];
  if (a.switchAt != null) return (d < a.switchAt ? a.lead : b.lead) < 0 ? 0 : 1;
  return a.lead < 0 ? 0 : 1;
};
const radiusIn = (rows, i, k, d) => rows[i].corners[k] + ((rows[i + 1].corners[k] - rows[i].corners[k]) * (d - nodeAt(i))) / STEP;
// 第 i 格裡從 lo 到 hi 的接觸半徑積分(分段線性,梯形公式是精確的)
function span(rows, i, lo, hi) {
  const cut = rows[i].switchAt;
  if (cut != null && lo < cut && cut < hi) return span(rows, i, lo, cut) + span(rows, i, cut, hi);
  const k = cornerIn(rows, i, (lo + hi) / 2);
  return ((hi - lo) * (radiusIn(rows, i, k, lo) + radiusIn(rows, i, k, hi))) / 2;
}
/** 接觸半徑從 D[0] 積分到 d */
function integral(d) {
  table ??= buildTable();
  const i = Math.min(TABLE - 1, Math.max(0, Math.floor((d - D[0]) / STEP)));
  return table.cum[i] + span(table.rows, i, nodeAt(i), d);
}

/** 鼓輪轉 theta 時撥叉推滾子到離樞軸多遠(來回一趟是 2·TRAVERSE 圈) */
const LEG = TAU * TRAVERSE;
const travel = (theta) => swing((theta / LEG) * (D[1] - D[0]), D[0], D[1]);

/** 鼓輪轉 theta:滾子離樞軸的距離、擺架傾角、滾子(與輸出軸)的轉角與轉速比 */
export function roller(theta) {
  const d = travel(theta);
  const { tilt, contact } = seat(d);
  // 滾子線速度 = 鼓輪在接觸處的線速度:轉角 = ∫ 接觸半徑 dθ / 滾子半徑;dθ = dd · LEG / (D[1] − D[0])
  const per = LEG / (D[1] - D[0]);
  const whole = integral(D[1]) * per; // 走一程
  const k = Math.floor(theta / (2 * LEG));
  const rest = theta - k * 2 * LEG;
  const part = rest < LEG ? integral(d) * per : whole + (integral(D[1]) - integral(d)) * per;
  return { d, tilt, spin: (2 * k * whole + part) / ROLLER, rate: contact / ROLLER };
}
export const geometry = { ROLLER, WIDTH, R, LEN, TRAVERSE, SHAFT };

const profile = Array.from({ length: 25 }, (_, i) => {
  const x = -LEN / 2 + (i / 24) * LEN;
  return [drumRadius(x), x];
});

const AXIS0 = [-Math.cos(0.27), Math.sin(0.27), 0]; // 輸出軸的平均方向(轉向箭頭照這個方向擺)
const SHAFT_MID = (STUB + END + 0.15) / 2;

export default {
  figure: 265,
  parts: [
    {
      id: "drum",
      kind: "lathe",
      axis: X,
      profile: [[0, -LEN / 2], ...profile, [0, LEN / 2]],
      mark: true,
      spin: R.big,
      spinOffset: -LEN / 2 + 0.1,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: LEN + 2.0 },
        { kind: "cylinder", radius: R.big - 0.002, length: 0.02, at: [0, 0, -LEN / 2 - 0.005] },
        { kind: "cylinder", radius: R.small - 0.002, length: 0.02, at: [0, 0, LEN / 2 + 0.005] },
      ],
    },
    // 摩擦滾子(局部 Z 沿輸出軸、朝左上):盤、靠樞軸一側的輪轂與兩片凸緣(撥叉夾在凸緣之間);軸孔的鍵槽沒有畫出來
    {
      id: "roller",
      kind: "cylinder",
      axis: AXIS0,
      radius: ROLLER,
      length: WIDTH,
      mark: true,
      spin: ROLLER,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 0.27, at: [0, 0, -0.175] },
        { kind: "cylinder", radius: 0.17, length: 0.04, at: [0, 0, GROOVE + 0.07] },
        { kind: "cylinder", radius: 0.17, length: 0.04, at: [0, 0, GROOVE - 0.07] },
      ],
    },
    // 輸出軸:滑鍵(沿軸的細長方條)讓滾子跟著它轉、又能沿它滑;右端伸出樞軸外,裝一個小皮帶輪把變速的轉動取出去
    {
      id: "shaft",
      kind: "cylinder",
      axis: AXIS0,
      radius: SHAFT,
      length: END + 0.15 - STUB,
      arrow: false, // 和滾子一起轉,轉向看滾子的箭頭
      pieces: [
        { kind: "box", size: [0.04, 0.03, D[1] - D[0] + 0.55], at: [SHAFT, 0, (D[0] + D[1]) / 2 + 0.05 - SHAFT_MID] },
        { kind: "cylinder", radius: 0.2, length: 0.1, at: [0, 0, STUB + 0.1 - SHAFT_MID] },
        { kind: "box", size: [0.06, 0.06, 0.1], at: [0.17, 0, STUB + 0.1 - SHAFT_MID], accent: true },
      ],
    },
    // 擺架(推斷;局部 −X 沿輸出軸):右端的軸承有兩根耳軸,鉸在機架的支架上;左端的軸承上壓著重物;
    // 兩端的軸承由輸出軸上方的導桿相連,撥叉的滑套套在導桿上
    {
      id: "arm",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.14, inner: SHAFT + 0.003, length: 0.2 },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.05, length: 0.2, at: [0, 0, s * 0.22] })),
        { kind: "box", size: [0.08, BAR - 0.1, 0.08], at: [0, (BAR + 0.1) / 2, 0] },
        { kind: "cylinder", axis: X, radius: 0.05, length: END + 0.08, at: [-END / 2, BAR, 0] },
        { kind: "cylinder", axis: X, radius: 0.14, inner: SHAFT + 0.003, length: 0.2, at: [-END, 0, 0] },
        { kind: "box", size: [0.08, BAR - 0.1, 0.08], at: [-END, (BAR + 0.1) / 2, 0] },
        { kind: "box", size: [0.42, 0.36, 0.42], at: [-END, BAR + 0.05 + 0.18, 0] }, // 重物
      ],
    },
    // 撥叉(推斷):滑套套在擺架的導桿上,叉板伸到滾子的輪轂,夾在兩片凸緣之間;照主動量沿導桿走
    {
      id: "fork",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, inner: 0.053, length: 0.2, at: [0, BAR, 0] },
        {
          kind: "plate",
          axis: X,
          thickness: 0.09,
          shape: {
            outline: [
              [-0.19, -0.07], [-0.105, -0.07], [-0.105, 0],
              ...Array.from({ length: 13 }, (_, i) => [-0.105 * Math.cos((i / 12) * Math.PI), 0.105 * Math.sin((i / 12) * Math.PI)]).slice(1, -1),
              [0.105, 0], [0.105, -0.07], [0.19, -0.07], [0.19, 0.22], [0.06, 0.34], [0.06, BAR - 0.06],
              [-0.06, BAR - 0.06], [-0.06, 0.34], [-0.19, 0.22],
            ],
          },
        },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 鼓輪軸兩端的軸承座、底板(推斷)
        ...[-2.45, 2.45].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.26, inner: 0.12, length: 0.25, at: [x, 0, 0] },
          { kind: "box", size: [0.25, 1.55, 0.3], at: [x, -0.98, 0] },
        ]),
        { kind: "box", size: [6.6, 0.12, 1.6], at: [0.6, -1.81, -0.2] },
        // 擺架樞軸的支架:兩片立板,上端的孔套著擺架的耳軸(推斷)
        ...[-1, 1].flatMap((s) => [
          { kind: "cylinder", radius: 0.12, inner: 0.053, length: 0.08, at: [PIVOT[0], PIVOT[1], s * 0.28] },
          { kind: "box", size: [0.16, PIVOT[1] + 1.75 - 0.1, 0.08], at: [PIVOT[0], (PIVOT[1] - 0.1 - 1.75) / 2, s * 0.28] },
        ]),
      ],
    },
  ],
  driver: { part: "drum", type: "rotation", speed: 2.4 },
  target: "roller", // 得到變速旋轉的滾子
  powered: ["fork"], // 撥叉照主動量走,推它的機構沒有畫出來(推斷)
  view: { direction: [0.12, 0.3, 1] },
  pose(theta) {
    const { d, tilt, spin, rate } = roller(theta);
    const u = [-Math.cos(tilt), Math.sin(tilt), 0];
    const pivot = [PIVOT[0], PIVOT[1], 0];
    const at = (s) => add(pivot, scale(u, s));
    const rotation = quatMul(quatFromZ(u), quatAxisAngle(Z, spin));
    return {
      parts: {
        drum: { angle: theta },
        roller: { position: at(d), rotation, angle: spin },
        shaft: { position: at(SHAFT_MID), rotation, angle: spin },
        arm: { position: pivot, angle: -tilt },
        fork: { position: at(d + GROOVE), angle: -tilt },
      },
      readouts: [{ label: "滾子轉速 / 鼓輪轉速", value: rate.toFixed(2) }],
    };
  },
};
