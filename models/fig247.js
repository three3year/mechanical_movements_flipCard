// 第 247 種:釋放測深錘的方式。測深錘(剖面)套在桿上,由桿下端的卡榫從下方托住;桿底伸出一根可以滑動的
// 頂桿。頂桿撞到海底時被推得相對於桿往上,把卡榫從錘的下方抽開,錘便脫落,桿不帶錘被拉上來。
// 主動件是虛擬的「進程」:放下 → 頂桿觸底、被推上 → 錘脫落 → 收回桿;每一輪換一個新錘。
//
// 照原圖(507movements 的 525 px 大圖)的剖面:桿是實心的圓桿,下段挖了一個朝錘那一側開口的槽(左邊留一道壁、
// 底下有一塊底塊)。桿和錘一樣只畫後半(剖切面 z = 0 之後),槽在剖切面後面深 SLOT_DEPTH;卡榫與頂桿裝在槽裡,
// 厚度跨過剖切面(原圖剖面圖裡沒剖開的內部零件),和錘的後半同一層。
// - 卡榫用一根橫穿槽的銷(桿的一部分)裝在槽裡;托腳從槽的右側伸出,頂面順著錘的下緣,托在錘的下緣。
// - 頂桿是一根直桿,穿過底塊的孔(孔與槽的左壁就是導套)在槽裡滑,上端斜切,頂在卡榫上臂的肘下,把卡榫往順時針轉開。
// 接觸(由接觸算):頂桿被推上多少,由它的腳底碰到海底決定;卡榫被彈簧往外推、靠在槽的左壁(原位),
// 被頂桿頂開、或被錘孔壁壓回時,轉到剛好不碰;錘掛著時靠在托腳上(托腳轉開時錘跟著托腳的頂面移動);
// 托腳最外側退進錘孔以內的那一刻錘才脫落,從那時起加速落到海底。收回時托腳被錘孔壁壓回,出了錘頂才張開。
// 推斷:卡榫上端原圖的 S 形細件畫成壓縮彈簧(從槽頂壓住上臂的上端,把托腳往外推);頂桿上的擋圈(靠在底塊頂面,
// 頂桿沒被推時掛在這裡);各階段所佔的進程。
// 偏離插圖(實物可行):卡榫的樞軸比原圖偏右(離托腳近)——錘壓在托腳上的力垂直於錘的下緣,要差不多通過樞軸,
// 卡榫才不會一掛上錘就被壓開(彈簧只要很小的力);上臂下段往左彎出一個肘,頂桿斜切的上端頂在肘下,
// 頂桿短短一段行程(和原圖頂桿到桿底的距離相當)就把卡榫轉開。
import { Y, clamp, smooth } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine, circle, arcPoints } from "./shapes.js";
import { placeOutline, polygonsOverlap, pushUntilClear } from "./contact.js";
import { falling } from "./jumps.js";

const SEA = -2.5; // 海底
const TOP = 0.7; // 桿(錘心原位)起始高度
const BALL = 1.0;
const HOLE = 0.31; // 錘孔半徑
// 桿(局部座標:原點在錘心原位)
const ROD_R = 0.29;
const ROD_TOP = 2.3;
const SLOT_TOP = 0.7;
const BLOCK_TOP = -1.35; // 底塊頂面
const ROD_BOTTOM = -1.75;
const WALL = -0.14; // 槽的左壁(面)
const SLOT_DEPTH = 0.08; // 槽在剖切面後面的深度
const CATCH_T = 0.12; // 卡榫厚度(跨過剖切面)
const PLUNGER_T = 0.11;
const PIVOT = [0.17, -0.46]; // 卡榫樞軸
const PIN_R = 0.03;
// 頂桿(局部座標:沒被推時和桿的局部座標重合)
const PL_X = [-0.135, -0.03];
const PL_TOP = [-0.4, -0.34]; // 斜切的上端:左低右高
export const PUSH = 0.13; // 桿觸底後再下降的量 = 頂桿被推上的行程
const FOOT_TOP = ROD_BOTTOM - PUSH - 0.04; // 推到底時腳板離桿底還有一點
const FOOT_BOTTOM = FOOT_TOP - 0.25;
const CONTACT = SEA - FOOT_BOTTOM; // 腳底碰到海底時的桿高
const REST = SEA + Math.sqrt(BALL * BALL - HOLE * HOLE); // 錘落在海底時的錘心高度(錘孔下緣著地)
const P = { touch: 0.33, pushed: 0.45, lift: 0.58, back: 0.9, gone: 0.94 };
const DROP = 0.06; // 錘落到海底所佔的進程

