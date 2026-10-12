// 第 269 種:缺齒式齒條的框架。框架上下各有幾段只在部分長度上有齒的齒條,上下交錯排列(照原圖,由左到右:
// 上 4 齒、下 4 齒、上 6 齒、下 1 齒),正齒輪夾在中間。框架朝一個方向持續直線移動時,齒輪輪流被上、下齒條帶動:
// 上齒條帶動時往一個方向轉,換到下齒條就反過來轉,齒輪得到交替方向的旋轉運動。主動件是框架(右端的桿)。
// 齒輪的轉角由齒與齒相碰算(contact.js 的「推到不重疊」):框架往右每走一小步,碰到齒輪的齒條齒把齒輪推到
// 剛好不再重疊(上齒條推順時針、下齒條推逆時針);沒有齒碰到時齒輪停著。
// 偏離插圖(實物可行 > 插圖外形):原圖的各段齒緊接著(上齒條兩段之間的空檔正好是下齒條那一段),照這樣排,
// 換排時上一段的齒還在齒輪的齒頂圓裡、下一段的齒已經推到齒輪,兩邊往反方向推,框架會卡死
// (507movements 的網站註記也說動畫改了幾顆齒,免得在換排處卡住)。所以相鄰兩段最近的兩齒之間留 GAP,
// 讓前一段的齒完全離開齒輪之後,下一段的齒才碰到齒輪;框架因此比原圖長,行程也跟著變長。
// 推斷:各段之間的空檔與行程;齒輪軸的軸承座;桿的導套與導套下面的立柱(原圖右端的直立長方塊)。
import { TAU, clamp } from "./kit.js";
import { rackShape, toothOutline } from "./shapes.js";
import { placeOutline, polygonsOverlap, pushUntilClear } from "./contact.js";
import { pedestal, squareGuide } from "./supports.js";

const N = 16;
const R = 0.85;
const P = (TAU * R) / N; // 齒距
const ALPHA = TAU / N;
const M = P / Math.PI; // 模數(齒冠高)
const GAP = 4 * P; // 相鄰兩段最近兩齒的中心距:前一段的齒還在齒頂圓裡、下一段的齒就推到齒輪時會卡死(逐步推算:3.5 齒距會卡,4 齒距不會)
const BACK = 0.18; // 齒條背板厚

// 各段齒條(框架座標,齒的中心 x;上齒條齒朝下、節線在 y = R,下齒條齒朝上、節線在 y = −R)。
// 初始位置(框架位移 0)時,上 6 齒那一段的第 3 齒正對齒輪正上方,和原圖一樣齒輪咬著右邊那段上齒條。
const C0 = -2 * P;
const SEGMENTS = (() => {
  const c = { side: "top", teeth: 6, first: C0 };
  const b = { side: "bottom", teeth: 4, first: C0 - GAP - 3 * P };
  const a = { side: "top", teeth: 4, first: b.first - GAP - 3 * P };
  const d = { side: "bottom", teeth: 1, first: C0 + 5 * P + GAP };
  return [a, b, c, d];
})();
const teethOf = (seg) => Array.from({ length: seg.teeth }, (_, k) => seg.first + k * P);
const lastOf = (seg) => seg.first + (seg.teeth - 1) * P;

// 單一齒條齒的外形(含一小段背板),用來判斷和齒輪相碰;上齒條轉半圈讓齒朝下
const TOOTH = { bottom: rackShape({ teeth: 1, pitch: P, depth: BACK }).outline };
TOOTH.top = placeOutline(TOOTH.bottom, [0, 0], Math.PI);
const RACK_X = { top: [], bottom: [] };
for (const seg of SEGMENTS) RACK_X[seg.side].push(...teethOf(seg));
const GEAR_TEETH = Array.from({ length: N }, (_, i) => toothOutline({ teeth: N, radius: R }, i));
const TIP = R + M;
const REACH = Math.sqrt(TIP * TIP - (R - M) * (R - M)) + P / 2; // 齒條的齒離齒輪中心線多遠以內才伸得進齒頂圓(寬裕地多算半個齒距)

