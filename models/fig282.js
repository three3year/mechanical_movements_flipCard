// 第 282 種:固定有銷的圓盤旋轉,銷在直立桿的長槽裡作動;直立桿繞靠近底部的中心擺動,兩端都左右橫移。
// 桿下端的齒扇形段讓底部的水平齒條桿交替地左右直線移動;桿上端經一條繩繞過右上的滑輪,
// 吊著重物上下交替移動。主動件是圓盤。
// 推斷:繩繞過滑輪的走法與重物的高度(依原圖)。
import { Z, deg, routeRope } from "./kit.js";
import { crankPin, angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const DISC = { center: [-0.15, 0.55, -0.3], radius: 1.35, pin: 0.75 };
const O = [0, -1.45, 0]; // 直立桿的擺動中心
const TOP = 3.55; // 擺動中心到桿頂的距離
const SECTOR = { teeth: 32, radius: 0.72 }; // 齒扇形段(整圈的齒數)
const RACK_Y = O[1] - SECTOR.radius;
const PULLEY = { center: [2.15, 2.0, 0.3], radius: 0.32 };
const ROPE_DROP = 0.9;

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

export default {
  figure: 282,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.2, 1.0], at: [0, -2.45, 0] },
        { kind: "plate", shape: shape(thickLine([[-2.0, -2.35], [-2.0, 2.3], [-0.5, 2.75], [1.5, 2.75], [2.2, 2.3]], 0.22)), thickness: 0.2, at: [0, 0, -0.55] },
        { kind: "box", size: [0.22, 4.6, 0.2], at: [1.75, 0, -0.55] },
        { kind: "box", size: [0.5, 0.18, 0.18], at: [2.0, 2.0, 0.1] },
      ],
    },
    { id: "disc", kind: "plate", center: DISC.center, shape: shape(circle(DISC.radius), [circle(0.1).reverse()]), thickness: 0.2, hub: 0.22, mark: [DISC.radius - 0.15, 0], markSize: 0.08, spin: DISC.radius, pieces: [{ kind: "cylinder", radius: 0.09, length: 0.65, at: [DISC.pin, 0, 0.3], accent: true }] },
    {
      id: "bar",
      kind: "group",
      center: O,
      arrow: false,
      pieces: [
        // 有長槽的直立桿(沿局部 +x)
        { kind: "plate", shape: shape(rect(TOP + 0.4, 0.42, TOP / 2 - 0.1, 0), [rect(2.2, 0.2, 1.65 + 0.6, 0).reverse()]), thickness: 0.14, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.12, length: 0.5 },
      ],
    },
    { id: "sector", kind: "gear", center: O, teeth: SECTOR.teeth, radius: SECTOR.radius, span: [deg(-128), deg(-52)], width: 0.14, arrow: false },
    { id: "rack", kind: "rack", center: [0, RACK_Y, 0], teeth: 14, pitch: rackDef.pitch, width: 0.14, depth: 0.2, arrow: false, pieces: [{ kind: "box", size: [4.2, 0.16, 0.14], at: [0, -0.32, 0] }] },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, radius: PULLEY.radius, width: 0.12 },
    { id: "rope", kind: "rope" },
    { id: "weight", kind: "box", size: [0.4, 0.8, 0.4] },
  ],
  driver: { part: "disc", type: "rotation" },
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
};