// 卡榫(局部座標:原點在樞軸):上臂往左上斜伸到槽頂附近,下段往右下伸到托腳;托腳頂面順著錘的下緣
const ARM_END = [-0.25, 0.8];
const ARM = thickLine([[0, 0], [-0.23, 0.22], ARM_END], 0.07);
const sphereBelow = (x) => -Math.sqrt(BALL * BALL - x * x); // 錘的下緣(錘心在原點、剖切面上)
const TOE_X = [0.27, 0.38]; // 托腳頂面的範圍(桿座標):錘孔半徑以外伸出 0.07
const BLADE = [
  [-0.04, 0.02],
  [0.04, 0],
  ...Array.from({ length: 6 }, (_, i) => {
    const x = TOE_X[0] + ((TOE_X[1] - TOE_X[0]) * i) / 5;
    return [x - PIVOT[0], sphereBelow(x) - PIVOT[1]];
  }),
  [0.2, -0.56],
  [0.16, -0.68],
  [0.1, -0.76],
  [-0.03, -0.12],
];
const BOSS = circle(0.065);
const CATCH_OUTLINES = [ARM, BOSS, BLADE];

// 錘(錘心在原點)在剖切面後面深 d 那一層的斷面:孔的右、左兩塊。錘只畫後半,卡榫背面那一層(d = CATCH_T/2)
// 剖到的孔緣離軸線比剖切面上的近一點,托腳和錘的接觸兩層都要查
const weightSection = (d) => {
  const hole = Math.sqrt(HOLE * HOLE - d * d);
  const h = Math.sqrt(BALL * BALL - HOLE * HOLE);
  const right = Array.from({ length: 41 }, (_, i) => {
    const y = -h + (2 * h * i) / 40;
    return [Math.sqrt(BALL * BALL - y * y - d * d), y];
  });
  const left = right.map(([x, y]) => [-x, y]).reverse();
  return [
    [[hole, h], [hole, -h], ...right.slice(1, -1)].reverse(),
    [[-hole, -h], [-hole, h], ...left.slice(1, -1)].reverse(),
  ];
};
const WEIGHT_SECTIONS = [...weightSection(0), ...weightSection(CATCH_T / 2)];
const WEIGHT_RIGHT = [WEIGHT_SECTIONS[0], WEIGHT_SECTIONS[2]]; // 卡榫只碰得到孔右邊那一塊
const shift = (poly, dx, dy) => poly.map(([x, y]) => [x + dx, y + dy]);

// 桿在剖切面上的實體:槽的左壁(到桿底)、底塊(頂桿的孔在左壁與底塊之間)、槽頂以上
const ROD_SECTIONS = [
  [[-ROD_R, ROD_BOTTOM], [WALL, ROD_BOTTOM], [WALL, SLOT_TOP], [-ROD_R, SLOT_TOP]],
  [[PL_X[1] + 0.005, ROD_BOTTOM], [ROD_R, ROD_BOTTOM], [ROD_R, BLOCK_TOP], [PL_X[1] + 0.005, BLOCK_TOP]],
  [[-ROD_R, SLOT_TOP], [ROD_R, SLOT_TOP], [ROD_R, ROD_TOP], [-ROD_R, ROD_TOP]],
];
// 頂桿(局部座標):直桿、上端斜切;擋圈靠在底塊頂面;腳板
const PLUNGER_BODY = [[PL_X[0], FOOT_TOP], [PL_X[1], FOOT_TOP], [PL_X[1], PL_TOP[1]], [PL_X[0], PL_TOP[0]]];
const COLLAR = rect(0.13, 0.06, -0.07, BLOCK_TOP + 0.03);
const FOOT = rect(0.3, FOOT_TOP - FOOT_BOTTOM, -0.085, (FOOT_TOP + FOOT_BOTTOM) / 2);
const PLUNGER_SECTIONS = [PLUNGER_BODY, COLLAR, FOOT];

