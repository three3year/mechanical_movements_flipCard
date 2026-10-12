// 第 271 種:裝有兩根棘爪的槓桿擺動時,給棘齒桿近乎連續的直線運動。槓桿在右端繞樞軸擺動,
// 兩根棘爪分別接在樞軸上方與下方,往左伸到棘齒桿的齒上:槓桿往一邊擺時上方那根把桿往右拉,
// 擺回來時換下方那根拉,所以桿一直往右走。
// 照原圖(525 px 原圖放大):棘齒桿是一條鋪在固定床台上的薄齒條,床台由兩個方塊墊在地上;桿的左端繫一條繩,
// 水平拉到左邊滑輪的頂上,再從滑輪左側往下垂——桿往右走時把繩下端吊著的東西往上拉。
// 主動件是槓桿(累計行程,見 kit.swing)。
//
// 接觸(由接觸算,共用 pawl-drive.js;棘齒桿的位置當作「輪」的座標):兩根棘爪鉸在槓桿的銷上,末端的鉤往下,
// 靠自重落在齒間。齒的直面朝左,鉤從左邊鉤住直面往右拉;退回時鉤沿前一齒的斜背滑上去、越過齒尖落進下一格。
// 拉多遠、何時越過、落多深,都由鉤與齒相碰算出。繩不伸長:桿往右走多少,重物就升多少,滑輪的輪緣跟著繩走。
// 行程:槓桿擺兩個來回(桿走六齒)為一輪,走完從頭再演一次(桿與重物回到起點,那是劇情重演,不是零件瞬移)。
// 桿的長度與起點讓兩支爪的鉤全程都搭在桿的齒上,桿的重心全程在床台上。
// 推斷:繩下端吊的重物(原圖的繩垂過地面線就畫到邊,沒畫吊什麼);托滑輪的支架(原圖沒畫,立在底板左端,
// 滑輪伸出底板的邊,繩從邊上垂下);桿左端繫繩的環;棘爪靠自重落在齒上;齒的直面朝左且往回勾
// (棘爪往右上拉才鉤得住,原圖看不出齒形)。
// 偏離插圖:床台比原圖長、滑輪離床台比原圖遠——桿要走兩個來回(六齒)而上爪的鉤要一直搭在齒上,
// 桿的起點得比原圖更靠左(原文 > 實物可行 > 插圖外形)。
import { deg, rot2, swing, swingPhase, routeRope, Z } from "./kit.js";
import { pawlDrive } from "./pawl-drive.js";
import { shape, thickLine, circle } from "./shapes.js";

const P = [2.55, 0.45, 0]; // 槓桿樞軸
const UP = 0.75; // 上方棘爪接點到樞軸
const DOWN = 0.55; // 下方棘爪接點到樞軸
const S = deg(20); // 擺幅(單邊):兩根棘爪每一程都走過一個多齒距,每一程都拉得到
const BAR_Y = -0.15; // 棘齒桿齒面高度
const PITCH = 0.22;
const ROOT = BAR_Y - 0.08; // 齒根
const STROKE = 8 * S; // 一輪:槓桿擺兩個來回

// 床台與棘齒桿(薄齒條,平躺在床台頂面上)
const GROUND = -1.19; // 底板頂面
const BED = { left: -3.0, right: 2.5, top: ROOT - 0.1, bottom: -0.75 };
const RACK_DEPTH = 0.3; // 齒條前後的厚度(z ±0.15)
const RACK_LEN = 4.3;
const TOOTH0 = 0.2; // 第一顆齒的齒根左端離桿左端的距離
const RACK_START = -2.9; // 起點時桿左端的位置(大約;取整數個齒距對齊齒的相位)
const EYE = [-0.04, (ROOT + BED.top) / 2]; // 桿左端繫繩的環(桿的局部座標)

