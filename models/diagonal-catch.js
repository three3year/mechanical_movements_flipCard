// 第 181、182 種的斜向卡榫(diagonal catch),由接觸算。純函式,平面在 xy。
// 推斷(原圖只畫出 S 形卡榫與兩個軸頭):兩根軸的前面各有一片凸輪(圓弧 + 一個凹口,凹口的一邊是斜面),
// 卡榫鉸在兩軸中間的樞軸上,上下兩端各有一根指頭靠在凸輪上。
// - A 位置(第 181 種):上方指頭落在上凸輪的凹口裡,上方手柄被配重往順時針拉,斜面把指頭往外頂;
//   下方指頭靠在下凸輪的圓弧上(力沿半徑,不擋下軸轉),卡榫轉不動,上方手柄被鎖住。
// - 撥爪把下方手柄抬到頭時,下凸輪的斜面剛好轉到下方指頭底下:上方手柄的配重經斜面把卡榫往逆時針推,
//   上方指頭爬出凹口、下方指頭沿斜面落進下凸輪的凹口;上方指頭爬到圓弧上的那一刻上方手柄被放開,甩到 B。
// - B 位置(第 182 種):上方指頭靠在上凸輪的圓弧上,下方手柄靠自重往逆時針落、斜面把下方指頭往外頂,
//   卡榫轉不動,下方手柄被鎖住;撥爪把上方手柄壓回 A 時,上凸輪的凹口轉回指頭底下,下方手柄經斜面把卡榫推回、
//   上方指頭落進凹口,上方手柄壓到 A 的那一刻下方手柄被放開,落回 A。
// 卡榫逆時針轉時兩根指頭都往左下移:上方指頭離開上軸、下方指頭靠近下軸,所以兩根指頭都在兩軸連線的左側。
// 原圖的卡榫是 S 形、下端在下軸的右側;S 形的兩端在連線兩側,轉一個方向時兩根指頭同時離開(或同時靠近)
// 各自的軸,做不出「放開一支、鎖住另一支」,所以改成兩端都在左側的 < 形(偏離插圖,照「實物可行 > 插圖外形」)。
import { TAU, deg, rot2, swingPhase } from "./kit.js";
import { pointInPolygon, edgeDistance } from "./contact.js";
import { falling } from "./jumps.js";
import { SHAFTS, ANGLES, STROKE, TAPPET, SNAP, LATCH_UP, LATCH_DOWN, lowerAt, upperAt } from "./cornish-gear.js";

export const PIVOT = [0, 0]; // 卡榫的樞軸
export const TIP = 0.07; // 指頭端的圓半徑
// 凸輪是軸上的扇形板:圓弧、上下凹口底與軸轂的半徑。接觸點離軸遠(約 1),配重的力矩傳到卡榫上的力才小
const CAM = { arc: 0.95, upper: 0.84, lower: 0.8, hub: 0.25 };
const CLEAR = 0.0005; // 靠著時留的間隙
const RAMP = deg(8); // 斜面所佔的角度(約 45° 的斜面)
const hub = (which) => SHAFTS[which].slice(0, 2);
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const at = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];

// 卡榫轉角 0(A 位置)時兩根指頭端的圓心:上方在上軸的左下、凹口裡;下方在下軸的左上、圓弧外剛好留間隙。
// 位置取在「樞軸—指頭」與「軸—指頭」約成直角處,卡榫轉動時指頭幾乎沿軸的半徑進出
export const TIPS = {
  upper: at(hub("upper"), CAM.upper + TIP + 0.01, deg(225)),
  lower: at(hub("lower"), CAM.arc + TIP + CLEAR, deg(140)),
};
const tipAt = (which, phi) => rot2(TIPS[which], phi);

