// 第 368 種:在圓筒上畫螺旋線。正齒輪帶動傘齒輪、藉此讓圓筒旋轉,它同時也與齒條嚙合,使標記點從圓筒的一端橫移至另一端。
// 照原圖:板上一根水平軸(由兩個軸承座撐著),軸上依序是垂直傘齒輪、正齒輪與曲柄;垂直傘齒輪咬著立在板上軸承座的
// 水平傘齒輪,水平傘齒輪的直立軸往下穿過板,吊著板下的圓筒(下端進底座的軸承)。齒條在正齒輪後面直立,穿過板上的
// 導槽往下伸,下段橫穿一根尖桿(標記點),尖端抵在圓筒的筒面上。轉曲柄:圓筒轉、齒條帶尖端等速上升,在筒面畫出螺旋線。
// 主動件是水平軸(正齒輪,以曲柄轉動);目標件是圓筒。螺旋線由 pose 回傳(畫到目前為止的部分),隨圓筒一起轉。
// 推斷:兩個傘齒輪 1 : 1;板的立柱、底座與它的軸承、板上的導套、板下齒條背後的直立導槽、尖桿的夾座(原圖右邊那一塊)。
// 板下的導槽只包住齒條身的背面與兩側的後緣:尖桿在前面橫穿齒條、走過整個筒高,導槽的側壁停在尖桿後面。
// 偏離插圖:螺距照原圖筒面的螺旋線斜度(每圈約筒徑的 0.7 倍,維護者 2026-10-14 決定 (b)),所以正齒輪的節圓半徑
// 只有 0.2(原圖約 0.55);照原圖的齒輪大小,圓筒每轉一圈尖端要升約 3.5,筒高內畫不出螺旋線。
import { X, Y, Z, TAU, deg, add, sub, clamp, rotateAbout, quatFromBasis } from "./kit.js";
import { bevelGear, bevelContact, meshAngle, rackOffset, circularPitch } from "./gears.js";
import { pedestalX } from "./supports.js";
import { rect, shape, circle } from "./shapes.js";

const CYL = { center: [-0.4, -1.3, 0], r: 0.9, h: 2.4 };
const BOARD = { top: 0.3, bottom: 0.05, x: [-1.75, 3.05], z: [-0.8, 0.6] };
const FLOOR = -2.75; // 底座頂面
const SHAFT_Y = 1.4; // 水平軸的高度(原圖約在板上方 1 個筒半徑多一點)
const APEX = [CYL.center[0], SHAFT_Y, 0]; // 兩個傘齒輪的節錐頂:水平軸與圓筒軸的交點
const BEVEL = { teeth: 20, radius: 0.7, cone: deg(45), width: 0.2 };
const VERT = bevelGear({ apex: APEX, axis: [-1, 0, 0], ...BEVEL }); // 水平軸上的垂直傘齒輪,齒朝左
const HORIZ = bevelGear({ apex: APEX, axis: Y, ...BEVEL }); // 直立軸上的水平傘齒輪,齒朝上
const CONTACT = bevelContact(VERT, HORIZ);
const SPUR_X = 1.6;
const PINION = { center: [SPUR_X, SHAFT_Y, 0], axis: VERT.axis, teeth: 12, radius: 0.2 };
const SPUR_W = 0.3;
const SHAFT_R = 0.07;
// 齒條在正齒輪後面:節線在 z = −節圓半徑,齒朝前(+z)
const RACK = { origin: [SPUR_X, SHAFT_Y, -PINION.radius], dir: Y, pitch: circularPitch(PINION) };
const RACK_TEETH = 25;
const RACK_MID = -10 * RACK.pitch; // 齒段中心在齒條局部 y(整數個齒距,齒 0 對在原點)
const RACK_BACK = 0.1; // 齒根後面的厚度
const M = RACK.pitch / Math.PI;
const RACK_Z = [-PINION.radius - 1.2 * M - RACK_BACK, -PINION.radius + M]; // 齒條截面的 z 範圍(背面到齒頂)
const ROD_Z = (RACK_Z[0] + RACK_Z[1]) / 2; // 尖桿穿過齒條身的中間
const GAP = 0.005; // 尖端離筒面
const TIP_X = CYL.center[0] + Math.sqrt((CYL.r + GAP) ** 2 - ROD_Z ** 2);
const MARK0 = CYL.center[1] - CYL.h / 2 + 0.15; // 尖桿在齒條上的高度基準(齒條照齒的相位再上移半個齒距,尖端實際從離筒底約 0.2 起)
const ROD_LOCAL = MARK0 - SHAFT_Y; // 尖桿在齒條局部的高度
const TRAVEL = CYL.h - 0.4; // 尖端的行程:走到離筒頂約 0.2(筒頂的轉向箭頭在它上方)
// 主動量 a:水平軸繞 VERT.axis(−X)的轉角;a 往負的方向轉時正齒輪後緣往上,齒條帶尖端上升
const RANGE = [-TRAVEL / PINION.radius, 0];

