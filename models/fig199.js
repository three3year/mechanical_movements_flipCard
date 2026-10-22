// 第 199 種:另一種曼格式齒條。燈籠式小齒輪(lantern-pinion,幾根銷夾在兩片半圓板之間)持續朝同一方向轉,
// 把往復運動傳給方形框架;框架由上下的滾子引導。小齒輪只在不到一半的圓周上有銷,所以當它與一側的齒條
// 嚙合時,沒有銷的那一半正朝向另一側。每根齒條起始處的大齒確保小齒輪的銷正確地嚙合。主動件是小齒輪。
// 照原圖:4 根銷(原圖量到相鄰約 33°,取 34°,分布 102°,不到半圈)、每根齒條 4 個齒間,上齒條的大齒在右端、
// 下齒條的大齒在左端;原圖的時刻是換向:下面最後一根銷剛退出下齒條、上面第一根銷正要推上齒條的大齒。
// 框架的位置由銷推齒面決定(銷在齒間裡推齒的側面,框架跟著銷的水平位置走;銷升到齒頂附近改推齒角,
// 齒角轉到銷掃過的圓環外緣就推不動了)。最後一根銷推到推不動、再升到下緣高過齒頂(留 CLEAR),
// 另一側的第一根銷才碰到那一側齒條的大齒,框架換向;兩者之間框架停約 3°。
// 推斷:小齒輪順時針轉(原文沒寫轉向;大齒在起始處、原圖的換向時刻都要順時針才對得上);齒距 = 銷的弦長
// 2·RL·sin(STEP/2)(相鄰兩根銷對稱地在正上(下)方兩側時兩根都貼著齒面),比原圖的齒距短(原圖齒距約銷圓半徑的
// 0.8 倍,和銷距 33° 對不上),行程也比原圖短;接手的銷先推到齒角,交接那一下框架略快(約 1.07 倍)。
// 大齒比一般的齒長(原圖約兩倍),讓第一根銷在離正上(下)方約 40° 就碰到它。
// 兩片半圓板一片在框架前面、一片在後面,夾住框架上的齒條,銷從前板穿過框架的開口到後板,橫跨齒條整個厚度
// (507movements 的動畫裡圓盤在平面上一直蓋過齒條的齒,所以盤不在齒條那一層)。
import { deg, TAU } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";

const RL = 0.6; // 銷所在的節圓半徑
const PIN = 0.08; // 銷的半徑
const PINS = 4;
const STEP = deg(34);
const CHORD = 2 * RL * Math.sin(STEP / 2); // 齒距
const EDGE = 0.8; // 開口上下緣(齒間底)離中心線
const TIP = 0.56; // 齒尖離中心線
const BIG = 0.35; // 起始大齒的齒尖離中心線
const GAP = 0.2; // 齒間寬
const BIG_W = 0.18; // 大齒寬
const CLEAR = 0.005; // 換向那一刻,退出的銷的下緣高過齒頂多少
const ROLLER = 0.35;
const PLATE_Z = 0.15; // 燈籠小齒輪兩片板的中心離框架中面(框架厚 0.2,板厚 0.05,各留 0.025)

// 換向時最後一根銷離正下(上)方的角度:下緣高過齒頂 CLEAR
const EXIT = Math.acos((TIP - CLEAR - PIN) / RL);
// 銷 i(0 = 帶頭那根,順時針轉時最先到正上方)在小齒輪轉 v 時的角度;v = 0 是原圖的換向時刻,最後一根在正下方再過 EXIT
const BASE = 1.5 * Math.PI - EXIT - (PINS - 1) * STEP;
export const pinAngle = (i, v) => BASE + i * STEP - v;
const pinAt = (i, v) => [RL * Math.cos(pinAngle(i, v)), RL * Math.sin(pinAngle(i, v))];

