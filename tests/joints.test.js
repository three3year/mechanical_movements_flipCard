// 第十二章「接頭與器具」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { penetrationDepth, circlePolygon, pointInPolygon, polygonsOverlap, placeOutline, edgeDistance } from "../models/contact.js";
import { close, turned, part, sweep } from "./helpers.js";

import fig243, { turns as turns243 } from "../models/fig243.js";
import * as m254 from "../models/fig254.js";
import * as m255 from "../models/fig255.js";
import * as m256 from "../models/fig256.js";
import * as m257 from "../models/fig257.js";
import * as m258 from "../models/fig258.js";
import * as m259 from "../models/fig259.js";
import * as m245 from "../models/fig245.js";
import * as m248 from "../models/fig248.js";
import * as m249 from "../models/fig249.js";
import * as m250 from "../models/fig250.js";
import * as m267 from "../models/fig267.js";
import * as contactJs from "../models/contact.js";
import * as helpersJs from "./helpers.js";
import * as m270 from "../models/fig270.js";
import * as m247 from "../models/fig247.js";
import * as m271 from "../models/fig271.js";
import * as m274 from "../models/fig274.js";
import * as m275 from "../models/fig275.js";
import * as m285 from "../models/fig285.js";
import * as m286 from "../models/fig286.js";
import * as m287 from "../models/fig287.js";
import * as m279 from "../models/fig279.js";
import * as m280 from "../models/fig280.js";
import * as m281 from "../models/fig281.js";
import * as m282 from "../models/fig282.js";
import * as m283 from "../models/fig283.js";
import * as m284 from "../models/fig284.js";
import * as m265 from "../models/fig265.js";
import * as m268 from "../models/fig268.js";
import * as m269 from "../models/fig269.js";
import * as m272 from "../models/fig272.js";
import * as m276 from "../models/fig276.js";
import * as m260 from "../models/fig260.js";
import * as m261 from "../models/fig261.js";
import fig262 from "../models/fig262.js";
import fig263 from "../models/fig263.js";
import * as cone from "../models/cone-roller.js";
import * as m264 from "../models/fig264.js";
import * as m266 from "../models/fig266.js";
import { meshAngle } from "../models/gears.js";
import { gearProfile } from "../models/shapes.js";
import * as m244 from "../models/fig244.js";
import * as m246 from "../models/fig246.js";
import * as m252 from "../models/fig252.js";
import * as m273 from "../models/fig273.js";
import { dist, sub, len, partPoint, rot2, quatRotate, dot, cross, add, scale, Z as ZAXIS, planeBasis, norm } from "../models/kit.js";
import * as m251 from "../models/fig251.js";
import * as m253 from "../models/fig253.js";
import * as m277 from "../models/fig277.js";
import * as m278 from "../models/fig278.js";

test("第 243 種:透過皮帶輪與皮帶,把動力從一根水平軸傳到兩根垂直軸", () => {
  const main = fig243.parts.find((p) => p.id === "main");
  const left = fig243.parts.find((p) => p.id === "left");
  assert.equal(main.axis[1], 0, "主動輪的軸是水平的");
  assert.deepEqual(left.axis, [0, 1, 0], "從動軸是垂直的");
  const t = turns243(1);
  assert.ok(Math.abs(t.left) > 0 && Math.abs(t.right) > 0, "兩根垂直軸都被帶動");
  close(t.left, t.right, "兩根垂直軸的皮帶筒一樣大,轉速相同");
  close(turned(fig243, "left", 0, 1) * 0.36, 0.62, "皮帶筒周邊走過的長度 = 主動輪周邊走過的長度", 1e-9);
});

test("第 243 種:原圖上方那條直線和主動輪頂部相切,回程皮帶從主動軸上方留出間隙經過、不擦過轉動的軸", () => {
  const main = fig243.parts.find((p) => p.id === "main");
  const shaft = main.pieces[0]; // 水平軸(沿 z)
  const [sx, sy, sz] = [main.center[0], main.center[1], main.center[2] + shaft.at[2]];
  const points = fig243.pose(0).paths.belt.points;
  assert.ok(main.center[1] + main.radius <= Math.max(...points.map((p) => p[1])) + 1e-9, "主動輪頂部不高過皮帶");
  // 皮帶(管半徑 0.05)沿線取點,量到軸(半徑 0.08)表面的距離
  let gap = Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    for (let k = 0; k <= 20; k++) {
      const p = a.map((v, j) => v + ((b[j] - v) * k) / 20);
      const dz = Math.max(0, Math.abs(p[2] - sz) - shaft.length / 2);
      const radial = Math.max(0, Math.hypot(p[0] - sx, p[1] - sy) - shaft.radius);
      gap = Math.min(gap, Math.hypot(radial, dz) - 0.05);
    }
  });
  assert.ok(gap > 0.1, `皮帶和主動軸之間留出明顯的間隙(${gap.toFixed(3)})`);
});

for (const [n, m, what] of [
  [254, m254, "鏈條"],
  [255, m255, "扁皮帶"],
  [256, m256, "扁皮帶"],
  [257, m257, "圓形皮帶"],
  [258, m258, "圓形皮帶"],
  [259, m259, "圓形皮帶"],
]) {
  test(`第 ${n} 種:以${what}驅動或被${what}驅動:輪轉動時${what}跟著走,反轉時反向`, () => {
    const pose = (v) => m.default.pose(v);
    const travel = pose(2 * Math.PI).paths.strand.phase - pose(0).paths.strand.phase;
    assert.ok(Math.abs(travel) > 1, `${what}跟著輪走`);
    close(m.travel(-1), -m.travel(1), "輪反轉,皮帶也反向走");
  });
}

// 旋轉體剖面([半徑, 軸向])在軸向位置 z 的外緣半徑(剖面上的直立邊取較大的一端)
function profileRadius(profile, z) {
  let r = 0;
  for (let i = 0; i + 1 < profile.length; i++) {
    const [[r0, z0], [r1, z1]] = [profile[i], profile[i + 1]];
    if (z < Math.min(z0, z1) - 1e-9 || z > Math.max(z0, z1) + 1e-9) continue;
    r = Math.max(r, Math.abs(z1 - z0) < 1e-9 ? Math.max(r0, r1) : r0 + ((r1 - r0) * (z - z0)) / (z1 - z0));
  }
  return r;
}

for (const [n, m] of [
  [255, m255],
  [256, m256],
]) {
  test(`第 ${n} 種:扁皮帶(flat belt)是扁的:寬約輪面的 0.8 倍、寬度沿輪軸,內面貼著輪面而不穿入`, () => {
    const def = m.default;
    const wheel = part(def, "wheel");
    const belt = part(def, "strand");
    assert.equal(belt.kind, "belt");
    assert.ok(belt.width && belt.thickness, "扁帶有寬度與厚度");
    assert.ok(belt.width > 5 * belt.thickness, `寬 ${belt.width} 遠大於厚 ${belt.thickness}`);
    const { points } = def.pose(0).paths.strand;
    assert.ok(points.every((p) => Math.abs(p[0]) < 1e-9), "皮帶走在垂直輪軸(X)的平面上,寬度方向就是輪軸");
    // 輪面:剖面上外緣比最低處高不到 0.05 的那一段(第 255 種在兩側凸緣之間,第 256 種是整個隆起的輪面)
    const zs = wheel.profile.map((p) => p[1]);
    const samples = Array.from({ length: 401 }, (_, i) => Math.min(...zs) + ((Math.max(...zs) - Math.min(...zs)) * i) / 400);
    const low = Math.min(...samples.map((z) => profileRadius(wheel.profile, z)));
    const face = samples.filter((z) => profileRadius(wheel.profile, z) < low + 0.05);
    const faceWidth = Math.max(...face) - Math.min(...face);
    const ratio = belt.width / faceWidth;
    assert.ok(ratio > 0.75 && ratio < 0.85, `寬約輪面的 0.8 倍(${ratio.toFixed(2)})`);
    // 皮帶繞在輪上那一段的中心線半徑 seat;內面在 seat − 厚/2
    const seat = Math.min(...points.map((p) => Math.hypot(p[1], p[2])));
    const inner = seat - belt.thickness / 2;
    const top = Math.max(...samples.filter((z) => Math.abs(z) <= belt.width / 2).map((z) => profileRadius(wheel.profile, z)));
    assert.ok(inner >= top, `整個寬度上不穿進輪面(內面 ${inner.toFixed(3)}、輪面最高 ${top.toFixed(3)})`);
    assert.ok(inner - top < 0.02, `內面貼著輪面(間隙 ${(inner - top).toFixed(3)})`);
  });
}

test("第 255 種:輪面兩側的凸緣擋住扁皮帶,不讓它滑出:皮帶兩邊各離凸緣不到皮帶寬的 0.15", () => {
  const wheel = part(m255.default, "wheel");
  const belt = part(m255.default, "strand");
  const flange = Math.max(...wheel.profile.map((p) => p[0]));
  const [z0, z1] = [Math.min(...wheel.profile.map((p) => p[1])), Math.max(...wheel.profile.map((p) => p[1]))];
  const zs = Array.from({ length: 401 }, (_, i) => z0 + ((z1 - z0) * i) / 400);
  const inside = zs.filter((z) => profileRadius(wheel.profile, z) < flange - 1e-6);
  const room = (Math.max(...inside) - Math.min(...inside) - belt.width) / 2;
  assert.ok(room > 0, "皮帶放得進兩側凸緣之間");
  assert.ok(room < 0.15 * belt.width, `兩邊各只留 ${room.toFixed(3)},凸緣擋得住`);
});

test("第 257、258 種是圓形皮帶:不設寬度,畫成圓管", () => {
  for (const m of [m257, m258]) assert.equal(part(m.default, "strand").width, undefined);
});

test("第 254 種:直立鏈節卡在叉口裡、平躺的鏈節落在兩齒之間:鏈條節距配上 12 個叉齒,繞在輪上的每一節直立鏈節都對著一個叉齒", () => {
  const def = m254.default;
  const wheel = part(def, "wheel");
  const chain = part(def, "strand");
  const forks = wheel.pieces.filter((p) => p.kind === "plate");
  assert.equal(forks.length, m254.TEETH);
  const polar = ([, y, z]) => Math.atan2(z, y);
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  for (const angle of [0, 0.2, 1, 2.5, -0.7]) {
    const { points, phase } = def.pose(angle).paths.strand;
    // 和畫面(viewer/paths.js 的鍊條)同一套擺法:第 k 節的兩銷在路徑弧長 k·節距 + 相位 與下一個節距處;k 為偶數的是直立鏈節
    const cum = [0];
    for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + dist(points[i], points[i - 1]));
    const at = (s) => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1]);
      return points[i - 1].map((v, j) => v + (points[i][j] - v) * t);
    };
    const forkAngles = forks.map((f) => polar(partPoint([0, 0, 0], wheel.axis, angle, f.at)));
    const seat = Math.hypot(...points[Math.floor(points.length / 2)].slice(1));
    let upright = 0;
    for (let k = Math.ceil(-phase / chain.pitch); k * chain.pitch + phase + chain.pitch <= cum.at(-1); k++) {
      const a = at(k * chain.pitch + phase);
      const b = at((k + 1) * chain.pitch + phase);
      const onWheel = [a, b].every((p) => Math.abs(Math.hypot(p[1], p[2]) - seat) < 0.01); // 路徑在輪上是折線,弦的中段略低於圓
      if (!onWheel) continue;
      const mid = polar(a.map((v, j) => (v + b[j]) / 2));
      const off = Math.min(...forkAngles.map((f) => Math.abs(wrap(mid - f))));
      if (((k % 2) + 2) % 2 === 0) {
        upright++;
        assert.ok(off < 0.02, `輪轉 ${angle}:第 ${k} 節直立鏈節離最近的叉齒 ${((off * 180) / Math.PI).toFixed(1)}°`);
      } else assert.ok(Math.abs(off - Math.PI / m254.TEETH) < 0.02, `輪轉 ${angle}:第 ${k} 節平躺鏈節落在兩齒正中`);
    }
    assert.ok(upright >= 3, "繞在輪上的一段有好幾節直立鏈節");
  }
});

test("第 259 種:V 形槽的溝槽刻有凹紋(兩斜面各一圈),第 258 種的槽面平滑", () => {
  const ridges = (def) => def.parts[0].pieces.filter((p) => p.kind === "box").length;
  assert.equal(ridges(m259.default), 2 * m259.GROOVES);
  assert.equal(ridges(m258.default), 0);
});

test("第 245 種:轉動 A,它從承插座 B 的 L 形槽中脫離,此時才可將其抽出", () => {
  const { VERTICAL, LOCKED } = m245.geometry;
  const locked = m245.bayonet(0);
  close(locked.pinAngle, LOCKED, "起初凸銷卡在橫槽末端");
  assert.equal(locked.lift, 0);
  const turned = m245.bayonet(1);
  close(turned.pinAngle, VERTICAL, "轉動後凸銷到直槽底下");
  assert.equal(turned.lift, 0, "還沒轉到直槽之前抽不出來");
  close(m245.bayonet(2).lift, m245.LIFT, "轉到直槽後可抽出");
  close(m245.bayonet(2).pinAngle, VERTICAL, "抽出時不再轉");
});

test("第 248 種:螺帽 B 旋進 C 的螺紋,把管 A 的凸緣壓緊在 C 上,將兩管固定在一起", () => {
  const { PITCH, TURNS } = m248;
  close(m248.union(0).gap - m248.union(2 * Math.PI).gap, PITCH, "螺帽每轉一圈前進一個螺距");
  close(m248.union(TURNS * 2 * Math.PI).gap, 0, "旋緊時 A 抵住 C");
  close(m248.union(99).gap, 0, "旋到底就停住");
});

test("第 248 種:管接頭是右旋螺紋:從上往下看順時針轉螺帽 B 是旋緊(B 與 A 往下、A 壓向 C)", () => {
  const def = m248.default;
  const marks = def.parts.filter((p) => p.id.startsWith("nutMark"));
  assert.ok(marks.length > 0);
  const end = m248.TURNS * 2 * Math.PI;
  for (const m of marks) {
    assert.deepEqual(m.axis, [0, 1, 0], "記號繞 +Y(朝上)轉,轉角為正是從上往下看逆時針");
    for (const [a, b] of [[0, 1], [3, 3.5], [end - 1, end]]) {
      const pa = def.pose(a).parts;
      const pb = def.pose(b).parts;
      assert.ok(pb[m.id].angle < pa[m.id].angle, `主動量 ${a}→${b}:${m.id} 從上往下看順時針轉`);
      assert.ok(pb.nutB.position[1] < pa.nutB.position[1], `主動量 ${a}→${b}:螺帽往下旋進`);
      // 右旋:繞 +Y 轉 θ 沿 +Y 前進 pitch·θ/2π
      close(pb.nutB.position[1] - pa.nutB.position[1], (m248.PITCH * (pb[m.id].angle - pa[m.id].angle)) / (2 * Math.PI), "右旋螺紋的導程", 1e-9);
    }
  }
});

test("第 248 種:螺帽剖掉前半,頂面的轉動記號只出現在留下的後半(不浮在剖掉的空間),任何時刻都看得到一個", () => {
  const def = m248.default;
  const marks = def.parts.filter((p) => p.id.startsWith("nutMark"));
  for (const v of sweep(m248.TURNS * 2 * Math.PI, 400)) {
    const pose = def.pose(v).parts;
    let shown = 0;
    for (const m of marks) {
      const p = pose[m.id];
      if (p.visible === false) continue;
      shown++;
      for (const piece of m.pieces) {
        const [sx, sy] = piece.size;
        for (const dx of [-sx / 2, sx / 2]) {
          for (const dy of [-sy / 2, sy / 2]) {
            const w = partPoint(p.position, m.axis, p.angle, [piece.at[0] + dx, piece.at[1] + dy, piece.at[2]]);
            assert.ok(w[2] < 0, `主動量 ${v.toFixed(2)}:${m.id} 的角落 z = ${w[2].toFixed(3)} 在剖掉的前半`);
          }
        }
      }
    }
    assert.ok(shown >= 1, `主動量 ${v.toFixed(2)}:至少看得到一個記號`);
  }
});

test("第 249 種:球窩接頭:上管繞球心偏擺,球心不動", () => {
  const def = m249.default;
  const center = def.parts.find((p) => p.id === "pipe").center;
  for (const t of [-m249.TILT, 0, m249.TILT]) {
    const pose = def.pose(t).parts.pipe;
    assert.equal(pose.position, undefined, "上管不平移");
    assert.ok(pose.rotation.every(Number.isFinite));
  }
  assert.deepEqual(center, [0, 0, 0]);
  assert.notDeepEqual(def.pose(m249.TILT).parts.pipe.rotation, def.pose(0).parts.pipe.rotation, "偏擺時朝向改變");
});

