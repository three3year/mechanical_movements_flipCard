// 第 153 種:圓周運動轉換為交替直線運動。旋轉圓盤上的凸柱撞擊水平桿下方的凸塊,把桿往右推;
// 回程靠左邊的曲柄搖臂(肘節槓桿):下一根凸柱推它的下臂,上臂便撞擊水平桿前端的凸柱,把桿推回左邊。
// 圓盤上有兩根相隔半圈的凸柱,每半圈各推一次。主動件是圓盤(順時針)。
//
// 接觸:桿與搖臂的位置都由外形相碰算出——凸柱壓進凸塊就把桿往右推到剛好不重疊,桿前端的銷跟著把搖臂的上臂
// 推開;凸柱壓進搖臂的下臂就把搖臂轉到剛好不重疊,上臂再把銷(連同桿)往左推。沒被推的時候桿與搖臂靠摩擦停住。
// 逐步模擬幾個半圈,取已經穩定的那一個半圈當作週期(兩根凸柱一樣,每半圈重複)。
// 桿擱在左右兩個滾輪上(照原圖);圓盤的軸與搖臂的樞軸往後伸進軸承座(軸承座是推斷)。
import { deg, polar, rot2 } from "./kit.js";
import { shape, circle, stadium, rect } from "./shapes.js";
import { polygonsOverlap, circlePolygon, placeOutline } from "./contact.js";
import { pedestal } from "./supports.js";

const DISC = { center: [0, -0.35, 0], radius: 1.45, studR: 1.18 };
const BAR_Y = 1.55;
const STUD = 0.13;
const STUDS = [deg(115), deg(-65)];
// 搖臂:下臂伸到圓盤前面、凸柱經過的地方(照原圖下臂伸到圓盤上);長度與角度取「凸柱推得到下臂、
// 上臂推得回桿」的組合(逐步模擬試出來的)
const CRANK = { pivot: [-2.35, 0.0, 0.25], up: 1.6, down: 1.7, upAt: deg(62), downAt: deg(0), width: 0.24 };
const LUG = { x: 0.35, y: BAR_Y - 0.5, w: 0.35, h: 0.6 }; // 桿下方的凸塊(相對桿的位置)
const PIN = { x: -2.1, y: BAR_Y - 0.32, r: 0.14 }; // 桿前端的銷:上臂從它右邊推它

const studsAt = (c) => STUDS.map((a) => circlePolygon(polar(DISC.studR, a - c).map((v, i) => v + (DISC.center[i] ?? 0)), STUD, 16));
const lugAt = (x) => rect(LUG.w, LUG.h, x + LUG.x, LUG.y);
const pinAt = (x) => circlePolygon([x + PIN.x, PIN.y], PIN.r, 16);
const ARM = (length) => stadium(length, CRANK.width).outline;
const upperArm = (psi) => placeOutline(ARM(CRANK.up), CRANK.pivot, CRANK.upAt + psi);
const lowerArm = (psi) => placeOutline(ARM(CRANK.down), CRANK.pivot, CRANK.downAt + psi);
const hitsAny = (poly, list) => list.some((o) => polygonsOverlap(poly, o));

// 把 value 往 dir 推到剛好不重疊(不超過 max);推不開就回傳原值
function clear(value, dir, max, overlaps) {
  if (!overlaps(value)) return value;
  if (overlaps(value + dir * max)) return value;
  let [lo, hi] = [0, max];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (overlaps(value + dir * mid)) lo = mid;
    else hi = mid;
  }
  return value + dir * hi;
}

const SAMPLES = 720; // 半圈的取樣數
const { TABLE } = (() => {
  let x = 0;
  let psi = 0;
  const dc = Math.PI / SAMPLES;
  const maxX = 2 * DISC.studR * dc + 1e-4; // 一步裡凸柱移動的距離(加餘裕)
  const run = [];
  for (let i = 0; i <= 4 * SAMPLES; i++) {
    const studs = studsAt(i * dc);
    // 凸柱推凸塊:桿往右;銷把上臂往右推(搖臂順時針)
    x = clear(x, 1, maxX, (v) => hitsAny(lugAt(v), studs));
    psi = clear(psi, -1, 0.2, (p) => polygonsOverlap(upperArm(p), pinAt(x)));
    // 凸柱推下臂:搖臂逆時針;上臂把銷往左推(桿往左)
    psi = clear(psi, 1, 0.2, (p) => hitsAny(lowerArm(p), studs));
    x = clear(x, -1, 0.3, (v) => polygonsOverlap(upperArm(psi), pinAt(v)));
    run.push({ x, psi });
  }
  return { TABLE: run.slice(3 * SAMPLES) };
})();

