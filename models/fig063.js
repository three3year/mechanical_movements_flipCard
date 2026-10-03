// 第 63 種:跳躍式的旋轉運動,用於計量器與轉數計數器。右側圓盤(主動件,順時針)上的三根插銷,
// 依序從下方頂起左側落板右端彎下來的鉤;落板以左上的大螺絲為樞軸,尾端壓在板彈簧上。
// 棘爪另有樞軸裝在落板上,垂到星形輪右上方的齒間。插銷頂著鉤往上走,落板(連同棘爪的樞軸)被抬起,
// 棘爪的爪尖離開齒間、擺過一齒,落入下一格;插銷從鉤的末端滑脫,彈簧把落板猛然甩下,
// 落板上的柱子撞到棘爪的耳,棘爪被往下壓,爪尖沿齒面把星形輪推轉一格(逆時針)。每通過一根插銷重複一次。
// 落板的轉角由接觸算(鉤被哪根插銷頂著);落下的過程演出來(jumps.falling);棘爪靠接觸停在齒面上。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { circle, polarOutline, shape, thickLine } from "./shapes.js";
import { swingUntilContact, circlePolygon, placeOutline, dropValue } from "./contact.js";
import { falling } from "./jumps.js";

const DISC = { center: [2.05, -0.2], radius: 1.3, pins: 3, pinR: 1.0, pinSize: 0.09, z: -0.25 };
const STAR = { center: [-0.2, -0.87], points: 12, outer: 1.38, inner: 0.9 };
const PIVOT = [-0.93, 1.98]; // 落板的樞軸
const PAWL_PIVOT = [0.38, -0.34]; // 棘爪的樞軸(落板局部)
const PAWL = { length: 1.8, hang: deg(-60) }; // 爪尖的方向(靜止時):伸到星形輪右上方(約 1 點鐘)的齒間
const STOP = { center: [-2.03, 1.68], r: 0.08 }; // 落板落定時尾端上緣頂著的固定柱(落板往下甩時尾端往上)
const SPRING = { root: [-3.0, 0.75], tip: [1.1, 0.1] };
const DROP = deg(9); // 落下的過程佔圓盤轉角多少
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
// 棘爪(局部,樞軸為原點,爪尖朝 +x):長爪,樞軸後方有一片耳、耳上一根柱子讓落板撞
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

/** 進程 w 時:落板轉角、星形輪轉角(落下時推進一格) */
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
  const star = STAR0 + starPitch * (k + t);
  return { drop, star, height: (drop - DOWN) / (HELD - DOWN) };
}

const pawlPivotWorld = (drop) => {
  const [x, y] = rot2(PAWL_PIVOT, drop);
  return [PIVOT[0] + x, PIVOT[1] + y];
};

/** 棘爪的轉角:繞落板上的樞軸往下(順時針,被落板的柱子壓的方向)擺,停在第一次碰到星形輪的位置 */
export function pawlRestAngle(drop, star) {
  const pivot = pawlPivotWorld(drop);
  const starPoly = placeOutline(starOutline, STAR.center, star);
  return swingUntilContact({ pivot, outline: pawlOutline, from: PAWL.hang + 0.35, into: -1, sweep: 0.7, steps: 72 }, [starPoly]);
}

// 星形輪的初始相位:落板落定時,爪尖落在齒根最深處
const STAR0 = (() => {
  const drop = DOWN;
  let best = 0;
  let deepest = Infinity;
  for (let i = 0; i < 60; i++) {
    const phase = (starPitch * i) / 60;
    const a = pawlRestAngle(drop, phase);
    const [px, py] = pawlPivotWorld(drop);
    const tip = [px + PAWL.length * Math.cos(a), py + PAWL.length * Math.sin(a)];
    const r = Math.hypot(tip[0] - STAR.center[0], tip[1] - STAR.center[1]);
    if (r < deepest) [deepest, best] = [r, phase];
  }
  return best;
})();

// 板彈簧:固定端在左邊的座上,自由端頂著落板尾端的下緣(下緣是一條斜邊,落板抬起時接觸點沿著它滑)
const TAIL = [[-1.4, -0.98], [-0.9, -0.75]];
function springAngle(drop) {
  const [a, b] = TAIL.map((p) => {
    const [x, y] = rot2(p, drop);
    return [PIVOT[0] + x, PIVOT[1] + y];
  });
  const len = Math.hypot(SPRING.tip[0], SPRING.tip[1]);
  const beta = Math.atan2(SPRING.tip[1], SPRING.tip[0]);
  let angle = 0;
  for (let i = 0; i < 4; i++) {
    const x = SPRING.root[0] + len * Math.cos(beta + angle);
    const xc = Math.max(a[0], Math.min(b[0], x)); // 接觸點不超出斜邊
    const y = a[1] + ((b[1] - a[1]) * (xc - a[0])) / (b[0] - a[0]) - 0.03;
    angle = Math.asin(Math.max(-1, Math.min(1, (y - SPRING.root[1]) / len))) - beta;
  }
  return angle;
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
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [PAWL_PIVOT[0] + POST[0] * Math.cos(PAWL.hang) - POST[1] * Math.sin(PAWL.hang) - 0.06, PAWL_PIVOT[1] + POST[0] * Math.sin(PAWL.hang) + POST[1] * Math.cos(PAWL.hang) + 0.12, -0.2] },
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
    { id: "spring", kind: "plate", center: [...SPRING.root, Z.drop], shape: shape(thickLine([[0, 0], [0.5, 0.03], [SPRING.tip[0], SPRING.tip[1]]], 0.05)), thickness: 0.12, arrow: false },
    { id: "springSeat", kind: "box", size: [0.3, 0.28, 0.3], center: [SPRING.root[0] - 0.12, SPRING.root[1], Z.drop] },
    { id: "stop", kind: "cylinder", center: [...STOP.center, Z.drop], radius: STOP.r, length: 0.3, pieces: [{ kind: "box", size: [0.12, 0.5, 0.12], at: [0, 0.3, 0] }] },
  ],
  // 圓盤順時針轉(轉角為負);自動播放時主動量往負的方向走
  driver: { part: "disc", type: "rotation", speed: -1.2, initial: -(RELEASE - 0.45 * pinPeriod) },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { drop, star } = counter(-v);
    const pawl = pawlRestAngle(drop, star);
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
