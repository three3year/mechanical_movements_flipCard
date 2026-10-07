// 第 271 種:裝有兩根棘爪的槓桿振動時,給棘齒桿近乎連續的直線運動。槓桿在右端繞樞軸擺動,
// 兩根棘爪分別接在樞軸上方與下方,往左伸到棘齒桿的齒上:槓桿往一邊擺時上方那根把桿往右拉,
// 擺回來時換下方那根拉,所以桿一直往右走。左端的滾輪托著棘齒桿,被它帶著轉。
// 主動件是槓桿(累計行程,見 kit.swing)。
//
// 接觸(由接觸算,共用 pawl-drive.js;棘齒桿的位置當作「輪」的座標):兩根棘爪鉸在槓桿的銷上,末端的鉤往下,
// 靠自重落在齒間。齒的直面朝左,鉤從左邊鉤住直面往右拉;退回時鉤沿前一齒的斜背滑上去、越過齒尖落進下一格。
// 拉多遠、何時越過、落多深,都由鉤與齒相碰算出。
// 推斷:左端的圓輪當作托住棘齒桿的滾輪;棘爪靠自重落在齒上;齒的直面朝左且往回勾(棘爪往右上拉才鉤得住,原圖看不出齒形);
// 桿很長,畫面只看到中段(每走過整數個齒的一大段就接回起點;桿畫得夠長、起點夠靠左,接回前後兩端都在畫面外,
// 看不出跳動——掃描工具仍會把接回那一格列為「移 8.8」,那不是零件在動)。
import { deg, rot2, swing, swingPhase } from "./kit.js";
import { pawlDrive } from "./pawl-drive.js";
import { shape, thickLine, circle } from "./shapes.js";

const P = [2.55, 0.45, 0]; // 槓桿樞軸
const UP = 0.75; // 上方棘爪接點到樞軸
const DOWN = 0.55; // 下方棘爪接點到樞軸
const S = deg(20); // 擺幅(單邊):兩根棘爪每一程都走過一個多齒距,每一程都拉得到
const BAR_Y = -0.15; // 棘齒桿齒面高度
const PITCH = 0.22;
const WRAP = 40 * PITCH; // 走過這麼長就接回起點
// 桿的齒數、左端(局部)與位置範圍(offset 到 offset + WRAP):桿長 22,畫面(x 約 −3.2 到 3.3)永遠在桿的中段;
// offset 取整數個齒距
const BAR = { teeth: 100, left: -10, offset: -1.0 - 18 * PITCH };
const ROLL = 0.32;
// 前後的層次:棘齒桿在 z = ±0.2;下爪貼在桿的前面,槓桿在下爪前面,上爪在最前面;兩支爪只有鉤伸到齒那一層
const Z = { down: 0.235, lever: 0.33, up: 0.45 };
const PAWL = { up: 3.3, down: 1.9 }; // 兩根棘爪的長度(接點到鉤)

const attach = (which, psi) => (which === "up" ? [P[0] - UP * Math.sin(psi), P[1] + UP * Math.cos(psi)] : [P[0] + DOWN * Math.sin(psi), P[1] - DOWN * Math.cos(psi)]);
export const lever = (v) => swing(v, S, -S);
export const SWING = S;