/** 圓盤順時針轉過 c:水平桿的位移與搖臂的轉角 */
export function shuttle(c) {
  const u = (((c % Math.PI) + Math.PI) % Math.PI) / (Math.PI / SAMPLES);
  const i = Math.min(SAMPLES - 1, Math.floor(u));
  const t = u - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { x: a.x + (b.x - a.x) * t, crank: a.psi + (b.psi - a.psi) * t };
}
const XS = TABLE.map((s) => s.x);
export const stroke = Math.max(...XS) - Math.min(...XS);
/** 姿勢下各接觸外形(世界座標 2D),測試檢查接觸不穿入用 */
export function contactShapes(c) {
  const { x, crank } = shuttle(c);
  return { studs: studsAt(c), lug: lugAt(x), pin: pinAt(x), upper: upperArm(crank), lower: lowerArm(crank) };
}

export default {
  figure: 153,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.12, circles: [0.32] },
        { kind: "cylinder", radius: 0.13, length: 0.45, at: [...polar(DISC.studR, deg(115)).slice(0, 2), 0.25], accent: true },
        { kind: "cylinder", radius: 0.13, length: 0.45, at: [...polar(DISC.studR, deg(-65)).slice(0, 2), 0.25] },
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.3] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "bar",
      kind: "group",
      pieces: [
        // 桿身在搖臂後面一層(搖臂上端從它前方擺過),凸塊與銷往前伸到凸柱、搖臂那一層
        { kind: "box", size: [6.4, 0.42, 0.3], at: [0, BAR_Y, -0.05] },
        { kind: "box", size: [0.35, 0.6, 0.3], at: [0.35, BAR_Y - 0.5, 0.25] },
        { kind: "box", size: [0.35, 0.3, 0.3], at: [0.35, BAR_Y - 0.2, 0.1] },
        { kind: "cylinder", radius: PIN.r, length: 0.39, at: [PIN.x, PIN.y, 0.355] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: stadium(CRANK.up, 0.24), thickness: 0.12, angle: CRANK.upAt },
        { kind: "plate", shape: stadium(CRANK.down, 0.24), thickness: 0.12, angle: CRANK.downAt },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.2 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 0.8, at: [CRANK.pivot[0], CRANK.pivot[1], -0.05] }, // 搖臂的樞軸銷
        ...pedestal({ at: [CRANK.pivot[0], CRANK.pivot[1]], z: -0.5, bore: 0.1, floor: -2.1 }),
        ...pedestal({ at: [DISC.center[0], DISC.center[1]], z: -0.5, bore: 0.12, floor: -2.1 }),
      ],
    },
    {
      id: "rollers",
      kind: "group",
      pieces: [-2.6, 2.4].map((x) => ({ kind: "cylinder", radius: 0.3, inner: 0.13, length: 0.3, at: [x, BAR_Y - 0.5, 0] })),
    },
  ],
  // 動力重演:只轉圓盤;桿與搖臂都靠摩擦定位,只被凸柱與彼此推動
  replay: {
    free: { bar: { slide: [1, 0, 0], hold: true }, crank: { pivot: CRANK.pivot, hold: true } },
    to: -Math.PI,
    expect: [
      { at: -1.1, part: "bar", label: "凸柱撞擊凸塊,把桿推到右端", quote: "旋轉圓盤上的凸柱撞擊水平桿下方的凸出部分,將其朝某一方向移動" },
      { at: -1.1, part: "crank", label: "桿前端的銷把搖臂的上臂推開" },
      { part: "bar", label: "下一根凸柱推搖臂的下臂,上臂把桿推回左端", quote: "其中一臂由下一根凸柱所作動,另一臂則撞擊水平桿前方的凸柱" },
    ],
  },
  driver: { part: "disc", type: "rotation", speed: -0.9 },
  target: "bar",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { x, crank } = shuttle(-v);
    return { parts: { disc: { angle: v }, bar: { position: [x, 0, 0] }, crank: { angle: crank } }, readouts: [] };
  },
};
