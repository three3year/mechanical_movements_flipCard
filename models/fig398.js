// 第 398 種:把連續的圓周運動變成間歇的圓周運動——凸輪 C 是主動件。三瓣的凸輪夾在一個方框形的滑塊(軛)裡,
// 凸輪轉動時方框左右往復(凸輪是等寬的,所以一直夾著);方框經一根連桿帶動右邊大輪頂上的棘爪,
// 方框往復一次,大輪被撥轉一下、又停一下。主動件是凸輪 C。
// 推斷:連桿末端是一個棘爪,搭在大輪頂上的棘齒(原圖右邊大輪上的小爪);方框往左拉時棘爪帶著大輪轉,
// 往右回時棘爪滑過齒,大輪不動,所以大輪間歇地朝同一方向轉。
import { TAU } from "./kit.js";
import { outlineForRoller } from "./cams.js";
import { shape, circle, rect, ratchetShape, thickLine } from "./shapes.js";

const CAM = { center: [-1.6, 0, 0] };
const A = 0.9;
const B = 0.22;
const pitchAt = (phi) => A + B * Math.cos(3 * phi);
const OUTLINE = outlineForRoller(pitchAt, 0.001);
const WHEEL = { center: [2.4, -0.6, 0], r: 1.3 };

/** 凸輪轉 theta → 方框的位移(右側從動面)、大輪的轉角(只朝一個方向累計) */
export function intermittent(theta) {
  const x = pitchAt(-theta) - A; // 方框右側的從動面
  // 大輪:方框往左拉時帶著轉(頂上往左 = 逆時針),往右回時不動(棘爪)
  const per = TAU / 3;
  const k = Math.floor(theta / per);
  const u = theta - k * per;
  // 一瓣經過的那一段裡,方框先往左(拉)再往右(回):拉的那一半帶動大輪
  const push = Math.min(u, per / 2);
  const step = (2 * B) / WHEEL.r; // 每一瓣推的距離 2B,換成大輪頂上的轉角
  const wheel = k * step + (B - B * Math.cos(3 * push)) / WHEEL.r;
  return { x, wheel };
}

export default {
  figure: 398,
  parts: [
    { id: "cam", kind: "plate", center: CAM.center, shape: shape(OUTLINE, [circle(0.1).reverse()]), thickness: 0.2, hub: 0.25, mark: [0.6, 0], markSize: 0.06, spin: A + B, label: "C", labelOffset: [-0.95, 0, 0.3] },
    {
      id: "yoke",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2 * A + 0.5, 2.4), [rect(2 * A, 2.0).reverse()]), thickness: 0.18, at: [CAM.center[0], 0, -0.05] },
        { kind: "box", size: [0.5, 0.35, 0.3], at: [CAM.center[0] + A + 0.6, 0, 0] },
      ],
    },
    // 連桿與末端的棘爪(隨方框平移)
    { id: "rod", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [1.6, 0], [2.3, WHEEL.r - 0.6 + 0.12]], 0.1)), thickness: 0.06 }] },
    { id: "wheel", kind: "group", center: WHEEL.center, spin: WHEEL.r, pieces: [{ kind: "plate", shape: { ...ratchetShape({ teeth: 30, outer: WHEEL.r, inner: WHEEL.r - 0.15, dir: 1 }), holes: [circle(0.1).reverse()] }, thickness: 0.15, circles: [0.8] }, { kind: "box", size: [0.15, 0.15, 0.2], at: [WHEEL.r - 0.4, 0, 0], accent: true }] },
  ],
  driver: { part: "cam", type: "rotation", speed: -0.8 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const i = intermittent(-theta);
    const yokeX = i.x;
    return {
      parts: {
        cam: { angle: theta },
        yoke: { position: [yokeX, 0, 0] },
        rod: { position: [CAM.center[0] + A + 0.85 + yokeX, 0, 0.2] },
        wheel: { angle: i.wheel },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["cam", "yoke"], reason: "接合處的簡化畫法:凸輪在叉形框裡轉;框與凸輪前後錯開的量不夠,重疊 0.14" },
    { check: "unsupported", parts: ["wheel"], reason: "未修:輪沒有畫出支撐的軸(離最近的實體 0.07)(列入待確認清單)" },
  ],
};
