// 第 211 種:大輪連續旋轉,給小齒輪的軸間歇的旋轉運動。大輪只有一段圓周有齒,其餘是光滑的圓弧;
// 小齒輪最靠近大輪的部分被切成與那段光滑圓弧相同的曲線,大輪轉過光滑部分時,這段曲線貼著它,把小齒輪鎖住不動;
// 直到大輪上的銷撞到小齒輪上的引導片,小齒輪開始轉,接著由齒帶動轉滿一圈,再被鎖住。主動件是大輪(逆時針,原圖箭頭)。
// 推斷:小齒輪 16 齒,其中朝大輪的三個齒的位置填成一塊鎖定塊,頂面是貼著大輪光滑部分的內凹弧,兩側照旁邊齒的齒面;
// 大輪光滑部分的半徑取齒頂圓(取齒根圓的話,鎖定弧和圓周之間有一個齒高的空隙,小齒輪鎖不住)。
// 一圈的過程(都由外形相碰決定):光滑部分走完、鎖定弧的上端讓得開之後,大輪缺口裡的銷撞到引導片,把小齒輪撥轉約 14°;
// 這時大輪的第一個齒剛好轉到小齒輪的齒槽,比銷推得快,接手帶動(齒對著齒槽);最後一個齒把小齒輪帶滿一圈,
// 鎖定弧再貼上光滑部分。大輪的齒只排在齒輪咬合用得到的地方(14 齒,第一齒推小齒輪鎖定塊上側的齒面);
// 光滑部分接齒的兩端各留一個齒距的齒根圓缺口,讓鎖定塊的兩角轉進轉出。銷與引導片的位置照原圖:
// 銷在大輪缺口旁、半徑約 0.85 倍輪緣,引導片從輪轂伸出、越過小齒輪的齒頂蓋到大輪的輪面上,末端往上彎。
import { TAU, polar } from "./kit.js";
import { pedestal } from "./supports.js";
import { shape, circle, arcPoints, thickLine, gearProfile, toothOutline } from "./shapes.js";
import { resample } from "./noncircular.js";
import { placeOutline, polygonsOverlap, circlePolygon, pushUntilClear } from "./contact.js";

const NP = 16;
const RP = 0.75;
const PITCH = (TAU * RP) / NP;
const NW = 44;
const RW = (NW * PITCH) / TAU;
const C = RW + RP;
const PINION = [-C, 0, 0];
const RATIO = RW / RP;
const RIM = RW + (2 * RW) / NW; // 大輪光滑部分的半徑:齒頂圓(模數 = 2RW/NW)
const STEP_W = TAU / NW;

// 齒輪咬合的相位:大輪的局部角 π − theta 在接觸點上。G0 是「小齒輪轉角 0(鎖定塊正對大輪)」那一刻,
// 大輪的齒槽 0 在接觸點上;大輪的齒槽 m 在 G0 + m·齒距 時轉到接觸點,齒 m + ½ 推小齒輪的第 m 個齒位
const SLOT0 = 21; // 齒槽 0 對著大輪第 21 齒與第 22 齒之間(大輪齒 i 在局部角 i·齒距)
const G0 = Math.PI - (SLOT0 + 0.5) * STEP_W;
const toothAt = (m) => (((SLOT0 - m) % NW) + NW) % NW; // 齒 m + ½ 是大輪的第幾齒
// 小齒輪的第 0、±1 齒位是鎖定塊,第 2–14 齒位由大輪齒 1½–14½ 推動(齒 1½ 推的是鎖定塊上側的齒面)
const wheelTeeth = Array.from({ length: 14 }, (_, k) => toothAt(k + 1));
// 光滑部分在齒段兩端各留一個齒距的齒根圓缺口(齒槽 0 與 15 的位置),鎖定塊的兩角從這裡轉進轉出
const rootGaps = [toothAt(0), toothAt(15)];

/** 齒輪咬合時小齒輪的轉角(順時針為負;0 是鎖定的位置,−2π 轉滿一圈) */
const gearLine = (theta) => Math.max(-TAU, Math.min(0, -RATIO * (theta - G0)));

// 小齒輪:鎖定塊佔第 0、±1 齒位;兩側是第 ±1 齒朝外的齒面,頂面是以大輪中心為圓心的內凹弧(留 0.01 的間隙)
const pinionTeeth = Array.from({ length: NP }, (_, i) => i).filter((i) => i > 1 && i < NP - 1);
const lockBlock = (() => {
  const tooth = toothOutline({ teeth: NP, radius: RP }, 1);
  const [root, tip] = [tooth[tooth.length - 2], tooth[tooth.length - 3]]; // 第 1 齒朝第 2 齒那一側的齒面
  const R = RIM + 0.01;
  const outside = (t) => Math.hypot(root[0] + (tip[0] - root[0]) * t - C, root[1] + (tip[1] - root[1]) * t) - R;
  let [lo, hi] = [0, 1];
  for (let k = 0; k < 40; k++) [lo, hi] = outside((lo + hi) / 2) > 0 ? [(lo + hi) / 2, hi] : [lo, (lo + hi) / 2];
  const corner = [root[0] + (tip[0] - root[0]) * lo, root[1] + (tip[1] - root[1]) * lo];
  const a = Math.atan2(corner[1], corner[0] - C);
  return [[0, 0], root, ...arcPoints(R, a, TAU - a, C, 0), [root[0], -root[1]]];
})();