test("第 249 種:為配置給管路使用:上管的管孔通進空心球的內腔,球殼底部的開口通到下管,偏擺到哪裡都通", () => {
  const def = m249.default;
  const pipe = part(def, "pipe");
  const socket = part(def, "socket").pieces.filter((p) => p.kind === "lathe");
  // 旋轉體(軸 Y、中心在原點)在局部座標 (x, y, z) 的點是否在實體裡
  const inLathe = (profile, [x, y, z]) => pointInPolygon([Math.hypot(x, z), y], profile);
  for (const t of [-m249.TILT, -m249.TILT / 2, 0, m249.TILT / 2, m249.TILT]) {
    const [c, s] = [Math.cos(t), Math.sin(t)];
    const toPipe = ([x, y, z]) => [x * c + y * s, -x * s + y * c, z]; // 世界 → 上管局部(繞 Z 轉 −t)
    const toWorld = ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
    const path = [];
    for (const off of [-0.2, 0, 0.2]) {
      for (let h = 2.6; h >= 0; h -= 0.05) path.push(toWorld([off, h, 0])); // 沿上管的管孔往下到球心
      for (let d = 0; d <= 2.5; d += 0.05) path.push([off, -d, 0]); // 從球心直直往下穿過下管
    }
    for (const w of path) {
      const at = w.map((n) => n.toFixed(2)).join(", ");
      assert.ok(!inLathe(pipe.profile, toPipe(w)), `偏擺 ${t.toFixed(2)}:(${at}) 被上管或球擋住`);
      for (const piece of socket) assert.ok(!inLathe(piece.profile, w), `偏擺 ${t.toFixed(2)}:(${at}) 被球窩擋住`);
    }
  }
});

test("第 249 種:偏擺的極限由球窩的開口決定:擺到極限時管身靠上窩口(不穿入),擺不到極限時離開", () => {
  const def = m249.default;
  const outer = part(def, "pipe").profile.at(-1)[0]; // 上管外半徑
  const lathes = part(def, "socket").pieces.filter((p) => p.kind === "lathe");
  // 上半球窩的窩口內緣:球窩內壁上最高的那一點
  const [cr, cz] = lathes.flatMap((p) => p.profile).filter(([r, z]) => z > 0 && Math.hypot(r, z) < 1.05).reduce((a, b) => (b[1] > a[1] ? b : a));
  // 上管偏擺 t 時,管的外壁離窩口內緣(左右兩側取近的)多遠
  const gap = (t) => Math.min(...[-1, 1].map((s) => Math.abs(s * cr * Math.cos(t) + cz * Math.sin(t)) - outer));
  for (const t of [-m249.TILT, m249.TILT]) {
    const g = gap(t);
    assert.ok(g >= 0 && g < 0.03, `擺到極限 ${t.toFixed(2)} 時管身靠上窩口(間隙 ${g.toFixed(3)})`);
  }
  assert.ok(gap(m249.TILT * 0.8) > 0.05, "擺不到極限時管身離開窩口");
});

test("第 250 種:軸由輪的圓周支撐:軸轉動時支撐輪反向轉,接觸點線速度相等(無滑動)", () => {
  const { WHEEL, JOURNAL } = m250.geometry;
  const a = 0.8;
  const b = m250.supportAngle(a);
  assert.ok(b < 0, "支撐輪反向轉");
  close(Math.abs(b) * WHEEL, a * JOURNAL, "接觸點線速度相等");
});

test("第 250 種:軸上帶著被托著轉的大輪(約為支撐輪的 0.8 倍),在兩支撐輪後面;支架在兩輪前面", () => {
  const def = m250.default;
  const { WHEEL } = m250.geometry;
  const wheels = ["left", "right"].map((id) => part(def, id));
  const front = Math.max(...wheels.map((w) => w.center[2] + w.width / 2));
  const back = Math.min(...wheels.map((w) => w.center[2] - w.width / 2));
  // 軸上最大的那片板就是大輪(507movements 的動畫:半徑 4 對支撐輪 5)
  const plates = part(def, "shaft").pieces.filter((p) => p.kind === "plate");
  const radiusOf = (p) => Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y)));
  assert.ok(plates.length > 0, "軸上有大輪");
  const big = plates.reduce((a, b) => (radiusOf(a) >= radiusOf(b) ? a : b));
  assert.ok(Math.abs(radiusOf(big) / WHEEL - 0.8) < 0.05, `大輪約為支撐輪的 0.8 倍(實際 ${(radiusOf(big) / WHEEL).toFixed(2)})`);
  assert.ok(big.at[2] + (big.thickness ?? 0.2) / 2 < back, "大輪在兩支撐輪後面,不和它們同一層");
  const frame = part(def, "frame");
  assert.ok(frame.center[2] - frame.thickness / 2 > front, "支架板在兩輪前面(原圖支架擋住兩輪的下半)");
});

test("第 267 種:輪緣逆箭頭轉時,偏心臂把運動傳給軸;朝箭頭方向轉時,軸保持靜止", () => {
  const S = m267.SWING;
  const ccw = m267.friction(S);
  close(ccw.rim, S, "輪緣逆時針轉了一程");
  close(ccw.shaft - m267.friction(0).shaft, S, "軸跟著轉");
  const back = m267.friction(2 * S);
  close(back.rim, 0, "輪緣順時針(箭頭方向)轉回");
  close(back.shaft, ccw.shaft, "軸保持靜止");
});

// 第 267 種:各支臂的定義、姿勢與世界座標的外形(xy)
const arms267 = (v) => {
  const def = m267.default;
  const pose = def.pose(v).parts;
  return Array.from({ length: 4 }, (_, i) => {
    const p = pose[`arm${i}`];
    const d = part(def, `arm${i}`);
    return { def: d, pose: p, outline: contactJs.placeOutline(d.shape.outline, p.position, p.angle) };
  });
};
const reach267 = (outline) => Math.max(...outline.map(([x, y]) => Math.hypot(x, y)));
// 圓柱附件的世界 z 範圍(零件姿勢的 z 加上附件的 at)
const zRange267 = (poseZ, piece) => [poseZ + piece.at[2] - piece.length / 2, poseZ + piece.at[2] + piece.length / 2];

test("第 267 種:四支偏心臂以樞軸銷裝在軸轂上——銷落在軸轂的外形裡,穿過軸轂與臂", () => {
  const def = m267.default;
  const hub = part(def, "shaft");
  for (const v of [0, 0.5, 1.7]) {
    const shaftPose = def.pose(v).parts.shaft;
    const hubZ = shaftPose.position?.[2] ?? 0;
    for (const arm of arms267(v)) {
      const pin = arm.def.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) < 1e-9);
      assert.ok(pin, "臂在樞軸處有銷");
      const local = rot2(arm.pose.position, -shaftPose.angle);
      assert.ok(pointInPolygon(local, hub.shape.outline), `樞軸 (${local.map((n) => n.toFixed(2))}) 在軸轂的外形裡`);
      assert.ok(contactJs.edgeDistance(local, hub.shape.outline) > pin.radius, "銷整根在軸轂裡(不從邊緣露出)");
      const [z0, z1] = zRange267(arm.pose.position[2], pin);
      const armZ = arm.pose.position[2];
      assert.ok(z0 <= hubZ - hub.thickness / 2 + 1e-9 && z1 >= armZ + arm.def.thickness / 2, "銷穿過軸轂與臂");
      assert.ok(armZ - arm.def.thickness / 2 > hubZ + hub.thickness / 2, "臂在軸轂前面一層");
    }
  }
});

test("第 267 種:這些臂透過彈簧被抵住輪緣——兩程臂端都貼著輪緣、不穿入;彈簧兩端接在軸轂與臂上", () => {
  const { RIM } = m267.geometry;
  const def = m267.default;
  // 端點落在零件的某根圓柱附件上:柱的軸線穿過端點,端點在柱的 z 範圍內
  const onPost = (point, owner, ownerPose) => {
    const [px, py, pz] = ownerPose.position ?? [0, 0, 0];
    const [x, y] = rot2([point[0] - px, point[1] - py], -ownerPose.angle);
    return owner.pieces.some((p) => {
      if (p.kind !== "cylinder" || Math.hypot(p.at[0] - x, p.at[1] - y) > 1e-6) return false;
      const [z0, z1] = zRange267(pz, p);
      return point[2] > z0 && point[2] < z1;
    });
  };
  for (const v of sweep(4 * m267.SWING, 64)) {
    const pose = def.pose(v).parts;
    for (const [i, arm] of arms267(v).entries()) {
      const gap = RIM.inner - reach267(arm.outline);
      assert.ok(gap > -1e-6 && gap < 0.005, `主動量 ${v.toFixed(2)}:臂 ${i} 的端頭離輪緣 ${gap.toFixed(4)}`);
      const spring = pose[`spring${i}`];
      assert.ok(onPost(spring.from, part(def, "shaft"), pose.shaft), `彈簧 ${i} 的一端接在軸轂的座柱上`);
      assert.ok(onPost(spring.to, arm.def, arm.pose), `彈簧 ${i} 的另一端接在臂的柱上`);
    }
  }
});

test("第 267 種:輪緣朝箭頭方向轉時,臂被帶著繞樞軸往內轉、離開輪緣(讓開);逆箭頭轉時往外轉、頂進輪緣(卡住)", () => {
  const { RIM } = m267.geometry;
  const [arm] = arms267(0);
  const tip = arm.outline.reduce((a, b) => (Math.hypot(...b) > Math.hypot(...a) ? b : a));
  // 輪緣逆時針(逆箭頭)轉時,臂端受到沿切線往逆時針的摩擦;它對樞軸的力矩把臂往逆時針帶
  const r = Math.hypot(...tip);
  const drag = [-tip[1] / r, tip[0] / r];
  const lever = [tip[0] - arm.pose.position[0], tip[1] - arm.pose.position[1]];
  assert.ok(lever[0] * drag[1] - lever[1] * drag[0] > 0, "逆箭頭轉時,摩擦把臂往逆時針帶");
  const turnedBy = (d) => contactJs.placeOutline(arm.def.shape.outline, arm.pose.position, arm.pose.angle + d);
  const oneDeg = Math.PI / 180;
  assert.ok(reach267(turnedBy(oneDeg)) > RIM.inner + 0.005, "臂往逆時針轉會頂進輪緣:卡住、把運動傳給軸");
  assert.ok(reach267(turnedBy(-oneDeg)) < RIM.inner - 0.005, "臂往順時針轉會離開輪緣:繞樞軸讓開");
});

test("第 267 種:輪緣經四根輻條接到鬆套在軸上的輪轂;輻條、輪轂在臂與軸轂的後面一層", () => {
  const { RIM } = m267.geometry;
  const def = m267.default;
  const rim = part(def, "rim");
  const pose = def.pose(0).parts;
  const rimZ = pose.rim.position?.[2] ?? 0;
  const layers = helpersJs.plateLayers(rim).slice(1); // 第一層是輪緣本身
  const radii = (loop) => loop.map(([x, y]) => Math.hypot(x, y));
  const hub = layers.find((l) => l.solid.holes.length === 1);
  assert.ok(hub, "輪緣有一個帶孔的輪轂");
  const shaftHub = part(def, "shaft");
  const shaft = shaftHub.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) < 1e-9 && p.length > 1);
  const bore = Math.min(...radii(hub.solid.holes[0]));
  assert.ok(bore >= shaft.radius - 1e-6 && bore < shaft.radius + 0.02, `輪轂的孔(${bore.toFixed(3)})鬆套在軸(${shaft.radius})上`);
  const shaftZ = pose.shaft.position?.[2] ?? 0;
  const [s0, s1] = zRange267(shaftZ, shaft);
  assert.ok(s0 < rimZ + hub.z0 && s1 > rimZ + hub.z1, "軸穿過輪轂");
  const shaftHubBack = shaftZ - shaftHub.thickness / 2;
  assert.ok(rimZ + hub.z1 < shaftHubBack, "輪轂藏在軸轂後面");
  const spokes = layers.filter((l) => l.solid.holes.length === 0);
  assert.equal(spokes.length, 4, "四根輻條");
  const hubOuter = Math.max(...radii(hub.solid.outline));
  for (const s of spokes) {
    const rs = radii(s.solid.outline);
    assert.ok(Math.min(...rs) < hubOuter && Math.max(...rs) > RIM.inner, "輻條從輪轂伸進輪緣");
    assert.ok(rimZ + s.z1 < shaftHubBack, "輻條在軸轂(與臂)後面");
    assert.ok(s.z0 >= -rim.thickness / 2, "輻條在輪緣的厚度裡");
  }
});

test("第 270 種:皮帶輪的抗摩擦軸承:滾子在不動的軸與輪孔之間滾動,不滑動", () => {
  const { BORE, SHAFT, ROLLER } = m270.geometry;
  for (const a of sweep(3, 6)) {
    const { carrier, spin } = m270.rollers(a);
    // 滾子貼軸的那一點速度為零,貼輪孔的那一點速度等於輪孔表面速度
    close(carrier * (SHAFT + ROLLER) - spin * ROLLER, 0, "貼軸處不滑動", 1e-12);
    close(carrier * (SHAFT + ROLLER) + spin * ROLLER, a * BORE, "貼輪孔處不滑動", 1e-12);
  }
});