/** 解單調的條件:ok(lo) 成立、ok(hi) 不成立時,回傳成立範圍的邊界 */
function bisect(ok, lo, hi) {
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

// 圓弧(逆時針 a0 → a1):中間的點落在固定的角度格點上,凹口、斜面挪動時指頭附近的圓弧不變
const STEP = TAU / 192;
const gridArc = (r, a0, a1) => {
  const inner = [];
  for (let k = Math.floor(a0 / STEP) + 1; k * STEP < a1 - 1e-9; k++) inner.push(k * STEP);
  return [a0, ...inner, a1].map((a) => [r * Math.cos(a), r * Math.sin(a)]);
};

// 凸輪輪廓(軸在 A 位置時的方向;軸心為原點),逆時針排列;扇形只涵蓋指頭走過的那一段
const hubArc = (a1, a0) => gridArc(CAM.hub, a0, a1).reverse();
// 上凸輪:凹口在 [lo, s],s 到 s + RAMP 是往外的斜面,之後是圓弧;軸順時針轉時指頭從凹口爬上斜面
const UPPER_SPAN = [deg(212), deg(282)];
const upperCam = (s, [lo, hi] = UPPER_SPAN) => [...gridArc(CAM.upper, lo, s), ...gridArc(CAM.arc, s + RAMP, hi), ...hubArc(hi, lo)];
// 下凸輪:圓弧到 b,b 到 b + RAMP 是往內的斜面,接著是凹口,凹口的另一邊是陡壁;軸順時針轉時指頭從圓弧沿斜面落進凹口
const LOWER_FROM = deg(126); // 下凸輪扇形的起點
const RECESS = deg(16); // 下凸輪凹口的寬度
const lowerCam = (b, lo = LOWER_FROM, span = RECESS) => [...gridArc(CAM.arc, lo, b), ...gridArc(CAM.lower, b + RAMP, b + RAMP + span), ...hubArc(b + RAMP + span, lo)];

// 指頭端的圓在 rel(軸自 A 位置轉過的角度)、卡榫轉角 phi 時沒有碰進凸輪(留 CLEAR 的間隙)
function clearOf(cam, which, rel, phi) {
  const q = rot2(sub2(tipAt(which, phi), hub(which)), -rel);
  return !pointInPolygon(q, cam) && edgeDistance(q, cam) >= TIP + CLEAR - 1e-9;
}

const REL = { upper: ANGLES.upper.B - ANGLES.upper.A, lower: ANGLES.lower.B - ANGLES.lower.A }; // A → B 轉過的角度(都是順時針)
const FULL_ARC = gridArc(CAM.arc, 0, TAU).slice(0, -1); // 整圈的圓弧(只用來定 A、B 兩個卡榫轉角)

// 卡榫轉角:A = 下方指頭剛好靠在下凸輪的圓弧上(約 0);B = 上方指頭剛好靠在上凸輪的圓弧上
const PHI = {
  A: bisect((p) => clearOf(FULL_ARC, "lower", 0, p), -0.05, 0.05),
  B: -bisect((p) => clearOf(FULL_ARC, "upper", REL.upper, -p), -0.3, 0),
};
// 斜面的位置由接觸定:A 位置時上方指頭剛好靠在上凸輪的斜面上;B 位置時下方指頭剛好靠在下凸輪的斜面上
const UPPER_RAMP = bisect((s) => !clearOf(upperCam(s), "upper", 0, PHI.A), deg(214), deg(250));
const LOWER_RAMP = bisect((b) => clearOf(lowerCam(b), "lower", REL.lower, PHI.B), deg(150), deg(180));
export const CAMS = { upper: upperCam(UPPER_RAMP + 1e-6), lower: lowerCam(LOWER_RAMP - 1e-6) };

const clear = (which, rel, phi) => clearOf(CAMS[which], which, rel, phi);
// 下凸輪允許的最大卡榫轉角(下方指頭往下軸靠)
const phiMaxLower = (rel) => (clear("lower", rel, PHI.B) ? PHI.B : bisect((p) => clear("lower", rel, p), PHI.A, PHI.B));
// 上凸輪允許的最小卡榫轉角(上方指頭往外離開上軸)
const phiMinUpper = (rel) => (clear("upper", rel, PHI.A) ? PHI.A : -bisect((p) => clear("upper", rel, -p), -PHI.B, -PHI.A));
// 卡榫在 phi 時,上方手柄最多能往順時針轉到哪(上凸輪的斜面頂著上方指頭)
const upperSlaved = (phi) => (clear("upper", REL.upper, phi) ? REL.upper : -bisect((r) => clear("upper", -r, phi), 0, -REL.upper));
// 卡榫在 phi 時,下方手柄最多能往逆時針落到哪(下凸輪的斜面頂著下方指頭)
const lowerSlaved = (phi) => (clear("lower", 0, phi) ? 0 : bisect((r) => clear("lower", r, phi), REL.lower, 0));
// 上方手柄被放開時已轉過的角度;下方手柄被放開時的角度(取指頭還差 EDGE 就離開斜面時的位置)
const EDGE = 1e-5;
// 圓弧是折線,指頭沿圓弧滑時算出的卡榫轉角有微小起伏(約 0.01°);離 A / B 這麼近時就當成在該位置。
// 只往讓開的那一邊取:上升時卡榫的上限由下凸輪定(取小的 A),下降時下限由上凸輪定(取大的 B)
const NEAR = 1e-3;
const UPPER_FREE = upperSlaved(PHI.B - EDGE);
const LOWER_FREE = lowerSlaved(PHI.A + EDGE);

/**
 * 累計行程 v:撥爪高度、上下手柄轉角、卡榫轉角 phi(逆時針為正)與活塞方向,全由接觸算:
 * 上升時下方手柄由撥爪推、上方手柄被配重拉著頂在卡榫上;下降時上方手柄由撥爪推、下方手柄靠自重頂在卡榫上。
 * 被放開的手柄甩到位(加速、到底停住),佔撥爪再走 SNAP 的行程。
 */
export function catchState(v) {
  const { at: y, forward: rising } = swingPhase(v, STROKE.bottom, STROKE.top);
  let lower;
  let upper;
  let phi;
  if (rising) {
    lower = Math.min(ANGLES.lower.A, Math.max(ANGLES.lower.B, lowerAt(y + TAPPET.half)));
    phi = phiMaxLower(lower - ANGLES.lower.A);
    if (phi < PHI.A + NEAR) phi = PHI.A;
    // 上方指頭爬上圓弧(卡榫轉到 B)時上方手柄被放開;下凸輪的斜面是照「下方手柄抬到頭時剛好如此」定的,
    // 所以放開的那一刻撥爪在 LATCH_UP,甩到位的過程從那裡算起
    const released = phi >= PHI.B - EDGE;
    const held = phi === PHI.A ? 0 : Math.max(UPPER_FREE, upperSlaved(Math.min(phi, PHI.B - EDGE)));
    upper = ANGLES.upper.A + (released ? UPPER_FREE + (REL.upper - UPPER_FREE) * falling((y - LATCH_UP) / SNAP) : held);
  } else {
    upper = Math.max(ANGLES.upper.B, Math.min(ANGLES.upper.A, upperAt(y - TAPPET.half)));
    phi = phiMinUpper(upper - ANGLES.upper.A);
    if (phi > PHI.B - NEAR) phi = PHI.B;
    // 上方指頭落進凹口(卡榫轉回 A)時下方手柄被放開;上凸輪的斜面照「上方手柄壓到 A 時剛好如此」定,
    // 所以放開的那一刻撥爪在 LATCH_DOWN
    const released = phi <= PHI.A + EDGE;
    const held = phi === PHI.B ? REL.lower : Math.min(LOWER_FREE, lowerSlaved(Math.max(phi, PHI.A + EDGE)));
    lower = ANGLES.lower.A + (released ? LOWER_FREE + (0 - LOWER_FREE) * falling((LATCH_DOWN - y) / SNAP) : held);
  }
  const latch = (ANGLES.upper.A - upper) / (ANGLES.upper.A - ANGLES.upper.B);
  return { y, rising, lower, upper, phi, latch };
}

/** 某個姿態下兩片凸輪與兩根指頭端在世界中的輪廓(測試用) */
export function catchOutlines(state) {
  const placed = (which) => CAMS[which].map((p) => add2(hub(which), rot2(p, state[which] - ANGLES[which].A)));
  return { cams: { upper: placed("upper"), lower: placed("lower") }, tips: { upper: tipAt("upper", state.phi), lower: tipAt("lower", state.phi) } };
}
