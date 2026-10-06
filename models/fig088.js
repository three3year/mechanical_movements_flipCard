// 第 88 種:連續旋轉轉換為間歇旋轉。凸輪 A 是一片有一處台階的蝸牛形板,連續順時針轉(原圖箭頭);
// 碟形輪 B 繞偏離 A 中心的軸轉,碟面上立著兩個擋止 C、D(相隔半圈)。A 的台階推著一個擋止,帶 B 轉;
// 因為 B 偏心,被推的擋止一路離 A 的中心越來越遠,轉到將近半圈時滑出台階(脫離凸輪的凸出部分),
// B 就停住;這時另一個擋止已轉到離 A 中心近的一側、落在台階的路徑上,等 A 轉完一圈、台階再推它。
//
// B 的轉角全部由接觸算:A 每轉一小步,若台階碰到擋止,就把 B 順時針轉到剛好不碰(擋止推不動以外的方向);
// 沒碰到就不動(B 的軸有摩擦,沒被推時停在原地)。台階的壁是沿半徑的直壁,台階外側的蝸牛形面由大到小
// (半徑隨離台階的角度以平方遞減,讓輪轉到對面的擋止始終在凸輪面之外)。
// 偏心的裝法(推斷:原文只說 B「在凸輪 A 的中心偏心位置上旋轉」,原圖幾乎看不出偏心):
// 機架上一個固定的偏心軸套,B 的轂轉在套外,A 的軸穿過套上偏離中心的孔。原圖 B 與 A 看起來同心,
// 但同心的話擋止離 A 的距離不變,永遠脫離不了台階,做不出原文的間歇,所以照原文畫出偏心。
import { TAU, deg, polar, wrap } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { placeOutline } from "./contact.js";

const E = 0.3; // B 的軸偏離 A 中心的距離
const B_AT = polar(E, deg(20)).slice(0, 2); // B 的軸心
const CAM = { low: 1.25, high: 1.7 }; // 蝸牛形凸輪:台階外側(最大)、台階內側(最小)的半徑
const STOP = { r: 1.7, pin: 0.12 }; // 擋止離 B 軸心的距離、擋止的半徑
const DISH = { outer: 2.4, inner: 2.12, bore: 0.56 };
const FACE0 = deg(185); // 主動量 0 時台階的方向(原圖:台階正推著左邊的擋止 C)

/** 凸輪局部角 a(從台階逆時針量起)處的半徑 */
export function camRadius(a) {
  const f = wrap(a) / TAU;
  return CAM.low + (CAM.high - CAM.low) * (1 - f) ** 2;
}
const camOutline = Array.from({ length: 240 }, (_, i) => {
  const a = 0.002 + (i / 239) * (TAU - 0.004);
  return polar(camRadius(a), a).slice(0, 2);
});

// 擋止(圓)的位置:B 轉角 b,第 k 個擋止(C:0、D:1)
const stopCenter = (b, k) => [B_AT[0] + STOP.r * Math.cos(b + k * Math.PI + Math.PI), B_AT[1] + STOP.r * Math.sin(b + k * Math.PI + Math.PI)];
const RING = Array.from({ length: 24 }, (_, i) => polar(STOP.pin, (i / 24) * TAU).slice(0, 2));
// 凸輪轉角 φ(世界角 = 局部角 + φ)時,這個擋止有沒有碰到凸輪:擋止圓周上的點落進凸輪,或台階的角伸進擋止
function touches(phi, center) {
  for (const [dx, dy] of RING) {
    const x = center[0] + dx;
    const y = center[1] + dy;
    if (Math.hypot(x, y) < camRadius(Math.atan2(y, x) - phi)) return true;
  }
  const corner = polar(CAM.high, phi);
  return Math.hypot(corner[0] - center[0], corner[1] - center[1]) < STOP.pin;
}
const hits = (phi, b) => touches(phi, stopCenter(b, 0)) || touches(phi, stopCenter(b, 1));

// 從原圖的位置起逐步轉凸輪,台階碰到擋止就把 B 順時針推到剛好不碰;走三圈,取最後一圈當週期
const STEPS = 1440; // 每圈的步數
const { TABLE } = (() => {
  let b = deg(4); // 起點:C 在台階前面一點
  const run = [];
  for (let i = 0; i <= 3 * STEPS; i++) {
    const phi = FACE0 - (i / STEPS) * TAU;
    if (hits(phi, b)) {
      const max = 0.05;
      if (hits(phi, b - max)) throw new Error("第 88 種:擋止卡住推不動");
      let lo = 0;
      let hi = max;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (hits(phi, b - mid)) lo = mid;
        else hi = mid;
      }
      b -= hi;
    }
    run.push(b);
  }
  // 每圈推過整半圈;逐步推開時累積的微小誤差按比例攤掉
  const table = run.slice(2 * STEPS);
  const raw = table[STEPS] - table[0];
  return { TABLE: table.map((x) => table[0] + ((x - table[0]) * -Math.PI) / raw) };
})();

