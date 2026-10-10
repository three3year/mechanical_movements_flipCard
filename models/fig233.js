// 第 233 種:兩種用於燈籠輪的擋止裝置。原圖是同一個燈籠輪(輪面上一圈銷)配兩種擋止:
// 右邊是一端斜切的平桿,靠自重落在銷之間——輪逆時針轉時銷從下方把桿頂起、滑過去;
// 輪要順時針倒轉時,銷撞上斜切端面,桿的推力指向樞軸,轉不動,輪被擋住。
// 左邊是端頭套著滾子的槓桿,滾子落在兩銷之間,兩個方向都會被銷頂起(只定位、不擋),經過銷時滾子在銷上滾。
// 兩者的作用方式為推斷(原文只說是兩種擋止裝置)。主動件是輪;往回轉只能轉到擋止處。
// 接觸(由接觸算,共用 pawl-drive.js):兩個擋止都靠自重搭在銷上;被銷頂起多高、何時越過,由外形相碰算出,
// 越過之後從當下的速度起加速落下,碰到下一根銷或輪面就停(不瞬移)。
// 推斷:兩個擋止的樞軸銷與托架(立柱落在連到輪軸承座的底板上)、滾子的短銷、輪軸與後面的軸承座(原圖只畫輪轂)。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { circle, stadium, shape } from "./shapes.js";
import { circlePolygon, lastStop, placeOutline, polygonsOverlap } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const WHEEL = { radius: 1.75, pins: 16, pinRadius: 1.45, pin: 0.12 };
const PERIOD = TAU / WHEEL.pins;
const Z = { pins: 0.15, stops: 0.32 };

// 右:斜切端的平桿,樞軸在右端
const BAR = {
  pivot: [3.2, 1.05],
  outline: [
    [0.22, 0.22],
    [-2.1, 0.24],
    [-2.36, -0.24],
    [0.22, -0.22],
  ],
};
// 左:端頭套著滾子的槓桿,樞軸在左端;只用端頭的滾子判斷接觸
const LEVER = { pivot: [-2.6, 0.6], head: [1.85, 0.85], headRadius: 0.35 };
const AXLE = 0.08; // 端頭的短銷,滾子套在上面
const BORE = AXLE + 0.005; // 滾子的孔
const FLOOR = -2.2;

const pinsAt = (wheel) =>
  Array.from({ length: WHEEL.pins }, (_, i) => {
    const p = polar(WHEEL.pinRadius, wheel + i * PERIOD);
    return circlePolygon(p, WHEEL.pin);
  });

// 輪是主動件:擋止隨輪的轉角起落,每個銷距一個週期
const LEVER_HEAD = circlePolygon(LEVER.head, LEVER.headRadius, 16);
const drive = pawlDrive({
  period: PERIOD,
  samples: 360,
  pins: () => ({ bar: BAR.pivot, lever: LEVER.pivot }),
  wheel: { obstacles: pinsAt, angle: (w) => w },
  pawls: {
    bar: { outline: BAR.outline, into: 1, angle: deg(-14), limits: [deg(-30), deg(12)] },
    lever: { outline: LEVER_HEAD, into: -1, angle: deg(14), limits: [deg(-12), deg(30)] },
  },
});
export const barAngle = (wheel) => drive.at(wheel).angles.bar;
export const leverAngle = (wheel) => drive.at(wheel).angles.lever;

