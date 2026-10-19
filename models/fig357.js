// 第 357 種:陀螺儀調速器(Alban Anderson,1858 年專利)。重輪 A 的軸分成兩段 B、B¹,以萬向接頭相連:A 在 B 上,
// 小齒輪 I 在 B¹ 上。B 在中點以鉸接接頭裝在旋轉框架 H 上,所以 A 的傾角一變,B 的外端就升降。框架 H 由引擎經傘齒輪
// 帶動,小齒輪 I 繞著靜止的齒環 G 走,使 A 繞自己的軸快速旋轉。運轉時 A 傾向轉成垂直,彈簧 L 抵抗這個傾向;
// 轉得越快,越能克服彈簧,B 的外端被抬得越高,經桿 C、D 拉動閥桿;彈簧 L 經槓桿 N 與桿 P 接在閥桿上。
// 左右照原圖:萬向接頭(B′ 處的叉)與 I 在左,B 的外端在右、桿 C 從外端往上接閥桿 D;輪 A 的中心就在 B 中點的鉸接處。
// 主動件是虛擬的「進程」(持續運轉,做法同第 147、161、170、274、287 種):引擎經底座裡的傘齒輪帶著 H 的立軸轉,
// 轉速隨負載起伏(推斷):一輪 12 圈之內轉速由最慢升到最快再降回,轉速的平方隨進程直線升降,所以閥桿等速升降、
// 滑桿每一段都看得出變化。B 的傾角對 (轉速 / 上限)² 線性地從靜止時的傾斜趨近 0(輪面趨近垂直)、不越過。
// H 的立軸、底座的傘齒輪與水平軸照轉速的積分轉;I 照 H 轉過的角度沿 G 滾(G 有 64 齒、I 有 8 齒,H 轉一圈 I 自轉 8 圈),
// B¹ 經萬向接頭帶著 B 與輪 A 轉(十字頭的兩支銷互相垂直、各垂直於自己的軸,照實算出 B 的轉角)。
// 畫法慣例(決定 2026-10-14 (a),同第 162、287 種的飛球):H、B、B¹、A、C 畫在同一個平面上、不跟著立軸繞,
// 只畫各自的自轉;H 的框架因此畫成不轉的,立軸在它的轂裡轉;N、P、L、閥桿本來就不隨 H 轉。實物上桿 C 隨 H 繞立軸、
// 閥桿不轉,所以閥桿下端與桿 C 之間要有旋轉接頭(推斷,原圖沒畫,這裡因為 C 不繞而不畫)。
// 外殼照原圖的剖面畫成紙面上的一圈帶狀板:上面的罩、下面的碗與底座,G 是碗口上一圈冠狀的齒環。
// 推斷:傾角與轉速的對應(示意,不模擬角動量);轉速的起伏;H 的框架(立軸頂的轂、從後面托住鉸接軸的立臂、繞到 I 外側
// 托住 B¹ 的臂);鉸接的做法——B 在輪 A 兩側的兩個軸承裡轉,兩個軸承由一個從輪後面繞過的 U 形托架相連,托架中央往後
// 伸出鉸接軸、裝在 H 的立臂上,鉸接軸的軸線穿過輪 A 的中心;B 外端套著不轉的軸環,桿 C 的銷在軸環上;
// B¹ 的外端以球面軸套裝在 H 上(萬向接頭的中心隨 B 的內端升降,B¹ 跟著擺動並在軸套裡沿軸滑 0.04,I 在 G 上沿徑向
// 挪 0.04、上下 0.02);I 畫成正齒的小齒輪、G 是冠狀齒環(原圖 I 略呈錐形;冠狀齒環容得下 I 這樣的擺動與挪動);
// 槓桿 N 的樞軸銷在罩上、彈簧 L 的下端在罩外側的耳上;閥桿 D 穿過罩頂的導套;底座的傘齒輪、水平驅動軸與皮帶輪;
// 罩頂上的節流閥(throttle.js,做法照第 170 種:閥桿上段的環槽、叉形槓桿、閥桿、蒸汽管上的節流閥;槓桿的立柱立在罩上,
// 蒸汽管在後面、從地面上來):轉得太快時閥桿升高,把節流閥的閥桿往上拉、關小節流閥。
// 偏離插圖:萬向接頭離鉸接 0.7(原圖約 0.8),和外端一樣遠,鉸接在 B 的中點(原文);碗比原圖深一點,讓 H 的轂與臂
// 從輪 A 底下經過;N 的短臂朝右下、和桿 P 約略垂直(原圖朝下),長臂短一點,閥桿走完行程時彈簧不會被壓到底;
// 彈簧 L 掛在罩的外側一點(原圖貼著罩)。
import { X, Y, Z, TAU, deg, clamp, add, sub, scale, cross, norm, len, quatFromBasis, rot2 } from "./kit.js";
import { shape, thickLine, zCylinder } from "./shapes.js";
import { bevelGear, pitchCones, bevelContact, meshAngle } from "./gears.js";
import { throttle } from "./throttle.js";

