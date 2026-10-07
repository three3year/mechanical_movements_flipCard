// 擒縱與冠狀棘輪的共用小工具。純函式。sawCrown 是冠狀鋸齒的零件(第 234、237、277 種等);
// toothedWheel 以下是由接觸算的擒縱:擒縱輪、叉瓦作圖與鉸接零件的逐步模擬(第 288–314 種)。
// (原本照相位擺放的 escapeStep、escapeRecoil、singleBeat 等,第 234、237、238、402 種改成由接觸算後沒有人用,已刪)
import { quatFromBasis } from "./kit.js";
import { shape } from "./shapes.js";
import { polygonsOverlap } from "./contact.js";

/**
 * 冠狀鋸齒(齒立在輪緣上、朝上,局部 z 是輪軸):每齒一塊直角三角形板,斜邊沿 +角度方向升起,
 * 直面在每齒的終點。回傳 group 的 pieces。
 */
export function sawCrown({ teeth, radius, height, base = 0, thick = 0.12 }) {
  const pitch = (2 * Math.PI) / teeth;
  const len = 2 * radius * Math.sin(pitch / 2);
  return Array.from({ length: teeth }, (_, i) => {
    const a = (i + 0.5) * pitch;
    const t = [-Math.sin(a), Math.cos(a), 0];
    const out = [Math.cos(a), Math.sin(a), 0];
    return {
      kind: "plate",
      // 板的局部 x 沿切線(+角度方向)、y 朝上、z 朝外
      shape: shape([[-len / 2, 0], [len / 2, 0], [len / 2, height]]),
      thickness: thick,
      at: [radius * Math.cos(a) * Math.cos(pitch / 2), radius * Math.sin(a) * Math.cos(pitch / 2), base],
      rotation: quatFromBasis(t, [0, 0, 1], out),
      accent: i === 0,
    };
  });
}

/**
 * 輪齒的外形:profile 是一齒的輪廓點 [半徑, 齒距的比例](從齒根起,依角度遞增),
 * 回傳 { outline, holes, teeth }:outline 是整個輪的外緣、holes 是軸孔(bore > 0 時);teeth[i] 是第 i 齒的多邊形(輪的局部座標,齒根以弦封閉)。
 */
export function toothedWheel({ teeth, profile, bore = 0 }) {
  const pitch = (2 * Math.PI) / teeth;
  const tooth = (i) => profile.map(([r, f]) => [r * Math.cos((i + f) * pitch), r * Math.sin((i + f) * pitch)]);
  const all = Array.from({ length: teeth }, (_, i) => tooth(i));
  const ring = [];
  if (bore) for (let i = 0; i < 72; i++) ring.push([bore * Math.cos((-i / 72) * 2 * Math.PI), bore * Math.sin((-i / 72) * 2 * Math.PI)]);
  return { outline: all.flat(), holes: bore ? [ring] : [], teeth: all };
}

/**
 * 由接觸算的擒縱輪(ADR-0001;用語見 CONTEXT.md「由接觸算」):
 * 輪受發條或重錘的固定力矩往 dir(+1 逆時針 / −1 順時針)轉。主動量每走一小步——
 * 擋它的零件(叉瓦、掣子)若壓進輪齒,輪被推開(回退,或被推著走);沒被壓到時輪往 dir 轉,碰上就停。
 * 放開後輪不是瞬移到下一個擋處:從當下的速度起,以固定的角加速度轉過去(drop:自靜止落過一個齒距所花的主動量)。
 *
 * center:輪心(2D);teeth:輪的實體在局部座標的多邊形(每齒一塊);stops(v):主動量 v 時擋住它的零件(世界座標多邊形陣列);
 * period:主動量的一個週期(擺一個來回)。從 start 起先空走 warmup 個週期,取之後的一個週期當作穩定的週期。
 * layers:輪齒分在前後不同層時(凸柱式),layers[i] 是第 i 齒的層;stops 回傳 { poly, layer },只和同一層的齒相碰。
 * 回傳 { angle(v)(輪的轉角,局部座標的 0 對著世界的 0), step(每週期轉過的角度,帶正負號), at(v)(檢查用的外形) }。
 */