/** 主動量 a → 齒條的位移(沿 +Y;照正齒輪咬合的速度:轉一圈移節圓周長) */
const rackRise = (a) => rackOffset(PINION, RACK, clamp(a, ...RANGE));
/** 主動量 a → 圓筒(與水平傘齒輪)的轉角 */
const cylinderAngle = (a) => meshAngle(VERT, HORIZ, clamp(a, ...RANGE), CONTACT);
/** 主動量 a → 尖端的世界位置 */
const tip = (a) => [TIP_X, SHAFT_Y + rackRise(a) + ROD_LOCAL, ROD_Z];

const bevel = (g, at) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, bore: SHAFT_R, at });
// 板件的局部 y 對到世界的 −z(axis: Y)
const boardRect = (x0, x1, z0, z1) => rect(x1 - x0, z1 - z0, (x0 + x1) / 2, -(z0 + z1) / 2);
const SLOT = { x: [SPUR_X - SPUR_W / 2 - 0.01, SPUR_X + SPUR_W / 2 + 0.01], z: [RACK_Z[0] - 0.01, RACK_Z[1] + 0.01] };
const SLEEVE = { top: BOARD.top + 0.3, wall: 0.08 };
const sleeveWall = (x0, x1, z0, z1) => ({ kind: "box", size: [x1 - x0, SLEEVE.top - BOARD.top, z1 - z0], at: [(x0 + x1) / 2, (BOARD.top + SLEEVE.top) / 2, (z0 + z1) / 2] });
// 板下齒條背後的直立導槽(下端的導座):背板加兩道側壁,側壁的前緣停在尖桿後面 0.02
const LIP_Z = ROD_Z - 0.035 - 0.02;
const rail = (x0, x1, z0, z1) => ({ kind: "box", size: [x1 - x0, BOARD.bottom - FLOOR, z1 - z0], at: [(x0 + x1) / 2, (BOARD.bottom + FLOOR) / 2, (z0 + z1) / 2] });
const POST = (x) => ({ kind: "box", size: [0.15, BOARD.bottom - FLOOR, 0.15], at: [x, (BOARD.bottom + FLOOR) / 2, BOARD.z[0] + 0.15] });
const CYL_SHAFT = { y0: FLOOR + 0.05, y1: HORIZ.center[1] + BEVEL.width / 2, r: 0.08 }; // 直立軸:底座的軸承到傘齒輪頂
const toLocalX = (x) => VERT.center[0] - x; // 世界 x → 主動件的局部 z(主動件的軸是 −X)
const CRANK_X = 2.6;