// 槓桿端頭的滾子:套在端頭的短銷上,靠在哪一根燈籠銷上就在那根銷上滾(接觸點沒有相對滑動):
// 滾子轉角的增量 = (銷上接觸點跟著輪走的切向位移 − 滾子中心的切向位移) / 滾子半徑;離開銷(落下)時不轉。
// 槓桿每個銷距的動作相同,滾子每個銷距多轉同樣的角度
const headAt = (w) => {
  const [x, y] = rot2(LEVER.head, leverAngle(w));
  return [LEVER.pivot[0] + x, LEVER.pivot[1] + y];
};
// 滾子靠在銷上:用接觸算時同樣的外形(端頭與銷的多邊形),槓桿再往下壓 0.3° 就和那根銷相交
const touching = (w, pin) => polygonsOverlap(placeOutline(LEVER_HEAD, LEVER.pivot, leverAngle(w) - deg(0.3)), circlePolygon(pin, WHEEL.pin));
const ROLL = (() => {
  const n = 720;
  const table = [0];
  for (let i = 1; i <= n; i++) {
    const [w0, w1] = [(PERIOD * (i - 1)) / n, (PERIOD * i) / n];
    const [c0, c1] = [headAt(w0), headAt(w1)];
    const wm = (w0 + w1) / 2;
    const c = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2];
    const pins = Array.from({ length: WHEEL.pins }, (_, k) => polar(WHEEL.pinRadius, wm + k * PERIOD));
    const pin = pins.reduce((a, b) => (Math.hypot(b[0] - c[0], b[1] - c[1]) < Math.hypot(a[0] - c[0], a[1] - c[1]) ? b : a));
    const d = Math.hypot(pin[0] - c[0], pin[1] - c[1]);
    let turn = 0;
    if (touching(wm, pin)) {
      const nrm = [(pin[0] - c[0]) / d, (pin[1] - c[1]) / d];
      const t = [-nrm[1], nrm[0]];
      const q = [c[0] + LEVER.headRadius * nrm[0], c[1] + LEVER.headRadius * nrm[1]];
      const along = (-q[1] * t[0] + q[0] * t[1]) * (w1 - w0) - ((c1[0] - c0[0]) * t[0] + (c1[1] - c0[1]) * t[1]);
      turn = along / LEVER.headRadius;
    }
    table.push(table[i - 1] + turn);
  }
  return table;
})();
const rollerAngle = (w) => {
  const n = ROLL.length - 1;
  const k = Math.floor(w / PERIOD);
  const x = ((w - k * PERIOD) / PERIOD) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return k * ROLL[n] + ROLL[i] + (ROLL[i + 1] - ROLL[i]) * (x - i);
};

// 桿落進兩銷之間、落定的那一刻,就是倒轉時被擋住的位置:找轉角驟降(落下)之後第一個不再變的取樣
const STOP = (() => {
  const n = 720;
  const at = (i) => barAngle((PERIOD * i) / n);
  let start = 0;
  let best = 0;
  for (let i = 1; i <= n; i++) {
    const d = at(i) - at(i - 1);
    if (d > best) [best, start] = [d, i];
  }
  let i = start;
  while (at(i + 1) - at(i) > 1e-6 && i < start + n / 4) i++; // 還在往下落(轉角增加)
  return (PERIOD * i) / n;
})();

export const pinPolygons = pinsAt;
export const geometry = { PIN_CIRCLE: WHEEL.pinRadius, PIN_RADIUS: WHEEL.pin, ROLLER: { radius: LEVER.headRadius, at: LEVER.head, bore: BORE } };
export const barOutline = BAR;

