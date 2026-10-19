// 第 370 種:拋光鏡面的機構,讓摩擦盡量多變。手柄轉動曲柄,長桿的上端接在曲柄銷上,下端附近裝著棘輪,鏡面就固定在棘輪上;
// 長桿下端由下方軌道上的兩根銷夾著,所以長桿一面沿長度方向滑、一面擺動;曲柄軸上的偏心輪帶動一根制動爪,
// 每轉一圈把棘輪推轉一格。鏡面因此得到複合運動。主動件是曲柄(以手柄轉動)。
// 結構與由接觸算:偏心輪(偏心距與曲柄同長、相位領先曲柄 25°)套著偏心環,環上伸出的偏心桿往下接到一個滑塊,滑塊在長桿
// 側邊的導軌上沿長桿滑動;制動爪鉸在滑塊上,爪尖搭在棘輪的齒上。曲柄每轉一圈,滑塊相對長桿往下推一程、再退回:往下時
// 爪尖落在齒根、頂著齒的直面把棘輪推轉,棘輪的轉角由「爪尖在齒根角、離鉸點一個爪長」算出;退回時爪尖沿齒背滑過齒尖
// (轉角由接觸算,contact.swingUntilContact),棘輪不動。一程比一齒多一點,所以每圈正好推一齒。
// 照原圖(525 px):左右照原圖——長桿的下端偏右、制動爪(鉤形)在長桿左側;手柄臂在上樑前面、和曲柄臂相反的方向;
// 曲柄軸從手柄臂往後穿過上樑的軸承,上樑後面依序是偏心輪(套著偏心環)與曲柄臂(在軸的後端),曲柄銷往後插進長桿頂端,
// 長桿在上樑後面(原圖長桿穿過上樑處畫虛線);棘輪在長桿後面(原圖棘輪畫虛線),鏡面是棘輪後面一塊比棘輪大的方板,
// 齒露在方板前面;下軌的兩根銷夾著長桿下段。曲柄照原圖這一邊的轉向是順時針(播放方向),推斷。
// 偏離插圖:原圖偏心桿、滑塊與制動爪畫在長桿後面(虛線);但偏心輪在長桿前面(曲柄臂在長桿前面、軸不能穿過擺動的長桿),
// 所以偏心桿與滑塊在長桿前面、滑塊伸出長桿側邊,爪的鉸銷從滑塊往後穿到棘輪那一層。軌道的銷比原圖低一點(銷到曲柄軸
// 3.85,原圖約 2.2),鏡面才不會在長桿最低時掃到銷;兩根銷排在和長桿平均方向垂直的線上(下軌上一高一低差 0.08),照長桿偏得最多時的寬度夾著它(其他時候留不到 0.003 的間隙)。
// 推斷:棘輪齒數、偏心輪的偏心距與相位、制動爪與導軌的位置、鏡面的大小。
// 寫法:先在原本的座標(長桿下端偏左)算出各零件的姿勢,再整個左右鏡射(x → −x)成照原圖的方向。
import { TAU, deg, sub, norm, add, scale } from "./kit.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, fallingRest } from "./contact.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

// ── 原本的座標(鏡射前) ──
const CRANK = [0.15, 1.1, 0];
const R = 0.55;
const GUIDE = add(CRANK, scale(norm([-0.5, -3.15, 0]), 3.85)); // 下方軌道兩根銷的正中
const LC = 2.0; // 曲柄銷到棘輪中心(沿長桿)
const ROD_LEN = 4.8;
const ROD_HALF = 0.18; // 長桿的半寬
const PIN_R = 0.08; // 軌道銷的半徑
const TEETH = 12;
export const STEP = TAU / TEETH;
const RATCHET = { teeth: TEETH, outer: 0.72, inner: 0.5, dir: -1 };
const CONTACT = { ...RATCHET, outer: RATCHET.outer + 0.04, inner: RATCHET.inner + 0.04 }; // 外擴爪身的半寬
const LEAD = deg(25); // 偏心輪的相位領先曲柄
const SIDE = 0.82; // 爪的鉸點在長桿側邊的距離(棘輪外緣之外)
const RAIL_SIDE = SIDE - 0.12; // 導軌(在鉸銷內側)
const ECC_ROD = 2.17; // 偏心桿長(滑塊的行程以棘輪中心的高度為中點,爪大致沿半徑伸進齒間)
const PAWL = 0.36; // 制動爪長
const PAWL_OUTLINE = thickLine([[0, 0], [PAWL, 0]], 0.08);
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

