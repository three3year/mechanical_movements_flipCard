// 第 86 種:以旋轉運動驅動往復式泵。承載泵桿的繩索繫在輪 A 上,輪 A 鬆套在軸上;軸帶動凸輪 C 連續旋轉。
// 凸輪每轉一圈,就抓住裝在輪上的鉤形制動裝置 B,把它連同輪一起帶著轉、把繩索抬起;
// 直到制動裝置的末端撞上上方的靜止擋止,制動裝置被釋放,輪便被泵桶的重量拉回原位。
// 主動件是軸(凸輪 C),照原圖的樣子順時針轉(原文沒寫轉向;原圖 B 在輪的左側、尾端朝左下伸出輪外,
// 擋止在上方,輪得順時針轉,B 的尾端才會往上撞到擋止)。
//
// 照原圖:B 是一根直槓桿,鉸在輪的左側(輪輻上的銷),尾端伸出輪外;前端彎成鉤,鉤頭往內伸到凸輪的轂。
// B 前端較重,靠自重把鉤頭壓在凸輪的轂上。凸輪是一個轂加一顆齒:齒的前壁(順時針那一面)沿半徑,
// 背面是斜坡。各段都由接觸算(推斷:原文只說「鉤形」「撞到擋止被釋放」):
// - 齒轉到鉤頭處,前壁推著鉤頭走,輪就跟著轉。推的力對 B 的樞軸是把鉤往內壓的(接觸點離軸心比
//   樞軸在那條半徑上的投影遠),所以泵桶的重量越大鉤得越緊,不會被擠出來。
// - 輪轉到 B 的尾端撞上擋止,輪再往前走時尾端被擋住、B 繞樞軸被撬開,鉤頭沿齒的前壁滑出;
//   要撬開得讓輪比凸輪多走一點(鉤是往內咬的),這也由接觸算。鉤頭一滑出齒頂,B 就被釋放。
// - 輪被泵桶拉回是憑重量落下的過程(jumps.falling):起步慢、越來越快,回到原位停住(原位:泵桶落到底);
//   同時 B 憑自重擺回,鉤頭從齒背的斜坡上滑過、落回轂上(也用 falling,但不穿進凸輪)。
import { TAU, deg, polar, rot2, wrap } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { falling } from "./jumps.js";
import { placeOutline, polygonsOverlap } from "./contact.js";

const R = 1.55; // 輪 A
const PIVOT = [-1.2, 0]; // B 的樞軸(在輪上,輪在原位時)
const HUB = 0.42; // 凸輪的轂
const TOOTH = { r: 0.74, top: deg(12), back: deg(42) }; // 齒頂半徑、齒頂與齒背斜坡的角寬
const FALL = deg(50); // 輪被拉回所需的軸轉角
const CLEAR = deg(0.2); // B 靠上凸輪時留的一點間隙(轂是多邊形,貼死的話輪一轉鉤頭就會擦到它的角)
const BACK_OFF = { step: deg(0.25), steps: 240 }; // B 被頂住時往外退的步距與最多步數
const SWING_IN = deg(40); // B 憑自重往內擺時找接觸的範圍
const ROPE_Y = -R - 0.04;
const Z = { cam: 0.35, catch: 0.35 }; // 凸輪與 B 同一層,鉤頭才真的靠在凸輪上

// B 的外形(輪在原位、B 靜止時的世界座標;下面換成以樞軸為原點的局部座標)。
// 鉤頭是一段沿半徑的直條:朝齒來的那一面(逆時針側)沿半徑,和齒的前壁平行,推力只有切線方向;
// 內端是平的,靠在轂上。鉤頭若收成尖的,齒推在斜邊上會把鉤頭往外擠出來。
const NOSE_AT = deg(105); // 鉤頭逆時針側的那條半徑
const NOSE = { inner: HUB + 0.02, outer: 1.12, width: 0.16 };
const CW_DIR = [Math.sin(NOSE_AT), -Math.cos(NOSE_AT)]; // 從這條半徑往順時針側
const nosePoint = (r, w) => [r * Math.cos(NOSE_AT) + w * CW_DIR[0], r * Math.sin(NOSE_AT) + w * CW_DIR[1]];
const ELBOW = nosePoint(NOSE.outer - 0.08, NOSE.width / 2); // 槓桿接到鉤頭外端
const LEVER = Math.atan2(ELBOW[1] - PIVOT[1], ELBOW[0] - PIVOT[0]); // 槓桿的方向
const TAIL = 1.3; // 尾端伸出樞軸的長度
const toLocal = ([x, y]) => rot2([x - PIVOT[0], y - PIVOT[1]], -LEVER);
const bar = (a, b, w) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(dx, dy);
  const [nx, ny] = [(-dy / l) * w, (dx / l) * w];
  return [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
};
const LEVER_OUTLINE = bar([-TAIL, 0], [toLocal(ELBOW)[0], 0], 0.08); // 槓桿身(尾端是直的端面)
const NOSE_OUTLINE = [nosePoint(NOSE.inner, 0), nosePoint(NOSE.inner, NOSE.width), nosePoint(NOSE.outer, NOSE.width), nosePoint(NOSE.outer, 0)].map(toLocal);

