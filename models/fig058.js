// 第 58 種:以齒輪傳遞三種速度。下方的四個皮帶輪由右到左:鬆動輪(原圖皮帶在此);
// 第二個固定在主軸上,主軸另一端是一個小正齒輪;第三個固定在套著主軸的空心軸上,另一端是較大的正齒輪;
// 第四個(最左)固定在再外一層的空心軸上,另一端是最大、最靠近皮帶輪的正齒輪。
// 三個正齒輪各與下方軸上的齒輪咬合;皮帶移到哪一個輪,下方軸就得到哪一種速度。
// 沒在傳動的皮帶輪與齒輪對畫成半透明,一眼看出目前走的是哪一對;目標件是下方的軸。
import { X } from "./kit.js";
import { meshAngle } from "./gears.js";
import { pulleyOnX, belt, driven, travel } from "./belt-shift.js";

const DRUM = { y: 3.4, radius: 1.0 };
const R = 1.05; // 下方皮帶輪
const PX = { p4: 4.4, p3: 4.95, p2: 5.5, loose: 6.05 }; // 各皮帶輪的 x
const M = 0.07;
const LOWER_Y = -1.4;
// 三對齒輪(上:皮帶輪那一軸的套軸;下:被帶動的軸),中心距都是 1.4
const PAIRS = {
  p2: { x: 1.6, up: 13, down: 27 },
  p3: { x: 2.4, up: 20, down: 20 },
  p4: { x: 3.2, up: 27, down: 13 },
};
const gearOf = (n, y, x) => ({ center: [x, y, 0], axis: X, teeth: n, radius: (n * M) / 2 });

export const states = ["loose", "p2", "p3", "p4"];

/**
 * 皮帶在 state 輪上、鼓輪轉 angle 時:各皮帶輪(與它的齒輪)的轉角、下方軸的轉角。
 * 下方軸上的三個齒輪一起轉,所以另外兩個套軸也被反帶著轉(各依自己的齒數比),只是不出力。
 */
export function speeds(angle, state) {
  const belted = driven(angle, DRUM.radius, R);
  const up = (k) => gearOf(PAIRS[k].up, 0, 0);
  const down = (k) => gearOf(PAIRS[k].down, LOWER_Y, 0);
  // 皮帶在鬆動輪時齒輪都停著,但仍停在互相咬合的相位(以第二輪轉角 0 推算)
  const live = state === "loose" ? "p2" : state;
  const input = state === "loose" ? 0 : belted;
  const lower = meshAngle(up(live), down(live), input);
  const back = (k) => (k === live ? input : meshAngle(down(k), up(k), lower));
  return { p2: back("p2"), p3: back("p3"), p4: back("p4"), loose: state === "loose" ? belted : 0, lower };
}

const gearPart = (id, n, y, x) => ({ id, kind: "gear", axis: X, center: [x, y, 0], teeth: n, radius: (n * M) / 2, width: 0.32, web: false });

export default {
  figure: 58,
  parts: [
    pulleyOnX("drum", 5.25, DRUM.y, DRUM.radius, 2.1, { pieces: [{ kind: "cylinder", radius: 0.09, length: 4.4, at: [0, 0, 0] }] }),
    pulleyOnX("p4", PX.p4, 0, R, 0.52),
    pulleyOnX("p3", PX.p3, 0, R, 0.52),
    pulleyOnX("p2", PX.p2, 0, R, 0.52),
    pulleyOnX("loose", PX.loose, 0, R, 0.52),
    gearPart("up2", PAIRS.p2.up, 0, PAIRS.p2.x),
    gearPart("up3", PAIRS.p3.up, 0, PAIRS.p3.x),
    gearPart("up4", PAIRS.p4.up, 0, PAIRS.p4.x),
    gearPart("down2", PAIRS.p2.down, LOWER_Y, PAIRS.p2.x),
    gearPart("down3", PAIRS.p3.down, LOWER_Y, PAIRS.p3.x),
    gearPart("down4", PAIRS.p4.down, LOWER_Y, PAIRS.p4.x),
    // 主軸與兩層空心軸各自跟著自己的皮帶輪與齒輪轉;鬆動輪空套在主軸上
    { id: "shaft2", kind: "cylinder", axis: X, center: [3.8, 0, 0], radius: 0.07, length: 5.0, arrow: false },
    { id: "sleeve3", kind: "cylinder", axis: X, center: [(PX.p3 + PAIRS.p3.x) / 2, 0, 0], radius: 0.11, inner: 0.08, length: PX.p3 - PAIRS.p3.x + 0.3, arrow: false },
    { id: "sleeve4", kind: "cylinder", axis: X, center: [(PX.p4 + PAIRS.p4.x) / 2, 0, 0], radius: 0.15, inner: 0.12, length: PX.p4 - PAIRS.p4.x + 0.3, arrow: false },
    { id: "lowerShaft", kind: "cylinder", axis: X, center: [2.4, LOWER_Y, 0], radius: 0.12, length: 2.6, arrow: false },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "drum", type: "rotation" },
  target: "lowerShaft",
  states: {
    options: [
      { id: "loose", label: "鬆動輪(停)" },
      { id: "p2", label: "第二輪(慢)" },
      { id: "p3", label: "第三輪(中)" },
      { id: "p4", label: "第四輪(快)" },
    ],
    initial: "loose",
  },
  view: { direction: [0.05, 0.1, 1], fov: 18 },
  pose(angle, state = "loose") {
    const s = speeds(angle, state);
    const path = belt(PX[state], DRUM.y, DRUM.radius, 0, R);
    // 下方軸上三個齒輪同轉;各上齒輪隨各自的皮帶輪轉。皮帶所在的輪與它那一對齒輪不透明,其餘半透明
    const live = (k) => ({ ghost: state !== k });
    return {
      parts: {
        drum: { angle },
        p2: { angle: s.p2, ...live("p2") },
        p3: { angle: s.p3, ...live("p3") },
        p4: { angle: s.p4, ...live("p4") },
        loose: { angle: s.loose, ...live("loose") },
        up2: { angle: s.p2, ...live("p2") },
        up3: { angle: s.p3, ...live("p3") },
        up4: { angle: s.p4, ...live("p4") },
        down2: { angle: s.lower, ...live("p2") },
        down3: { angle: s.lower, ...live("p3") },
        down4: { angle: s.lower, ...live("p4") },
        lowerShaft: { angle: s.lower },
        shaft2: { angle: s.p2 },
        sleeve3: { angle: s.p3 },
        sleeve4: { angle: s.p4 },
      },
      paths: { belt: { points: path.points, closed: true, phase: travel(angle, DRUM.radius) } },
      readouts: [],
    };
  },
};
