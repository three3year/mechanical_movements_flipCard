// 第 370 種:拋光鏡面的機構,讓摩擦盡量多變。手柄轉動曲柄,長桿的上端接在曲柄銷上,下端附近裝著棘輪,鏡面就固定在棘輪上;
// 長桿下端由下方軌道上的兩根銷夾著,所以長桿一面沿長度方向滑、一面擺動;曲柄軸上的偏心輪帶動一根制動爪,
// 每轉一圈把棘輪推轉一格。鏡面因此得到複合運動。主動件是曲柄(以手柄轉動)。
// 結構與由接觸算:偏心輪(偏心距與曲柄同長、相位領先曲柄 25°)套著偏心環,環上伸出的偏心桿往下接到一個滑塊,滑塊在長桿
// 側邊的導軌上沿長桿滑動;制動爪(鉤形,照原圖)鉸在滑塊上,爪身繞在齒尖外,末端的鉤伸進齒間。曲柄每轉一圈,滑塊相對長桿
// 往下推一程、再退回:往下時鉤先空走一段,再卡進齒面與下一齒齒背之間、頂著齒的直面把棘輪推轉,棘輪的轉角由「鉤在齒間、
// 離鉸點一個爪長」算出;退回時鉤沿齒背滑過齒尖再落進下一個齒間(轉角由接觸算),棘輪不動。鉤一程掃過約一齒半
// (比一齒多約半齒、離兩齒也還有約半齒),所以曲柄從哪個相位起轉一圈都正好推一齒。止回爪(推斷)擋住棘輪往回轉。
// 照原圖(525 px):左右照原圖——長桿的下端偏右、制動爪(鉤形)在長桿左側;手柄臂在上樑前面、和曲柄臂相反的方向;
// 曲柄軸從手柄臂往後穿過上樑的軸承,上樑後面依序是偏心輪(套著偏心環)與曲柄臂(在軸的後端),曲柄銷往後插進長桿頂端,
// 長桿在上樑後面(原圖長桿穿過上樑處畫虛線);棘輪在長桿後面(原圖棘輪畫虛線),鏡面是棘輪後面一塊比棘輪大的方板,
// 齒露在方板前面;下軌的兩根銷夾著長桿下段。曲柄照原圖這一邊的轉向是順時針(播放方向),推斷。
// 偏離插圖:原圖偏心桿、滑塊與制動爪畫在長桿後面(虛線);但偏心輪在長桿前面(曲柄臂在長桿前面、軸不能穿過擺動的長桿),
// 所以偏心桿與滑塊在長桿前面、滑塊伸出長桿側邊,爪的鉸銷從滑塊往後穿到棘輪那一層。軌道的銷比原圖低一點(銷到曲柄軸
// 3.85,原圖約 2.2),鏡面才不會在長桿最低時掃到銷;兩根銷排在和長桿平均方向垂直的線上(下軌上一高一低差 0.08),照長桿偏得最多時的寬度夾著它(其他時候留不到 0.003 的間隙)。
// 推斷:棘輪齒數(16,照原圖齒的疏密)、偏心輪的偏心距與相位、制動爪與導軌的位置、鏡面的大小、止回爪與它的托架(原圖沒畫;
// 制動爪退回時會把只靠摩擦定位的棘輪往回帶,動力重演裡棘輪每圈被帶回 5°–30°,要有止回爪擋住)。
// 寫法:先在原本的座標(長桿下端偏左)算出各零件的姿勢,再整個左右鏡射(x → −x)成照原圖的方向。
import { TAU, deg, sub, norm, add, scale } from "./kit.js";
import { fallingRest, edgeDistance, pointInPolygon, placeOutline } from "./contact.js";
import { ratchetShape, shape, circle, thickLine, zCylinder } from "./shapes.js";