const LOCAL = TOOTH.bottom.map(() => [0, 0]); // 重複使用,逐步推算時不必每次配置
/** 框架位移 s、齒輪轉角 angle 時,side 那一排齒條有沒有齒和齒輪的齒重疊(在齒輪的局部座標裡比) */
function hits(side, s, angle) {
  const y = side === "top" ? R : -R;
  const [c, sn] = [Math.cos(-angle), Math.sin(-angle)];
  for (const x of RACK_X[side]) {
    const X = x + s;
    if (Math.abs(X) > REACH) continue; // 碰不到齒頂圓的齒
    TOOTH[side].forEach(([u, v], k) => {
      LOCAL[k][0] = (u + X) * c - (v + y) * sn;
      LOCAL[k][1] = (u + X) * sn + (v + y) * c;
    });
    // 只看朝這一齒的方向前後各一個半齒距內的齒輪齒
    const i0 = Math.round((Math.atan2(y, X) - angle) / ALPHA);
    for (let i = i0 - 1; i <= i0 + 1; i++) if (polygonsOverlap(GEAR_TEETH[((i % N) + N) % N], LOCAL)) return true;
  }
  return false;
}

/** 齒條把齒輪往 dir 推到剛好不再重疊;齒輪的齒間空隙很小,分小步試,免得一步推過頭撞上另一側 */
function push(angle, dir, limit, overlaps) {
  if (!overlaps(angle)) return angle;
  const STEP = 0.003;
  for (let k = 1; k * STEP <= limit + STEP; k++) {
    if (overlaps(angle + dir * k * STEP)) continue;
    return pushUntilClear(angle + dir * (k - 1) * STEP, dir, STEP, overlaps, 12); // 精度約 1e-6 弧度
  }
  return angle;
}

// 行程:兩端都走到最後一齒完全離開齒輪的齒頂圓之外,再多走一點
const CLEAR = TIP + P / 2 + 0.12;
export const RANGE = [-(lastOf(SEGMENTS[3]) + CLEAR), -(SEGMENTS[0].first - CLEAR)];

// 齒輪轉角表:框架從行程左端往右走(s 增加),每走一小步,上齒條把齒輪往順時針、下齒條往逆時針推到剛好不再重疊。
// 框架往左走時畫面用同一張表(齒面換成另一側相碰,差的是齒間那一點點空隙)。
// 起點的齒輪轉角:先讓右端那一齒(下 1 齒)正在齒輪正下方、齒槽置中,把框架往左退到行程左端(反方向推),
// 得到它碰到齒輪之前齒輪停在哪裡。
const DS = 0.02;
const CENTERED = Math.PI / 2 - ALPHA / 2; // 齒輪的齒 i 在 i·α;齒槽正對正上方(齒數是偶數,正下方也是齒槽)
function sweep(from, to, start, jams) {
  const dir = Math.sign(to - from);
  const table = [];
  let angle = start;
  const limit = (3 * DS) / R;
  const steps = Math.ceil(Math.abs(to - from) / DS);
  for (let k = 0; k <= steps; k++) {
    const s = from + dir * k * DS;
    angle = push(angle, -dir, limit, (a) => hits("top", s, a));
    angle = push(angle, dir, limit, (a) => hits("bottom", s, a));
    if (hits("top", s, angle) || hits("bottom", s, angle)) jams.push(s);
    table.push(angle);
  }
  return table;
}
// 第一次用到時才算(約一千步,每步把齒輪推到不重疊)
let tables;
function sweepTables() {
  if (!tables) {
    const jams = [];
    const seed = sweep(-SEGMENTS[3].first, RANGE[0], CENTERED, jams).at(-1);
    tables = { forward: sweep(RANGE[0], RANGE[1], seed, jams), jams };
  }
  return tables;
}
/** 推不開(卡死)的框架位移;實物可行時是空的 */
export const jams = () => sweepTables().jams;

/** 框架位移 s(往右為正)→ 齒輪轉角(由齒條的齒推動齒輪的齒算出) */
export function gear(s0) {
  const table = sweepTables().forward;
  const f = (clamp(s0, ...RANGE) - RANGE[0]) / DS;
  const i = Math.min(Math.floor(f), table.length - 2);
  const t = f - i;
  return table[i] * (1 - t) + table[i + 1] * t;
}