test("第 270 種:左圖是蓋上蓋板的同一個輪:蓋板中央的孔裡看得到不動的軸與六個滾子的內緣,和右圖同步", () => {
  const def = m270.default;
  const { SHAFT, ROLLER } = m270.geometry;
  const L = part(def, "pulleyL");
  const cover = L.pieces.find((p) => p.kind === "plate");
  const hole = Math.max(...cover.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  assert.ok(hole > SHAFT + 0.03 && hole < SHAFT + 2 * ROLLER - 0.1, "蓋板的孔比軸大、比滾子外緣小:孔裡看得到滾子的內緣");
  assert.ok(Math.max(...L.shape.holes[0].map(([x, y]) => Math.hypot(x, y))) >= SHAFT + 2 * ROLLER - 1e-9, "蓋板後面的輪和右圖一樣有放滾子的大孔");
  const shaftL = part(def, "stands").pieces.find((p) => p.kind === "cylinder" && p.at[0] === L.center[0] && p.radius === SHAFT);
  assert.ok(shaftL, "左圖也有同樣粗的不動軸");
  for (const a of sweep(3, 6)) {
    const pose = def.pose(a).parts;
    for (let i = 0; i < 6; i++) {
      const l = pose[`rollerL${i}`];
      const r = pose[`roller${i}`];
      close(l.angle, r.angle, "左右兩圖的滾子同步自轉", 1e-12);
      close(dist(l.position, L.center), SHAFT + ROLLER, "左圖的滾子夾在軸與輪孔之間", 1e-12);
      close(l.position[1] - L.center[1], r.position[1], "左右兩圖的滾子同步公轉", 1e-12);
    }
  }
});

test("第 247 種:頂桿撞到海底時被相對地推上去,把卡榫從錘下方抽出,錘脫落,桿不帶錘被拉起", () => {
  const { SEA, REST, REST_ANGLE } = m247.geometry;
  const lowering = m247.sounding(0.2);
  assert.ok(lowering.attached && lowering.push === 0, "放下途中錘掛在桿上,頂桿沒被推");
  const pushed = m247.sounding(0.42);
  assert.ok(pushed.push > 0 && pushed.catchAngle < REST_ANGLE, "觸底後頂桿被推上,卡榫轉開");
  const fallen = m247.sounding(0.55);
  close(Math.min(...m247.section(0.55).weight.flat().map(([, y]) => y)), SEA, "錘落在海底", 1e-9);
  const raised = m247.sounding(0.88);
  assert.ok(raised.rod > fallen.weight + 2, "桿被拉起");
  close(raised.weight, REST, "錘留在海底", 1e-9);
  // 由接觸算:托腳退進錘孔以內(卡榫背面那一層的孔)的那一刻錘才脫落,之後加速落下
  const { T_RELEASE, footReach, HOLE_AT_CATCH } = m247.geometry;
  const before = m247.sounding(T_RELEASE - 0.005);
  assert.ok(before.attached && footReach(before.catchAngle) >= HOLE_AT_CATCH, "托腳還在錘孔外時錘掛著");
  const after = m247.sounding(T_RELEASE + 0.001);
  assert.ok(!after.attached && footReach(after.catchAngle) < HOLE_AT_CATCH, "托腳退進錘孔,錘脫落");
  const w = [0, 1, 2].map((k) => m247.sounding(T_RELEASE + 0.01 * k).weight);
  assert.ok(w[1] - w[2] > w[0] - w[1], "錘加速落下");
});

// 第 247 種的剖面(桿、錘、卡榫、頂桿在剖切面上的外形)兩組之間最深的穿入、是否相交
const deepest247 = (a, b) => Math.max(0, ...a.flatMap((x) => b.map((y) => penetrationDepth(x, y))));
const touches247 = (a, b) => a.some((x) => b.some((y) => polygonsOverlap(x, y)));

test("第 247 種:自桿底部凸出的頂桿穿過桿底的孔、在桿下段的槽裡滑動,撞到海底被推上時,上端頂著卡榫把它轉開", () => {
  const { SEA, ROD_BOTTOM, BLOCK_TOP, REST_ANGLE, T_RELEASE, P } = m247.geometry;
  for (const p of sweep(0.999, 300)) {
    const s = m247.sounding(p);
    const sec = m247.section(p);
    const ys = sec.plunger.flat().map(([, y]) => y);
    // 一根直桿:上端在槽裡(高過底塊頂面),下段從桿底伸出
    assert.ok(Math.max(...ys) > s.rod + BLOCK_TOP && Math.min(...ys) < s.rod + ROD_BOTTOM, `進程 ${p}:頂桿要穿過桿底的孔`);
    // 在孔與槽裡滑:不穿進桿的左壁與底塊,也不穿進海底
    assert.ok(deepest247(sec.plunger, sec.rod) < 1e-3, `進程 ${p}:頂桿穿進桿`);
    assert.ok(Math.min(...ys) > SEA - 1e-9, `進程 ${p}:頂桿穿進海底`);
  }
  // 觸底:腳底貼著海底;卡榫轉開是頂桿上端頂的——兩者相碰,卡榫少轉一點就會被頂桿穿入
  const p = (P.touch + T_RELEASE) / 2 + 0.01;
  const s = m247.sounding(p);
  assert.ok(s.push > 0 && s.catchAngle < REST_ANGLE - 0.02, "觸底後頂桿被推上,卡榫轉開");
  const sec = m247.section(p);
  close(Math.min(...sec.plunger.flat().map(([, y]) => y)), SEA, "頂桿的腳底貼著海底", 1e-9);
  assert.ok(deepest247(sec.catch, sec.plunger) < 1e-3, "頂桿不穿進卡榫");
  const less = m247.section(p, { catchAngle: s.catchAngle + 0.01 });
  assert.ok(touches247(less.catch, less.plunger), "卡榫少轉一點就會被頂桿穿入:是頂桿推開的");
});

test("第 247 種:卡榫用銷裝在桿下段的槽裡,托腳和錘同一層、從錘的下方托住;收回時托腳被錘孔壁壓回,出了錘頂才張開", () => {
  const def = m247.default;
  const { T_RELEASE, REST_ANGLE, HOLE, footReach, P } = m247.geometry;
  const pose = def.pose(0.2).parts;
  const catchPart = def.parts.find((q) => q.id === "catch");
  const weight = def.parts.find((q) => q.id === "weight");
  // 錘只畫後半(z ≤ 0,剖面);卡榫的厚度要跨進這一半,托腳才托得到錘
  const z = pose.catch.position[2];
  assert.ok(weight.sweep === Math.PI && z - catchPart.thickness / 2 < -0.04, "卡榫和錘在同一層");
  // 卡榫裝在桿上的銷:銷在卡榫的樞軸上,長度跨過卡榫的厚度
  const pin = def.parts.find((q) => q.id === "rod").pieces.find((q) => q.kind === "cylinder");
  close(pin.at[0], pose.catch.position[0] - pose.rod.position[0], "銷在卡榫樞軸上(x)", 1e-9);
  close(pin.at[1], pose.catch.position[1] - pose.rod.position[1], "銷在卡榫樞軸上(y)", 1e-9);
  assert.ok(pin.at[2] - pin.length / 2 < z - catchPart.thickness / 2 && pin.at[2] + pin.length / 2 > z + catchPart.thickness / 2, "銷穿過卡榫");
  // 托住:頂桿觸底前,錘靠在托腳上(不穿入,錘再低一點就會穿進托腳)
  for (const p of [0.05, 0.2, T_RELEASE - 0.002]) {
    const s = m247.sounding(p);
    const sec = m247.section(p);
    assert.ok(s.attached, `進程 ${p}:錘還掛著`);
    assert.ok(deepest247(sec.catch, sec.weight) < 1e-3, `進程 ${p}:托腳不穿進錘`);
    const lower = m247.section(p, { weight: s.weight - 0.01 });
    assert.ok(touches247(lower.catch, lower.weight), `進程 ${p}:錘靠在托腳上`);
  }
  // 全程:卡榫不穿進錘,也不穿進桿(槽的左壁、底塊、槽頂)
  for (const p of sweep(0.999, 400)) {
    const sec = m247.section(p);
    assert.ok(deepest247(sec.catch, sec.weight) < 1e-3, `進程 ${p}:卡榫穿進錘`);
    assert.ok(deepest247(sec.catch, sec.rod) < 1e-3, `進程 ${p}:卡榫穿進桿`);
  }
  // 收回:頂桿離開海底後,托腳還在錘孔裡時被孔壁壓著(卡榫多張開一點就會穿進錘);出了錘頂才張開到原位
  let pressed = 0;
  let opened = false;
  for (const p of sweep(P.back, 300, P.lift)) {
    const s = m247.sounding(p);
    if (s.push > 0) continue;
    if (s.catchAngle < REST_ANGLE - 1e-6) {
      assert.ok(!opened, `進程 ${p}:托腳張開後又被壓回`);
      const more = m247.section(p, { catchAngle: s.catchAngle + 0.01 });
      assert.ok(touches247(more.catch, more.weight), `進程 ${p}:卡榫被壓回是錘孔壁擋住的`);
      pressed++;
    } else if (pressed) opened = true;
  }
  assert.ok(pressed > 0 && opened, "收回途中托腳先被壓回,出了錘頂才張開");
  assert.ok(footReach(m247.sounding(P.back).catchAngle) > HOLE, "張開後托腳伸出錘孔,下一輪托得住新的錘");
});

test("第 251 種:重物被抬到夠高時,鉤 A 的上端被框架頂部的槽 B 兩側往內壓,重物突然被釋放", () => {
  const H = m251.HEIGHT;
  const low = m251.hook(0.5);
  assert.equal(low.open, 0, "抬升途中鉤爪抓緊");
  close(low.weight, 0.5, "重物跟著鉤上升");
  const top = m251.hook(H);
  assert.ok(top.open > 0.2, "到頂時鉤爪張開");
  assert.ok(!top.hold && top.weight < m251.RELEASE, "到頂時重物已被突然釋放、正在落下");
  // 以累積的力量落到樁頭上:落下越來越快,落到底停住
  const heights = sweep(m251.DROP, 20).map((s) => m251.hook(m251.RELEASE + s).weight);
  for (let i = 1; i < heights.length; i++) assert.ok(heights[i] < heights[i - 1], "落下途中一路往下");
  assert.ok(heights[0] - heights[10] < heights[10] - heights[20], "後半段落得比前半段多(加速)");
  close(m251.hook(m251.RELEASE + m251.DROP).weight, 0, "重物落到樁頭", 1e-9);
  close(m251.hook(1.5 * H).weight, 0, "鉤往下放時重物留在樁頭上");
});

test("第 251 種:B 是框架頂部的槽(標籤 B 標在槽上,不標在整個框架上)", () => {
  const parts = m251.default.parts;
  assert.equal(parts.find((p) => p.id === "frame").label, undefined, "框架本身不標 B");
  const b = parts.find((p) => p.label === "B");
  const [x, y] = b.center.map((c, i) => c + (b.labelOffset ?? [0, 0, 0])[i]);
  assert.ok(Math.abs(x) < 0.16 && y > 3.05 && y < 4.15, `B 的標籤在框架頂部兩側槽壁之間(${x.toFixed(2)}, ${y.toFixed(2)})`);
});

test("第 251 種:放下吊繩時,合攏的鉤爪碰到凸頭被撐開、越過寬頭後合攏勾在底下(由接觸算)", () => {
  const H = m251.HEIGHT;
  // 下降到最後一段:鉤爪碰到凸頭的頂面,被撐開
  const opens = sweep(0.5, 100, 2 * H - 0.5).map((v) => m251.hook(v).open);
  assert.ok(Math.max(...opens) > 0.05, "鉤爪經過凸頭時被撐開");
  close(m251.hook(2 * H).open, 0, "落到底時鉤爪合攏,勾在寬頭底下", 1e-9);
});

// 第 251 種的量測:量模型定義裡的實際外形(板件輪廓擺到姿勢上),不量算式
const placed251 = (p, v) => {
  const at = m251.default.pose(v).parts[p.id];
  return placeOutline(p.shape.outline, at.position, at.angle ?? 0);
};
const gap251 = (a, b) =>
  polygonsOverlap(a, b) ? 0 : Math.min(...a.map((p) => edgeDistance(p, b)), ...b.map((p) => edgeDistance(p, a)));
const depth251 = (z, t) => [z - t / 2, z + t / 2];

test("第 251 種:鉤 A 的上端被框架頂部的槽 B 兩側向內壓——兩支鉤都和槽壁同一層,壓著時貼住、少張一點就壓進槽壁,全程不穿入", () => {
  const def = m251.default;
  const H = m251.HEIGHT;
  const walls = def.parts.find((p) => p.id === "frame").pieces.filter((p) => p.kind === "plate");
  const hooks = def.driver.grips.map((id) => def.parts.find((p) => p.id === id));
  assert.equal(hooks.length, 2, "兩支鉤");
  for (const h of hooks) {
    const [a0, a1] = depth251(def.pose(0).parts[h.id].position[2], h.thickness);
    for (const w of walls) {
      const [b0, b1] = depth251(w.at?.[2] ?? 0, w.thickness);
      assert.ok(a0 >= b0 - 1e-9 && a1 <= b1 + 1e-9, `${h.id}(z ${a0.toFixed(2)}–${a1.toFixed(2)})整支在槽壁的深度(z ${b0}–${b1})裡`);
    }
  }
  for (const v of sweep(2 * H, 300))
    for (const h of hooks)
      for (const w of walls) {
        const d = penetrationDepth(placed251(h, v), w.shape.outline);
        assert.ok(d < 0.002, `主動量 ${v.toFixed(2)}:${h.id} 穿進槽壁 ${d.toFixed(3)}`);
      }
  for (const v of [m251.RELEASE, H]) {
    for (const h of hooks) {
      const near = Math.min(...walls.map((w) => gap251(placed251(h, v), w.shape.outline)));
      assert.ok(near < 0.005, `主動量 ${v.toFixed(2)}:${h.id} 的上端貼著槽壁(間隙 ${near.toFixed(3)})`);
      const at = def.pose(v).parts[h.id];
      const less = placeOutline(h.shape.outline, at.position, at.angle - Math.sign(at.angle) * 0.01);
      assert.ok(walls.some((w) => polygonsOverlap(less, w.shape.outline)), `${h.id} 少張 0.01 就壓進槽壁:是槽壁把它往內壓`);
    }
  }
});

test("第 251 種:吊繩從頂樑上的槽 B 穿下來,不貼著、不穿過實心的樑", () => {
  const def = m251.default;
  const ROPE = 0.045;
  const boxes = def.parts.find((p) => p.id === "frame").pieces.filter((p) => p.kind === "box");
  for (const v of sweep(2 * m251.HEIGHT, 24)) {
    const pts = def.pose(v).paths.rope.points;
    const ys = pts.map((p) => p[1]);
    const [x, , z] = pts[0];
    for (const p of pts) assert.ok(Math.abs(p[0] - x) < 1e-9 && Math.abs(p[2] - z) < 1e-9, "吊繩是一條直上直下的線");
    for (const b of boxes) {
      const [sx, sy, sz] = b.size;
      const [bx, by, bz] = b.at;
      if (by + sy / 2 < Math.min(...ys) || by - sy / 2 > Math.max(...ys)) continue;
      const dx = Math.max(Math.abs(x - bx) - sx / 2, 0);
      const dz = Math.max(Math.abs(z - bz) - sz / 2, 0);
      assert.ok(Math.hypot(dx, dz) >= ROPE - 1e-9, `主動量 ${v.toFixed(2)}:吊繩和框架的方塊(${b.at})只隔 ${Math.hypot(dx, dz).toFixed(3)}`);
    }
  }
});

test("第 251 種:照原圖,兩支鉤 A 各自以一根銷裝在吊架上,吊架掛在吊繩下", () => {
  const def = m251.default;
  const carrier = def.parts.find((p) => p.id === def.driver.part);
  const hooks = def.driver.grips.map((id) => def.parts.find((p) => p.id === id));
  for (const v of sweep(2 * m251.HEIGHT, 12)) {
    const pose = def.pose(v);
    const c = pose.parts[carrier.id].position;
    const [l, r] = hooks.map((h) => pose.parts[h.id].position);
    assert.ok(Math.abs(l[0] - r[0]) > 0.4, "兩支鉤各有自己的銷,左右分開");
    for (const h of hooks) {
      const p = pose.parts[h.id].position;
      const pin = carrier.pieces.find((q) => q.kind === "cylinder" && Math.hypot(q.at[0] - (p[0] - c[0]), q.at[1] - (p[1] - c[1])) < 1e-6);
      assert.ok(pin, `${h.id} 的樞軸上有吊架的銷`);
      const [a0, a1] = depth251(pin.at[2] + c[2], pin.length);
      const [b0, b1] = depth251(p[2], h.thickness);
      assert.ok(a0 < b0 && a1 > b1, `${h.id} 的銷穿過鉤`);
      assert.ok(h.shape.holes.some((hole) => pointInPolygon([0, 0], hole) && edgeDistance([0, 0], hole) >= pin.radius - 1e-9), `${h.id} 的銷孔套得住銷`);
    }
    const rope = pose.paths.rope.points;
    const end = rope[rope.length - 1];
    assert.ok(Math.abs(end[0] - c[0]) < 1e-9 && end[1] > c[1], "吊繩接在吊架上方");
  }
});

test("第 251 種:重物 W 兩側的凹口套在立柱的導條上(導條在前後凸耳之間,貼近、不穿入)", () => {
  const def = m251.default;
  const frameBoxes = def.parts.find((p) => p.id === "frame").pieces.filter((p) => p.kind === "box");
  const w = def.parts.find((p) => p.id === "weight");
  const range = (b, i) => [b.at[i] - b.size[i] / 2, b.at[i] + b.size[i] / 2];
  for (const side of [-1, 1]) {
    const lugs = w.pieces.filter((q) => q.kind === "box" && side * q.at[0] > 1);
    const front = lugs.filter((q) => q.at[2] > 0);
    const back = lugs.filter((q) => q.at[2] < 0);
    assert.ok(front.length && back.length, "W 這一側前後都有凸耳");
    const guide = frameBoxes.find((g) => {
      const [gx0, gx1] = range(g, 0);
      const [gz0, gz1] = range(g, 2);
      return lugs.every((q) => range(q, 0)[0] < gx1 && range(q, 0)[1] > gx0) &&
        front.every((q) => range(q, 2)[0] >= gz1 && range(q, 2)[0] - gz1 < 0.03) &&
        back.every((q) => range(q, 2)[1] <= gz0 && gz0 - range(q, 2)[1] < 0.03);
    });
    assert.ok(guide, "立柱上有導條,夾在 W 前後凸耳之間(間隙 0.03 以內)");
  }
});

test("第 251 種:重物落到樁頭上(推斷補上的樁在 W 正下方,落到底時 W 的底面貼著樁頭)", () => {
  const def = m251.default;
  const pile = def.parts.find((p) => p.id === "pile");
  assert.ok(pile, "畫出樁");
  const head = pile.pieces.find((q) => q.kind === "cylinder");
  const top = head.at[1] + head.length / 2;
  const w = def.parts.find((p) => p.id === "weight");
  const body = w.pieces.find((q) => q.kind === "plate");
  const landed = def.pose(m251.RELEASE + m251.DROP).parts.weight.position;
  const bottom = landed[1] + Math.min(...body.shape.outline.map((p) => p[1]));
  close(bottom, top, "W 的底面落在樁頭上", 1e-6);
  assert.ok(Math.abs(landed[0] - head.at[0]) < head.radius, "樁在 W 正下方");
});
test("第 253 種:鼓輪轉得危險地快時,鉤子因離心力往外甩出,鉤住凸柱 D,制止鼓輪", () => {
  const { P_STOP } = m253.geometry;
  const slow = m253.check(0.2);
  assert.ok(slow.tipRadius < m253.check(0.9).tipRadius, "高速時鉤子甩出");
  const stop = m253.check(P_STOP + 0.01).drum;
  close(m253.check(0.95).drum, stop, "鉤住後鼓輪停住");
});

// 第 253 種:量實際外形——鉤子的板(定義裡的輪廓,照 pose 擺放)對凸柱(定義裡的圓柱)
const fig253 = (() => {
  const def = m253.default;
  const hooks = def.parts.filter((p) => p.id.startsWith("hook"));
  const studs = def.parts
    .filter((p) => p.id === "frameA" || p.id.startsWith("studD"))
    .flatMap((p) => p.pieces.filter((q) => q.kind === "cylinder").map((q) => ({ c: [q.at[0], q.at[1]], r: q.radius, z: [p.center[2] + q.at[2] - q.length / 2, p.center[2] + q.at[2] + q.length / 2] })));
  const placed = (poses) => hooks.map((h) => placeOutline(h.shape.outline, poses[h.id].position, poses[h.id].angle));
  /** 鉤子外形離凸柱最近的距離(負值:凸柱的圓心在鉤子裡面) */
  const gap = (outlines) => Math.min(...outlines.flatMap((o) => studs.map((s) => (pointInPolygon(s.c, o) ? -1 : edgeDistance(s.c, o) - s.r))));
  const depth = (outlines) => Math.max(...outlines.flatMap((o) => studs.map((s) => penetrationDepth(o, circlePolygon(s.c, s.r, 64)))));
  return { def, hooks, studs, placed, gap, depth };
})();

test("第 253 種:凸柱 D 與鉤子同一層(三根凸柱一樣深,鉤子的板整個在凸柱的深度範圍裡)", () => {
  const { def, hooks, studs } = fig253;
  assert.equal(studs.length, 3);
  for (const s of studs) assert.deepEqual(s.z.map((v) => +v.toFixed(6)), studs[0].z.map((v) => +v.toFixed(6)), "三根凸柱的深度範圍相同");
  const pose = def.pose(0).parts;
  for (const h of hooks) {
    const z = pose[h.id].position[2];
    assert.ok(z - h.thickness / 2 >= studs[0].z[0] && z + h.thickness / 2 <= studs[0].z[1], `${h.id} 的板在凸柱的深度範圍裡`);
  }
});

test("第 253 種:鼓輪正常轉動時,鉤子收在凸緣旁、從凸柱內側經過(量鉤子的外形,含鉤尖與粗細)", () => {
  const { def, placed, gap } = fig253;
  const { FOLDED } = m253.geometry;
  let folded = 0;
  for (const p of sweep(0, 2000, m253.geometry.P_STOP)) {
    if (m253.check(p).beta !== FOLDED) continue;
    folded++;
    const g = gap(placed(def.pose(p).parts));
    assert.ok(g > 0.05, `進程 ${p.toFixed(4)}:收著的鉤子離凸柱 ${g.toFixed(3)},要留出明顯間隙`);
  }
  assert.ok(folded > 1000, "正常轉動佔了進程的一大段");
});

test("第 253 種:鉤子甩出後鉤住凸柱:停住時鉤子的外形貼著凸柱(間隙接近 0),全程不穿入;再轉一點就撞進凸柱", () => {
  const { def, placed, gap, depth, studs } = fig253;
  const { P_STOP, hookPoses, ARM } = m253.geometry;
  for (const p of sweep(0, 4000, 0.999)) {
    const d = depth(placed(def.pose(p).parts));
    assert.ok(d < 0.002, `進程 ${p.toFixed(4)}:鉤子穿進凸柱 ${d.toFixed(4)}`);
  }
  const at = m253.check(P_STOP + 0.01);
  const g = gap(placed(def.pose(P_STOP + 0.01).parts));
  assert.ok(Math.abs(g) < 0.005, `停住時鉤子貼著凸柱(間隙 ${g.toFixed(4)})`);
  const further = Object.fromEntries(hookPoses(at.drum + 0.01 * Math.sign(at.drum), at.beta).map((q, i) => [`hook${i}`, q]));
  assert.ok(depth(placed(further)) > 0.005, "鼓輪再往前轉 0.01 就撞進凸柱");
  // 凸柱落在鉤的彎裡:在鉤臂前方那一側(鉤尖彎的那一側),比鉤臂末端靠內
  const poses = def.pose(P_STOP + 0.01).parts;
  const caught = fig253.hooks.some((h) => {
    const { position, angle } = poses[h.id];
    return studs.some((s) => {
      const [x, y] = rot2([s.c[0] - position[0], s.c[1] - position[1]], -angle);
      return y > 0 && x > 0.3 && x < ARM - s.r && Math.abs(Math.hypot(x - ARM, y)) < 0.6;
    });
  });
  assert.ok(caught, "凸柱被鉤臂與鉤尖圍住");
});

test("第 253 種:鉤尖往鼓輪轉的方向彎(原圖三支鉤尖都往逆時針那一側彎;鉤尖朝前才鉤得住)", () => {
  const { hooks } = fig253;
  // 鉤臂沿局部 +X;鉤尖彎出去的那一側,外形伸得比另一側遠得多
  const ys = hooks[0].shape.outline.map((p) => p[1]);
  assert.ok(Math.max(...ys) > 3 * -Math.min(...ys), "鉤尖在鉤臂的逆時針那一側(局部 +Y)");
  assert.ok(m253.check(0.3).drum > m253.check(0.2).drum, "鼓輪逆時針轉");
});

test("第 277 種:把擊錘往後扳起時,爪 a 推轉輪背面的棘齒 b,轉輪轉過一個膛室;擊錘落下時轉輪不動(由接觸算)", () => {
  const step = (2 * Math.PI) / m277.CHAMBERS;
  const cocked = m277.colt(m277.COCK);
  close(cocked.cylinder, -step, "扳起一次轉一格", 1e-9);
  assert.ok(cocked.pin[1] > m277.colt(0).pin[1], "扳起時爪往上推");
  close(m277.colt(2 * m277.COCK).cylinder, -step, "擊錘落下時轉輪不動", 1e-9);
  const hands = sweep(2 * m277.COCK, 60, m277.COCK).map((v) => m277.colt(v).hand);
  assert.ok(Math.max(...hands) - Math.min(...hands) > 0.08, "落下時爪被齒背頂開、滑過齒尖(原文:爪 a 由彈簧 c 頂住棘齒)");
  for (const v of sweep(4 * m277.COCK, 120)) {
    const { hand, teeth } = m277.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(hand, t) < 2e-3, `主動量 ${v.toFixed(3)}:爪不穿進棘齒`);
  }
});