// 凸輪(局部座標,齒的前壁在局部角 0,齒身在逆時針側;順時針轉時前壁在前)
const camOutline = [
  ...Array.from({ length: 96 }, (_, i) => polar(HUB, TOOTH.back + (i / 95) * (TAU - TOOTH.back)).slice(0, 2)),
  polar(TOOTH.r, 0).slice(0, 2),
  ...Array.from({ length: 5 }, (_, i) => polar(TOOTH.r, ((i + 1) / 5) * TOOTH.top).slice(0, 2)),
  polar(HUB + 0.12, TOOTH.back - deg(6)).slice(0, 2),
];

// 擋止:從上方橫梁垂下的擋塊,在 B 那一層;B 的尾端轉到這裡撞上它的左側面
const STOP = { x: [-0.55, -0.25], y: [1.95, 2.62] };
const STOP_OUTLINE = [[STOP.x[0], STOP.y[0]], [STOP.x[1], STOP.y[0]], [STOP.x[1], STOP.y[1]], [STOP.x[0], STOP.y[1]]];

const CAM0 = deg(140); // 主動量 0 時齒的前壁的方向(齒在鉤頭的逆時針側,還沒碰到)
const camAt = (c) => placeOutline(camOutline, [0, 0], CAM0 - c);
const pivotAt = (w) => rot2(PIVOT, w);
/** 輪角 w、B 的 tilt(B 相對於輪的轉角,原位為 0;正值:逆時針,鉤頭往外)時 B 的兩塊外形 */
const catchAt = (w, tilt) => {
  const pivot = pivotAt(w);
  const a = LEVER + w + tilt;
  return [placeOutline(LEVER_OUTLINE, pivot, a), placeOutline(NOSE_OUTLINE, pivot, a)];
};
const overlaps = (polys, obstacle) => polys.some((p) => polygonsOverlap(p, obstacle));

/**
 * B 憑自重往內(順時針)擺,停在第一次碰到凸輪或擋止的地方。起點若被擋止壓著,先往外(逆時針)退開;
 * 往外退時鉤頭若擠進齒的前壁,就停在那裡(交給下一步由齒把輪推開)。liftOffCam:輪在落回、凸輪擠到鉤頭時,
 * 鉤頭被凸輪頂起(從齒頂、齒背上滑過)。
 */
function settle(cam, w, from, liftOffCam = false) {
  const onStop = (t) => overlaps(catchAt(w, t), STOP_OUTLINE);
  const touching = (t) => onStop(t) || overlaps(catchAt(w, t), cam);
  const pushedOut = liftOffCam ? touching : onStop; // 哪些接觸會把 B 往外頂
  let t = from;
  for (let i = 0; i < BACK_OFF.steps && pushedOut(t); i++) t += BACK_OFF.step;
  if (touching(t)) return t;
  let lo = t;
  let hi = t - SWING_IN;
  if (!touching(hi)) return hi;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (touching(mid)) hi = mid;
    else lo = mid;
  }
  return lo + CLEAR;
}