// 滑輪、繩與重物(推斷)
const ROPE_R = 0.03;
const PULLEY_R = 0.28;
const PULLEY = { center: [-3.4, EYE[1] - PULLEY_R - ROPE_R, 0], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 }; // 繩從右邊搭上頂部、從左側垂下
const DROP_X = PULLEY.center[0] - PULLEY.radius; // 垂下那段繩的 x
const WEIGHT = { radius: 0.18, height: 0.45 };
const WEIGHT_EYE = -2.3; // 起點時吊環的高度(走完一輪升 1.32,吊環仍在滑輪下方)
const GROUND_LEFT = -3.5; // 底板左端:滑輪伸出這個邊,繩與重物從邊上垂下

// 前後的層次:棘齒桿在 z = ±0.15;下爪貼在桿的前面,槓桿在下爪前面,上爪在最前面;兩支爪的鉤往後伸到齒那一層
const LAYER = { down: 0.235, lever: 0.33, up: 0.45 };
const PAWL = { up: 3.3, down: 1.9 }; // 兩根棘爪的長度(接點到鉤)

const attach = (which, psi) => (which === "up" ? [P[0] - UP * Math.sin(psi), P[1] + UP * Math.cos(psi)] : [P[0] + DOWN * Math.sin(psi), P[1] - DOWN * Math.cos(psi)]);
export const lever = (v) => swing(v, S, -S);
export const SWING = S;

// 一顆齒(左端在 x0):左邊是往回勾的直面(齒尖往左伸出 UNDERCUT,棘爪斜著往上拉時鉤才不會沿面滑上去),斜背往右下降
const UNDERCUT = 0.12;
const tooth = (x0) => [[x0, ROOT], [x0 + PITCH * 0.85, ROOT], [x0 - UNDERCUT, BAR_Y + 0.1]];
// 「輪」的座標 x 時,齒在世界中的位置(齒根左端在 x 加整數個齒距;只取鉤附近的幾顆)
function teethAt(x) {
  const out = [];
  const first = Math.ceil((-1.5 - x) / PITCH);
  for (let i = first; i < first + 16; i++) out.push(tooth(x + i * PITCH));
  out.push([[-4, BED.top], [4, BED.top], [4, ROOT], [-4, ROOT]]); // 桿身
  return out;
}

// 棘爪(局部座標:原點在接點,桿身沿 −x):末端的鉤往下伸進齒間(接觸只看鉤)
// 鉤是窄的爪:右緣和齒的直面平行(以棘爪斜靠在齒上的常見角度 tilt 定),爪尖窄,伸得進齒間
const TILT = { up: deg(23), down: deg(6) };
const HOOK = (len, tilt) => {
  const end = rot2([-len, 0], tilt);
  // 右緣和齒的直面一樣往回勾(由上往下往右斜),爪尖伸進齒尖底下
  return [[0, 0.06], [UNDERCUT * (0.21 / 0.18), -0.15], [UNDERCUT * (0.21 / 0.18) - 0.04, -0.15], [-0.12, 0.06]].map(([x, y]) => rot2([end[0] + x, end[1] + y], -tilt));
};
const leverAt = (v) => swingPhase(v, S, -S);
const drive = pawlDrive({
  period: 4 * S,
  pins: (v) => {
    const psi = leverAt(v).at;
    return { up: attach("up", psi), down: attach("down", psi) };
  },
  // 棘齒桿的位置 x 當作「輪」的座標:被拉時往右(+x)
  wheel: { obstacles: (x) => teethAt(x), dir: 1, pitch: PITCH },
  pawls: {
    // ψ 減少時上方接點往右(上爪拉),ψ 增加時下方接點往右(下爪拉);鉤往下擺是逆時針(桿身朝左)
    up: { outline: HOOK(PAWL.up, TILT.up), into: 1, angle: TILT.up, limits: [deg(0), deg(40)], pushes: (v) => leverAt(v).forward },
    down: { outline: HOOK(PAWL.down, TILT.down), into: 1, angle: TILT.down, limits: [deg(-12), deg(30)], pushes: (v) => !leverAt(v).forward },
  },
});
const X0 = drive.at(0).wheel;
// 桿的位置 = 「輪」的座標 + OFF;OFF + TOOTH0 是整數個齒距,桿上的齒和 teethAt 的齒重合
const OFF = -TOOTH0 + PITCH * Math.round((RACK_START - X0 + TOOTH0) / PITCH);