export const RANGE = [0, 10]; // 轉速
export const PERIOD = 12; // 轉速起伏一輪,立軸平均轉的圈數
export const SLOWEST = 3; // 一輪之內最慢的轉速(最快是上限)
const PSI0 = deg(22); // 靜止時 B 的傾角(外端往下)
const PULL = 0.93; // 上限轉速時傾角剩下 1 − PULL
const HINGE = [0, 0, 0]; // B 中點的鉸接、輪 A 的中心
const R_J = 0.7; // 鉸接到萬向接頭的中心
const OUTER = 0.7; // 鉸接到外端軸環上桿 C 的銷
const WHEEL = { r: 0.85, inner: 0.6, length: 0.4, web: 0.1, hub: 0.15 };
const SHAFT_R = 0.05; // B
const SHAFT1_R = 0.045; // B¹
const FORK = { r: 0.13, yoke: 0.17 }; // 萬向接頭:叉的兩股離軸線、叉底離接頭中心
const CRADLE = { x: 0.36, back: -1.0, bar: 0.07 }; // U 形托架:兩個軸承沿 B 離鉸接、繞到輪後面的深度、桿粗
const H_BACK = -1.12; // H 立臂(鉸接軸的軸承)的深度
const HUB_Y = -1.15; // H 的轂(立軸頂)
const C_Z = 0.18; // 桿 C 那一層
const N_Z = 0.17; // 槓桿 N、彈簧 L 那一層
const P_Z = 0.23; // 桿 P 那一層
const FLOOR = -3.3;

const PSI_AT = (s) => PSI0 * (1 - PULL * clamp(s / RANGE[1], 0, 1) ** 2);
const PSI_MID = (PSI_AT(SLOWEST) + PSI_AT(RANGE[1])) / 2;
const I_Y = R_J * Math.sin(PSI_MID); // I 的軸心高度:萬向接頭在一輪之內升降範圍的中點
// 小齒輪 I 與冠狀齒環 G(齒朝上):I 照 H 轉過的角度沿 G 滾,咬在 G 的半徑 contact 處。
// G 的 top 是盤面(齒從這裡往上),節面在齒高的一半;I 的節圓貼著節面
export const I = { teeth: 8, radius: (1.78 * 8) / 64, width: 0.2 };
const G_DEPTH = 0.125;
export const G = { teeth: 64, contact: 1.78, inner: 1.62, outer: 1.9, depth: G_DEPTH, disc: 0.1, top: I_Y - I.radius - G_DEPTH / 2 };
export const BALL = [-2.0, I_Y, 0]; // B¹ 外端的球面軸套(在 I 外側)
const BALL_R = 0.07;
const D_I = G.contact - R_J * Math.cos(PSI_MID); // 萬向接頭中心到 I 的齒寬中點(沿 B¹)

// 桿 C、閥桿 D、桿 P、槓桿 N
const LC = 1.45; // 桿 C(外端軸環上的銷到閥桿下端的銷)
const LD = 1.0; // 閥桿下端的銷到上端的銷(D 點)
const GUIDE = [1.42, 1.9]; // 罩頂導套的上下端
const N_PIVOT = [-1.0, 1.55]; // 槓桿 N 的樞軸(在罩上)
const SPRING_FOOT = [-2.68, 0.76]; // 彈簧 L 的下端(罩外側的耳)

const uOf = (psi) => [Math.cos(psi), -Math.sin(psi), 0]; // B 的方向(由萬向接頭往外端)

/** 轉速 s → B 的傾角、萬向接頭中心、外端銷、閥桿下端與上端(D 點)的高度 */
export function governor(s) {
  const psi = PSI_AT(s);
  const u = uOf(psi);
  const joint = add(HINGE, scale(u, -R_J));
  const end = add(add(HINGE, scale(u, OUTER)), [0, 0, C_Z]);
  const bottom = end[1] + Math.sqrt(LC * LC - end[0] * end[0]);
  return { psi, joint, end, bottom, valve: bottom + LD };
}

