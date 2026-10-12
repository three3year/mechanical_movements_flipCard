// 第 282 種:固定有銷的圓盤旋轉,銷在直立桿的長槽裡作動;直立桿繞靠近底部的中心擺動,兩端都左右橫移。
// 桿下端的齒扇形段讓底部的水平齒條桿交替地左右直線移動;桿上端經一條繩繞過右上的滑輪,
// 吊著重物上下交替移動。主動件是圓盤。
// 照原圖:拱頂是以擺動中心為圓心的弧形板,板上一道弧形槽,直立桿越過拱頂(桿上伸進槽裡、引導桿上段的銷是推斷);
// 滑輪架是從拱頂右端伸出的三角形托板;圓盤中心往左下的兩條平行虛線是圓盤後面的托架,
// 下端落在圓盤後面的橫樑上,圓盤的軸穿過托架上的軸承。
// 推斷:拱頂弧形槽裡的銷;繩繞過滑輪的走法與重物的高度(依原圖);直立桿的樞軸銷從機架後面的橫樑往前穿過桿的轂;
// 圓盤托架的軸承;齒條的背條在底座上兩片導板之間滑動。
import { Z, deg, routeRope } from "./kit.js";
import { crankPin, angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, rect, thickLine, circle, arcPoints } from "./shapes.js";

const DISC = { center: [-0.15, 0.55, -0.3], radius: 1.35, pin: 0.75 };
export const O = [0, -1.45, 0]; // 直立桿的擺動中心
const TOP = 4.6; // 擺動中心到桿頂(繫繩處)的距離:桿頂越過拱頂
const SECTOR = { teeth: 32, radius: 0.72 }; // 齒扇形段(整圈的齒數)
const RACK_Y = O[1] - SECTOR.radius;
const PULLEY = { center: [2.5, 3.35, 0.3], radius: 0.32 };
const ROPE_DROP = 1.2;
const Z_FRAME = -0.55; // 機架(立柱、拱頂、橫樑、托架)那一層的中面
const ARCH = { radius: 3.9, width: 0.44, from: deg(57), to: deg(124) }; // 拱頂:以擺動中心為圓心的弧形板
const SLOT = { radius: 3.9, width: 0.13, from: deg(70), to: deg(118.5) }; // 拱頂上的弧形槽
const BEAM_Y = -0.25; // 圓盤後面的橫樑(原圖虛線托架的下端)

/** 圓盤轉 theta:銷的位置與直立桿的角度(從擺動中心指向銷) */
export function bar(theta) {
  const pin = crankPin(DISC.center, DISC.pin, theta);
  return { pin, angle: angleOf(O, pin) };
}
const sector = { center: O, teeth: SECTOR.teeth, radius: SECTOR.radius };
const rackDef = { origin: [0, RACK_Y, 0], dir: [1, 0, 0], pitch: circularPitch(sector) };
// 扇形段的轉角以「桿直立」為 0
const sectorAngle = (theta) => bar(theta).angle - Math.PI / 2;

/** 圓盤轉 theta:齒條位移、桿頂位置、重物高度 */
export function motion(theta) {
  const { angle } = bar(theta);
  const top = [O[0] + TOP * Math.cos(angle), O[1] + TOP * Math.sin(angle), 0.3];
  const rope = routeRope([{ point: top }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: [PULLEY.center[0] + PULLEY.radius, 0, 0.3] }]);
  return { rack: rackOffset(sector, rackDef, sectorAngle(theta)), top, rope, angle };
}
// 繩長固定:繩從桿頂到滑輪右側往下;桿頂離滑輪越遠,重物升得越高
const ROPE_LEN = (() => {
  const r = motion(0).rope;
  return r.length - r.points[r.points.length - 1][1] + ROPE_DROP; // 起始時重物掛在 y = −ROPE_DROP 處
})();
export function weight(theta) {
  const r = motion(theta).rope;
  const fixed = r.length - r.points[r.points.length - 1][1]; // 到 y = 0 為止的長度
  return { y: -(ROPE_LEN - fixed), rope: r };
}

const onArc = (r, a) => [O[0] + r * Math.cos(a), O[1] + r * Math.sin(a)];
const arc = (r, a0, a1) => arcPoints(r, a0, a1, O[0], O[1]);
// 立柱頂端伸進拱頂的帶子裡
const LEFT_TOP = onArc(ARCH.radius, Math.PI - Math.acos(2.0 / ARCH.radius))[1];
const RIGHT_TOP = onArc(ARCH.radius, Math.acos(1.75 / ARCH.radius))[1];
// 滑輪架:從拱頂右端的外緣伸到滑輪軸
const OUTER = ARCH.radius + ARCH.width / 2;
const PULLEY_BRACKET = [onArc(OUTER - 0.05, deg(57)), [PULLEY.center[0] + 0.2, PULLEY.center[1] - 0.05], [PULLEY.center[0], PULLEY.center[1] + 0.2], [PULLEY.center[0] - 0.2, PULLEY.center[1] - 0.05], onArc(OUTER - 0.05, deg(65))];

