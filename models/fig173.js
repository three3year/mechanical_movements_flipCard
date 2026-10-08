// 第 173 種:絲織機械上變化橫移導桿行程的裝置(用途同第 142 種)。圓盤(背面是斜齒輪,由右邊軸上的小齒輪帶動)
// 的盤面上沿一條直徑裝著一根螺桿,螺桿右上端有一個撥爪輪(tappet-wheel)。螺桿上的螺帽帶著一根手腕銷(wrist),
// 銷伸進 T 形桿的直立長槽;T 形桿的橫臂往右彎下接到導桿,導桿把絲線引到紗管上。圓盤每轉一圈,撥爪輪碰到
// 右上方固定的銷一次、被撥轉一齒,螺桿跟著轉一點,螺帽在螺桿上移一小段——手腕銷離圓盤中心的距離改變,
// 導桿的行程就跟著改變。原文說螺桿裝在圓盤背面,原圖畫在看得到的一面,這裡照原圖。
// 撥爪輪被撥多少由接觸算:固定銷(圓柱)隨圓盤的轉動從撥爪輪的上半齒旁掃過,頂到哪一顆齒就推著它轉,
// 直到齒尖轉到銷的高度以下、銷滑過去為止;其餘時間螺桿靠軸承的摩擦停住。每圈大約撥一齒。
// 推斷:撥爪輪 8 齒;螺紋的旋向取讓螺帽往中心走(行程逐圈縮短);小齒輪齒數。主動件是圓盤。
// 結構推斷(分層):原本螺桿、夾螺桿的框、螺帽、T 形桿擠在同一層看不清。照原圖由後往前分成:圓盤(背面是傘齒輪,
// 齒圈略大於盤面;右上方的小齒輪在盤面後方與它咬合,軸沿徑向伸到機架板的軸承孔——原圖畫在右上方,軸略斜)
// → 盤面上的長條底板與兩端的軸承塊(螺桿架在兩塊之間、離盤面有空隙)→ 螺桿與螺帽 → 螺帽上的手腕銷往前伸
// → T 形桿(在撥爪輪掃過的範圍之外,銷穿進它的直槽)。固定銷照原文是機架上的一支銷,碰撥爪輪的上半齒:
// 這裡在圓盤右側立一片機架板(有小齒輪軸的軸承孔,下方開一道槽讓 T 形桿的橫臂穿過、兼作導座),
// 固定銷由機架板伸出的托架上沿徑向伸到撥爪輪上方。不改齒數、螺距、行程。
import { deg, polar, add, sub, X, Z, TAU, quatAxisAngle, quatMul, quatFromZ, quatRotate, screwAdvance } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { shape, circle, rect, gearProfile } from "./shapes.js";
import { polygonsOverlap, circlePolygon } from "./contact.js";

const CENTER = [0, 0, 0];
const RADIUS = 1.9;
const SCREW_DIR = deg(30.5); // 螺桿在圓盤上的方向(原圖的轉角)
const TAPPET = { at: 2.25, teeth: 8 }; // 撥爪輪在螺桿上的位置與齒數
const PIN = deg(22); // 固定銷所在的方向(圓盤轉角 0 時撥爪輪剛被撥過)
const PITCH = 0.8; // 螺距:撥一齒螺帽移 PITCH / 8 = 0.1
const WRIST0 = -0.6; // 原圖:手腕銷在中心左下方 0.6
const REVS = { back: 6, ahead: 4 };
const SLOT_X = 0; // T 形桿的直立槽在 x = 手腕銷的 x