// ── 原本的座標(鏡射前) ──
const CRANK = [0.15, 1.1, 0];
const R = 0.55;
const GUIDE = add(CRANK, scale(norm([-0.5, -3.15, 0]), 3.85)); // 下方軌道兩根銷的正中
const LC = 2.0; // 曲柄銷到棘輪中心(沿長桿)
const ROD_LEN = 4.8;
const ROD_HALF = 0.18; // 長桿的半寬
const PIN_R = 0.08; // 軌道銷的半徑
const TEETH = 16; // 原圖的棘輪約 16 齒
export const STEP = TAU / TEETH;
const RATCHET = { teeth: TEETH, outer: 0.72, inner: 0.5, dir: -1 };
const LEAD = deg(25); // 偏心輪的相位領先曲柄
const SIDE = 0.82; // 爪的鉸點在長桿側邊的距離(棘輪外緣之外)
const RAIL_SIDE = SIDE - 0.12; // 導軌(在鉸銷內側)
const ECC_ROD = 2.17; // 偏心桿長(滑塊的行程以棘輪中心的高度為中點,爪大致沿半徑伸進齒間)
const PAWL = 0.58; // 鉸點到鉤尖(爪的局部 +x 指向鉤尖)
const ECC_R = R + 0.22; // 偏心輪半徑

/** 曲柄轉 theta(原本的座標)→ 長桿的座標(曲柄銷 P、沿桿方向 dir、側向 n)、棘輪中心、偏心輪中心、滑塊(爪的鉸點)沿桿的位置 */
function rodFrame(theta) {
  const pin = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta), 0];
  const dir = norm(sub(GUIDE, pin));
  const n = [-dir[1], dir[0], 0];
  const ecc = [CRANK[0] + R * Math.cos(theta + LEAD), CRANK[1] + R * Math.sin(theta + LEAD), 0];
  const rel = sub(ecc, pin);
  const aE = rel[0] * dir[0] + rel[1] * dir[1];
  const lE = rel[0] * n[0] + rel[1] * n[1];
  const along = aE + Math.sqrt(ECC_ROD * ECC_ROD - (SIDE - lE) ** 2);
  const hinge = add(pin, add(scale(dir, along), scale(n, SIDE)));
  return { pin, dir, n, center: add(pin, scale(dir, LC)), ecc, along, hinge, angle: Math.atan2(dir[1], dir[0]) };
}

// 兩根軌道銷排在和長桿平均方向垂直的線上(ACROSS),離正中 PIN_D:照長桿偏得最多時的寬度夾著它
const ACROSS = (() => {
  const d = norm(sub(GUIDE, CRANK));
  return [-d[1], d[0], 0];
})();
// 滑塊每圈的最低、最高點(推程從最低走到最高);長桿偏離平均方向最多時
const [LOW, HIGH, LOW_A, HIGH_A, SQUARE] = (() => {
  let lo = { a: Infinity }, hi = { a: -Infinity };
  let square = 1;
  for (let i = 0; i < 3600; i++) {
    const t = (i / 3600) * TAU;
    const { along, dir } = rodFrame(t);
    if (along < lo.a) lo = { a: along, t };
    if (along > hi.a) hi = { a: along, t };
    square = Math.min(square, Math.abs(dir[0] * ACROSS[1] - dir[1] * ACROSS[0]));
  }
  return [lo.t, hi.t, lo.a, hi.a, square];
})();
const PUSH = ((HIGH - LOW) % TAU + TAU) % TAU; // 推程佔的曲柄轉角
const PIN_D = (ROD_HALF + PIN_R) / SQUARE; // 兩根軌道銷離正中的距離

