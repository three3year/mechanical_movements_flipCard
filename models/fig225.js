// 第 225 種:搖臂振動,經它承載的棘爪給棘輪間歇的圓周運動。直立的搖臂下端以樞軸裝在台座上,上端以銷掛著
// 一根長棘爪,棘爪的另一端靠自重搭在棘輪頂上的齒間。搖臂往左擺時棘爪頂著齒的直面推,棘輪逆時針轉;
// 往右擺時棘爪被齒背頂起、滑過齒尖再落進下一格,棘輪不動。主動量是搖臂的累計擺動量。
//
// 接觸(由接觸算,共用 pawl-drive.js):棘爪鉸在搖臂頂的銷上,爪尖是一個圓頭,和棘輪的齒畫在同一層;
// 推多遠、何時滑過齒尖、落回多深,都由爪尖與鋸齒相碰算出。每一程前進的齒數也由接觸決定(擺幅約兩齒多一點,
// 回程爪尖落進下一格前有一小段空行程,所以每推一次前進兩齒)。
// 推斷:棘爪靠自重落在齒上(原文沒提彈簧);棘輪的軸與後面的軸承座(原圖只畫輪轂)。
import { TAU, polar, add, swingPhase } from "./kit.js";
import { ratchetShape, shape, thickLine, rect, circle } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { circlePolygon } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const WHEEL = { center: [0, 0, 0], teeth: 24, outer: 1.78, inner: 1.42, dir: 1 };
const PITCH = TAU / WHEEL.teeth;
const PIVOT = [2.5, -2.6, 0];
const LEVER = 5.2;
const PAWL = 2.75; // 銷到爪尖圓頭中心:推程的中點,爪尖在輪頂(原圖)
const NUB = 0.09; // 爪尖圓頭的半徑
const SWING = 0.106; // 單程擺幅:爪尖走約 1.3 個齒距(回程滑過一齒落進下一格,多出來的是空行程)
const FROM = -SWING / 2;
const Z = { pawl: 0.2, lever: 0.34 }; // 棘爪的桿身在棘輪前面,爪尖的圓頭往後伸到齒那一層

const top = (psi) => add(PIVOT, polar(LEVER, Math.PI / 2 + psi));
const NUB_OUTLINE = circlePolygon([PAWL, 0], NUB, 16);

const drive = pawlDrive({
  period: 2 * SWING,
  pins: (v) => ({ pawl: top(swingPhase(v, FROM, -FROM).at).slice(0, 2) }),
  wheel: { obstacles: (theta) => ratchetObstacles(WHEEL, theta), dir: 1, pitch: PITCH },
  pawls: { pawl: { outline: NUB_OUTLINE, into: 1, angle: Math.PI + 0.45, pushes: (v) => swingPhase(v, FROM, -FROM).forward } },
});

/** 主動量 v(搖臂累計擺動):搖臂轉角、棘輪轉角(自起點)與棘爪的轉角 */
export function ratchet(v) {
  const { at: psi } = swingPhase(v, FROM, -FROM);
  const s = drive.at(v);
  return { psi, wheel: s.wheel - drive.at(0).wheel, pawl: s.angles.pawl };
}
export const step = drive.step;
export const pitch = PITCH;
export const swing = SWING;
/** 檢查用:主動量 v 時爪尖與棘輪的齒(世界座標 2D) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { tip: s.pawls.pawl, teeth: s.wheel };
};
const W0 = drive.at(0).wheel;

export default {
  figure: 225,
  parts: [
    { id: "wheel", kind: "plate", shape: ratchetShape({ ...WHEEL, bore: 0.15 }), thickness: 0.22, hub: 0.38, circles: [0.55], mark: [1.0, 0], markSize: 0.09, spin: WHEEL.outer },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, LEVER]], 0.22)), thickness: 0.12, at: [0, 0, Z.lever] }, // 搖臂在棘爪的前面
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.3, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [0, LEVER, Z.pawl + 0.07] }, // 掛棘爪的銷往後伸
      ],
    },
    {
      id: "pawl",
      kind: "group",
      center: [...top(0).slice(0, 2), Z.pawl],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [PAWL, 0]], 0.2), [circle(0.065).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: NUB, length: 0.3, at: [PAWL, 0, -0.17] }, // 爪尖的圓頭,伸到齒那一層
      ],
    },
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.5, -0.35], [0.5, -0.35], [0.3, 0.05], [-0.3, 0.05]]), thickness: 0.3, at: [PIVOT[0], PIVOT[1] - 0.05, 0.2] },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [PIVOT[0], PIVOT[1], 0.25] }, // 搖臂的樞軸銷
        { kind: "plate", shape: shape(rect(5.6, 0.12, 0.3, PIVOT[1] - 0.46)), thickness: 0.9, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.12, length: 0.55, at: [0, 0, -0.3] }, // 棘輪的軸
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.12, floor: PIVOT[1] - 0.4 }),
      ],
    },
  ],
  // 動力重演:只推搖臂;棘爪掛在搖臂頂的銷上靠自重搭在齒上,棘輪靠摩擦定位,由棘爪推動
  replay: {
    to: 4 * SWING,
    seconds: 16,
    free: { wheel: { hold: true, gravity: false }, pawl: { on: "lever" } },
    expect: [
      { at: SWING, part: "wheel", label: "往左擺一程,棘爪推著棘輪轉", quote: "由承載棘爪的搖臂之振動運動所產生的棘輪之間歇圓周運動" },
      { at: 2 * SWING, part: "wheel", label: "往右擺回,棘爪滑過齒背,棘輪不動" },
      { at: 4 * SWING, part: "wheel", label: "兩個來回後的位置" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [FROM, -FROM] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { psi } = ratchet(v);
    const s = drive.at(v);
    const t = top(psi);
    return {
      parts: {
        wheel: { angle: s.wheel - W0 },
        lever: { angle: psi },
        pawl: { position: [t[0], t[1], Z.pawl], angle: s.angles.pawl },
      },
      readouts: [],
    };
  },
};
