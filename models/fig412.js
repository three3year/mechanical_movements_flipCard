// 第 412 種:絞盤底部的齒輪機構,讓絞盤可當簡單或複合機器用(單倍或三倍的機械利益)。鼓頭與鼓輪可以各自轉;
// 鼓頭固定在心軸上(中央的齒輪),轉鼓頭就帶心軸轉;鼓頭與鼓輪鎖在一起時鼓輪也跟著轉,這是單倍機械利益;
// 解鎖時齒輪機構作動,鼓頭與鼓輪朝相反方向轉,速度比為三比一。
// 主動件是鼓頭(心軸與中央齒輪);狀態按鈕切換「鎖定」與「解鎖」。
// 照原圖:中央三瓣的 Y 形板是行星架,三個小齒輪各裝在它的一根銷上;鼓輪內面是內齒輪(齒數為中央齒輪的三倍)。
// 推斷(維護者 2026-10-20 決定 (a)):解鎖時行星架由一根插銷鎖在底座上不動,中央齒輪經小齒輪帶內齒輪反向轉、三比一;
// 鎖定時插銷拔起,鼓頭鎖住鼓輪,整組(連行星架與小齒輪)像一個剛體一起轉。
// 底座(推斷,原圖沒畫):鼓輪背後的一塊板,托著心軸、插銷與兩根柱;原圖外側的兩個鉤是掣子,各以末端的圓鉸在柱上,
// 尖端靠在鼓輪外緣的兩個台階上(原圖輪緣上下各一個台階):鼓輪順時針轉(解鎖時鼓頭逆時針轉的方向,和原圖箭頭一致)時
// 掣子被斜面漸漸頂起、過台階落下,反轉就被台階擋住。掣子的位置由接觸算(沿柱擺到碰上輪緣);
// 下方的掣子靠彈簧壓向輪緣(推斷,原圖沒畫)。
import { TAU, rot2, polar, wrap } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";
import { swingUntilContact, placeOutline } from "./contact.js";

const M = 0.08;
export const SUN = { center: [0, 0, 0], teeth: 14, radius: (14 * M) / 2 };
const BACKLASH = 0.008; // 齒隙:中心距稍微拉開
export const RING = { center: [0, 0, 0], teeth: 42, radius: (42 * M) / 2 + 2 * BACKLASH, internal: true };
const PLANET_TEETH = (RING.teeth - SUN.teeth) / 2;
const ORBIT = SUN.radius + (PLANET_TEETH * M) / 2 + BACKLASH;
// 三個小齒輪要同時咬中央齒輪與內齒輪,位置角須是 2π/(14+42) 的整數倍(約在 150°、30°、270°)
const PLANET_AT = [23, 5, 42].map((k) => (k * TAU) / (SUN.teeth + RING.teeth));
export const PLANETS = PLANET_AT.map((a) => ({ center: [ORBIT * Math.cos(a), ORBIT * Math.sin(a), 0], teeth: PLANET_TEETH, radius: (PLANET_TEETH * M) / 2 }));
const BARREL = 2.05;
// 鼓輪外緣:兩個台階的棘齒(半徑從 RIM_LOW 逆時針漸增到 RIM_HIGH,在 0° 與 180° 落回)
const RIM_LOW = 2.07;
const RIM_HIGH = 2.15;
const PLANET_AXLE = 0.07;
const SUN_AXLE = 0.1;
const LATCH = { at: polar(0.72, -29 * (Math.PI / 180)), radius: 0.04, length: 0.34, lift: 0.16 }; // 插銷:在兩根臂之間
const LATCH_Z = { free: -0.27, locked: -0.27 + 0.16 }; // 插銷中心的 z:插進底座 / 拔起
export const POSTS = { top: [2.75, 1.95], bottom: [-2.75, -1.95] }; // 掣子的柱
const POST_R = 0.1;
const PAWL_Z = 0.05; // 掣子的層(和輪緣同深度,尖端才碰得到外緣)

/** 鼓頭轉 theta → 各零件的轉角;鎖定時整組像一個剛體 */
export function angles(theta, state = "free") {
  if (state === "locked") {
    const base = angles(0, "free");
    return { sun: theta, planets: base.planets.map((a) => a + theta), ring: base.ring + theta, carrier: theta };
  }
  const planets = PLANETS.map((p) => meshAngle(SUN, p, theta));
  return { sun: theta, planets, ring: meshAngle(PLANETS[0], RING, planets[0]), carrier: 0 };
}