// 轉速的平方在一輪之內直線升降(三角波):進程 0 最慢、半輪最快(做法同第 287 種)
const A2 = SLOWEST ** 2;
const B2 = RANGE[1] ** 2 - A2;
const tri = (p) => {
  const u = (((p / PERIOD) % 1) + 1) % 1;
  return u < 0.5 ? 2 * u : 2 - 2 * u;
};
/** 進程 p:當下的轉速 */
export const speedAt = (p) => Math.sqrt(A2 + B2 * tri(p));
// 轉速對進程的積分(解析解):前半輪 ∫ √(A + 2Bq/P) dq,後半輪和前半輪對稱
const rise = (x) => (PERIOD / (3 * B2)) * ((A2 + (2 * B2 * x) / PERIOD) ** 1.5 - A2 ** 1.5);
const HALF = rise(PERIOD / 2);
const NORMAL = (2 * HALF) / PERIOD; // 平均轉速:進程 1 是平均轉速下立軸轉一圈
/** 進程 p:H 的立軸的轉角(繞 +Y) */
export function spindleAngle(p) {
  const k = Math.floor(p / PERIOD);
  const x = p - k * PERIOD;
  const within = x <= PERIOD / 2 ? rise(x) : 2 * HALF - rise(PERIOD - x);
  return (TAU * (k * 2 * HALF + within)) / NORMAL;
}

// 底座裡的傘齒輪:立軸上的在上(錐頂朝下),水平驅動軸上的在右(錐頂朝左),兩者錐頂在立軸上
const [CONE_S, CONE_D] = pitchCones(16, 16);
const APEX = [0, -2.75, 0];
const SPINDLE_GEAR = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: 16, radius: 0.3, cone: CONE_S, width: 0.14 });
const DRIVE_GEAR = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: 16, radius: 0.3, cone: CONE_D, width: 0.14 });
const CONTACT = bevelContact(SPINDLE_GEAR, DRIVE_GEAR);
export const gears = { spindle: SPINDLE_GEAR, drive: DRIVE_GEAR, contact: CONTACT };
/** 進程 p:水平驅動軸的轉角(繞 +X)。立軸齒輪的軸朝下,立軸轉 θ 是它繞自己的軸轉 −θ;驅動軸齒輪的軸朝 −X */
export const driveAngle = (p) => -meshAngle(SPINDLE_GEAR, DRIVE_GEAR, -spindleAngle(p), CONTACT);