/** 卡榫在桿座標裡轉 angle 時的外形 */
const catchShapes = (angle) => CATCH_OUTLINES.map((o) => placeOutline(o, PIVOT, angle));
const hitsAny = (shapes, obstacles) => shapes.some((s) => obstacles.some((o) => polygonsOverlap(s, o)));

// 原位:彈簧把卡榫往外(逆時針)推,上臂靠到槽的左壁為止
const REST_ANGLE = (() => {
  const wall = [ROD_SECTIONS[0]];
  let a = -0.3;
  if (hitsAny(catchShapes(a), wall)) throw new Error("第 247 種:卡榫轉開時仍碰到槽壁");
  while (!hitsAny(catchShapes(a + 0.01), wall)) a += 0.01;
  let [lo, hi] = [a, a + 0.01];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hitsAny(catchShapes(mid), wall)) hi = mid;
    else lo = mid;
  }
  return lo;
})();

/** 卡榫的轉角:從原位往順時針轉到剛好不碰 obstacles(桿座標)——被頂桿頂開、被錘孔壁壓回 */
function catchAngleAmong(obstacles) {
  const hits = (a) => hitsAny(catchShapes(a), obstacles);
  if (!hits(REST_ANGLE)) return REST_ANGLE;
  // 一小步一小步往順時針轉,第一次不碰的那一步再以推到不重疊逼近
  for (let a = REST_ANGLE - 0.02; a > REST_ANGLE - 0.9; a -= 0.02) {
    if (!hits(a)) return pushUntilClear(a + 0.02, -1, 0.02, hits);
  }
  throw new Error("第 247 種:卡榫轉到底仍碰到東西");
}
const plungerAt = (push) => PLUNGER_SECTIONS.map((s) => shift(s, 0, push));
// 托腳最外側離錘心軸線的距離:小於錘孔半徑就托不住錘。錘只畫後半,托腳托在卡榫背面那一層(z = −CATCH_T/2),
// 那一層剖到的錘孔比剖切面上的小一點
const footReach = (angle) => Math.max(...placeOutline(BLADE, PIVOT, angle).map(([x]) => x));
const HOLE_AT_CATCH = Math.sqrt(HOLE * HOLE - (CATCH_T / 2) ** 2);
// 錘掛著時靠在托腳上:錘心(相對桿)往上推到剛好不碰卡榫
const sitOn = (angle) => {
  const shapes = catchShapes(angle);
  return pushUntilClear(-0.3, 1, 0.6, (y) => hitsAny(shapes, WEIGHT_RIGHT.map((w) => shift(w, 0, y))));
};