test("第 278 種:平台升降時棘爪縮在棘齒外;繩索斷裂時彈簧壓下 b,棘爪 d 被推進棘齒,阻止平台下降", () => {
  const { toothTip, B_UP, pitch, P, PAWL_TIP } = m278.geometry;
  assert.ok(m278.pawlReach(B_UP) < toothTip, "繩拉著時棘爪不碰棘齒");
  for (const p of sweep(P.brk - 0.01, 40)) {
    const { top, b } = m278.story(p);
    assert.ok(m278.pawlAt(top, b).joint + PAWL_TIP < toothTip, `進程 ${p.toFixed(2)}:升降時棘爪縮著`);
  }
  // 斷繩後:平台憑自重加速落下(每段落得比上一段多),落到棘齒上就停住
  const { T_LAND, top: landed } = m278.landing;
  const tops = [0, 1, 2, 3].map((k) => m278.story(P.brk + (k * T_LAND) / 3).top);
  assert.ok(tops[1] - tops[2] > tops[0] - tops[1] && tops[2] - tops[3] > tops[1] - tops[2], "斷繩後加速落下");
  const top0 = m278.story(P.brk).top;
  assert.ok(top0 - landed < pitch, "只落到下方最近的棘齒");
  for (const p of [P.brk + T_LAND + 0.01, (P.brk + P.mend) / 2, P.mend - 0.001]) {
    const s = m278.story(p);
    close(s.top, landed, "落到棘齒上就不再下降");
    assert.ok(m278.pawlAt(s.top, s.b).joint + PAWL_TIP > toothTip, "棘爪 d 被推進棘齒之間");
  }
  // 換上新繩後:繩拉緊、棘爪縮回,平台放回起點,整段連續(下一輪從同一個位置開始)
  const after = m278.story(P.tight);
  assert.ok(m278.pawlAt(after.top, after.b).joint + PAWL_TIP < toothTip, "繩拉緊後棘爪縮回");
  close(m278.story(0.99999).top, m278.story(0).top, "一輪結束時回到起點", 1e-6);
  for (const p of sweep(1, 400)) {
    const { pawl, teeth } = m278.contactAt(p);
    for (const t of teeth) assert.ok(penetrationDepth(pawl, t) < 2e-3, `進程 ${p.toFixed(3)}:棘爪不穿進棘齒`);
  }
});

test("第 244 種:測功計:軸轉動時輪 A 在木塊間轉,槓桿 D 由擋止 C、C' 限制;夾緊程度剛好時槓桿呈水平", () => {
  const def = m244.default;
  close(def.pose(1, "right").parts.leverD.angle, 0, "剛好時槓桿水平");
  assert.ok(def.pose(1, "loose").parts.leverD.angle < 0, "太鬆時槓桿被砝碼拉下,靠在 C 上");
  assert.ok(def.pose(1, "tight").parts.leverD.angle > 0, "太緊時槓桿被帶上去,頂住 C'");
  close(turned(def, "drumA", 0, 2), 2, "輪 A 隨軸轉動");
  close(turned(def, "leverD", 0, 2, "right"), 0, "槓桿不隨輪轉");
});

test("第 244 種:一塊木塊與一連串的條板繫於鏈上,透過槓桿 D 頂部的螺絲與螺帽壓迫皮帶輪", () => {
  const { drum, block, straps, pins, lugs, bolts, lever } = m244.brake; // 槓桿的局部座標,原點是輪 A 的軸心
  const wheel = circlePolygon([0, 0], drum, 360);
  for (const [i, shoe] of [block, ...straps].entries()) {
    const what = i === 0 ? "上方木塊" : `第 ${i} 根條板`;
    assert.ok(penetrationDepth(shoe, wheel) < 1e-3, `${what}不壓進輪裡`);
    const gap = Math.min(...shoe.map(([x, y]) => Math.hypot(x, y) - drum));
    assert.ok(gap >= -1e-3 && gap < 0.02, `${what}貼在輪面上(間隙 ${gap.toFixed(3)})`);
  }
  assert.ok(straps.length >= 5, "下方是一連串的條板,不是一整圈的硬環");
  const blockBottom = Math.min(...block.map((p) => p[1]));
  assert.ok(Math.max(...pins.map((p) => p[1])) < blockBottom, "鏈只包住輪的下半,上端不繞過輪頂");
  for (const [k, bolt] of bolts.entries()) {
    const lug = lugs[k];
    const side = k === 0 ? "左" : "右";
    assert.ok(Math.abs(bolt.x) - bolt.r > drum && Math.abs(bolt.x) - bolt.r > Math.max(...block.map((p) => Math.abs(p[0]))), `${side}螺絲在輪與木塊的外側,不穿過輪`);
    assert.ok(bolt.x - bolt.r > lug.x0 && bolt.x + bolt.r < lug.x1, `${side}螺絲穿過鏈端的耳`);
    assert.ok(bolt.y0 < lug.y0 && bolt.y1 > lever.y1, `${side}螺絲從耳的下面一直伸到槓桿 D 頂部之上`);
    close(bolt.nutBelow[1], lug.y0, `${side}耳下面的螺帽頂著耳`, 1e-9);
    close(bolt.nutAbove[0], lever.y1, `${side}槓桿頂部的螺帽壓在槓桿上`, 1e-9);
    assert.ok(Math.abs(bolt.x) < Math.abs(lever[k === 0 ? "x0" : "x1"]), `${side}螺絲穿過槓桿 D`);
  }
});

test("第 244 種:狀態說明寫明「軸照箭頭方向轉」(原文說的是軸照圖示方向運轉時的調整)", () => {
  // 狀態按鈕列旁的說明(三個狀態共用)與每個狀態的讀數都寫明
  assert.match(m244.default.states.note ?? "", /軸照箭頭方向轉/, "狀態按鈕列的說明寫明轉向");
  for (const state of ["loose", "right", "tight"]) {
    const text = m244.default.pose(0, state).readouts.map((r) => `${r.label}${r.value}`).join();
    assert.match(text, /軸照箭頭方向轉/, `「${state}」的說明寫明轉向`);
  }
});

test("第 246 種:縮放圖器:以描摹點 B 描畫平面圖,鉛筆 A 畫出兩倍大小的圖形", () => {
  const C = m246.fixedC;
  for (const s of sweep(1, 40)) {
    const B = m246.planPoint(s);
    const { A } = m246.pantograph(B);
    close(dist(A, C), 2 * dist(B, C), "CA = 2·CB", 1e-9);
    close(len(sub(sub(A, C), [2 * (B[0] - C[0]), 2 * (B[1] - C[1]), 0])), 0, "C、B、A 共線", 1e-9);
  }
  const a = m246.pantograph(m246.planPoint(0.1)).A;
  const b = m246.pantograph(m246.planPoint(0.35)).A;
  close(dist(a, b), 2 * dist(m246.planPoint(0.1), m246.planPoint(0.35)), "圖上任兩點的距離放大兩倍", 1e-9);
});

test("第 246 種:連接於固定樞軸 C 的滑塊與承載鉛筆的滑塊都套在各自的臂上、跟著臂轉,臂伸過滑塊(滑塊可以在臂上移動)", () => {
  const def = m246.default;
  // 臂身(局部 +x 沿著臂)照姿勢放到世界座標:軸線起點、方向、沿軸的範圍、z 範圍
  const armAt = (P, id) => {
    const b = part(def, id).pieces[0];
    const { position: o, angle } = P[id];
    return { o, d: [Math.cos(angle), Math.sin(angle)], from: b.at[0] - b.size[0] / 2, to: b.at[0] + b.size[0] / 2, z: [o[2] - b.size[2] / 2, o[2] + b.size[2] / 2] };
  };
  // 臂的軸線落在滑塊外形裡的那一段(沿軸的參數範圍)
  const inside = (arm, outline) => {
    const ts = [];
    for (let t = arm.from; t <= arm.to; t += 0.002) if (pointInPolygon([arm.o[0] + t * arm.d[0], arm.o[1] + t * arm.d[1]], outline)) ts.push(t);
    return ts.length ? [ts[0], ts[ts.length - 1]] : null;
  };
  const overlapZ = (a, b) => a[0] < b[1] && b[0] < a[1];
  const sliderC = part(def, "sliderC");
  const pivot = part(def, "pivotC");
  const axle = pivot.pieces.reduce((a, b) => (a.radius <= b.radius ? a : b)); // 固定樞軸往上伸的軸
  const box = part(def, "pencilA").pieces.find((p) => p.kind === "box");
  for (const s of sweep(1, 12)) {
    const P = def.pose(s).parts;
    // C 的滑塊:圓形,轉在固定樞軸的軸上;下臂穿過它再往外伸
    const c = P.sliderC.position;
    const cz = [c[2] - sliderC.length / 2, c[2] + sliderC.length / 2];
    const az = pivot.center[2] + axle.at[2];
    assert.ok(Math.hypot(pivot.center[0] - c[0], pivot.center[1] - c[1]) + axle.radius < sliderC.radius, "固定樞軸的軸在 C 的滑塊的外形裡");
    assert.ok(overlapZ([az - axle.length / 2, az + axle.length / 2], cz), "固定樞軸的軸伸進 C 的滑塊");
    const low = armAt(P, "armLow");
    const inC = inside(low, circlePolygon([c[0], c[1]], sliderC.radius, 64));
    assert.ok(inC && inC[1] - inC[0] > 2 * sliderC.radius - 0.01, `下臂的軸線穿過 C 的滑塊中心(穿過的長度 ${inC && (inC[1] - inC[0]).toFixed(3)})`);
    assert.ok(overlapZ(low.z, cz), "下臂和 C 的滑塊在同一個深度");
    assert.ok(low.from < inC[0] - 0.2 && low.to > inC[1] + 0.2, "下臂兩頭都伸過 C 的滑塊");
    // 鉛筆的滑塊:方形,套在上臂上;上臂沿滑塊的長邊穿過它,再往外伸
    const high = armAt(P, "armHigh");
    const q = P.pencilA;
    const outline = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
      .map(([sx, sy]) => rot2([box.at[0] + (sx * box.size[0]) / 2, box.at[1] + (sy * box.size[1]) / 2], q.angle))
      .map(([x, y]) => [q.position[0] + x, q.position[1] + y]);
    const inA = inside(high, outline);
    assert.ok(inA && Math.abs(inA[1] - inA[0] - box.size[0]) < 0.01, `上臂的軸線沿長邊穿過鉛筆的滑塊(穿過的長度 ${inA && (inA[1] - inA[0]).toFixed(3)})`);
    const bz = q.position[2] + box.at[2];
    assert.ok(overlapZ(high.z, [bz - box.size[2] / 2, bz + box.size[2] / 2]), "上臂和鉛筆的滑塊在同一個深度");
    assert.ok(high.to > inA[1] + 0.2, "上臂伸過鉛筆的滑塊");
    assert.ok(high.from <= 0 && low.to >= Math.hypot(P.armHigh.position[0] - c[0], P.armHigh.position[1] - c[1]) - 1e-9, "兩臂在 R 鉸接");
  }
});

test("第 246 種:「鉛筆會複製出其兩倍大小的圖形」——鉛筆的筆尖與描摹點的針尖都碰到紙面,鉛筆畫的線在紙上", () => {
  const def = m246.default;
  const paper = part(def, "paper");
  const top = paper.center[2] + paper.size[2] / 2;
  const onPaper = ([x, y]) => Math.abs(x - paper.center[0]) < paper.size[0] / 2 && Math.abs(y - paper.center[1]) < paper.size[1] / 2;
  const tipOf = (P, id) => {
    const l = id === "tracerB" ? part(def, id) : part(def, id).pieces.find((p) => p.kind === "lathe");
    return [P[id].position[0], P[id].position[1], P[id].position[2] + (l.at?.[2] ?? 0) + Math.min(...l.profile.map(([, z]) => z))];
  };
  for (const s of sweep(1, 12)) {
    const pose = def.pose(s);
    for (const [id, name] of [["pencilA", "鉛筆的筆尖"], ["tracerB", "描摹點的針尖"]]) {
      const tip = tipOf(pose.parts, id);
      assert.ok(onPaper(tip), `${name}在紙的範圍內`);
      assert.ok(Math.abs(tip[2] - top) < 0.005, `${name}碰到紙面(離紙面 ${(tip[2] - top).toFixed(3)})`);
    }
    for (const p of pose.paths.drawing.points) assert.ok(Math.abs(p[2] - top) < 0.005, `鉛筆畫的線在紙面上(離紙面 ${(p[2] - top).toFixed(3)})`);
  }
});