// 鉤尖是半徑 RHO 的圓角:推動時圓角夾在被推的齒面與下一齒的齒背之間;越過齒尖時順著圓角慢慢落下,
// 不會一越過齒尖就整個掉下去(棘輪若稍微落後,落下的鉤尖先碰到的是已經越過的齒尖,把棘輪往前推而不是往回拉)
const RHO = 0.03;
const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
const segDist = (p, a, b) => edgeDistance(p, [a, b]);
// 推動時圓角圓心在棘輪局部座標的位置(齒形照 ratchetShape,dir < 0):每齒從齒根沿齒背升到齒尖(0.92 齒距),
// 再沿直面落到齒根(0.98 齒距);圓角貼著下一齒的齒背、離齒面 0.001
const SEAT = (() => {
  const { inner, outer } = RATCHET;
  const face = [polar(inner, 0.98 * STEP), polar(outer, 0.92 * STEP)]; // 從齒根往上
  const back = [polar(inner, STEP), polar(outer, 1.92 * STEP)];
  const bisect = (f, lo, hi) => {
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  };
  // 半徑 r 上、在齒面逆時針側離齒面 RHO + 0.001 的點
  const offFace = (r) => {
    const s = bisect((u) => Math.hypot(face[0][0] + u * (face[1][0] - face[0][0]), face[0][1] + u * (face[1][1] - face[0][1])) - r, 0, 1);
    const a0 = Math.atan2(face[0][1] + s * (face[1][1] - face[0][1]), face[0][0] + s * (face[1][0] - face[0][0]));
    return polar(r, bisect((a) => segDist(polar(r, a), ...face) - RHO - 0.001, a0, 1.5 * STEP));
  };
  const r = bisect((r) => segDist(offFace(r), ...back) - RHO, inner + 0.001, outer);
  const q = offFace(r);
  return { r, a: Math.atan2(q[1], q[0]) };
})();

// 推動時圓角圓心(半徑 CORNER)離鉸點 PAWL:它相對棘輪中心的極角(長桿座標,順時針推為負)
const CORNER = SEAT.r;
/** 長桿座標(棘輪中心為原點)裡,繞 pivot、長 len 的鉤,圓角圓心落在半徑 r 的位置(在鉸點順時針那一側的解) */
function noseFrom(pivot, len, r = CORNER) {
  const d = Math.hypot(pivot[0], pivot[1]);
  const a = Math.atan2(pivot[1], pivot[0]) - Math.acos((d * d + r * r - len * len) / (2 * d * r));
  return polar(r, a);
}
const noseAt = (along, r = CORNER) => noseFrom([along - LC, SIDE], PAWL, r);
const cornerAngle = (theta) => {
  const [x, y] = noseAt(rodFrame(theta).along);
  return Math.atan2(y, x);
};
const SWEEP = cornerAngle(LOW) - cornerAngle(HIGH); // 一程鉤尖掃過的角度(約一齒半)
const SLACK = SWEEP - STEP; // 退回後鉤尖要先空走這麼多才碰到齒面
const ROOT = SEAT.a; // 推動時鉤尖在棘輪局部座標的角度

/**
 * 鉤形爪的外形(長桿座標、棘輪中心為原點,在圓角正好卡在齒間的姿勢畫出,再換到爪的局部座標:原點在鉸點、+x 指向圓角圓心):
 * 爪身是以棘輪中心為圓心、過鉸點的弧,繞在齒尖外,從鉸點往順時針伸,末端的鉤往內伸進齒間,鉤尖是半徑 RHO 的圓角。
 * 鉤的前面(頂著齒面的那一面)從圓角往上比齒面多往後斜 8°(爪相對棘輪會轉,前面才不壓進齒尖);
 * 後面(齒背從它下面滑過時的那一面)斜 80°,比齒背(約 45°)陡得多(鉤被齒背抬起時爪會轉,後面跟著變斜)。鉸點在鉤頂齒面那條線的外側(爪對鉸點的夾角大於 90°),
 * 齒面的反力把鉤壓向齒根,不會把鉤頂出來。
 */
