// 第 201 種:左上方形狀不規則的齒輪帶動小齒輪,小齒輪的連續旋轉給水平臂變速的振動,並給桿 A 變速的往復運動。
// 小齒輪裝在一支直立臂的上端,直立臂與水平臂是一體的曲柄,繞下方大輪的中心擺動;不規則齒輪轉動時接觸半徑一直在變,
// 小齒輪被壓著保持咬合,直立臂(連同水平臂)就跟著擺動;水平臂末端的長槽帶著滑塊,推動直立的桿 A 上下。
// 小齒輪軸上的皮帶輪以皮帶把小齒輪的轉動傳到大輪(大輪中心就是擺動的樞軸,皮帶長度不變)。主動件是不規則齒輪。
// 推斷:不規則齒輪的節曲線(蛋形,依原圖輪廓);桿 A 由導槽限制只能上下;皮帶輪大小。
import { TAU, deg, Z, routeBelt } from "./kit.js";
import { swingMesh } from "./swing-mesh.js";
import { noncircularOutline, samplePitch, arcAt } from "./noncircular.js";
import { shape, circle, stadium } from "./shapes.js";

const r = (phi) => 0.72 + 0.32 * Math.cos(phi - deg(200));
const NP = 10;
const TEETH = Math.round(samplePitch(r).length / 0.24);
const PITCH = samplePitch(r).length / TEETH;
const RP = (NP * PITCH) / TAU;
const GEAR = [-0.75, 3.67, 0];
const PIVOT = [0, 0, 0];
const P0 = [GEAR[0] + r(0) + RP, GEAR[1], 0]; // 原圖:小齒輪在不規則齒輪右邊,以局部角 0 接觸
const ARM = Math.hypot(P0[0], P0[1]);
const mesh = swingMesh({ r, fixed: GEAR, rp: RP, pivot: PIVOT, arm: ARM, side: 1 });
const START = mesh.state(0);
const PULLEY = 0.58;
const WHEEL = 1.55;
const SLOT_X = -2.25; // 桿 A 的位置

/** 不規則齒輪轉 angle(順時針為負):小齒輪軸心、不規則齒輪的轉角(START.gear + angle)、曲柄的擺角(從直立量起)、小齒輪與大輪的轉角、桿 A 的高度 */
export function motion(angle) {
  const s = mesh.byGear(START.gear + angle);
  const swing = s.arm - Math.PI / 2;
  const pinion = s.pinion - START.pinion;
  const wheel = swing + (pinion - swing) * (PULLEY / WHEEL);
  return { center: s.center, gear: s.gear, swing, pinion, wheel, rodA: SLOT_X * Math.tan(swing) };
}

const outline = noncircularOutline(r, { teeth: TEETH, addendum: PITCH / Math.PI, dedendum: (1.2 * PITCH) / Math.PI, start: arcAt(r, 0) });

export default {
  figure: 201,
  parts: [
    { id: "gear", kind: "plate", center: GEAR, shape: { outline, holes: [circle(0.1).reverse()] }, thickness: 0.22, hub: 0.22, circles: [0.32], mark: [-0.6, -0.3], markSize: 0.08, spin: 1.15 },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.22, pieces: [{ kind: "cylinder", radius: PULLEY, length: 0.12, at: [0, 0, -0.35] }, { kind: "cylinder", radius: 0.08, length: 0.9, at: [0, 0, -0.2] }] },
    { id: "wheel", kind: "pulley", center: [0, 0, -0.35], radius: WHEEL, width: 0.3, style: "disc" },
    { id: "belt", kind: "belt" },
    {
      id: "crank",
      kind: "group",
      center: [0, 0, 0.2],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.38, 0], [0.38, 0], [0.2, ARM], [-0.2, ARM]]), thickness: 0.12 },
        { kind: "plate", shape: shape([[0, -0.25], [0, 0.25], [SLOT_X + 0.3, 0.17], [SLOT_X + 0.3, -0.17]]), thickness: 0.12 },
        { kind: "plate", shape: shape(stadium(1.2, 0.62).outline.map(([x, y]) => [x + SLOT_X - 0.75, y]), [stadium(0.95, 0.32).outline.map(([x, y]) => [x + SLOT_X - 0.62, y]).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.55, inner: 0.15, length: 0.3 },
      ],
    },
    { id: "rodA", kind: "group", label: "A", labelOffset: [-0.3, -1.5, 0], pieces: [{ kind: "box", size: [0.14, 1.8, 0.14], at: [0, -1.0, 0.35] }, { kind: "box", size: [0.3, 0.3, 0.3], at: [0, 0, 0.35] }, { kind: "cylinder", radius: 0.15, length: 0.5, at: [0, 0, 0.4] }] },
  ],
  driver: { part: "gear", type: "rotation", speed: 1.2 },
  target: "rodA",
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const m = motion(angle);
    const belt = routeBelt([
      { center: [m.center[0], m.center[1], -0.35], axis: Z, radius: PULLEY, sense: 1 },
      { center: [0, 0, -0.35], axis: Z, radius: WHEEL, sense: 1 },
    ]);
    return {
      parts: {
        gear: { angle: m.gear }, // = START.gear + angle:原圖位置時接觸點在不規則齒輪的局部角 0,那裡是一齒的中心
        pinion: { position: m.center, angle: START.gamma + Math.PI / NP + m.pinion }, // 原圖位置時接觸方向上是齒槽
        wheel: { angle: m.wheel },
        crank: { angle: m.swing },
        rodA: { position: [SLOT_X, m.rodA, 0] },
      },
      paths: { belt: { points: belt.points, closed: true, phase: (m.pinion - m.swing) * PULLEY } },
      readouts: [],
    };
  },
};