// 推動時,爪尖在齒根角(半徑 CORNER)、離鉸點一個爪長:這個角在長桿座標裡的極角(順時針推為負)
const CORNER = CONTACT.inner;
function cornerAngle(theta) {
  const f = rodFrame(theta);
  // 長桿座標:鉸點 (along − LC, SIDE) 相對棘輪中心;找半徑 CORNER 上離鉸點 PAWL 的點(在鉸點下方那一解)
  const hx = f.along - LC;
  const hy = SIDE;
  const d = Math.hypot(hx, hy);
  const base = Math.atan2(hy, hx);
  const off = Math.acos((d * d + CORNER * CORNER - PAWL * PAWL) / (2 * d * CORNER));
  return base - off; // 偏向沿桿正向(棘輪中心的下方那一側)
}
const SWEEP = cornerAngle(LOW) - cornerAngle(HIGH); // 一程爪尖掃過的角度(> 一齒)
const SLACK = SWEEP - STEP; // 退回後爪尖要先空走這麼多才碰到齒面

// 爪尖推著齒面時在棘輪局部座標的角度:齒形(dir < 0)每齒從齒根沿齒背升到齒尖(0.92 齒距),再沿直面落到齒根(0.98 齒距);
// 爪尖(半徑 CORNER)貼著直面、在齒根那一側
const ROOT = 0.975 * STEP;

/** 原本的座標:曲柄轉 theta → 長桿姿勢、棘輪(相對長桿)的轉角、推動中與否 */
function polishRaw(theta) {
  const f = rodFrame(theta);
  const u = ((theta - LOW) % TAU + TAU) % TAU; // 這一圈從滑塊最低點算起的曲柄角
  const k = Math.floor((theta - LOW) / TAU);
  // 推程中(滑塊往下)爪尖從推程起點空走 SLACK 後碰上齒面,之後齒面跟著爪尖;退回時棘輪停住
  let pushed;
  let engaged = false;
  if (u <= PUSH) {
    const swept = cornerAngle(LOW) - cornerAngle(theta);
    pushed = Math.min(Math.max(swept - SLACK, 0), STEP);
    engaged = swept > SLACK;
  } else pushed = STEP;
  // 棘輪相對長桿的轉角:推動時齒根角正好在爪尖(推程終點的齒根角 = cornerAngle(HIGH))
  const rel = cornerAngle(HIGH) - ROOT - k * STEP - (pushed - STEP);
  return { ...f, rel, engaged };
}

/** 制動爪的轉角(原本的座標):從抬起的角度往齒那邊擺,停在爪的外形第一次碰到齒形的地方(由接觸算);
 *  爪滑過齒尖後加速落回齒上(以長桿為準的轉角;約 0.15 秒落 30°) */
function pawlRaw(theta) {
  const restRel = (t) => {
    const q = polishRaw(t);
    return swingUntilContact({ pivot: q.hinge, outline: PAWL_OUTLINE, from: q.angle + 0.1, into: -1, sweep: 2.2, steps: 110 }, ratchetObstacles(RATCHET, q.rel + q.angle, q.center)) - q.angle;
  };
  return polishRaw(theta).angle + fallingRest(restRel, theta, { into: -1, accel: 72, window: 0.13 });
}

// ── 鏡射成照原圖的方向 ──
// 點 x → −x;板件的轉角 a → π − a,局部外形沿局部 x 軸翻面(y → −y);曲柄的轉角(主動量 theta 加上 START)對應原本的 π − 轉角
const mirror = (p) => [-p[0], p[1], p[2] ?? 0];
const flip = (a) => Math.PI - a;
const flipLoop = (loop) => loop.map(([x, y]) => [x, -y]).reverse();
const START = Math.PI; // 主動量 0:曲柄銷在曲柄軸左邊(原圖在左上方;動力重演對起始相位很敏感,從原本座標的 0 起算才推得動,和改動前一樣)
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
export const geometry = { STEP, SWEEP, SLACK, PUSH, LC, ROD_HALF, PIN_R, along: [LOW_A, HIGH_A] };
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
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [PAWL, 0]], 0.08), [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
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
  // 動力重演:只推曲柄;棘輪鉸在長桿上的軸上、靠摩擦定位,由制動爪推轉
  replay: {
    free: { ratchet: { on: "rod", hold: true, gravity: false } },
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
        ratchet: { position: [...mirror(q.center).slice(0, 2), Z.ratchet], angle: flip(q.rel + q.angle) },
      },
      readouts: [],
    };
  },
  waivers: [],
};
