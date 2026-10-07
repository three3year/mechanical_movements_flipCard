// 第 491 種:絞盤。繞在絞盤鼓上的纜繩,靠插在絞盤頭孔裡的推桿使絞盤繞軸轉動而被收進。絞盤由裝在它下部的棘爪防止倒轉,
// 棘爪作用在底座上的圓形棘輪裡。
// 主動件是絞盤(推桿)。
// 推斷:鼓身中間細兩端粗;纜繩從鼓的一側切線離開,絞盤轉一圈收進鼓周長的繩。
// 棘輪照原圖做成冠狀:16 個齒立在底座的環上,每齒是一段緩坡加一面直壁(轉的方向爬緩坡)。
// 棘爪鉸在鼓的下緣、爪尖靠自重搭在齒上(由接觸算):爪尖沿緩坡被抬起,越過齒頂後加速落到下一齒的齒根;
// 倒轉時爪尖頂在直壁上,絞盤轉不回去。
// 動力重演做不了:棘爪的姿勢是「隨絞盤轉、又繞自己沿半徑的銷擺」的複合轉動,重演只比對繞單一固定軸的轉角
// (預期事件比的是姿勢的 angle),棘爪擺多少比不出來;測試另外驗爪尖搭在齒面上、越過齒頂後加速落下。
import { TAU, Y, Z, quatAxisAngle, quatMul, quatFromBasis } from "./kit.js";
import { shape, circle } from "./shapes.js";

export const DRUM_R = 0.55;
export const TEETH = 16;
const BASE_Y = -1.3;
const RING_TOP = BASE_Y + 0.08; // 棘輪環的頂面
export const RATCHET_R = 0.82; // 冠狀齒所在的半徑
export const TOOTH_H = 0.12; // 齒高
const PITCH = TAU / TEETH;
const PAWL_AT = RATCHET_R; // 棘爪鉸點離軸
const PIVOT_Y = -0.95;
export const PAWL = 0.4; // 棘爪長
const PAWL_W = 0.08;
const FALL = 0.12; // 越過齒頂後,絞盤再轉這麼多爪尖才落到齒根

/** 角度 phi 處冠狀齒的頂面高度(離環頂):齒在 phi 增加的方向爬升,到齒頂垂直落下 */
export const toothHeight = (phi) => TOOTH_H * ((((phi / PITCH) % 1) + 1) % 1);

/** 棘爪往下斜 a 時,爪尖底緣的高度與它落後鉸點的角度 */
const tipAt = (a) => ({ y: PIVOT_Y - PAWL * Math.sin(a) - (PAWL_W / 2) * Math.cos(a), lag: (PAWL * Math.cos(a)) / RATCHET_R });
/** 絞盤轉 theta 時棘爪搭在齒上的斜角:從抬起往下擺,擺到爪尖碰到齒面為止(由接觸算) */
function resting(theta) {
  const clear = (a) => {
    const t = tipAt(a);
    return t.y >= RING_TOP + toothHeight(theta - t.lag);
  };
  let a = 0.1;
  while (a < 1.2 && clear(a + 0.01)) a += 0.01;
  let hi = a + 0.01;
  for (let i = 0; i < 12; i++) {
    const mid = (a + hi) / 2;
    if (clear(mid)) a = mid;
    else hi = mid;
  }
  return a;
}
// resting 每隔一齒重複:第一次用到時算好一齒的表(400 點),之後內插
let table = null;
function restingAt(theta) {
  const N = 400;
  table ??= Array.from({ length: N + 1 }, (_, i) => resting((PITCH * i) / N));
  const u = ((((theta / PITCH) % 1) + 1) % 1) * N;
  const i = Math.floor(u);
  return table[i] + (table[i + 1] - table[i]) * (u - i);
}
const DROP = 0.5; // 落下時斜角最多增加的量(用來定加速的快慢)

/** 絞盤轉 theta(從上往下看逆時針為正)→ 收進的纜繩長、棘爪往下斜的角度、爪尖底緣的高度 */
export function capstan(theta) {
  // 越過齒頂後爪尖靠自重加速落下:斜角最多只能照「從稍早的位置加速往下擺」那樣增加,也不能擺過齒面
  let a = restingAt(theta);
  for (let k = 1; k <= 96; k++) {
    const d = (FALL * k) / 96;
    a = Math.min(a, restingAt(theta - d) + DROP * (d / FALL) ** 2);
  }
  return { hauled: DRUM_R * theta, tilt: a, tip: tipAt(a).y };
}

