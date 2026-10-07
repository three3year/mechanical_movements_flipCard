// 鉸接的棘爪、擋爪推動或擋住輪(由接觸算;用語見 CONTEXT.md)。第 225 種起的棘輪一族共用,純函式,平面在 xy。
//
// 規則(主動量每走一小步):
// 1. 爪的樞軸跟著主動件移動(掛在搖臂、槓桿上),爪在世界裡的角度先不變;
// 2. 推的爪(pushes)若壓進輪的齒,把輪往 dir 轉到剛好不重疊——一步之內推不開(爪壓在齒背上),就不算推;
//    固定在主動件上的推件(fixed,例如小輪上的單齒)同樣這樣推輪,但它自己不擺;
// 3. 各爪靠自重或彈簧往 into 擺:沒碰到東西時從當下的角速度起以固定的角加速度落下(不瞬移),
//    碰到輪的齒或擋止就停在那裡;被齒背頂住時往回退到剛好不重疊。
// 輪只在被推時往前轉,其餘時候不動(止回爪或摩擦定位擋住倒轉)。輪也可以就是主動件(擋止爪:wheel.angle 給定)。
// 從 start 起先空走 warmup 個週期,取之後一個週期當作穩定的週期;被推的輪每週期前進整數個齒距(累積的微小誤差按比例攤掉)。
import { placeOutline, polygonsOverlap } from "./contact.js";

/**
 * period:主動量的一個週期;samples:一個週期的取樣數。
 * pins(v):各爪樞軸的世界座標 { id: [x, y] };fixed 的推件另給 angles(v) 的 { id: 轉角 }。
 * wheel:{ obstacles(θ) → 輪在轉角 θ 時的齒(世界座標多邊形陣列,每塊的順序固定), dir(被推時的轉向 ±1), pitch, angle?(v) → 輪是主動件時的轉角, start }。
 * pawls:{ id: { outline(局部輪廓,原點在樞軸), into(±1,落下的轉向), angle(起始轉角), pushes?(布林或 (v) → 布林:這一步是不是在推), fixed?, limits?: [min, max],
 *          fall?(自靜止落下 0.3 弧度所花的主動量,預設週期的 4%), stops?(v) → 其他擋住它的多邊形,
 *          lift?(推的時候爪最多被抬起的弧度,預設 0.04;長的爪要小一點,免得爪尖被抬起的距離大過齒深。
 *          也可以給 [往下, 往上](往下是負值,往齒裡轉):拉爪的樞軸斜著動時,爪尖要跟著齒的直面走,爪可能得往齒裡轉一點) } }。
 * 回傳 { at(v) → { wheel, angles: { id } }, step(被推的輪每週期前進的角度), shapes(v)(檢查用的外形) }。
 */
