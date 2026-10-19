// 第 361 種:簡易的皮帶輪離合器。下方軸上固定一根 L 形的銷臂(往外伸的臂,頂端一根沿軸向伸向皮帶輪的銷),
// 皮帶輪鬆套在軸上,側面也有一根沿軸向伸出的銷;以槓桿把皮帶輪沿軸推動:推近時皮帶輪的銷伸到銷臂的銷旁邊
// (兩根銷沿軸向重疊),皮帶輪轉動時它的銷從側面推著銷臂的銷,下方軸跟著轉(接合);推開時皮帶輪的銷退到銷臂的銷外面,
// 皮帶輪在軸上空轉,下方軸停住(脫開)。上方軸由右邊的曲柄轉動(左端有飛輪),經皮帶帶動下方的皮帶輪。
// 主動件是上方的曲柄;狀態按鈕切換接合 / 脫開。
// 槓桿照原圖是一根彎桿:上端的樞軸藏在右立柱後面(原圖畫成一半虛線的圓),從樞軸往左彎、再往下伸,
// 下段的銷夾在皮帶輪輪轂上兩個環之間;切換狀態時槓桿繞樞軸擺一個小角度,把皮帶輪沿軸推過去。
// 脫開時下方軸停住:pose 給的是曲柄轉角 0 時接合的位置,網頁切換狀態時下方軸的轉角接續,停在銷分開的那一刻的位置。
// 推斷:兩輪同大;
// 槓桿在輪轂後面、樞銷從槓桿往前穿進右立柱;立柱下的底座(原圖兩柱伸出畫面下緣)。
import { X, routeBelt, beltTravel, wheelAngle } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const UP = { center: [0.15, 1.6, 0], r: 0.6 };
const LOW = { center: [0.15, -0.8, 0], r: 0.6 };
export const SHIFT = 0.35; // 皮帶輪被槓桿推動的距離
const PIN = { r: 0.05, at: 0.5 }; // 兩根軸向銷的半徑與離軸的距離
// 接合時兩根銷側面相碰:皮帶輪的銷落後銷臂的銷一個角度,兩根銷心的距離 = 兩個半徑相加
const LAG = 2 * Math.asin(PIN.r / PIN.at);
// 皮帶輪(局部 z 沿軸;接合時皮帶輪中心在 x = 0.15)
const HUB = { r: 0.16, from: 0.175, to: 0.75 }; // 往右伸的輪轂
const COLLAR = { r: 0.4, t: 0.06, gap: 0.142, mid: 0.6 }; // 輪轂上兩個環:中間的空隙夾著槓桿的銷
// 槓桿:樞軸在右立柱上(藏在立柱後面),槓桿在輪轂後面那一層
const LEVER = { pivot: [1.6, 0.45, -0.46], t: 0.08, pinR: 0.07, pinZ: [-0.5, -0.17] };

/** 曲柄轉 a、狀態 → 皮帶輪與下方軸的轉角 */
export function clutch(a, state = "on") {
  const travel = beltTravel(a, UP.r, 1);
  const pulley = wheelAngle(travel, LOW.r, 1);
  // 接合:皮帶輪的銷從後面推著銷臂的銷,下方軸在皮帶輪前面 LAG;脫開:軸停住
  return { travel, pulley, shaft: state === "on" ? pulley + LAG : LAG };
}

// 槓桿的銷要在的位置(兩環空隙的中心,世界 x)
const gapX = (state) => LOW.center[0] + (state === "on" ? 0 : SHIFT) + COLLAR.mid;
// 槓桿的銷(槓桿局部座標)選在讓兩個狀態的銷各偏離輪轂中心線一樣多(一上一下)的地方
const PIN_LOCAL = (() => {
  const [px, py] = LEVER.pivot;
  const [a, b] = [gapX("on") - px, gapX("off") - px];
  const h = py - LOW.center[1];
  const e = (a * a - b * b) / (4 * h); // 接合時銷比中心線高 e、脫開時低 e:a² + (h − e)² = b² + (h + e)²
  return [a, -(h - e)];
})();
const RHO = Math.hypot(...PIN_LOCAL);
const PHI0 = Math.atan2(PIN_LOCAL[1], PIN_LOCAL[0]);
/** 狀態 → 槓桿繞樞軸的轉角(銷的 x 落在兩環空隙的中心) */
export function leverAngle(state) {
  const phi = -Math.acos((gapX(state) - LEVER.pivot[0]) / RHO); // 銷在樞軸下方
  return phi - PHI0;
}

// 彎槓桿的外形(局部座標,接合時的姿勢):從樞軸往左彎,沿銷往下伸成握把
const [QX, QY] = PIN_LOCAL;
const LEVER_LINE = [[0, 0], [-0.3, -0.04], [QX * 0.75, QY * 0.2], [QX, QY * 0.55], [QX, QY], [QX, QY - 0.75]];