test("第 246 種:平行四邊形的 U 角真的接上:短桿 B–U 的銷伸到下臂的深度,而且不和上臂交疊", () => {
  const def = m246.default;
  const linkBU = part(def, "linkBU");
  const low = part(def, "armLow").pieces[0];
  for (const s of sweep(1, 12)) {
    const P = def.pose(s).parts;
    const pinZ = [P.linkBU.from[2] - linkBU.thickness * 1.1, P.linkBU.from[2] + linkBU.thickness * 1.1]; // 連桿兩端的銷長 2.2 × 厚度
    const lowZ = [P.armLow.position[2] - low.size[2] / 2, P.armLow.position[2] + low.size[2] / 2];
    assert.ok(pinZ[0] < lowZ[1] && pinZ[1] > lowZ[0], `U 點的銷伸進下臂(銷 ${pinZ.map((v) => v.toFixed(3))}、下臂 ${lowZ.map((v) => v.toFixed(3))})`);
    const { B, U, R, A } = m246.pantograph(m246.planPoint(s));
    // 短桿 B–U 和上臂 R–A 平行(平行四邊形的對邊),同一層也不會交疊
    const gap = Math.min(...[0, 0.25, 0.5, 0.75, 1].map((t) => {
      const p = [B[0] + (U[0] - B[0]) * t, B[1] + (U[1] - B[1]) * t];
      const d = [A[0] - R[0], A[1] - R[1]];
      return Math.abs((p[0] - R[0]) * d[1] - (p[1] - R[1]) * d[0]) / Math.hypot(...d);
    }));
    assert.ok(gap > 0.3, "短桿 B–U 離上臂夠遠");
  }
});

test("第 252 種:把部件 D 上下移動,滾子 A 和 B 在溝槽 C 內以相同幅度、相反方向來回移動", () => {
  const rest = m252.rollers(0);
  for (const v of sweep(m252.RANGE[1], 6, m252.RANGE[0])) {
    const { a, b } = m252.rollers(v);
    close(a - rest.a, -(b - rest.b), "相同幅度、相反方向");
    assert.ok(b - a >= 2 * m252.ROLL - 1e-9, "兩滾子不互相穿透");
  }
  assert.ok(m252.rollers(0.5).b > rest.b, "D 往上時兩滾子分開");
  assert.ok(m252.rollers(m252.RANGE[0]).b - m252.rollers(m252.RANGE[0]).a < 2 * m252.ROLL + 0.05, "D 到最下面時兩滾子互相靠到");
});

test("第 252 種:滾子的銷在溝槽 C 裡滑:溝槽只有銷那麼寬;由前往後是 D 的斜槽臂、滾子、溝槽桿 C(原圖溝槽桿穿過滾子的線畫成虛線)", () => {
  const def = m252.default;
  const guide = part(def, "guideC");
  const roller = part(def, "rollerA");
  const pin = roller.pieces.find((p) => p.kind === "cylinder");
  const span = (pts, i) => [Math.min(...pts.map((p) => p[i])), Math.max(...pts.map((p) => p[i]))];
  // 溝槽的兩條軌:guideC 裡橫跨滾子行程的兩條長板
  const rails = guide.pieces.filter((p) => p.kind === "plate" && span(p.shape.outline, 0)[1] - span(p.shape.outline, 0)[0] > 3);
  assert.equal(rails.length, 2, "溝槽是上下兩條軌");
  const [lower, upper] = rails.map((r) => span(r.shape.outline, 1)).sort((a, b) => a[0] - b[0]);
  const slot = upper[0] - lower[1];
  close(slot, 2 * pin.radius, "溝槽寬等於銷徑", 0.011);
  assert.ok(slot < 0.5 * 2 * m252.ROLL, "溝槽比滾子窄得多(滾子不在溝槽裡)");
  const zRange = (z, t) => [z - t / 2, z + t / 2];
  for (const v of sweep(m252.RANGE[0], 6, m252.RANGE[1])) {
    const pose = def.pose(v).parts;
    close(pose.rollerA.position[1], (upper[0] + lower[1]) / 2, "銷在溝槽正中,上下兩緣都貼著銷", 1e-9);
    const railZ = zRange(rails[0].at?.[2] ?? 0, rails[0].thickness);
    const rollerZ = zRange(pose.rollerA.position[2], roller.thickness);
    const armZ = zRange(pose.partD.position[2], part(def, "partD").pieces[0].thickness);
    const pinZ = zRange(pose.rollerA.position[2] + (pin.at?.[2] ?? 0), pin.length);
    assert.ok(rollerZ[0] >= railZ[1] - 1e-9, "滾子在溝槽桿前面");
    assert.ok(armZ[0] >= rollerZ[1] - 1e-9, "D 的斜槽臂在滾子前面");
    assert.ok(pinZ[0] <= railZ[0] && pinZ[1] >= armZ[1], "銷從溝槽 C 穿過滾子,伸過 D 的斜槽");
  }
});

test("第 273 種:當桿 A 和 B 被拉近時,桿 C 和 D 會被進一步推開,反之亦然", () => {
  const [lo, hi] = m273.RANGE;
  assert.ok(m273.spread(lo) > m273.spread(hi), "A、B 拉近時 C、D 推開");
  for (const w of sweep(hi, 10, lo)) close(Math.hypot(w, m273.spread(w)), m273.SIDE, "四根桿長度不變");
});

test("第 273 種:四個導套固定在後面的十字形底板上(導套的背面貼著底板的前面)", () => {
  const pieces = part(m273.default, "guides").pieces;
  const range = (p, i) => [p.at[i] - p.size[i] / 2, p.at[i] + p.size[i] / 2];
  const base = pieces.filter((p) => p.size[0] > 3 || p.size[1] > 3);
  const plates = pieces.filter((p) => !base.includes(p));
  assert.equal(base.length, 2, "十字形底板");
  const front = Math.max(...base.map((p) => range(p, 2)[1]));
  // 四個導套:各取最後面的那片板,背面要落在底板的前面上,而且在平面上壓在底板範圍內
  for (const [x, y] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
    const own = plates.filter((p) => Math.sign(Math.round(p.at[0])) === x && Math.sign(Math.round(p.at[1])) === y);
    assert.equal(own.length, 4, "每個導套四片板");
    const back = Math.min(...own.map((p) => range(p, 2)[0]));
    close(back, front, "導套的背面貼著底板", 1e-9);
    const rear = own.find((p) => range(p, 2)[0] === back);
    const under = base.some((b) => [0, 1].every((i) => range(rear, i)[0] >= range(b, i)[0] - 1e-9 && range(rear, i)[1] <= range(b, i)[1] + 1e-9));
    assert.ok(under, "導套壓在底板上");
  }
});

test("第 260 種:兩輪 D、E 轉速相同時螺桿不動;轉速不同時,螺桿依兩者的速度差移動", () => {
  const { F, D, B, E, PITCH } = m260;
  const turns = 3;
  const a = turns * 2 * Math.PI;
  const { d, e, shift } = m260.differential(a);
  const diff = (d - meshAngle(F, D, 0) - (e - meshAngle(B, E, 0))) / (2 * Math.PI);
  close(shift, PITCH * diff, "每差一圈移動一個螺距", 1e-9);
  assert.ok(Math.abs(shift) > 0.05, "兩輪轉速不同,螺桿移動");
  assert.notEqual(F.teeth / D.teeth, B.teeth / E.teeth, "兩組齒數比不同");
});

test("第 261 種:圓盤 B 轉動時重物 W 上下往復,下行程比上行程短(鼓輪持續把繩捲上來)", () => {
  const ys = sweep(m261.RANGE[1], 800).map((t) => m261.weight(t).yW);
  const strokes = [];
  let dir = Math.sign(ys[1] - ys[0]);
  let start = ys[0];
  for (let i = 1; i < ys.length; i++) {
    const d = Math.sign(ys[i] - ys[i - 1]);
    if (d && d !== dir) {
      strokes.push(ys[i - 1] - start);
      start = ys[i - 1];
      dir = d;
    }
  }
  const downs = strokes.filter((s) => s < 0).map(Math.abs);
  const ups = strokes.filter((s) => s > 0);
  assert.ok(downs.length && ups.length, "上下往復");
  assert.ok(Math.max(...downs) < Math.max(...ups), "下行程比上行程短");
  assert.ok(m261.weight(m261.RANGE[1]).yW > m261.weight(0).yW, "每轉一圈淨上升");
});

// 機架各塊的外接盒(box 與 plate;plate 的輪廓在 xy 平面、沿 z 擠出,厚度以 at 的 z 為中心)
const frameBox = (p) => {
  if (p.kind === "box") return [p.at.map((v, i) => v - p.size[i] / 2), p.at.map((v, i) => v + p.size[i] / 2)];
  const xs = p.shape.outline.map((q) => q[0]);
  const ys = p.shape.outline.map((q) => q[1]);
  const z = p.at?.[2] ?? 0;
  return [[Math.min(...xs), Math.min(...ys), z - p.thickness / 2], [Math.max(...xs), Math.max(...ys), z + p.thickness / 2]];
};
const boxesMeet = ([a0, a1], [b0, b1]) => [0, 1, 2].every((i) => a0[i] <= b1[i] + 1e-6 && b0[i] <= a1[i] + 1e-6);
const covers = ([a0, a1], [b0, b1]) => a0 <= b0 + 1e-9 && a1 >= b1 - 1e-9;

test("第 260 種:短支柱連同斜撐板落到底板上,機架是一件;驅動軸 A 兩端都穿過軸承——左支柱與 B 右邊的軸承座(推斷)(#260-1)", () => {
  const def = m260.default;
  const frame = part(def, "frame").pieces.map(frameBox);
  // 從底板(最低的一塊)出發,相接的塊連成一群
  const base = frame.reduce((a, b) => (b[0][1] < a[0][1] ? b : a));
  const reached = new Set([base]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const b of frame) if (!reached.has(b) && [...reached].some((r) => boxesMeet(r, b))) (reached.add(b), (grew = true));
  }
  assert.equal(reached.size, frame.length, "機架每一塊都接到底板");
  const plate = part(def, "frame").pieces.find((p) => p.kind === "plate");
  close(Math.min(...plate.shape.outline.map((q) => q[1])), base[1][1], "斜撐板的底落在底板頂面", 1e-9);
  // 驅動軸 A(沿 x)的範圍
  const shaftA = part(def, "shaftA");
  const axle = shaftA.pieces.find((p) => p.kind === "cylinder");
  const ax = [shaftA.center[0] + axle.at[2] - axle.length / 2, shaftA.center[0] + axle.at[2] + axle.length / 2];
  const [, y, z] = shaftA.center;
  // 軸承:A 的軸線穿過的機架塊,而且 A 從它的兩面伸出
  const bearings = frame.filter(([lo, hi]) => lo[1] < y - axle.radius && hi[1] > y + axle.radius && lo[2] < z - axle.radius && hi[2] > z + axle.radius && lo[0] > ax[0] && hi[0] < ax[1]);
  const gears = [m260.F, m260.B].flatMap((g) => [g.center[0]]);
  assert.ok(bearings.some(([, hi]) => hi[0] < Math.min(...gears) - 0.5), "A 的左端穿過左支柱");
  assert.ok(bearings.some(([lo]) => lo[0] > m260.B.center[0]), "A 的右端穿過 B 右邊的軸承");
});

test("第 261 種:鼓輪、繩、滑輪 E 與重物 W 都在圓盤 B 背面,曲柄銷在盤前,每圈都不會掃過繩(#261-4,決定 (a))", () => {
  const def = m261.default;
  const disc = part(def, "discB");
  const zc = disc.center[2];
  const back = zc - disc.width / 2;
  const span = (p) => [zc + p.at[2] - p.length / 2, zc + p.at[2] + p.length / 2];
  const drum = disc.pieces.find((p) => p.kind === "cylinder" && p.radius === m261.DRUM);
  const pin = disc.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) > 0.1);
  assert.ok(drum && span(drum)[1] <= back + 1e-9, "鼓輪在圓盤背面");
  assert.ok(span(pin)[0] >= back - 1e-9, "曲柄銷不伸到盤後");
  const ROPE = 0.045; // 繩的粗細(半徑)
  const E = part(def, "pulleyE");
  const W = part(def, "weightW");
  for (const t of sweep(m261.RANGE[1], 96)) {
    const pose = def.pose(t);
    for (const p of pose.paths.ropeD.points) assert.ok(p[2] + ROPE <= back, `主動量 ${t.toFixed(2)}:繩在圓盤背面`);
    assert.ok(pose.parts.pulleyE.position[2] + (E.width * 1.6) / 2 <= back, "滑輪 E(含軸頭)在圓盤背面");
    assert.ok(pose.parts.weightW.position[2] + W.size[2] / 2 <= back, "重物 W 在圓盤背面");
  }
  assert.ok(!def.waivers?.some((w) => w.parts.includes("ropeD")), "曲柄銷掃過繩的豁免拿掉了");
});

test("第 261 種:圓盤 B 的軸往後穿過鼓輪,伸進牆上支架的軸承;支架接到牆(主動件不懸空)(#261-1)", () => {
  const def = m261.default;
  const disc = part(def, "discB");
  const zc = disc.center[2];
  const span = (p) => [zc + p.at[2] - p.length / 2, zc + p.at[2] + p.length / 2];
  const drum = disc.pieces.find((p) => p.kind === "cylinder" && p.radius === m261.DRUM);
  const axle = disc.pieces.find((p) => p.kind === "cylinder" && p.at[0] === 0 && p.at[1] === 0 && p.radius < m261.DRUM);
  assert.ok(axle, "圓盤有一根軸");
  assert.ok(covers(span(axle), span(drum)), "軸穿過鼓輪");
  assert.ok(covers(span(axle), [zc - disc.width / 2, zc + disc.width / 2]), "軸穿過圓盤");
  const wall = part(def, "wall");
  const holder = wall.pieces.find((p) => p.kind === "plate" && pointInPolygon([disc.center[0], disc.center[1]], p.shape.outline));
  assert.ok(holder, "支架板延伸到盤心後方");
  const [hlo, hhi] = frameBox(holder);
  assert.ok(covers(span(axle), [hlo[2], hhi[2]]), "軸穿過整個支架板的厚度(軸承)");
  assert.ok(hhi[2] < span(drum)[0], "支架在鼓輪後面,不碰轉動的鼓輪");
  const post = frameBox(wall.pieces.find((p) => p.kind === "box"));
  assert.ok(boxesMeet(post, [hlo, hhi]), "支架板接到牆");
});

test("第 261 種:連桿 C 與臂 A 的接點有一根銷穿過兩者;曲柄銷穿過 C 的下端;滑輪 E 用短軸裝在臂 A 上;臂 A 的樞軸銷伸進牆上的支架(#261-3)", () => {
  const def = m261.default;
  const rod = part(def, "rodC");
  const arm = part(def, "armA");
  const disc = part(def, "discB");
  const E = part(def, "pulleyE");
  const wall = part(def, "wall");
  const at = (x) => arm.pieces.find((p) => p.kind === "cylinder" && Math.abs(p.at[0] - x) < 1e-9);
  const pinG = at(0);
  const pinJ = at(m261.JOINT);
  const axleE = at(m261.ARM);
  assert.ok(pinG && pinJ && axleE, "臂 A 在 G、接點與 E 各有一根銷或軸");
  const crank = disc.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) > 0.1);
  const layer = (z, t) => [z - t / 2, z + t / 2];
  for (const t of sweep(m261.RANGE[1], 24)) {
    const p = def.pose(t).parts;
    const [gx, gy, zA] = p.armA.from;
    const len = Math.hypot(p.armA.to[0] - gx, p.armA.to[1] - gy);
    const u = [(p.armA.to[0] - gx) / len, (p.armA.to[1] - gy) / len];
    close(Math.hypot(p.rodC.to[0] - (gx + m261.JOINT * u[0]), p.rodC.to[1] - (gy + m261.JOINT * u[1])), 0, "連桿 C 的上端在臂 A 的接點上", 1e-9);
    const zC = p.rodC.to[2];
    const span = (q) => [zA + q.at[2] - q.length / 2, zA + q.at[2] + q.length / 2];
    assert.ok(covers(span(pinJ), layer(zC, rod.thickness)) && covers(span(pinJ), layer(zA, arm.thickness)), "接點的銷穿過連桿 C 與臂 A");
    const crankZ = [disc.center[2] + crank.at[2] - crank.length / 2, disc.center[2] + crank.at[2] + crank.length / 2];
    assert.ok(covers(crankZ, layer(p.rodC.from[2], rod.thickness)), "曲柄銷穿過連桿 C 的下端");
    close(Math.hypot(p.pulleyE.position[0] - p.armA.to[0], p.pulleyE.position[1] - p.armA.to[1]), 0, "E 的中心在臂 A 的端點", 1e-9);
    assert.ok(covers(span(axleE), layer(p.pulleyE.position[2], E.width)) && covers(span(axleE), layer(zA, arm.thickness)), "E 的短軸從臂 A 穿過 E");
  }
  const bracket = wall.pieces.find((p) => p.kind === "plate" && pointInPolygon([m261.G[0], m261.G[1]], p.shape.outline));
  const [blo, bhi] = frameBox(bracket);
  const zA = def.pose(0).parts.armA.from[2];
  const gz = [zA + pinG.at[2] - pinG.length / 2, zA + pinG.at[2] + pinG.length / 2];
  assert.ok(gz[0] < bhi[2] - 0.05 && covers(gz, layer(zA, arm.thickness)), "G 的樞軸銷穿過臂 A、伸進支架");
});

