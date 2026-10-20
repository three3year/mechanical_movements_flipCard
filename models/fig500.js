// 第 500 種:壓力計(馬德堡壓力計)。流體壓力作用在圓形金屬碟片 A 上(碟片通常做成波紋狀),碟片在壓力下的變形把運動
// 傳給齒形扇形段 e,扇形段與指針心軸上的小齒輪嚙合,指針隨之轉動。原圖是正視圖與剖面圖。
// 主動件是虛擬的「壓力」。
// 照剖面圖重做(2026-10-20 維護者決定 (a)):
// - 碟片 A 與錶面平行、幾乎和錶殼一樣大,裝在錶殼後半;邊緣夾在前後兩半錶殼之間(兩半各有一圈內凸緣,碟片的邊緣夾在
//   兩圈凸緣之間)。流體從下方的接管進到碟片後面的腔室,把碟片中央往前(往錶面)推。
//   碟片中間會變形的部分以沿錶軸縮放表示(邊緣不動,另列一件 rim:縮放會讓邊緣變厚,所以邊緣不和中間同一件)。
//   推斷:碟片中心的位移與壓力成正比。
// - 碟片中心有一根往前的凸柱,凸柱前端的眼開一道長孔;扇形段 e 的尾端(尾鉤)有一根銷穿過這道孔(剖面圖:眼由 e 的尾鉤
//   勾住)。銷的粗細等於孔寬,凸柱前後動時孔壁推著銷,扇形段轉角由這個接觸解出(銷的中心和孔的中心同一個深度)。
// - e 的轉軸平行錶面、和指針心軸相交,e 與心軸上的小齒輪以傘齒相咬(推斷:剖面上小齒輪畫成傘齒形)。
//   e 是 48 齒的傘齒扇形、小齒輪 8 齒,扇形段轉 45° 指針轉 270°。
// - 扇形段套在一根平行錶面的樞銷上,樞銷插在左邊的支架上;心軸後端轉在右邊支架伸出的軸承裡,前端穿過錶面中央的圓板
//   (原圖正視圖中央的黑色圓,當前軸承)。支架從前半錶殼的內壁伸下來(推斷)。
// - 錶面:外圈是刻度環、中央是圓板,中間用上下兩條橋接起來,其餘留空,斜看看得到後面的機構與碟片;刻度照機構標定
//   (每單位壓力指針實際轉到的角度)。
// - 錶殼、碟片與它的邊緣剖掉朝左(扇形段那一側)的一塊(剖面圖的畫法,切面封上剖面形狀),斜看看得到碟片、凸柱與扇形段;錶面不剖。
import { X, Y, deg, clamp, partPoint } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { solve } from "./linkage.js";
import { stream } from "./flow.js";
import { ring, rect, stadium, shape, thickLine, disc } from "./shapes.js";

const MAX = 10;
const M = 0.024; // 模數
const TEETH = { pinion: 8, sector: 48 };
const [CONE_P, CONE_S] = pitchCones(TEETH.pinion, TEETH.sector);
const R_P = (TEETH.pinion * M) / 2;
const R_S = (TEETH.sector * M) / 2;
const HEEL_Z = -0.07; // 小齒輪大端(錶面後面)
const APEX = [0, 0, HEEL_Z - R_S]; // 兩個節錐的錐頂:心軸與扇形段樞軸的交點
export const PINION = bevelGear({ apex: APEX, axis: [0, 0, -1], teeth: TEETH.pinion, radius: R_P, cone: CONE_P, width: 0.05 });
export const SECTOR = bevelGear({ apex: APEX, axis: X, teeth: TEETH.sector, radius: R_S, cone: CONE_S, width: 0.03 });
const CONTACT = bevelContact(SECTOR, PINION);
const SWEEP = (TEETH.sector / TEETH.pinion) * deg(45); // 扇形段轉 45°:指針轉 270°
const TURN = (SWEEP * TEETH.pinion) / TEETH.sector; // 扇形段的轉角範圍(45°)

// 尾鉤的銷:壓力 0 時在樞軸後下方,壓力最大時轉到前下方(對稱,中途垂直於凸柱的運動,傳動最順)
const TAIL = 0.12;
const PIN_R = 0.02;
const pinRest = [0, -TAIL * Math.cos(TURN / 2), -TAIL * Math.sin(TURN / 2)]; // 相對樞軸(世界方向)
const pinLocalAngle = Math.atan2(pinRest[1], -pinRest[2]); // 扇形段局部:局部 X = 世界 −Z,局部 Y = 世界 Y
export const TRAVEL = 2 * TAIL * Math.sin(TURN / 2); // 碟片中心的總位移

// 碟片與錶殼(深度 z;錶面在 z = 0)
const DISC = { z: -1.0, flex: 1.55, outer: 2.0, dome: 0.15, thick: 0.015, wave: 0.012 };
const DISC_TOP = DISC.dome + DISC.thick / 2; // 碟片中心正面離邊緣平面
const EYE_Z = APEX[2] + pinRest[2]; // 壓力 0 時眼(長孔中心)的深度
const BOSS_R = 0.05;
const CASE = { r: 2.0, inner: 1.82, front: 0.15, back: -1.35, ledge: 1.55 };
const ZERO = deg(225); // 壓力為零時指針朝左下

