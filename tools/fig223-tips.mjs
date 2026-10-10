// 維護用:算第 223 種換對處要削低的齒頂(models/fig223.js 的 TIPS)。
// 換對前後兩對的轉速比不同,靠近扇形邊緣的齒會在對方齒間滑過而相撞(507movements 註記的「實物要改幾個齒」)。
// 做法:從全部不削起,上軸轉一圈(換對處前後加密取樣)逐姿勢量同平面的上下扇形互相穿入多深;伸進對方超過 LIMIT 的
// 頂點若在自己的節圓外,就是那一齒的齒頂撞到,把它削低一點(依穿入深度,至少 STEP 個模數);重複到全程不穿入。
// 印出可以貼回 fig223.js 的 TIPS 表,並和目前的表比對。扇形的半徑、角度、平面或齒形改了就重跑。
// 用法:node tools/fig223-tips.mjs
import { buildSectors, sectors, SECTORS, TIPS } from "../models/fig223.js";
import { placeOutline, pointInPolygon, edgeDistance } from "../models/contact.js";

const TAU = 2 * Math.PI;
const LIMIT = 0.0025; // 測試容許 0.003;簡化齒形穩定咬合時齒頂互相擦到約 0.001
const STEP = 0.01;
const { UPPER, LOWER } = SECTORS;

// 上軸的取樣:整圈每 0.25°,四個換對處前後 0.3 rad 內每 0.05°
const samples = [
  ...Array.from({ length: 1440 }, (_, i) => (i * TAU) / 1440),
  ...[0, 1, 2, 3].flatMap((k) => Array.from({ length: 689 }, (_, i) => (k * TAU) / 4 - 0.3 + (i * 0.6) / 688)),
];

/** 扇形局部座標的點落在第幾齒(從 span[0] 起;和 sectorShape 的編號相同) */
function toothOf(s, [x, y]) {
  const pitch = TAU / s.teeth;
  const a0 = s.span[0] - s.shift;
  let phi = Math.atan2(y, x) - s.shift;
  while (phi < a0) phi += TAU;
  while (phi >= a0 + TAU) phi -= TAU;
  const first = Math.ceil(a0 / pitch + 0.5 - 1e-9);
  return Math.round(phi / pitch) - first;
}

/** 扇形 a(在 ca 轉 ta)伸進扇形 b(在 cb 轉 tb)的頂點中,在 a 節圓外、深度超過 LIMIT 的:[齒, 深度] */
function intrusions(a, ca, ta, b, cb, tb) {
  const B = placeOutline(b.shape.outline, cb, tb);
  const reach = Math.max(...b.shape.outline.map(([x, y]) => Math.hypot(x, y))) + 1e-6;
  const out = [];
  a.shape.outline.forEach((local) => {
    const [p] = placeOutline([local], ca, ta);
    if (Math.hypot(p[0] - cb[0], p[1] - cb[1]) > reach || !pointInPolygon(p, B)) return;
    const d = edgeDistance(p, B);
    if (d <= LIMIT) return;
    if (Math.hypot(...local) <= a.radius) throw new Error(`齒根以內也穿入(深度 ${d.toFixed(4)}),削齒頂解決不了`);
    out.push([toothOf(a, local), d]);
  });
  return out;
}

const tips = { up: {}, lo: {} };
for (let pass = 1; ; pass++) {
  const { UP, LO } = buildSectors(tips);
  const worst = new Map(); // "up.big.0" → 最深的穿入
  for (const t of samples) {
    const lw = sectors(t).lower;
    for (const [un, u] of Object.entries(UP))
      for (const [ln, l] of Object.entries(LO)) {
        if (u.z !== l.z) continue;
        const note = (side, name, s, hits) => {
          for (const [k, d] of hits) {
            const key = `${side}.${name}.${k}`;
            worst.set(key, Math.max(worst.get(key) ?? 0, d / ((2 * s.radius) / s.teeth)));
          }
        };
        note("up", un, u, intrusions(u, UPPER, t, l, LOWER, lw));
        note("lo", ln, l, intrusions(l, LOWER, lw, u, UPPER, t));
      }
  }
  if (!worst.size) break;
  if (pass > 300) throw new Error("削了 300 輪仍有穿入");
  for (const [key, depth] of worst) {
    const [side, name, k] = key.split(".");
    const table = (tips[side][name] ??= {});
    const now = table[k] ?? 1;
    if (now <= 0) throw new Error(`${key} 的齒頂已削平仍穿入`);
    // 每輪削掉穿入深度的一半(以模數為單位),至少 STEP
    table[k] = Math.max(0, Math.round((now - Math.max(STEP, Math.floor(depth * 50) / 100)) * 100) / 100);
  }
}

// 照 fig223.js 裡扇形的順序、齒的編號排
const order = buildSectors({});
const sorted = (side) =>
  Object.fromEntries(
    Object.keys(order[side === "up" ? "UP" : "LO"])
      .filter((name) => tips[side][name])
      .map((name) => [name, Object.fromEntries(Object.entries(tips[side][name]).sort((a, b) => a[0] - b[0]))]),
  );
const fmt = (side) =>
  `{ ${Object.entries(sorted(side))
    .map(([name, t]) => `${name}: { ${Object.entries(t).map(([k, v]) => `${k}: ${v}`).join(", ")} }`)
    .join(", ")} }`;
console.log(`export const TIPS = {\n  up: ${fmt("up")},\n  lo: ${fmt("lo")},\n};`);
const same = JSON.stringify({ up: sorted("up"), lo: sorted("lo") }) === JSON.stringify({ up: TIPS.up, lo: TIPS.lo });
console.log(same ? "和 fig223.js 目前的 TIPS 相同" : "和 fig223.js 目前的 TIPS 不同:把上面的表貼回去,再跑 node --test tests/mangles.test.js 與 npm run verify -- 223");