// 節流閥(推斷,throttle.js):樞軸在罩頂左邊的立柱上,叉臂跨在閥桿上段的環槽兩側;一輪之內最慢時全開、最快時幾乎關上
const WORKING = [governor(SLOWEST).valve, governor(RANGE[1]).valve];
const GROOVE = { top: 0.45, height: 0.1, neck: 0.075, outer: 0.15 }; // 閥桿上段的環槽(槽頂離 D 點)
const COLLAR = 0.2; // 環槽上面那段(環槽的上壁)
const PX = -1.3;
// 罩(帶狀板的中心線,左半;右半對稱)。從碗口的 G 座往外、往上,繞到頂上的導套
const BELL = [[-2.0, -0.28], [-2.2, -0.08], [-2.36, 0.15], [-2.44, 0.42], [-2.42, 0.68], [-2.3, 0.93], [-2.08, 1.15], [-1.78, 1.32], [-1.42, 1.44], [-1.0, 1.55], [-0.6, 1.65], [-0.25, 1.73], [-0.06, 1.76]];
const BELL_W = 0.12;
const BELL_T = 0.18;
// 罩的上段(左半)在 x 處的中心線高度:槓桿立柱立在這裡
const bellY = (x) => {
  for (let i = 1; i < BELL.length; i++) {
    const [a, b] = [BELL[i - 1], BELL[i]];
    if ((x - a[0]) * (x - b[0]) <= 0 && a[1] > 0.5) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return null;
};
const VALVE = throttle({
  pivot: [PX, (WORKING[0] + WORKING[1]) / 2 + GROOVE.top - GROOVE.height / 2],
  rodAt: 0.6,
  crank: 0.08,
  drop: 0.7,
  groove: GROOVE,
  range: WORKING,
  floor: FLOOR,
  postFloor: bellY(PX) - BELL_W / 4, // 槓桿的立柱立在罩上
  pipeZ: -0.5,
  pipeEnds: [-2.85, 2.85], // 蒸汽管從罩頂後面橫過,兩端在外殼外側往下轉進地面
});
/** 進程 p:節流閥的開度(1 全開、0 全關) */
export const opening = (p) => VALVE.solve(governor(speedAt(p)).valve).opening;

// 槓桿 N:樞軸在罩上;短臂朝右下、末端的銷接桿 P,長臂往左上、末端接彈簧 L 的上端。中間姿勢時 N 的轉角為 0
const N_SHORT = [0.5, -0.37]; // 中間姿勢時短臂末端相對樞軸
const N_LONG = [-1.68, 0.4]; // 中間姿勢時長臂末端相對樞軸
const T_MID = (WORKING[0] + WORKING[1]) / 2;
const LP = Math.hypot(N_PIVOT[0] + N_SHORT[0], N_PIVOT[1] + N_SHORT[1] - T_MID); // 桿 P 的長度
const R_SHORT = Math.hypot(...N_SHORT);
const A_SHORT = Math.atan2(N_SHORT[1], N_SHORT[0]);
/** 閥桿上端 D 點的高度 → 槓桿 N 的轉角(桿 P 長度不變,短臂末端在以樞軸為圓心的圓上、取靠近中間姿勢的交點) */
export function leverAngle(valve) {
  const T = [0, valve];
  const d = Math.hypot(T[0] - N_PIVOT[0], T[1] - N_PIVOT[1]);
  const base = Math.atan2(T[1] - N_PIVOT[1], T[0] - N_PIVOT[0]);
  const off = Math.acos(clamp((d * d + R_SHORT * R_SHORT - LP * LP) / (2 * d * R_SHORT), -1, 1));
  // 短臂末端在 樞軸→D 的連線下方(順時針那一側)
  return base - off - A_SHORT;
}
/** 槓桿 N 轉 a 時短臂與長臂末端的位置 */
export const leverEnds = (a) => ({
  short: add([...N_PIVOT, 0], [...rot2(N_SHORT, a), 0]),
  long: add([...N_PIVOT, 0], [...rot2(N_LONG, a), 0]),
});

// ── 萬向接頭與兩段軸的朝向 ─────────────────
// B¹:軸線由球面軸套中心指向萬向接頭中心;叉的兩股沿 p1(B¹ 轉 θ1 時由 +Z 繞 B¹ 的軸轉過 θ1)。
// B:軸線 u(由萬向接頭往外端);叉的兩股沿 p2 = u × p1(十字頭的兩支銷互相垂直、各垂直於自己的軸)
/** 進程 p → 各段的朝向與轉角 */
export function shafts(p) {
  const s = speedAt(p);
  const g = governor(s);
  const theta = spindleAngle(p);
  const a1 = norm(sub(g.joint, BALL));
  const e = Z;
  const f = cross(a1, e);
  const theta1 = (G.teeth / I.teeth) * theta; // I 沿 G 滾:H 轉 θ,I 繞自己的軸轉 (64 / 8)·θ
  const p1 = add(scale(e, Math.cos(theta1)), scale(f, Math.sin(theta1)));
  const u = uOf(g.psi);
  const p2 = norm(cross(u, p1));
  return { s, g, theta, theta1, a1, p1, u, p2, slide: len(sub(g.joint, BALL)) };
}

// ── 零件 ─────────────────────────────
const forkPieces = (sign) => [
  // 叉底(橫在軸上)與兩股(沿局部 x 離軸線 FORK.r,十字頭的銷穿過)
  { kind: "box", size: [2 * (FORK.r + 0.02), 0.08, 0.05], at: [0, 0, sign * FORK.yoke] },
  ...[-1, 1].map((k) => ({ kind: "box", size: [0.04, 0.08, FORK.yoke + 0.075], at: [k * FORK.r, 0, sign * (FORK.yoke - 0.05) / 2 + sign * 0.0125] })),
];

// 外殼:罩、碗、G 座、立軸穿過的軸承座與管、底座(兩側壁、頂盤、底板)、水平軸的軸承、彈簧耳、N 的樞軸銷
const bellHalf = (k) => ({ kind: "plate", shape: shape(thickLine(BELL.map(([x, y]) => [k * x, y]), BELL_W)), thickness: BELL_T });
const U_IN = { a: G.inner + 0.03, b: 1.3, y: -0.33 };
const U_OUT = { a: 2.05, b: 1.6, y: -0.33 };
const GAP = 0.08; // 碗底讓立軸穿過的缺口(半寬)
const bowlHalf = (k) => {
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (i / n) * (Math.PI / 2 - Math.asin(GAP / U_OUT.a));
    pts.push([k * -Math.abs(U_OUT.a * Math.cos(t)), U_OUT.y + U_OUT.b * Math.sin(t)]);
  }
  for (let i = n; i >= 0; i--) {
    const t = Math.PI + (i / n) * (Math.PI / 2 - Math.asin(GAP / U_IN.a));
    pts.push([k * -Math.abs(U_IN.a * Math.cos(t)), U_IN.y + U_IN.b * Math.sin(t)]);
  }
  return { kind: "plate", shape: shape(k > 0 ? pts.reverse() : pts), thickness: 0.15 };
};
const BOWL_BOTTOM = U_OUT.y - U_OUT.b; // 碗外底
const PED_TOP = -2.25; // 底座頂盤
const PED_X = 0.62; // 底座兩側壁
const casing = [
  bellHalf(1),
  bellHalf(-1),
  { kind: "cylinder", axis: Y, radius: 0.12, inner: 0.055, length: GUIDE[1] - GUIDE[0], at: [0, (GUIDE[0] + GUIDE[1]) / 2, 0] }, // 罩頂的導套
  // G 座:碗口上的一圈環,上面是冠狀齒環 G
  { kind: "cylinder", axis: Y, radius: U_OUT.a, inner: G.inner, length: G.top - G.disc - U_OUT.y + 0.0, at: [0, (G.top - G.disc + U_OUT.y) / 2, 0] },
  bowlHalf(1),
  bowlHalf(-1),
  { kind: "cylinder", axis: Y, radius: 0.14, inner: 0.065, length: U_IN.y - U_IN.b + 0.1 - (BOWL_BOTTOM - 0.05), at: [0, (U_IN.y - U_IN.b + 0.1 + BOWL_BOTTOM - 0.05) / 2, 0] }, // 碗底的軸承座
  { kind: "cylinder", axis: Y, radius: 0.13, inner: 0.065, length: BOWL_BOTTOM - 0.05 - PED_TOP, at: [0, (BOWL_BOTTOM - 0.05 + PED_TOP) / 2, 0] }, // 碗底到底座的管
  { kind: "cylinder", axis: Y, radius: 0.7, inner: 0.065, length: 0.12, at: [0, PED_TOP - 0.06, 0] }, // 底座頂盤
  ...[-1, 1].map((k) => ({ kind: "box", size: [0.12, PED_TOP - 0.12 - (FLOOR + 0.15), 0.7], at: [k * PED_X, (PED_TOP - 0.12 + FLOOR + 0.15) / 2, 0] })),
  { kind: "box", size: [6.2, 0.15, 1.5], at: [0, FLOOR + 0.075, -0.2] }, // 底板(蒸汽管兩端也立在上面)
  { kind: "cylinder", axis: Y, radius: 0.13, inner: 0.06, length: 0.2, at: [0, FLOOR + 0.25, 0] }, // 立軸下端的止推軸承
  { kind: "cylinder", axis: X, radius: 0.12, inner: 0.05, length: 0.3, at: [PED_X + 0.05, APEX[1], 0] }, // 水平軸的軸承
  // 彈簧 L 下端的耳(從罩的外側伸出)與 N 的樞軸銷
  { kind: "box", size: [0.4, 0.06, 0.26], at: [-2.56, SPRING_FOOT[1] - 0.03, 0.08] },
  zCylinder(0, N_Z + 0.05, 0.035, N_PIVOT),
  ...VALVE.framePieces,
];