/** 壓力 p → 碟片中心的位移、扇形段轉角(尾鉤的銷貼著眼的長孔)、小齒輪轉角、銷的位置 */
export function gauge(p0) {
  const p = clamp(p0, 0, MAX);
  const lift = (TRAVEL * p) / MAX;
  const eye = EYE_Z + lift;
  const pinZ = (a) => APEX[2] + pinRest[1] * Math.sin(a) + pinRest[2] * Math.cos(a); // 繞 +X 轉 a 後銷的深度
  const sector = solve(pinZ, eye, -TURN - 0.3, 0.3);
  const pinion = meshAngle(SECTOR, PINION, sector, CONTACT);
  const pin = partPoint(SECTOR.center, SECTOR.axis, sector, [TAIL * Math.cos(pinLocalAngle), TAIL * Math.sin(pinLocalAngle), 0]);
  return { lift, eye, sector, pinion, pin };
}
const REST = gauge(0);
/** 指針的方向(心軸朝錶面看的轉角;小齒輪的軸朝後,所以反號) */
export const needleAngle = (p) => ZERO - (gauge(p).pinion - REST.pinion);

// 碟片的剖面:同心波紋的薄片,中間往前拱;邊緣(半徑 flex)收成一點,接在夾住的邊緣上
const surface = (r) => DISC.dome * (1 - (r / DISC.flex) ** 2) + DISC.wave * Math.sin((8 * Math.PI * r) / DISC.flex) * Math.sin((Math.PI * r) / DISC.flex);
const thick = (r) => DISC.thick * Math.min(1, (DISC.flex - r) / 0.08);
const RS = Array.from({ length: 49 }, (_, i) => (DISC.flex * i) / 48);
const discProfile = [...RS.map((r) => [r, surface(r) + thick(r) / 2]), ...RS.slice(0, -1).reverse().map((r) => [r, surface(r) - thick(r) / 2])];

const ticks = Array.from({ length: 11 }, (_, i) => {
  const a = needleAngle(i);
  return { kind: "box", size: [0.2, 0.06, 0.02], at: [1.53 * Math.cos(a), 1.53 * Math.sin(a), 0.03], angle: a };
});

const needle = {
  outline: [
    [-0.42, -0.05],
    [-0.28, -0.08],
    [-0.28, -0.03],
    [1.32, -0.012],
    [1.38, 0],
    [1.32, 0.012],
    [-0.28, 0.03],
    [-0.28, 0.08],
    [-0.42, 0.05],
  ],
  holes: [],
};