// 圓盤背面的傘齒輪與小齒輪:兩輪的節錐共用錐頂(在圓盤軸上、盤面後方);小齒輪在圓盤右上方,軸沿徑向往外
const M = 0.14;
const BEVEL = { teeth: 28, pinion: 14, width: 0.2 };
const [GAMMA_DISC, GAMMA_PINION] = pitchCones(BEVEL.teeth, BEVEL.pinion);
const PINION_DIR = deg(12); // 小齒輪在圓盤上的方位
const HEEL_Z = -0.36; // 圓盤齒輪的大端:離盤面的背面(z = −0.18)留一段,小齒輪的齒頂才不會頂到盤面;中間以一圈墊圈填滿
const APEX_Z = HEEL_Z - ((BEVEL.teeth * M) / 2) / Math.tan(GAMMA_DISC);
const DISC_GEAR = bevelGear({ apex: [0, 0, APEX_Z], axis: [0, 0, -1], teeth: BEVEL.teeth, radius: (BEVEL.teeth * M) / 2, cone: GAMMA_DISC, width: BEVEL.width });
const PINION_FIT = bevelGear({ apex: [0, 0, APEX_Z], axis: polar(-1, PINION_DIR), teeth: BEVEL.pinion, radius: (BEVEL.pinion * M) / 2, cone: GAMMA_PINION, width: BEVEL.width });
const PINION = { ...PINION_FIT, center: add(PINION_FIT.center, polar(0.015, PINION_DIR)) }; // 沿徑向退開一點(簡化齒形的齒頂才不會頂到圓盤齒輪的齒根)
const CONTACT = bevelContact(DISC_GEAR, PINION);

// z 分層(由後往前):圓盤面 −0.06 → 底板 −0.06–0.04、軸承塊到 0.335 → 螺桿軸心 0.2 → 撥爪輪齒尖到 0.6 → T 形桿 0.65–0.75
const SCREW_Z = 0.2;
const PIN_Z = SCREW_Z + 0.40; // 固定銷的高度:銷的中心在撥爪輪的齒尖半徑(0.40)上,只碰得到齒的上半段,齒尖轉到銷的高度以下就滑過去
const PIN_R = 0.05;

// 撥爪輪與固定銷的接觸:把銷換到螺桿(不含自轉)的局部座標,在撥爪輪那一層的平面上,銷的截面是一個圓,
// 撥爪輪是一個轉了 spin 的齒形;重疊時把撥爪輪往清掉重疊的方向轉(轉得少的那一邊就是被推的方向)
const along = (theta) => quatMul(quatAxisAngle(Z, theta), quatFromZ(polar(1, SCREW_DIR)));
const inverse = (q) => [-q[0], -q[1], -q[2], q[3]];
const WHEEL = gearProfile({ teeth: TAPPET.teeth, radius: 0.32 });
const PIN_AXIS = polar(1, PIN);
function pinSection(theta) {
  const q = inverse(along(theta));
  const c = quatRotate(q, sub(polar(2.3, PIN, PIN_Z), [0, 0, SCREW_Z]));
  const d = quatRotate(q, PIN_AXIS);
  if (Math.abs(d[2]) < 0.2) return null; // 銷沒有穿過撥爪輪那一層
  const t = (TAPPET.at - c[2]) / d[2];
  if (Math.abs(t) > 0.3) return null; // 銷長 0.6
  return circlePolygon([c[0] + d[0] * t, c[1] + d[1] * t], PIN_R, 12);
}
const wheelAt = (spin) => WHEEL.map(([x, y]) => [x * Math.cos(spin) - y * Math.sin(spin), x * Math.sin(spin) + y * Math.cos(spin)]);
function push(spin, section) {
  if (!section || !polygonsOverlap(section, wheelAt(spin))) return spin;
  // 從 0 往外一小步一小步試,找到第一個不重疊的轉角(再在最後一步裡二分),不會跳過中間的齒
  const clear = (dir) => {
    const hits = (d) => polygonsOverlap(section, wheelAt(spin + dir * d));
    const STEP = 0.004;
    for (let d = STEP; d <= 0.6; d += STEP) {
      if (hits(d)) continue;
      let [lo, hi] = [d - STEP, d];
      for (let k = 0; k < 20; k++) {
        const mid = (lo + hi) / 2;
        if (hits(mid)) lo = mid;
        else hi = mid;
      }
      return hi;
    }
    return Infinity;
  };
  const [a, b] = [clear(1), clear(-1)];
  if (a === Infinity && b === Infinity) return spin;
  return a <= b ? spin + a : spin - b;
}
// 從主動量範圍的起點逐步推算撥爪輪的轉角(螺桿的轉角)
const SAMPLES = 1440; // 每圈的取樣數
const START = -REVS.back * TAU;
const SPINS = (() => {
  const n = (REVS.back + REVS.ahead) * SAMPLES;
  const out = new Float64Array(n + 1);
  let spin = 0.3; // 起點的相位:讓銷第一次經過時碰到一顆齒的側面
  for (let i = 0; i <= n; i++) {
    spin = push(spin, pinSection(START + (i / SAMPLES) * TAU));
    out[i] = spin;
  }
  return out;
})();
const spinAt = (theta) => {
  const x = Math.min(SPINS.length - 1.000001, Math.max(0, ((theta - START) / TAU) * SAMPLES));
  const i = Math.floor(x);
  return SPINS[i] + (SPINS[i + 1] - SPINS[i]) * (x - i);
};
const SPIN0 = spinAt(0);
const HAND = Math.sign(SPINS[SPINS.length - 1] - SPINS[0]); // 螺紋旋向:讓圓盤往前轉時螺帽往中心走

