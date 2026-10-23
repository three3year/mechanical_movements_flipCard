// 第 284 種:鋸機平台的進料裝置。圖底的曲柄旋轉,經連桿把往復運動傳給曲柄搖臂槓桿(bell-crank)的水平臂,
// 槓桿的支點在左上角的 a;槓桿垂直臂上連著卡榫,卡榫推棘輪,棘輪軸上的小齒輪作動於平台側邊的齒條,平台就一步一步前進。
// 進料速度可以用曲柄搖臂槓桿上的螺絲調節:照原圖,垂直臂是一個開長槽的框,槽裡直立一根螺絲,卡榫的樞軸裝在螺絲上的
// 滑塊上,框頂的環首用來轉螺絲。轉螺絲,滑塊沿槽移動,卡榫接點離 a 越遠,槓桿擺同樣的角度卡榫拉得越長,進料越快。
// 連桿固定接在水平臂的末端,長度不變。
// 主動件是曲柄;狀態按鈕切換滑塊在螺絲上的兩個位置(進料慢 / 快),原機構由人轉環首調螺絲,所以用按鈕。
// 平台一直往同一方向走,齒條有長度,所以曲柄的轉動有範圍(FEED_TURNS 圈):自動播放到盡頭時曲柄倒轉、平台退回。
//
// 接觸(由接觸算,共用 pawl-drive.js):卡榫鉸在滑塊上,靠自重搭在棘輪右上方的齒上,末端的鉤朝輪心;
// 垂直臂往左擺時把卡榫往回拉,鉤頂著齒的直面把棘輪往逆時針拖;垂直臂往右擺時卡榫被齒背頂起、越過齒尖後加速落進
// 後面的齒間。棘輪左邊的止回爪靠自重搭在齒上,不讓棘輪倒轉。每程推過幾齒、停在哪裡都由爪與齒相碰算出:
// 進料慢時一程一齒,進料快時一程兩齒。卡榫的桿在棘輪前面一層,只有末端的鉤往後伸到棘輪那一層,所以只有鉤會碰到齒。
// 拉的時候卡榫的樞軸幾乎走水平線,被拉的齒卻繞輪心往左上轉,齒尖頂著鉤與桿之間的槽頂,把桿一路往上頂(進料快時一程約 15°)。
// 所以卡榫用 ride:每一步先求桿被頂起得最少、再求輪轉得最少——只在輪轉開也閃不掉時才讓桿被頂起,
// 不會沿齒的直面滑出齒間(2026-10-13 前不准往上讓,進料快時推不動就整個彈開 5.6° 再落回,一程跳七、八次)。
// 狀態切換:兩個狀態的爪與齒的接觸是各自算的,卡榫、止回爪、棘輪、小齒輪標 posed,切換時以短動畫轉到新狀態的姿勢,
// 不沿用舊狀態的轉角偏移(否則鉤與止回爪會畫歪、穿進齒裡);平台跟著移到新狀態的位置。
// 推斷:各桿長與棘輪齒數(依原圖);每程推過的齒數(慢一齒、快兩齒;原文只說螺絲可調進料速度);
// 止回爪(原圖棘輪左上的小爪)的支架;棘輪軸與曲柄軸的軸承座、平台的導軌、a 的座接到立柱的托板(原圖沒畫)。
// 偏離插圖:原圖的齒條與平台畫在棘輪前面;這裡小齒輪與齒條在棘輪後面(平台的側面朝著讀者、棘輪在最前面),
// 因為卡榫的鉤要伸到棘輪那一層——平台若在棘輪前面,會擋在鉤和齒之間(鉤只能繞到齒條下方約三點鐘處,
// 從那裡拉的方向偏離齒的切線,試過推不出穩定的整數齒)。棘輪照原圖做成輪緣、四根輪輻與輪轂,小齒輪咬著齒條的地方
// 從輪輻之間看得到。原圖的卡榫是一根長彎臂、末端捲成渦形,這裡是往外拱的彎臂加鉤(沒有捲成渦形)。
import { TAU, deg } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { ratchetShape, shape, circle, thickLine, rect, roundEnd, arcPoints } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const A = [-1.55, 1.85, 0]; // 支點 a
const CRANK = { center: [2.15, -1.7, 0.3], r: 0.78 };
const H_ARM = 3.0; // 連桿接在水平臂末端,離支點的距離
const ROD = Math.hypot(A[0] + H_ARM - CRANK.center[0], A[1] - CRANK.center[1]); // 連桿長(水平臂水平時剛好在曲柄軸正上方的距離)
const SLIDER = { slow: 0.72, fast: 1.05 }; // 滑塊(卡榫的樞軸)在螺絲上離支點的距離
const SLOT = [-0.225, -1.2]; // 垂直臂的槽(槓桿局部 y,從框頂的方塊下緣到框底的方塊上緣)
const WHEEL = { center: [-1.55, -0.75, 0], teeth: 40, outer: 1.22, inner: 1.07, dir: 1 };
const RIM = 0.9; // 輪緣的內緣:以內是輪輻與輪轂
const PITCH = TAU / WHEEL.teeth;
const CATCH = 1.25; // 卡榫從樞軸到鉤
const PINION = { center: [WHEEL.center[0], WHEEL.center[1], -0.35], teeth: 12, radius: 0.42 };
const RACK = { origin: [WHEEL.center[0], WHEEL.center[1] + PINION.radius, -0.35], dir: [1, 0, 0], pitch: circularPitch(PINION) };
// 進料的範圍:曲柄轉 FEED_TURNS 圈(主動量有範圍,自動播放到盡頭時曲柄倒轉、平台退回,不會一直往左跑出小齒輪)。
// 平台一開始往右挪整數個齒距(齒的相位不變),讓進料快走完全程時小齒輪仍咬在齒條中段:兩個狀態的平台位置都在
// 齒條齒段的兩端之內,各留約九個齒。
const FEED_TURNS = 12;
const FEED_SHIFT = 4 * RACK.pitch;
// 層次(z):棘輪 −0.08..0.08;水平臂 0.1..0.2;垂直臂的框、螺絲、滑塊 0.1..0.32;卡榫的桿 0.38..0.46;連桿 0.39..0.45
const Z = { arm: 0.15, frame: 0.21, frameT: 0.22, catchBar: 0.42, rod: 0.42 };
// 卡榫的鉤(局部座標:原點在樞軸,沿 +x 伸向棘輪;−y 朝輪心):鉤的後面(朝樞軸)是直的、前面斜
// 鉤比一個齒距窄,鉤背才不會壓到後一齒的齒尖;鉤的前面往後斜(倒鉤),拉的時候鉤往齒根吃進去
export const CATCH_OUTLINE = [
  [CATCH - 0.16, 0.05],
  [CATCH - 0.16, -0.05],
  [CATCH - 0.1, -0.05],
  [CATCH - 0.12, -0.16],
  [CATCH - 0.07, -0.16],
  [CATCH + 0.02, -0.05],
  [CATCH + 0.02, 0.05],
];
// 卡榫的臂照原圖往外拱(局部 +y,背離輪心)、再彎回來接到鉤:進料快時滑塊在槽底,樞軸離齒尖只有 0.33,
// 直桿會斜躺在齒尖上(正面看像整根卡榫壓在輪面上、鉤被桿擋住);拱起 ARM_BOW 後,臂在兩個狀態全程都離齒尖 0.15 以上,
// 只有末端的鉤伸進齒間。臂只是畫出來的形狀(在棘輪前面一層),和齒相碰的只有鉤(CATCH_OUTLINE)。
const ARM_BOW = 0.25;
export const CATCH_ARM = Array.from({ length: 17 }, (_, i) => [((CATCH - 0.08) * i) / 16, ARM_BOW * 4 * (i / 16) * (1 - i / 16)]);
// 止回爪(局部座標:原點在樞軸,沿 +x 往下伸到棘輪的左上緣)
const CLICK = { pivot: [-2.15, 0.84], length: 0.8 }; // 樞軸在棘輪左上方(平台的上方),爪略往左斜垂到齒上
// 末端朝輪的一側凸出一個尖;樞軸那端是半徑 CLICK_EYE 的圓頭,樞軸孔(半徑 0.05,同樞軸銷)四周留一圈肉
// (爪桿寬 0.1,平頭的話孔正好頂到兩側;圓頭離棘輪齒尖還有 1.6,碰不到齒)
const CLICK_EYE = 0.08;
const CLICK_EYE_OPEN = Math.asin(0.05 / CLICK_EYE); // 爪桿的兩側接到圓頭的角
const CLICK_OUTLINE = [[CLICK.length, -0.05], [CLICK.length, 0.03], [CLICK.length - 0.03, 0.14], [CLICK.length - 0.1, 0.05], ...arcPoints(CLICK_EYE, CLICK_EYE_OPEN, TAU - CLICK_EYE_OPEN)];

