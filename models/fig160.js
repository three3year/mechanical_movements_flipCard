// 第 160 種:交替的曲線運動轉換為交替的圓周運動(彈竿車床)。踏板左端樞接在地上;一條帶子從踏板往上,
// 在皮帶輪上繞一圈,上端繫在頂部的彈性竿上。踩下踏板,帶子拉動皮帶輪轉、把竿頭拉彎;放開時竿把踏板抬起,
// 皮帶輪反轉。主動件是踏板。皮帶輪轉過的弧長等於帶子被拉下的長度。
import { Z, deg, polar, add, TAU } from "./kit.js";
import { shape } from "./shapes.js";

const PIVOT = [-1.9, -1.55, 0.3];
const TREADLE = 3.9;
const AT = 3.0; // 帶子接在踏板上離樞軸的距離
const PULLEY = { center: [0.85, 0.65, 0], radius: 0.55 };
const STRAP_X = PULLEY.center[0] + PULLEY.radius;
const POLE = { base: [-3.3, 1.6, 0], tip: [STRAP_X, 2.65, 0] };
const REST = deg(7);
const RANGE = [deg(-6), REST];

/** 踏板轉角 psi:帶子在踏板上的接點、被拉下的長度與皮帶輪的轉角 */
export function lathe(psi) {
  const j = add(PIVOT, polar(AT, psi));
  const j0 = add(PIVOT, polar(AT, REST));
  const pull = j0[1] - j[1];
  return { j, pull, pulley: -pull / PULLEY.radius };
}

// 彈性竿:竿頭被拉下 pull 時的彎曲形狀(二次曲線,根部固定)
const polePoints = (pull) =>
  Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    const x = POLE.base[0] + (POLE.tip[0] - POLE.base[0]) * t;
    const y = POLE.base[1] + (POLE.tip[1] + 0.25 - POLE.base[1]) * Math.sin((t * Math.PI) / 2) - pull * t * t;
    return [x, y, 0];
  });

// 帶子:踏板上的接點 → 往上沿皮帶輪右側 → 繞輪一圈 → 往上到竿頭
const strap = (j, tipY) => {
  const r = PULLEY.radius + 0.04;
  const pts = [[j[0], j[1], 0.05]];
  for (let i = 0; i <= 48; i++) {
    const a = (TAU * i) / 48;
    pts.push([PULLEY.center[0] + r * Math.cos(a), PULLEY.center[1] + r * Math.sin(a), 0.05 - 0.1 * (i / 48)]);
  }
  pts.push([STRAP_X, tipY, -0.05]);
  return pts;
};

export default {
  figure: 160,
  parts: [
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "box", size: [TREADLE, 0.18, 0.2], at: [TREADLE / 2, 0, 0] }, { kind: "cylinder", radius: 0.26, inner: 0.1, length: 0.3 }],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, radius: PULLEY.radius, width: 0.3, axis: Z },
    { id: "pole", kind: "rod", radius: 0.12 },
    { id: "strap", kind: "rope" },
    { id: "stand", kind: "plate", center: [PIVOT[0], -1.95, 0.1], shape: shape([[-0.5, 0], [0.5, 0], [0.25, 0.4], [-0.25, 0.4]]), thickness: 0.3 },
    { id: "ground", kind: "box", center: [0, -2.0, 0], size: [6.6, 0.08, 1.4] },
  ],
  driver: { part: "treadle", type: "rotation", range: RANGE, initial: REST },
  view: { direction: [0.06, 0.05, 1] },
  pose(psi) {
    const { j, pull, pulley } = lathe(psi);
    const pole = polePoints(pull);
    const tip = pole[pole.length - 1];
    return {
      parts: { treadle: { angle: psi }, pulley: { angle: pulley } },
      paths: { pole: { points: pole, closed: false }, strap: { points: strap(j, tip[1]), closed: false, phase: -pull } },
      readouts: [],
    };
  },
};

