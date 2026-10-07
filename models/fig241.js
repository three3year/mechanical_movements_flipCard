// 第 241 種:有單一個齒的小輪連續旋轉,把間歇的圓周運動傳給輪 A。小輪(左下)逆時針轉,每轉一圈它的單齒
// 伸進 A 左下方的齒間,頂著齒的直面往上撥,A 順時針轉一格(原圖兩個箭頭);其餘時間 A 不動,
// 左上方的彎形止回爪靠自重搭在 A 的齒上,不讓它倒轉。主動件是小輪。
//
// 接觸(由接觸算,共用 pawl-drive.js):小輪的單齒是固定在小輪上的推件,齒尖伸進 A 的齒間、頂著齒的直面
// 把 A 推開;推多遠(A 轉幾度)、何時脫開,都由單齒與 A 的齒相碰算出。止回爪鉸在左上方的銷上,
// A 轉動時被齒背頂起、越過齒尖後加速落回下一格。
// 推斷:A 有 24 齒;兩輪的中心距與單齒的長度依原圖量得(單齒只伸到 A 的齒間,不碰 A 的齒根);
// 止回爪的樞軸銷、兩輪的軸與後面的軸承座(原圖只畫輪轂)。
import { TAU, deg, polar } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const A = { center: [0.75, 0.15, 0], teeth: 24, outer: 1.7, inner: 1.38, dir: -1 };
const STEP = TAU / A.teeth;
const DIST = 2.6; // 兩輪的中心距
const SMALL = { center: [A.center[0] + DIST * Math.cos(deg(207)), A.center[1] + DIST * Math.sin(deg(207))], radius: 0.72 };
const REACH = DIST - A.inner - 0.2; // 單齒尖離小輪中心:伸進 A 的齒間約齒高的四成(伸得更深會一次撥兩齒)
// 單齒(局部座標:原點在小輪中心,齒沿 +x):從輪緣伸出、尖端略往後彎(逆時針轉時,前緣頂著 A 的齒)
const HOOK = [
  [0.45, 0.15],
  [REACH - 0.4, 0.09],
  [REACH, 0.0],
  [REACH - 0.4, -0.05],
  [0.45, -0.15],
];
const HOOK0 = deg(-20); // 主動量 0 時單齒的方位
// 止回爪(局部座標:原點在樞軸):從樞軸往右沿 A 的左上緣彎過去,尖端往下伸進齒間
const CLICK = { pivot: [-1.15, 1.75] };
const CLICK_LINE = [[0, 0], [0.75, 0.32], [1.45, 0.38], [1.9, 0.18]];
const CLICK_TIP = [
  [1.72, 0.3],
  [2.02, 0.12],
  [1.98, 0.0],
  [1.78, 0.08],
];

const drive = pawlDrive({
  period: TAU,
  samples: 720,
  pins: () => ({ hook: SMALL.center, click: CLICK.pivot }),
  angles: (v) => ({ hook: v + HOOK0 }),
  wheel: { obstacles: (theta) => ratchetObstacles(A, theta, A.center), dir: -1, pitch: STEP },
  pawls: {
    hook: { outline: HOOK, fixed: true },
    // 止回爪靠自重往下擺(順時針),尖端搭在齒上
    click: { outline: CLICK_TIP, into: -1, angle: deg(-4), limits: [deg(-25), deg(25)] },
  },
});
const W0 = drive.at(0).wheel;

/** 小輪轉 theta(逆時針):A 的轉角(自起點,順時針為負) */
export const wheelA = (theta) => drive.at(theta).wheel - W0;
export const clickAngle = (theta) => drive.at(theta).angles.click;
export const step = STEP;
/** 檢查用:小輪轉 theta 時單齒、止回爪尖與 A 的齒(世界座標 2D) */
export const contactAt = (theta) => {
  const s = drive.shapes(theta);
  return { hook: s.pawls.hook, click: s.pawls.click, teeth: s.wheel };
};

const hookShape = shape(HOOK);
const clickShape = shape(thickLine(CLICK_LINE, 0.2), [circle(0.07).reverse()]);

export default {
  figure: 241,
  parts: [
    { id: "wheelA", kind: "plate", center: A.center, shape: ratchetShape({ ...A, bore: 0.12 }), thickness: 0.2, hub: 0.32, circles: [0.42], mark: [0.95, -0.3], markSize: 0.08, spin: A.outer, label: "A", labelOffset: [0.85, 0, 0.3] },
    {
      id: "small",
      kind: "group",
      center: [...SMALL.center, 0],
      spin: SMALL.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(SMALL.radius), [circle(0.1).reverse()]), thickness: 0.14, at: [0, 0, -0.2] },
        { kind: "plate", shape: hookShape, thickness: 0.2, at: [0, 0, 0], angle: HOOK0, accent: true }, // 單齒和 A 的齒在同一層
        { kind: "cylinder", radius: 0.2, length: 0.36, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "click",
      kind: "group",
      center: [...CLICK.pivot, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: clickShape, thickness: 0.1, at: [0, 0, 0.16] }, // 彎臂在 A 的前面
        { kind: "plate", shape: shape(CLICK_TIP), thickness: 0.3, at: [0, 0, 0.05] }, // 尖端往後伸到齒那一層
        { kind: "cylinder", radius: 0.2, inner: 0.07, length: 0.12, at: [0, 0, 0.16] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.55, at: [A.center[0], A.center[1], -0.3] }, // A 的軸
        ...pedestal({ at: A.center, z: -0.45, bore: 0.12, floor: -2.6 }),
        { kind: "cylinder", radius: 0.1, length: 0.55, at: [...SMALL.center, -0.35] }, // 小輪的軸
        ...pedestal({ at: SMALL.center, z: -0.6, bore: 0.1, floor: -2.6 }),
        { kind: "cylinder", radius: 0.065, length: 0.6, at: [...CLICK.pivot, 0.0] }, // 止回爪的樞軸銷
        { kind: "box", size: [0.3, 4.2, 0.12], at: [CLICK.pivot[0] - 0.4, CLICK.pivot[1] - 2.2, -0.45] },
        { kind: "box", size: [0.6, 0.25, 0.12], at: [CLICK.pivot[0] - 0.2, CLICK.pivot[1], -0.45] },
      ],
    },
  ],
  // 動力重演:只推小輪;A 靠摩擦定位,由單齒推動;止回爪鉸在銷上,靠自重搭在齒上
  replay: {
    to: 2 * TAU,
    seconds: 16,
    free: { wheelA: { hold: true, gravity: false }, click: { pivot: [...CLICK.pivot, 0] } },
    expect: [
      { at: TAU, part: "wheelA", label: "小輪轉一圈,單齒把 A 撥過一格", quote: "藉由具有單一齒的較小輪之連續圓周運動,將間歇的圓周運動傳遞給輪 A" },
      { at: 2 * TAU, part: "wheelA", label: "兩圈兩格" },
      { at: 2 * TAU, part: "click", label: "止回爪落回齒間" },
    ],
  },
  driver: { part: "small", type: "rotation" },
  target: "wheelA",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const s = drive.at(theta);
    return { parts: { small: { angle: theta }, wheelA: { angle: s.wheel }, click: { angle: s.angles.click } }, readouts: [] };
  },
};