function arm(theta, d) {
  const pin = crankPin(CRANK.center, CRANK.r, theta);
  const H = circleCircle(A, H_ARM, pin, ROD, 1).point;
  const beta = angleOf(A, H); // 水平臂的角度
  const V = [A[0] + d * Math.cos(beta - Math.PI / 2), A[1] + d * Math.sin(beta - Math.PI / 2), 0]; // 卡榫的樞軸(滑塊)
  return { pin, H, beta, V };
}

function setup(d) {
  const drive = pawlDrive({
    period: TAU,
    samples: 720,
    pins: (theta) => ({ catch: arm(theta, d).V.slice(0, 2), click: CLICK.pivot }),
    wheel: { obstacles: (w) => ratchetObstacles(WHEEL, w, WHEEL.center), dir: WHEEL.dir, pitch: PITCH },
    pawls: {
      // 垂直臂往左擺(V 的 x 變小)時卡榫在拉
      catch: { outline: CATCH_OUTLINE, into: -1, angle: deg(-46), limits: [deg(-75), deg(-20)], lift: [-0.03, 0.02], ride: true, pushes: (theta) => arm(theta + 1e-3, d).V[0] < arm(theta - 1e-3, d).V[0] },
      click: { outline: CLICK_OUTLINE, into: 1, angle: deg(-105), limits: [deg(-140), deg(-85)] },
    },
  });
  // 棘輪的顯示角度從 0 附近起算,但只能減掉整數個齒距:齒的位置要和算接觸時一致
  return { d, drive, zero: Math.round(drive.at(0).wheel / PITCH) * PITCH };
}
const SETUPS = { slow: setup(SLIDER.slow), fast: setup(SLIDER.fast) };

