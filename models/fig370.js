// 第 370 種:拋光鏡面的機構,讓摩擦盡量多變。手柄轉動曲柄,長桿的上端接在曲柄銷上,下端附近裝著棘輪,鏡面就固定在棘輪上;
// 長桿下端的長槽套在下方軌道上的銷上,所以長桿一面沿長度方向滑、一面擺動;曲柄軸上的偏心輪帶動一根制動爪,
// 每轉一圈把棘輪推轉一格。鏡面因此得到複合運動。主動件是曲柄(以手柄轉動)。
// 結構與由接觸算:偏心輪(偏心距與曲柄同長、相位領先曲柄 25°)套著偏心環,偏心桿往下接到一個滑塊,滑塊在長桿側邊的導軌上
// 沿長桿滑動;制動爪鉸在滑塊上,爪尖搭在棘輪的齒上。曲柄每轉一圈,滑塊相對長桿往下推一程、再退回:往下時爪尖落在齒根、
// 頂著齒的直面把棘輪推轉,棘輪的轉角由「爪尖在齒根角、離鉸點一個爪長」算出;退回時爪尖沿齒背滑過齒尖(轉角由接觸算,
// contact.swingUntilContact),棘輪不動。一程比一齒多一點,所以每圈正好推一齒。
// 推斷:棘輪齒數、偏心輪的偏心距與相位、制動爪與導軌的位置;長桿的長度與軌道銷的位置依原圖(銷在棘輪下方的軌道上)。
import { TAU, deg, sub, norm, add, scale } from "./kit.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, fallingRest } from "./contact.js";
import { ratchetShape, shape, circle, thickLine, stadium } from "./shapes.js";

const CRANK = [0.15, 1.1, 0];
const R = 0.55;
const GUIDE = [-0.35, -2.05, 0]; // 下方軌道上的銷
const LC = 2.0; // 曲柄銷到棘輪中心(沿長桿)
const ROD_LEN = 4.0;
const SLOT = { at: 3.2, len: 1.3 }; // 長桿下段的長槽(沿長桿的位置與長度)
const TEETH = 12;
export const STEP = TAU / TEETH;
const RATCHET = { teeth: TEETH, outer: 0.72, inner: 0.5, dir: -1 };
const CONTACT = { ...RATCHET, outer: RATCHET.outer + 0.04, inner: RATCHET.inner + 0.04 }; // 外擴爪身的半寬
const LEAD = deg(25); // 偏心輪的相位領先曲柄
const SIDE = 0.82; // 導軌在長桿側邊的距離(棘輪外緣之外)
const ECC_ROD = 2.17; // 偏心桿長(滑塊的行程以棘輪中心的高度為中點,爪大致沿半徑伸進齒間)
const PAWL = 0.36; // 制動爪長
const PAWL_OUTLINE = thickLine([[0, 0], [PAWL, 0]], 0.08);

/** 曲柄轉 theta → 長桿的座標(曲柄銷 P、沿桿方向 dir、側向 n)、棘輪中心、偏心輪中心、滑塊(爪的鉸點)沿桿的位置 */
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

// 滑塊每圈的最低、最高點(推程從最低走到最高)
const [LOW, HIGH] = (() => {
  let lo = { a: Infinity }, hi = { a: -Infinity };
  for (let i = 0; i < 3600; i++) {
    const t = (i / 3600) * TAU;
    const { along } = rodFrame(t);
    if (along < lo.a) lo = { a: along, t };
    if (along > hi.a) hi = { a: along, t };
  }
  return [lo.t, hi.t];
})();
const PUSH = ((HIGH - LOW) % TAU + TAU) % TAU; // 推程佔的曲柄轉角

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

