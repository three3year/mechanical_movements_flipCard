// 第 161 種:蒸汽引擎的離心式調速器。中央心軸連同臂與球,由引擎經頂部的傘齒輪帶動;心軸轉動時球因離心力往外飛。
// 引擎越快,球飛得越開,把底部的滑塊抬高,減少調節閥(接在滑塊上的槓桿)的開度;變慢時相反。原圖的虛線是球飛開時的位置。
// 主動件是虛擬的「進程」(持續運轉,做法同第 162、163、287 種):引擎的轉速隨負載起伏(推斷),一輪 12 圈之內
// 轉速由最慢升到最快再降回,轉速的平方隨進程直線升降,所以張角與滑塊等速升降、滑桿每一段都看得出變化。
// 張角對轉速見 governor.js((轉速 / 上限)² 在張角範圍之間)。
// 頂部正對著讀者的傘齒輪是引擎帶動的那一個(軸朝前伸);它和心軸頂端的傘齒輪咬合,心軸照轉速的積分轉。
// 球、臂與連桿畫在同一個平面上,不跟著心軸繞(同第 162、287 種),張開的幅度從正面看得清楚。
// 調節閥(原文「減少調節閥的開度,該調節閥即與該滑塊相連」;閥的構造原圖沒畫,做法同第 274、287 種的 throttle.js):
// 滑塊下端車出一道環槽,叉形槓桿的叉臂跨在滑塊兩側、銷伸進環槽;槓桿中段的銷接閥桿,閥桿下端的銷接蒸汽管上節流閥
// 閥軸的曲柄。轉得太快時滑塊升高,把閥桿往上拉、關小節流閥;變慢時相反。
// 推斷:轉速起伏的幅度;節流閥、閥桿、蒸汽管、槓桿的立柱與底座;環槽與叉臂的銷;底部支架臂端套住心軸的軸承
// (原圖支架的臂伸到心軸,下面是心軸的端頭)。
import { Y, Z, TAU, deg } from "./kit.js";
import { flyBall } from "./governor.js";
import { meshAngle, bevelGear, bevelContact } from "./gears.js";
import { throttle } from "./throttle.js";

const GOV = flyBall({ top: 2.4, arm: 2.3, at: 1.15, link: 1.6, ball: 0.45, range: [deg(24), deg(50)] });
export const RANGE = [0, 10]; // 轉速(governor.js 的上限)
export const PERIOD = 12; // 轉速起伏一輪,心軸平均轉的圈數
export const SLOWEST = 3; // 一輪之內最慢的轉速(最快是上限)
const ROD_AT = 0.85; // 閥桿接在槓桿上離樞軸多遠
const CRANK = 0.16; // 閥軸上曲柄的半徑

/** 轉速 s:張角與滑塊的高度 */
export function governor(s) {
  const alpha = GOV.angleAt(s);
  return { alpha, sleeve: GOV.geometry(alpha).sleeve };
}
const SLEEVE = { radius: 0.22, length: 0.22 }; // 滑塊(同 governor.js 的套筒)
const GROOVE = { top: -SLEEVE.length / 2, height: 0.1, neck: 0.12, outer: SLEEVE.radius }; // 滑塊下端的環槽
const WORKING = [governor(SLOWEST).sleeve, governor(RANGE[1]).sleeve]; // 一輪之內滑塊的行程
const FLOOR = -1.75;
// 節流閥:樞軸在左邊的立柱上,最慢時槓桿水平(球在最低處時也碰不到槓桿);一輪之內最慢時全開、最快時幾乎關上
const VALVE = throttle({
  pivot: [-2.0, WORKING[0] + GROOVE.top - GROOVE.height / 2],
  rodAt: ROD_AT,
  crank: CRANK,
  groove: GROOVE,
  range: WORKING,
  floor: FLOOR,
});
const BRACKET_Y = -0.62; // 支架的橫臂:從槓桿的立柱伸到心軸,在槓桿與節流閥之間
/** 進程 p:節流閥的開度(1 全開、0 全關) */
export const opening = (p) => VALVE.solve(governor(speedAt(p)).sleeve).opening;
/** 閥桿的長度(兩端銷心的距離) */
export const valveRodLength = (p) => {
  const { from, to } = VALVE.pose(governor(speedAt(p)).sleeve).valveRod;
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
};

// 頂部的一對傘齒輪(齒數相同、軸相交成直角):心軸上的錐頂朝上,驅動軸上的錐頂朝後
const APEX = [0, 3.6, 0];
export const SPINDLE_GEAR = bevelGear({ apex: APEX, axis: Y, teeth: 20, radius: 0.55, cone: deg(45), width: 0.18 });
export const DRIVE_GEAR = bevelGear({ apex: APEX, axis: [0, 0, -1], teeth: 20, radius: 0.55, cone: deg(45), width: 0.18 });
const CONTACT = bevelContact(SPINDLE_GEAR, DRIVE_GEAR);

