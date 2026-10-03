// 第 63 種:跳躍式的旋轉運動,用於計量器與轉數計數器。右側圓盤(主動件,順時針)上的三根插銷,
// 依序從下方頂起左側落板右端彎下來的鉤;落板以左上的大螺絲為樞軸,尾端壓在板彈簧上。
// 棘爪另有樞軸裝在落板上,垂到星形輪右上方的齒間。插銷頂著鉤往上走,落板(連同棘爪的樞軸)被抬起,
// 棘爪的爪尖離開齒間、擺過一齒,落入下一格;插銷從鉤的末端滑脫,彈簧把落板猛然甩下,
// 落板上的柱子撞到棘爪的耳,棘爪被往下壓,爪尖沿齒面把星形輪推轉一格(逆時針)。每通過一根插銷重複一次。
// 落板的轉角由接觸算(鉤被哪根插銷頂著);落下的過程演出來(jumps.falling);棘爪靠接觸停在齒面上。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { circle, polarOutline, shape, thickLine } from "./shapes.js";
import { swingUntilContact, placeOutline, circlePolygon, dropValue } from "./contact.js";
import { falling } from "./jumps.js";

// 插銷要從圓盤(在後)穿過星形輪那一層才頂得到前面的落板:插銷的圓周(pinR)縮到碰不到星形輪的齒尖
// (照原圖的 1.0 會掃過齒尖;為了實物可行而偏離插圖)
const DISC = { center: [2.05, -0.2], radius: 1.3, pins: 3, pinR: 0.85, pinSize: 0.09, z: -0.25 };
const STAR = { center: [-0.2, -0.87], points: 12, outer: 1.38, inner: 0.9 };
const PIVOT = [-0.93, 1.98]; // 落板的樞軸
const PAWL_PIVOT = [2.18, -0.34]; // 棘爪的樞軸(落板局部):在落板右段的下緣
// 爪尖的方向(靜止時):從右上往左下伸到星形輪約 1 點鐘的齒間,爪身大致沿星形輪的半徑——
// 這樣棘爪擺動時爪尖是沿著輪緣走的,推得動一整格;爪身若接近切線,擺動只會把爪尖拔出齒間
const PAWL = { length: 1.8, hang: deg(-120) };
const STOP = { center: [-2.03, 1.68], r: 0.08 }; // 落板落定時尾端上緣頂著的固定柱(落板往下甩時尾端往上)
const SPRING = { root: [-3.0, 0.75], tip: [1.1, 0.1] };
const DROP = deg(24); // 落下的過程佔圓盤轉角多少(約 0.35 秒)
export const starPitch = TAU / STAR.points;
export const dropSpan = DROP;
export const pinPeriod = TAU / DISC.pins;
const Z = { drop: 0.4, pawl: 0.0, star: 0.0 };

// 落板(局部,樞軸為原點):左邊往下斜的尾端、中央的螺絲座、右邊伸到圓盤上方再彎下來的鉤
const dropOutline = [
  [-0.3, 0.3],
  [-1.0, -0.3],
  [-1.45, -0.75],
  [-1.4, -0.98],
  [-0.9, -0.75],
  [-0.35, -0.42],
  [0.35, -0.42],
  [1.95, -0.55],
  [2.08, -0.55],
  [2.08, -1.95],
  [2.42, -1.95],
  [2.42, -0.25],
  [2.25, 0.22],
  [0.4, 0.44],
];
// 棘爪(局部,樞軸為原點,爪尖朝 +x):長爪,樞軸旁有一片耳、耳上一根柱子讓落板撞
const pawlOutline = [
  [0.15, 0.14],
  [1.6, 0.09],
  [PAWL.length, 0],
  [1.6, -0.09],
  [0.15, -0.14],
  [-0.2, -0.3],
  [-0.5, -0.2],
  [-0.45, 0.02],
  [-0.15, 0.14],
];
const POST = [-0.38, -0.1];
const starOutline = polarOutline((a) => {
  const f = (((a / starPitch) % 1) + 1) % 1;
  return STAR.inner + (STAR.outer - STAR.inner) * Math.max(0, 1 - Math.abs(f - 0.5) * 2) ** 1.3;
}, 240);

const pinAngle = (i, v) => deg(150) + (i * TAU) / DISC.pins + v;
const pinAt = (i, v) => {
  const [x, y] = polar(DISC.pinR, pinAngle(i, v));
  return [DISC.center[0] + x, DISC.center[1] + y];
};

/** 落板靠在插銷(或固定柱)上的轉角;v 是圓盤的轉角(順時針為負) */
export function dropRest(v) {
  const obstacles = [circlePolygon(STOP.center, STOP.r)];
  for (let i = 0; i < DISC.pins; i++) obstacles.push(circlePolygon(pinAt(i, v), DISC.pinSize));
  return swingUntilContact({ pivot: PIVOT, outline: dropOutline, from: 0.45, into: -1, sweep: 0.6, steps: 72 }, obstacles);
}

