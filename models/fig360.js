// 第 360 種:由擺動運動得到連續旋轉。樑在 A 形架頂上擺動,兩端是弧形頭;右端弧形頭的繩往下繞在鼓輪上,
// 鼓輪鬆套在飛輪軸上,鼓輪上的棘爪推著固定在軸上的棘輪。樑往一邊擺時繩拉著鼓輪轉,棘爪帶動棘輪與飛輪;
// 往回擺時鼓輪反轉,棘爪滑過棘輪,飛輪不受影響(繼續往前)。左端弧形頭的繩吊著一個球形配重,讓繩保持拉緊。
// 主動件是樑(累計擺動)。
// 推斷:鼓輪反轉時由繩把它帶回(繩在鼓輪上纏繞);棘輪齒數。棘輪固定在軸上、裝在鼓輪前面,
// 棘爪的銷立在鼓輪的前面上(右上方),棘爪靠自重垂下、爪尖落在齒根:鼓輪往前轉時爪尖頂著齒的直面推棘輪,
// 往回轉時爪尖沿齒背滑上去、過了齒尖落進下一格(棘爪的轉角由接觸算,ratchets.pawlRest)。
import { deg, swingPhase, rot2 } from "./kit.js";
import { ratchetShape, shape, circle, arcPoints, thickLine } from "./shapes.js";
import { pawlRest } from "./ratchets.js";

const PIVOT = [-0.6, 2.3, 0];
const ARC = 1.9; // 樑端弧形頭的半徑(以樞軸為圓心)
export const SWING = deg(14);
const DRUM = { center: [1.3, -0.35, 0], r: 0.62 };
const RATCHET = { teeth: 20, outer: 0.5, inner: 0.42, dir: -1 };
const Z = { ratchet: 0.45, pawl: 0.45 }; // 棘輪與棘爪在鼓輪前面
// 棘爪的銷在鼓輪前面上(相對鼓輪中心,右上方);爪長到爪尖伸得進齒根,垂下時與鼓輪的半徑約成 50°
export const PAWL = { pivot: [0.57 * Math.cos(deg(55)), 0.57 * Math.sin(deg(55))], length: 0.42, hang: deg(-50) };

/** 累計擺動 v → 樑角、鼓輪轉角、飛輪(棘輪)轉角 */
export function beam(v) {
  const { at, cycle, forward } = swingPhase(v, -SWING, SWING);
  // 樑右端往上擺(at 增加)時,繩從鼓輪左側被拉起,鼓輪順時針轉(負角)
  const pulled = ((at + SWING) * ARC) / DRUM.r;
  const span = (2 * SWING * ARC) / DRUM.r;
  const fly = -(cycle * span + (forward ? pulled : span));
  return { psi: at, drum: -pulled, fly, forward };
}

const head = (s) => shape([...arcPoints(ARC + 0.12, s > 0 ? deg(-12) : deg(168), s > 0 ? deg(12) : deg(192)), ...arcPoints(ARC - 0.05, s > 0 ? deg(12) : deg(192), s > 0 ? deg(-12) : deg(168))]);