// H 的框架(畫成不轉的):立軸頂的轂;往後、再往上到鉸接軸軸承的立臂;從轂往左、在 B¹ 後面升起、越過 I 托住球面軸套的臂
const H_ARM = [[0, HUB_Y], [-0.6, HUB_Y], [-1.15, -0.9], [-1.45, -0.35], [-1.45, 0.55], [-2.0, 0.55], [-2.0, BALL[1] + 0.06]];
const frameH = [
  { kind: "cylinder", axis: Y, radius: 0.14, inner: 0.06, length: 0.2, at: [0, HUB_Y, 0] },
  { kind: "box", size: [0.1, 0.1, -H_BACK + 0.05 - 0.1], at: [0, HUB_Y, (H_BACK - 0.05 - 0.1) / 2] },
  { kind: "box", size: [0.1, -HUB_Y + 0.05, 0.1], at: [0, (HUB_Y - 0.05) / 2, H_BACK] },
  { kind: "cylinder", radius: 0.1, inner: 0.04, length: 0.1, at: [0, 0, H_BACK] }, // 鉸接軸的軸承
  { kind: "plate", shape: shape(thickLine(H_ARM, 0.1)), thickness: 0.1, at: [0, 0, -0.15] },
  { kind: "cylinder", axis: X, radius: 0.13, inner: BALL_R, length: 0.1, at: BALL }, // 球面軸套的座
];