// 以 w = −v(順時針的進程)描述:每轉過一根插銷(pinPeriod)落板落下一次,落在 w = RELEASE 處
const restOf = (w) => dropRest(-w);
export const RELEASE = dropValue(restOf, pinPeriod) - pinPeriod / 720; // dropValue 回傳的是落下後的第一個取樣點
const HELD = restOf(RELEASE); // 落下前一刻的轉角
const DOWN = restOf(RELEASE + DROP + 1e-4); // 落定的轉角

const pawlPivotWorld = (drop) => {
  const [x, y] = rot2(PAWL_PIVOT, drop);
  return [PIVOT[0] + x, PIVOT[1] + y];
};

// 星形輪的相位與爪尖在齒間的位置:落板落定時,爪尖落在某個齒根(局部角為齒距的整數倍)再偏向被推的那一齒一點
const STAR0 = (() => {
  const [px, py] = pawlPivotWorld(DOWN);
  const tip = [px + PAWL.length * Math.cos(PAWL.hang) - STAR.center[0], py + PAWL.length * Math.sin(PAWL.hang) - STAR.center[1]];
  const a = Math.atan2(tip[1], tip[0]);
  return a - starPitch * Math.floor(a / starPitch) - deg(3);
})();
// 爪尖在星形輪局部座標的位置(落定時所在的齒間):爪尖沿著這一格走
const Q0 = (() => {
  const [px, py] = pawlPivotWorld(DOWN);
  const tip = [px + PAWL.length * Math.cos(PAWL.hang) - STAR.center[0], py + PAWL.length * Math.sin(PAWL.hang) - STAR.center[1]];
  return rot2(tip, -(STAR0 + starPitch));
})();

/** 棘爪指向星形輪上的點 W(相位 phase 的那一格):回傳棘爪轉角與爪尖 */
function pawlToward(drop, phase) {
  const [px, py] = pawlPivotWorld(drop);
  const [qx, qy] = rot2(Q0, phase);
  const angle = Math.atan2(STAR.center[1] + qy - py, STAR.center[0] + qx - px);
  return { angle, tip: [px + PAWL.length * Math.cos(angle), py + PAWL.length * Math.sin(angle)] };
}
const tipRadius = (drop, phase) => {
  const { tip } = pawlToward(drop, phase);
  return Math.hypot(tip[0] - STAR.center[0], tip[1] - STAR.center[1]);
};
// 落板降到哪個轉角時爪尖才進到齒間(對著還沒被推的那一格)
const ENTER = (() => {
  for (let i = 0; i <= 80; i++) {
    const drop = HELD + ((DOWN - HELD) * i) / 80;
    if (tipRadius(drop, STAR0) < STAR.outer - 0.08) return drop;
  }
  return HELD;
})();

/** 進程 w 時:落板轉角、星形輪轉角、棘爪轉角(落板抬起時爪尖擺到下一格上方,落下時推一格) */
export function counter(w) {
  const k = Math.floor(w / pinPeriod);
  const u = w - k * pinPeriod;
  let drop = restOf(w);
  let t = 0;
  if (u >= RELEASE && u < RELEASE + DROP) {
    t = falling((u - RELEASE) / DROP);
    drop = HELD + (drop - HELD) * t;
  } else if (u >= RELEASE + DROP) {
    t = 1;
  }
  const height = (drop - DOWN) / (HELD - DOWN);
  // 星形輪只在爪尖已經落進齒間之後才被推:落板從 ENTER 降到 DOWN 這一段推進一格
  const push = t === 0 ? 0 : t === 1 ? 1 : Math.min(1, Math.max(0, (ENTER - drop) / (ENTER - DOWN)));
  const star = STAR0 + starPitch * (k + push);
  // 爪尖對著的那一格:落下時是正在推的這一格(隨星形輪走);抬起時從剛推完的那一格擺回下一格
  const phase = t > 0 && t < 1 ? STAR0 + starPitch * push : STAR0 + starPitch * (1 - Math.min(1, Math.max(0, height)));
  const pawl = pawlToward(drop, phase).angle;
  return { drop, star, pawl, height };
}