/** 圓盤轉 theta:螺桿(撥爪輪)的轉角、手腕銷在螺桿上的位置與導桿(T 形桿)的位移 */
export function traverse(theta) {
  const screw = spinAt(theta) - SPIN0;
  const s = WRIST0 + screwAdvance(screw, PITCH, HAND);
  const dir = SCREW_DIR + theta;
  const wrist = add(CENTER, polar(s, dir));
  return { screw, s, wrist, x: wrist[0], stroke: 2 * Math.abs(s) };
}
/** 檢查用:圓盤轉 theta 時撥爪輪與銷的截面(螺桿局部座標) */
export function tappetContact(theta) {
  return { pin: pinSection(theta), wheel: wheelAt(spinAt(theta)) };
}
export const tappetTeeth = TAPPET.teeth;

const T_BAR = shape(
  [
    [-0.18, -1.55], [0.18, -1.55], [0.18, -0.12], [1.9, -0.12], [2.3, -0.75], [2.3, -1.35], [3.85, -1.35], [3.85, -0.75],
    [2.6, -0.75], [2.2, 0.12], [0.18, 0.12], [0.18, 1.55], [-0.18, 1.55],
  ],
  [[[-0.07, -1.38], [0.07, -1.38], [0.07, 1.38], [-0.07, 1.38]].reverse()],
);
const LEVER_Z = 0.7;
const STRIP = shape(rect(3.95, 0.5), []); // 盤面上承載螺桿的長條底板
const BLOCK_AT = 1.75; // 兩端軸承塊離盤心的距離(螺帽行程 −1.2–−0.2 碰不到)
const WALL_X = 4.05; // 機架板在 T 形桿寬的那一段走到最右時的外側 // 機架板的位置(圓盤右側,yz 平面)
// 機架板的輪廓(局部 x = 世界 −z、局部 y = 世界 y):小齒輪軸的軸承孔,下方一道槽讓 T 形桿的橫臂穿過(兼作導座)
const WALL = shape(
  [[1.5, -1.75], [1.5, 1.3], [-0.95, 1.3], [-0.95, -1.75]],
  [circle(0.17, -APEX_Z, WALL_X * Math.tan(PINION_DIR)).reverse(), rect(0.24, 0.8, -LEVER_Z, -1.05).reverse()],
);
const PINION_SHAFT = WALL_X / Math.cos(PINION_DIR) + 0.3 - (DISC_GEAR.radius - BEVEL.width / 2); // 小齒輪到機架板外側