test("第 262–263 種:同一機構的端視圖與側視圖;錐體偏心地轉,滾子 C 往復,朝某一方向的運動比另一方向短", () => {
  for (const v of [0, 3, 9]) assert.deepEqual(fig262.pose(v).parts, fig263.pose(v).parts, "兩圖的零件姿勢一致");
  assert.notDeepEqual(fig262.view.direction, fig263.view.direction, "初始視角不同");
  const tops = sweep(cone.RANGE[1], 800).map((t) => cone.cone(t).top);
  let up = 0;
  let down = 0;
  for (let i = 1; i < tops.length; i++) {
    const d = tops[i] - tops[i - 1];
    if (d > 0) up += d;
    else down -= d;
  }
  assert.ok(up > 0.5 && down > 0.5, "滾子上下往復");
  assert.ok(Math.abs(up - down) > 0.1, "兩個方向的行程不等");
  close(Math.abs(cone.cone(2 * Math.PI).cx - cone.cone(0).cx), cone.PITCH, "螺桿每轉一圈前進一個螺距");
});

// 第 262–263 種的外形量測:錐體的截面半徑從 lathe 輪廓與姿勢量,滾子、立桿、導套、螺紋、螺帽從零件定義量
const coneShape = {
  /** 錐體在世界座標 x 處的截面半徑(錐軸平行於 x);x 在錐體之外回傳 null */
  radius(pose, x) {
    const profile = part(fig263, "coneB").profile.filter(([r]) => r > 0); // [半徑, 沿軸位置]
    const a = x - pose.coneB.position[0];
    for (let i = 1; i < profile.length; i++) {
      const [r0, a0] = profile[i - 1];
      const [r1, a1] = profile[i];
      if (a >= Math.min(a0, a1) && a <= Math.max(a0, a1)) return r0 + ((r1 - r0) * (a - a0)) / (a1 - a0);
    }
    return null;
  },
  ends(pose) {
    const as = part(fig263, "coneB").profile.map(([, a]) => a);
    return [pose.coneB.position[0] + Math.min(...as), pose.coneB.position[0] + Math.max(...as)];
  },
};
/** 滾子與錐面在滾子寬度內各截面的間隙(兩圓的中心距 − 兩半徑),取最小;有截面落在錐體外回傳 null */
function rollerConeGap(v) {
  const pose = fig263.pose(v).parts;
  const roller = part(fig263, "rollerC");
  const [xr, yr, zr] = pose.rollerC.position;
  const [, ey, ez] = pose.coneB.position;
  let gap = Infinity;
  for (let k = 0; k <= 10; k++) {
    const x = xr - roller.length / 2 + (roller.length * k) / 10;
    const r = coneShape.radius(pose, x);
    if (r == null) return null;
    gap = Math.min(gap, Math.hypot(yr - ey, zr - ez) - r - roller.radius);
  }
  return gap;
}
/** 群組零件的一塊 box 在世界座標的範圍(群組不轉,只平移) */
const boxSpan = (piece, origin = [0, 0, 0]) => piece.size.map((s, i) => [origin[i] + (piece.at?.[i] ?? 0) - s / 2, origin[i] + (piece.at?.[i] ?? 0) + s / 2]);

test("第 262–263 種:錐體往左走、離開螺帽 E,滾子壓的部位由大端一路往小端,接觸處越來越細", () => {
  const vs = sweep(cone.RANGE[1], 280);
  const radii = vs.map((v) => {
    const pose = fig263.pose(v).parts;
    return coneShape.radius(pose, pose.rollerC.position[0]);
  });
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] <= radii[i - 1] + 1e-12, `主動量 ${vs[i].toFixed(2)}:接觸處沒有變粗`);
  const big = Math.max(...part(fig263, "coneB").profile.map(([r]) => r));
  const small = Math.min(...part(fig263, "coneB").profile.filter(([r]) => r > 0).map(([r]) => r));
  assert.ok(radii[0] > big - 0.25 * (big - small), `起點在大端附近(半徑 ${radii[0].toFixed(3)})`);
  assert.ok(radii.at(-1) < small + 0.3 * (big - small), `終點在小端附近(半徑 ${radii.at(-1).toFixed(3)})`);
  // 錐體與 E 之間是光軸:螺紋一直在 E 裡,而且螺紋的左端在錐體小端的右邊
  const screw = part(fig263, "screwD");
  const nut = part(fig263, "base").pieces.find((p) => p.kind === "cylinder" && p.axis?.[0] === 1);
  const [n0, n1] = [nut.at[0] - nut.length / 2, nut.at[0] + nut.length / 2];
  let gapToNut = -Infinity;
  for (const v of vs) {
    const pose = fig263.pose(v).parts;
    const sx = pose.screwD.position[0];
    const [t0, t1] = [sx - screw.length / 2, sx + screw.length / 2];
    assert.ok(t0 < n0 && t1 > n1, `主動量 ${v.toFixed(2)}:螺紋穿過 E`);
    const [, coneRight] = coneShape.ends(pose);
    assert.ok(t0 > coneRight, `主動量 ${v.toFixed(2)}:錐體與 E 之間是光軸`);
    const g = n0 - coneRight;
    assert.ok(g >= gapToNut - 1e-12, `主動量 ${v.toFixed(2)}:錐體離 E 越來越遠`);
    gapToNut = g;
  }
});

test("第 262–263 種:滾子全程壓在錐面上(間隙接近 0、不穿入);每次頂起比上一次低,往上的行程比往下短", () => {
  const vs = sweep(cone.RANGE[1], 700);
  for (const v of vs) {
    const gap = rollerConeGap(v);
    assert.ok(gap != null, `主動量 ${v.toFixed(2)}:滾子整個寬度都在錐體上`);
    assert.ok(gap > -1e-6, `主動量 ${v.toFixed(2)}:滾子穿入錐面 ${(-gap).toFixed(4)}`);
    assert.ok(gap < 2e-3, `主動量 ${v.toFixed(2)}:滾子離開錐面 ${gap.toFixed(4)}`);
  }
  const ys = vs.map((v) => fig263.pose(v).parts.stemC.position[1]);
  const peaks = [];
  const troughs = [];
  for (let i = 1; i < ys.length - 1; i++) {
    if (ys[i] >= ys[i - 1] && ys[i] > ys[i + 1]) peaks.push(ys[i]);
    if (ys[i] <= ys[i - 1] && ys[i] < ys[i + 1]) troughs.push(ys[i]);
  }
  peaks.unshift(ys[0]);
  assert.ok(peaks.length >= 4, "頂起好幾次");
  for (let i = 1; i < peaks.length; i++) assert.ok(peaks[i] < peaks[i - 1], `第 ${i + 1} 次頂起比上一次低`);
  for (let i = 1; i < troughs.length; i++) assert.ok(troughs[i] < troughs[i - 1], `第 ${i + 1} 次落下比上一次低`);
  // 每一段往上的行程(谷 → 下一個峰)比它前後往下的行程(峰 → 谷)短
  for (let i = 0; i < troughs.length && i + 1 < peaks.length; i++) {
    const down = peaks[i] - troughs[i];
    const upStroke = peaks[i + 1] - troughs[i];
    assert.ok(upStroke < down, `第 ${i + 1} 圈:往上 ${upStroke.toFixed(3)} 比往下 ${down.toFixed(3)} 短`);
  }
});

test("第 262–263 種:滾子裝在叉上,立桿全程在導套裡,叉與立桿都不穿進滾子的盤面", () => {
  const stem = part(fig263, "stemC");
  const roller = part(fig263, "rollerC");
  const guideAxis = [cone.geometry.XC, 0]; // 立桿的 x、z
  const rod = stem.pieces.filter((p) => p.kind === "box").sort((a, b) => b.size[1] - a.size[1])[0]; // 最長的直立方桿
  // 導套:底座裡圍著立桿(x、z 離立桿中心 0.15 以內)、在滾子上方的板
  const sleeve = part(fig263, "base").pieces.filter((p) => p.kind === "box" && Math.abs(p.at[0] - guideAxis[0]) < 0.15 && Math.abs(p.at[2] - guideAxis[1]) < 0.15 && p.at[1] > 1);
  assert.ok(sleeve.length >= 4, "四片板圍成的導套");
  const g0 = Math.min(...sleeve.map((p) => boxSpan(p)[1][0]));
  const g1 = Math.max(...sleeve.map((p) => boxSpan(p)[1][1]));
  for (const v of sweep(cone.RANGE[1], 400)) {
    const pose = fig263.pose(v).parts;
    const [r0, r1] = boxSpan(rod, pose.stemC.position)[1];
    assert.ok(r0 <= g0 && r1 >= g1, `主動量 ${v.toFixed(2)}:立桿 ${r0.toFixed(2)}…${r1.toFixed(2)} 沒有穿滿導套 ${g0.toFixed(2)}…${g1.toFixed(2)}`);
  }
  // 叉、立桿、重物這些方塊都不進到滾子盤面(滾子局部:x 在寬度內、yz 離軸心小於半徑)
  for (const p of stem.pieces.filter((q) => q.kind === "box")) {
    const [[x0, x1], [y0, y1], [z0, z1]] = boxSpan(p);
    const overlapX = x0 < roller.length / 2 && x1 > -roller.length / 2;
    const dy = Math.max(y0, Math.min(0, y1)) - 0;
    const dz = Math.max(z0, Math.min(0, z1)) - 0;
    assert.ok(!overlapX || Math.hypot(dy, dz) >= roller.radius, `立桿的方塊 ${JSON.stringify(p.at)} 穿進滾子盤面`);
  }
  // 叉的兩片托住滾子銷的兩端
  const pin = stem.pieces.find((p) => p.kind === "cylinder");
  assert.ok(pin, "銷裝在叉上");
  const cheeks = stem.pieces.filter((p) => p.kind === "box" && Math.abs(p.at?.[0] ?? 0) > roller.length / 2 && boxSpan(p)[1][0] <= 0 && boxSpan(p)[1][1] >= 0);
  assert.ok(cheeks.some((p) => p.at[0] < 0) && cheeks.some((p) => p.at[0] > 0), "滾子兩側各一片叉板");
  for (const p of cheeks) {
    const [x0, x1] = boxSpan(p)[0];
    assert.ok(x0 >= -pin.length / 2 && x1 <= pin.length / 2, "叉板套在銷上");
  }
});

test("第 264 種:100 齒與 101 齒的蝸輪,在蝸桿 10,100 次旋轉期間,一個輪比另一個多轉一圈", () => {
  const [a, b] = m264.wheels(10100 * 2 * Math.PI);
  close(Math.abs(a - b), 2 * Math.PI, "多轉一圈", 1e-6);
  const [a1, b1] = m264.wheels(2 * Math.PI);
  close(Math.abs(a1) * 100, 2 * Math.PI, "蝸桿一圈,100 齒輪轉一齒");
  close(Math.abs(b1) * 101, 2 * Math.PI, "蝸桿一圈,101 齒輪轉一齒");
});

test("第 264 種:蝸桿的軸兩端都穿過軸承環", () => {
  const def = m264.default;
  const worm = part(def, "worm");
  const shaft = worm.pieces.find((p) => p.kind === "cylinder");
  const z0 = (shaft.at?.[2] ?? 0) - shaft.length / 2;
  const z1 = (shaft.at?.[2] ?? 0) + shaft.length / 2;
  // 蝸桿軸沿 z、軸心在蝸桿中心;軸承環是框架裡和蝸桿同軸(x、y 相同)的空心圓柱
  const rings = part(def, "frame").pieces.filter((p) => p.kind === "cylinder" && p.inner && !p.axis && Math.abs(p.at[1] - worm.center[1]) < 1e-9);
  assert.equal(rings.length, 2, "兩端各一個軸承環");
  for (const ring of rings) {
    const [r0, r1] = [ring.at[2] - ring.length / 2, ring.at[2] + ring.length / 2];
    assert.ok(shaft.radius <= ring.inner, "軸放得進孔");
    assert.ok(z0 <= r0 && z1 >= r1, `軸 ${z0}…${z1} 穿過 z ${r0}…${r1} 的軸承環`);
  }
});

test("第 266 種:軸的旋轉使可動軸承直線移動,每旋轉一圈移動的距離等於兩螺距之差", () => {
  const one = m266.feed(2 * Math.PI);
  close(one.bearing - m266.feed(0).bearing, m266.P1 - m266.P2, "每圈 = 兩螺距之差");
  close(one.shaft, m266.P1, "軸每圈穿過固定軸承前進一個螺距");
});

test("第 266 種:可動軸承的底板座在導軌上滑,兩側的擋邊擋住它跟著軸轉", () => {
  const def = m266.default;
  const base = part(def, "base").pieces.filter((p) => p.kind === "box").map((p) => boxSpan(p));
  for (const t of sweep(m266.RANGE[1], 16)) {
    const pos = def.pose(t).parts.bearing.position;
    const boxes = part(def, "bearing").pieces.map((p) => boxSpan(p, pos));
    const plate = boxes.reduce((m, b) => (b[1][0] < m[1][0] ? b : m)); // 最低的一塊是底板
    // 底板正下方的導軌:x 範圍蓋住底板、頂面最接近底板底面
    const under = base.filter((b) => b[1][1] <= plate[1][0] + 1e-6).sort((a, b) => b[1][1] - a[1][1]);
    const rail = under[0];
    close(plate[1][0], rail[1][1], `曲柄轉 ${t.toFixed(2)}:底板底面落在導軌頂面`, 2e-3);
    assert.ok(rail[0][0] <= plate[0][0] && plate[0][1] <= rail[0][1], `曲柄轉 ${t.toFixed(2)}:底板整塊都在導軌上`);
    // 兩側擋邊:在導軌頂面之上、和底板同高的那一段,夾住底板的前後兩面
    const lips = base.filter((b) => b[1][0] < plate[1][1] && b[1][1] > plate[1][0] && b[0][0] <= plate[0][0] && plate[0][1] <= b[0][1]);
    const front = lips.find((b) => b[2][0] >= plate[2][1] - 1e-6);
    const back = lips.find((b) => b[2][1] <= plate[2][0] + 1e-6);
    assert.ok(front && back, `曲柄轉 ${t.toFixed(2)}:底板前後兩側都有擋邊`);
    assert.ok(front[2][0] - plate[2][1] < 0.01 && plate[2][0] - back[2][1] < 0.01, "擋邊貼著底板(間隙小於 0.01)");
  }
});

// 第 265 種:滾子在鼓輪軸線所在的直立面(z = 0)上的斷面:沿軸 u 寬 width、沿 n(和 u 垂直、朝上)高 2·半徑的長方形
function rollerSection265(pose) {
  const { ROLLER, WIDTH } = m265.geometry;
  const u = quatRotate(pose.roller.rotation, ZAXIS);
  const n = [u[1], -u[0], 0];
  const c = pose.roller.position;
  const corner = (a, b) => add(c, add(scale(u, a * WIDTH / 2), scale(n, b * ROLLER)));
  const rect = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map((p) => [p[0], p[1]]);
  return { u, n, c, rect, bottom: [corner(-1, -1), corner(1, -1)] };
}
const drumSection265 = () => {
  const L = m265.geometry.LEN;
  return [[-L / 2, 0], ...sweep(L, 400, 0).map((s) => [s - L / 2, m265.drumRadius(s - L / 2)]), [L / 2, 0]];
};
const T265 = 2 * 2 * Math.PI * m265.geometry.TRAVERSE; // 滾子來回一趟

test("第 265 種:圓錐形鼓輪規則轉動,摩擦滾子沿長度方向橫移,得到變速的旋轉運動", () => {
  const def = m265.default;
  const xs = [];
  const rates = [];
  for (const t of sweep(T265, 60)) {
    const p = def.pose(t).parts;
    const h = 1e-4;
    const rate = (def.pose(t + h).parts.roller.angle - p.roller.angle) / h;
    // 接觸處:滾子斷面底邊兩角中離鼓面較近的那一角(鼓面母線內凹,接觸總在角上)
    const { bottom } = rollerSection265(p);
    const [hit] = bottom.map((q) => ({ q, gap: q[1] - m265.drumRadius(q[0]) })).sort((a, b) => a.gap - b.gap);
    close(rate, m265.drumRadius(hit.q[0]) / m265.geometry.ROLLER, `鼓輪轉 ${t.toFixed(2)}:滾子線速度 = 鼓輪在接觸處的線速度`, 2e-3);
    xs.push(p.roller.position[0]);
    rates.push(rate);
  }
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.75 * m265.geometry.LEN, "滾子沿鼓輪的長度方向橫移(走過大半個鼓長)");
  assert.ok(Math.max(...rates) / Math.min(...rates) > 1.8, "滾子轉速隨位置改變");
});