// 板彈簧:固定端在左邊的座上,自由端頂著落板尾端的下緣(落板抬起時接觸點沿著下緣滑)
const springOutline = thickLine([[0, 0], [0.5, 0.03], [SPRING.tip[0], SPRING.tip[1]]], 0.05);
function springAngle(drop) {
  // 彈簧片由下往上頂,停在碰到落板的位置(整片繞根部轉,示意彎曲)
  return swingUntilContact({ pivot: SPRING.root, outline: springOutline, from: -0.5, into: 1, sweep: 1.2, steps: 60 }, [placeOutline(dropOutline, PIVOT, drop)]);
}
export default {
  figure: 63,
  parts: [
    {
      id: "disc",
      kind: "plate",
      center: [...DISC.center, DISC.z],
      shape: shape(circle(DISC.radius), [circle(0.12).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      spin: DISC.radius,
      pieces: Array.from({ length: DISC.pins }, (_, i) => ({
        kind: "cylinder",
        radius: DISC.pinSize,
        length: 0.85,
        at: [...polar(DISC.pinR, pinAngle(i, 0)).slice(0, 2), 0.45],
        accent: i === 0,
      })),
    },
    {
      id: "star",
      kind: "plate",
      center: [...STAR.center, Z.star],
      shape: shape(starOutline, [circle(0.12).reverse()]),
      thickness: 0.16,
      hub: 0.28,
      mark: [0.5, 0],
      markSize: 0.08,
      spin: 1.4,
    },
    {
      id: "drop",
      kind: "group",
      center: [...PIVOT, Z.drop],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(dropOutline, [circle(0.3).reverse()]), thickness: 0.14 },
        { kind: "cylinder", radius: 0.42, inner: 0.3, length: 0.2 },
        { kind: "box", size: [0.5, 0.06, 0.08], at: [0, 0, 0.12], angle: deg(60) },
        // 棘爪的樞軸銷,穿到星形輪那一層;還有撞棘爪的柱子
        { kind: "cylinder", radius: 0.07, length: 0.6, at: [...PAWL_PIVOT, -0.2] },
        // 這根柱子只伸到棘爪板面的上方,撞的是棘爪耳上的柱子
        { kind: "cylinder", radius: 0.06, length: 0.24, at: [PAWL_PIVOT[0] + POST[0] * Math.cos(PAWL.hang) - POST[1] * Math.sin(PAWL.hang) - 0.06, PAWL_PIVOT[1] + POST[0] * Math.sin(PAWL.hang) + POST[1] * Math.cos(PAWL.hang) + 0.12, -0.19] },
      ],
    },
    {
      id: "pawl",
      kind: "plate",
      center: [0, 0, Z.pawl],
      shape: shape(pawlOutline, [circle(0.07).reverse()]),
      thickness: 0.14,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3, at: [...POST, 0.1] }],
    },
    { id: "spring", kind: "plate", center: [...SPRING.root, Z.drop], shape: shape(springOutline), thickness: 0.12, arrow: false },
    { id: "springSeat", kind: "box", size: [0.3, 0.28, 0.3], center: [SPRING.root[0] - 0.12, SPRING.root[1], Z.drop] },
    // 星形輪的軸(推斷:原圖只畫了輪心的圓)
    { id: "starStud", kind: "cylinder", center: [...STAR.center, Z.star], radius: 0.1, length: 0.5 },
    { id: "stop", kind: "cylinder", center: [...STOP.center, Z.drop], radius: STOP.r, length: 0.3, pieces: [{ kind: "box", size: [0.12, 0.5, 0.12], at: [0, 0.3, 0] }] },
  ],
  // 圓盤順時針轉(轉角為負);自動播放時主動量往負的方向走
  driver: { part: "disc", type: "rotation", speed: -1.2, initial: -(RELEASE - 0.45 * pinPeriod) },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  waivers: [
    { check: "interference", parts: ["spring", "springSeat"], reason: "板彈簧的根部夾在座裡;彎曲以整片繞根部轉動示意,根部在座內轉動的重疊可接受" },
    {
      check: "replay",
      parts: ["star"],
      reason: "重演中落板被插銷抬起、滑脫後落回原位都成立,但棘爪只靠自重垂著、沒有照模型那樣對準齒間,落板落下時推不動星形輪。原圖的棘爪是虛線畫的鉤形,看不出它靠什麼貼住齒;模型的棘爪姿勢是依原文演出來的(待確認)",
    },
  ],
  // 動力重演:只推圓盤;落板繞大螺絲、被彈簧往下壓,棘爪鉸在落板上靠自重垂著,星形輪靠摩擦定位
  replay: {
    from: -(RELEASE - 0.45 * pinPeriod),
    to: -(RELEASE - 0.45 * pinPeriod) - pinPeriod,
    free: {
      drop: { pivot: [...PIVOT, Z.drop], spring: -1 },
      pawl: { on: "drop" },
      star: { hold: true },
    },
    ignore: [["drop", "spring"]], // 彈簧片照模型擺,它對落板的力由 spring 代表
    expect: [
      { at: -(RELEASE - 0.05), part: "star", label: "插銷把落板抬起時星形輪不動" },
      { at: -(RELEASE - 0.45 * pinPeriod) - pinPeriod, part: "star", label: "落板落下,棘爪把星形輪推轉一格", quote: "每通過一根插銷……使星形輪轉動一格" },
      { at: -(RELEASE - 0.45 * pinPeriod) - pinPeriod, part: "drop", label: "落板落回原位" },
    ],
  },
  pose(v) {
    const { drop, star, pawl } = counter(-v);
    return {
      parts: {
        disc: { angle: v },
        star: { angle: star },
        drop: { angle: drop },
        pawl: { position: [...pawlPivotWorld(drop), Z.pawl], angle: pawl },
        spring: { angle: springAngle(drop) },
      },
      readouts: [],
    };
  },
};