// 一輪之內的主動量:0 到 STROKE 照實走,之後從頭再演(走到 STROKE 的那一刻仍是終點)
const local = (v) => {
  const m = v - STROKE * Math.floor(v / STROKE);
  return m < 1e-9 && v > 1e-9 ? STROKE : m;
};

/** 主動量 v(槓桿的累計擺動)→ 棘齒桿自起點的位移(往右為正)、兩根棘爪的轉角(不分輪,接觸算出的累計結果) */
export function motion(v) {
  const s = drive.at(v);
  return { x: s.wheel - X0, up: s.angles.up, down: s.angles.down };
}
export const pitch = PITCH;
export { STROKE };
export const geometry = {
  RACK: { length: RACK_LEN, depth: RACK_DEPTH, bottom: BED.top, firstTooth: TOOTH0, eye: EYE },
  BED,
  PULLEY: { center: PULLEY.center, radius: PULLEY.radius, rim: PULLEY_R },
};
/** 檢查用:主動量 v 時兩個鉤與齒(世界座標 2D;v 取一輪之內) */
export const contactAt = (v) => {
  const s = drive.shapes(local(v));
  return { hooks: [s.pawls.up, s.pawls.down], teeth: s.wheel.slice(0, -1) };
};

const TEETH = Math.floor((RACK_LEN - TOOTH0 - PITCH * 0.85) / PITCH) + 1;
const rack = shape([
  [0, BED.top],
  [RACK_LEN, BED.top],
  [RACK_LEN, ROOT],
  ...[...Array(TEETH).keys()].reverse().flatMap((i) => {
    const [a, b, c] = tooth(TOOTH0 + i * PITCH);
    return [b, c, a];
  }),
  [0, ROOT],
]);

const pawlShape = (len) => shape([...thickLine([[0, 0], [-len + 0.02, 0]], 0.09)], [circle(0.035).reverse()]);
// 鉤從齒那一層(z −0.15)往前伸到爪身(爪身在 z0 ± t/2),和爪身是一件
const hookPiece = (len, tilt, z0, t) => {
  const back = -RACK_DEPTH / 2;
  const front = z0 + t / 2 - 0.02;
  return { kind: "plate", shape: shape(HOOK(len, tilt)), thickness: front - back, at: [0, 0, (back + front) / 2 - z0] };
};
const block = (x) => ({ kind: "box", size: [0.8, BED.bottom - GROUND, 0.5], at: [x, (BED.bottom + GROUND) / 2, 0] });
const STAND = { x: PULLEY.center[0], z: -0.17, w: 0.1 };

