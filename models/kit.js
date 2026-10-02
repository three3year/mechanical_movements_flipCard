// 模型定義共用的運動學工具:純函式,不依賴 Three.js 或 DOM,瀏覽器與 Node 皆可載入。
// 連動一律依幾何關係計算,不模擬力、質量或摩擦(見 docs/adr/0001)。

export const TAU = Math.PI * 2;

export const X = [1, 0, 0];
export const Y = [0, 1, 0];
export const Z = [0, 0, 1];

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => scale(a, 1 / len(a));
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ── 皮帶傳動 ─────────────────────────────
// sense 是皮帶繞過該輪的方向:+1 為繞軸逆時針(右手定則),-1 為順時針。
// 開口皮帶兩輪 sense 相同 → 同向;交叉皮帶 sense 相反 → 反向。

/** 輪轉 angle 時,皮帶沿路徑方向的行進量 */
export const beltTravel = (angle, radius, sense) => sense * angle * radius;

/** 皮帶行進 travel 時,被它帶動的輪的轉角 */
export const wheelAngle = (travel, radius, sense) => (sense * travel) / radius;

// ── 皮帶與繩的路徑 ───────────────────────
// 路徑節點是 { point } 或 { circle: { center, axis, radius, sense } }。
// 每段弧固定取樣點數,同一拓撲在不同狀態下點數相同,繪圖層才能在狀態間內插。
const ARC_SAMPLES = 24;

function basis(axis) {
  const helper = Math.abs(axis[0]) < 0.9 ? X : Y;
  const u = norm(cross(helper, axis));
  return [u, cross(axis, u)];
}

function angleOn(circle, p) {
  const [u, v] = basis(circle.axis);
  const d = sub(p, circle.center);
  return Math.atan2(dot(d, v), dot(d, u));
}

function pointAt(circle, a) {
  const [u, v] = basis(circle.axis);
  return add(circle.center, add(scale(u, circle.radius * Math.cos(a)), scale(v, circle.radius * Math.sin(a))));
}

// 從外部點 p 到圓的切點;depart 為 true 時皮帶由切點離開往 p,否則由 p 來到切點
function tangentPoint(circle, p, depart) {
  const { center: c, axis: n, radius: r, sense } = circle;
  const cp = sub(p, c);
  const q = sub(cp, scale(n, dot(cp, n))); // p 投影到圓所在平面(相對圓心)
  const d = len(q);
  if (d <= r * (1 + 1e-9)) return add(c, scale(q, r / (d || 1)));
  const u = scale(q, 1 / d);
  const v = cross(n, u);
  const ca = r / d;
  const sa = Math.sqrt(1 - ca * ca);
  for (const sign of [1, -1]) {
    const t = add(c, add(scale(u, r * ca), scale(v, sign * r * sa)));
    const motion = scale(cross(n, sub(t, c)), sense);
    const along = depart ? dot(sub(p, t), motion) : dot(sub(t, p), motion);
    if (along > 0) return t;
  }
  return add(c, scale(u, r));
}

function arc(circle, from, to) {
  const a0 = angleOn(circle, from);
  const a1 = angleOn(circle, to);
  let delta = circle.sense > 0 ? (((a1 - a0) % TAU) + TAU) % TAU : -((((a0 - a1) % TAU) + TAU) % TAU);
  if (Math.abs(delta) > TAU - 0.05) delta = 0; // 切點幾乎重合,視為沒有繞
  const pts = [];
  for (let i = 0; i <= ARC_SAMPLES; i++) pts.push(pointAt(circle, a0 + (delta * i) / ARC_SAMPLES));
  return pts;
}

function route(nodes, closed) {
  const n = nodes.length;
  const at = (i) => nodes[(i + n) % n];
  const enter = [];
  const leave = [];
  nodes.forEach((node, i) => {
    enter[i] = leave[i] = node.point ?? node.circle.center;
  });
  // 切點互相依賴,反覆逼近幾次即收斂
  for (let iter = 0; iter < 6; iter++) {
    nodes.forEach((node, i) => {
      if (!node.circle) return;
      const hasPrev = closed || i > 0;
      const hasNext = closed || i < n - 1;
      if (hasPrev) enter[i] = tangentPoint(node.circle, leave[(i - 1 + n) % n], false);
      if (hasNext) leave[i] = tangentPoint(node.circle, enter[(i + 1) % n], true);
      if (!hasPrev) enter[i] = leave[i];
      if (!hasNext) leave[i] = enter[i];
    });
  }
  const points = [];
  const arrivals = [];
  let length = 0;
  const push = (p) => {
    if (points.length) length += len(sub(p, points[points.length - 1]));
    points.push(p);
  };
  nodes.forEach((node, i) => {
    if (node.point) return push(node.point);
    push(enter[i]);
    arrivals.push(length);
    arc(at(i).circle, enter[i], leave[i]).slice(1).forEach(push);
  });
  if (closed) length += len(sub(points[0], points[points.length - 1]));
  return { points, arrivals, length };
}

// 皮帶畫在輪緣外側,路徑半徑比輪略大(只影響畫面,不影響傳動比)
const BELT_LIFT = 0.05;

/** 封閉皮帶:依序繞過各輪 */
export function routeBelt(circles) {
  return route(circles.map((c) => ({ circle: { ...c, radius: c.radius + BELT_LIFT } })), true);
}

/**
 * 開放的繩或皮帶:從起點(固定端)經過各輪到終點。
 * 回傳的 arrivals 是從起點量到每個輪入口的弧長;繩不可伸長,
 * 所以離起點的弧長就是繩上的材料座標,可用來算輪的轉角與繩的移動記號。
 */
export function routeRope(nodes) {
  return route(nodes, false);
}

/** 路徑在三個座標上以 a→b 線性內插 */
export const lerp3 = (a, b, t) => add(a, scale(sub(b, a), t));

/** 依 key 快取純函式結果(同一狀態的靜態皮帶路徑只算一次) */
export function memo(fn) {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) cache.set(key, fn(key));
    return cache.get(key);
  };
}

// ── 滑輪組 ───────────────────────────────
// 主動件是繩端,往下拉為正;重物位移由繩長守恆換算,省力比由位移比算出(不模擬力)。

const CM_PER_UNIT = 10;
const cm = (v) => (v * CM_PER_UNIT).toFixed(1) + " cm";
const ratioText = (r) => "1 : " + Number(r.toFixed(2));

/** 滑輪組讀數:繩端拉了多少、重物升了多少、省力比(由位移比算出) */
export function hoistReadouts(pull, rise, ratioAtRest) {
  const ratio = rise > 1e-9 ? pull / rise : ratioAtRest;
  return [
    { label: "繩端拉了", value: cm(pull) },
    { label: "重物升了", value: cm(rise) },
    { label: "省力比", value: ratioText(ratio) },
  ];
}

/**
 * 繩繞過的滑輪轉角:比較繩從固定端到該輪入口的弧長變化。
 * index 是該輪在 routeRope 節點中的第幾個輪;rest 是繩端未拉時的路徑。
 */
export function sheaveAngle(route, rest, index, circle) {
  const travel = rest.arrivals[index] - route.arrivals[index]; // 繩往終點方向走過的量
  return wheelAngle(travel, circle.radius, circle.sense);
}

/** 掛鉤、吊桿這類直桿:路徑零件 rod 的姿勢 */
export const rod = (from, to) => ({ points: [from, to], closed: false });
