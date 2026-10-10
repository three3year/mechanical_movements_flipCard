// 第 190 種:螺桿夾具。一根直立的支柱穿過工作台(下端彎成鉤勾住台面底下),柱頂以銷支著一根拱形的槓桿(壓桿)。
// 槓桿右臂由螺桿撐著:轉動頂上的手柄,螺桿在支柱下方伸出的腳座裡旋轉、往上頂住槓桿右臂;
// 槓桿繞支點轉,支點另一側(左端)以銷吊著的壓腳往下,把台面上的木塊緊緊夾住。主動件是手柄。
// 推斷:螺桿旋在腳座的螺孔裡(原圖螺桿下端停在腳座頂面,沒有伸進台面);右臂是叉形,兩支叉齒夾著螺桿,
// 叉齒底下是螺桿的肩、上面是軸環。旋緊時肩往上頂住叉齒底面(原文「往上頂住」);
// 放鬆時左邊較重(壓腳吊在左端),壓腳先照重力留在木塊上,等軸環降到叉齒頂面才把右臂往下帶、壓腳升起。
// 槓桿的轉角由叉齒和肩、軸環的外形相碰決定。壓腳吊在銷上保持水平;初始是原圖的夾緊位置。
// 推斷:螺距比原圖細(三圈的行程 0.18),放鬆到底時肩和叉齒仍在腳座之上、螺桿下端仍在腳座裡。
import { Y, TAU, screwAdvance } from "./kit.js";
import { shape, circle, rect, arcPoints } from "./shapes.js";
import { swingUntilContact, placeOutline } from "./contact.js";

const FULCRUM = [0, 0, 0];
const RIGHT = 1.25; // 支點到螺桿的距離
const LEFT = 1.4; // 支點到壓腳銷的距離
const PITCH = 0.06;
const TURNS = 3;
const SCREW_X = RIGHT;

/** 台面(y 範圍) */
export const BENCH = { top: -0.87, bottom: -1.6 };
/** 支柱板的深度範圍(在槓桿後面) */
export const POST_LAYER = { z: [-0.45, -0.15] };
/** 腳座:支柱下方往右伸出、坐在台面上的塊,和螺桿同一層(往前伸到螺桿前面),螺桿旋在它的螺孔裡 */
export const FOOT_BLOCK = { x: [0.35, 1.6], y: [BENCH.top, -0.5], z: [POST_LAYER.z[0], 0.2] };
/** 叉齒:槓桿右臂的兩支(槓桿座標的側面輪廓;深度在螺桿兩側 z ±0.115…±0.165) */
export const TINES = { outline: rect(0.65, 0.3, 1.38, -0.1), z: [0.115, 0.165] };
const TINE_BOTTOM = -0.25;
// 螺桿:局部原點在肩頂面,旋緊時對齊叉齒底面。肩、軸環的半徑比叉縫的一半大,蓋得到叉齒;
// 肩頂面到軸環底面的距離比叉齒傾斜時佔的高度大,全程不夾死
const COLLAR_GAP = 0.35;
const RING_THICK = 0.06;
const WORM = [-0.43, 0.7]; // 螺紋段的局部範圍
export const SCREW = { x: SCREW_X, r: 0.1, shoulder: 0.16, collar: 0.16 };
/** 支柱下端的鉤:柄在支柱板那一層,鉤的橫段貼著台面底面 */
export const HOOK = { top: BENCH.bottom, z: [-0.36, -0.24] };