// 轉速的平方在一輪之內直線升降(三角波):進程 0 最慢、半輪最快
const A = SLOWEST ** 2;
const B = RANGE[1] ** 2 - A;
const tri = (p) => {
  const u = (((p / PERIOD) % 1) + 1) % 1;
  return u < 0.5 ? 2 * u : 2 - 2 * u;
};
/** 進程 p:當下的轉速 */
export const speedAt = (p) => Math.sqrt(A + B * tri(p));
// 轉速對進程的積分(解析解):前半輪 ∫ √(A + 2Bq/P) dq,後半輪和前半輪對稱
const rise = (x) => (PERIOD / (3 * B)) * ((A + (2 * B * x) / PERIOD) ** 1.5 - A ** 1.5);
const HALF = rise(PERIOD / 2);
export const NORMAL = (2 * HALF) / PERIOD; // 平均轉速:進程 1 是平均轉速下心軸轉一圈
/** 進程 p:心軸的轉角(繞 +Y,從上往下看逆時針為正) */
export function spindleAngle(p) {
  const k = Math.floor(p / PERIOD);
  const x = p - k * PERIOD;
  const within = x <= PERIOD / 2 ? rise(x) : 2 * HALF - rise(PERIOD - x);
  return (TAU * (k * 2 * HALF + within)) / NORMAL;
}
/** 進程 p:驅動軸的轉角(繞 +Z;驅動軸上的傘齒輪軸朝 −Z,咬合算出的是繞 −Z 的轉角,所以取負) */
export const driveAngle = (p) => -meshAngle(SPINDLE_GEAR, DRIVE_GEAR, spindleAngle(p), CONTACT);

export default {
  figure: 161,
  parts: [
    {
      // 心軸與頂端的傘齒輪、軸環、底部的端頭,一起轉(群組的局部 z 沿心軸)
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.12,
      spinOffset: 2.62,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.0, at: [0, 0, 0.9] },
        { kind: "gear", teeth: SPINDLE_GEAR.teeth, radius: SPINDLE_GEAR.radius, cone: SPINDLE_GEAR.cone, width: SPINDLE_GEAR.width, at: [0, 0, SPINDLE_GEAR.center[1]] },
        { kind: "cylinder", radius: 0.18, length: 0.2, at: [0, 0, 2.85] },
        { kind: "sphere", radius: 0.1, at: [0, 0, -1.15] },
      ],
    },
    ...GOV.parts().filter((part) => part.id !== "sleeve"),
    {
      // 滑塊:下端的環槽與凸緣,叉形槓桿的銷伸在環槽裡
      id: "sleeve",
      kind: "group",
      pieces: [{ kind: "cylinder", axis: Y, radius: SLEEVE.radius, inner: 0.07, length: SLEEVE.length }, ...VALVE.sleevePieces({ inner: 0.07 })],
    },
    // 引擎經這根朝前的軸與傘齒輪帶動心軸
    {
      id: "driveShaft",
      kind: "group",
      axis: Z,
      center: DRIVE_GEAR.center,
      spin: 0.07,
      spinOffset: 1.1,
      pieces: [
        { kind: "gear", teeth: DRIVE_GEAR.teeth, radius: DRIVE_GEAR.radius, cone: DRIVE_GEAR.cone, width: DRIVE_GEAR.width, axis: [0, 0, -1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 1.2, at: [0, 0, 0.6] },
      ],
    },
    {
      // 支架與底座:槓桿的立柱、蒸汽管與節流閥(throttle.js);支架的橫臂從立柱伸到心軸,臂端是套住心軸的軸承
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.0, 0.12, 0.3], at: [-1.1, BRACKET_Y, 0] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.08, length: 0.12, at: [0, BRACKET_Y, 0] },
        { kind: "box", size: [2.4, 0.15, 1.1], at: [-1.75, FLOOR - 0.075, -0.3] },
        ...VALVE.framePieces,
      ],
    },
    ...VALVE.parts,
  ],
  powered: ["driveShaft", "ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.04, 0.06, 1] },
  pose(p) {
    const s = speedAt(p);
    const { alpha, sleeve } = governor(s);
    return {
      parts: {
        ...GOV.pose(alpha),
        spindle: { angle: spindleAngle(p) },
        driveShaft: { angle: driveAngle(p) },
        ...VALVE.pose(sleeve),
      },
      readouts: [
        { label: "轉速", value: `${s.toFixed(1)}(${s > speedAt(p - 0.01) ? "漸快" : "漸慢"})` },
        { label: "節流閥開度", value: `${Math.round(VALVE.solve(sleeve).opening * 100)}%` },
      ],
    };
  },
};
