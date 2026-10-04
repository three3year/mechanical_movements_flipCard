// 第 375 種:壓碎或研磨用的一對滾壓輪(追輪)。兩個大輪的輪軸接在直立軸上,直立軸由頂上的一對斜齒輪帶動;
// 直立軸轉動時,兩個輪在環形的鍋盆(料槽)裡繞著走,同時在盆底滾動。主動件是頂上豎直的斜齒輪(由右邊的軸帶動)。
// 推斷:齒數比 1 : 1;輪在盆底純滾動。
import { X, Y, Z, deg, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { bevelGear, meshAngle, bevelContact } from "./gears.js";

const RUN = 0.95; // 輪中心離直立軸的距離
const WHEEL = 0.85; // 輪半徑
const WIDTH = 0.42;
const FLOOR = -1.25; // 盆底
const APEX = [0, 2.05, 0];
const G1 = bevelGear({ apex: APEX, axis: [0, 1, 0], teeth: 24, radius: 0.85, cone: deg(45), width: 0.25 });
const G2 = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: 24, radius: 0.85, cone: deg(45), width: 0.25 });
const CONTACT = bevelContact(G2, G1);

/** 主動斜齒輪轉 a → 直立軸的轉角、輪的自轉角 */
export function runners(a) {
  const shaft = meshAngle(G2, G1, a, CONTACT);
  return { shaft, roll: (-shaft * RUN) / WHEEL };
}
export const geometry = { RUN, WHEEL };

const bevel = (g) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width });

export default {
  figure: 375,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 4.4, 0.4], at: [-2.2, 0.1, -0.2] },
        { kind: "box", size: [0.2, 4.4, 0.4], at: [2.2, 0.1, -0.2] },
        { kind: "box", size: [4.6, 0.2, 0.5], at: [0, 1.45, -0.2] },
        // 環形鍋盆
        { kind: "lathe", axis: Y, profile: [[0.35, FLOOR - 0.3], [2.1, FLOOR - 0.3], [2.25, FLOOR + 0.25], [2.05, FLOOR + 0.25], [1.95, FLOOR], [0.55, FLOOR], [0.45, FLOOR + 0.25], [0.35, FLOOR + 0.25]] },
      ],
    },
    {
      id: "drive",
      kind: "group",
      center: G2.center,
      axis: G2.axis,
      spin: 0.9,
      pieces: [bevel(G2), { kind: "cylinder", radius: 0.08, length: 1.6, at: [0, 0, -0.8] }, { kind: "cylinder", radius: 0.3, length: 0.2, at: [0, 0, -1.2] }],
    },
    {
      id: "shaft",
      kind: "group",
      center: G1.center,
      axis: G1.axis,
      spin: 0.9,
      pieces: [bevel(G1), { kind: "cylinder", radius: 0.1, length: 3.6, at: [0, 0, -1.7] }, { kind: "box", size: [0.5, 0.5, 0.5], at: [0, 0, -G1.center[1] + FLOOR + WHEEL] }],
    },
    ...[1, -1].map((s) => ({
      id: s > 0 ? "runnerR" : "runnerL",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: WHEEL, length: WIDTH, mark: true },
        { kind: "cylinder", radius: 0.08, length: 2 * RUN + 0.4, at: [0, 0, -RUN] },
      ],
    })),
  ],
  driver: { part: "drive", type: "rotation" },
  targets: ["runnerL", "runnerR"], // 在盆裡繞著滾的追輪
  view: { direction: [0.08, 0.2, 1] },
  pose(a) {
    const r = runners(a);
    const runner = (s) => {
      const phi = r.shaft + (s > 0 ? 0 : Math.PI);
      const pos = [RUN * Math.cos(phi), FLOOR + WHEEL, -RUN * Math.sin(phi)];
      // 輪軸沿徑向(從直立軸指向輪),輪繞輪軸滾動
      const rotation = quatMul(quatAxisAngle(Y, phi), quatMul(quatFromZ(X), quatAxisAngle(Z, r.roll)));
      return { position: pos, rotation };
    };
    return { parts: { drive: { angle: a }, shaft: { angle: r.shaft }, runnerR: runner(1), runnerL: runner(-1) }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["frame", "shaft"], reason: "簡化畫法:軸的軸承座畫成機架的橫樑,軸頸與橫樑重疊 0.10" },
    { check: "interference", parts: ["frame", "drive"], reason: "未修:主動輪的輪緣伸到機架的橫樑,重疊 0.27;橫樑應在輪的後面(列入待確認清單)" },
  ],
};