test("第 265 種:滾子用滑鍵套在一根斜的輸出軸上,全程壓在鼓面上(相碰、不穿入),輸出軸的傾角隨滾子的位置改變", () => {
  const def = m265.default;
  const drum = drumSection265();
  const tilts = [];
  for (const t of sweep(T265, 48)) {
    const p = def.pose(t).parts;
    const { u, c, rect } = rollerSection265(p);
    // 滾子與輸出軸同軸、跟著軸轉(滑鍵),輸出軸的右端鉸在擺架的樞軸上
    const us = quatRotate(p.shaft.rotation, ZAXIS);
    close(dot(u, us), 1, "滾子與輸出軸同軸", 1e-9);
    assert.deepEqual(p.shaft.rotation, p.roller.rotation, "滾子與輸出軸一起轉(滑鍵)");
    const pivot = p.arm.position;
    close(len(cross(sub(c, pivot), u)), 0, "滾子的中心在輸出軸上", 1e-9);
    close(len(cross(sub(p.shaft.position, pivot), us)), 0, "輸出軸穿過擺架的樞軸", 1e-9);
    close(p.arm.angle, -Math.atan2(u[1], -u[0]), "擺架和輸出軸一起擺", 1e-9);
    // 壓在鼓面上:不穿入、間隙接近 0;再往下擺一點就穿進鼓面
    assert.ok(penetrationDepth(rect, drum) < 1e-3, `鼓輪轉 ${t.toFixed(2)}:滾子不陷進鼓面`);
    const gap = Math.min(...rect.slice(0, 2).map((q) => q[1] - m265.drumRadius(q[0])));
    assert.ok(gap < 2e-3, `鼓輪轉 ${t.toFixed(2)}:滾子貼著鼓面(間隙 ${gap})`);
    const lower = rect.map((q) => {
      const [x, y] = rot2([q[0] - pivot[0], q[1] - pivot[1]], 0.01);
      return [pivot[0] + x, pivot[1] + y];
    });
    assert.ok(penetrationDepth(lower, drum) > 1e-3, `鼓輪轉 ${t.toFixed(2)}:擺架再往下擺 0.01 就陷進鼓面`);
    tilts.push(Math.atan2(u[1], -u[0]));
  }
  assert.ok(Math.min(...tilts) > 0, "輸出軸往右下斜(右端低)");
  assert.ok(Math.max(...tilts) - Math.min(...tilts) > (2 * Math.PI) / 180, "輸出軸的傾角隨滾子的位置改變(> 2°)");
});

test("第 265 種:撥叉夾在滾子輪轂的兩片凸緣之間推它橫移,不穿進滾子", () => {
  const def = m265.default;
  const roller = part(def, "roller");
  const fork = part(def, "fork");
  const yoke = fork.pieces.find((q) => q.kind === "plate");
  const hub = roller.pieces.filter((q) => q.kind === "cylinder" && q.radius > m265.geometry.SHAFT).sort((a, b) => b.radius - a.radius);
  const flanges = hub.slice(0, 2).map((q) => [q.at[2] - q.length / 2, q.at[2] + q.length / 2]).sort((a, b) => a[0] - b[0]);
  for (const t of sweep(T265, 48)) {
    const p = def.pose(t).parts;
    const { u, c } = rollerSection265(p);
    close(p.fork.angle, p.arm.angle, "撥叉跟著擺架擺(滑套套在擺架的導桿上)", 1e-9);
    // 撥叉板沿軸的範圍(撥叉的局部 x 朝樞軸那一側,即 −u)
    const s = dot(sub(p.fork.position, c), u) - (yoke.at?.[0] ?? 0);
    const [lo, hi] = [s - yoke.thickness / 2, s + yoke.thickness / 2];
    close(len(cross(sub(p.fork.position, c), u)), 0, "撥叉對準輸出軸", 1e-9);
    const g1 = lo - flanges[0][1];
    const g2 = flanges[1][0] - hi;
    assert.ok(g1 > 0 && g2 > 0, `鼓輪轉 ${t.toFixed(2)}:撥叉不穿進凸緣(${g1}, ${g2})`);
    assert.ok(g1 < 0.01 && g2 < 0.01, `鼓輪轉 ${t.toFixed(2)}:撥叉兩面都貼著凸緣(間隙 < 0.01)`);
  }
});

test("第 268 種:曲柄轉動時,擺動桿的端點往復運動", () => {
  const xs = sweep(2 * Math.PI, 72).map((t) => m268.rod(t).end[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.6, "桿端往復");
  close(m268.rod(2 * Math.PI).end[0], m268.rod(0).end[0], "曲柄一圈回到原處", 1e-9);
});

test("第 268 種:滾子被滑過的桿帶著滾——接觸處滾子表面的線速度和桿相同(轉向一致)", () => {
  const def = m268.default;
  const r = part(def, "roller").radius;
  const h = 1e-5;
  for (const t of sweep(2 * Math.PI, 36)) {
    const a = m268.rod(t);
    const b = m268.rod(t + h);
    // 桿通過滾子上方的固定點,桿上的材料沿桿的方向走了 −Δreach(dir:曲柄銷 → 桿端)
    const dir = contactJs.placeOutline([[1, 0]], [0, 0], Math.atan2(a.end[1] - a.pin[1], a.end[0] - a.pin[0]))[0];
    const rodSlide = -(b.reach - a.reach);
    // 接觸處在滾子的上方,法線朝上(垂直於桿);滾子逆時針轉 dα 時表面沿切線 (−n_y, n_x) 走 r·dα
    const n = dir[0] < 0 ? [dir[1], -dir[0]] : [-dir[1], dir[0]];
    const tangent = [-n[1], n[0]];
    const da = def.pose(t + h).parts.roller.angle - def.pose(t).parts.roller.angle;
    const surface = r * da * (tangent[0] * dir[0] + tangent[1] * dir[1]);
    close(surface, rodSlide, `曲柄 ${t.toFixed(2)}:滾子表面與桿同向同速`, 1e-8);
  }
});

test("第 268 種:曲柄是圓盤前面的一根臂,從盤心伸到曲柄銷,在圓盤與桿之間", () => {
  const def = m268.default;
  const disc = part(def, "disc");
  const crank = disc.pieces.find((p) => p.kind === "plate");
  assert.ok(crank, "圓盤上有曲柄臂");
  const pin = disc.pieces.find((p) => p.kind === "cylinder");
  const outline = crank.shape.outline.map(([x, y]) => [x + crank.at[0], y + crank.at[1]]);
  assert.ok(pointInPolygon([0, 0], outline) && pointInPolygon([pin.at[0], pin.at[1]], outline), "臂從盤心伸到曲柄銷");
  const z0 = crank.at[2] - crank.thickness / 2;
  const z1 = crank.at[2] + crank.thickness / 2;
  assert.ok(z0 >= disc.width / 2 - 1e-9, "臂在圓盤前面");
  const rod = def.pose(0).parts.rod;
  const rodBack = rod.from[2] - part(def, "rod").thickness / 2;
  assert.ok(z1 <= rodBack + 1e-9, "臂在桿的後面");
  assert.ok(pin.at[2] - pin.length / 2 < z0 && pin.at[2] + pin.length / 2 > rodBack, "曲柄銷穿過臂、伸進桿");
});

test("第 269 種:框架持續往同一方向直線移動,正齒輪得到交替方向的旋轉(照原圖上下交錯好幾段,換向不只一次)", () => {
  const { SEGMENTS } = m269.geometry;
  // 原圖由左到右:上 4 齒、下 4 齒、上 6 齒、下 1 齒,上下交錯
  assert.deepEqual(SEGMENTS.map((s) => [s.side, s.teeth]), [["top", 4], ["bottom", 4], ["top", 6], ["bottom", 1]], "齒條的分段照原圖");
  const [lo, hi] = m269.RANGE;
  const angles = sweep(lo, 1200, hi).map(m269.gear); // 框架從右往左持續移動
  const steps = angles.slice(1).map((a, i) => a - angles[i]).filter((d) => Math.abs(d) > 1e-6).map(Math.sign);
  const changes = steps.slice(1).filter((s, i) => s !== steps[i]).length;
  assert.equal(changes, 3, "上、下、上、下輪流帶動,齒輪換向三次");
});

test("第 269 種:每段齒條咬合時,齒輪轉角 = 框架位移 / 節圓半徑,上齒條與下齒條帶動的轉向相反", () => {
  const { SEGMENTS, P, R } = m269.geometry;
  for (const seg of SEGMENTS.filter((s) => s.teeth >= 4)) {
    // 段中間的齒走過齒輪正上(下)方的那一個齒距
    const mid = seg.first + Math.floor((seg.teeth - 1) / 2) * P;
    const turn = m269.gear(-mid + P / 2) - m269.gear(-mid - P / 2);
    close(Math.abs(turn), P / R, `${seg.side} ${seg.teeth} 齒那一段`, 0.02);
    assert.equal(Math.sign(turn), seg.side === "top" ? -1 : 1, "框架往右走:上齒條推齒輪順時針、下齒條推逆時針");
  }
});

// 齒輪在框架位移 s 時的齒形(世界座標 2D)
const gear269 = (s, extra = 0) => {
  const { N, R } = m269.geometry;
  const a = m269.gear(s) + extra;
  return gearProfile({ teeth: N, radius: R }).map((p) => rot2(p, a));
};

test("第 269 種:行程全程(兩端與換排處)齒條的齒不穿進齒輪,也沒有推不開的地方", () => {
  assert.deepEqual(m269.jams(), [], "沒有卡死");
  const [lo, hi] = m269.RANGE;
  let worst = { depth: 0 };
  for (const s of sweep(hi, 2400, lo)) {
    const g = gear269(s);
    for (const r of m269.rackOutlines(s)) {
      const depth = penetrationDepth(g, r.outline);
      if (depth > worst.depth) worst = { depth, s, side: r.side };
    }
  }
  assert.ok(worst.depth < 0.003, `穿入 ${worst.depth.toFixed(4)}(框架位移 ${worst.s},${worst.side})`);
});

test("第 269 種:齒輪是被齒條的齒推著轉的:咬合時齒面相碰(少轉一點就穿入),行程兩端齒條的齒完全離開齒輪", () => {
  const { SEGMENTS, P, TIP } = m269.geometry;
  for (const seg of SEGMENTS) {
    for (let k = 0; k < seg.teeth; k++) {
      const s = -(seg.first + k * P); // 這一齒正在齒輪正上(下)方
      // 框架往右走:上齒條推齒輪順時針、下齒條推逆時針。少轉一點 = 往推的反方向退一點
      const push = seg.side === "top" ? -1 : 1;
      const depthOf = (extra) => Math.max(...m269.rackOutlines(s).map((r) => penetrationDepth(gear269(s, extra), r.outline)));
      assert.ok(depthOf(0) < 0.003, `${seg.side} 第 ${k} 齒:不穿入`);
      assert.ok(depthOf(-push * 0.01) > 0.002, `${seg.side} 第 ${k} 齒:齒輪少轉 0.01 就穿入(齒面相碰)`);
    }
  }
  const tip = circlePolygon([0, 0], TIP, 96);
  for (const s of m269.RANGE)
    for (const r of m269.rackOutlines(s)) assert.ok(!polygonsOverlap(tip, r.outline), `框架位移 ${s}:齒條的齒離開齒輪的齒頂圓`);
});

test("第 269 種:框架的桿穿過導套(四片板圍成的方框),導套由立柱撐到地面,桿全程都在導套裡", () => {
  const def = m269.default;
  const { GUIDE_X, FLOOR } = m269.geometry;
  const guide = part(def, "guide").pieces;
  const inBox = (p, b) => b.size.every((d, i) => Math.abs(p[i] - b.at[i]) < d / 2);
  assert.ok(!guide.some((b) => inBox([GUIDE_X, 0, 0], b)), "桿的中心線不在任何一塊實心裡(導套是空心的)");
  for (const [i, sign] of [[1, 1], [1, -1], [2, 1], [2, -1]])
    assert.ok(
      guide.some((b) => Math.abs(b.at[0] - GUIDE_X) < 1e-9 && Math.sign(b.at[i]) === sign && Math.abs(b.at[3 - i]) < 1e-9 && Math.abs(b.at[i]) < 0.2),
      "上下前後四片板圍住桿",
    );
  assert.ok(Math.min(...guide.map((b) => b.at[1] - b.size[1] / 2)) <= FLOOR - 0.1, "導套接到地面");
  const frame = part(def, "frame").pieces;
  const rod = frame[frame.length - 1];
  const right = Math.max(...frame.slice(0, -1).filter((b) => b.kind === "box").map((b) => b.at[0] + b.size[0] / 2));
  for (const s of m269.RANGE) {
    assert.ok(rod.at[0] + s - rod.size[0] / 2 < GUIDE_X - 0.15 && rod.at[0] + s + rod.size[0] / 2 > GUIDE_X + 0.15, `框架位移 ${s}:桿穿出導套兩端`);
    assert.ok(right + s < GUIDE_X - 0.2, `框架位移 ${s}:框架碰不到導套`);
  }
});

test("第 269 種:齒輪的轉向箭頭畫在框架前面的齒輪面上,不被齒條擋住", () => {
  const g = part(m269.default, "gear");
  assert.ok(g.spinOffset > 0.11 && g.spin < g.radius - 1.2 * m269.geometry.M, "箭頭在齒根圓以內、框架前面");
});

// 第 272 種的量測:斜盤當成半徑 R、厚 2H 的實心圓柱(盤的局部 z 是盤面法線),點到它的距離與最近點的半徑
const disc272 = (() => {
  const p = part(m272.default, "disc");
  return { R: Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y))), H: p.thickness / 2 };
})();
function toDisc272(theta, p) {
  const n = quatRotate(m272.default.pose(theta).parts.disc.rotation, [0, 0, 1]);
  const a = n[0] * p[0] + n[1] * p[1] + n[2] * p[2];
  const r = Math.sqrt(Math.max(0, p[0] ** 2 + p[1] ** 2 + p[2] ** 2 - a * a));
  const { R, H } = disc272;
  const dr = Math.max(r - R, 0);
  const da = Math.max(Math.abs(a) - H, 0);
  return { a, r, dist: dr === 0 && da === 0 ? -Math.min(R - r, H - Math.abs(a)) : Math.hypot(dr, da) };
}

test("第 272 種:斜面圓盤凸輪旋轉,靠在盤上的桿得到往復直線運動", () => {
  const ts = sweep(2 * Math.PI, 72).map(m272.rodTravel);
  assert.ok(Math.max(...ts) - Math.min(...ts) > 0.15, "桿往復");
  close(m272.rodTravel(2 * Math.PI), m272.rodTravel(0), "軸一圈回到原處", 1e-9);
});

test("第 272 種:桿端「靠在其圓周上」:圓頭全程貼著盤的圓周(間隙接近 0、不穿入),再往盤推 0.01 就穿入", () => {
  const def = m272.default;
  const ball = part(def, "rod").pieces.find((p) => p.kind === "sphere").radius;
  for (const t of sweep(2 * Math.PI, 72)) {
    const { position: tip, angle } = def.pose(t).parts.rod;
    const k = toDisc272(t, tip);
    close(k.dist, ball, `轉角 ${t.toFixed(2)}:圓頭貼著盤(間隙 0)`, 1e-4);
    // 最近點在圓周上(半徑 R 的那一圈,含兩個邊角),不在盤面中段
    assert.ok(k.r >= disc272.R - 1e-9, `轉角 ${t.toFixed(2)}:碰到的是圓周(圓頭中心離盤軸 ${k.r.toFixed(3)})`);
    const deeper = [tip[0] - 0.01 * Math.cos(angle), tip[1] - 0.01 * Math.sin(angle), tip[2]];
    assert.ok(toDisc272(t, deeper).dist < ball - 0.003, `轉角 ${t.toFixed(2)}:再往盤推 0.01 就穿入`);
  }
});

test("第 272 種:兩個導套是四片板圍成的方框,桿全程穿在框裡、不碰到板;重演不再略過桿與導套的碰撞", () => {
  const def = m272.default;
  const rod = part(def, "rod");
  const bar = rod.pieces.find((p) => p.kind === "box");
  const { position: P0, angle: A } = def.pose(0).parts.rod;
  const U = [Math.cos(A), Math.sin(A), 0];
  const V = [-Math.sin(A), Math.cos(A), 0];
  const along = (p) => (p[0] - P0[0]) * U[0] + (p[1] - P0[1]) * U[1];
  const across = (p) => (p[0] - P0[0]) * V[0] + (p[1] - P0[1]) * V[1];
  // 桿身在桿的座標裡:u 的範圍隨轉角變,截面 |v|、|z| ≤ 半寬
  const half = bar.size[1] / 2;
  const spans = sweep(2 * Math.PI, 72).map((t) => {
    const u0 = along(def.pose(t).parts.rod.position) + bar.at[0];
    return [u0 - bar.size[0] / 2, u0 + bar.size[0] / 2];
  });
  const plates = part(def, "rodGuides").pieces.filter((p) => p.kind === "box" && Math.abs((p.angle ?? 0) - A) < 1e-9 && p.size[0] < 0.5);
  const guides = new Map();
  for (const p of plates) {
    const u = along(p.at);
    const v = [across(p.at) - p.size[1] / 2, across(p.at) + p.size[1] / 2];
    const z = [p.at[2] - p.size[2] / 2, p.at[2] + p.size[2] / 2];
    // 不碰到桿:截面上分開(v 或 z 方向的間隙 ≥ 0)
    const gap = Math.max(v[0] - half, -half - v[1], z[0] - half, -half - z[1]);
    assert.ok(gap >= -1e-9, `導套的板穿進桿(間隙 ${gap.toFixed(3)})`);
    const key = u.toFixed(2);
    if (!guides.has(key)) guides.set(key, { u: [u - p.size[0] / 2, u + p.size[0] / 2], sides: new Set() });
    if (gap < 0.03) guides.get(key).sides.add(v[0] >= half - 1e-9 ? "+v" : v[1] <= -half + 1e-9 ? "-v" : z[0] >= half - 1e-9 ? "+z" : "-z");
  }
  assert.equal(guides.size, 2, "兩個導套");
  for (const g of guides.values()) {
    assert.deepEqual([...g.sides].sort(), ["+v", "+z", "-v", "-z"], "四片板圍住桿");
    for (const [lo, hi] of spans) assert.ok(lo <= g.u[0] && hi >= g.u[1], "整個行程桿都穿在導套裡");
  }
  assert.ok(!def.replay.ignore?.some((pair) => pair.includes("rodGuides")), "重演不略過桿與導套");
});

