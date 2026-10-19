// 調速器的被調節對象(推斷,第 274、287 種共用;原圖都只畫到調速器本身):
// 套筒下端車出一道環槽;叉形槓桿的兩支叉臂跨在套筒兩側,叉臂上的銷伸進環槽,套筒升降時把槓桿的這一端帶著升降
// (做法照第 161 種,槓桿的樞軸在左邊的立柱上)。槓桿中段接一根閥桿,往下拉節流閥(蝶形閥)閥軸上的曲柄:
// 套筒升高(轉得太快)→ 閥桿被往上拉 → 閥板轉向橫擋住蒸汽管 → 開度變小;套筒下降時相反。
// 平面在 xy:心軸在 x = 0,槓桿在 z = 0 那一層,閥桿與曲柄在前面一層,蒸汽管在後面(z = pipeZ)。
// 回傳要併進套筒群組的環槽各塊、要併進機架群組的立柱 / 樞軸銷 / 蒸汽管、會動的三個零件(lever、valveRod、valve),
// 以及由環槽高度算姿勢的 pose()。
import { X, Y, Z, clamp } from "./kit.js";
import { shape } from "./shapes.js";

const PIN_CLEAR = 0.002; // 叉臂上的銷與環槽上下兩壁的間隙(銷直徑 = 槽寬 − 2·間隙)
const ARM = { t: 0.06, out: 0.05 }; // 叉臂的厚度;叉臂中心在環槽外徑之外多少
const ROD_Z = 0.2; // 閥桿那一層
const CRANK_Z = 0.14; // 曲柄臂那一層
const PIPE = { r: 0.15, bore: 0.11, chest: 0.21 };

/**
 * pivot:槓桿樞軸 [x, y](心軸在 x = 0,叉臂的銷在樞軸右方 −pivot[0] 處);rodAt:閥桿接在槓桿上離樞軸多遠;
 * crank:閥軸上曲柄的半徑;drop:閥桿長;groove:{ top(槽頂離套筒中心,負的)、height(槽寬)、neck(槽底半徑)、
 * outer(槽下凸緣的半徑,也是套筒本體的半徑)};range:[最低, 最高] 套筒高度;floor:地面;
 * postFloor:槓桿立柱的下端(立柱立在機架上時;省略時立在地面);pipeZ:蒸汽管所在的深度;
 * pipeEnds:[左, 右] 蒸汽管兩端往下轉進地面的地方(省略時緊靠樞軸與閥室兩側)。
 */