/** 曲柄轉 theta(狀態 state):槓桿姿勢、卡榫與止回爪的轉角、棘輪的累計轉角、平台的位移 */
export function feed(theta, state = "slow") {
  const S = SETUPS[state];
  const a = arm(theta, S.d);
  const s = S.drive.at(theta);
  const wheel = s.wheel - S.zero;
  return { ...a, wheel, catchAngle: s.angles.catch, clickAngle: s.angles.click, step: S.drive.step, carriage: rackOffset(PINION, RACK, wheel) };
}
export const geometry = { PITCH, A, ROD, H_ARM, SLIDER, FEED_TURNS };
/** 檢查用:卡榫的鉤、止回爪與棘輪的齒(世界座標 2D) */
export const contactAt = (theta, state = "slow") => {
  const s = SETUPS[state].drive.shapes(theta);
  return { catch: s.pawls.catch, click: s.pawls.click, teeth: s.wheel };
};

// 四根輪輻:兩根貫穿輪轂的條,照原圖斜著交叉
const spokes = [1, 3].map((k) => ({ kind: "box", size: [2 * RIM + 0.1, 0.12, 0.1], angle: (k * Math.PI) / 4 }));
// 垂直臂的開槽框(槓桿局部座標,支點在原點、垂直臂沿 −y)
const FRAME_W = 0.36; // 框寬;槽寬 0.2(滑塊的寬)
const SLIDER_SIZE = [0.2, 0.2, Z.frameT];
const sideBar = (s) => ({ kind: "box", size: [(FRAME_W - SLIDER_SIZE[0]) / 2, SLOT[0] - SLOT[1], Z.frameT], at: [(s * (FRAME_W + SLIDER_SIZE[0])) / 4, (SLOT[0] + SLOT[1]) / 2, Z.frame] });
const SCREW = { top: 0.33, bottom: SLOT[1] - 0.06 }; // 螺絲從框頂的方塊上方穿過整個槽,下端插進框底的方塊