function hookOutline(H, N) {
  const rs = Math.hypot(...H); // 爪身弧的半徑(過鉸點)
  const w = 0.1; // 爪身寬
  const aN = Math.atan2(N[1], N[0]);
  const aH = Math.atan2(H[1], H[0]);
  const turn = aN - SEAT.a; // 這個姿勢下棘輪的轉角
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const unit = ([x, y]) => [x / Math.hypot(x, y), y / Math.hypot(x, y)];
  const step = (p, d, k) => [p[0] + k * d[0], p[1] + k * d[1]];
  const out = [Math.cos(aN), Math.sin(aN)]; // 圓心處往外的方向
  const ccw = [-Math.sin(aN), Math.cos(aN)];
  const [root, tip] = [polar(RATCHET.inner, 0.98 * STEP), polar(RATCHET.outer, 0.92 * STEP)];
  const front = rot(unit(rot([tip[0] - root[0], tip[1] - root[1]], turn)), deg(8)); // 鉤前面往上的方向
  const rear = unit([Math.cos(deg(80)) * ccw[0] + Math.sin(deg(80)) * out[0], Math.cos(deg(80)) * ccw[1] + Math.sin(deg(80)) * out[1]]);
  const tf = step(N, rot(front, Math.PI / 2), -RHO); // 前面和圓角相切處
  const tr = step(N, rot(rear, -Math.PI / 2), -RHO); // 後面和圓角相切處
  // 圓角:從後面的切點經過最低處繞到前面的切點
  const angleOf = (q) => Math.atan2(q[1] - N[1], q[0] - N[0]);
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const a0 = angleOf(tr);
  let span = wrap(angleOf(tf) - a0);
  const viaBottom = wrap(Math.atan2(-out[1], -out[0]) - a0);
  if (Math.sign(viaBottom) !== Math.sign(span) || Math.abs(viaBottom) > Math.abs(span)) span -= Math.sign(span) * TAU;
  const nose = Array.from({ length: 9 }, (_, i) => step(N, [Math.cos(a0 + (span * i) / 8), Math.sin(a0 + (span * i) / 8)], RHO));
  // 前面往上到齒尖圓、後面往上到爪身內緣
  const reach = (q, d, r) => {
    const b = q[0] * d[0] + q[1] * d[1];
    return step(q, d, Math.sqrt(b * b - (q[0] ** 2 + q[1] ** 2 - r * r)) - b);
  };
  const fTop = reach(tf, front, RATCHET.outer);
  const af = Math.atan2(fTop[1], fTop[0]);
  const rTop = reach(tr, rear, rs - w / 2);
  const ar = Math.atan2(rTop[1], rTop[0]);
  const outerArc = Array.from({ length: 13 }, (_, i) => polar(rs + w / 2, af + ((aH - af) * i) / 12));
  const cap = Array.from({ length: 7 }, (_, i) => step(H, polar(1, aH + (Math.PI * i) / 6), w / 2)); // 鉸點那一端的半圓
  const innerArc = Array.from({ length: 13 }, (_, i) => polar(rs - w / 2, aH + ((ar - aH) * i) / 12));
  const ux = unit([N[0] - H[0], N[1] - H[1]]);
  return [...nose, fTop, ...outerArc, ...cap.slice(1, -1), ...innerArc].map(([x, y]) => [(x - H[0]) * ux[0] + (y - H[1]) * ux[1], -(x - H[0]) * ux[1] + (y - H[1]) * ux[0]]);
}
// 制動爪(鉤形,照原圖):在推程中點的姿勢畫
const PAWL_OUTLINE = hookOutline([(LOW_A + HIGH_A) / 2 - LC, SIDE], noseAt((LOW_A + HIGH_A) / 2));