function rodAt(t) {
  if (t < P.touch) return TOP + (CONTACT - TOP) * (t / P.touch);
  if (t < P.pushed) return CONTACT - PUSH * ((t - P.touch) / (P.pushed - P.touch));
  if (t < P.lift) return CONTACT - PUSH;
  if (t < P.back) return CONTACT - PUSH + (TOP - CONTACT + PUSH) * smooth((t - P.lift) / (P.back - P.lift));
  return TOP;
}
const pushAt = (rod) => clamp(SEA - (rod + FOOT_BOTTOM), 0, PUSH);
// 錘掛著時:卡榫只被頂桿頂
const heldAngle = (t) => catchAngleAmong(plungerAt(pushAt(rodAt(t))));
// 錘脫落的那一刻:頂桿推著卡榫轉開,托腳退進錘孔以內(二分法逼近)
const T_RELEASE = (() => {
  const free = (t) => footReach(heldAngle(t)) < HOLE_AT_CATCH;
  let lo = P.touch;
  let hi = P.pushed;
  if (!free(hi)) throw new Error("第 247 種:頂桿推到底,卡榫仍托著錘");
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (free(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
})();
const RELEASED_AT = rodAt(T_RELEASE) + sitOn(heldAngle(T_RELEASE - 1e-9)); // 錘離開托腳時的高度

/** 進程 p → 桿(錘心原位)的高度、頂桿被推上的量、卡榫轉角、錘心高度與錘是否還在 */
export function sounding(p) {
  const t = ((p % 1) + 1) % 1;
  const rod = rodAt(t);
  const push = pushAt(rod);
  if (t < T_RELEASE) {
    const catchAngle = heldAngle(t);
    return { rod, push, catchAngle, weight: rod + sitOn(catchAngle), attached: true, shown: true };
  }
  const weight = RELEASED_AT + (REST - RELEASED_AT) * falling(Math.min(1, (t - T_RELEASE) / DROP));
  // 錘脫落後:卡榫被頂桿頂著,或被錘孔壁壓著(錘在桿座標裡的位置)
  const catchAngle = catchAngleAmong([...plungerAt(push), ...WEIGHT_RIGHT.map((w) => shift(w, 0, weight - rod))]);
  return { rod, push, catchAngle, weight, attached: false, shown: t < P.gone };
}

/**
 * 進程 p 時剖切面上(世界座標 xy)的外形:桿、錘(隱藏時是空的)、卡榫、頂桿,各是多邊形的陣列。
 * override 可以改卡榫的轉角(catchAngle)或錘心高度(weight),用來查「再轉一點、再低一點就會碰到」。
 */
export function section(p, override = {}) {
  const s = { ...sounding(p), ...override };
  const toWorld = (poly) => shift(poly, 0, s.rod);
  return {
    rod: ROD_SECTIONS.map(toWorld),
    weight: s.shown ? WEIGHT_SECTIONS.map((w) => shift(w, 0, s.weight)) : [],
    catch: catchShapes(s.catchAngle).map(toWorld),
    plunger: plungerAt(s.push).map(toWorld),
  };
}
export const geometry = { SEA, BALL, REST, HOLE, HOLE_AT_CATCH, T_RELEASE, REST_ANGLE, ROD_BOTTOM, BLOCK_TOP, P, footReach };

// 錘的剖面:球面從錘孔下緣到上緣(錘孔是圓柱孔,孔緣以內沒有球面)
const RIM = Math.acos(HOLE / BALL);
const ballProfile = arcPoints(BALL, -RIM, RIM);

// 桿的橫斷面(沿桿擠出;局部 y 是剖切面後面的深度,只畫後半)
const half = arcPoints(ROD_R, 0, Math.PI);
const slotted = [[WALL, 0], [WALL, SLOT_DEPTH], ...arcPoints(ROD_R, Math.asin(SLOT_DEPTH / ROD_R), Math.PI)];
const bored = [
  [PL_X[0] - 0.005, 0],
  [PL_X[0] - 0.005, PLUNGER_T / 2 + 0.005],
  [PL_X[1] + 0.005, PLUNGER_T / 2 + 0.005],
  [PL_X[1] + 0.005, 0],
  ...half,
];
const rodPiece = (outline, y0, y1) => ({ kind: "plate", shape: shape(outline), thickness: y1 - y0, axis: Y, at: [0, (y0 + y1) / 2, 0] });
const SPRING_TOP = [ARM_END[0] + PIVOT[0], SLOT_TOP]; // 彈簧上端頂在槽頂

export default {
  figure: 247,
  parts: [
    { id: "seabed", kind: "box", center: [0, SEA - 0.15, 0], size: [3.6, 0.3, 1.6] },
    {
      id: "rod",
      kind: "group",
      pieces: [
        rodPiece(half, SLOT_TOP, ROD_TOP),
        rodPiece(slotted, BLOCK_TOP, SLOT_TOP), // 下段:左壁與槽後的部分,槽朝錘那一側開口
        rodPiece(bored, ROD_BOTTOM, BLOCK_TOP), // 底塊:頂桿穿過的孔
        // 卡榫的銷:橫穿槽,後端埋進槽後的桿,前端露出卡榫
        { kind: "cylinder", radius: PIN_R, length: SLOT_DEPTH + 0.06 + CATCH_T / 2 + 0.02, at: [...PIVOT, (CATCH_T / 2 + 0.02 - SLOT_DEPTH - 0.06) / 2] },
      ],
    },
    { id: "weight", kind: "lathe", axis: Y, profile: ballProfile, ...backHalf(Y) },
    {
      id: "catch",
      kind: "plate",
      shape: shape(BOSS, [circle(PIN_R).reverse()]),
      thickness: CATCH_T,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(ARM), thickness: CATCH_T },
        { kind: "plate", shape: shape(BLADE), thickness: CATCH_T },
      ],
    },
    { id: "catchSpring", kind: "spring", coils: 4, radius: 0.035, wire: 0.012 },
    {
      id: "plunger",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(PLUNGER_BODY), thickness: PLUNGER_T }, // 直桿,上端斜切
        { kind: "plate", shape: shape(COLLAR), thickness: PLUNGER_T }, // 擋圈(推斷)
        { kind: "plate", shape: shape(FOOT), thickness: 0.3 }, // 腳板
      ],
    },
  ],
  powered: ["weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  // 動力重演:只推進程(桿照進程走);錘沿軸上下、受重力,靠在托腳上;卡榫以銷裝在桿上、被彈簧往外推,
  // 靠到槽的左壁為止(重演時卡榫和它所在的桿之間不算碰撞,改用轉角範圍代表);頂桿在桿的孔裡上下、受重力,
  // 擋圈靠在底塊上(同樣改用位移範圍代表)
  replay: {
    to: 0.9,
    seconds: 10,
    free: {
      weight: { slide: [0, 1, 0] },
      catch: { on: "rod", pivot: [PIVOT[0], TOP + PIVOT[1], 0], axis: [0, 0, 1], spring: 1, limits: [-0.9, 0] },
      plunger: { on: "rod", slide: [0, 1, 0], limits: [0, PUSH + 0.04] },
    },
    ignore: [["catch", "catchSpring"]], // 彈簧照模型擺,它對卡榫的力由 spring 代表
    expect: [
      { at: T_RELEASE - 0.03, part: "weight", label: "頂桿觸底前,錘由卡榫托著隨桿下降" },
      { at: T_RELEASE + DROP + 0.04, part: "weight", label: "卡榫被抽開,錘脫落到海底", quote: "將卡榫從錘的下方抽出，錘便會脫落" },
      { at: 0.7, part: "weight", label: "桿被拉起,錘留在海底", quote: "讓桿在不帶錘的情況下被拉起" },
      { at: P.lift, part: "catch", label: "頂桿推到底,卡榫轉開" },
      { at: 0.9, part: "catch", label: "托腳出了錘頂,被彈簧推回原位" },
      { at: 0.9, part: "weight", label: "桿收回,錘仍留在海底" },
    ],
  },
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },
  target: "weight", // 被釋放的測深錘
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sounding(p);
    const armTop = placeOutline([ARM_END], PIVOT, s.catchAngle)[0]; // 彈簧下端壓在上臂的上端
    return {
      parts: {
        rod: { position: [0, s.rod, 0] },
        weight: { position: [0, s.weight, 0], visible: s.shown },
        catch: { position: [PIVOT[0], s.rod + PIVOT[1], 0], angle: s.catchAngle },
        catchSpring: { from: [SPRING_TOP[0], s.rod + SPRING_TOP[1], 0], to: [armTop[0], s.rod + armTop[1], 0] },
        plunger: { position: [0, s.rod + s.push, 0] },
      },
      readouts: [],
    };
  },
};