// 鼓的剖面:上下粗、中間細的腰身;絞盤頭(插推桿的那一段)另成一段,兩段是同一個剛體
const drumProfile = [[0, -1.05], [0.75, -1.05], [0.75, -0.85], [0.62, -0.7], [DRUM_R, -0.2], [DRUM_R, 0.25], [0.68, 0.6], [0.68, 0.75], [0, 0.75]];
const headProfile = [[0, 0.75], [0.85, 0.75], [0.85, 1.05], [0, 1.05]];

// 冠狀齒:每齒一塊直角三角形的板(局部 x 沿切線、y 朝上、z 沿半徑),立在環上
const crownTooth = (k) => {
  const phi = k * PITCH;
  const arc = RATCHET_R * PITCH;
  const tangent = [-Math.sin(phi), 0, -Math.cos(phi)];
  const radial = [Math.cos(phi), 0, -Math.sin(phi)];
  return { kind: "plate", shape: shape([[0, 0], [arc, 0], [arc, TOOTH_H]]), thickness: 0.18, at: [RATCHET_R * Math.cos(phi), RING_TOP, -RATCHET_R * Math.sin(phi)], rotation: quatFromBasis(tangent, [0, 1, 0], radial) };
};

export default {
  figure: 491,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.0, 0.15, 3.0], at: [0, BASE_Y - 0.08, 0] },
        // 底座上的棘輪環(平放)與立在上面的冠狀齒
        { kind: "cylinder", radius: RATCHET_R + 0.13, inner: RATCHET_R - 0.13, length: 0.08, axis: Y, at: [0, BASE_Y + 0.04, 0] },
        ...Array.from({ length: TEETH }, (_, k) => crownTooth(k)),
      ],
    },
    {
      id: "capstan",
      kind: "group",
      axis: Y,
      spin: 1.0,
      pieces: [
        { kind: "lathe", profile: headProfile },
        // 推桿(插在頭部的孔裡)
        { kind: "box", size: [4.2, 0.1, 0.1], at: [0, 0, 0.95] },
        { kind: "box", size: [4.2, 0.1, 0.1], at: [0, 0, 0.95], angle: Math.PI / 2 },
      ],
    },
    // 絞盤鼓(纜繩繞在上面被收進;與絞盤頭是同一個剛體,獨立成一個零件當目標件)
    {
      id: "drum",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "lathe", profile: drumProfile },
        // 棘爪的鉸座(鼓下緣內側的耳)與穿過棘爪的銷(沿半徑)
        { kind: "box", size: [0.1, 0.12, 0.16], at: [PAWL_AT - 0.13, 0, PIVOT_Y] },
        { kind: "cylinder", radius: 0.022, length: 0.22, axis: [1, 0, 0], at: [PAWL_AT - 0.05, 0, PIVOT_Y] },
      ],
    },
    // 棘爪:局部 x 沿切線往後、y 往上;鉸點在局部原點
    { id: "pawl", kind: "plate", shape: shape([[0, -PAWL_W / 2], [PAWL, -PAWL_W / 2], [PAWL, PAWL_W / 2], [0, PAWL_W / 2]], [circle(0.025).reverse()]), thickness: 0.08, arrow: false },
    { id: "rope", kind: "rope", radius: 0.04 },
  ],
  driver: { part: "capstan", type: "rotation", speed: 0.4 },
  target: "drum", // 纜繩是路徑零件(不上目標色);標把纜繩捲進來的絞盤鼓
  view: { direction: [0.25, 0.3, 1] },
  pose(theta) {
    const c = capstan(theta);
    const pivot = [PAWL_AT * Math.cos(theta), PIVOT_Y, -PAWL_AT * Math.sin(theta)];
    // 繩:從右邊拉來,在鼓上繞一圈半;繩的記號隨收進的長度移動
    const wraps = Array.from({ length: 25 }, (_, i) => {
      const a = -Math.PI / 2 - (i / 24) * TAU * 1.5;
      return [DRUM_R * Math.cos(a), -0.05 + (i / 24) * 0.35, -DRUM_R * Math.sin(a)];
    });
    return {
      parts: {
        capstan: { angle: theta },
        drum: { angle: theta },
        // 棘爪隨絞盤轉,爪尖朝下往後搭在冠狀齒上
        pawl: { position: pivot, rotation: quatMul(quatAxisAngle(Y, theta - Math.PI / 2), quatAxisAngle(Z, -c.tilt)) },
      },
      paths: { rope: { points: [[3.0, -0.05, DRUM_R], [0, -0.05, DRUM_R], ...wraps], closed: false, phase: c.hauled } }, // 繩往鼓走
      readouts: [{ label: "收進的纜繩", value: c.hauled.toFixed(2) }],
    };
  },
  waivers: [
  ],
};
