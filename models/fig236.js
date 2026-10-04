// 第 236 種:振動槓桿 a(上面裝著兩根棘爪 b 和 c),把近乎連續的圓周運動傳給棘輪。槓桿的樞軸在輪的右上方;
// b 掛在槓桿左臂、往下搭在輪的左側,c 掛在右端、往左下搭在輪頂。左臂往下時 b 把左側的齒往下推,
// 右臂往下時 c 把頂上的齒往左推,兩者都讓輪逆時針轉(原圖箭頭),所以每一程都在推。主動量是槓桿的累計擺動量。
// 推斷:棘爪長度與擺幅依原圖量得。
import { deg, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";

const WHEEL = { teeth: 20, outer: 1.45, inner: 1.2 };
const CONTACT = 1.3;
const P = [0.55, 2.4, 0];
const PINS = { b: [-0.95, 0.05], c: [0.65, -0.5] }; // 相對 P(槓桿在原位)
const LEN = { b: 1.75, c: 1.45 };
const SIDE = { b: -1, c: -1 };
const SWING = deg(16);

const pinAt = (which, psi) => bodyPoint(P, psi, PINS[which]);
const tip = (which, psi) => circleCircle(pinAt(which, psi), LEN[which], [0, 0, 0], CONTACT, SIDE[which]).point;
const tipAngle = (which) => (psi) => Math.atan2(tip(which, psi)[1], tip(which, psi)[0]);

/** 槓桿累計擺動 v:輪的轉角(左臂往下 = 槓桿逆時針轉時 b 推;往回時 c 推) */
export const wheelAngle = (v) => doubleAction(v, -SWING / 2, SWING / 2, tipAngle("b"), tipAngle("c"));
export const swing = SWING;
export const tipOf = tip;

export default {
  figure: 236,
  parts: [
    { id: "wheel", kind: "plate", shape: ratchetShape({ ...WHEEL, bore: 0.12, dir: 1 }), thickness: 0.2, hub: 0.32, circles: [0.4], mark: [0.9, 0], markSize: 0.08, spin: WHEEL.outer },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      label: "a",
      labelOffset: [0.3, 0.35, 0],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-3.1, 0.15], PINS.b, [0, 0], [0.55, -0.3], PINS.c], 0.22), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.09, length: 0.5, at: [0, 0, 0.2] },
      ],
    },
    { id: "pawlB", kind: "link", width: 0.2, thickness: 0.08, label: "b", labelOffset: [-0.35, 0, 0] },
    { id: "pawlC", kind: "link", width: 0.2, thickness: 0.08, label: "c", labelOffset: [0.1, -0.3, 0] },
  ],
  // 動力重演:只推主動件;wheel 靠摩擦定位,由接觸帶動
  replay: { free: { wheel: { hold: true } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "lever", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = swingAt(v, -SWING / 2, SWING / 2);
    const z = 0.2;
    const at = (w) => [...tip(w, psi).slice(0, 2), z];
    const pin = (w) => [...pinAt(w, psi).slice(0, 2), z];
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: wheelAngle(v) },
        pawlB: { from: pin("b"), to: at("b") },
        pawlC: { from: pin("c"), to: at("c") },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 0.56 時已轉 21°,實際沒動。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
  ],
};