test("第 272 種:斜盤的輪轂緊貼盤的右面,把盤固定在軸上(輪轂一端埋在盤裡、另一端伸出盤面,一圈都沒有空隙)", () => {
  const def = m272.default;
  const hub = part(def, "disc").pieces.find((p) => p.kind === "cylinder");
  assert.ok(hub, "盤有輪轂");
  const [e1, e2] = planeBasis(hub.axis);
  const axis = norm(hub.axis);
  for (const t of sweep(2 * Math.PI, 12)) {
    const q = def.pose(t).parts.disc.rotation;
    const world = (local) => quatRotate(q, local);
    const ax = world(axis);
    close(Math.abs(ax[0]), 1, "輪轂和軸同軸", 1e-9);
    const c = world(hub.at);
    close(Math.hypot(c[1], c[2]), 0, "輪轂的中心在軸上", 1e-9);
    for (const phi of sweep(2 * Math.PI, 24)) {
      const rim = (s) => world(add(add(hub.at, scale(axis, (s * hub.length) / 2)), add(scale(e1, hub.radius * Math.cos(phi)), scale(e2, hub.radius * Math.sin(phi)))));
      const inner = toDisc272(t, rim(-1));
      const outer = toDisc272(t, rim(1));
      assert.ok(Math.abs(inner.a) <= disc272.H + 1e-9, "輪轂的內端埋在盤裡");
      assert.ok(outer.a > disc272.H + 0.1, "輪轂的外端伸出盤的右面");
    }
  }
});

test("第 276 種:凸輪橫跨中心所測的每個方向直徑皆相等,兩滾子始終貼著凸輪,桿往復直線運動", () => {
  for (const t of sweep(2 * Math.PI, 90)) {
    const f = m276.follower(t);
    close(f.right + f.left, m276.SPAN, "兩滾子的距離不變");
  }
  const xs = sweep(2 * Math.PI, 90).map((t) => m276.follower(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.4, "桿往復");
});

test("第 279 種:曲柄轉動,套在曲柄銷上的軸承盒在十字頭的槽裡滑動,十字頭往復直線運動", () => {
  const xs = sweep(2 * Math.PI, 72).map((t) => m279.crosshead(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1.4, "十字頭往復,行程 = 曲柄直徑");
  for (const t of sweep(2 * Math.PI, 12)) {
    const { pin, x } = m279.crosshead(t);
    close(pin[0], x, "軸承盒(曲柄銷)始終在槽的中線上", 1e-12);
  }
});

test("第 280 種:短槓桿外端往上時夾住輪緣、帶動輪轉;往下推時鬆開滑回,棘輪擋住輪不倒轉", () => {
  const { FROM, TO } = m280.geometry;
  const span = TO - FROM;
  const up = m280.capstan(span);
  close(up.wheel, span, "往上那一程輪跟著轉");
  const down = m280.capstan(2 * span);
  close(down.wheel, span, "往下那一程輪不動");
  close(down.block, FROM, "夾具滑回原位");
  const ws = sweep(6 * span, 300).map((v) => m280.capstan(v).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-12), "輪只朝一個方向轉");
  close(span / m280.geometry.pitch, 2, "每程棘輪轉過整兩齒,止回爪落回齒間");
  const pawl = sweep(span, 120).map(m280.pawlAngle);
  assert.ok(Math.max(...pawl) - Math.min(...pawl) > 0.05, "輪轉動時止回爪被齒背頂起、越過齒尖後落下");
  for (const v of sweep(2 * span, 120)) {
    const { pawl: p, teeth } = m280.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(p, t) < 2e-3, `主動量 ${v.toFixed(3)}:止回爪不穿進棘齒`);
  }
});

test("第 281 種:圓盤旋轉,槽內的銷使右側的槓桿擺動(銷始終在槽裡)", () => {
  const angles = sweep(2 * Math.PI, 72).map(m281.lever);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.3, "槓桿擺動");
  close(m281.lever(2 * Math.PI), m281.lever(0), "圓盤一圈一個來回", 1e-12);
});

test("第 282 種:圓盤轉動,直立桿擺動:底部的齒條交替直線運動,頂部的重物交替上下", () => {
  const racks = sweep(2 * Math.PI, 72).map((t) => m282.motion(t).rack);
  const ys = sweep(2 * Math.PI, 72).map((t) => m282.weight(t).y);
  assert.ok(Math.max(...racks) - Math.min(...racks) > 0.3, "齒條來回");
  assert.ok(Math.max(...ys) - Math.min(...ys) > 1, "重物上下");
  close(m282.motion(2 * Math.PI).rack, m282.motion(0).rack, "一圈回到原處", 1e-9);
});

test("第 283 種:手柄擺動,經小齒輪使齒條上下移動;齒條移動量 = 小齒輪節圓上轉過的弧長", () => {
  const a = 0.5;
  close(m283.rack(a) - m283.rack(0), 0.55 * a * Math.sign(m283.rack(a) - m283.rack(0)), "位移 = 節圓半徑 × 轉角", 1e-9);
  assert.ok(m283.rack(-0.5) < m283.rack(0) === m283.rack(0.5) > m283.rack(0), "手柄來回,齒條上下");
  const def = m283.default;
  const y = (v, id) => def.pose(v).parts[id].position[1];
  close(y(0.5, "rackL") - y(0, "rackL"), -(y(0.5, "rack") - y(0, "rack")), "兩側的齒條反向移動同樣的量(兩缸輪流抽氣)");
});

test("第 284 種:曲柄每轉一圈,卡榫推棘輪前進一段,小齒輪帶平台的齒條前進;接點越遠進料越慢", () => {
  const slow = m284.feed(2 * Math.PI, "slow");
  const fast = m284.feed(2 * Math.PI, "fast");
  close(slow.wheel - m284.feed(0, "slow").wheel, slow.step, "一圈前進一段", 1e-9);
  assert.ok(fast.step > slow.step, "接點靠近支點時進料快");
  const ws = sweep(4 * Math.PI, 200).map((t) => m284.feed(t, "slow").wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-9), "棘輪只往前");
  assert.ok(ws.slice(1).some((w, i) => w === ws[i]), "回程時棘輪不動");
  close(m284.feed(4 * Math.PI, "slow").carriage - m284.feed(0, "slow").carriage, -2 * slow.step * 0.42, "平台位移 = 小齒輪轉角 × 節圓半徑", 1e-9);
  // 每程推過幾齒由卡榫與齒相碰算出:進料慢一齒、進料快兩齒
  close(slow.step / m284.geometry.PITCH, 1, "進料慢:每轉一齒");
  close(fast.step / m284.geometry.PITCH, 2, "進料快:每轉兩齒");
  for (const state of ["slow", "fast"])
    for (const t of sweep(2 * Math.PI, 120)) {
      const { catch: c, click, teeth } = m284.contactAt(t, state);
      for (const tooth of teeth) {
        assert.ok(penetrationDepth(c, tooth) < 2e-3, `${state} 曲柄 ${t.toFixed(3)}:卡榫不穿進棘齒`);
        assert.ok(penetrationDepth(click, tooth) < 2e-3, `${state} 曲柄 ${t.toFixed(3)}:止回爪不穿進棘齒`);
      }
    }
  const clicks = sweep(2 * Math.PI, 120).map((t) => m284.feed(t, "slow").clickAngle);
  assert.ok(Math.max(...clicks) - Math.min(...clicks) > 0.05, "棘輪轉動時止回爪被齒背頂起、再落回齒間");
});

test("第 271 種:裝有兩根棘爪的槓桿擺動時,棘齒桿得到近乎連續的直線運動(由接觸算)", () => {
  const S = m271.SWING;
  const xs = sweep(8 * S, 400).map((v) => m271.motion(v).x);
  assert.ok(xs.every((x, i) => i === 0 || x >= xs[i - 1] - 1e-12), "只朝一個方向(往右)");
  // 原文:當使裝有兩根棘爪的槓桿擺動時,會將近乎連續的直線運動賦予棘齒桿
  const one = m271.motion(2 * S).x - m271.motion(0).x;
  const two = m271.motion(4 * S).x - m271.motion(2 * S).x;
  assert.ok(one > 0.1 && two > 0.1, "槓桿往兩個方向擺時都在拉");
  const cycle = m271.motion(4 * S).x - m271.motion(0).x;
  close(cycle / m271.pitch, Math.round(cycle / m271.pitch), "每個來回拉過整數個齒", 1e-6);
  for (const v of sweep(8 * S, 120)) {
    const { hooks, teeth } = m271.contactAt(v);
    for (const h of hooks) for (const t of teeth) assert.ok(penetrationDepth(h, t) < 2e-3, `主動量 ${v.toFixed(3)}:鉤不穿進齒`);
  }
});

test("第 271 種:棘齒桿左端繫的繩繞過滑輪吊著重物,桿往右走多少重物就升多少,繩長不變", () => {
  const def = m271.default;
  const T = m271.STROKE;
  const ropeLength = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
  const p0 = def.pose(0);
  const L0 = ropeLength(p0.paths.rope.points);
  const { RACK, PULLEY } = m271.geometry;
  for (const v of sweep(T, 64)) {
    const p = def.pose(v);
    const shift = p.parts.bar.position[0] - p0.parts.bar.position[0];
    close(shift, m271.motion(v).x, `主動量 ${v.toFixed(3)}:棘齒桿的位移就是棘爪拉出的量`, 1e-9);
    close(p.parts.weight.position[1] - p0.parts.weight.position[1], shift, `主動量 ${v.toFixed(3)}:桿往右多少,重物升多少`, 1e-6);
    close(ropeLength(p.paths.rope.points), L0, `主動量 ${v.toFixed(3)}:繩長不變`, 2e-3);
    const pts = p.paths.rope.points;
    // 繩的一端繫在桿的左端,水平拉到滑輪頂上;另一端從滑輪左側垂下吊著重物
    const eye = [p.parts.bar.position[0] + RACK.eye[0], RACK.eye[1], 0];
    close(Math.hypot(pts[0][0] - eye[0], pts[0][1] - eye[1]), 0, "繩端在桿左端的環上", 1e-9);
    close(pts[1][1], pts[0][1], "桿到滑輪那一段是水平的", 1e-3);
    close(pts[1][0], PULLEY.center[0], "水平段搭在滑輪頂上", 1e-3);
    const last = pts[pts.length - 1];
    close(last[0], PULLEY.center[0] - PULLEY.radius, "垂下的那段從滑輪左側往下", 1e-3);
    assert.ok(last[1] < PULLEY.center[1] - 0.2, "重物吊在滑輪下方");
  }
  // 滑輪被繩帶著轉:繩往右走(桿那一段),滑輪順時針轉,輪緣走過的弧長等於繩走的長度
  const v1 = 3 * m271.SWING;
  close(-def.pose(v1).parts.pulley.angle * PULLEY.rim, m271.motion(v1).x, "滑輪的輪緣跟著繩走", 1e-9);
});

test("第 271 種:桿的行程有限——兩支爪全程都搭在桿的齒上、桿全程平躺在固定的床台上,走完從頭再演", () => {
  const def = m271.default;
  const T = m271.STROKE;
  const { RACK, BED } = m271.geometry;
  for (const v of sweep(T, 120)) {
    const left = def.pose(v).parts.bar.position[0];
    const { hooks } = m271.contactAt(v);
    for (const h of hooks) {
      const xs = h.map((q) => q[0]);
      assert.ok(Math.min(...xs) > left + RACK.firstTooth && Math.max(...xs) < left + RACK.length - 0.1, `主動量 ${v.toFixed(3)}:鉤搭在桿的齒上,不會滑出桿端`);
    }
    // 桿的重心在床台上(不會從床台端翻落),桿底貼著床台頂面
    const mid = left + RACK.length / 2;
    assert.ok(mid > BED.left && mid < BED.right, `主動量 ${v.toFixed(3)}:桿的重心在床台上`);
    assert.ok(left >= BED.left - 1e-9, `主動量 ${v.toFixed(3)}:桿左端沒有伸出床台`);
  }
  close(RACK.bottom, BED.top, "桿底貼在床台頂面");
  // 走完一個行程從頭再演
  for (const v of [0.3, 1.1, 2.0]) {
    const a = def.pose(v).parts;
    const b = def.pose(v + T).parts;
    close(b.bar.position[0], a.bar.position[0], "下一輪的桿從起點再走一次");
    close(b.weight.position[1], a.weight.position[1], "重物也回到下面");
  }
  assert.ok(def.pose(T).parts.bar.position[0] - def.pose(0).parts.bar.position[0] > 1, "行程終點是桿走到最右(不是已經跳回起點)");
});

test("第 271 種:每支爪的鉤和爪身是一件(深度上相接),鉤伸到棘齒那一層", () => {
  const def = m271.default;
  const { RACK } = m271.geometry;
  const pose = def.pose(0).parts;
  for (const id of ["pawlUp", "pawlDown"]) {
    const p = part(def, id);
    const z = pose[id].position[2];
    const body = [z - p.thickness / 2, z + p.thickness / 2];
    const hook = p.pieces[0];
    const hz = [z + hook.at[2] - hook.thickness / 2, z + hook.at[2] + hook.thickness / 2];
    assert.ok(Math.min(body[1], hz[1]) - Math.max(body[0], hz[0]) > 0.02, `${id}:鉤和爪身在深度上重疊`);
    assert.ok(hz[0] <= -RACK.depth / 2 + 1e-9 && hz[1] >= RACK.depth / 2 - 1e-9, `${id}:鉤橫跨整個棘齒的厚度`);
  }
});

test("第 274 種:轉速越快,球 K 沿拋物線臂 B 升得越高,桿 F 把套筒沿心軸往上帶", () => {
  const lo = m274.governor(2);
  const hi = m274.governor(9);
  assert.ok(hi.y > lo.y && hi.x > lo.x, "球(輪 L)往外往上");
  assert.ok(hi.sleeve > lo.sleeve, "套筒上升");
  for (const s of sweep(10, 10)) {
    const g = m274.governor(s);
    close(Math.hypot(g.x - g.contact, g.y - m274.parabola(g.contact)), m274.geometry.WHEEL_R, "輪 L 始終貼著臂 B 的拋物線曲面");
    assert.ok(g.y > m274.parabola(g.x), "輪 L 壓在曲面上面(由拋物線引導)");
  }
});

test("第 275 種:蝸桿的旋轉運動使齒條直線運動,每圈一個螺距", () => {
  close(m275.rack(2 * Math.PI) - m275.rack(0), m275.PITCH, "每圈一個螺距");
});

test("第 285 種:車床可動頭:轉動手輪,螺桿使心軸直線移動", () => {
  close(m285.extend(2 * Math.PI) - m285.extend(0), m285.PITCH, "手輪一圈,心軸移動一個螺距");
  assert.ok(m285.extend(m285.RANGE[1]) > 1, "心軸伸出");
});

test("第 286 種:搖臂軸上的曲面推頂子作用於升降器,把升降桿抬起", () => {
  const [lo, hi] = m286.RANGE;
  close(m286.lift(hi), 0, "推頂子沒轉時升降器停在原位", 1e-9);
  assert.ok(m286.lift(lo) > 0.4, "推頂子轉上來時升降桿被抬起");
  const lifts = sweep(lo, 40, hi).map(m286.lift);
  assert.ok(lifts.every((l, i) => i === 0 || l >= lifts[i - 1] - 1e-9), "轉得越多抬得越高");
});

test("第 287 種:彈簧屈服於球的離心力而抬起套筒;離心力減小時把球拉回心軸,套筒下降", () => {
  const slow = m287.governor(2);
  const fast = m287.governor(9);
  assert.ok(fast.bow > slow.bow, "高速時球離心軸較遠");
  assert.ok(fast.sleeve > slow.sleeve, "高速時套筒較高");
  for (const s of [0, 4, 10]) close(m287.springLength(s), m287.springLength(0), "彈簧長度不變", 1e-6);
});
