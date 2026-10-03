// 第 57 種:頂部的小皮帶輪為驅動端。開口皮帶帶動內側有齒的大齒輪(繞在它的外緣),
// 交叉皮帶帶動同心的小齒輪(繞在它的輪轂),兩者因而反向轉;底部的中間小齒輪同時與兩者咬合,
// 既繞自己的中心轉,也繞兩個同心齒輪的共同中心公轉。
// 行星的自轉角在「行星架座標」裡算:架上看,小齒輪與行星是定軸外咬合(meshAngle),再加上架的轉角;
// 若直接拿行星當下的位置去 meshAngle,咬合相位的整數齒距會隨公轉跳動(每轉幾度就跳一齒,看起來像瞬移)。
import { Z, polar, routeBelt, beltTravel, wheelAngle } from "./kit.js";
import { meshAngle } from "./gears.js";

const M = 0.075;
const RING = { center: [0, 0, 0], teeth: 40, radius: (40 * M) / 2, internal: true };
const SUN = { center: [0, 0, 0], teeth: 20, radius: (20 * M) / 2 };
const NP = 10;
const RP = (NP * M) / 2;
const ORBIT = SUN.radius + RP;
const TOP = { center: [0, 3.1, 0], radius: 0.62 };
const RIM = 1.86; // 大齒輪外緣(開口皮帶)
const HUB = 0.42; // 小齒輪輪轂(交叉皮帶)
const Z_OPEN = -0.12;
const Z_CROSS = 0.3;

const openBelt = routeBelt([
  { center: [TOP.center[0], TOP.center[1], Z_OPEN], axis: Z, radius: TOP.radius, sense: 1 },
  { center: [0, 0, Z_OPEN], axis: Z, radius: RIM, sense: 1 },
]);
const crossBelt = routeBelt([
  { center: [TOP.center[0], TOP.center[1], Z_CROSS], axis: Z, radius: TOP.radius, sense: 1 },
  { center: [0, 0, Z_CROSS], axis: Z, radius: HUB, sense: -1 },
]);

const START = -Math.PI / 2; // 原圖:中間小齒輪在下方
const PLANET_HOME = { center: polar(ORBIT, START), teeth: NP, radius: RP }; // 行星在行星架座標裡的位置(固定)

/** 頂輪轉 angle 時:大齒輪、小齒輪(同心)、行星的公轉角與自轉角 */
export function train(angle) {
  const travel = beltTravel(angle, TOP.radius, 1);
  const ring = wheelAngle(travel, RIM, 1);
  const sun = wheelAngle(travel, HUB, -1);
  // 周轉輪系:行星架轉速 = (N環·ω環 + N日·ω日) ÷ (N環 + N日)
  const carrier = START + (RING.teeth * ring + SUN.teeth * sun) / (RING.teeth + SUN.teeth);
  const center = [ORBIT * Math.cos(carrier), ORBIT * Math.sin(carrier), 0];
  // 行星架座標裡小齒輪轉了 sun − 架角,行星依定軸咬合跟著轉;回到世界座標再加上架角(連續,相位不跳)
  const swung = carrier - START;
  const planet = swung + meshAngle(SUN, PLANET_HOME, sun - swung);
  return { ring, sun, carrier, center, planet };
}

export const teeth = { ring: RING.teeth, sun: SUN.teeth, planet: NP };

export default {
  figure: 57,
  parts: [
    {
      id: "top",
      kind: "pulley",
      style: "disc",
      center: [...TOP.center.slice(0, 2), 0.09],
      radius: TOP.radius,
      width: 0.62,
      pieces: [
        { kind: "plate", shape: { outline: [[0, -0.07], [0.62, -0.05], [0.62, 0.05], [0, 0.07]], holes: [] }, thickness: 0.08, at: [-0.62, 0.08, 0.38], angle: 0.32 },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [-0.6, 0.27, 0.5] },
      ],
    },
    {
      id: "ring",
      kind: "gear",
      internal: true,
      teeth: RING.teeth,
      radius: RING.radius,
      rim: RIM - 0.04,
      width: 0.36,
    },
    {
      id: "sun",
      kind: "gear",
      teeth: SUN.teeth,
      radius: SUN.radius,
      width: 0.3,
      bore: 0.12,
      pieces: [{ kind: "cylinder", radius: HUB, length: 0.3, at: [0, 0, Z_CROSS] }],
    },
    { id: "planet", kind: "gear", teeth: NP, radius: RP, width: 0.3, web: false },
    { id: "openBelt", kind: "belt" },
    { id: "crossBelt", kind: "belt" },
  ],
  driver: { part: "top", type: "rotation" },

  target: "planet",
  view: { direction: [0.1, 0.06, 1] },
  pose(angle) {
    const { ring, sun, center, planet } = train(angle);
    const travel = beltTravel(angle, TOP.radius, 1);
    return {
      parts: { top: { angle }, ring: { angle: ring }, sun: { angle: sun }, planet: { position: center, angle: planet } },
      paths: {
        openBelt: { points: openBelt.points, closed: true, phase: travel },
        crossBelt: { points: crossBelt.points, closed: true, phase: travel },
      },
      readouts: [],
    };
  },
};