// 從主動量 0 起逐步轉凸輪(每圈 STEPS 步),走兩圈,取第二圈當週期:
// 輪被泵桶往回拉(逆時針,原位 0 為止),齒的前壁擋著鉤頭時輪就停在那裡(被推著走);
// B 憑自重靠在凸輪上,尾端碰到擋止就被撬開。鉤頭一滑出齒,輪擋不住、往回落(之後用落下的過程演出)。
const STEPS = 720;
const SETTLE_ROUNDS = 6; // 每步「齒推輪、B 靠上去」交替的次數
const PUSH_MAX = deg(8); // 一步之內齒最多把輪推多遠;推這麼遠還碰著,碰到的就不是齒的前壁
const RETREAT_PROBE = deg(1.5); // 試著讓輪往回退這麼多:退得回去就是鉤頭滑出齒了
const MIN_LIFT = deg(20); // 輪被帶過這個角度以上才算一次抬起(以下是剛碰到時的微小移動)
const CYCLE = (() => { // 一圈的查表:每步的輪角、B 的 tilt、是否被齒推著
  let w = 0;
  let tilt = 0;
  let fall = null; // 落下中:{ at: 開始的步數, from: 輪角, tilt }
  const run = [];
  for (let i = 0; i <= 2 * STEPS; i++) {
    const c = (i / STEPS) * TAU;
    const cam = camAt(c);
    if (fall) {
      const s = (i - fall.at) / ((FALL / TAU) * STEPS);
      if (s >= 1) fall = null;
      else {
        w = fall.from * (1 - falling(s));
        // B 憑自重擺回,不穿進凸輪
        const rest = settle(cam, w, tilt, true);
        tilt = Math.max(rest, fall.tilt - (fall.tilt - rest) * falling(Math.min(1, s * 3)));
        run.push({ w, tilt, hooked: false });
        continue;
      }
      w = 0;
    }
    // 齒碰到鉤頭就把輪往前(順時針)推到剛好不碰;B 靠自重搭在凸輪上,被擋止壓著時往外退;兩者交替做幾次
    const blocked = (x) => overlaps(catchAt(x, tilt), cam);
    for (let k = 0; k < SETTLE_ROUNDS; k++) {
      if (blocked(w) && !blocked(w - PUSH_MAX)) {
        let lo = w;
        let hi = w - PUSH_MAX;
        for (let j = 0; j < 24; j++) {
          const mid = (lo + hi) / 2;
          if (blocked(mid)) lo = mid;
          else hi = mid;
        }
        w = hi;
      } else if (blocked(w)) tilt = settle(cam, w, tilt, true); // 推輪解不開(碰到的是轂或齒背):鉤頭被頂起
      tilt = settle(cam, w, tilt);
    }
    // 輪被泵桶往回拉:退得回去(齒擋不住鉤頭)就是釋放,輪開始落回
    if (w < 0 && !blocked(Math.min(0, w + RETREAT_PROBE))) {
      if (w < -MIN_LIFT) fall = { at: i, from: w, tilt };
      else w = 0;
    }
    run.push({ w, tilt, hooked: !fall && w < 0 });
  }
  return run.slice(STEPS);
})();
const LIFT_STEP = CYCLE.findIndex((s, i) => i > 0 && !s.hooked && CYCLE[i - 1].hooked);
if (LIFT_STEP < 0) throw new Error("第 86 種:擋止沒有撬開制動裝置,輪一直沒被釋放");
/** 釋放時的主動量(一圈之內) */
export const lift = (LIFT_STEP / STEPS) * TAU;
/** 釋放時輪轉過的角度(順時針為負) */
export const liftAngle = CYCLE[LIFT_STEP - 1].w;

/** 軸轉 c(順時針):輪 A 的轉角(順時針為負)、制動裝置是否被齒推著(hooked)、制動裝置相對於輪的轉角(tilt) */
export function pump(c) {
  const x = ((((c % TAU) + TAU) % TAU) / TAU) * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(x));
  const f = x - i;
  const [a, b] = [CYCLE[i], CYCLE[i + 1]];
  return { wheel: a.w + (b.w - a.w) * f, tilt: a.tilt + (b.tilt - a.tilt) * f, hooked: a.hooked };
}

/** 檢查用:主動量 c 時凸輪、B 與擋止的外形(世界座標 2D) */
export function contactAt(c) {
  const { wheel, tilt } = pump(c);
  return { cam: camAt(c), catch: catchAt(wheel, tilt), stop: STOP_OUTLINE };
}