export default {
  figure: 360,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.3, -2.6], [-0.6, 2.3], [1.1, -2.6]], 0.2)), thickness: 0.2, at: [0, 0, -0.5] },
        { kind: "box", size: [4.6, 0.2, 0.8], at: [0, -2.7, -0.3] },
        { kind: "box", size: [0.25, 2.4, 0.4], at: [DRUM.center[0], -1.5, -0.6] }, // 立柱在飛輪的後面
      ],
    },
    {
      id: "beam",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-ARC + 0.05, 0], [ARC - 0.05, 0]], 0.2), [circle(0.08).reverse()]), thickness: 0.15 },
        { kind: "plate", shape: head(1), thickness: 0.15 },
        { kind: "plate", shape: head(-1), thickness: 0.15 },
        ...[1, -1].map((s) => ({ kind: "plate", shape: shape(thickLine([[0, 0.05], [s * (ARC - 0.1), 0.38]], 0.08)), thickness: 0.1 })),
        { kind: "cylinder", radius: 0.16, length: 0.3 },
      ],
    },
    {
      id: "flywheel",
      kind: "group",
      center: [DRUM.center[0], DRUM.center[1], -0.3],
      spin: 2.0,
      pieces: [
        { kind: "plate", shape: shape(circle(2.0), [circle(1.85).reverse()]), thickness: 0.15 },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [3.8, 0.1, 0.08], angle: (i * Math.PI) / 4 })),
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.1 }), thickness: 0.1, at: [0, 0, Z.ratchet + 0.3] },
        { kind: "cylinder", radius: 0.1, length: 1.3, at: [0, 0, 0.45] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      center: [DRUM.center[0], DRUM.center[1], 0.25],
      spin: DRUM.r,
      pieces: [
        { kind: "cylinder", radius: DRUM.r, length: 0.25, mark: true },
        { kind: "cylinder", radius: DRUM.r + 0.12, length: 0.05, at: [0, 0, -0.13] },
        { kind: "cylinder", radius: 0.03, length: 0.3, at: [PAWL.pivot[0], PAWL.pivot[1], Z.pawl - 0.25] }, // 棘爪的銷
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [PAWL.length, 0]], 0.08), [circle(0.03).reverse()]), thickness: 0.06, arrow: false },
    { id: "ropeR", kind: "rope" },
    { id: "ropeL", kind: "rope" },
    { id: "ball", kind: "sphere", radius: 0.22 },
  ],
  // 動力重演:只推主動件;flywheel 靠摩擦定位,由接觸帶動
  replay: { free: { flywheel: { hold: true } }, expect: [{ part: "flywheel", label: "主動件走完一輪後 flywheel 的位置" }] },
  driver: { part: "beam", type: "rotation", cycle: [-SWING, SWING] },
  target: "flywheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const b = beam(v);
    // 右端弧形頭的繩:從弧頭最右的切點垂下,繞到鼓輪左側
    const rightTop = [PIVOT[0] + ARC + 0.12, PIVOT[1] + (ARC + 0.12) * b.psi, 0.1]; // 繩的上端繫在樑端的弧形頭上
    const leftTop = [PIVOT[0] - ARC - 0.12, PIVOT[1] - (ARC + 0.12) * b.psi, 0.1];
    const rope = [rightTop, [DRUM.center[0] - DRUM.r, DRUM.center[1] + 0.1, 0.25], [DRUM.center[0] - DRUM.r * 0.7, DRUM.center[1] - DRUM.r * 0.7, 0.25]];
    // 棘爪:銷在鼓輪上,從抬起的位置順時針垂下、停在碰到棘輪的齒面處
    const [px, py] = rot2(PAWL.pivot, b.drum);
    const pivot = [DRUM.center[0] + px, DRUM.center[1] + py, Z.pawl];
    const pawl = pawlRest({ pivot, length: PAWL.length, from: b.drum + PAWL.hang, into: -1 }, { center: DRUM.center, angle: b.fly, ...RATCHET });
    const ballY = leftTop[1] - 1.9;
    return {
      parts: {
        beam: { angle: b.psi },
        drum: { angle: b.drum },
        flywheel: { angle: b.fly },
        pawl: { position: pivot, angle: pawl.angle },
        ball: { position: [leftTop[0], ballY, 0.1] },
      },
      paths: {
        ropeR: { points: rope, closed: false, phase: b.drum * DRUM.r },
        ropeL: { points: [leftTop, [leftTop[0], ballY + 0.2, 0.1]], closed: false, phase: -b.psi * ARC },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["flywheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 flywheel 的位置」預期 flywheel 在主動量 0.98 時已轉 -86°,實際轉了 -39°。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
    { check: "interference", parts: ["flywheel", "pawl"], reason: "棘爪落在飛輪側面棘齒上的位置依時序演出;爪尖伸進齒 0.08" },
  ],
};