export default {
  figure: 282,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.2, 1.0], at: [0, -2.67, 0] },
        // 底座上夾住齒條背條的兩片導板
        { kind: "box", size: [4.4, 0.22, 0.06], at: [0, -2.46, 0.15] },
        { kind: "box", size: [4.4, 0.22, 0.06], at: [0, -2.46, -0.15] },
        // 拱頂:以擺動中心為圓心的弧形板,開一道弧形槽讓直立桿上的銷伸進去
        { kind: "plate", shape: shape(thickLine(arc(ARCH.radius, ARCH.from, ARCH.to), ARCH.width), [thickLine(arc(SLOT.radius, SLOT.from, SLOT.to), SLOT.width).reverse()]), thickness: 0.2, at: [0, 0, Z_FRAME] },
        { kind: "plate", shape: shape(thickLine([[-2.0, -2.57], [-2.0, LEFT_TOP + 0.1]], 0.22)), thickness: 0.2, at: [0, 0, Z_FRAME] }, // 左柱
        { kind: "box", size: [0.22, RIGHT_TOP + 0.1 + 2.57, 0.2], at: [1.75, (RIGHT_TOP + 0.1 - 2.57) / 2, Z_FRAME] }, // 右柱
        { kind: "box", size: [3.75, 0.2, 0.2], at: [-0.125, O[1], -0.45] }, // 直立桿樞軸所在的橫樑
        // 直立桿的樞軸銷:從橫樑往前穿過桿的轂與桿,前端一個銷頭
        { kind: "cylinder", radius: 0.05, length: 0.87, at: [O[0], O[1], -0.115] },
        { kind: "cylinder", radius: 0.1, length: 0.06, at: [O[0], O[1], 0.3] },
        // 圓盤後面的橫樑與斜伸到盤心的托架(原圖的兩條虛線);圓盤的軸穿過托架上的軸承
        { kind: "box", size: [3.75, 0.2, 0.2], at: [-0.125, BEAM_Y, Z_FRAME] },
        { kind: "plate", shape: shape(thickLine([[-0.85, BEAM_Y], [DISC.center[0] + 0.05, DISC.center[1] + 0.06]], 0.2)), thickness: 0.16, at: [0, 0, -0.56] },
        { kind: "plate", shape: shape(circle(0.2, DISC.center[0], DISC.center[1])), thickness: 0.16, at: [0, 0, -0.56] }, // 軸承
        // 滑輪架:從拱頂右端伸出的三角形托板,滑輪軸從托板往前穿過滑輪
        { kind: "plate", shape: shape(PULLEY_BRACKET), thickness: 0.2, at: [0, 0, Z_FRAME] },
        { kind: "cylinder", radius: 0.05, length: 1.0, at: [PULLEY.center[0], PULLEY.center[1], -0.1] },
      ],
    },
    {
      id: "disc",
      kind: "plate",
      center: DISC.center,
      shape: shape(circle(DISC.radius), [circle(0.1).reverse()]),
      thickness: 0.2,
      hub: 0.22,
      mark: [DISC.radius - 0.15, 0],
      markSize: 0.08,
      spin: DISC.radius,
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 0.65, at: [DISC.pin, 0, 0.3], accent: true },
        { kind: "cylinder", radius: 0.08, length: 0.4, at: [0, 0, -0.18] }, // 盤的軸:往後穿過托架的軸承
      ],
    },
    {
      id: "bar",
      kind: "group",
      center: O,
      arrow: false,
      pieces: [
        // 有長槽的直立桿(沿局部 +x)
        { kind: "plate", shape: shape(rect(TOP + 0.4, 0.42, TOP / 2 - 0.1, 0), [rect(2.2, 0.2, 1.65 + 0.6, 0).reverse()]), thickness: 0.14, at: [0, 0, 0.19] }, // 桿頂貼著繩所在的那一層
        { kind: "cylinder", radius: 0.12, length: 0.6, at: [0, 0, -0.05] }, // 樞軸的轂,套在樞軸銷上
        { kind: "cylinder", radius: 0.05, length: 0.77, at: [SLOT.radius, 0, -0.215] }, // 往後伸進拱頂弧形槽的銷
      ],
    },
    { id: "sector", kind: "gear", center: O, teeth: SECTOR.teeth, radius: SECTOR.radius, span: [deg(-128), deg(-52)], width: 0.14, arrow: false },
    { id: "rack", kind: "rack", center: [0, RACK_Y, 0], teeth: 14, pitch: rackDef.pitch, width: 0.14, depth: 0.2, arrow: false, pieces: [{ kind: "box", size: [4.2, 0.16, 0.14], at: [0, -0.32, 0] }] },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, radius: PULLEY.radius, width: 0.12 },
    { id: "rope", kind: "rope" },
    { id: "weight", kind: "box", size: [0.4, 0.8, 0.4] },
  ],
  driver: { part: "disc", type: "rotation" },
  targets: ["rack", "weight"], // 下端的齒條與上端的重物
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { rack, angle } = motion(theta);
    const { y, rope } = weight(theta);
    const end = rope.points[rope.points.length - 1];
    const points = [...rope.points.slice(0, -1), [end[0], y, end[2]]];
    const turn = ((y - weight(0).y) / PULLEY.radius) * -1;
    return {
      parts: {
        disc: { angle: theta },
        bar: { angle },
        sector: { angle: sectorAngle(theta) },
        rack: { position: [rack, RACK_Y, 0] },
        pulley: { angle: turn },
        weight: { position: [end[0], y - 0.4, 0.3] },
      },
      paths: { rope: { points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["sector", "rack"], reason: "簡化齒形:扇形齒與齒條的梯形齒齒側互相擦到 0.06" },
  ],
};