export function throttle({ pivot: [px, py], rodAt = 0.55, crank = 0.22, drop = 0.9, groove, range, floor, postFloor = floor, pipeZ = -0.5, pipeEnds }) {
  const L = -px; // 樞軸到叉臂銷的距離
  const pinR = groove.height / 2 - PIN_CLEAR;
  const armZ = groove.outer + ARM.out;
  const grooveY = (sleeve) => sleeve + groove.top - groove.height / 2; // 環槽中線的高度
  const angleAt = (sleeve) => Math.asin(clamp((grooveY(sleeve) - py) / L, -1, 1));
  const rodPin = (a) => [px + rodAt * Math.cos(a), py + rodAt * Math.sin(a)];
  // 閥軸:套筒在行程中點時,曲柄水平朝右、閥桿直立
  const mid = rodPin(angleAt((range[0] + range[1]) / 2));
  const O = [mid[0] - crank, mid[1] - drop];
  // 曲柄銷:以閥軸為圓心、半徑 crank 的圓,和以閥桿上端為圓心、半徑 drop 的圓的交點(曲柄朝右的那一個)
  const crankAngle = (sleeve) => {
    const A = rodPin(angleAt(sleeve));
    const d = Math.hypot(A[0] - O[0], A[1] - O[1]);
    const u = [(A[0] - O[0]) / d, (A[1] - O[1]) / d];
    const along = (d * d + crank * crank - drop * drop) / (2 * d);
    const h = Math.sqrt(Math.max(0, crank * crank - along * along));
    return Math.atan2(along * u[1] - h * u[0], along * u[0] + h * u[1]);
  };
  const OPEN = crankAngle(range[0]); // 套筒在最低處時閥板順著管子(全開)
  /** 套筒高度 → 槓桿轉角、閥桿上端、曲柄轉角、閥板轉角(0 全開、π/2 全關)與開度 */
  function solve(sleeve) {
    const lever = angleAt(sleeve);
    const crankA = crankAngle(sleeve);
    const disc = crankA - OPEN;
    return { lever, crank: crankA, disc, opening: 1 - Math.sin(clamp(disc, 0, Math.PI / 2)) };
  }

  const [pipeLeft, pipeRight] = pipeEnds ?? [px - 0.45, O[0] + 0.55];
  const sleevePieces = (extra = {}) => [
    { kind: "cylinder", axis: Y, radius: groove.neck, length: groove.height, at: [0, groove.top - groove.height / 2, 0], role: "groove", ...extra }, // 環槽的槽底(上下兩壁是套筒本體與下凸緣)
    { kind: "cylinder", axis: Y, radius: groove.outer, length: 0.07, at: [0, groove.top - groove.height - 0.035, 0], ...extra }, // 環槽下面的凸緣
  ];
  const framePieces = [
    // 槓桿樞軸的立柱(在槓桿後面)與樞軸銷
    { kind: "box", size: [0.16, py + 0.1 - postFloor, 0.1], at: [px, (py + 0.1 + postFloor) / 2, -0.13] },
    { kind: "cylinder", radius: 0.045, length: 0.3, at: [px, py, -0.04] },
    // 蒸汽管:從地面下(鍋爐)上來,經節流閥,再回到地面下(往汽缸);閥室比管子粗
    { kind: "cylinder", axis: X, radius: PIPE.r, inner: PIPE.bore, length: pipeRight - pipeLeft, at: [(pipeLeft + pipeRight) / 2, O[1], pipeZ] },
    ...[pipeLeft, pipeRight].map((x) => ({ kind: "cylinder", axis: Y, radius: PIPE.r, inner: PIPE.bore, length: O[1] + PIPE.r - floor, at: [x, (O[1] + PIPE.r + floor) / 2, pipeZ] })),
    { kind: "cylinder", axis: X, radius: PIPE.chest, inner: PIPE.bore, length: 0.36, at: [O[0], O[1], pipeZ] },
    { kind: "cylinder", radius: 0.07, inner: 0.03, length: 0.12, at: [O[0], O[1], pipeZ + PIPE.chest + 0.05] }, // 閥軸穿出閥室的軸承
  ];
  const plateEnd = L - groove.outer - 0.14;
  const parts = [
    {
      id: "lever",
      kind: "group",
      center: [px, py, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.1, inner: 0.045, length: 0.14 }, // 樞軸處的轂
        { kind: "plate", shape: shape([[0.07, -0.06], [plateEnd, -0.04], [plateEnd, 0.04], [0.07, 0.06]]), thickness: 0.08 },
        { kind: "box", size: [0.08, 0.08, 2 * armZ + ARM.t], at: [plateEnd, 0, 0] }, // 叉口的橫樑
        ...[-1, 1].flatMap((k) => [
          { kind: "box", size: [L + 0.05 - plateEnd, ARM.t, ARM.t], at: [(plateEnd + L + 0.05) / 2, 0, k * armZ] }, // 叉臂:跨在套筒兩側
          { kind: "cylinder", radius: pinR, length: armZ - groove.neck - 0.012, at: [L, 0, k * (armZ + groove.neck + 0.012) / 2], role: "forkPin" }, // 伸進環槽的銷
        ]),
        { kind: "cylinder", radius: 0.035, length: ROD_Z + 0.04, at: [rodAt, 0, (ROD_Z + 0.04) / 2], role: "rodPin" }, // 閥桿的銷
      ],
    },
    { id: "valveRod", kind: "link", width: 0.06, thickness: 0.05 },
    {
      id: "valve",
      kind: "group",
      center: [O[0], O[1], pipeZ],
      spin: crank,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.03, length: CRANK_Z - pipeZ + PIPE.chest + 0.02, at: [0, 0, (CRANK_Z - pipeZ - PIPE.chest - 0.02) / 2] }, // 閥軸:從閥室後壁穿到前面的曲柄
        { kind: "box", size: [crank + 0.08, 0.07, 0.05], at: [crank / 2, 0, CRANK_Z - pipeZ], accent: true }, // 曲柄臂
        { kind: "cylinder", radius: 0.035, length: ROD_Z - CRANK_Z + 0.06, at: [crank, 0, (ROD_Z + CRANK_Z) / 2 - pipeZ + 0.005], role: "crankPin" },
        // 閥板(在閥室裡):套筒最低時順著管子(板面朝上,全開)
        { kind: "cylinder", radius: PIPE.bore - 0.006, length: 0.015, axis: [Math.sin(OPEN), Math.cos(OPEN), 0], role: "disc" },
      ],
    },
  ];
  function pose(sleeve) {
    const s = solve(sleeve);
    const A = rodPin(s.lever);
    const C = [O[0] + crank * Math.cos(s.crank), O[1] + crank * Math.sin(s.crank)];
    return {
      lever: { angle: s.lever },
      valve: { angle: s.crank },
      valveRod: { from: [A[0], A[1], ROD_Z], to: [C[0], C[1], ROD_Z] },
    };
  }
  return { solve, pose, parts, framePieces, sleevePieces, grooveY, geometry: { L, pinR, rodAt, crank, drop, valve: O, pivot: [px, py] } };
}