export function escapeByContact({ center, teeth, stops, dir, period, start = 0, samples = 720, drop = 0.08, warmup = 2, pitch, layers }) {
  const P = pitch ?? (2 * Math.PI) / teeth.length;
  const boxes = teeth.map(bounds2);
  const toLocal = (poly, a) => {
    const c = Math.cos(-a);
    const s = Math.sin(-a);
    return poly.map(([x, y]) => [(x - center[0]) * c - (y - center[1]) * s, (x - center[0]) * s + (y - center[1]) * c]);
  };
  const hit = (a, v) => {
    for (const stop of stops(v)) {
      const o = stop.poly ?? stop;
      const local = toLocal(o, a);
      const b = bounds2(local);
      for (let i = 0; i < teeth.length; i++) {
        if (layers && stop.layer !== layers[i]) continue;
        const t = boxes[i];
        if (b[2] < t[0] || t[2] < b[0] || b[3] < t[1] || t[3] < b[1]) continue;
        if (polygonsOverlap(local, teeth[i])) return true;
      }
    }
    return false;
  };
  const { angle, step } = wheelByContact({ hit, dir, period, pitch: P, start, samples, drop, warmup });
  const at = (v) => {
    const g = angle(v);
    return {
      teeth: teeth.map((t) => t.map(([x, y]) => [center[0] + x * Math.cos(g) - y * Math.sin(g), center[1] + x * Math.sin(g) + y * Math.cos(g)])),
      stops: stops(v).map((o) => o.poly ?? o),
      ...(layers ? { layers, stopLayers: stops(v).map((o) => o.layer) } : {}),
    };
  };
  return { angle, step, at };
}

function bounds2(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * 錨形擒縱叉的一個叉瓦(作圖法:叉瓦在擒縱輪齒尖圓上的方位角 at,樞軸 P 取在切線上,齒尖經過叉瓦時是朝著 / 背著 P 走)。
 * 回傳叉瓦在錨形件局部座標(原點在樞軸 P、錨形件居中)的多邊形,外加作圖的資料。
 * - 齒朝 P 走來的叉瓦(進齒叉瓦):齒鎖在外側面;齒背離 P 走的(出齒叉瓦):齒鎖在內側面。
 * - 鎖面與 P 同心(靜擊式);recoil > 0 時鎖面越往外越偏離同心(回退式:叉瓦越伸進去,把齒往回推)。
 * - 衝擊面是叉瓦尖端的斜面,齒滑過它時把錨形件推過 lift(錨形件居中時正好在衝擊面中點)。
 * O:輪心;R:齒尖圓半徑;dir:輪的轉向;width:叉瓦沿齒走的方向的寬度;back:叉瓦往輪外延伸的角度(繞 P);
 * lock:叉瓦再往輪裡多伸的角度(繞 P)——另一個叉瓦放開齒之前,這一個的鎖面就已經擋在齒的去路上,齒落在鎖面而不是衝擊面上。
 * outside:叉瓦從輪的內側往外伸進齒的路徑(凸柱式擒縱在輪緣後面的叉瓦)。
 */
export function anchorPallet({ P, O, R, at, dir, width, lift, recoil = 0, back = 0.3, lock = 0, n = 12, outside = false }) {
  const C = [O[0] + R * Math.cos(at), O[1] + R * Math.sin(at)];
  const L = Math.hypot(C[0] - P[0], C[1] - P[1]);
  const psi = Math.atan2(C[1] - P[1], C[0] - P[0]);
  const vel = [-dir * Math.sin(at), dir * Math.cos(at)];
  const entry = vel[0] * (P[0] - C[0]) + vel[1] * (P[1] - C[1]) > 0;
  const s = (outside ? -1 : 1) * Math.sign(wrapPi(Math.atan2(O[1] - P[1], O[0] - P[0]) - psi)); // 伸進齒的路徑是 ψ 的哪一側(預設從輪外往輪心伸)
  const lockR = entry ? L + width / 2 : L - width / 2;
  const otherR = entry ? L - width / 2 : L + width / 2;
  const out = entry ? 1 : -1; // 鎖面往回推齒的方向(半徑)
  const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const lockAt = psi - (s * lift) / 2 + s * lock;
  const lockFace = Array.from({ length: n + 1 }, (_, i) => {
    const a = lockAt - (s * back * i) / n;
    return p(lockR + out * recoil * L * Math.abs(a - lockAt), a);
  });
  const otherFace = Array.from({ length: n + 1 }, (_, i) => p(otherR, psi + (s * lift) / 2 + s * lock - (s * (back + lift) * i) / n));
  // 頂點依序:鎖面(從鎖角往外)→ 背面 → 另一面(從外往尖端)→ 衝擊面回到鎖角
  const poly = [...lockFace, ...otherFace.reverse()];
  return { poly: ccw(poly), entry, s, psi, L, lockR, otherR };
}

/** 局部多邊形繞原點轉 angle 再平移到 at(2D) */
export const placePoly = (poly, at, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return poly.map(([x, y]) => [at[0] + x * c - y * s, at[1] + x * s + y * c]);
};

/** 多邊形改成逆時針 */
export function ccw(poly) {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    area += x0 * y1 - x1 * y0;
  }
  return area < 0 ? [...poly].reverse() : poly;
}