/** 銷推齒面時,銷心到齒面的水平距離:銷心比齒尖深(depth ≥ 0)推側面;淺一點推齒角;再淺碰不到(null) */
const reach = (depth) => (depth >= 0 ? PIN : depth > -PIN ? Math.sqrt(PIN * PIN - depth * depth) : null);
const tipOf = (i) => (i === 0 ? BIG : TIP);

// 上齒條:銷 i 推第 i 個齒間右邊的齒面(框架座標 A[i],A[0] 是大齒的左面),框架往右。
// v = 0 時銷 0 剛碰到大齒、框架在最左(x = 0)
const A0 = pinAt(0, 0)[0] + PIN;
const A = Array.from({ length: PINS }, (_, i) => A0 - i * CHORD);
// 最後一根銷推齒角,齒角轉到銷掃過的圓環外緣(離小齒輪中心 RL + PIN)時推不動:框架停在最右
const KX = Math.sqrt((RL + PIN) ** 2 - TIP ** 2);
const X_MAX = KX - A[PINS - 1];
const V_LIFT = BASE + (PINS - 1) * STEP - Math.atan2(TIP, KX);
const TRAVEL = X_MAX;
// 下齒條是上齒條繞框架上的點 (CX, 0) 轉半圈:v + π 的姿勢是 v 的姿勢整個轉半圈
const CX = -X_MAX / 2;
const B = A.map((a) => 2 * CX - a); // 下齒條第 i 個齒間左邊的齒面

/** 上(下)齒條的銷推出來的框架位置:框架至少(至多)要在這裡,銷才不穿進齒面 */
function push(v, top) {
  let best = top ? -Infinity : Infinity;
  for (let i = 0; i < PINS; i++) {
    const [px, py] = pinAt(i, v);
    const r = reach((top ? py : -py) - tipOf(i));
    if (r === null) continue;
    best = top ? Math.max(best, px + r - A[i]) : Math.min(best, px - r - B[i]);
  }
  return best;
}

/** 小齒輪順時針轉 v:框架的位移,以及正在推框架的齒條(換向前停著的那一小段是 null) */
export function frame(v) {
  const u = ((v % TAU) + TAU) % TAU;
  if (u < V_LIFT) return { x: push(u, true), rack: "top" };
  if (u < Math.PI) return { x: X_MAX, rack: null };
  if (u < Math.PI + V_LIFT) return { x: push(u, false), rack: "bottom" };
  return { x: 0, rack: null };
}
export const geometry = { RL, PIN, PINS, STEP, TIP, EDGE, TRAVEL };

const TOOTH = CHORD - GAP; // 一般的齒寬
// 上齒條的齒(框架座標的 [左, 右, 齒尖]):左端一個一般的齒、齒間之間三個、右端大齒
const TOP_TEETH = [
  [A[PINS - 1] - GAP - TOOTH, A[PINS - 1] - GAP, TIP],
  ...Array.from({ length: PINS - 1 }, (_, i) => [A[PINS - 1 - i], A[PINS - 2 - i] - GAP, TIP]),
  [A[0], A[0] + BIG_W, BIG],
];
const BOTTOM_TEETH = TOP_TEETH.map(([a, b, t]) => [2 * CX - b, 2 * CX - a, t]).reverse();
const RIGHT = 0; // 開口右端半圓的圓心:框架在最左時小齒輪的位置
const LEFT = 2 * CX - RIGHT;
// 開口(逆時針):下緣往右(齒朝上)→ 右端半圓 → 上緣往左(齒朝下)→ 左端半圓
const opening = [
  ...BOTTOM_TEETH.flatMap(([a, b, t]) => [[a, -EDGE], [a, -t], [b, -t], [b, -EDGE]]),
  ...arcPoints(EDGE, -Math.PI / 2, Math.PI / 2, RIGHT, 0),
  ...[...TOP_TEETH].reverse().flatMap(([a, b, t]) => [[b, EDGE], [b, t], [a, t], [a, EDGE]]),
  ...arcPoints(EDGE, Math.PI / 2, (3 * Math.PI) / 2, LEFT, 0),
];
// 框架外形:上下兩條橫桿,左端內凹(左端離開口的距離照舊)
const L_END = LEFT - EDGE - 1.25;
const outline = [[L_END, -1.3], [1.5, -1.3], [1.5, 1.3], [L_END, 1.3], [L_END, 0.85], ...arcPoints(1.35, deg(39), deg(-39), L_END - 1.05, 0).slice(1, -1), [L_END, -0.85]];
const ROLLERS = [[-1.0, 1.65, 1], [0.85, 1.65, 1], [-1.15, -1.65, -1], [0.83, -1.65, -1]];
const MID = BASE + ((PINS - 1) * STEP) / 2; // 銷分布的中線,半圓板以它為中心
const half = () => shape([...arcPoints(0.75, MID - Math.PI / 2, MID + Math.PI / 2)], []);