export default {
  figure: 271,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.3 - GROUND_LEFT, 0.12, 0.8], at: [(3.3 + GROUND_LEFT) / 2, GROUND - 0.06, 0] },
        // 床台:兩個方塊墊在底板上,右端靠著槓桿的立柱
        block(-2.0),
        block(1.3),
        { kind: "box", size: [BED.right - BED.left, BED.top - BED.bottom, 0.6], at: [(BED.left + BED.right) / 2, (BED.top + BED.bottom) / 2, 0] },
        { kind: "box", size: [0.3, 1.9, 0.3], at: [P[0] + 0.1, -0.3, -0.36] }, // 槓桿的立柱在棘齒桿的後面
        // 托滑輪的支架(推斷):立在底板左端,頂上伸出滑輪的軸
        { kind: "box", size: [STAND.w, PULLEY.center[1] + 0.06 - GROUND, STAND.w], at: [STAND.x, (PULLEY.center[1] + 0.06 + GROUND) / 2, STAND.z] },
        { kind: "cylinder", radius: 0.04, length: 0.08 - (STAND.z - STAND.w / 2), at: [PULLEY.center[0], PULLEY.center[1], (0.08 + STAND.z - STAND.w / 2) / 2] },
      ],
    },
    {
      id: "bar",
      kind: "plate",
      shape: rack,
      thickness: RACK_DEPTH,
      arrow: false,
      pieces: [
        { kind: "box", size: [RACK_LEN, 0.04, RACK_DEPTH], at: [RACK_LEN / 2, BED.top + 0.02, 0] }, // 桿底另貼一片薄板(碰撞形狀:擠出板的三角化在長邊上是細長的三角形,底面量不到)
        { kind: "cylinder", radius: 0.05, inner: 0.03, length: 0.1, at: [EYE[0], EYE[1], 0] }, // 繫繩的環(推斷;底緣貼著床台頂面)
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1 },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: [0, 1, 0], radius: WEIGHT.radius, height: WEIGHT.height },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, -DOWN - 0.1], [0, UP + 0.1], [0.75, UP + 0.55]], 0.16), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, LAYER.lever] },
        { kind: "cylinder", radius: 0.1, length: 0.7 },
        // 掛棘爪的銷(不伸到棘齒桿那一層:下爪的接點和齒差不多高)
        { kind: "cylinder", radius: 0.035, length: 0.16, at: [0, UP, LAYER.up - 0.03] },
        { kind: "cylinder", radius: 0.035, length: 0.13, at: [0, -DOWN, LAYER.down + 0.03] },
      ],
    },
    // 兩支爪夾在槓桿的前後兩面;爪身在齒的前面,鉤往後伸到齒那一層(上爪的鉤在最左端,這段深度沒有下爪與槓桿)
    { id: "pawlUp", kind: "plate", shape: pawlShape(PAWL.up), thickness: 0.08, arrow: false, pieces: [hookPiece(PAWL.up, TILT.up, LAYER.up, 0.08)] },
    { id: "pawlDown", kind: "plate", shape: pawlShape(PAWL.down), thickness: 0.06, arrow: false, pieces: [hookPiece(PAWL.down, TILT.down, LAYER.down, 0.06)] },
  ],
  // 動力重演:只推槓桿;兩根棘爪掛在槓桿的銷上靠自重搭在齒上;棘齒桿沿床台滑,繩吊的重物一直把它往左拉
  // (以彈簧代替;重物、繩、滑輪照模型的姿勢走),桿只有被棘爪鉤住拉時往右走,兩支爪輪流拉、也輪流擋住它不倒退
  replay: {
    to: STROKE,
    seconds: 16,
    free: {
      bar: { slide: [1, 0, 0], spring: -1, gravity: false },
      pawlUp: { on: "lever" },
      pawlDown: { on: "lever" },
    },
    expect: [
      { at: 2 * S, part: "bar", label: "槓桿往一邊擺:上爪把桿往右拉", quote: "當使裝有兩根棘爪的槓桿擺動時,會將近乎連續的直線運動賦予棘齒桿" },
      { at: 4 * S, part: "bar", label: "擺回來:下爪接著拉" },
      { at: 8 * S, part: "bar", label: "兩個來回後的位置" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [S, -S] },
  target: "bar",
  view: { direction: [0.05, 0.12, 1] },
  pose(v) {
    const psi = lever(v);
    const u = local(v);
    const s = drive.at(u);
    const x = s.wheel - X0;
    const left = s.wheel + OFF;
    const eye = [left + EYE[0], EYE[1], 0];
    const hang = [DROP_X, WEIGHT_EYE + x, 0];
    const rope = routeRope([{ point: eye }, { circle: PULLEY }, { point: hang }]);
    return {
      parts: {
        lever: { angle: psi },
        bar: { position: [left, 0, 0] },
        pulley: { angle: -x / PULLEY_R },
        weight: { position: [hang[0], hang[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, 0] },
        pawlUp: { position: [...attach("up", psi), LAYER.up], angle: s.angles.up },
        pawlDown: { position: [...attach("down", psi), LAYER.down], angle: s.angles.down },
      },
      paths: { rope: { points: rope.points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