/** A 轉 c(順時針):B 的轉角(自起點,順時針為負) */
export function wheelB(c) {
  const k = Math.floor(c / TAU);
  const x = ((c - k * TAU) / TAU) * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(x));
  const b = TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (x - i);
  return b - TABLE[0] - k * Math.PI;
}
const camAngle = (c) => FACE0 - c;
/** 檢查用:主動量 c 時凸輪的輪廓與兩個擋止(世界座標 2D) */
export function contactAt(c) {
  const phi = camAngle(c);
  const b = wheelB(c) + TABLE[0];
  return { cam: placeOutline(camOutline, [0, 0], phi), stops: [0, 1].map((k) => placeOutline(RING, stopCenter(b, k), 0)) };
}

const stopPiece = (k) => ({ kind: "cylinder", radius: STOP.pin, length: 0.35, at: [...polar(STOP.r, k * Math.PI + Math.PI).slice(0, 2), 0.175] }); // 立在碟面上,伸到凸輪那一層

export default {
  figure: 88,
  parts: [
    {
      id: "cam",
      kind: "group",
      spin: CAM.high,
      pieces: [
        { kind: "plate", shape: shape(camOutline, [circle(0.15).reverse()]), thickness: 0.2, circles: [0.36], mark: polar(0.75, deg(200)).slice(0, 2), markSize: 0.07 },
        { kind: "cylinder", radius: 0.15, length: 1.3, at: [0, 0, -0.55] }, // A 的軸,往後穿過偏心軸套
      ],
      label: "A",
      labelOffset: [-0.35, 0.45, 0.3],
    },
    {
      id: "wheel",
      kind: "group",
      center: [...B_AT, -0.25],
      spin: DISH.outer,
      pieces: [
        { kind: "plate", shape: shape(circle(DISH.outer), [circle(DISH.bore).reverse()]), thickness: 0.1, at: [0, 0, -0.05], mark: polar(DISH.inner - 0.15, deg(150)).slice(0, 2), markSize: 0.07 },
        { kind: "cylinder", radius: DISH.outer, inner: DISH.inner, length: 0.45, at: [0, 0, 0.175] },
        { kind: "cylinder", radius: 0.78, inner: DISH.bore, length: 0.25, at: [0, 0, -0.2] }, // 轂(在凸輪後面)
        stopPiece(0),
        stopPiece(1),
      ],
      label: "B",
      labelOffset: [0, 2.0, 0.5],
    },
    {
      // 機架:固定的偏心軸套(B 轉在套外,A 的軸穿過套上偏離中心的孔)與托著它的支架,都在 B 的後面
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(DISH.bore - 0.01, B_AT[0], B_AT[1]), [circle(0.17).reverse()]), thickness: 0.75, at: [0, 0, -0.6] },
        { kind: "box", size: [0.5, 2.6, 0.2], at: [B_AT[0], B_AT[1] - 1.6, -0.88] },
        { kind: "box", size: [2.0, 0.2, 0.7], at: [B_AT[0], B_AT[1] - 2.95, -0.88] },
      ],
    },
    { id: "labelC", kind: "group", label: "C", labelOffset: [0, 0.35, 0.3] },
    { id: "labelD", kind: "group", label: "D", labelOffset: [0, 0.35, 0.3] },
  ],
  // 動力重演:只推凸輪;B 鉸在偏心軸上,軸有摩擦(沒被推時停住),由台階推擋止帶動
  replay: {
    free: { wheel: { hold: true, gravity: false } },
    expect: [
      { at: deg(90), part: "wheel", label: "台階推著擋止 C,帶 B 轉", quote: "當凸輪 A 被賦予連續旋轉運動時,會將間歇的旋轉運動傳遞給輪 B" },
      { at: deg(240), part: "wheel", label: "C 滑出台階後 B 停住", quote: "輪 B 保持靜止,直到凸輪完成其旋轉為止" },
      { at: TAU, part: "wheel", label: "凸輪轉完一圈,台階推下一個擋止 D", quote: "屆時同樣的運動便會再次重複" },
    ],
  },
  driver: { part: "cam", type: "rotation", speed: 0.9 },
  target: "wheel", // 間歇旋轉的碟形輪 B
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const b = wheelB(c);
    const at = (k) => [...stopCenter(b + TABLE[0], k), 0];
    return {
      parts: {
        cam: { angle: camAngle(c) },
        wheel: { angle: b + TABLE[0] },
        labelC: { position: at(0) },
        labelD: { position: at(1) },
      },
      readouts: [],
    };
  },
};