// 止回爪(推斷;原圖沒畫):裝在長桿另一側伸出的托架上,鉤和制動爪一樣,擋住棘輪往回轉——制動爪退回時沿齒背滑過,
// 會把棘輪往回帶(棘輪只靠摩擦定位),止回爪卡住它。棘輪停住時,止回爪的圓角在齒間、離它擋住的齒面 BACKLASH;
// 推動時齒背從它下面滑過、把它抬起,齒尖過去後落進下一個齒間。
const DETENT_LEN = 0.45; // 鉸點到圓角圓心
const BACKLASH = 0.1 * STEP;
const [DETENT_PIVOT, DETENT_OUTLINE] = (() => {
  const seat = cornerAngle(HIGH) + Math.round((deg(-135) - cornerAngle(HIGH)) / STEP) * STEP + BACKLASH; // 卡住時圓角的極角(長桿上方、制動爪的對側)
  const radius = 0.84; // 鉸點離棘輪中心
  const off = Math.acos((radius * radius + CORNER * CORNER - DETENT_LEN * DETENT_LEN) / (2 * radius * CORNER));
  const pivot = polar(radius, seat + off);
  return [pivot, hookOutline(pivot, polar(CORNER, seat))];
})();

/** 原本的座標:曲柄轉 theta → 長桿姿勢、棘輪(相對長桿)的轉角、推動中與否 */
function polishRaw(theta) {
  const f = rodFrame(theta);
  const u = ((theta - LOW) % TAU + TAU) % TAU; // 這一圈從滑塊最低點算起的曲柄角
  const k = Math.floor((theta - LOW) / TAU);
  // 推程中(滑塊往下)鉤從推程起點空走 SLACK 後碰上齒面,之後齒面跟著鉤;退回時棘輪停住
  let pushed;
  let engaged = false;
  if (u <= PUSH) {
    const swept = cornerAngle(LOW) - cornerAngle(theta);
    pushed = Math.min(Math.max(swept - SLACK, 0), STEP);
    engaged = swept > SLACK;
  } else pushed = STEP;
  // 棘輪相對長桿的轉角:推動時鉤正好在推動的位置(推程終點的位置 = cornerAngle(HIGH))
  const rel = cornerAngle(HIGH) - ROOT - k * STEP - (pushed - STEP);
  return { ...f, rel, engaged };
}

/** 長桿座標(棘輪中心為原點)→ 世界 */
const rodToWorld = (q, [x, y]) => add(q.center, add(scale(q.dir, x), scale([-q.dir[1], q.dir[0], 0], y)));

/**
 * 鉤靠在齒形上的轉角(世界,由接觸算):從圓角壓進棘輪的角度往外抬,停在圓角剛好離開棘輪的地方。
 * 鉤卡在齒面與齒背之間時,從上面擺下來會先碰到前一齒,所以不從上面往下找;鉤是爪最低的部分,其餘外形都在齒形外
 * (測試逐相位確認不穿入)。pivot:長桿座標的鉸點,len:鉸點到圓角圓心
 */