// 引導片(小齒輪局部座標,鎖定時朝大輪):從輪轂伸出,末端往上彎
const GUIDE = thickLine([[0.2, 0], [1.2, 0], [1.42, 0.12]], 0.14);
const GUIDE_Z = 0.2;
// 銷:半徑 1.8(輪緣的 0.85 倍),角度取「齒輪接手前小齒輪剛好被撥到齒的相位」:theta = PIN_START 時碰到引導片
const PIN_R = 1.8;
const PIN = 0.08;
const PIN_START = 0.02;
const PIN_ANGLE = (() => {
  const local = (phi) => circlePolygon(polar(PIN_R, phi).slice(0, 2).map((v, i) => v - PINION[i]), PIN, 20);
  let phi = 0.6 * Math.PI;
  while (!polygonsOverlap(GUIDE, local(phi))) phi += 0.0005;
  return phi - PIN_START;
})();
const pinOutline = circlePolygon(polar(PIN_R, PIN_ANGLE).slice(0, 2), PIN, 20);

/** 銷推引導片:小齒輪從鎖定的位置被推到剛好不和銷重疊的轉角(沒碰到就是 0) */
function pinPush(theta) {
  const pin = placeOutline(pinOutline, [0, 0], theta);
  return pushUntilClear(0, -1, 1.2, (a) => polygonsOverlap(placeOutline(GUIDE, PINION, a), pin));
}

/**
 * 大輪轉 theta(逆時針)時小齒輪的轉角(順時針為負)與目前誰在帶:
 * 鎖住("lock")→ 銷推引導片("pin")→ 齒接手("teeth",比銷快,追上之後就是齒在帶)→ 轉滿一圈再鎖住
 */
export function intermittent(theta) {
  const start = G0 - Math.PI; // 一圈從鎖住的中間算起
  const k = Math.floor((theta - start) / TAU);
  const u = theta - k * TAU;
  const pin = pinPush(u);
  const teeth = gearLine(u);
  const by = teeth <= -TAU ? "lock" : pin < teeth ? "pin" : teeth < 0 ? "teeth" : "lock";
  return { pinion: Math.min(pin, teeth) - k * TAU, by };
}
export const geometry = { NP, NW, RP, RW, wheelTeeth };

const wheelProfile = gearProfile({
  teeth: NW,
  radius: RW,
  has: (i) => wheelTeeth.includes(i),
  blank: (i) => (rootGaps.includes(i) ? "root" : "tip"),
});
const pinionProfile = gearProfile({ teeth: NP, radius: RP, has: (i) => pinionTeeth.includes(i) });
/** 平面外形(各自的局部座標):大輪、小齒輪(齒輪、鎖定塊)、引導片、銷 */
export const outlines = { wheel: wheelProfile, pinion: [pinionProfile, lockBlock], guide: GUIDE, pin: pinOutline };

export default {
  figure: 211,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: shape(resample(wheelProfile, 0.03), [circle(0.25).reverse()]), // 光滑部分在齒頂圓上,小齒輪的鎖定弧貼著它
      thickness: 0.22,
      hub: 0.45,
      mark: [RW - 0.5, 0],
      markSize: 0.08,
      spin: RW,
      pieces: [
        // 大輪上的銷:在齒段前端的缺口旁,從輪面伸出到引導片的深度
        { kind: "cylinder", radius: PIN, length: 0.4, at: [...polar(PIN_R, PIN_ANGLE).slice(0, 2), 0.2] },
      ],
    },
    {
      id: "pinion",
      kind: "group",
      center: PINION,
      spin: RP + 0.15,
      pieces: [
        { kind: "gear", teeth: NP, radius: RP, width: 0.22, toothed: pinionTeeth, hub: false, bore: 0.12 },
        { kind: "plate", shape: shape(lockBlock), thickness: 0.22 },
        { kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.35, mark: true },
        // 引導片:從軸轂往大輪伸出,越過齒頂蓋到大輪的輪面上(在輪面前方),被大輪上的銷撞到時小齒輪開始轉
        { kind: "plate", shape: shape(GUIDE), thickness: 0.1, at: [0, 0, GUIDE_Z] },
      ],
    },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [[0, 0], PINION].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.58, at: [x, y, -0.19] },
        ...pedestal({ at: [x, y], z: -0.48, bore: 0.1, floor: -3.3, depth: 0.2 }),
      ]),
    },
  ],
  // 動力重演:鎖住的那一段與銷推引導片的那一段(齒輪嚙合不做動力重演):有齒部分走過之後,小齒輪的鎖定弧貼著
  // 大輪的光滑圓周,大輪繼續轉也帶不動它;直到下一圈大輪上的銷撞到引導片,把小齒輪撥轉,停在齒快要接手的時候
  replay: {
    from: 2.9,
    to: TAU + 0.15, // 齒在 TAU + 0.164 接手
    free: { pinion: { hold: true } },
    ignore: [["pinion", "bearings"]], // 輪套在固定軸上(軸在輪轂的孔裡)
    expect: [
      { at: 4.5, part: "pinion", label: "大輪轉過光滑部分,小齒輪被鎖定弧鎖住不動", quote: "在該輪進行部分旋轉時,此段可作為鎖定機構" },
      { at: TAU, part: "pinion", label: "直到下一圈的銷來到之前,小齒輪一直不動" },
      { part: "pinion", label: "大輪上的銷撞到引導片,小齒輪開始轉", quote: "直到輪上的銷撞擊到小齒輪上的引導片時,小齒輪的軸便會開始下一次的旋轉" },
    ],
  },
  driver: { part: "wheel", type: "rotation" },
  target: "pinion",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { wheel: { angle: theta }, pinion: { angle: intermittent(theta).pinion } }, readouts: [] };
  },
};