// 拱形槓桿(以支點為原點;原圖量得,單位為 100 px)。左端圓頭包住壓腳的銷孔,底邊在銷附近是平的
const LEVER = shape(
  [
    [-1.62, 0.06], [-1.5, 0.2], [-1.2, 0.3], [-0.9, 0.42], [-0.3, 0.55], [0.3, 0.5], [0.75, 0.3], [1.08, 0.07], [1.08, -0.25],
    [0.75, -0.25], [0.3, -0.12], [-0.3, -0.12], [-0.9, -0.05], [-1.1, -0.22], [-1.62, -0.22],
  ],
  [circle(0.1).reverse(), circle(0.1, -LEFT, 0).reverse()],
);
// 壓腳:主體是槓桿底下的塊(頂面低於槓桿底邊,放鬆時槓桿左端往上翹、底邊往支點那側下沉也不碰到),
// 吊在銷上的是左右兩片叉耳(在槓桿兩側,不同的 z 層),銷穿過叉耳與槓桿——槓桿和壓腳在同一平面裡不重疊。
const FOOT_TOP = -0.3;
const FOOT_BOTTOM = -0.45;
const PIN_R = 0.09;
const FOOT = shape([[-0.6, FOOT_BOTTOM], [0.6, FOOT_BOTTOM], [0.28, FOOT_TOP], [-0.28, FOOT_TOP]], [circle(0.1).reverse()]);
const LUG = shape([[-0.28, FOOT_TOP - 0.01], [0.28, FOOT_TOP - 0.01], [0.22, -0.05], ...arcPoints(0.22, 0, Math.PI), [-0.22, -0.05]], [circle(PIN_R).reverse()]);
const LEVER_THICK = 0.25;
const LUG_THICK = 0.07;
const LUG_Z = LEVER_THICK / 2 + 0.01 + LUG_THICK / 2;
// 支柱板:柱頂的圓頭支著槓桿的支點銷;往右伸的腳座另列(FOOT_BLOCK)
const POST = shape([[-0.35, BENCH.top], [-0.35, 0.0], ...arcPoints(0.37, Math.PI, 0, 0.02, 0), [0.4, BENCH.top]], [circle(0.1).reverse()]);
const WORK = { x: [-2.1, -0.75], y: [BENCH.top, FOOT_BOTTOM] };

const box = ({ x, y, z }) => ({
  kind: "box",
  size: [x[1] - x[0], y[1] - y[0], z[1] - z[0]],
  at: [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2],
});
const ringOutline = (r, y0) => rect(2 * r, RING_THICK, SCREW_X, y0 + RING_THICK / 2);

/** 手柄轉 angle(0 為夾緊,負為放鬆):螺桿升降、槓桿轉角與壓腳的升起量,以及叉齒、肩、軸環的側面輪廓 */
export function screwClamp(angle) {
  const rise = screwAdvance(angle, PITCH);
  const base = TINE_BOTTOM + rise; // 肩頂面
  const shoulder = ringOutline(SCREW.shoulder, base - RING_THICK);
  const collar = ringOutline(SCREW.collar, base + COLLAR_GAP);
  const swing = (from, into, obstacle) =>
    swingUntilContact({ pivot: FULCRUM, outline: TINES.outline, from, into, sweep: 1, steps: 60 }, [obstacle]);
  const pushed = swing(0.4, -1, shoulder); // 肩頂著叉齒:槓桿最低只到這裡
  const held = swing(-0.6, 1, collar); // 軸環壓著叉齒:槓桿最高只到這裡
  const onWork = Math.asin((FOOT_BOTTOM - WORK.y[1]) / LEFT); // 壓腳落在木塊上
  // 左邊較重,槓桿往左端下沉的方向(轉角變大)轉到軸環或木塊擋住為止;肩往上頂時跟著被推
  const lever = Math.max(pushed, Math.min(held, onWork));
  const foot = [FULCRUM[0] - LEFT * Math.cos(lever), FULCRUM[1] - LEFT * Math.sin(lever), 0];
  return {
    rise,
    lever,
    foot,
    lift: foot[1] - FULCRUM[1],
    tines: placeOutline(TINES.outline, FULCRUM, lever),
    shoulder,
    collar,
    screwEnd: base + WORM[0],
  };
}