function hookRest(q, pivot, len) {
  const hinge = rodToWorld(q, pivot);
  const toward = (p) => Math.atan2(p[1] - hinge[1], p[0] - hinge[0]);
  const wheel = placeOutline(ratchetOutline.outline, q.center, q.rel + q.angle);
  const gap = (psi) => {
    const c = [hinge[0] + len * Math.cos(psi), hinge[1] + len * Math.sin(psi)];
    const d = edgeDistance(c, wheel);
    return (pointInPolygon(c, wheel) ? -d : d) - RHO;
  };
  // 起點:圓心比卡在齒間時深 0.003;每步抬 0.002
  let hi = toward(rodToWorld(q, noseFrom(pivot, len, CORNER - 0.003)));
  for (let i = 0; i < 800 && gap(hi) <= 0; i++) hi += 0.002;
  let lo = hi - 0.002;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** 制動爪的轉角(原本的座標),由接觸算:推動時圓角卡在齒面與齒背之間(由齒面的位置算),其餘時候靠在齒形上;
 *  鉤越過齒尖後加速落回齒上(以長桿為準的轉角;約 0.15 秒落 30°) */
function pawlRaw(theta) {
  const restRel = (t) => {
    const q = polishRaw(t);
    if (q.engaged) {
      const hinge = rodToWorld(q, [q.along - LC, SIDE]);
      const n = rodToWorld(q, noseAt(q.along));
      return Math.atan2(n[1] - hinge[1], n[0] - hinge[0]) - q.angle;
    }
    return hookRest(q, [q.along - LC, SIDE], PAWL) - q.angle;
  };
  return polishRaw(theta).angle + fallingRest(restRel, theta, { into: -1, accel: 72, window: 0.13 });
}

/** 止回爪的轉角(原本的座標):靠在齒形上,齒尖過去後加速落進齒間 */
function detentRaw(theta) {
  const restRel = (t) => {
    const q = polishRaw(t);
    return hookRest(q, DETENT_PIVOT, DETENT_LEN) - q.angle;
  };
  return polishRaw(theta).angle + fallingRest(restRel, theta, { into: -1, accel: 72, window: 0.13 });
}

// ── 鏡射成照原圖的方向 ──
// 點 x → −x;板件的轉角 a → π − a,局部外形沿局部 x 軸翻面(y → −y);曲柄的轉角(主動量 theta 加上 START)對應原本的 π − 轉角
const mirror = (p) => [-p[0], p[1], p[2] ?? 0];
const flip = (a) => Math.PI - a;
const flipLoop = (loop) => loop.map(([x, y]) => [x, -y]).reverse();
const START = Math.PI; // 主動量 0:曲柄銷在曲柄軸左邊(原圖在左上方)
const rawTheta = (theta) => Math.PI - theta - START;

/**
 * 曲柄轉 theta(照原圖的方向,順時針轉是往前)→ 長桿姿勢(曲柄銷 pin、沿桿方向 dir、棘輪中心 center、偏心輪中心 ecc、
 * 爪的鉸點 hinge、長桿的轉角 angle)、棘輪相對長桿的轉角 rel、推動中與否
 */
export function polish(theta) {
  const q = polishRaw(rawTheta(theta));
  return {
    pin: mirror(q.pin),
    dir: mirror(q.dir),
    center: mirror(q.center),
    ecc: mirror(q.ecc),
    hinge: mirror(q.hinge),
    along: q.along,
    angle: flip(q.angle),
    rel: -q.rel,
    engaged: q.engaged,
  };
}
export const geometry = { STEP, SWEEP, SLACK, PUSH, LC, ROD_HALF, PIN_R, along: [LOW_A, HIGH_A], inner: RATCHET.inner, outer: RATCHET.outer, backlash: BACKLASH };
export const crankCenter = mirror(CRANK);
export const guide = mirror(GUIDE);
export const railPins = [-1, 1].map((s) => mirror(add(GUIDE, scale(ACROSS, s * PIN_D))));

// ── 零件(照原圖的方向;前後由前到後:手柄臂、上樑、偏心輪與偏心環、曲柄臂、長桿、棘輪與爪、鏡面、下軌) ──
const Z = { handle: 1.0, beam: 0.7, ecc: 0.4, arm: 0.25, rod: 0.1, ratchet: -0.1, mirror: -0.21, rail: -0.45 };
const HANDLE = 0.76; // 手柄臂長(原圖比曲柄臂長)
const RAIL = { from: LOW_A - 0.2, to: HIGH_A + 0.2 }; // 長桿側邊的導軌(滑塊的行程之外再留一點)
const SLIDER_LEN = 0.22;

// 長桿(局部 +x 從曲柄銷沿桿往下;鏡射後側邊的東西在局部 −y):棘輪軸的孔、曲柄銷的孔、側邊的導軌與兩根撐條
const rod = shape(thickLine([[-0.25, 0], [ROD_LEN, 0]], 2 * ROD_HALF), [circle(0.08, LC, 0).reverse(), circle(0.065, 0, 0).reverse()]);
const railPieces = [
  { kind: "plate", shape: shape(flipLoop(thickLine([[RAIL.from, RAIL_SIDE], [RAIL.to, RAIL_SIDE]], 0.08))), thickness: 0.08, at: [0, 0, 0] },
  ...[RAIL.from, RAIL.to].map((x) => ({ kind: "plate", shape: shape(flipLoop(thickLine([[x, 0.1], [x, RAIL_SIDE]], 0.08))), thickness: 0.08, at: [0, 0, 0] })),
  // 止回爪的托架(長桿另一側伸出,推斷)與鉸銷:銷從托架往後穿過止回爪
  { kind: "plate", shape: shape(flipLoop(thickLine([[LC + DETENT_PIVOT[0], -0.1], [LC + DETENT_PIVOT[0], DETENT_PIVOT[1] - 0.06]], 0.12))), thickness: 0.1, at: [0, 0, 0] },
  zCylinder(Z.ratchet - 0.05, Z.rod + 0.05, 0.03, [LC + DETENT_PIVOT[0], -DETENT_PIVOT[1]], Z.rod),
];
// 偏心環與偏心桿(局部 +x 從偏心輪中心指向爪的鉸點):套住偏心輪的環、伸到鉸點的桿與眼
const strap = shape(
  [
    ...Array.from({ length: 49 }, (_, i) => {
      const a = 0.12 + (i / 48) * (TAU - 0.24);
      return [(ECC_R + 0.08) * Math.cos(a), (ECC_R + 0.08) * Math.sin(a)];
    }),
    [ECC_R + 0.06, -0.05],
    [ECC_ROD - 0.08, -0.05],
    ...Array.from({ length: 13 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      return [ECC_ROD + 0.08 * Math.cos(a), 0.08 * Math.sin(a)];
    }),
    [ECC_ROD - 0.08, 0.05],
    [ECC_R + 0.06, 0.05],
  ],
  [circle(ECC_R, 0, 0).reverse(), circle(0.03, ECC_ROD, 0).reverse()],
);
const ratchetOutline = ratchetShape(RATCHET);

export default {
  figure: 370,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 上樑(最前面一層;曲柄軸穿過它的軸承)與下軌(長桿後面;兩根銷往前伸到長桿那一層,夾著長桿)。兩者原圖都畫斷裂線,固定在圖外的機架上
        { kind: "box", size: [4.6, 0.32, 0.3], at: [-0.2, CRANK[1], Z.beam] },
        { kind: "box", size: [4.6, 0.25, 0.3], at: [-0.2, GUIDE[1], Z.rail] },
        ...railPins.map((p) => ({ kind: "cylinder", radius: PIN_R, length: 0.5, at: [p[0], p[1], -0.05] })),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: crankCenter,
      spin: R + 0.25,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.26)), thickness: 0.1, at: [0, 0, Z.arm] }, // 曲柄臂(軸的後端)
        { kind: "cylinder", radius: 0.06, length: 0.25, at: [R, 0, 0.175] }, // 曲柄銷:往後插進長桿頂端
        { kind: "cylinder", radius: 0.12, length: 0.85, at: [0, 0, 0.625] }, // 曲柄軸:從曲柄臂往前穿過偏心輪、上樑的軸承到手柄臂
        { kind: "cylinder", radius: ECC_R, length: 0.1, at: [R * Math.cos(LEAD), -R * Math.sin(LEAD), Z.ecc] }, // 偏心輪(相位領先曲柄 25°)
        { kind: "plate", shape: shape(thickLine([[0, 0], [-HANDLE, 0]], 0.22)), thickness: 0.1, at: [0, 0, Z.handle] }, // 手柄臂(上樑前面,和曲柄臂相反的方向)
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [-HANDLE, 0, Z.handle + 0.2], accent: true }, // 手柄
      ],
    },
    { id: "rod", kind: "plate", shape: rod, thickness: 0.1, arrow: false, pieces: railPieces },
    { id: "strap", kind: "plate", shape: strap, thickness: 0.1, arrow: false },
    {
      id: "slider",
      kind: "group",
      arrow: false,
      pieces: [
        // 滑塊騎在導軌上(局部 +x 沿長桿;導軌在鉸點內側 0.12),兩片唇夾著導軌的兩側;鉸銷從偏心桿的眼往後穿過滑塊到制動爪
        { kind: "box", size: [SLIDER_LEN, 0.28, 0.21], at: [0, 0.06, 0.245] },
        ...[0.12 - 0.04 - 0.015, 0.12 + 0.04 + 0.015].map((y) => ({ kind: "box", size: [SLIDER_LEN, 0.03, 0.08], at: [0, y, Z.rod] })),
        { kind: "cylinder", radius: 0.03, length: 0.58, at: [0, 0, 0.16] },
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(flipLoop(PAWL_OUTLINE), [circle(0.03).reverse()]), thickness: 0.1, arrow: false }, // 鉤形的制動爪
    { id: "detent", kind: "plate", shape: shape(flipLoop(DETENT_OUTLINE), [circle(0.03).reverse()]), thickness: 0.1, arrow: false }, // 止回爪(推斷)
    {
      id: "ratchet",
      kind: "plate",
      shape: { outline: flipLoop(ratchetOutline.outline), holes: [] },
      thickness: 0.1,
      spin: RATCHET.outer,
      mark: [0.35, 0],
      markSize: 0.06,
      pieces: [
        // 鏡面:棘輪後面一塊比棘輪大的方板(齒露在它前面)
        { kind: "box", size: [1.6, 1.6, 0.08], at: [0, 0, Z.mirror - Z.ratchet], angle: deg(15) },
        { kind: "cylinder", radius: 0.3, length: 0.02, at: [0, 0, -0.06] }, // 棘輪與鏡面之間的墊塊(讓爪擺過鏡面上方不貼著它)
        // 棘輪的軸:從鏡面往前穿過長桿上的孔,前端的軸頭擋在長桿前面
        { kind: "cylinder", radius: 0.07, length: 0.46, at: [0, 0, 0.08] },
        { kind: "cylinder", radius: 0.12, length: 0.04, at: [0, 0, 0.29] },
      ],
    },
  ],
  // 動力重演:只推曲柄;棘輪鉸在長桿上的軸上、靠摩擦定位,由制動爪推轉;制動爪(鉸在滑塊上)與止回爪(鉸在長桿上)
  // 都由彈簧壓向齒(原文沒寫是什麼把爪壓在齒上,推斷)
  replay: {
    free: {
      ratchet: { on: "rod", hold: true, gravity: false },
      pawl: { on: "slider", spring: 1, gravity: false },
      detent: { on: "rod", spring: 1, gravity: false },
    },
    expect: [{ part: "ratchet", label: "曲柄轉一圈:制動爪把棘輪(鏡面)推轉一格", quote: "棘輪則由曲柄軸上的偏心輪所驅動的制動爪帶動,間歇性地旋轉" }],
  },
  driver: { part: "crank", type: "rotation", speed: -0.8 },
  target: "ratchet", // 鏡面固定在棘輪上,得到複合運動
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const t = rawTheta(theta);
    const q = polishRaw(t);
    const toward = sub(q.hinge, q.ecc);
    return {
      parts: {
        crank: { angle: theta + START },
        rod: { position: [...mirror(q.pin).slice(0, 2), Z.rod], angle: flip(q.angle) },
        strap: { position: [...mirror(q.ecc).slice(0, 2), Z.ecc], angle: flip(Math.atan2(toward[1], toward[0])) },
        slider: { position: [...mirror(q.hinge).slice(0, 2), 0], angle: flip(q.angle) },
        pawl: { position: [...mirror(q.hinge).slice(0, 2), Z.ratchet], angle: flip(pawlRaw(t)) },
        detent: { position: [...mirror(rodToWorld(q, DETENT_PIVOT)).slice(0, 2), Z.ratchet], angle: flip(detentRaw(t)) },
        ratchet: { position: [...mirror(q.center).slice(0, 2), Z.ratchet], angle: flip(q.rel + q.angle) },
      },
      readouts: [],
    };
  },
  waivers: [],
};
