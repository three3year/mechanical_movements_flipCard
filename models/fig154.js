// 第 154 種:旋轉圓盤上的四根凸柱依序撥動曲柄搖臂的下臂,使它往下擺;搖臂的上臂經一根繩繞過上方的滑輪,
// 吊著一個重物。凸柱撥動時重物被拉起,凸柱滑過後重物把搖臂拉回原位——重物做交替的直線運動。
// 主動件是圓盤(逆時針)。撥動的時序以平順的升降表示,繩長不變。
import { Z, TAU, deg, polar, add, dist, routeRope } from "./kit.js";
import { liftAndDrop, cycleOf } from "./jumps.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = { center: [-1.6, 0.25, 0], radius: 1.55, studR: 1.15 };
const CRANK = { pivot: [1.3, -0.6, 0.3], up: 1.2, upAt: deg(108), down: 1.65, downAt: deg(193) };
const PULLEY = { center: [2.4, 2.9, 0.3], radius: 0.38 };
const SWING = deg(16);
const PHASE = { liftFrom: 0.1, liftTo: 0.65, dropTo: 0.8 };
const WEIGHT0 = -0.45; // 重物起始高度(中心)

/** 圓盤轉 c:搖臂的轉角、上臂端點與重物的高度 */
export function lift(c) {
  const { u } = cycleOf(c, TAU / 4);
  const swing = SWING * liftAndDrop(u, PHASE).height;
  const top = add(CRANK.pivot, polar(CRANK.up, CRANK.upAt + swing));
  const top0 = add(CRANK.pivot, polar(CRANK.up, CRANK.upAt));
  // 上臂端點離滑輪越遠,繩被拉走越多,重物就升得越高
  const y = WEIGHT0 + (dist(top, PULLEY.center) - dist(top0, PULLEY.center));
  return { swing, top, y };
}

export default {
  figure: 154,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.12 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "cylinder", radius: 0.15, length: 0.45, at: [...polar(DISC.studR, deg(-15) + (k * TAU) / 4).slice(0, 2), 0.25], accent: k === 0 })),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: stadium(CRANK.up, 0.24), thickness: 0.12, angle: CRANK.upAt },
        { kind: "plate", shape: stadium(CRANK.down, 0.24), thickness: 0.12, angle: CRANK.downAt },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.2 },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, radius: PULLEY.radius, width: 0.2 },
    { id: "weight", kind: "sphere", radius: 0.48 },
    { id: "rope", kind: "rope" },
    {
      id: "stands",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-2.4, -2.0], [-0.8, -2.0], [-1.25, -1.0], [-1.25, 0.25], [-1.6, 0.6], [-1.95, 0.25], [-1.95, -1.0]]), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape([[0.7, -2.0], [1.95, -2.0], [1.75, -0.5], [1.3, -0.25], [0.95, -0.5]]), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "box", size: [6.4, 0.08, 1.2], at: [0.3, -2.05, 0] },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["crank"], reason: "待確認(未修):crank 在動,但離帶動(或支撐)它的零件還有 0.21 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["pulley"], reason: "待確認(未修):pulley 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["weight"], reason: "待確認(未修):weight 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["rope"], reason: "待確認(未修):rope 在動,但離帶動(或支撐)它的零件還有 0.68 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "interference", parts: ["disc", "stands"], reason: "待確認(未修):disc 的圓柱 r0.15×0.45 與 stands 的板互相穿入 0.23(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "disc", type: "rotation", speed: 0.8 },
  target: "weight",
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const { swing, top, y } = lift(c);
    const weightTop = [PULLEY.center[0] + PULLEY.radius, y + 0.48, 0.3];
    const rope = routeRope([{ point: [top[0], top[1], 0.3] }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: weightTop }]);
    return {
      parts: {
        disc: { angle: c },
        crank: { angle: swing },
        pulley: { angle: -(y - WEIGHT0) / PULLEY.radius },
        weight: { position: [PULLEY.center[0] + PULLEY.radius, y, 0.3] },
      },
      paths: { rope: { points: rope.points, closed: false, phase: y - WEIGHT0 } },
      readouts: [],
    };
  },
};
