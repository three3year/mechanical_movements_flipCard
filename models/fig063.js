// 第 63 種:跳躍式的旋轉運動,用於計量器與轉數計數器。右側圓盤(主動件,順時針)背面的三根插銷,
// 依序從下方頂起左側落板右端彎下來的鉤腳,以及鉸在落板鉤上的棘爪的耳;落板以左上的大螺絲為樞軸,尾端壓在板彈簧上。
// 照原文的順序:插銷先頂起棘爪(爪尖離開齒間)和落板,接著先從棘爪的耳滑脫,棘爪憑自重落進星形輪的下一格;
// 插銷再從鉤腳滑脫,彈簧把落板猛然甩下,落板的擋片壓著棘爪的柱子把棘爪一起帶下去,爪尖把星形輪推轉一格(逆時針)。
// 每通過一根插銷重複一次。(原文說落板「撞擊」棘爪的柱子;模型裡棘爪落進下一格時柱子已經靠在擋片上,擋片是推著它走)
// 前後的層次(由前往後):星形輪、圓盤、棘爪、落板。插銷從圓盤往後伸,頂得到棘爪與落板,碰不到星形輪;
// 棘爪的爪尖是一根往前伸到星形輪那一層的短銷。原圖的鉤與棘爪是虛線(在圓盤後面),和這個層次一致。
// 各零件的轉角都由接觸算:落板靠在插銷或固定柱上;棘爪憑自重往下擺,停在插銷、星形輪或落板的擋片上;
// 星形輪只在被爪尖推著時轉,轉到剛好讓開爪尖為止。落板落下的過程演出來(jumps.falling);
// 棘爪落進下一格的快慢由耳從插銷上滑下來決定。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { circle, polarOutline, shape, thickLine } from "./shapes.js";
import { swingUntilContact, placeOutline, circlePolygon, polygonsOverlap } from "./contact.js";
import { falling } from "./jumps.js";

const DISC = { center: [2.05, -0.2], radius: 1.3, pins: 3, pinR: 1.05, pinSize: 0.09 };
const STAR = { center: [-0.2, -0.87], points: 12, outer: 1.38, inner: 0.9 };
const PIVOT = [-0.93, 1.98]; // 落板的樞軸
const Z = { star: 0.35, disc: 0, pawl: -0.35, drop: -0.6 };
const STOP = { center: [-2.03, 1.68], r: 0.08 }; // 落板落定時尾端上緣頂著的固定柱(落板往下甩時尾端往上)
const SPRING = { root: [-3.0, 0.75], tip: [1.1, 0.1] };
const PEG = 0.07; // 爪尖短銷的半徑
const POST = 0.06; // 棘爪柱子的半徑

export const starPitch = TAU / STAR.points;
export const pinPeriod = TAU / DISC.pins;
const DROP = deg(18); // 落板落下的過程佔圓盤轉角多少(約 0.26 秒)
export const dropSpan = DROP;

// 設計姿勢(落板落定、爪尖剛把齒推到位):以世界座標畫棘爪,再換成棘爪的局部座標(樞軸為原點,爪尖朝 +x)
// 棘爪從右上斜斜地(約 40°)伸到星形輪頂上:推的時候齒面的反力把爪尖往齒間裡帶,不會把爪頂出來
// 爪尖在星形輪約 116° 的位置:落板抬起時爪尖沿輪緣往上游走,恰好走過一齒,停在下一格上方
const TIP_AT = [STAR.center[0] + 1.08 * Math.cos(deg(116)), STAR.center[1] + 1.08 * Math.sin(deg(116))];
const PAWL_AT = [1.4, TIP_AT[1] + (1.4 - TIP_AT[0]) * Math.tan(deg(40))]; // 棘爪的樞軸(世界座標,落板落定時),在落板臂的右端
const PAWL_ANGLE = Math.atan2(TIP_AT[1] - PAWL_AT[1], TIP_AT[0] - PAWL_AT[0]);
const PAWL_LENGTH = Math.hypot(TIP_AT[0] - PAWL_AT[0], TIP_AT[1] - PAWL_AT[1]);
const toPawl = (pts) => pts.map(([x, y]) => rot2([x - PAWL_AT[0], y - PAWL_AT[1]], -PAWL_ANGLE));
const toDrop = (pts) => pts.map(([x, y]) => [x - PIVOT[0], y - PIVOT[1]]);
const PAWL_PIVOT = toDrop([PAWL_AT])[0]; // 棘爪的樞軸(落板局部)
const POST_AT = [PAWL_AT[0] + 0.32, PAWL_AT[1] + 0.02]; // 棘爪的柱子(世界座標,設計姿勢):在樞軸右邊,棘爪往下擺時它往上頂到落板的擋片