export default {
  figure: 284,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 5.0, 0.3], at: [-2.65, -0.2, -0.6] },
        // a 的座:托板從立柱伸到支點後面,槓桿的轂插在座裡
        { kind: "box", size: [1.3, 0.7, 0.35], at: [-1.95, A[1], -0.325] },
        { kind: "box", size: [4.9, 0.12, 0.6], at: [-0.1, -2.6, -0.4] },
        // 曲柄軸與棘輪軸的軸承座
        ...pedestal({ at: CRANK.center, z: -0.2, bore: 0.1, floor: -2.54 }),
        ...pedestal({ at: WHEEL.center, z: -0.75, bore: 0.1, floor: -2.54 }),
        // 止回爪的樞軸銷與支架(支架從立柱伸到銷)
        { kind: "box", size: [CLICK.pivot[0] + 0.05 + 2.5, 0.2, 0.3], at: [(-2.5 + CLICK.pivot[0] + 0.05) / 2, CLICK.pivot[1], -0.6] },
        { kind: "cylinder", radius: 0.05, length: 0.75, at: [...CLICK.pivot, -0.33] },
        // 平台背面的導軌
        { kind: "box", size: [5.4, 0.16, 0.1], at: [-1.1, RACK.origin[1] + 0.55, -0.5] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.15,
      pieces: [
        { kind: "plate", shape: shape(roundEnd(thickLine([[0, 0], [CRANK.r, 0]], 0.18), [0, 0], 0.09), [circle(0.05).reverse()]), thickness: 0.1 }, // 軸那端畫成圓頭,軸孔四周留一圈肉
        { kind: "cylinder", radius: 0.06, length: Z.rod + 0.08 - CRANK.center[2] + 0.05, at: [CRANK.r, 0, (Z.rod + 0.08 - CRANK.center[2] - 0.05) / 2] }, // 曲柄銷伸到前面的連桿
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [0, 0, -0.35] }, // 曲柄軸只往後伸(連桿從曲柄前面掃過軸心),前端接著曲柄臂
      ],
    },
    { id: "rod", kind: "link", width: 0.09, thickness: 0.06 },
    {
      id: "bellCrank",
      kind: "group",
      center: A,
      arrow: false,
      label: "a",
      labelOffset: [-0.4, 0.25, 0.3],
      pieces: [
        // 水平臂,末端的銷往前穿過連桿
        { kind: "plate", shape: shape(thickLine([[0, 0], [H_ARM + 0.12, 0]], 0.13)), thickness: 0.1, at: [0, 0, Z.arm] },
        { kind: "cylinder", radius: 0.04, length: Z.rod + 0.06 - (Z.arm - 0.05), at: [H_ARM, 0, (Z.rod + 0.06 + Z.arm - 0.05) / 2] },
        // 垂直臂:開長槽的框——框頂的方塊(支點在它後面)、兩根側條、框底的方塊
        { kind: "box", size: [FRAME_W, -2 * SLOT[0], Z.frameT], at: [0, 0, Z.frame] },
        sideBar(-1),
        sideBar(1),
        { kind: "box", size: [FRAME_W, 0.12, Z.frameT], at: [0, SLOT[1] - 0.06, Z.frame] },
        // 槽裡直立的螺絲,頂上伸出框頂、接著轉螺絲的環首
        { kind: "worm", axis: [0, 1, 0], radius: 0.06, length: SCREW.top - SCREW.bottom, pitch: 0.07, thread: 0.012, at: [0, (SCREW.top + SCREW.bottom) / 2, Z.frame] },
        { kind: "cylinder", radius: 0.13, inner: 0.07, length: 0.06, at: [0, SCREW.top + 0.12, Z.frame] },
        // 支點 a 的轂,往後插進座裡
        { kind: "cylinder", radius: 0.11, length: 0.5, at: [0, 0, Z.frame - Z.frameT / 2 - 0.25] },
      ],
    },
    // 套在螺絲上的滑塊(卡榫的樞軸裝在它前面);兩側貼著槽壁,隨槓桿擺
    { id: "slider", kind: "group", arrow: false, pieces: [{ kind: "box", size: SLIDER_SIZE, at: [0, 0, Z.frame] }] },
    {
      id: "catch",
      kind: "group",
      arrow: false,
      posed: true,
      pieces: [
        { kind: "plate", shape: shape(roundEnd(thickLine(CATCH_ARM, 0.1), [0, 0], 0.06), [circle(0.04).reverse()]), thickness: 0.08, at: [0, 0, Z.catchBar] }, // 卡榫的彎臂在棘輪與框的前面;樞軸那端畫成圓頭
        { kind: "plate", shape: shape(CATCH_OUTLINE), thickness: Z.catchBar + 0.04 + 0.06, at: [0, 0, (Z.catchBar + 0.04 - 0.06) / 2] }, // 鉤往後伸到棘輪那一層
        { kind: "cylinder", radius: 0.04, length: Z.catchBar + 0.04 - (Z.frame + Z.frameT / 2 - 0.04), at: [0, 0, (Z.catchBar + 0.04 + Z.frame + Z.frameT / 2 - 0.04) / 2] }, // 鉸在滑塊前面的銷
      ],
    },
    {
      id: "click",
      kind: "group",
      center: [...CLICK.pivot, 0],
      arrow: false,
      posed: true,
      pieces: [{ kind: "plate", shape: shape(CLICK_OUTLINE, [circle(0.05).reverse()]), thickness: 0.12 }],
    },
    {
      id: "ratchet",
      kind: "plate",
      center: WHEEL.center,
      posed: true,
      shape: { outline: ratchetShape(WHEEL).outline, holes: [circle(RIM).reverse()] }, // 輪緣
      thickness: 0.16,
      spin: WHEEL.outer,
      mark: [WHEEL.inner - 0.06, 0],
      markSize: 0.07,
      pieces: [...spokes, { kind: "cylinder", radius: 0.22, length: 0.8, at: [0, 0, -0.2] }, { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.75] }],
    },
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.2, arrow: false, posed: true },
    {
      id: "carriage",
      kind: "rack",
      teeth: 25,
      pitch: RACK.pitch,
      width: 0.2,
      depth: 0.2,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(rect(25 * RACK.pitch, 0.45, 0, -0.5)), thickness: 0.2 }], // 平台的板,下緣壓在齒條背面
    },
  ],
  // 動力重演:只推曲柄;棘輪靠摩擦定位,由卡榫拉動;卡榫鉸在滑塊上、止回爪鉸在銷上,都靠自重搭在齒上
  replay: {
    to: 2 * TAU,
    seconds: 20,
    free: { ratchet: { hold: true, gravity: false }, catch: { on: "slider" }, click: {} },
    ignore: [["ratchet", "frame"], ["ratchet", "pinion"]],
    expect: [
      { at: TAU, part: "ratchet", label: "曲柄轉一圈,卡榫把棘輪拉過一齒", quote: "藉此將運動傳遞給連接於槓桿垂直臂上的卡榫，該卡榫再將運動傳遞給棘輪" },
      { at: 2 * TAU, part: "ratchet", label: "兩圈兩齒" },
    ],
  },
  driver: { part: "crank", type: "rotation", range: [0, FEED_TURNS * TAU], speed: 0.8 }, // 速度同沒有範圍時的預設(一圈約 8 秒)
  target: "carriage", // 一步一步前進的平台
  states: {
    initial: "slow",
    options: [
      { id: "slow", label: "進料慢" },
      { id: "fast", label: "進料快" },
    ],
  },
  view: { direction: [0.04, 0.05, 1] },
  pose(theta, state = "slow") {
    const f = feed(theta, state);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [f.pin[0], f.pin[1], Z.rod], to: [f.H[0], f.H[1], Z.rod] },
        bellCrank: { angle: f.beta },
        slider: { position: f.V, angle: f.beta },
        catch: { position: f.V, angle: f.catchAngle },
        click: { angle: f.clickAngle },
        ratchet: { angle: f.wheel },
        pinion: { angle: f.wheel },
        // 齒條齒朝下,咬在小齒輪頂上:齒條零件轉 180°
        carriage: { position: [RACK.origin[0] + FEED_SHIFT + f.carriage, RACK.origin[1], -0.35], angle: Math.PI },
      },
      readouts: [],
    };
  },
};
