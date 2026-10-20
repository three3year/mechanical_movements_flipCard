// 第 470 種:蒸汽錘。汽缸固定在上方,錘頭接在活塞桿的下端。蒸汽輪流被引進活塞下方、再排出,使錘升起、落下。
// 主動件是虛擬的「進程」:每單位是錘一次。
// 推斷:進汽時蒸汽把活塞連同錘頂上去;排汽後錘靠自重落下打在砧上;各階段所佔的進程;汽缸畫成剖面。
// 汽缸坐在機架頂橫樑的頂面上(照原圖;活塞桿穿過橫樑的孔與橫樑下的填料函),砧坐在底座上。
// 閥箱與閥桿組(2026-10-20 決定 (a),推斷):原圖汽缸正面有閥箱、進汽管接在閥箱上,汽缸頂上一根三個銷的搖桿,
// 兩根桿從搖桿左右垂下,右邊那根沿機架腳往下接到右下的手柄。模型把閥箱放在汽缸左側、剖開前半(汽缸的前半剖掉了,
// 閥箱畫在正面會懸空,放在側面才看得到裡面);閥箱裡一個 D 形滑閥貼著閥面上下滑,閥面上開兩個口:下面的汽道口通到活塞
// 下方、上面的排汽口通到背後的排汽管。閥升起時汽道口通閥箱(進汽)、排汽口被閥的下唇封住;閥落下時閥的空腔把汽道口接到
// 排汽口(排汽)。閥桿穿過閥箱頂的填料函,經短連桿接到搖桿的左銷;搖桿的右銷經一根長桿(在機架前面)接到底座上肘形手柄
// 的短臂;操作的人扳手柄(手柄列為外力來源):往左扳到底 = 進汽、往右扳到底 = 排汽。搖桿、桿的長度與手柄扳動的時機都是推斷。
// 動力重演不適用:錘是被蒸汽頂起的,重演裡沒有蒸汽的力——錘設成自由零件只會停在砧上,照模型走又沒有東西可驗;
// 靠重力的只有落下那一段,已演出加速的過程、撞到砧停住。
import { Y, smooth, signedAngle } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle, thickLine, hubArms, spanBox } from "./shapes.js";
import { circleCircle } from "./linkage.js";

export const CYL = { y0: 1.7, y1: 3.3, r: 0.45, cap: 0.1 }; // 汽缸外底(= 橫樑頂面)、外頂、內半徑、蓋厚
export const ANVIL_TOP = -1.15;
const HEAD_H = 0.55;
const ROD = 2.7; // 活塞中心到錘頭頂
const ROD_R = 0.07;
const PISTON_T = 0.18;
export const LIFT = 0.95; // 錘升起的高度
const BEAM = { y0: 1.25, y1: 1.7 }; // 機架頂橫樑
const BASE_TOP = -1.8;

// 閥箱(推斷):在汽缸左側,剖開前半;x1 是閥面那一側的外緣(貼著汽缸外壁)
const CHEST = { x0: -1.06, x1: -0.47, y0: BEAM.y1, y1: 2.66, z0: -0.45, z1: 0, wall: 0.06, face: 0.14 };
const FACE_X = CHEST.x1 - CHEST.face; // 閥面:閥貼著它滑
const CHEST_Z = (CHEST.z0 + CHEST.z1) / 2;
const PORT_H = 0.05;
const PORT_Y = 1.94; // 汽道口(通活塞下方)的中心
const EXH_Y = PORT_Y + 0.16; // 排汽口的中心
/** 閥面上的兩個口(世界高度範圍):below 通活塞下方,exhaust 通排汽管 */
export const PORTS = { below: [PORT_Y - PORT_H / 2, PORT_Y + PORT_H / 2], exhaust: [EXH_Y - PORT_H / 2, EXH_Y + PORT_H / 2] };
// D 形滑閥:兩道唇夾著一個空腔,空腔朝閥面;stroke 是進汽位置比排汽位置高多少
const VALVE = { w: 0.24, lip: 0.12, cavity: 0.25, depth: 0.1, stroke: 0.26, t: 0.3 };
const VALVE_H = 2 * VALVE.lip + VALVE.cavity;
const VALVE_Y0 = PORT_Y - PORT_H / 2 - 0.015 - VALVE.lip; // 排汽位置時閥的底(汽道口在空腔裡)
const VALVE_X = FACE_X - VALVE.w / 2; // 閥(與閥桿)的中心 x
const STEM = 0.7;
const STEM_R = 0.04;
const ROCKER = { pivot: [0, 3.55], left: 0.73, right: 0.9, z: CHEST_Z }; // 搖桿:樞軸在汽缸頂上的立柱,左銷接閥桿、右銷接長桿
const LINK = 0.45; // 閥桿頂到搖桿左銷的短連桿
const LINK_Z = -0.1;
const HANDLE = { pivot: [1.7, -1.3], arm: 0.8, grip: 1.3, z: 0.4 }; // 肘形手柄:短臂往左接長桿、長臂往上到握球
const ROD_Z = 0.5; // 長桿在機架與手柄前面那一層
const LONG_ROD = ROCKER.pivot[1] - HANDLE.pivot[1]; // 長桿:中立時鉛直