export default {
  figure: 173,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: CENTER,
      spin: RADIUS + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(RADIUS), [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, -0.12] },
        { kind: "cylinder", radius: DISC_GEAR.radius - 0.4, length: -0.18 - HEEL_Z, at: [0, 0, (HEEL_Z - 0.18) / 2] }, // 盤面與齒輪之間的墊圈
        { kind: "gear", teeth: BEVEL.teeth, radius: DISC_GEAR.radius, cone: GAMMA_DISC, width: BEVEL.width, axis: DISC_GEAR.axis, at: DISC_GEAR.center },
        // 盤面上承載螺桿的底板與兩端的軸承塊(螺桿穿過兩塊)
        { kind: "plate", shape: STRIP, thickness: 0.1, angle: SCREW_DIR, at: [0, 0, -0.01], accent: true },
        { kind: "box", size: [0.3, 0.5, 0.45], angle: SCREW_DIR, at: polar(BLOCK_AT, SCREW_DIR, 0.11), accent: true },
        { kind: "box", size: [0.3, 0.5, 0.45], angle: SCREW_DIR, at: polar(-BLOCK_AT, SCREW_DIR, 0.11), accent: true },
      ],
    },
    {
      id: "screw",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "worm", radius: 0.1, length: 3.6, pitch: PITCH / 4, thread: 0.04 },
        { kind: "cylinder", radius: 0.05, length: 4.7, at: [0, 0, 0.15] },
        { kind: "gear", teeth: TAPPET.teeth, radius: 0.32, width: 0.08, at: [0, 0, TAPPET.at] },
        { kind: "box", size: [0.08, 0.36, 0.09], at: [0, 0.2, TAPPET.at], accent: true },
      ],
    },
    // 螺帽與它的手腕銷(往前伸進 T 形桿的直槽)
    { id: "nut", kind: "group", arrow: false, pieces: [{ kind: "box", size: [0.4, 0.26, 0.24] }, { kind: "cylinder", radius: 0.07, length: 0.5, at: [0, 0, 0.37] }] }, // 手腕銷立在螺帽的頂面上(不穿過螺桿)
    { id: "lever", kind: "plate", shape: T_BAR, thickness: 0.1 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: WALL, axis: X, thickness: 0.25, at: [WALL_X, 0, 0] }, // 機架板
        { kind: "box", size: [0.8, 0.12, 2.6], at: [WALL_X, -1.81, -0.3] }, // 機架板的腳
        // 固定銷:由機架板伸出的托架,沿徑向伸到撥爪輪上方;撥爪輪經過時碰到它的上半齒
        { kind: "box", size: [WALL_X - 2.4, 0.3, 0.3], at: [(WALL_X + 2.4) / 2, polar(2.6, PIN)[1], PIN_Z] },
        { kind: "cylinder", axis: polar(1, PIN), radius: 0.05, length: 0.6, at: polar(2.3, PIN, PIN_Z) },
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      axis: PINION.axis,
      teeth: PINION.teeth,
      radius: PINION.radius,
      cone: GAMMA_PINION,
      width: BEVEL.width,
      pieces: [{ kind: "cylinder", radius: 0.1, length: PINION_SHAFT, at: [0, 0, -PINION_SHAFT / 2 - 0.05] }], // 軸:沿徑向往外穿過機架板的軸承孔
    },
  ],
  driver: { part: "disc", type: "rotation", range: [-REVS.back * TAU, REVS.ahead * TAU], speed: 1.5 },
  target: "lever",
  view: { direction: [0.3, 0.2, 1] },
  pose(theta) {
    const { screw, wrist } = traverse(theta);
    const q = along(theta);
    return {
      parts: {
        disc: { angle: theta },
        screw: { position: [0, 0, SCREW_Z], rotation: quatMul(q, quatAxisAngle(Z, screw + SPIN0)) },
        nut: { position: [wrist[0], wrist[1], SCREW_Z], angle: SCREW_DIR + theta },
        lever: { position: [SLOT_X + wrist[0], 0, LEVER_Z] },
        pinion: { angle: meshAngle(DISC_GEAR, PINION, -theta, CONTACT) }, // 圓盤齒輪的軸朝後,圓盤轉 theta 是它繞自己的軸轉 −theta
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["disc", "screw"], reason: "螺桿轉在盤面兩端的軸承塊裡(軸承孔沒有畫出來)" },
  ],
};