export default {
  figure: 368,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 板(原圖的水平板,兩端切在圖外):開一道讓齒條穿過的槽,和直立軸穿過的孔
        { kind: "plate", axis: Y, thickness: BOARD.top - BOARD.bottom, at: [0, (BOARD.top + BOARD.bottom) / 2, 0], shape: shape(boardRect(BOARD.x[0], BOARD.x[1], BOARD.z[0], BOARD.z[1]), [boardRect(SLOT.x[0], SLOT.x[1], SLOT.z[0], SLOT.z[1]).reverse(), circle(CYL_SHAFT.r, CYL.center[0], -CYL.center[2]).reverse()]) },
        // 槽上的導套(推斷):圍住齒條四面
        sleeveWall(SLOT.x[0] - SLEEVE.wall, SLOT.x[0], SLOT.z[0] - SLEEVE.wall, SLOT.z[1] + SLEEVE.wall),
        sleeveWall(SLOT.x[1], SLOT.x[1] + SLEEVE.wall, SLOT.z[0] - SLEEVE.wall, SLOT.z[1] + SLEEVE.wall),
        sleeveWall(SLOT.x[0], SLOT.x[1], SLOT.z[0] - SLEEVE.wall, SLOT.z[0]),
        sleeveWall(SLOT.x[0], SLOT.x[1], SLOT.z[1], SLOT.z[1] + SLEEVE.wall),
        // 水平軸的兩個軸承座(原圖),立在板上
        ...pedestalX({ x: 0.95, y: SHAFT_Y, z: 0, bore: SHAFT_R, floor: BOARD.top + 0.18 }),
        ...pedestalX({ x: 2.2, y: SHAFT_Y, z: 0, bore: SHAFT_R, floor: BOARD.top + 0.18 }),
        // 水平傘齒輪底下的軸承座(原圖),直立軸穿過它的孔與板
        { kind: "plate", axis: Y, thickness: 0.2, at: [CYL.center[0], BOARD.top + 0.1, CYL.center[2]], shape: shape(rect(0.6, 0.6), [circle(CYL_SHAFT.r).reverse()]) },
        // 板下齒條背後的直立導槽、板的立柱與底座(推斷;原圖只畫到板與圓筒),底座上撐直立軸下端的軸承
        rail(SLOT.x[0] - SLEEVE.wall, SLOT.x[1] + SLEEVE.wall, SLOT.z[0] - SLEEVE.wall, SLOT.z[0]),
        rail(SLOT.x[0] - SLEEVE.wall, SLOT.x[0], SLOT.z[0], LIP_Z),
        rail(SLOT.x[1], SLOT.x[1] + SLEEVE.wall, SLOT.z[0], LIP_Z),
        POST(BOARD.x[0] + 0.15),
        POST(BOARD.x[1] - 0.15),
        { kind: "box", size: [BOARD.x[1] - BOARD.x[0], 0.2, BOARD.z[1] - BOARD.z[0]], at: [(BOARD.x[0] + BOARD.x[1]) / 2, FLOOR - 0.1, (BOARD.z[0] + BOARD.z[1]) / 2] },
        // 底座上的軸承:直立軸的下端插在它的孔裡
        { kind: "plate", axis: Y, thickness: 0.15, at: [CYL.center[0], FLOOR + 0.075, CYL.center[2]], shape: shape(rect(0.4, 0.4), [circle(CYL_SHAFT.r).reverse()]) },
      ],
    },
    // 圓筒:吊在水平傘齒輪的直立軸上(和傘齒輪一起轉)
    {
      id: "cylinder",
      kind: "group",
      axis: Y,
      center: CYL.center,
      spin: CYL.r + 0.05,
      spinOffset: CYL.h / 2 - 0.08,
      pieces: [
        { kind: "cylinder", radius: CYL.r, length: CYL.h },
        { kind: "cylinder", radius: CYL_SHAFT.r, length: CYL_SHAFT.y1 - CYL_SHAFT.y0, at: [0, 0, (CYL_SHAFT.y0 + CYL_SHAFT.y1) / 2 - CYL.center[1]], mark: true },
        bevel(HORIZ, [0, 0, HORIZ.center[1] - CYL.center[1]]),
      ],
    },
    // 水平軸:垂直傘齒輪、正齒輪、曲柄(主動件;局部 z 朝 −X)
    {
      id: "spur",
      kind: "group",
      center: VERT.center,
      axis: VERT.axis,
      spin: 0.32,
      spinOffset: toLocalX(SPUR_X),
      pieces: [
        bevel(VERT, [0, 0, 0]),
        { kind: "cylinder", radius: SHAFT_R, length: CRANK_X + 0.05 - VERT.center[0], at: [0, 0, toLocalX((CRANK_X + 0.05 + VERT.center[0]) / 2)] },
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: SPUR_W, bore: SHAFT_R, at: [0, 0, toLocalX(SPUR_X)] },
        // 曲柄:臂往下,手柄朝右(原圖)
        { kind: "box", size: [0.1, 0.5, 0.08], at: [0, -0.2, toLocalX(CRANK_X)] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0, -0.4, toLocalX(CRANK_X + 0.04 + 0.15)], accent: true },
      ],
    },
    // 直立的齒條:上段的齒咬正齒輪,下段橫穿尖桿(原圖的虛線),尖端抵在筒面
    {
      id: "rack",
      kind: "group",
      arrow: false,
      pieces: [
        // 局部 x(齒條長度)→ 世界 +Y,局部 y(齒)→ +Z,局部 z(齒寬)→ +X
        { kind: "rack", teeth: RACK_TEETH, pitch: RACK.pitch, width: SPUR_W, depth: RACK_BACK, at: [0, RACK_MID, 0], rotation: quatFromBasis(Y, Z, X) },
        // 齒段以下的齒條身(截面到齒頂線,和齒段一樣在槽裡受導引)
        (() => {
          const y0 = ROD_LOCAL - 0.15;
          const y1 = RACK_MID - (RACK_TEETH / 2) * RACK.pitch;
          return { kind: "box", size: [SPUR_W, y1 - y0, RACK_Z[1] - RACK_Z[0]], at: [0, (y0 + y1) / 2, ROD_Z - RACK.origin[2]] };
        })(),
        // 尖桿:從尖端穿過齒條,右邊一塊夾座(推斷,原圖右邊的那一塊)
        { kind: "lathe", axis: X, profile: [[0, 0], [0.035, 0.18], [0.035, 0.2], [0, 0.2]], at: [TIP_X - SPUR_X, ROD_LOCAL, ROD_Z - RACK.origin[2]] },
        { kind: "cylinder", axis: X, radius: 0.035, length: SPUR_X + 0.45 - (TIP_X + 0.2), at: [(SPUR_X + 0.45 + TIP_X + 0.2) / 2 - SPUR_X, ROD_LOCAL, ROD_Z - RACK.origin[2]] },
        { kind: "box", size: [0.12, 0.2, 0.12], at: [SPUR_W / 2 + 0.06, ROD_LOCAL, ROD_Z + 0.015 - RACK.origin[2]] }, // 前緣多一點,後緣停在導槽側壁前 0.01
      ],
    },
    { id: "helix", kind: "trace" },
  ],
  driver: { part: "spur", type: "rotation", range: RANGE, initial: 0, speed: -1.2 },
  target: "cylinder", // 被畫上螺旋線的圓筒
  view: { direction: [0.5, 0.25, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const turn = cylinderAngle(a);
    // 已畫的螺旋線:在主動量 a′ 時畫在尖端的點,現在隨圓筒又轉了 turn − turn(a′)
    const n = Math.max(2, Math.round((Math.abs(a) / TAU) * 48));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const ai = (a * i) / n;
      return add(CYL.center, rotateAbout(sub(tip(ai), CYL.center), Y, turn - cylinderAngle(ai)));
    });
    return {
      parts: {
        spur: { angle: a },
        cylinder: { angle: turn },
        rack: { position: add(RACK.origin, [0, rackRise(a), 0]) },
      },
      paths: { helix: { points, closed: false } },
      readouts: [],
    };
  },
};