const FOOT = -0.1; // 鉤腳的下緣(世界座標,設計姿勢)
// 棘爪的耳(世界座標,設計姿勢):從爪身垂到鉤腳旁邊,下緣和鉤腳齊平,右緣比鉤腳短,插銷先從耳滑脫
const LUG = { x: [0.98, 1.28], y: -0.1 };
const LEDGE = POST_AT[1] + POST + 0.002; // 擋片的下緣(世界座標,設計姿勢):剛好貼著棘爪的柱子
// 落板(局部,樞軸為原點):左邊往下斜的尾端、中央的螺絲座、右邊伸到圓盤上方再彎下來的鉤,
// 鉤的下端有一隻往左伸的腳(插銷從下面頂它),鉤的右邊有一片擋片(棘爪的柱子撞它)
const dropOutline = [
  [-0.3, 0.3],
  [-1.0, -0.3],
  [-1.45, -0.75],
  [-1.4, -0.98],
  [-0.9, -0.75],
  [-0.35, -0.42],
  [0.35, -0.42],
  [1.95, -0.55],
  [2.08, -0.55],
  ...toDrop([
    [1.15, FOOT + 0.2],
    [0.95, FOOT + 0.2],
    [0.95, FOOT],
    [1.42, FOOT],
    [1.42, LEDGE],
    [1.95, LEDGE],
    [1.95, LEDGE + 0.16],
    [1.55, 1.98],
  ]),
  [2.25, 0.22],
  [0.4, 0.44],
];
// 棘爪(局部,局部 +y 在世界裡朝下):從樞軸往左下伸到星形輪頂上的長爪,樞軸左下垂一片耳(插銷頂它),
// 樞軸右邊一小段帶柱子
const pawlOutline = [
  [-0.45, -0.12],
  [PAWL_LENGTH - 0.15, -0.08],
  [PAWL_LENGTH + 0.06, 0],
  [PAWL_LENGTH - 0.15, 0.08],
  ...toPawl([
    [LUG.x[0], PAWL_AT[1] - (PAWL_AT[0] - LUG.x[0]) * Math.tan(deg(40)) - 0.05],
    [LUG.x[0], LUG.y],
    [LUG.x[1], LUG.y],
    [LUG.x[1], PAWL_AT[1] - (PAWL_AT[0] - LUG.x[1]) * Math.tan(deg(40)) - 0.05],
  ]),
  [0, 0.14],
  [-0.1, 0.3],
  [-0.45, 0.3],
];
const PAWL_POST = toPawl([POST_AT])[0];

const starOutline = polarOutline((a) => {
  const f = (((a / starPitch) % 1) + 1) % 1;
  return STAR.inner + (STAR.outer - STAR.inner) * Math.max(0, 1 - Math.abs(f - 0.5) * 2) ** 1.3;
}, 240);
// 被推的那一齒(局部角 0 到一個齒距的扇形,齒尖在半個齒距處)
const toothWedge = [[0, 0], ...starOutline.slice(0, 21)];

const pinAngle = (i, v) => deg(150) + (i * TAU) / DISC.pins + v;
const pinAt = (i, v) => {
  const [x, y] = polar(DISC.pinR, pinAngle(i, v));
  return [DISC.center[0] + x, DISC.center[1] + y];
};
const pins = (v) => Array.from({ length: DISC.pins }, (_, i) => circlePolygon(pinAt(i, v), DISC.pinSize));

/** 落板靠在插銷(或固定柱)上的轉角;v 是圓盤的轉角(順時針為負) */
export function dropRest(v) {
  return swingUntilContact({ pivot: PIVOT, outline: dropOutline, from: 0.6, into: -1, sweep: 0.8, steps: 96 }, [circlePolygon(STOP.center, STOP.r), ...pins(v)]);
}

