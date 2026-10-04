// 第 154 種:旋轉圓盤上的四根凸柱依序撥動曲柄搖臂的下臂,使它往下擺;搖臂的上臂經一根繩繞過上方的滑輪,
// 吊著一個重物。凸柱撥動時重物被拉起,凸柱滑過後重物把搖臂拉回原位——重物做交替的直線運動。
// 主動件是圓盤(順時針:凸柱從上方壓下臂,實物才撥得動)。搖臂的擺角由凸柱與下臂的接觸算,滑脫後重物加速落回;繩長不變。
import { Z, TAU, deg, polar, add, dist, routeRope } from "./kit.js";
import { placeOutline, swingUntilContact, circlePolygon, withFall } from "./contact.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = { center: [-1.6, 0.25, 0], radius: 1.55, studR: 1.15 };
// 下臂伸到圓盤右側凸柱的路徑上:圓盤順時針轉,凸柱在這一側往下走、把下臂的端頭往下壓(原圖下臂沒碰到凸柱的路徑,
// 照畫帶不動;實物可行優先)。原文沒有寫圓盤的轉向
const CRANK = { pivot: [1.3, -0.6, 0.3], up: 1.2, upAt: deg(108), down: 2.05, downAt: deg(173) };
const PULLEY = { center: [2.4, 2.9, 0.3], radius: 0.38 };
const STUD = 0.15;
const SWEEP = deg(40);
const WEIGHT0 = -0.45; // 重物起始高度(中心)

const DOWN_ARM = placeOutline(stadium(CRANK.down, 0.24).outline, [0, 0], CRANK.downAt);
// 重物經繩把搖臂往順時針拉;下臂靠在凸柱上時的轉角(沒有凸柱頂著就回到擋銷,為 0)
const resting = (c) => {
  const studs = [0, 1, 2, 3].map((k) => circlePolygon(add(DISC.center, polar(DISC.studR, deg(-15) + (k * TAU) / 4 - c)), STUD, 16));
  return Math.max(0, swingUntilContact({ pivot: CRANK.pivot, outline: DOWN_ARM, from: SWEEP, into: -1, sweep: SWEEP }, studs));
};
const eased = withFall(resting, TAU / 4, deg(6));

/** 圓盤順時針轉過 c:搖臂的轉角、上臂端點與重物的高度。凸柱壓下臂時由接觸算,滑脫後重物加速落回 */
export function lift(c) {
  const swing = eased(c);
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
        ...[0, 1, 2, 3].map((k) => ({ kind: "cylinder", radius: STUD, length: 0.45, at: [...polar(DISC.studR, deg(-15) + (k * TAU) / 4).slice(0, 2), 0.25], accent: k === 0 })),
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
        // 兩座支架在圓盤與搖臂的後面,各伸出一根軸;搖臂回到原位時靠在擋銷上(擋銷是推斷)
        { kind: "plate", shape: shape([[-2.4, -2.0], [-0.8, -2.0], [-1.25, -1.0], [-1.25, 0.25], [-1.6, 0.6], [-1.95, 0.25], [-1.95, -1.0]]), thickness: 0.3, at: [0, 0, -0.25] },
        { kind: "plate", shape: shape([[0.2, -2.0], [1.95, -2.0], [1.75, -0.5], [1.3, -0.25], [0.2, -0.05]]), thickness: 0.3, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.11, length: 0.5, at: [DISC.center[0], DISC.center[1], -0.15] },
        { kind: "cylinder", radius: 0.09, length: 0.8, at: [CRANK.pivot[0], CRANK.pivot[1], 0] },
        { kind: "cylinder", radius: 0.08, length: 0.7, at: [0.31, -0.27, 0.05] },
        { kind: "box", size: [6.4, 0.08, 1.2], at: [0.3, -2.05, 0] },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation", speed: -0.8 },
  target: "weight",
  // 動力重演:只推圓盤;搖臂繞樞軸自由擺動,重物經繩把它往回拉(以彈簧代表),回到擋銷為止
  replay: {
    from: 0,
    to: -TAU / 4,
    free: { crank: { spring: -1, limits: [0, 1.2], gravity: false } },
    ignore: [["crank", "stands"]], // 樞軸與擋銷由樞軸約束與 limits 代表
    expect: [
      { at: -0.6, part: "crank", label: "凸柱把下臂壓到最低,重物被拉起", quote: "凸柱依序撥動" },
      { at: -1.3, part: "crank", label: "凸柱滑過後重物把搖臂拉回原位" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { swing, top, y } = lift(-v);
    const weightTop = [PULLEY.center[0] + PULLEY.radius, y + 0.48, 0.3];
    const rope = routeRope([{ point: [top[0], top[1], 0.3] }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: weightTop }]);
    return {
      parts: {
        disc: { angle: v },
        crank: { angle: swing },
        pulley: { angle: -(y - WEIGHT0) / PULLEY.radius },
        weight: { position: [PULLEY.center[0] + PULLEY.radius, y, 0.3] },
      },
      paths: { rope: { points: rope.points, closed: false, phase: y - WEIGHT0 } },
      readouts: [],
    };
  },
};