/** 進程 v → 錘頭底的高度、階段 */
export function hammer(v) {
  const u = v - Math.floor(v);
  if (u < 0.5) return { y: ANVIL_TOP + LIFT * smooth(u / 0.45), phase: "進汽:蒸汽在活塞下方,把錘抬起", steam: true };
  if (u < 0.58) return { y: ANVIL_TOP + LIFT, phase: "排汽:手柄扳向排汽", steam: false };
  if (u < 0.72) return { y: ANVIL_TOP + LIFT * (1 - ((u - 0.58) / 0.14) ** 2), phase: "錘靠自重落下", steam: false };
  if (u < 0.92) return { y: ANVIL_TOP, phase: "打在砧上", steam: false };
  return { y: ANVIL_TOP, phase: "打在砧上:手柄扳回進汽", steam: false };
}

/** 進程 v → 活塞的底與頂 */
export function piston(v) {
  const c = hammer(v).y + HEAD_H + ROD;
  return { center: c, bottom: c - PISTON_T / 2, top: c + PISTON_T / 2 };
}

// 閥的升起程度(0 排汽位置、1 進汽位置):操作的人在錘到頂後扳向排汽、錘停在砧上之後扳回進汽(推斷)
const liftAt = (u) => (u < 0.5 ? 1 : u < 0.58 ? 1 - smooth((u - 0.5) / 0.08) : u < 0.92 ? 0 : smooth((u - 0.92) / 0.08));

/** 進程 v → 滑閥:升起程度、底、頂、下唇與空腔的高度範圍(世界座標) */
export function valve(v) {
  const lift = liftAt(v - Math.floor(v));
  const bottom = VALVE_Y0 + VALVE.stroke * lift;
  return { lift, bottom, top: bottom + VALVE_H, lip: [bottom, bottom + VALVE.lip], cavity: [bottom + VALVE.lip, bottom + VALVE.lip + VALVE.cavity] };
}

/** 進程 v → 閥桿組的姿勢:由閥的位置反推搖桿轉角、長桿下端與手柄轉角(兩圓交點;連桿長度不變) */
export function train(v) {
  const va = valve(v);
  const stemTop = [VALVE_X, va.top + STEM];
  const left = circleCircle([...ROCKER.pivot, 0], ROCKER.left, [...stemTop, 0], LINK, -1).point; // 左銷在閥桿頂的上方
  const phi = signedAngle(Math.atan2(left[1] - ROCKER.pivot[1], left[0] - ROCKER.pivot[0]) - Math.PI); // 左銷在搖桿局部的 (−left, 0)
  const right = [ROCKER.pivot[0] + ROCKER.right * Math.cos(phi), ROCKER.pivot[1] + ROCKER.right * Math.sin(phi)];
  const pin = circleCircle([...HANDLE.pivot, 0], HANDLE.arm, [...right, 0], LONG_ROD, 1).point; // 手柄短臂的銷在樞軸左邊
  const psi = signedAngle(Math.atan2(pin[1] - HANDLE.pivot[1], pin[0] - HANDLE.pivot[0]) - Math.PI); // 短臂在手柄局部的 (−arm, 0)
  return { ...va, stemTop, phi, left, right, pin, psi };
}

const legs = shape(
  [[-2.0, BASE_TOP], [-1.35, BASE_TOP], [-1.0, BEAM.y0], [1.0, BEAM.y0], [1.35, BASE_TOP], [2.0, BASE_TOP], [1.45, BEAM.y1], [-1.45, BEAM.y1]],
  [circle(ROD_R + 0.01, 0, (BEAM.y0 + BEAM.y1) / 2).reverse()], // 橫樑上讓活塞桿穿過的孔
);
const { x0, x1, y0: cy0, y1: cy1, z0, z1, wall } = CHEST;
const INLET = [[-2.3, 2.2, CHEST_Z], [-0.9, 2.2, CHEST_Z], [-0.8, PORT_Y + 0.08, CHEST_Z], [-0.5, PORT_Y, CHEST_Z], [0, PORT_Y + 0.1, CHEST_Z]];
const EXHAUST = [[0, PORT_Y + 0.1, CHEST_Z], [-0.5, PORT_Y, CHEST_Z], [-0.66, PORT_Y, CHEST_Z], [-0.66, EXH_Y, CHEST_Z], [-0.54, EXH_Y, -0.56], [-0.54, 3.7, -0.56], [-0.54, 3.95, -0.56]];
// 滑閥的輪廓(局部:原點在閥底貼著閥面的那個角,空腔朝 +x)
const valveOutline = [[-VALVE.w, 0], [0, 0], [0, VALVE.lip], [-VALVE.depth, VALVE.lip], [-VALVE.depth, VALVE.lip + VALVE.cavity], [0, VALVE.lip + VALVE.cavity], [0, VALVE_H], [-VALVE.w, VALVE_H]];

