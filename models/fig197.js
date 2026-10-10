// 第 197 種:曼格式齒條(mangle-rack)。方形框架中間一排銷(齒條),小齒輪連續旋轉,給框架往復的運動:
// 小齒輪在銷排上方時框架往一邊走,走到盡頭繞過端點的銷到下方,框架就往回走。小齒輪軸必須能自由升降,
// 以便繞過齒條兩端的引導部(兩端的 C 形導板)。主動件是小齒輪。
// 推斷:小齒輪軸只升降、不左右移動;框架只左右平移。原文另一種用法(固定框架、小齒輪軸裝萬向接頭,
// 軸端畫出類似圖中的軌跡)以小齒輪軸心的軌跡刻線表示。
// 推斷(原圖沒畫):框架上下的導軌;小齒輪軸升降的直線導路(開直線溝槽的靜止桿,同第 36 種)與往前下方伸到
// 固定萬向接頭的驅動軸(見 pinion-drive.js)。
// C 形導板引導的是小齒輪軸,不是齒(同 507movements 的動畫:導板內半徑 = 小齒輪節圓半徑 + 軸轂半徑):
// 小齒輪繞端頭時齒掃過導板所在的範圍,所以導板放在小齒輪前面那一層、以支柱接回框架板,
// 小齒輪軸在那一層套一個軸環(推斷),繞端頭時軸環靠著導板的內緣走,把小齒輪壓在端頭的銷上。
// 導軌做成有前後擋邊的槽形,框架板坐在下導軌上(推斷)。
import { TAU } from "./kit.js";
import { manglePath } from "./mangle-path.js";
import { shape, rect, stadium, arcPoints } from "./shapes.js";
import { pinionDrive } from "./pinion-drive.js";

const PINS = 11;
const PITCH = 0.345;
const X0 = -((PINS - 1) * PITCH) / 2;
const X1 = -X0;
const NP = 10;
const RP = (NP * PITCH) / TAU;
const SEGMENTS = [
  { line: [X0, 0], to: [X1, 0] }, // 小齒輪在銷排上方
  { pin: [X1, 0], sweep: -Math.PI }, // 繞過右端的銷
  { line: [X1, 0], to: [X0, 0] }, // 在下方往回
  { pin: [X0, 0], sweep: -Math.PI },
];
const path = manglePath(SEGMENTS, RP, "slide");
const PX = -0.77; // 小齒輪軸的水平位置(原圖)
const FLOOR = -3.1;
const SHAFT = 0.07;
// 小齒輪軸往前穿過靜止桿的直線溝槽(在銷排前面),再經萬向接頭與驅動軸接到固定端;底板接到導軌的底板(推斷)
const DRIVE = pinionDrive({ x: PX, travel: [Math.min(...path.centers.map((q) => q[1])), Math.max(...path.centers.map((q) => q[1]))], shaft: SHAFT, post: 0.39, floor: FLOOR, base: 0.2, foot: 0.12 });

/** 小齒輪轉 alpha:框架的位移與小齒輪軸心的高度 */
export function rack(alpha) {
  const { q, pinion } = path.at(alpha * path.sense);
  return { frame: PX - q[0], y: q[1], pinion };
}
export const period = path.period;
export const pitch = PITCH;
export const pinionRadius = RP;
const START = path.driveWhere(([x, y]) => y > 0.5 && x >= PX);

const Z = 0.05; // 小齒輪(齒那一層的中心)的 z
const WIDTH = 0.22; // 小齒輪寬
const COLLAR = 0.33; // 小齒輪軸上的軸環半徑(推斷;小於 RP − 銷半徑,碰不到銷)
const GUIDE = { z: 0.245, thickness: 0.11, inner: RP + COLLAR + 0.008, outer: 1.0 }; // C 形導板:在齒前面那一層,圓心在端頭的銷上
const STRUT = { radius: 0.07, at: 1.4, spread: Math.PI / 4 }; // 托著導板的支柱:在齒掃過的範圍(端銷外 RP + 齒頂)之外
const TIP = RP * 1.2;
if (STRUT.at - STRUT.radius < RP + TIP + 0.05) throw new Error("支柱在小齒輪的齒掃過的範圍裡");

/** C 形導板(圓心在端頭的銷上,開口朝銷排),外緣在兩根支柱處凸出一塊耳片 */
const guide = (sign) => {
  const c = [sign * X1, 0];
  const mid = sign > 0 ? 0 : Math.PI;
  const [a0, a1] = [mid - 1.4, mid + 1.4];
  const ear = Math.asin((STRUT.radius + 0.06) / STRUT.at); // 耳片的半寬(角度)
  const outer = [];
  for (const [from, to, r] of [
    [a0, mid - STRUT.spread - ear, GUIDE.outer],
    [mid - STRUT.spread - ear, mid - STRUT.spread + ear, STRUT.at + STRUT.radius + 0.06],
    [mid - STRUT.spread + ear, mid + STRUT.spread - ear, GUIDE.outer],
    [mid + STRUT.spread - ear, mid + STRUT.spread + ear, STRUT.at + STRUT.radius + 0.06],
    [mid + STRUT.spread + ear, a1, GUIDE.outer],
  ]) outer.push(...arcPoints(r, from, to, ...c));
  return shape([...outer, ...arcPoints(GUIDE.inner, a1, a0, ...c)]);
};
const struts = [1, -1].flatMap((sign) =>
  [-1, 1].map((k) => {
    const a = (sign > 0 ? 0 : Math.PI) + k * STRUT.spread;
    const [z0, z1] = [-0.23, GUIDE.z]; // 從框架板的正面伸到導板的中間
    return { kind: "cylinder", radius: STRUT.radius, length: z1 - z0, at: [sign * X1 + STRUT.at * Math.cos(a), STRUT.at * Math.sin(a), (z0 + z1) / 2] };
  }),
);
const track = stadium(4.25, 0.84);