export default {
  figure: 190,
  parts: [
    {
      id: "bench",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(5.9, BENCH.top - BENCH.bottom, -0.1, (BENCH.top + BENCH.bottom) / 2)), thickness: 1.0, at: [0, 0, -0.2] },
        { kind: "plate", shape: POST, thickness: POST_LAYER.z[1] - POST_LAYER.z[0], at: [0, 0, (POST_LAYER.z[0] + POST_LAYER.z[1]) / 2] }, // 支柱在槓桿後面,支點銷往前穿過槓桿
        { kind: "cylinder", radius: 0.1, length: 0.7, at: [0, 0, -0.1] },
        // 支柱穿過台面,下端彎成鉤。推斷:鉤貼著台面底面(原圖的鉤離台面底面約 1.7 倍台面厚;
        // 夾緊時支柱被往上拉,鉤離得遠就會先被拉起一段才勾住,實物應是貼著台面底)
        {
          kind: "plate",
          shape: shape([[-0.06, BENCH.top], [0.06, BENCH.top], [0.06, HOOK.top], [0.45, HOOK.top], [0.45, HOOK.top - 0.12], [-0.06, HOOK.top - 0.12]]),
          thickness: HOOK.z[1] - HOOK.z[0],
          at: [0, 0, (HOOK.z[0] + HOOK.z[1]) / 2],
        },
        box(FOOT_BLOCK), // 腳座:螺桿旋在它的螺孔裡
      ],
    },
    { id: "work", kind: "box", center: [(WORK.x[0] + WORK.x[1]) / 2, (WORK.y[0] + WORK.y[1]) / 2, 0], size: [WORK.x[1] - WORK.x[0], WORK.y[1] - WORK.y[0], 0.8] },
    {
      id: "lever",
      kind: "plate",
      center: FULCRUM,
      shape: LEVER,
      thickness: LEVER_THICK,
      arrow: false,
      posed: true,
      // 右端是叉形:兩支叉齒夾著螺桿(螺桿上下穿過叉縫,不穿過槓桿的實體)
      pieces: [TINES.z, [-TINES.z[1], -TINES.z[0]]].map((z) => box({ x: [1.055, 1.705], y: [TINE_BOTTOM, 0.05], z })),
    },
    {
      id: "foot",
      kind: "plate",
      shape: FOOT,
      thickness: 0.4,
      arrow: false,
      pieces: [
        { kind: "plate", shape: LUG, thickness: LUG_THICK, at: [0, 0, LUG_Z] },
        { kind: "plate", shape: LUG, thickness: LUG_THICK, at: [0, 0, -LUG_Z] },
        { kind: "cylinder", radius: PIN_R, length: 2 * LUG_Z + LUG_THICK + 0.04 }, // 銷:緊配在叉耳的孔裡,在槓桿的孔(r 0.1)裡轉
      ],
    },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      spin: 0.3,
      spinOffset: 0.55, // 轉向箭頭在叉齒與手柄之間
      pieces: [
        { kind: "worm", radius: SCREW.r, length: WORM[1] - WORM[0], pitch: PITCH, thread: 0.04, at: [0, 0, (WORM[0] + WORM[1]) / 2] },
        // 叉齒底下的肩:螺桿上升時由它頂起槓桿右臂
        { kind: "cylinder", radius: SCREW.shoulder, length: RING_THICK, at: [0, 0, -RING_THICK / 2], accent: true },
        // 叉齒上方的軸環:放鬆時把右臂往下帶
        { kind: "cylinder", radius: SCREW.collar, length: RING_THICK, at: [0, 0, COLLAR_GAP + RING_THICK / 2] },
        // 手柄在槓桿最高處之上,轉動時不掃過槓桿與支柱
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, 0.9] },
        { kind: "box", size: [1.4, 0.15, 0.12], at: [0.55, 0, 1.15] },
        { kind: "lathe", profile: [[0, 0], [0.08, 0.05], [0.1, 0.18], [0.05, 0.3], [0, 0.3]], at: [1.2, 0, 1.21] },
      ],
    },
  ],
  driver: { part: "screw", type: "rotation", range: [-TURNS * TAU, 0] },
  target: "foot",
  view: { direction: [0.08, 0.12, 1] },
  pose(angle) {
    const { rise, lever, foot } = screwClamp(angle);
    return {
      parts: {
        screw: { position: [SCREW_X, TINE_BOTTOM + rise, 0], angle },
        lever: { angle: lever },
        foot: { position: foot },
      },
      readouts: [],
    };
  },
  waivers: [
    // 驗證工具的豁免只能指定零件對,不能指定零件塊:這一項放過的是 bench 與 screw 之間所有的穿入,
    // 所以其他塊之間不該有的穿入由測試守著(肩全程不壓進腳座、螺桿下端不伸進台面)
    {
      check: "interference",
      parts: ["bench", "screw"],
      reason:
        "螺紋段(worm)旋在腳座(bench 的方塊,x 0.35–1.6、y −0.87–−0.5)的螺孔裡,下端停在腳座裡面(螺孔沒有畫出來;螺紋沒有整根穿過腳座,工具不把它當成裝在孔裡的軸);只有這一段該重疊。肩與腳座、螺桿與台面不重疊,由模型定義的測試守著(放鬆到底時肩底離腳座頂 0.01)",
    },
  ],
};