// 桿 C:從外端軸環上的銷彎向右、再往上接閥桿下端的銷(原圖是一根彎桿;彎出去讓過輪 A 的輪緣)
const C_BOW = 0.42;
const C_SHAPE = Array.from({ length: 17 }, (_, i) => [(LC * i) / 16, -C_BOW * Math.sin((Math.PI * i) / 16)]);

export default {
  figure: 357,
  parts: [
    {
      // 外殼(固定)
      id: "casing",
      kind: "group",
      pieces: casing,
    },
    // 冠狀齒環 G:裝在 G 座上,齒朝上
    { id: "ringG", kind: "gear", crown: true, teeth: G.teeth, radius: G.outer, faceWidth: G.outer - G.inner - 0.03, toothDepth: G.depth, width: G.disc, ring: G.inner, hub: false, axis: Y, center: [0, G.top - G.disc / 2, 0], arrow: false, label: "G", labelOffset: [-1.95, 0.25, 0.3] },
    { id: "labelG2", kind: "group", center: [1.85, G.top, 0], label: "G", labelOffset: [0.15, 0.2, 0.3] },
    {
      // H 的立軸與下端的傘齒輪,一起轉(頂端插在 H 的轂裡)
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.42,
      spinOffset: SPINDLE_GEAR.center[1],
      pieces: [
        { kind: "cylinder", radius: 0.06, length: HUB_Y + 0.08 - (FLOOR + 0.17), at: [0, 0, (HUB_Y + 0.08 + FLOOR + 0.17) / 2] },
        { kind: "gear", teeth: 16, radius: SPINDLE_GEAR.radius, cone: SPINDLE_GEAR.cone, width: SPINDLE_GEAR.width, axis: [0, 0, -1], at: [0, 0, SPINDLE_GEAR.center[1]] },
      ],
    },
    {
      // 引擎經這根水平軸、皮帶輪與傘齒輪帶動 H 的立軸(零件的局部 +Z 是世界的 +X;齒輪的錐頂朝左)
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: DRIVE_GEAR.center,
      spin: 0.36,
      spinOffset: 1.3 - DRIVE_GEAR.center[0],
      pieces: [
        { kind: "gear", teeth: 16, radius: DRIVE_GEAR.radius, cone: DRIVE_GEAR.cone, width: DRIVE_GEAR.width, axis: [0, 0, -1] },
        { kind: "cylinder", radius: 0.05, length: 1.5 - DRIVE_GEAR.center[0], at: [0, 0, (1.5 - DRIVE_GEAR.center[0]) / 2] },
        { kind: "cylinder", radius: 0.3, length: 0.15, at: [0, 0, 1.3 - DRIVE_GEAR.center[0]], mark: true }, // 皮帶輪
      ],
    },
    { id: "frameH", kind: "group", label: "H", labelOffset: [0.45, -1.0, 0.3], pieces: frameH },
    {
      // B¹ 與小齒輪 I(局部原點在萬向接頭中心、局部 +Z 沿 B¹ 指向接頭,局部 x 是叉的兩股)
      id: "shaftB1",
      kind: "group",
      spin: 0.36,
      spinOffset: -D_I,
      pieces: [
        { kind: "cylinder", radius: SHAFT1_R, length: D_I + 0.42 - FORK.yoke, at: [0, 0, -(D_I + 0.42 + FORK.yoke) / 2] },
        { kind: "gear", teeth: I.teeth, radius: I.radius, width: I.width, at: [0, 0, -D_I] },
        ...forkPieces(-1),
      ],
    },
    { id: "labelI", kind: "group", center: [-G.contact, I_Y, 0], label: "I", labelOffset: [-0.1, 0.45, 0.3] },
    {
      // 球面軸套:B¹ 穿在它的孔裡、可以沿軸滑;球在 H 的座裡隨 B¹ 擺
      id: "bushing",
      kind: "sphere",
      radius: BALL_R,
      center: BALL,
    },
    {
      // 萬向接頭的十字頭:兩支互相垂直的銷,局部 x 穿過 B¹ 的叉、局部 y 穿過 B 的叉
      id: "cross",
      kind: "group",
      label: "B′",
      labelOffset: [-0.15, 0.4, 0.3],
      pieces: [
        { kind: "box", size: [0.08, 0.08, 0.08] },
        { kind: "cylinder", axis: X, radius: 0.025, length: 2 * (FORK.r + 0.025) },
        { kind: "cylinder", axis: Y, radius: 0.025, length: 2 * (FORK.r + 0.025) },
      ],
    },
    {
      // B 與輪 A(局部原點在鉸接、局部 +Z 沿 B 指向外端,局部 x 是叉的兩股)。A 是剖面那樣的厚輪:輪緣、腹板、輪轂
      id: "shaftB",
      kind: "group",
      label: "B",
      labelOffset: [-0.45, 0.2, 0.3],
      spin: WHEEL.r + 0.12,
      spinOffset: WHEEL.length / 2 + 0.04,
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: OUTER + 0.095 + R_J - FORK.yoke, at: [0, 0, (OUTER + 0.095 - R_J + FORK.yoke) / 2] },
        { kind: "cylinder", radius: WHEEL.r, inner: WHEEL.inner, length: WHEEL.length },
        { kind: "cylinder", radius: WHEEL.inner + 0.01, length: WHEEL.web },
        { kind: "cylinder", radius: WHEEL.hub, length: WHEEL.length },
        { kind: "cylinder", radius: 0.08, length: 0.04, at: [0, 0, OUTER + 0.075] }, // 外端的擋頭(軸環套在它裡面)
        ...forkPieces(1).map((p) => ({ ...p, at: [p.at[0], p.at[1], p.at[2] - R_J] })),
      ],
    },
    { id: "labelA", kind: "group", center: [0.15, 0.6, 0], label: "A", labelOffset: [0, 0.2, 0.9] },
    {
      // 托住 B 的 U 形托架:輪 A 兩側的軸承,從輪後面繞過,中央往後伸出鉸接軸(軸線穿過輪 A 的中心)
      id: "cradle",
      kind: "group",
      center: HINGE,
      arrow: false,
      pieces: [
        ...[-1, 1].flatMap((k) => [
          { kind: "cylinder", axis: X, radius: 0.09, inner: SHAFT_R, length: 0.08, at: [k * CRADLE.x, 0, 0] },
          { kind: "box", size: [CRADLE.bar, CRADLE.bar, -CRADLE.back], at: [k * CRADLE.x, 0, CRADLE.back / 2] },
        ]),
        { kind: "box", size: [2 * CRADLE.x + CRADLE.bar, CRADLE.bar, CRADLE.bar], at: [0, 0, CRADLE.back] },
        zCylinder(H_BACK - 0.08, CRADLE.back, 0.04),
      ],
    },
    {
      // B 外端的軸環(不轉):B 在它裡面轉,桿 C 的銷在它前面
      id: "collar",
      kind: "group",
      center: HINGE,
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, inner: SHAFT_R, length: 0.1, at: [OUTER, 0, 0] },
        zCylinder(0.06, C_Z + 0.06, 0.03, [OUTER, 0]),
      ],
    },
    {
      // 桿 C:局部原點在下端(軸環的銷)、局部 +x 指向上端(閥桿下端的銷)
      id: "rodC",
      kind: "group",
      arrow: false,
      label: "C",
      labelOffset: [0.45, 0.75, 0.2],
      pieces: [
        { kind: "plate", shape: shape(thickLine(C_SHAPE, 0.07)), thickness: 0.05 },
        { kind: "cylinder", radius: 0.06, length: 0.05 },
        { kind: "cylinder", radius: 0.06, length: 0.05, at: [LC, 0, 0] },
      ],
    },
    {
      // 閥桿 D:局部原點在上端的銷(D 點);下端的銷接桿 C,上段車出環槽(叉形槓桿的銷伸在裡面),中段穿過罩頂的導套
      id: "valveD",
      kind: "group",
      arrow: false,
      label: "D",
      labelOffset: [0.25, 0.15, 0.3],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.05, length: LD + 0.06 + GROOVE.top + COLLAR + 0.1, at: [0, (GROOVE.top + COLLAR + 0.1 - LD - 0.06) / 2, 0] },
        zCylinder(-0.06, C_Z + 0.05, 0.03, [0, -LD]), // 下端的銷:桿 C 套在上面
        { kind: "cylinder", radius: 0.08, length: 0.12 }, // 上端的轂
        zCylinder(0, P_Z + 0.05, 0.03), // 上端的銷:桿 P 套在上面
        { kind: "cylinder", axis: Y, radius: GROOVE.outer, length: COLLAR, at: [0, GROOVE.top + COLLAR / 2, 0] }, // 環槽的上壁
        ...VALVE.sleevePieces(),
      ],
    },
    {
      // 槓桿 N:樞軸銷在罩上;短臂的銷接桿 P,長臂的末端接彈簧 L
      id: "leverN",
      kind: "group",
      center: [...N_PIVOT, N_Z],
      arrow: false,
      label: "N",
      labelOffset: [-0.9, 0.5, 0.2],
      pieces: [
        { kind: "plate", shape: shape(thickLine([N_LONG, [0, 0], N_SHORT], 0.09)), thickness: 0.05 },
        { kind: "cylinder", radius: 0.09, length: 0.05 },
        zCylinder(-0.03, P_Z - N_Z + 0.05, 0.03, N_SHORT),
        zCylinder(-0.025, 0.025, 0.04, N_LONG),
      ],
    },
    { id: "rodP", kind: "link", width: 0.08, thickness: 0.05, label: "P", labelOffset: [0.05, 0.45, 0.2] },
    { id: "springL", kind: "spring", coils: 7, radius: 0.08, wire: 0.022, label: "L", labelOffset: [-0.3, 0.6, 0.2] },
    ...VALVE.parts,
  ],
  // 外力來源:引擎帶動的水平軸;shaftB 另列,因為畫法慣例讓 H 不轉,傘齒輪 → 立軸 → H → I 這條帶動鏈在 H 斷掉——
  // 實物上 B¹、萬向接頭、B 與輪 A 的自轉由 I 沿 G 滾帶動,B 的傾斜則由輪 A 的陀螺效應扳動
  powered: ["driveShaft", "shaftB"],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 0.5 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.15, 0.12, 1] },
  pose(p) {
    const k = shafts(p);
    const { g } = k;
    const lever = leverAngle(g.valve);
    const ends = leverEnds(lever);
    const tilt = -g.psi;
    const C0 = g.end;
    const C1 = [0, g.bottom, C_Z];
    return {
      parts: {
        spindle: { angle: k.theta },
        driveShaft: { angle: driveAngle(p) },
        shaftB1: { position: g.joint, rotation: quatFromBasis(k.p1, cross(k.a1, k.p1), k.a1) },
        bushing: { position: BALL, rotation: quatFromBasis(Z, cross(k.a1, Z), k.a1) },
        cross: { position: g.joint, rotation: quatFromBasis(k.p1, k.p2, cross(k.p1, k.p2)) },
        shaftB: { position: HINGE, rotation: quatFromBasis(k.p2, cross(k.u, k.p2), k.u) },
        cradle: { angle: tilt },
        collar: { angle: tilt },
        rodC: { position: C0, angle: Math.atan2(C1[1] - C0[1], C1[0] - C0[0]) },
        valveD: { position: [0, g.valve, 0] },
        leverN: { angle: lever },
        rodP: { from: [ends.short[0], ends.short[1], P_Z], to: [0, g.valve, P_Z] },
        springL: { from: [...SPRING_FOOT, N_Z], to: [ends.long[0], ends.long[1], N_Z] },
        ...VALVE.pose(g.valve),
      },
      readouts: [
        { label: "轉速", value: `${k.s.toFixed(1)}(${k.s > speedAt(p - 0.01) ? "漸快" : "漸慢"})` },
        { label: "B 的傾角", value: `${((g.psi * 180) / Math.PI).toFixed(1)}°` },
        { label: "節流閥開度", value: `${Math.round(VALVE.solve(g.valve).opening * 100)}%` },
      ],
    };
  },
  waivers: [
    {
      check: "interference",
      parts: ["ringG", "shaftB1"],
      reason: "畫法慣例(決定 2026-10-14 (a)):H、B¹ 不跟著立軸繞,I 只畫自轉,所以 I 的齒在靜止的 G 上原地轉、和 G 的齒相碰;實物上 I 隨 H 沿 G 滾、齒照節圓咬合",
    },
  ],
};

export const geometry = { HINGE, R_J, OUTER, LC, LD, LP, N_PIVOT, N_SHORT, N_LONG, SPRING_FOOT, GUIDE, D_I, WHEEL, CRADLE, C_Z, P_Z, N_Z, WORKING, valve: VALVE.geometry };