// 鼓輪外緣的輪廓(局部):兩個台階
const rimOutline = (() => {
  const pts = [];
  const n = 180;
  for (let i = 0; i < n; i++) {
    const a = (i * TAU) / n;
    const f = (a % Math.PI) / Math.PI;
    if (i % (n / 2) === 0) pts.push(polar(RIM_HIGH, a).slice(0, 2));
    pts.push(polar(RIM_LOW + (RIM_HIGH - RIM_LOW) * f, a).slice(0, 2));
  }
  return pts;
})();

// 掣子(局部,柱在原點):末端的圓凸台 + 沿輪緣伸過去、尖端勾向輪緣的臂;下方的掣子是上方的點對稱
const pawlOutline = (() => {
  const points = [[0, 0], [-1.15, 0.15], [-2.25, 0.17], [-2.5, 0.05]];
  const w = 0.09;
  const n = points.length;
  const tl = thickLine(points, w);
  const t = Math.atan2(points[1][1] - points[0][1], points[1][0] - points[0][0]);
  return [...tl.slice(1, n), ...tl.slice(n, 2 * n - 1), ...arcPoints(0.16, t - Math.PI / 2, t - (3 * Math.PI) / 2)];
})();
const PAWL = {
  top: { outline: pawlOutline, window: [50, 120].map((d) => (d * Math.PI) / 180) },
  bottom: { outline: pawlOutline.map(([x, y]) => [-x, -y]), window: [230, 300].map((d) => (d * Math.PI) / 180) },
};
/** 掣子靠在鼓輪輪緣上的轉角(鼓輪轉角 ring):沿柱往輪緣擺到相碰 */
export function pawlRest(side, ring) {
  const { outline, window } = PAWL[side];
  // 障礙物:輪緣在掣子尖端附近那一段(扇形,閉合到圓心)
  const from = (q) => wrap(Math.atan2(q[1], q[0]) - window[0]);
  const wall = placeOutline(rimOutline, [0, 0], ring)
    .filter((q) => from(q) <= window[1] - window[0])
    .sort((p, q) => from(p) - from(q));
  return swingUntilContact({ pivot: POSTS[side], outline, from: -0.12, into: 1, sweep: 0.16, steps: 64 }, [[...wall, [0, 0]]]);
}

const bar = (post) => thickLine([polar(0.6, Math.atan2(post[1], post[0])).slice(0, 2), post], 0.4);
const carrierArm = (a) => thickLine([polar(0.5, a).slice(0, 2), polar(ORBIT - 0.2, a).slice(0, 2)], 0.5);
const pawl = (id, side) => ({ id, posed: true, kind: "plate", shape: shape(PAWL[side].outline, [circle(POST_R + 0.005).reverse()]), thickness: 0.1, arrow: false });