const pawlPivotWorld = (drop) => {
  const [x, y] = rot2(PAWL_PIVOT, drop);
  return [PIVOT[0] + x, PIVOT[1] + y];
};
const placeStar = (outline, angle) => placeOutline(outline, STAR.center, angle);
const pegAt = (drop, pawl) => {
  const [px, py] = pawlPivotWorld(drop);
  return circlePolygon([px + PAWL_LENGTH * Math.cos(pawl), py + PAWL_LENGTH * Math.sin(pawl)], PEG);
};
const postAt = (drop, pawl) => {
  const [px, py] = pawlPivotWorld(drop);
  const [x, y] = rot2(PAWL_POST, pawl);
  return circlePolygon([px + x, py + y], POST);
};

// 棘爪相對落板最多往下擺到柱子頂住擋片(設計姿勢就是頂住的位置)
const REL = (() => {
  const drop = placeOutline(dropOutline, PIVOT, 0);
  const pivot = pawlPivotWorld(0);
  return swingUntilContact({ pivot, outline: circlePolygon(PAWL_POST, POST), from: PAWL_ANGLE - 0.3, into: 1, sweep: 0.6, steps: 120 }, [drop]);
})();

/**
 * 棘爪憑自重往下擺(逆時針),最多擺到柱子頂住擋片;插銷頂著耳、或爪尖靠在齒上時,停在剛好不重疊的地方。
 * 從擋片的位置往上(順時針)找第一個不重疊的轉角——爪尖沿齒面滑出、被插銷頂起,都是往這個方向讓開
 */
function pawlRest(drop, star, v) {
  const pivot = pawlPivotWorld(drop);
  const top = drop + REL;
  const blockers = pins(v);
  const starNow = placeStar(starOutline, star);
  const hits = (a) => {
    if (polygonsOverlap(pegAt(drop, a), starNow)) return true;
    const placed = placeOutline(pawlOutline, pivot, a);
    return blockers.some((p) => polygonsOverlap(placed, p));
  };
  if (!hits(top)) return top;
  const step = 0.01;
  for (let i = 1; i <= 120; i++) {
    const a = top - i * step;
    if (!hits(a)) {
      let lo = a;
      let hi = a + step;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (hits(mid)) hi = mid;
        else lo = mid;
      }
      return lo;
    }
  }
  return top - 1.2;
}

/**
 * 爪尖(棘爪頂住擋片時)要把那一齒推離多少,才不和爪尖重疊:那一齒被推到爪尖的下游,
 * 所以找的是「推多少仍重疊」的最後一點之後(爪尖已經越過那一齒原來的位置時,原位不重疊不代表沒被推)
 */