// 一顆齒(桿的局部座標,齒根的左端在 x0):左邊是往回勾的直面(齒尖往左伸出 UNDERCUT,棘爪斜著往上拉時鉤才不會沿面滑上去),
// 斜背往右下降
const UNDERCUT = 0.12;
const tooth = (x0) => [[x0, BAR_Y - 0.08], [x0 + PITCH * 0.85, BAR_Y - 0.08], [x0 - UNDERCUT, BAR_Y + 0.1]];
// 桿移到 x 時,齒在世界中的位置(只取鉤附近的幾顆)
function teethAt(x) {
  const out = [];
  const shift = x + BAR.offset;
  const first = Math.ceil((-0.5 - BAR.left - shift) / PITCH) - 14;
  for (let i = first; i < first + 22; i++) out.push(tooth(BAR.left + i * PITCH + shift));
  out.push([[-3, BAR_Y - 0.4], [3, BAR_Y - 0.4], [3, BAR_Y - 0.08], [-3, BAR_Y - 0.08]]); // 桿身
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

/** 主動量 v(槓桿的累計擺動)→ 槓桿角、棘齒桿的累計位移(往右為正)、兩根棘爪的轉角 */
export function motion(v) {
  const s = drive.at(v);
  return { x: s.wheel - X0, up: s.angles.up, down: s.angles.down };
}
export const pitch = PITCH;
/** 檢查用:主動量 v 時兩個鉤與齒(世界座標 2D) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { hooks: [s.pawls.up, s.pawls.down], teeth: s.wheel.slice(0, -1) };
};

const bar = shape([[BAR.left, BAR_Y - 0.4], [BAR.left + BAR.teeth * PITCH, BAR_Y - 0.4], ...[...Array(BAR.teeth).keys()].reverse().flatMap((i) => {
  const [a, b, c] = tooth(BAR.left + i * PITCH);
  return [b, c, a];
})]);

const pawlShape = (len) => shape([...thickLine([[0, 0], [-len + 0.02, 0]], 0.09)], [circle(0.035).reverse()]);

export default {
  figure: 271,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.12, 0.8], at: [0.3, -1.25, 0] },
        { kind: "box", size: [0.9, 0.7, 0.6], at: [-1.3, -0.91, 0] },
        { kind: "box", size: [0.9, 0.7, 0.6], at: [1.3, -0.91, 0] },
        { kind: "box", size: [0.3, 1.9, 0.3], at: [P[0] + 0.1, -0.3, -0.36] }, // 槓桿的立柱在長桿的後面
        { kind: "box", size: [0.2, 0.75, 0.2], at: [-2.9, BAR_Y - 0.4 - ROLL - 0.45, -0.3] }, // 滾輪的軸座
      ],
    },
    { id: "bar", kind: "plate", shape: bar, thickness: 0.4, arrow: false, pieces: [{ kind: "box", size: [BAR.teeth * PITCH, 0.04, 0.4], at: [BAR.left + (BAR.teeth * PITCH) / 2, BAR_Y - 0.38, 0] }] }, // 桿底另貼一片薄板(碰撞形狀:擠出板的三角化在長邊上是細長的三角形,底面量不到)
    { id: "roller", kind: "cylinder", center: [-2.9, BAR_Y - 0.4 - ROLL, 0], radius: ROLL, length: 0.3, mark: true, spin: ROLL, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.7, at: [0, 0, -0.1] }] }, // 托著棘齒桿的滾輪(實心圓柱:桿底整面擱在上面)
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, -DOWN - 0.1], [0, UP + 0.1], [0.75, UP + 0.55]], 0.16), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, Z.lever] },
        { kind: "cylinder", radius: 0.1, length: 0.7 },
        // 掛棘爪的銷(不伸到棘齒桿那一層:下爪的接點和齒差不多高)
        { kind: "cylinder", radius: 0.035, length: 0.16, at: [0, UP, Z.up - 0.03] },
        { kind: "cylinder", radius: 0.035, length: 0.13, at: [0, -DOWN, Z.down + 0.03] },
      ],
    },
    // 兩支爪夾在槓桿的前後兩面;桿身在齒的前面,只有鉤伸到齒那一層
    { id: "pawlUp", kind: "plate", shape: pawlShape(PAWL.up), thickness: 0.08, arrow: false, pieces: [{ kind: "plate", shape: shape(HOOK(PAWL.up, TILT.up)), thickness: 0.42, at: [0, 0, -Z.up] }] },
    { id: "pawlDown", kind: "plate", shape: pawlShape(PAWL.down), thickness: 0.06, arrow: false, pieces: [{ kind: "plate", shape: shape(HOOK(PAWL.down, TILT.down)), thickness: 0.42, at: [0, 0, -Z.down] }] },
  ],
  // 動力重演:只推槓桿;兩根棘爪掛在槓桿的銷上靠自重搭在齒上,棘齒桿在托座上靠摩擦定位,由棘爪拉動
  replay: {
    to: 8 * S,
    seconds: 16,
    free: {
      bar: { slide: [1, 0, 0], hold: true, gravity: false },
      pawlUp: { on: "lever" },
      pawlDown: { on: "lever" },
    },
    expect: [
      { at: 2 * S, part: "bar", label: "槓桿往一邊擺:上爪把桿往右拉", quote: "當使裝有兩根棘爪的槓桿振動時,會將近乎連續的直線運動賦予棘齒桿" },
      { at: 4 * S, part: "bar", label: "擺回來:下爪接著拉" },
      { at: 8 * S, part: "bar", label: "兩個來回後的位置" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [S, -S] },
  target: "bar",
  view: { direction: [0.05, 0.12, 1], fit: ["base", "lever", "roller"] },
  pose(v) {
    const psi = lever(v);
    const { x, up, down } = motion(v);
    const shown = ((x % WRAP) + WRAP) % WRAP;
    return {
      parts: {
        lever: { angle: psi },
        bar: { position: [shown + BAR.offset + X0, 0, 0] },
        roller: { angle: -x / ROLL },
        pawlUp: { position: [...attach("up", psi), Z.up], angle: up },
        pawlDown: { position: [...attach("down", psi), Z.down], angle: down },
      },
      readouts: [],
    };
  },
};