export function pawlDrive({ period, samples = 480, warmup = 2, pins, angles, wheel, pawls, trace }) {
  const ids = Object.keys(pawls);
  const dv = period / samples;
  const driven = !wheel.angle;
  const state = { wheel: wheel.start ?? 0, angles: Object.fromEntries(ids.map((id) => [id, pawls[id].angle ?? 0])), w: Object.fromEntries(ids.map((id) => [id, 0])) };
  const acc = Object.fromEntries(ids.map((id) => [id, (2 * 0.3) / (pawls[id].fall ?? 0.04 * period) ** 2]));

  const placed = (id, v, angle) => placeOutline(pawls[id].outline, pins(v)[id], angle);
  const obstaclesFor = (id, v, theta) => [...wheel.obstacles(theta), ...(pawls[id].stops?.(v) ?? [])];
  const hits = (poly, obstacles) => obstacles.some((o) => polygonsOverlap(poly, o));

  // 推:輪往 dir 轉 d、爪同時往上讓 δ(爪尖卡在齒的直面與前一齒的齒背之間時,輪一轉就會把爪尖沿齒背抬起一點),
  // 取最小的 d 讓爪不碰任何東西;一步之內(d ≤ max、δ ≤ LIFT)做不到,就是爪壓在齒背上、推不動,回傳 null。
  // 固定在主動件上的推件不能讓(δ = 0)。
  const LIFT = 0.04;
  const push = (id, v, theta, angle, max) => {
    const p = pawls[id];
    const extra = p.stops?.(v) ?? [];
    const clearAt = (d) => {
      const obstacles = [...wheel.obstacles(theta + wheel.dir * d), ...extra];
      const [down, up] = Array.isArray(p.lift) ? p.lift : [0, p.lift ?? LIFT];
      const lifts = [0];
      if (!p.fixed)
        for (let k = 1; k <= 8; k++) {
          if (up) lifts.push((up * k) / 8);
          if (down) lifts.push((down * k) / 8);
        }
      for (const lift of lifts) if (!hits(placed(id, v, angle - (p.into ?? 0) * lift), obstacles)) return lift;
      return null;
    };
    if (clearAt(0) === 0) return { theta, angle };
    let prev = 0;
    let found = null;
    for (let k = 1; k <= 12; k++) {
      const d = (max * k) / 12;
      if (clearAt(d) !== null) {
        found = d;
        break;
      }
      prev = d;
    }
    if (found === null) return null;
    let [lo, hi] = [prev, found];
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (clearAt(mid) !== null) hi = mid;
      else lo = mid;
    }
    return { theta: theta + wheel.dir * hi, angle: angle - (p.into ?? 0) * clearAt(hi) };
  };

  // 爪落下或被頂開:回傳新的轉角與角速度(往 into 為正)
  const settle = (id, v, theta) => {
    const p = pawls[id];
    const obstacles = obstaclesFor(id, v, theta);
    const at = (a) => hits(placed(id, v, a), obstacles);
    let a = state.angles[id];
    const clamp = (x) => (p.limits ? Math.min(p.limits[1], Math.max(p.limits[0], x)) : x);
    if (at(a)) {
      // 被頂開:往回退到剛好不重疊
      let [lo, hi] = [0, 0.002];
      while (at(a - p.into * hi) && hi < 1.5) [lo, hi] = [hi, hi * 2];
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (at(a - p.into * mid)) lo = mid;
        else hi = mid;
      }
      return { angle: clamp(a - p.into * hi), w: 0 };
    }
    const sweep = state.w[id] * dv + acc[id] * dv * dv;
    let target = clamp(a + p.into * sweep);
    const n = 6;
    let prev = a;
    for (let i = 1; i <= n; i++) {
      const x = a + ((target - a) * i) / n;
      if (at(x)) {
        let [lo, hi] = [prev, x];
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (at(mid)) hi = mid;
          else lo = mid;
        }
        return { angle: lo, w: Math.max(0, (p.into * (lo - a)) / dv) };
      }
      prev = x;
    }
    const stopped = p.limits && (target === p.limits[0] || target === p.limits[1]);
    return { angle: target, w: stopped ? 0 : Math.max(0, (p.into * (target - a)) / dv) };
  };

  const advance = (v) => {
    if (!driven) state.wheel = wheel.angle(v);
    else {
      const max = wheel.pitch / 6;
      const fixed = angles?.(v) ?? {};
      for (const id of ids) {
        const p = pawls[id];
        // 這一步(v − dv 到 v)是不是在推:取步的中點判斷,往復的折返點才不會判錯
        if (!p.fixed && !(typeof p.pushes === "function" ? p.pushes(v - dv / 2) : p.pushes)) continue;
        const angle = p.fixed ? fixed[id] : state.angles[id];
        const pushed = push(id, v, state.wheel, angle, max);
        state.angles[id] = pushed?.angle ?? angle;
        if (pushed) state.wheel = pushed.theta;
      }
    }
    for (const id of ids) {
      if (pawls[id].fixed) continue;
      const { angle, w } = settle(id, v, state.wheel);
      state.angles[id] = angle;
      state.w[id] = w;
    }
  };

  // 調整幾何用:trace 為真時只回傳逐步的紀錄(走 warmup + 1 個週期)
  if (trace) {
    const log = [];
    for (let i = 0; i <= (warmup + 1) * samples; i++) {
      advance(i * dv);
      log.push({ v: i * dv, wheel: state.wheel, angles: { ...state.angles }, shapes: Object.fromEntries(ids.map((id) => [id, placed(id, i * dv, state.angles[id])])) });
    }
    return { log };
  }
  // 除錯:設 globalThis.PAWL_TRACE(每幾步印一行)時,印出逐步的輪轉角、各爪轉角與爪的外形中心
  const traceEvery = globalThis.PAWL_TRACE;
  const center = (poly) => poly.reduce((c, p) => [c[0] + p[0] / poly.length, c[1] + p[1] / poly.length], [0, 0]);
  const report = (i, v) => {
    if (!traceEvery || i % traceEvery) return;
    const deg = (a) => ((a * 180) / Math.PI).toFixed(2);
    console.log(v.toFixed(3), deg(state.wheel), ids.map((id) => `${id} ${deg(state.angles[id])} @${center(placed(id, v, state.angles[id])).map((x) => x.toFixed(2))}`).join(" | "));
  };
  for (let i = 0; i <= warmup * samples; i++) {
    advance(i * dv);
    report(i, i * dv);
  }
  const table = [{ wheel: state.wheel, angles: { ...state.angles } }];
  for (let i = 1; i <= samples; i++) {
    advance((warmup * samples + i) * dv);
    table.push({ wheel: state.wheel, angles: { ...state.angles } });
  }
  const base = table[0].wheel;
  let step = 0;
  if (driven) {
    const raw = table[samples].wheel - base;
    step = Math.round(raw / wheel.pitch) * wheel.pitch;
    if (!step && !traceEvery) throw new Error(`棘爪一個週期沒有把輪推過一齒(推了 ${((raw / wheel.pitch) * 100).toFixed(0)}% 齒距)`);
    if (Math.abs(raw - step) > wheel.pitch * 0.05 && !traceEvery) throw new Error(`棘爪一個週期推了 ${(raw / wheel.pitch).toFixed(2)} 齒,不是穩定的整數齒(擺幅或爪的位置要調)`);
    if (step) for (const s of table) s.wheel = base + ((s.wheel - base) * step) / raw;
  }

  const at = (v) => {
    const k = Math.floor(v / period + 1e-12);
    const x = Math.max(0, ((v - k * period) / period) * samples);
    const i = Math.min(samples - 1, Math.floor(x));
    const t = x - i;
    const [a, b] = [table[i], table[i + 1]];
    const out = {};
    for (const id of ids) out[id] = a.angles[id] + (b.angles[id] - a.angles[id]) * t;
    return { wheel: driven ? k * step + a.wheel + (b.wheel - a.wheel) * t : wheel.angle(v), angles: out };
  };
  const shapes = (v) => {
    const s = at(v);
    return { pawls: Object.fromEntries(ids.map((id) => [id, placed(id, v, s.angles[id])])), wheel: wheel.obstacles(s.wheel) };
  };
  return { at, step, shapes };
}