export default {
  figure: 470,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: legs, thickness: 0.5, role: "legs" },
        // 汽缸(坐在橫樑頂面上;剖開前半),底蓋留活塞桿的孔
        { kind: "lathe", axis: Y, profile: [[ROD_R + 0.005, 0], [CYL.r + 0.1, 0], [CYL.r + 0.1, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0 - CYL.cap], [CYL.r, CYL.y1 - CYL.y0 - CYL.cap], [CYL.r, CYL.cap], [ROD_R + 0.005, CYL.cap]], at: [0, CYL.y0, 0], ...backHalf(Y) },
        // 橫樑下的填料函(推斷;原圖橫樑下的錐形導套)
        { kind: "cylinder", axis: Y, radius: 0.16, inner: ROD_R + 0.005, length: 0.3, at: [0, BEAM.y0 - 0.1, 0] },
        // 砧(坐在底座上)與底座
        { kind: "box", size: [0.9, ANVIL_TOP - BASE_TOP, 0.8], at: [0, (ANVIL_TOP + BASE_TOP) / 2, 0], role: "anvil" },
        { kind: "box", size: [4.4, 0.2, 1.2], at: [0, BASE_TOP - 0.1, 0], role: "base" },
        // 閥箱(推斷):背壁、左壁、底、頂(留閥桿的孔)與閥面(開了汽道口與排汽口的三段),坐在橫樑上、貼著汽缸
        spanBox(x0, x1, cy0, cy1, z0, z0 + wall),
        spanBox(x0, x0 + wall, cy0, cy1, z0, z1),
        spanBox(x0, x1, cy0, cy0 + wall, z0, z1),
        spanBox(x0, VALVE_X - STEM_R - 0.01, cy1 - wall, cy1, z0, z1),
        spanBox(VALVE_X + STEM_R + 0.01, x1, cy1 - wall, cy1, z0, z1),
        { kind: "cylinder", axis: Y, radius: 0.1, inner: STEM_R + 0.005, length: 0.2, at: [VALVE_X, cy1 + 0.1, CHEST_Z] }, // 閥箱頂的填料函
        spanBox(FACE_X, x1, cy0, PORTS.below[0], z0, z1),
        spanBox(FACE_X, x1, PORTS.below[1], PORTS.exhaust[0], z0, z1),
        spanBox(FACE_X, x1, PORTS.exhaust[1], cy1, z0, z1),
        // 進汽管(接進閥箱的左壁)與排汽管(從排汽口往後、再往上;推斷)
        spanBox(-2.3, x0 + wall, 2.14, 2.26, CHEST_Z - 0.06, CHEST_Z + 0.06),
        spanBox(-0.6, -0.48, EXH_Y - 0.06, EXH_Y + 0.06, -0.62, z0),
        spanBox(-0.6, -0.48, EXH_Y - 0.06, 3.7, -0.62, -0.5),
        // 搖桿的立柱與樞軸銷(推斷:立在汽缸頂蓋上、搖桿後面)
        { kind: "box", size: [0.14, ROCKER.pivot[1] + 0.1 - CYL.y1, 0.15], at: [0, (ROCKER.pivot[1] + 0.1 + CYL.y1) / 2, -0.375] },
        { kind: "cylinder", radius: 0.035, length: 0.25, at: [ROCKER.pivot[0], ROCKER.pivot[1], -0.275] },
        // 手柄的托架與樞軸銷(推斷:立在底座上、右腳前面)
        { kind: "box", size: [0.2, HANDLE.pivot[1] + 0.1 - BASE_TOP, 0.08], at: [HANDLE.pivot[0], (HANDLE.pivot[1] + 0.1 + BASE_TOP) / 2, 0.31] },
        { kind: "cylinder", radius: 0.035, length: 0.23, at: [HANDLE.pivot[0], HANDLE.pivot[1], 0.385] },
      ],
    },
    { id: "steam", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * CYL.r - 0.04, CYL.y1 - CYL.y0 - 2 * CYL.cap, 0], level: 0 },
    {
      id: "hammer",
      kind: "box",
      size: [0.75, HEAD_H, 0.7],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: ROD_R, length: ROD, axis: Y, at: [0, HEAD_H / 2 + ROD / 2, 0], role: "rod" },
        { kind: "cylinder", radius: CYL.r - 0.02, length: PISTON_T, axis: Y, at: [0, HEAD_H / 2 + ROD, 0] },
      ],
    },
    // 滑閥(板件:原點在閥底貼著閥面的角)、閥桿與閥桿頂的十字頭銷
    {
      id: "valve",
      kind: "plate",
      shape: shape(valveOutline),
      thickness: VALVE.t,
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: Y, radius: STEM_R, length: STEM + 0.02, at: [-VALVE.w / 2, VALVE_H + STEM / 2 - 0.01, 0], role: "stem" },
        { kind: "cylinder", radius: 0.035, length: 0.22, at: [-VALVE.w / 2, VALVE_H + STEM, 0.11] },
      ],
    },
    { id: "stemLink", kind: "link", width: 0.07, thickness: 0.05 },
    // 搖桿(三個銷:樞軸、左銷接閥桿的連桿、右銷接長桿;右銷往前伸到長桿那一層)
    {
      id: "rocker",
      kind: "group",
      center: [ROCKER.pivot[0], ROCKER.pivot[1], ROCKER.z],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-ROCKER.left - 0.08, 0], [ROCKER.right + 0.08, 0]], 0.1), [circle(0.04).reverse()]), thickness: 0.08 },
        { kind: "cylinder", radius: 0.035, length: LINK_Z + 0.03 - ROCKER.z + 0.04, at: [-ROCKER.left, 0, (LINK_Z + 0.03 - ROCKER.z - 0.04) / 2] },
        { kind: "cylinder", radius: 0.035, length: ROD_Z + 0.03 - ROCKER.z + 0.04, at: [ROCKER.right, 0, (ROD_Z + 0.03 - ROCKER.z - 0.04) / 2] },
      ],
    },
    { id: "longRod", kind: "link", width: 0.07, thickness: 0.05 },
    // 肘形手柄:短臂往左(接長桿)、長臂往上到握球;短臂的銷往前伸到長桿那一層
    {
      id: "handle",
      kind: "group",
      center: [HANDLE.pivot[0], HANDLE.pivot[1], HANDLE.z],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(hubArms(0.1, 0.08, [{ angle: Math.PI, length: HANDLE.arm }, { angle: Math.PI / 2, length: HANDLE.grip }]), [circle(0.04).reverse()]), thickness: 0.08 },
        { kind: "sphere", radius: 0.1, at: [0, HANDLE.grip, 0] },
        { kind: "cylinder", radius: 0.035, length: ROD_Z + 0.03 - HANDLE.z + 0.04, at: [-HANDLE.arm, 0, (ROD_Z + 0.03 - HANDLE.z - 0.04) / 2] },
      ],
    },
  ],
  powered: ["hammer", "handle"], // 外力來源:錘被蒸汽頂起(流體傳動);手柄由操作的人扳動
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "下", speed: 0.25 },
  target: "hammer",
  view: { direction: [0.12, 0.1, 1] },
  pose(v) {
    const h = hammer(v);
    const p = piston(v);
    const t = train(v);
    const u = v - Math.floor(v);
    const travel = v * 8;
    const inner = CYL.y1 - CYL.y0 - 2 * CYL.cap;
    const flows = [];
    if (u < 0.5) flows.push({ fluid: "steam", points: stream(INLET, travel, { spacing: 0.2 }) });
    else if (u >= 0.54 && u < 0.78) flows.push({ fluid: "steam", points: stream(EXHAUST, travel, { spacing: 0.2 }) });
    return {
      parts: {
        hammer: { position: [0, h.y + HEAD_H / 2, 0] },
        steam: { position: [0, CYL.y0 + CYL.cap + inner / 2, 0], level: u < 0.58 ? Math.max(0, p.bottom - CYL.y0 - CYL.cap) / inner : 0 },
        valve: { position: [FACE_X, t.bottom, CHEST_Z] },
        stemLink: { from: [t.left[0], t.left[1], LINK_Z], to: [t.stemTop[0], t.stemTop[1], LINK_Z] },
        rocker: { angle: t.phi },
        longRod: { from: [t.right[0], t.right[1], ROD_Z], to: [t.pin[0], t.pin[1], ROD_Z] },
        handle: { angle: t.psi },
      },
      flows,
      readouts: [
        { label: "階段", value: h.phase },
        { label: "滑閥", value: t.lift > 0.5 ? "汽道口通閥箱(進汽)" : "汽道口接到排汽口(排汽)" },
      ],
    };
  },
};