export default {
  figure: 233,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: circle(WHEEL.radius), holes: [] },
      thickness: 0.12,
      hub: 0.3,
      circles: [0.18],
      spin: WHEEL.radius,
      pieces: Array.from({ length: WHEEL.pins }, (_, i) => ({
        kind: "cylinder",
        radius: WHEEL.pin,
        length: 0.42,
        at: [...polar(WHEEL.pinRadius, i * PERIOD).slice(0, 2), Z.pins],
        accent: i === 0,
      })),
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.14, length: 0.5, at: [0, 0, -0.25] }, // 輪軸
        ...pedestal({ at: [0, 0], z: -0.4, bore: 0.14, floor: FLOOR }),
        // 兩個擋止的托架:立柱落在一塊長底板上,底板和輪的軸承座底板相連;樞軸銷從橫臂往前穿過擋止
        { kind: "box", size: [BAR.pivot[0] - LEVER.pivot[0] + 1.3, 0.18, 0.6], at: [(BAR.pivot[0] + LEVER.pivot[0]) / 2, FLOOR - 0.09, -0.4] },
        { kind: "cylinder", radius: 0.065, length: 0.82, at: [...BAR.pivot, -0.01] }, // 平桿的樞軸銷,後端穿進橫臂
        { kind: "cylinder", radius: 0.065, length: 0.94, at: [...LEVER.pivot, 0.05] }, // 槓桿的樞軸銷,後端穿進橫臂、前端穿出槓桿的轂
        ...[
          [BAR.pivot, 1],
          [LEVER.pivot, -1],
        ].flatMap(([[x, y], side]) => [
          { kind: "box", size: [0.3, y + 0.1 - FLOOR, 0.12], at: [x + side * 0.3, (y + 0.1 + FLOOR) / 2, -0.4] }, // 立柱
          { kind: "box", size: [0.5, 0.25, 0.12], at: [x + side * 0.15, y, -0.4] }, // 橫臂
        ]),
      ],
    },
    {
      id: "bar",
      kind: "plate",
      center: [...BAR.pivot, Z.stops],
      shape: shape([...BAR.outline.slice(0, 3), ...BAR.outline.slice(3)], [circle(0.07).reverse()]),
      thickness: 0.12,
    },
    {
      id: "lever",
      kind: "group",
      center: [...LEVER.pivot, Z.stops],
      pieces: [
        // 槓桿在滾子前面一層(碰不到燈籠銷),端頭的短銷往後穿過滾子
        { kind: "plate", shape: shape(stadium(Math.hypot(...LEVER.head), 0.26).outline, [circle(0.07).reverse()]), thickness: 0.1, at: [0, 0, 0.13], angle: Math.atan2(LEVER.head[1], LEVER.head[0]) },
        { kind: "cylinder", radius: 0.14, inner: 0.07, length: 0.26, at: [0, 0, 0.06] },
        { kind: "cylinder", radius: AXLE, length: 0.3, at: [...LEVER.head, 0.03] },
      ],
    },
    // 滾子(維護者 2026-10-10 決定:原圖端頭三層同心,中間是實心的銷):套在槓桿端頭的短銷上,經過燈籠銷時在銷上滾
    {
      id: "roller",
      kind: "plate",
      shape: shape(circle(LEVER.headRadius), [circle(BORE).reverse()]),
      thickness: 0.14,
      circles: [0.17],
      mark: [0.25, 0], // 記號點在槓桿端頭蓋不到的外圈
      markSize: 0.05,
      spin: LEVER.headRadius,
    },
  ],
  // 動力重演:只推輪;兩個擋止鉸在銷上、靠自重搭在銷上,由銷頂起、越過後落下
  replay: {
    from: STOP,
    to: STOP + 2 * PERIOD,
    seconds: 16,
    free: { bar: {}, lever: {}, roller: { on: "lever" } },
    expect: [
      { at: STOP + PERIOD * 0.6, part: "bar", label: "下一根銷把平桿頂起" },
      { at: STOP + PERIOD, part: "bar", label: "銷越過斜切端,平桿落進下一個銷間" },
      { at: STOP + PERIOD * 0.6, part: "lever", label: "銷把槓桿的滾子頂起" },
      { at: STOP + 2 * PERIOD, part: "lever", label: "兩個銷距後槓桿落回原位" },
      { at: STOP + 2 * PERIOD, part: "bar", label: "兩個銷距後平桿落回原位" },
    ],
  },
  driver: {
    part: "wheel",
    type: "rotation",
    initial: STOP,
    speed: 0.5,
    backstop: (v) => lastStop(v, STOP, PERIOD),
  },
  targets: ["bar", "lever", "roller"], // 兩種擋止裝置(滾子是槓桿的端頭)
  view: { direction: [0.08, 0.06, 1] },
  pose(wheel) {
    return {
      parts: {
        wheel: { angle: wheel },
        bar: { angle: barAngle(wheel) },
        lever: { angle: leverAngle(wheel) },
        roller: { position: [...headAt(wheel), Z.stops], angle: rollerAngle(wheel) },
      },
      readouts: [],
    };
  },
};