// 框架背板的上下緣,與夾著它的槽形導軌(推斷)
const PLATE = { w: 6.1, h: 3.05, cx: -0.07, cy: 0.02, z: -0.3, t: 0.15 };
const [BOTTOM, TOP] = [PLATE.cy - PLATE.h / 2, PLATE.cy + PLATE.h / 2];
const [BACK, FACE] = [PLATE.z - PLATE.t / 2, PLATE.z + PLATE.t / 2];
const RAIL = { x: -0.8, length: 10.0, web: 0.12, lip: 0.06, over: 0.075, gap: 0.01 };
/** 槽形導軌:side −1 = 下(框架板坐在上面)、+1 = 上(和框架板留 gap) */
const rail = (side) => {
  const edge = side < 0 ? BOTTOM : TOP + RAIL.gap;
  const web = [edge + (side * RAIL.web) / 2, BACK - RAIL.gap - RAIL.lip, FACE + RAIL.gap + RAIL.lip];
  const lipY = edge + (side * (RAIL.web - RAIL.over)) / 2; // 擋邊從腹板外側伸到框架板邊緣內 over
  const lipH = RAIL.web + RAIL.over;
  const box = (y, h, z0, z1) => ({ kind: "box", size: [RAIL.length, h, z1 - z0], at: [RAIL.x, y, (z0 + z1) / 2] });
  return [
    box(web[0], RAIL.web, web[1], web[2]), // 腹板
    box(lipY, lipH, FACE + RAIL.gap, web[2]), // 前擋邊
    box(lipY, lipH, web[1], BACK - RAIL.gap), // 後擋邊
  ];
};
const RAIL_BACK = BACK - RAIL.gap - RAIL.lip; // 導軌的背面

export default {
  figure: 197,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(PLATE.w, PLATE.h, PLATE.cx, PLATE.cy)), thickness: PLATE.t, at: [0, 0, PLATE.z], engrave: [path.centers.slice(0, -1).map(([x, y]) => [x, y])] },
        { kind: "plate", shape: shape(track.outline.map(([x, y]) => [x - 2.125, y]), [stadium(4.13, 0.72).outline.map(([x, y]) => [x - 2.065, y]).reverse()]), thickness: 0.12, at: [0, 0, -0.17] },
        { kind: "plate", shape: guide(1), thickness: GUIDE.thickness, at: [0, 0, GUIDE.z] },
        { kind: "plate", shape: guide(-1), thickness: GUIDE.thickness, at: [0, 0, GUIDE.z] },
        ...struts,
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: 0.065, length: 0.55, at: [X0 + i * PITCH, 0, 0.0], accent: i === 0 })),
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      teeth: NP,
      radius: RP,
      width: WIDTH,
      web: false,
      hub: false,
      pieces: [
        { kind: "cylinder", radius: SHAFT, length: DRIVE.shaftEnd + 0.1, at: [0, 0, (DRIVE.shaftEnd - 0.2) / 2] }, // 軸不往後穿過機架板(小齒輪沿齒條內外移動),往前接萬向接頭
        { kind: "cylinder", radius: COLLAR, length: GUIDE.z + GUIDE.thickness / 2 - 0.01 - (Z + WIDTH / 2), at: [0, 0, (GUIDE.z + GUIDE.thickness / 2 - 0.01 + Z + WIDTH / 2) / 2 - Z] }, // 軸環:從齒的正面伸到導板那一層
      ],
    },
    ...DRIVE.parts,
    {
      id: "guides",
      kind: "group",
      pieces: [
        // 框架上下的槽形導軌(框架只左右平移)與托著導軌的立柱;立柱貼在兩條導軌的背面
        ...rail(-1),
        ...rail(1),
        ...[-5.6, 4.0].map((x) => ({ kind: "box", size: [0.2, TOP + RAIL.gap + RAIL.web - FLOOR, 0.2], at: [x, (TOP + RAIL.gap + RAIL.web + FLOOR) / 2, RAIL_BACK - 0.1] })),
        { kind: "box", size: [10.0, 0.12, 1.0], at: [-0.8, FLOOR - 0.06, -0.3] },
        ...DRIVE.pieces,
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5, grips: DRIVE.grips },
  target: "frame",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { frame, y, pinion } = rack(alpha);
    const angle = path.phase(NP) + pinion;
    return {
      parts: {
        frame: { position: [frame, 0, 0] },
        pinion: { position: [PX, y, Z], angle },
        ...DRIVE.pose(y, angle),
      },
      readouts: [],
    };
  },
};