export default {
  figure: 412,
  parts: [
    // 底座(固定件,推斷):中央的圓板(心軸與插銷的孔)、通到兩根柱的臂、掣子的柱
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(0.95), [circle(SUN_AXLE + 0.01).reverse(), circle(LATCH.radius + 0.005, LATCH.at[0], LATCH.at[1]).reverse()]), thickness: 0.08, at: [0, 0, -0.38] },
        { kind: "plate", shape: shape(bar(POSTS.top)), thickness: 0.08, at: [0, 0, -0.38] },
        { kind: "plate", shape: shape(bar(POSTS.bottom)), thickness: 0.08, at: [0, 0, -0.38] },
        { kind: "cylinder", radius: POST_R, length: 0.62, at: [POSTS.top[0], POSTS.top[1], -0.11] },
        { kind: "cylinder", radius: POST_R, length: 0.62, at: [POSTS.bottom[0], POSTS.bottom[1], -0.11] },
      ],
    },
    {
      id: "barrel",
      kind: "gear",
      internal: true,
      center: RING.center,
      teeth: RING.teeth,
      radius: RING.radius,
      rim: BARREL,
      width: 0.24,
      pieces: [{ kind: "plate", shape: shape(rimOutline, [circle(BARREL - 0.06).reverse()]), thickness: 0.3 }],
    },
    { id: "sun", kind: "gear", center: SUN.center, teeth: SUN.teeth, radius: SUN.radius, width: 0.3, bore: SUN_AXLE, pieces: [{ kind: "cylinder", radius: SUN_AXLE, length: 0.9, at: [0, 0, -0.1] }] },
    // 小齒輪與各自的軸(軸往後穿過行星架的孔,在孔裡轉)
    ...PLANETS.map((p, i) => ({ id: `planet${i + 1}`, kind: "gear", center: p.center, teeth: p.teeth, radius: p.radius, width: 0.26, bore: PLANET_AXLE, arrow: i === 0, pieces: [{ kind: "cylinder", radius: PLANET_AXLE, length: 0.46, at: [0, 0, -0.09] }] })),
    // 行星架(原圖中央的 Y 形板):中央的圓板(心軸、插銷的孔)、三根臂、臂端套小齒輪軸的圓板
    {
      id: "carrier",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(0.78), [circle(SUN_AXLE + 0.01).reverse(), circle(LATCH.radius + 0.005, LATCH.at[0], LATCH.at[1]).reverse()]), thickness: 0.08, at: [0, 0, -0.26] },
        ...PLANET_AT.map((a) => ({ kind: "plate", shape: shape(carrierArm(a)), thickness: 0.08, at: [0, 0, -0.26] })),
        ...PLANETS.map((p) => ({ kind: "plate", shape: shape(circle(0.32, p.center[0], p.center[1]), [circle(PLANET_AXLE + 0.005, p.center[0], p.center[1]).reverse()]), thickness: 0.08, at: [0, 0, -0.26] })),
      ],
    },
    // 插銷(推斷):穿在行星架的孔裡;解鎖時插進底座的孔,鎖定時拔起、跟著行星架轉
    { id: "latch", posed: true, kind: "cylinder", radius: LATCH.radius, length: LATCH.length, arrow: false, accent: true, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.05, at: [0, 0, LATCH.length / 2 + 0.025] }] },
    pawl("pawlTop", "top"),
    pawl("pawlBottom", "bottom"),
  ],
  states: {
    initial: "free",
    options: [
      { id: "locked", label: "鎖定(單倍)" },
      { id: "free", label: "解鎖(三倍)" },
    ],
  },
  driver: { part: "sun", type: "rotation" },
  target: "barrel",
  view: { direction: [0.05, 0.06, 1] },
  pose(theta, state = "free") {
    const a = angles(theta, state);
    const parts = {
      sun: { angle: a.sun },
      barrel: { angle: a.ring },
      carrier: { angle: a.carrier },
      latch: { position: [...rot2(LATCH.at, a.carrier), LATCH_Z[state]], angle: a.carrier },
      pawlTop: { position: [...POSTS.top, PAWL_Z], angle: pawlRest("top", a.ring) },
      pawlBottom: { position: [...POSTS.bottom, PAWL_Z], angle: pawlRest("bottom", a.ring) },
    };
    PLANETS.forEach((p, i) => {
      parts[`planet${i + 1}`] = { position: [...rot2(p.center, a.carrier), 0], angle: a.planets[i] };
    });
    return {
      parts,
      readouts: [
        { label: "機械利益", value: state === "locked" ? "單倍" : "三倍" },
        { label: "鼓輪 / 鼓頭", value: state === "locked" ? "同向 1 : 1" : "反向 1 : 3" },
        { label: "行星架", value: state === "locked" ? "插銷拔起,隨整組轉" : "插銷鎖在底座上,不轉" },
      ],
    };
  },
  // 動力重演:兩個掣子自由(上方靠自重、下方靠彈簧壓向輪緣),鼓輪轉過台階時被頂起再落下
  replay: {
    state: "free",
    free: {
      pawlTop: { gravity: true },
      pawlBottom: { gravity: false, spring: 1 },
    },
    expect: [
      { part: "pawlTop", label: "上方的掣子尖端靠在鼓輪的輪緣上" },
      { part: "pawlBottom", label: "下方的掣子尖端靠在鼓輪的輪緣上" },
    ],
  },
};