/** 框架位移 s 時各段齒條的外形(世界座標的 2D 折線),測試量穿入用 */
export function rackOutlines(s) {
  return SEGMENTS.map((seg) => {
    const center = seg.first + ((seg.teeth - 1) * P) / 2;
    const outline = rackShape({ teeth: seg.teeth, pitch: P, depth: BACK }).outline;
    return { side: seg.side, outline: placeOutline(outline, [center + s, seg.side === "top" ? R : -R], seg.side === "top" ? Math.PI : 0) };
  });
}

const YT = R + 1.2 * M + BACK; // 齒條背板外緣
const RIGHT = lastOf(SEGMENTS[3]) + CLEAR + TIP + 0.12 + 0.18; // 框架右側直邊的外緣(框架座標):行程右端齒輪碰不到
const LEFT = SEGMENTS[0].first - CLEAR - TIP - 0.2; // 框架左端(開口):行程左端齒輪仍在上下兩條邊之間
const GUIDE_X = RIGHT + RANGE[1] + 0.35; // 導套(世界座標):框架走到最右也碰不到
const ROD = GUIDE_X + 0.4 - (RIGHT + RANGE[0]); // 桿長:框架走到最左時桿端仍穿出導套
const FLOOR = -2.0;
const box = (x0, x1, y, h) => ({ kind: "box", size: [x1 - x0, h, 0.22], at: [(x0 + x1) / 2, y, 0] });

export const geometry = { N, R, P, M, GAP, SEGMENTS, TIP, GUIDE_X, ROD, RIGHT, FLOOR };

export default {
  figure: 269,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...SEGMENTS.map((seg) => ({
          kind: "plate",
          shape: rackShape({ teeth: seg.teeth, pitch: P, depth: BACK }),
          thickness: 0.22,
          at: [seg.first + ((seg.teeth - 1) * P) / 2, seg.side === "top" ? R : -R, 0],
          angle: seg.side === "top" ? Math.PI : 0,
        })),
        // 框架:上下兩條邊(齒條背板延伸)、右側直邊、往右伸出的桿
        box(LEFT, RIGHT, YT - 0.09, 0.18),
        box(LEFT, RIGHT, -YT + 0.09, 0.18),
        box(RIGHT - 0.18, RIGHT, 0, 2 * YT),
        { kind: "box", size: [ROD, 0.16, 0.16], at: [RIGHT + ROD / 2, 0, 0] },
      ],
    },
    {
      id: "gear",
      kind: "gear",
      teeth: N,
      radius: R,
      width: 0.22,
      bore: 0.08,
      spin: 0.55, // 轉向箭頭畫在齒輪面上、框架前面(照預設畫在齒頂外會被上齒條擋住)
      spinOffset: 0.2,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 0.9, at: [0, 0, -0.3] }],
    },
    { id: "stand", kind: "group", pieces: pedestal({ at: [0, 0], z: -0.6, bore: 0.08, floor: FLOOR }) }, // 齒輪軸的軸承座(在框架後面)
    {
      id: "guide",
      kind: "group",
      pieces: [
        ...squareGuide({ at: [GUIDE_X, 0, 0], width: 0.16, thickness: 0.16, length: 0.3, wall: 0.08 }),
        { kind: "box", size: [0.3, -0.16 - FLOOR, 0.32], at: [GUIDE_X, (FLOOR - 0.16) / 2, 0] }, // 導套下面的立柱
        { kind: "box", size: [1.0, 0.18, 0.6], at: [GUIDE_X, FLOOR - 0.09, 0] }, // 底板
      ],
    },
  ],
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], range: RANGE, initial: 0 },
  target: "gear", // 交替換向的齒輪
  // 框架整個行程掃過的範圍很寬(行程約等於齒條全長):取景只以齒輪、軸承座與導套為準,框架從齒輪兩邊滑過
  view: { direction: [0.04, 0.05, 1], fit: ["gear", "stand", "guide"] },
  pose(s0) {
    const s = clamp(s0, ...RANGE);
    return { parts: { frame: { position: [s, 0, 0] }, gear: { angle: gear(s) } }, readouts: [] };
  },
};