/** 曲柄轉 theta → 長桿姿勢、棘輪(相對長桿)的轉角、推動中與否 */
export function polish(theta) {
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
export const geometry = { STEP, SWEEP, SLACK, PUSH };

// 長桿(局部 +x 從曲柄銷沿桿往下):下段的長槽、棘輪軸的孔、側邊的導軌(兩根撐條接到桿身)
const RAIL = { from: 1.6, to: 2.42 };
const rod = shape(thickLine([[0, 0], [ROD_LEN, 0]], 0.36), [
  stadium(SLOT.len, 0.17).outline.map(([x, y]) => [x + SLOT.at, y]).reverse(),
  circle(0.08, LC, 0).reverse(),
]);

export default {
  figure: 370,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.32, 0.4], at: [0.2, 1.1, -0.45] },
        { kind: "box", size: [4.6, 0.25, 0.4], at: [0.2, GUIDE[1], -0.2] },
        { kind: "cylinder", radius: 0.08, length: 0.55, at: [GUIDE[0], GUIDE[1], 0.05] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.26), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.35] },
        { kind: "cylinder", radius: 0.12, length: 0.6, at: [0, 0, -0.35] }, // 曲柄軸,往後伸進上方的橫樑(長桿與偏心桿從曲柄臂與偏心輪之間掃過軸心)
        // 偏心輪:偏心距與曲柄同長,相位領先 25°(在長桿後面一層)
        { kind: "cylinder", radius: R + 0.22, length: 0.1, at: [R * Math.cos(LEAD), R * Math.sin(LEAD), -0.02] },
        { kind: "cylinder", radius: 0.06, length: 0.4, at: [R, 0, 0.35], accent: true },
      ],
    },
    {
      id: "rod",
      kind: "plate",
      shape: rod,
      thickness: 0.1,
      arrow: false,
      pieces: [
        // 側邊的導軌:滑塊在上面沿長桿滑
        { kind: "plate", shape: shape(thickLine([[RAIL.from, SIDE], [RAIL.to, SIDE]], 0.08)), thickness: 0.08, at: [0, 0, -0.08] },
        ...[RAIL.from, RAIL.to].map((x) => ({ kind: "plate", shape: shape(thickLine([[x, 0.1], [x, SIDE]], 0.08)), thickness: 0.08, at: [0, 0, -0.09] })),
      ],
    },
    // 偏心環與偏心桿(從偏心輪往下接到滑塊)
    { id: "strap", kind: "link", width: 0.1, thickness: 0.045, pins: false }, // 夾在偏心輪與導軌之間的那一層
    { id: "slider", kind: "box", size: [0.22, 0.2, 0.14] },
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [PAWL, 0]], 0.08), [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
    {
      id: "ratchet",
      kind: "plate",
      shape: ratchetShape({ ...RATCHET, bore: 0.08 }),
      thickness: 0.12,
      spin: RATCHET.outer,
      mark: [0.35, 0],
      markSize: 0.06,
      pieces: [
        // 鏡面:棘輪上的一塊方板
        { kind: "box", size: [0.8, 0.8, 0.06], at: [0, 0, 0.1], angle: deg(15) },
        // 棘輪的軸:穿過長桿上的孔(棘輪在長桿前面一層,靠這根軸相連)
        { kind: "cylinder", radius: 0.07, length: 0.34, at: [0, 0, -0.14] },
      ],
    },
  ],
  // 動力重演:只推曲柄;棘輪鉸在長桿上的軸上、靠摩擦定位,由制動爪推轉
  replay: {
    free: { ratchet: { on: "rod", hold: true, gravity: false } },
    expect: [{ part: "ratchet", label: "曲柄轉一圈:制動爪把棘輪(鏡面)推轉一格", quote: "棘輪則由曲柄軸上的偏心輪所驅動的制動爪帶動,間歇性地旋轉" }],
  },
  driver: { part: "crank", type: "rotation" },
  target: "ratchet", // 鏡面固定在棘輪上,得到複合運動
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const p = polish(theta);
    const wheel = p.rel + p.angle; // 棘輪的世界轉角
    // 制動爪從抬起的角度往齒那邊擺,停在爪的外形第一次碰到齒形的地方(由接觸算)
    // 爪滑過齒尖後加速落回齒上(以長桿為準的轉角;約 0.15 秒落 30°)
    const restRel = (t) => {
      const q = polish(t);
      return swingUntilContact({ pivot: q.hinge, outline: PAWL_OUTLINE, from: q.angle + 0.1, into: -1, sweep: 2.2, steps: 110 }, ratchetObstacles(RATCHET, q.rel + q.angle, q.center)) - q.angle;
    };
    const pawl = { angle: p.angle + fallingRest(restRel, theta, { into: -1, accel: 72, window: 0.13 }) };
    return {
      parts: {
        crank: { angle: theta },
        rod: { position: [p.pin[0], p.pin[1], 0.2], angle: p.angle },
        strap: { from: [p.ecc[0], p.ecc[1], 0.055], to: [p.hinge[0], p.hinge[1], 0.055] },
        slider: { position: [p.hinge[0], p.hinge[1], 0.235], angle: p.angle },
        pawl: { position: [p.hinge[0], p.hinge[1], 0.36], angle: pawl.angle },
        ratchet: { position: [p.center[0], p.center[1], 0.36], angle: wheel },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["frame", "rod"], reason: "接合處的簡化畫法:長桿以長槽套在軌道的固定銷上滑動、擺動,銷在槽裡(槽的兩側壁與銷的間隙沒有畫出來)" },
  ],
};