const CUT = { cut: deg(240), sweep: deg(240) }; // 剖掉朝左(−x,扇形段那一側)的 120°
const band = (r0, r1, z0, z1) => ({ kind: "lathe", profile: [[r0, z0], [r1, z0], [r1, z1], [r0, z1]], ...CUT });
const ringWall = (z0, z1) => band(CASE.inner, CASE.r, z0, z1);
const box = (x0, x1, y0, y1, z0, z1) => ({ kind: "box", size: [x1 - x0, y1 - y0, z1 - z0], at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
const SPINDLE = { r: 0.035, z0: -0.23, z1: 0.07 };
const HUB = { x0: SECTOR.heel[0], x1: SECTOR.heel[0] + SECTOR.width }; // 扇形段的轂(沿 x)
const top = (x) => Math.sqrt(CASE.inner ** 2 - x ** 2) + 0.03; // 支架伸到前殼內壁

export default {
  figure: 500,
  parts: [
    {
      id: "caseFront",
      kind: "group",
      pieces: [
        ringWall(DISC.z + 0.01, CASE.front),
        band(CASE.ledge, CASE.inner, DISC.z + 0.01, DISC.z + 0.05), // 夾碟片的內凸緣
        // 錶面:刻度環、中央的圓板(心軸的前軸承)與連接兩者的上下兩條橋
        { kind: "plate", shape: ring(CASE.inner, 1.25), thickness: 0.04, circles: [1.62, 1.44] },
        ...ticks,
        { kind: "plate", shape: disc(0.5, SPINDLE.r), thickness: 0.04 },
        { kind: "plate", shape: shape(thickLine([[0, 0.45], [0, 1.3]], 0.1)), thickness: 0.04 },
        { kind: "plate", shape: shape(thickLine([[0, -0.45], [0, -1.3]], 0.1)), thickness: 0.04 },
        { kind: "cylinder", radius: 0.07, inner: SPINDLE.r, length: 0.06 }, // 前軸承
        // 右支架:伸出一臂,臂端是心軸的後軸承(推斷)
        box(0.25, 0.29, -0.06, top(0.29), -0.24, -0.16),
        box(0.04, 0.27, -0.03, 0.03, -0.22, -0.18),
        { kind: "cylinder", radius: 0.06, inner: SPINDLE.r, length: 0.06, at: [0, 0, -0.2] },
        // 左支架與扇形段的樞銷(平行錶面,推斷)
        box(-0.36, -0.32, -0.06, top(0.36), APEX[2] - 0.04, APEX[2] + 0.04),
        { kind: "cylinder", radius: 0.025, length: HUB.x1 + 0.34, axis: X, at: [(HUB.x1 - 0.34) / 2, 0, APEX[2]] },
      ],
    },
    {
      id: "caseBack",
      kind: "group",
      pieces: [
        ringWall(CASE.back, DISC.z - 0.01),
        band(CASE.ledge, CASE.inner, DISC.z - 0.05, DISC.z - 0.01), // 夾碟片的內凸緣
        band(0, CASE.r, CASE.back - 0.04, CASE.back), // 背板
        // 下面的接管:通到碟片後面的腔室
        { kind: "cylinder", radius: 0.15, length: 0.9, axis: Y, at: [0, -2.3, (CASE.back + DISC.z) / 2] },
        { kind: "cylinder", radius: 0.27, length: 0.16, axis: Y, at: [0, -2.68, (CASE.back + DISC.z) / 2] },
      ],
    },
    // 碟片的邊緣:夾在前後兩圈內凸緣之間,不動
    { id: "rim", center: [0, 0, DISC.z], ...band(DISC.flex, DISC.outer, -0.01, 0.01) },
    { id: "discA", kind: "lathe", center: [0, 0, DISC.z], profile: discProfile, ...CUT, label: "A", labelOffset: [-1.0, 0.7, 0.3] },
    // 碟片中心的凸柱與它前端開長孔的眼(和碟片中心一起前後動)
    {
      id: "boss",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: BOSS_R, length: EYE_Z + 0.045 - (DISC.z + DISC_TOP), at: [0, 0, (EYE_Z + 0.045 + DISC.z + DISC_TOP) / 2] },
        // 眼:平行扇形段的板(局部 X = 世界 −Z、局部 Y = 世界 Y),長孔沿 y、寬 = 銷徑
        {
          kind: "plate",
          axis: X,
          at: [0, 0, EYE_Z],
          shape: shape(rect(0.09, 0.22, 0, -0.065), [rect(2 * PIN_R, 0.065, 0, -TAIL * (1 + Math.cos(TURN / 2)) / 2).reverse()]),
          thickness: 0.04,
        },
      ],
    },
    {
      id: "sector",
      kind: "gear",
      center: SECTOR.center,
      axis: SECTOR.axis,
      teeth: SECTOR.teeth,
      radius: SECTOR.radius,
      cone: SECTOR.cone,
      width: SECTOR.width,
      span: [Math.PI - deg(8), Math.PI + TURN + deg(8)], // 咬合點在局部 180° − 轉角
      mask: (i) => {
        const pitch = (2 * Math.PI) / SECTOR.teeth;
        return i >= Math.ceil((Math.PI - deg(8)) / pitch + 0.5 - 1e-9) && i <= Math.floor((Math.PI + TURN + deg(8)) / pitch - 0.5 + 1e-9);
      },
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.05, inner: 0.025, length: SECTOR.width }, // 套在樞銷上的轂
        { kind: "plate", shape: stadium(TAIL, 0.06), thickness: SECTOR.width, angle: pinLocalAngle }, // 尾端
        // 尾鉤的銷:往 +x 穿過凸柱的眼
        { kind: "cylinder", radius: PIN_R, length: 0.03 - HUB.x0, at: [TAIL * Math.cos(pinLocalAngle), TAIL * Math.sin(pinLocalAngle), (0.03 - HUB.x0) / 2 - SECTOR.width / 2] },
      ],
      label: "e",
      labelOffset: [-0.25, 0.3, 0.25],
    },
    // 小齒輪與心軸是一體的:心軸後端轉在後軸承裡,往前穿過錶面中央的圓板,指針裝在軸端
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      axis: PINION.axis,
      teeth: PINION.teeth,
      radius: PINION.radius,
      cone: PINION.cone,
      width: PINION.width,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: SPINDLE.r, length: SPINDLE.z1 - SPINDLE.z0, at: [0, 0, PINION.center[2] - (SPINDLE.z0 + SPINDLE.z1) / 2] }],
    },
    { id: "needle", kind: "plate", center: [0, 0, 0.07], shape: needle, thickness: 0.04, hub: 0.08, spin: 1.1 },
  ],
  powered: ["discA"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "壓力", mode: "balance", range: [0, MAX] },
  target: "needle",
  view: { direction: [-1, 0.35, 0.75] },
  pose(p) {
    const g = gauge(p);
    return {
      parts: {
        discA: { scale: [1, 1, 1 + g.lift / DISC_TOP] },
        boss: { position: [0, 0, g.lift] },
        sector: { angle: g.sector },
        pinion: { angle: g.pinion },
        needle: { angle: needleAngle(p) },
      },
      flows: [{ fluid: "steam", points: stream([[0, -2.75, -1.18], [0, -1.9, -1.18], [0, -1.2, -1.18], [0, -0.3, -1.18]], clamp(p, 0, MAX) * 0.3, { spacing: 0.25 }) }],
      readouts: [],
    };
  },
};