export default {
  figure: 361,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩根立柱(兩根軸穿過柱心),立在底座上(推斷)
        { kind: "box", size: [0.3, 4.4, 0.4], at: [-1.7, 0.5, 0] },
        { kind: "box", size: [0.3, 4.4, 0.4], at: [1.7, 0.5, 0] },
        { kind: "box", size: [4.4, 0.2, 1.2], at: [0, -1.8, -0.1] },
        // 槓桿的樞銷:從槓桿後面穿過槓桿的眼,往前插進右立柱;後端有銷頭
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [LEVER.pivot[0], LEVER.pivot[1], -0.3] },
        { kind: "cylinder", radius: 0.09, length: 0.04, at: [LEVER.pivot[0], LEVER.pivot[1], LEVER.pivot[2] - LEVER.t / 2 - 0.025] },
      ],
    },
    {
      id: "upper",
      kind: "group",
      axis: X,
      center: UP.center,
      spin: UP.r,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.6, at: [0, 0, -0.05] },
        { kind: "cylinder", radius: UP.r, length: 0.35, mark: true },
        { kind: "cylinder", radius: UP.r + 0.08, length: 0.05, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: UP.r + 0.08, length: 0.05, at: [0, 0, -0.2] },
        // 左端飛輪(實心的厚碟,軸穿進去)、右端曲柄
        { kind: "cylinder", radius: 0.9, length: 0.18, at: [0, 0, -2.3] },
        { kind: "box", size: [0.1, 0.7, 0.1], at: [0, -0.35, 2.15] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [0, -0.7, 2.3], accent: true },
      ],
    },
    {
      id: "lowerShaft",
      kind: "group",
      axis: X,
      center: LOW.center,
      spin: 0.5,
      spinOffset: -0.9,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.4 },
        // 固定在軸上的 L 形銷臂:套在軸上的套環、往外伸的臂、頂端沿軸向伸向皮帶輪的銷
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [0, 0, -0.8] },
        { kind: "box", size: [0.1, PIN.at + 0.05, 0.1], at: [0, (PIN.at + 0.05) / 2, -0.8], accent: true },
        { kind: "cylinder", radius: PIN.r, length: 0.35, at: [0, PIN.at, -0.625] },
      ],
    },
    {
      id: "pulley",
      kind: "group",
      axis: X,
      spin: LOW.r,
      pieces: [
        { kind: "cylinder", radius: LOW.r, length: 0.35, mark: true },
        { kind: "cylinder", radius: LOW.r + 0.08, length: 0.05, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: LOW.r + 0.08, length: 0.05, at: [0, 0, -0.2] },
        // 側面的銷:從左側輪緣沿軸向伸向銷臂
        { kind: "cylinder", radius: PIN.r, length: 0.45, at: [0, PIN.at, -0.45] },
        // 輪轂與兩個環
        { kind: "cylinder", radius: HUB.r, length: HUB.to - HUB.from, at: [0, 0, (HUB.from + HUB.to) / 2] },
        { kind: "cylinder", radius: COLLAR.r, length: COLLAR.t, at: [0, 0, COLLAR.mid - (COLLAR.gap + COLLAR.t) / 2] },
        { kind: "cylinder", radius: COLLAR.r, length: COLLAR.t, at: [0, 0, COLLAR.mid + (COLLAR.gap + COLLAR.t) / 2] },
      ],
    },
    // 推動皮帶輪的彎槓桿:上端繞右立柱上的樞銷擺動,下段的銷(沿 z)往前伸進兩環之間
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      posed: true, // 轉角由狀態決定
      pieces: [
        { kind: "plate", shape: shape(thickLine(LEVER_LINE, 0.12), [circle(0.05).reverse()]), thickness: LEVER.t, at: [0, 0, 0] },
        { kind: "plate", shape: shape(circle(0.13), [circle(0.05).reverse()]), thickness: LEVER.t, at: [0, 0, 0] },
        { kind: "cylinder", radius: LEVER.pinR, length: LEVER.pinZ[1] - LEVER.pinZ[0], at: [QX, QY, (LEVER.pinZ[0] + LEVER.pinZ[1]) / 2 - LEVER.pivot[2]] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "upper", type: "rotation" },
  target: "lowerShaft", // 接合時才跟著轉的下方軸
  states: {
    initial: "on",
    options: [
      { id: "on", label: "接合" },
      { id: "off", label: "脫開" },
    ],
  },
  view: { direction: [0.6, 0.15, 1] },
  pose(a, state = "on") {
    const c = clutch(a, state);
    const x = LOW.center[0] + (state === "on" ? 0 : SHIFT);
    const path = routeBelt([
      { center: UP.center, axis: X, radius: UP.r, sense: 1 },
      { center: [x, LOW.center[1], 0], axis: X, radius: LOW.r, sense: 1 },
    ]);
    return {
      parts: {
        upper: { angle: a },
        pulley: { position: [x, LOW.center[1], 0], angle: c.pulley },
        lowerShaft: { angle: c.shaft },
        lever: { angle: leverAngle(state) },
      },
      paths: { belt: { points: path.points, closed: true, phase: c.travel } },
      readouts: [],
    };
  },
};