export default {
  figure: 86,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: [0, 0, Z.cam],
      spin: 0.75,
      pieces: [
        { kind: "plate", shape: shape(camOutline, [circle(0.15).reverse()]), thickness: 0.16, mark: polar(0.29, deg(200)).slice(0, 2), markSize: 0.05 },
        { kind: "cylinder", radius: 0.15, length: 1.6, at: [0, 0, -0.5] },
      ],
      label: "C",
      labelOffset: [-0.3, 0.75, 0.2],
    },
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.14, length: 0.42 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [R - 0.3, 0.14, 0.12], at: [...polar((R - 0.3) / 2 + 0.2, (k * TAU) / 4).slice(0, 2), 0], angle: (k * TAU) / 4, accent: k === 0 })),
        { kind: "cylinder", radius: 0.28, inner: 0.17, length: 0.3 },
        // 制動裝置的樞軸銷,立在左邊的輪輻上、伸到 B 那一層
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [...PIVOT, 0.2] },
      ],
      label: "A",
      labelOffset: [1.25, 0.65, 0.3],
    },
    {
      id: "catch",
      kind: "group",
      center: [...PIVOT, Z.catch],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(LEVER_OUTLINE, [circle(0.06).reverse()]), thickness: 0.08, angle: LEVER },
        { kind: "plate", shape: shape(NOSE_OUTLINE), thickness: 0.08, angle: LEVER },
        { kind: "cylinder", radius: 0.1, length: 0.2 },
      ],
      label: "B",
      labelOffset: [-0.3, 0.28, 0.2],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.4, -2.3], [1.4, -2.3], [0.42, 0.25], [0.38, 0.5], [-0.38, 0.5], [-0.42, 0.25]], [[[-0.85, -2.0], [0.85, -2.0], [0.12, -0.35], [-0.12, -0.35]].reverse(), circle(0.2).reverse()]), thickness: 0.2, at: [0, 0, 0.55] },
        { kind: "box", size: [3.6, 0.15, 0.8], at: [0, -2.4, 0] },
        { kind: "box", size: [0.2, 5.2, 0.4], at: [-2.45, 0.2, 0] },
        { kind: "box", size: [3.9, 0.16, 0.9], at: [-0.6, 2.7, 0.05] },
        // 擋止:從橫梁垂下的擋塊,在 B 那一層
        { kind: "box", size: [STOP.x[1] - STOP.x[0], STOP.y[1] - STOP.y[0], 0.3], at: [(STOP.x[0] + STOP.x[1]) / 2, (STOP.y[0] + STOP.y[1]) / 2, Z.catch] },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  // 動力重演:只推軸(凸輪);輪鬆套在軸上、被泵桶的重量往回拉(以彈簧代表,原位以轉角的上限代表泵桶落到底),
  // 制動裝置鉸在輪上,靠自重把鉤頭搭在凸輪上
  replay: {
    from: 0,
    to: 2 * TAU,
    seconds: 20,
    free: { wheel: { spring: 1, gravity: false, limits: [-3, 0] }, catch: { on: "wheel" } },
    ignore: [["wheel", "frame"], ["wheel", "shaft"]],
    expect: [
      { at: lift * 0.8, part: "wheel", label: "凸輪的齒抓住制動裝置,帶著輪轉", quote: "抓住連接於該輪上的鉤形制動裝置 B,並將其連同輪一起帶動旋轉" },
      { at: lift + FALL + deg(20), part: "wheel", label: "制動裝置撞到擋止被釋放,輪被泵桶拉回原位", quote: "輪則憑藉泵桶的重量而被拉回原位" },
      { at: TAU + lift * 0.8, part: "wheel", label: "下一圈再抓住制動裝置", quote: "凸輪每旋轉一圈" },
    ],
  },
  driver: { part: "shaft", type: "rotation", speed: 0.8 },

  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const { wheel, tilt } = pump(c);
    const pivot = pivotAt(wheel);
    return {
      parts: {
        shaft: { angle: CAM0 - c },
        wheel: { angle: wheel },
        catch: { position: [pivot[0], pivot[1], Z.catch], angle: wheel + tilt },
      },
      // 繩索從輪底往右;輪順時針轉時輪底往左走,把繩捲起
      paths: { rope: { points: [[0, ROPE_Y, 0], [3.0, ROPE_Y, 0]], closed: false, phase: wheel * R } },
      readouts: [],
    };
  },
};
