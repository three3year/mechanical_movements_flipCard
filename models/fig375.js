// 第 375 種:壓碎或研磨用的一對滾壓輪(追輪)。兩個大輪的輪軸接在直立軸上,直立軸由頂上的一對傘齒輪帶動;
// 直立軸轉動時,兩個輪在環形的鍋盆(料槽)裡繞著走,同時在盆底滾動。主動件是頂上豎直的小傘齒輪(由右邊的軸帶動)。
// 照原圖:門形框的橫樑和兩根立柱在同一個平面,水平的大傘齒輪架在橫樑上方,直立軸穿過橫樑上的軸承往下到盆中央;
// 豎直的小傘齒輪的軸由橫樑右端立起的短立柱撐著。傘齒輪照原圖約 2 : 1(原圖量水平的半徑約為垂直的 2.1 倍)。
// 推斷:齒數 48 : 24;輪在盆底純滾動;盆底中央的腳軸承、盆下的底座(原圖沒畫,直立軸的下端要有地方立)、
// 主動軸端的皮帶輪。
import { X, Y, Z, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { bevelGear, meshAngle, bevelContact, pitchCones } from "./gears.js";

const RUN = 0.95; // 輪中心離直立軸的距離
const WHEEL = 0.85; // 輪半徑
const WIDTH = 0.42;
const FLOOR = -1.25; // 盆底
const PAN_BOTTOM = FLOOR - 0.3;
const SHAFT_R = 0.1; // 直立軸
const DRIVE_R = 0.08; // 主動軸
const POST_X = 2.45; // 門形框的立柱
const BEAM = [1.0, 1.2]; // 橫樑的上下緣
const STAND_X = 2.15; // 主動軸的短立柱
const [NB, NS] = [48, 24];
const [CONE_B, CONE_S] = pitchCones(NB, NS);
const APEX = [0, 2.3, 0];
const G1 = bevelGear({ apex: APEX, axis: [0, 1, 0], teeth: NB, radius: 1.5, cone: CONE_B, width: 0.25 });
const G2 = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: NS, radius: 0.75, cone: CONE_S, width: 0.25 });
const CONTACT = bevelContact(G2, G1);
const SHAFT_TOP = G1.center[1] + 0.1;

/** 主動傘齒輪轉 a → 直立軸的轉角、輪的自轉角 */
export function runners(a) {
  const shaft = meshAngle(G2, G1, a, CONTACT);
  return { shaft, roll: (-shaft * RUN) / WHEEL };
}
export const geometry = { RUN, WHEEL, FLOOR };

const bevel = (g, bore) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, bore });
const span = (y0, y1) => ({ length: y1 - y0, mid: (y0 + y1) / 2 });
const post = span(PAN_BOTTOM, BEAM[1]);
const stand = span(BEAM[1], APEX[1]);

export default {
  figure: 375,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.5, 0.2, 4.8], at: [0, PAN_BOTTOM - 0.1, 0], role: "base" }, // 底座(推斷)
        // 門形框:兩根立柱立在底座上,橫樑在大傘齒輪下方、中間一個軸承讓直立軸穿過
        { kind: "box", size: [0.2, post.length, 0.4], at: [-POST_X, post.mid, 0], role: "post" },
        { kind: "box", size: [0.2, post.length, 0.4], at: [POST_X, post.mid, 0], role: "post" },
        { kind: "box", size: [POST_X + 0.1 - 0.25, BEAM[1] - BEAM[0], 0.4], at: [-(POST_X + 0.1 + 0.25) / 2, (BEAM[0] + BEAM[1]) / 2, 0], role: "beam" },
        { kind: "box", size: [POST_X + 0.1 - 0.25, BEAM[1] - BEAM[0], 0.4], at: [(POST_X + 0.1 + 0.25) / 2, (BEAM[0] + BEAM[1]) / 2, 0], role: "beam" },
        { kind: "cylinder", axis: Y, radius: 0.25, inner: SHAFT_R, length: BEAM[1] - BEAM[0], at: [0, (BEAM[0] + BEAM[1]) / 2, 0] },
        // 橫樑右段立起的短立柱,頂上的軸承撐著主動軸(原圖如此)
        { kind: "box", size: [0.2, stand.length - 0.15, 0.3], at: [STAND_X, BEAM[1] + (stand.length - 0.15) / 2, 0] },
        { kind: "cylinder", axis: X, radius: 0.22, inner: DRIVE_R, length: 0.2, at: [STAND_X, APEX[1], 0] },
        // 環形鍋盆;中央的孔裡是直立軸的腳軸承(推斷),坐在底座上
        { kind: "lathe", axis: Y, profile: [[0.35, PAN_BOTTOM], [2.1, PAN_BOTTOM], [2.25, FLOOR + 0.25], [2.05, FLOOR + 0.25], [1.95, FLOOR], [0.55, FLOOR], [0.45, FLOOR + 0.25], [0.35, FLOOR + 0.25]] },
        { kind: "cylinder", axis: Y, radius: 0.35, inner: SHAFT_R, length: FLOOR + 0.25 - PAN_BOTTOM, at: [0, (FLOOR + 0.25 + PAN_BOTTOM) / 2, 0] },
      ],
    },
    {
      id: "drive",
      kind: "group",
      center: G2.center,
      axis: G2.axis,
      spin: 0.4,
      spinOffset: -0.45, // 箭頭繞在齒輪與短立柱之間的軸上
      pieces: [bevel(G2, DRIVE_R), { kind: "cylinder", radius: DRIVE_R, length: 1.6, at: [0, 0, -0.8] }, { kind: "cylinder", radius: 0.3, length: 0.2, at: [0, 0, -1.2] }],
    },
    {
      id: "shaft",
      kind: "group",
      center: G1.center,
      axis: G1.axis,
      spin: 1.75, // 箭頭在大傘齒輪外圍
      pieces: [
        bevel(G1, SHAFT_R),
        { kind: "cylinder", radius: SHAFT_R, length: SHAFT_TOP - PAN_BOTTOM, at: [0, 0, (SHAFT_TOP + PAN_BOTTOM) / 2 - G1.center[1]] },
        { kind: "box", size: [0.5, 0.5, 0.5], at: [0, 0, -G1.center[1] + FLOOR + WHEEL] },
      ],
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
};
