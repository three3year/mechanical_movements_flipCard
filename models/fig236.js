// 第 236 種:振動槓桿 a(上面裝著兩根棘爪 b 和 c),把近乎連續的圓周運動傳給棘輪。槓桿的樞軸在輪的右上方;
// b 掛在槓桿左臂、往下搭在輪的左上側,c 掛在右端、往左下搭在輪頂。左臂往下時 b 把左上側的齒往下推,
// 右臂往下時 c 把頂上的齒往左推,兩者都讓輪逆時針轉(原圖箭頭),所以每一程都在推。主動量是槓桿的累計擺動量。
//
// 接觸(由接觸算,共用 pawl-drive.js):兩根棘爪鉸在槓桿的銷上,靠自重搭在齒上,爪尖是圓頭,和齒畫在同一層。
// 每根棘爪推的那一程把輪推過半個齒距;另一程它被齒背頂起、滑過齒尖落進下一格(輪同時被另一根推了半齒,
// 相對於輪退了一整齒)。推多遠、何時滑過、落多深,都由爪尖與鋸齒相碰算出。
// 推斷:棘爪長度與擺幅依原圖量得;輪軸裝在後面的軸承座上,槓桿的樞軸立在後面的支柱上(原圖沒畫)。
import { deg, swingPhase } from "./kit.js";
import { bodyPoint } from "./linkage.js";
import { ratchetObstacles } from "./ratchets.js";
import { circlePolygon } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const WHEEL = { teeth: 20, outer: 1.45, inner: 1.2, dir: 1 };
const PITCH = (2 * Math.PI) / WHEEL.teeth;
const P = [0.55, 2.4, 0];
const PINS = { b: [-0.95, 0.05], c: [0.65, -0.5] }; // 相對 P(槓桿在原位)
const LEN = { b: 1.5, c: 1.3 }; // 銷到爪尖圓頭的中心
const NUB = 0.07;
const SWING = deg(28);
const Z = { pawl: 0.2, lever: 0.34 };

const pinAt = (which, psi) => bodyPoint(P, psi, PINS[which]).slice(0, 2);
const leverAt = (v) => swingPhase(v, -SWING / 2, SWING / 2);
const drive = pawlDrive({
  period: 2 * SWING,
  pins: (v) => {
    const psi = leverAt(v).at;
    return { b: pinAt("b", psi), c: pinAt("c", psi) };
  },
  wheel: { obstacles: (theta) => ratchetObstacles(WHEEL, theta), dir: 1, pitch: PITCH },
  pawls: {
    // b 掛著往下、略偏左,c 往左下斜:兩根都是爪尖往下擺就壓到輪(逆時針)
    b: { outline: circlePolygon([LEN.b, 0], NUB, 16), into: 1, angle: deg(250), pushes: (v) => leverAt(v).forward },
    c: { outline: circlePolygon([LEN.c, 0], NUB, 16), into: 1, angle: deg(215), pushes: (v) => !leverAt(v).forward },
  },
});
const W0 = drive.at(0).wheel;

/** 槓桿累計擺動 v:輪的轉角(自起點;左臂往下 = 槓桿逆時針轉時 b 推,往回時 c 推) */
export const wheelAngle = (v) => drive.at(v).wheel - W0;
export const swing = SWING;
export const pitch = PITCH;
export const pawlAngles = (v) => drive.at(v).angles;
/** 檢查用:主動量 v 時兩個爪尖與棘輪的齒(世界座標 2D) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { tips: [s.pawls.b, s.pawls.c], teeth: s.wheel };
};

const pawlPart = (which, label, labelOffset) => ({
  id: which === "b" ? "pawlB" : "pawlC",
  kind: "group",
  center: [...pinAt(which, 0), Z.pawl],
  arrow: false,
  label,
  labelOffset,
  pieces: [
    { kind: "plate", shape: shape(thickLine([[0, 0], [LEN[which], 0]], 0.17), [circle(0.06).reverse()]), thickness: 0.1 },
    { kind: "cylinder", radius: NUB, length: 0.28, at: [LEN[which], 0, -0.16] }, // 爪尖的圓頭,伸到齒那一層
  ],
});

export default {
  figure: 236,
  parts: [
    { id: "wheel", kind: "plate", shape: ratchetShape({ ...WHEEL, bore: 0.12 }), thickness: 0.2, hub: 0.32, circles: [0.4], mark: [0.9, 0], markSize: 0.08, spin: WHEEL.outer },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [0, 0, -0.3] }, // 輪軸
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.12, floor: -2.0 }),
        { kind: "cylinder", radius: 0.08, length: 0.75, at: [P[0], P[1], 0.0] }, // 槓桿的樞軸,從後面的支柱伸出
        { kind: "box", size: [0.3, 2.6, 0.12], at: [P[0] + 1.6, P[1] - 1.05, -0.4] },
        { kind: "box", size: [1.75, 0.22, 0.12], at: [P[0] + 0.8, P[1], -0.4] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      label: "a",
      labelOffset: [0.3, 0.35, 0],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-3.1, 0.15], PINS.b, [0, 0], [0.55, -0.3], PINS.c], 0.22), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, Z.lever] },
        { kind: "cylinder", radius: 0.055, length: 0.26, at: [...PINS.b, Z.pawl + 0.08] }, // 掛棘爪的銷往後伸
        { kind: "cylinder", radius: 0.055, length: 0.26, at: [...PINS.c, Z.pawl + 0.08] },
      ],
    },
    pawlPart("b", "b", [-0.35, 0, 0]),
    pawlPart("c", "c", [0.1, -0.3, 0]),
  ],
  // 動力重演:只推槓桿;兩根棘爪掛在槓桿的銷上靠自重搭在齒上,輪靠摩擦定位,由兩根棘爪輪流推動
  replay: {
    to: 4 * SWING,
    seconds: 24,
    free: { wheel: { hold: true, gravity: false }, pawlB: { on: "lever" }, pawlC: { on: "lever" } },
    expect: [
      { at: SWING, part: "wheel", label: "左臂往下:b 推輪半齒", quote: "藉由振動槓桿 a(其上裝有兩根棘爪 b 和 c),將近乎連續的圓周運動傳遞給棘輪" },
      { at: 2 * SWING, part: "wheel", label: "右臂往下:c 再推半齒" },
      { at: 4 * SWING, part: "wheel", label: "兩個來回後的位置" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = leverAt(v).at;
    const s = drive.at(v);
    const pin = (w) => [...pinAt(w, psi), Z.pawl];
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: s.wheel },
        pawlB: { position: pin("b"), angle: s.angles.b },
        pawlC: { position: pin("c"), angle: s.angles.c },
      },
      readouts: [],
    };
  },
};