/**
 * 由接觸算的小工具(準靜態逐步;多個零件互相推的擒縱各自組合):
 * hit(q) 是「零件在座標 q(轉角或位移)時有沒有碰到東西」。
 * clearance:從 q 往 sign 方向要移多少才不再相碰(超過 max 回傳 Infinity)。
 */
export function clearance(hit, q, sign, max, iterations = 30) {
  if (!hit(q)) return 0;
  if (!(max > 0)) return Infinity;
  let lo = 0;
  let hi = max / 512;
  while (hit(q + sign * hi)) {
    lo = hi;
    if (hi >= max) return Infinity;
    hi = Math.min(max, hi * 2);
  }
  for (let k = 0; k < iterations; k++) {
    const mid = (lo + hi) / 2;
    if (hit(q + sign * mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** 從 q(沒碰到東西)往 sign 方向最多移 dist,碰上就停;回傳移到的座標 */
export function approach(hit, q, sign, dist, iterations = 30) {
  if (dist <= 0 || !hit(q + sign * dist)) return q + sign * dist;
  let lo = 0;
  let hi = dist;
  for (let k = 0; k < iterations; k++) {
    const mid = (lo + hi) / 2;
    if (hit(q + sign * mid)) hi = mid;
    else lo = mid;
  }
  return q + sign * lo;
}

/**
 * 被彈簧或重力拉著走的零件(座標 q、速度 w):這一步先被推開(若被壓進去),
 * 否則以加速度 acc 往 sign 走、碰上就停(速度變成實際走的量);碰到 limit 也停。回傳新的 { q, w }。
 */
export function fall(hit, { q, w }, { sign, acc, dt, limit, max }) {
  if (hit(q)) {
    const back = clearance(hit, q, -sign, max);
    const fwd = clearance(hit, q, sign, max);
    if (!Number.isFinite(back) && !Number.isFinite(fwd)) throw new Error("零件被卡死");
    return { q: back <= fwd ? q - sign * back : q + sign * fwd, w: 0 };
  }
  let dist = (w + acc * dt) * dt;
  if (limit != null) dist = Math.max(0, Math.min(dist, (limit - q) * sign));
  const next = approach(hit, q, sign, dist);
  return { q: next, w: Math.abs(next - q) / dt };
}

/**
 * 主動量週期 period 的機構逐步算一張表:step(state, v, dv) 回傳下一步的狀態(數值的物件)。
 * 先空走 warmup 個週期,記下之後的一個週期。
 * snap:{ 量: 齒距 }——會累積的量(輪的轉角):每週期的變化湊成整數個齒距(見 snapPeriod),接在後面的週期上。
 * 其餘的量(槓桿、臂的角度與速度)每週期回到原值:還沒完全收斂的一點殘差平均分攤到整個週期,不會一週期一週期地漂走。
 * 回傳 { at(v) → 狀態, advance(每週期的變化) }。
 */
export function periodic({ period, init, step, samples = 720, warmup = 2, snap }) {
  const dv = period / samples;
  let s = { ...init };
  for (let i = 1; i <= warmup * samples; i++) s = step(s, i * dv, dv);
  const keys = Object.keys(s).filter((k) => typeof s[k] === "number");
  const table = [s];
  for (let i = 1; i <= samples; i++) table.push((s = step(s, (warmup * samples + i) * dv, dv)));
  for (const [key, pitch] of Object.entries(snap ?? {})) {
    const column = table.map((row) => row[key] - table[0][key]);
    snapPeriod(column, pitch);
    column.forEach((x, i) => (table[i] = { ...table[i], [key]: table[0][key] + x }));
  }
  for (const key of keys.filter((k) => !(snap && k in snap))) {
    const residual = table[samples][key] - table[0][key];
    table.forEach((row, i) => (table[i] = { ...row, [key]: row[key] - (residual * i) / samples }));
  }
  const advance = Object.fromEntries(keys.map((k) => [k, table[samples][k] - table[0][k]]));
  const at = (v) => {
    const k = Math.floor(v / period);
    const x = ((v - k * period) / period) * samples;
    const i = Math.min(samples - 1, Math.floor(x));
    const out = {};
    for (const key of keys) out[key] = table[i][key] + (table[i + 1][key] - table[i][key]) * (x - i) + k * advance[key];
    return out;
  };
  return { at, advance };
}

/** 世界座標多邊形陣列有沒有任兩塊相碰(含外框的粗略排除) */
export function anyOverlap(as, bs) {
  for (const a of as) {
    const ba = bounds2(a);
    for (const b of bs) {
      const bb = bounds2(b);
      if (ba[2] < bb[0] || bb[2] < ba[0] || ba[3] < bb[1] || bb[3] < ba[1]) continue;
      if (polygonsOverlap(a, b)) return true;
    }
  }
  return false;
}

/**
 * 一個週期的輪轉角表(從 0 起算)湊成整數個齒距:落點由接觸決定,週期之間可能差一點點(沒有剛好重複的穩定狀態),
 * 接起來的週期會越走越偏。差值(不到齒距的 2%)分攤在輪在轉動的那幾步上(依轉過的量),鎖住不動時不改。
 * 差值超過齒距的 2% 表示每週期的前進根本不是整數個齒距(放行的齒數不對、或還沒進入穩定狀態),報錯:幾何要調。
 */
export function snapPeriod(table, pitch) {
  const n = table.length - 1;
  const raw = table[n];
  const target = Math.round(raw / pitch) * pitch;
  const error = raw - target;
  if (Math.abs(error) > pitch * 0.02) throw new Error(`每週期前進 ${(raw / pitch).toFixed(3)} 個齒距,不是整數(差 ${(error / pitch).toFixed(3)})`);
  if (!error) return;
  const moved = [0];
  for (let i = 1; i <= n; i++) moved.push(moved[i - 1] + Math.abs(table[i] - table[i - 1]));
  if (!moved[n]) return;
  for (let i = 1; i <= n; i++) table[i] -= (error * moved[i]) / moved[n];
}

/**
 * escapeByContact 的核心:輪(座標 a,轉角或位移)受固定的力或力矩往 dir 走;hit(a, v) 是「主動量 v 時,輪在 a 有沒有碰到擋它的零件」。
 * 每一步先被推開(若被壓進去,往較近的一邊),否則加速往前走、碰上就停。先空走 warmup 個週期,記下一個週期的表。
 * 回傳 { angle(v), step(每週期的前進量,帶正負號) }。冠狀輪(立軸擒縱)等不是平面轉動的輪也用這個。
 */
export function wheelByContact({ hit, dir, period, pitch: P, start = 0, samples = 720, drop = 0.08, warmup = 2 }) {
  // 從 a 往 sign 方向轉多少才不再相碰(上限一個齒距;推不開回傳 Infinity)
  const clear = (a, v, sign) => {
    let lo = 0;
    let hi = P / 256;
    while (hit(a + sign * hi, v)) {
      lo = hi;
      hi *= 2;
      if (hi > P) return Infinity;
    }
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (hit(a + sign * mid, v)) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const ACC = (2 * P) / (drop * period) ** 2;
  const dv = period / samples;
  let a = start;
  let w = 0;
  const advance = (v) => {
    if (hit(a, v)) {
      const back = clear(a, v, -dir);
      const fwd = clear(a, v, dir);
      if (!Number.isFinite(back) && !Number.isFinite(fwd)) throw Object.assign(new Error(`擒縱輪在主動量 ${v.toFixed(4)} 被卡死`), { jam: { a, v } });
      a += back <= fwd ? -dir * back : dir * fwd;
      w = 0;
      return;
    }
    const next = a + dir * (w + ACC * dv) * dv;
    if (!hit(next, v)) {
      w += ACC * dv;
      a = next;
      return;
    }
    let lo = 0;
    let hi = Math.abs(next - a);
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (hit(a + dir * mid, v)) hi = mid;
      else lo = mid;
    }
    a += dir * lo;
    w = lo / dv;
  };
  // 起始位置若被擋住,往前找一個不相碰的位置(起始的齒位不影響穩定後的週期)
  for (let i = 0; i < 64 && hit(a, 0); i++) a = start + (dir * P * i) / 64;
  if (hit(a, 0)) throw new Error("擒縱輪找不到不相碰的起始位置");
  advance(0);
  for (let i = 1; i <= warmup * samples; i++) advance(i * dv);
  const base = a;
  const table = [0];
  for (let i = 1; i <= samples; i++) {
    advance((warmup * samples + i) * dv);
    table.push(a - base);
  }
  snapPeriod(table, P);
  const step = table[samples];
  const angle = (v) => {
    const k = Math.floor(v / period);
    const x = ((v - k * period) / period) * samples;
    const i = Math.min(samples - 1, Math.floor(x));
    return base + k * step + table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  return { angle, step };
}

/**
 * 立軸擒縱的冠狀輪(sawCrown 的齒,輪軸沿零件的局部 Z)由接觸算:叉瓦只在輪的前、後兩端碰到齒,
 * 在那兩個切面上,齒像齒條一樣橫著走——前端往 +x、後端往 −x(輪轉角增加時)。齒攤平成切面上的三角形
 * (底在 base、高 height,直面在每齒的終點),和 front(v)、back(v)(切面上叉瓦的多邊形)比相碰。
 * 切面的座標:x 是前端齒走的方向,y 是齒朝上的方向;front0 是轉角 0 時輪的局部角裡對著前端的方位。
 * 其餘同 wheelByContact;回傳 { angle(v), step, at(v)(檢查用:攤平的齒與叉瓦,layers 標前後) }。
 */
export function crownByContact({ radius: R, teeth: N, height, base = 0, front, back, front0 = -Math.PI / 2, dir = 1, period, samples = 720, start = 0, drop = 0.08, warmup = 2, window = 2 }) {
  const p = (2 * Math.PI) / N;
  const span = R * p;
  const near = (a, sideAngle) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const d = wrapPi(i * p + a - sideAngle);
      if (Math.abs(d) < window * p) out.push(d);
    }
    return out;
  };
  // 前端:局部角 i·p + a 對著前端(front0)時,齒從 x = R·d 開始,往 +x 升到直面
  const frontTeeth = (a) => near(a, front0).map((d) => [[R * d, base], [R * d + span, base], [R * d + span, base + height]]);
  // 後端(對面):齒往 −x 走,形狀左右相反
  const backTeeth = (a) => near(a, front0 + Math.PI).map((d) => [[-R * d, base], [-R * d - span, base + height], [-R * d - span, base]]);
  const hit = (a, v) => anyOverlap(front(v), frontTeeth(a)) || anyOverlap(back(v), backTeeth(a));
  const { angle, step } = wheelByContact({ hit, dir, period, pitch: p, start, samples, drop, warmup });
  const at = (v) => {
    const a = angle(v);
    const f = frontTeeth(a);
    const b = backTeeth(a);
    const fs = front(v);
    const bs = back(v);
    return { teeth: [...f, ...b], stops: [...fs, ...bs], layers: [...f.map(() => "front"), ...b.map(() => "back")], stopLayers: [...fs.map(() => "front"), ...bs.map(() => "back")] };
  };
  return { angle, step, at };
}