/**
 * 擒縱(由接觸算):輪受發條或重錘的固定力矩往 dir 轉,擋它的零件(叉瓦、掣子)照主動件走。主動量每走一小步:
 * 叉瓦若壓進輪齒,輪被推開(往回退,或被推著往前,取推得少的那一邊);沒被壓到時輪從當下的速度起加速往 dir 轉,碰上就停
 * (輪被放開時不是瞬移到下一個擋處)。
 * period:主動量的一個週期(擺一個來回);obstacles(θ):輪在轉角 θ 時的齒(世界座標多邊形陣列);stops(v):擋住輪的零件;
 * drop:自靜止轉過一個齒距所花的主動量。從 start 起空走 warmup 個週期,取之後的一個週期當作穩定的週期(每週期前進整數個齒距)。
 * 回傳 { at(v) → 輪的轉角, step, shapes(v) }。
 */
export function escapeDrive({ period, samples = 720, warmup = 2, obstacles, stops, dir, pitch, start = 0, drop = 0.06 }) {
  const dv = period / samples;
  const acc = (2 * pitch) / (drop * period) ** 2;
  const hits = (theta, v) => {
    const s = stops(v);
    return obstacles(theta).some((o) => s.some((p) => polygonsOverlap(o, p)));
  };
  // 從 theta 往 sign 方向轉多少才不碰(上限一個齒距;推不開回傳 Infinity)
  const clear = (theta, v, sign) => {
    let [lo, hi] = [0, pitch / 256];
    while (hits(theta + sign * hi, v)) {
      [lo, hi] = [hi, hi * 2];
      if (hi > pitch) return Infinity;
    }
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (hits(theta + sign * mid, v)) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  let theta = start;
  let w = 0;
  const advance = (v) => {
    if (hits(theta, v)) {
      const back = clear(theta, v, -dir);
      const fwd = clear(theta, v, dir);
      if (!Number.isFinite(back) && !Number.isFinite(fwd)) throw new Error(`擒縱輪在主動量 ${v.toFixed(4)} 被卡死`);
      theta += back <= fwd ? -dir * back : dir * fwd;
      w = 0;
      return;
    }
    const next = theta + dir * (w * dv + acc * dv * dv);
    if (!hits(next, v)) {
      w = Math.abs(next - theta) / dv;
      theta = next;
      return;
    }
    let [lo, hi] = [0, Math.abs(next - theta)];
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (hits(theta + dir * mid, v)) hi = mid;
      else lo = mid;
    }
    theta += dir * lo;
    w = 0;
  };
  // 起始位置若碰到擋件,往前找一個不碰的位置
  for (let i = 0; i < 64 && hits(theta, 0); i++) theta = start + (dir * pitch * i) / 64;
  const traceEvery = globalThis.PAWL_TRACE;
  for (let i = 0; i <= warmup * samples; i++) {
    advance(i * dv);
    if (traceEvery && i % traceEvery === 0) console.log((i * dv).toFixed(3), ((theta * 180) / Math.PI).toFixed(2));
  }
  const base = theta;
  const table = [0];
  for (let i = 1; i <= samples; i++) {
    advance((warmup * samples + i) * dv);
    table.push(theta - base);
  }
  const raw = table[samples];
  const step = Math.round(raw / pitch) * pitch;
  if (!traceEvery && (!step || Math.abs(raw - step) > pitch * 0.05)) throw new Error(`擒縱輪一個週期轉了 ${(raw / pitch).toFixed(2)} 齒,不是穩定的整數齒(叉瓦的位置要調)`);
  if (step) for (let i = 0; i <= samples; i++) table[i] = (table[i] * step) / raw;
  const at = (v) => {
    const k = Math.floor(v / period + 1e-12);
    const x = Math.max(0, ((v - k * period) / period) * samples);
    const i = Math.min(samples - 1, Math.floor(x));
    return base + k * step + table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  return { at, step, shapes: (v) => ({ wheel: obstacles(at(v)), stops: stops(v) }) };
}