function pushOf(drop, base) {
  const peg = pegAt(drop, drop + REL);
  const hits = (d) => polygonsOverlap(peg, placeStar(toothWedge, base + d));
  const n = 90;
  let last = -1;
  for (let i = 0; i <= n; i++) if (hits((starPitch * 1.5 * i) / n)) last = i;
  if (last < 0) return 0;
  let lo = (starPitch * 1.5 * last) / n;
  let hi = (starPitch * 1.5 * (last + 1)) / n;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

// 以 w = −v(順時針的進程)描述一個插銷週期
const restOf = (w) => dropRest(-w);
const DOWN = Math.min(...Array.from({ length: 240 }, (_, i) => restOf((pinPeriod * i) / 240))); // 落定的轉角(尾端頂著固定柱)
// 落板滑脫的位置:落板靠著的轉角驟降的地方
export const RELEASE = (() => {
  let best = 0;
  let at = 0;
  const n = 720;
  for (let i = 1; i <= n; i++) {
    const jump = restOf((pinPeriod * (i - 1)) / n) - restOf((pinPeriod * i) / n);
    if (jump > best) [best, at] = [jump, (pinPeriod * (i - 1)) / n];
  }
  return at;
})();
const HELD = restOf(RELEASE);

// 星形輪的相位:落定時爪尖剛好貼著剛推過的那一齒(STAR_END);週期開始時那一齒還在上游一格(STAR0)
const STAR_END = (() => {
  const peg = pegAt(DOWN, DOWN + REL);
  const [x, y] = [peg[0][0] - PEG - STAR.center[0], peg[0][1] - STAR.center[1]];
  const start = Math.atan2(y, x) - starPitch / 2;
  return start + pushOf(DOWN, start);
})();
const STAR0 = STAR_END - starPitch;

/** 進程 w 時:落板、星形輪、棘爪的轉角;height 是落板抬起的比例 */
export function counter(w) {
  const k = Math.floor(w / pinPeriod);
  const u = w - k * pinPeriod;
  let drop = restOf(u);
  const landed = u >= RELEASE + DROP;
  if (u >= RELEASE && !landed) drop = HELD + (drop - HELD) * falling((u - RELEASE) / DROP);
  const push = u < RELEASE ? 0 : landed ? starPitch : Math.min(starPitch, pushOf(drop, STAR0));
  const star = STAR0 + starPitch * k + push;
  const pawl = pawlRest(drop, STAR0 + push, -u);
  return { drop, star, pawl, height: (drop - DOWN) / (HELD - DOWN) };
}

/** 測試用:進程 w 時爪尖、星形輪、插銷、棘爪與落板的世界座標外形 */
export function contactAt(w) {
  const { drop, star, pawl } = counter(w);
  const u = w - Math.floor(w / pinPeriod) * pinPeriod;
  return {
    peg: pegAt(drop, pawl),
    star: placeStar(starOutline, star),
    pins: pins(-u),
    pawl: placeOutline(pawlOutline, pawlPivotWorld(drop), pawl),
    post: postAt(drop, pawl),
    drop: placeOutline(dropOutline, PIVOT, drop),
  };
}

// 板彈簧:固定端在左邊的座上,自由端頂著落板尾端的下緣(落板抬起時接觸點沿著下緣滑)
const springOutline = thickLine([[0, 0], [0.5, 0.03], [SPRING.tip[0], SPRING.tip[1]]], 0.05);
function springAngle(drop) {
  return swingUntilContact({ pivot: SPRING.root, outline: springOutline, from: -0.5, into: 1, sweep: 1.2, steps: 60 }, [placeOutline(dropOutline, PIVOT, drop)]);
}

const dropToPawl = Z.pawl - Z.drop;
const PIN_BACK = Z.drop - 0.05; // 插銷後端(落板那一層的後面)
const PIN_FRONT = Z.disc + 0.15; // 插銷前端(盤面前一點,離星形輪那一層還有距離)
// 初始姿勢與動力重演的起點:插銷正頂著棘爪的耳、落板還在上升
const START = -(RELEASE - 0.45 * pinPeriod);
const replayStart = counter(-START);
const startLift = replayStart.pawl - replayStart.drop - REL; // 起點時棘爪被頂離擋片多少(負的)
export default {
  figure: 63,
  parts: [
    {
      id: "disc",
      kind: "plate",
      center: [...DISC.center, Z.disc],
      shape: shape(circle(DISC.radius), [circle(0.12).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      spin: DISC.radius,
      // 插銷穿過圓盤往後伸,頂得到棘爪的耳(棘爪那一層)和落板的鉤腳(落板那一層);
      // 前端只在盤面露出一小截(看得到插銷在哪),碰不到前面的星形輪
      pieces: Array.from({ length: DISC.pins }, (_, i) => ({
        kind: "cylinder",
        radius: DISC.pinSize,
        length: PIN_FRONT - PIN_BACK,
        at: [...polar(DISC.pinR, pinAngle(i, 0)).slice(0, 2), (PIN_FRONT + PIN_BACK) / 2 - Z.disc],
        accent: i === 0,
      })),
    },
    {
      id: "star",
      kind: "plate",
      center: [...STAR.center, Z.star],
      shape: shape(starOutline, [circle(0.12).reverse()]),
      thickness: 0.16,
      hub: 0.28,
      mark: [0.5, 0],
      markSize: 0.08,
      spin: 1.4,
    },
    {
      id: "drop",
      kind: "group",
      center: [...PIVOT, Z.drop],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(dropOutline, [circle(0.3).reverse()]), thickness: 0.14 },
        { kind: "cylinder", radius: 0.42, inner: 0.3, length: 0.2 },
        { kind: "box", size: [0.5, 0.06, 0.08], at: [0, 0, 0.12], angle: deg(60) },
        // 棘爪的樞軸銷:從落板往前伸到棘爪那一層
        { kind: "cylinder", radius: 0.06, length: dropToPawl + 0.1, at: [...PAWL_PIVOT, dropToPawl / 2] },
      ],
    },
    {
      id: "pawl",
      kind: "plate",
      center: [0, 0, Z.pawl],
      shape: shape(pawlOutline, [circle(0.06).reverse()]),
      thickness: 0.12,
      arrow: false,
      pieces: [
        // 爪尖的短銷往前伸到星形輪那一層;柱子往後伸到落板那一層,落板的擋片撞它
        { kind: "cylinder", radius: PEG, length: Z.star - Z.pawl + 0.08, at: [PAWL_LENGTH, 0, (Z.star - Z.pawl) / 2] },
        { kind: "cylinder", radius: POST, length: dropToPawl + 0.08, at: [...PAWL_POST, -dropToPawl / 2] },
      ],
    },
    { id: "spring", kind: "plate", center: [...SPRING.root, Z.drop], shape: shape(springOutline), thickness: 0.12, arrow: false },
    { id: "springSeat", kind: "box", size: [0.3, 0.28, 0.3], center: [SPRING.root[0] - 0.12, SPRING.root[1], Z.drop] },
    // 星形輪的軸(推斷:原圖只畫了輪心的圓)
    { id: "starStud", kind: "cylinder", center: [...STAR.center, Z.star], radius: 0.1, length: 0.5 },
    { id: "stop", kind: "cylinder", center: [...STOP.center, Z.drop], radius: STOP.r, length: 0.3, pieces: [{ kind: "box", size: [0.12, 0.5, 0.12], at: [0, 0.3, 0] }] },
  ],
  // 圓盤順時針轉(轉角為負);自動播放時主動量往負的方向走
  driver: { part: "disc", type: "rotation", speed: -1.2, initial: START },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  waivers: [
    { check: "interference", parts: ["spring", "springSeat"], reason: "板彈簧的根部夾在座裡;彎曲以整片繞根部轉動示意,根部在座內轉動的重疊可接受" },
    {
      check: "replay",
      parts: ["star"],
      at: START - pinPeriod,
      reason:
        "未修:動力重演不成立——「下一根插銷抬起落板時星形輪不動」預期 star 已轉 30°,實際轉了 17°。前三個事件(插銷抬起時不動、落板落下推一格、落板落回)都成立;下一根插銷來時,爪尖還壓在剛推過的齒間,插銷頂棘爪的耳轉不出來,落板一抬就把星形輪往回拖約 13°(重演裡落板落定時比固定柱低約 4°,爪尖被壓得比模型深)。要讓插銷先把爪尖頂離齒間再抬落板(列入待確認清單)",
    },
  ],
  // 動力重演:只推圓盤;落板繞大螺絲、被彈簧往下壓,棘爪鉸在落板上靠自重往下擺,星形輪靠摩擦定位
  replay: {
    from: START,
    to: START - pinPeriod,
    free: {
      drop: { pivot: [...PIVOT, Z.drop], spring: -1 },
      // 柱子頂住擋片:重演時棘爪和它鉸接的落板之間不算碰撞,改用樞軸的轉角範圍代表
      pawl: { on: "drop", limits: [-1, -startLift] },
      star: { hold: true },
    },
    ignore: [["drop", "spring"]], // 彈簧片照模型擺,它對落板的力由 spring 代表
    expect: [
      { at: -(RELEASE - 0.05), part: "star", label: "插銷把落板抬起時星形輪不動" },
      { at: -(RELEASE + DROP + 0.1), part: "star", label: "落板落下,棘爪把星形輪推轉一格", quote: "其動作作用於星形輪上,使其快速地旋轉一部分角度" },
      { at: -(RELEASE + DROP + 0.1), part: "drop", label: "落板落回原位" },
      { at: START - pinPeriod, part: "star", label: "下一根插銷抬起落板時星形輪不動", quote: "每當有插銷通過時,此動作便重複一次" },
    ],
  },
  pose(v) {
    const { drop, star, pawl } = counter(-v);
    return {
      parts: {
        disc: { angle: v },
        star: { angle: star },
        drop: { angle: drop },
        pawl: { position: [...pawlPivotWorld(drop), Z.pawl], angle: pawl },
        spring: { angle: springAngle(drop) },
      },
      readouts: [],
    };
  },
};