export default {
  figure: 199,
  parts: [
    { id: "frame", kind: "plate", shape: shape(outline, [[...opening].reverse()]), thickness: 0.2 },
    {
      id: "pinion",
      kind: "group",
      center: [0, 0, 0],
      spin: 0.8,
      spinOffset: PLATE_Z + 0.05, // 箭頭在前板前面,不被框架擋住
      pieces: [
        // 兩片半圓板夾著銷,一片在框架後、一片在框架前(銷頭略露出板外,同原圖看得到銷);沒有銷的一半只有軸轂
        { kind: "plate", shape: half(), thickness: 0.05, at: [0, 0, -PLATE_Z] },
        { kind: "plate", shape: half(), thickness: 0.05, at: [0, 0, PLATE_Z] },
        { kind: "cylinder", radius: 0.14, length: 2 * PLATE_Z + 0.05, mark: true },
        { kind: "cylinder", radius: 0.07, length: 0.35, at: [0, 0, -0.325] }, // 軸從後板往後,進到底板上的軸承(推斷)
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: PIN, length: 2 * PLATE_Z + 0.075, at: [...pinAt(i, 0), 0], accent: i === 0 })),
      ],
    },
    ...ROLLERS.map(([x, y], i) => ({ id: `roller${i}`, kind: "group", center: [x, y, 0], spin: ROLLER, arrow: i === 0 || i === 2, pieces: [{ kind: "cylinder", radius: ROLLER, inner: 0.07, length: 0.25, mark: true }] })),
    {
      id: "base",
      kind: "group",
      pieces: [
        // 後面的底板:滾子的軸與小齒輪的軸承都立在它上面(推斷,原圖只畫出滾子與小齒輪)
        { kind: "box", size: [4.2, 4.8, 0.1], at: [-0.1, 0, -0.55] },
        ...ROLLERS.map(([x, y]) => ({ kind: "cylinder", radius: 0.065, length: 0.75, at: [x, y, -0.175] })),
        { kind: "cylinder", radius: 0.2, inner: 0.07, length: 0.2, at: [0, 0, -0.4] },
      ],
    },
  ],
  // 小齒輪順時針轉(轉角為負):自動播放時主動量往負的方向走。框架的位置是由銷推齒面算的,倒著轉就成了銷拉著齒走,
  // 大齒也會落在齒條的末端而不是起始處
  driver: { part: "pinion", type: "rotation", speed: -0.8 },
  target: "frame",
  view: { direction: [0.06, 0.05, 1] },
  pose(a) {
    const { x } = frame(-a); // 主動量是小齒輪的轉角(逆時針為正);小齒輪順時針轉時框架照原文往返
    const parts = { frame: { position: [x, 0, 0] }, pinion: { angle: a } };
    ROLLERS.forEach(([, , side], i) => (parts[`roller${i}`] = { angle: (side * x) / ROLLER }));
    return { parts, readouts: [] };
  },
};
