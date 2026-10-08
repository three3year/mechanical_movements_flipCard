// 第八章「引擎與調速機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { dist } from "../models/kit.js";
import { feed as feed155, step as step155, stroke as stroke155, advance as advance155, contactAt as contact155 } from "../models/fig155.js";
import { bellCrank as crank156, guides as guides156, slideLength as slide156 } from "../models/fig156.js";
import { bellCrank as crank157, guides as guides157, slideLength as slide157 } from "../models/fig157.js";
import fig158, { treadle as treadle158 } from "../models/fig158.js";
import fig159, { treadle as treadle159, ropeLengthAt } from "../models/fig159.js";
import { penetrationDepth } from "../models/contact.js";
import { lathe as lathe160 } from "../models/fig160.js";
import { oval as oval172 } from "../models/fig172.js";
import fig173, { traverse as traverse173, tappetContact as tappet173, tappetTeeth as teeth173 } from "../models/fig173.js";
import { clamp as clamp174, nose as nose174, grip as grip174 } from "../models/fig174.js";
import { slotting as slotting178, crankLength as crankLength178 } from "../models/fig178.js";
import { clamp as clamp180, nose as nose180, grip as grip180 } from "../models/fig180.js";
import { screwClamp as clamp190 } from "../models/fig190.js";
import { rot2 } from "../models/kit.js";
import { coupling, ARM as ARM176, INSERT as INSERT176, GROOVE as GROOVE176, WRIST as WRIST176 } from "../models/uncoupling.js";
import { cornish, crossing, valves, ANGLES as CORNISH, TAPPET, SPAN as SPAN181 } from "../models/cornish-gear.js";
import { quadrantOutlines } from "../models/cornish-model.js";
import { catchState, catchOutlines, TIP as CATCH_TIP } from "../models/diagonal-catch.js";
import { polygonsOverlap, pointInPolygon, edgeDistance } from "../models/contact.js";
import fig181 from "../models/fig181.js";
import * as gab186 from "../models/fig186.js";
import * as gab187 from "../models/fig187.js";
import * as gab188 from "../models/fig188.js";
import * as gab189 from "../models/fig189.js";
import { onRod } from "../models/gab.js";
import fig182 from "../models/fig182.js";

const TAU = 2 * Math.PI;

test("第 155 種:往復的桿經肘節槓桿上的棘爪使齒輪間歇轉動;棘爪換邊時齒輪反向", () => {
  const cw = sweep(stroke155 * 6, 600).map((v) => feed155(v, 1).gear);
  for (let i = 1; i < cw.length; i++) assert.ok(cw[i] <= cw[i - 1] + 1e-9, "單向");
  close(feed155(stroke155 * 2, 1).gear - feed155(0, 1).gear, advance155(1), "每次往復推進的量固定");
  assert.ok(advance155(1) < -step155 / 2, "棘爪在右側:齒輪順時針轉,每個來回至少一齒");
  close(advance155(-1), -advance155(1), "換邊後反向、推進量相同", 1e-9);
});

test("第 155 種:棘爪只在推程推齒輪,回程時滑過齒背、齒輪停住;爪與齒不互相穿入,落進齒間時不是瞬移", () => {
  // 原文:往復直線運動轉換為間歇性的圓周運動
  for (const side of [1, -1]) {
    const back = side > 0 ? [stroke155 * 3, stroke155 * 4] : [stroke155 * 2, stroke155 * 3]; // 回程
    close(feed155(back[1], side).gear, feed155(back[0], side).gear, "回程齒輪不動", 1e-9);
    for (const v of sweep(stroke155 * 4, 400)) {
      const { pawl, gear } = contact155(v, side);
      for (const tooth of gear) assert.ok(penetrationDepth(pawl, tooth) < 0.01, `主動量 ${v.toFixed(3)} 棘爪穿入齒輪`);
    }
    // 播放時每秒 30 格、一程 1.2 秒:棘爪每格轉不到 0.15 弧度
    const frames = sweep(stroke155 * 4, 144).map((v) => feed155(v, side).pawl);
    for (let i = 1; i < frames.length; i++) assert.ok(Math.abs(frames[i] - frames[i - 1]) < 0.15, "棘爪落下有過程");
  }
});

test("第 156 種:圓盤上的曲柄銷在曲柄搖臂的溝槽內作動,搖臂來回擺動(變速的交替運動)", () => {
  const ys = sweep(TAU, 360).map((t) => crank156(t).end[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.3);
  close(ys[0], ys[ys.length - 1], "一圈回到原處", 1e-9);
});

test("第 156、157 種:搖臂端沿圓弧擺,經短連桿帶動的直桿走直線,始終穿過兩個導套", () => {
  for (const [crank, guides, length] of [[crank156, guides156, slide156], [crank157, guides157, slide157]]) {
    for (const t of sweep(TAU, 72)) {
      const top = crank(t).slide;
      assert.ok(top > guides[0] + 0.1 && top - length < guides[1] - 0.1, `轉角 ${t.toFixed(2)} 直桿離開導套`);
    }
  }
});

test("第 157 種:以連桿取代溝槽,曲柄搖臂同樣來回擺動,連桿長度不變", () => {
  const ref = crank157(0);
  for (const t of sweep(TAU, 36)) {
    const { pin, top } = crank157(t);
    close(dist(pin, top), dist(ref.pin, ref.top), "連桿長度", 1e-9);
  }
});

// 往復件當主動件:一程(driver.cycle)走完,往復件從一端到另一端,轉動的零件轉半圈
function reciprocates(def, reciprocator, rotor, msg) {
  const span = def.driver.cycle[1] - def.driver.cycle[0];
  const at = (v) => def.pose(v).parts;
  const ends = sweep(4 * span, 400).map((v) => at(v)[reciprocator].angle ?? at(v)[reciprocator].position[1]);
  let turns = 0;
  for (let i = 2; i < ends.length; i++) if ((ends[i] - ends[i - 1]) * (ends[i - 1] - ends[i - 2]) < 0) turns++;
  assert.ok(turns >= 3 && turns <= 5, `${msg}:四程之內往復件折返 ${turns} 次`);
  const angles = sweep(4 * span, 400).map((v) => at(v)[rotor].angle);
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] >= angles[i - 1] - 1e-9, `${msg}:只朝一個方向轉`);
  close(angles[angles.length - 1] - angles[0], 2 * TAU, `${msg}:往返兩次轉兩圈`, 1e-6);
}

test("第 158、159 種:原文是踏板帶動圓盤——主動件是踏板,踏板踩下、抬起一次,圓盤朝同一方向轉一圈", () => {
  for (const def of [fig158, fig159]) {
    assert.equal(def.driver.part, "treadle");
    assert.equal(def.target, "disc");
    reciprocates(def, "treadle", "disc", `第 ${def.figure} 種`);
  }
});

test("第 158 種:踏板往復擺動,經連桿使圓盤連續轉動(連桿長度不變)", () => {
  const ref = treadle158(0);
  const angles = sweep(TAU, 180).map((t) => treadle158(t).angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.2, "踏板擺動");
  for (const t of sweep(TAU, 36)) {
    const { pin, j } = treadle158(t);
    close(dist(pin, j), dist(ref.pin, ref.j), "連桿長度", 1e-9);
  }
});

test("第 159 種:以繩與滑輪取代連桿,繩長不變", () => {
  for (const t of sweep(TAU, 36)) close(ropeLengthAt(t), ropeLengthAt(0), `轉角 ${t}`, 1e-9);
  const ps = sweep(TAU, 180).map((t) => treadle159(t).psi);
  assert.ok(Math.max(...ps) - Math.min(...ps) > 0.2, "踏板擺動");
});

test("第 160 種:踩下踏板,繞在皮帶輪上的帶子使它轉動;放開時竿把踏板抬起,皮帶輪反轉", () => {
  const down = lathe160(-0.1);
  const up = lathe160(0.1);
  assert.ok(down.pull > up.pull, "踩下時帶子被拉下");
  assert.ok((down.pulley - lathe160(0).pulley) * (up.pulley - lathe160(0).pulley) < 0, "來回時轉向相反");
  close(down.pulley - lathe160(0).pulley, -(down.pull - lathe160(0).pull) / 0.55, "轉過的弧長 = 帶子被拉下的長度");
});

import fig161, { governor as gov161 } from "../models/fig161.js";
import fig162, { regulator as reg162, pinY as pin162, studs as studs162, gateOpening as opening162, spindleAngle as spindle162 } from "../models/fig162.js";
import fig163, { regulator as reg163, pulleys as pulleys163, gateOpening as opening163, spindleAngle as spindle163 } from "../models/fig163.js";
import { governor as gov170 } from "../models/fig170.js";

test("第 161 種:引擎速度增加,球向外飛出,把底部的滑塊抬升;速度降低時相反", () => {
  const s = sweep(10, 40).map((v) => gov161(v));
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].alpha >= s[i - 1].alpha - 1e-12, "轉速越大張角越大");
    assert.ok(s[i].sleeve >= s[i - 1].sleeve - 1e-12, "滑塊越高");
  }
  assert.ok(gov161(10).sleeve > gov161(0).sleeve + 0.2);
  assert.ok(gov161(3).alpha > gov161(0).alpha + 0.01, "滑桿的低段就有反應(不照真實圓錐擺的窄區間算)");
  assert.equal(fig161.driver.label, "轉速");
});

test("第 162、163 種:閘門隨速度起伏升降,一輪之後回到原處;心軸一輪恰好轉 12 圈、過快時轉得快", () => {
  for (const [def, opening, spindle] of [[fig162, opening162, spindle162], [fig163, opening163, spindle163]]) {
    const P = def.driver.range[1];
    const hs = sweep(P, 480).map(opening);
    assert.ok(Math.max(...hs) - Math.min(...hs) > 0.25 && Math.max(...hs) - Math.min(...hs) < 0.6, `圖 ${def.figure}:閘門的行程看得出來、不超出閘板`);
    close(opening(P), opening(0), `圖 ${def.figure}:一輪之後閘門回到原處`, 5e-3); // 第 163 種以二分平衡,殘差不到一個取樣步
    assert.ok(opening(P * 0.3) > opening(0) + 0.2, `圖 ${def.figure}:過快時閘門抬起`);
    close(spindle(P), 2 * Math.PI * P, `圖 ${def.figure}:一輪恰好轉 ${P} 圈`, 1e-9);
    assert.ok(spindle(P * 0.3) - spindle(P * 0.2) > spindle(P * 0.8) - spindle(P * 0.7), `圖 ${def.figure}:過快時心軸轉得比過慢時快`);
    assert.equal(def.target, "gate", `圖 ${def.figure}:目標件是閘門`);
  }
});

test("第 162 種:速度正常時兩個斜齒輪靜止;過快時銷帶動上齒輪、過慢時帶動下齒輪,下方水平軸朝相反方向轉", () => {
  assert.equal(fig162.states, undefined, "速度的起伏在播放時自己呈現,不靠狀態按鈕");
  const P = fig162.driver.range[1];
  const states = sweep(P, 480).map((p) => reg162(p).state);
  // 原文的順序:正常 → 過快 → 正常 → 過慢 → 正常
  const order = states.filter((st, i) => i === 0 || st !== states[i - 1]);
  assert.deepEqual(order, ["normal", "fast", "normal", "slow", "normal"]);
  const gateIn = (st) => {
    const ps = sweep(P, 480).filter((p) => reg162(p).state === st);
    return reg162(ps[ps.length - 1]).gate - reg162(ps[0]).gate;
  };
  assert.ok(gateIn("fast") < -1 && gateIn("slow") > 1, "過快、過慢時水平軸各轉好幾圈,方向相反");
  const normal = sweep(P, 480).filter((p) => reg162(p).state === "normal");
  for (let i = 1; i < normal.length; i++) if (normal[i] - normal[i - 1] < 0.1) close(reg162(normal[i]).upper, reg162(normal[i - 1]).upper, "正常時兩齒輪靜止", 1e-9);
  for (const p of sweep(P, 480)) close(reg162(p).lower, -reg162(p).upper, "兩個鬆套的齒輪同咬水平軸的齒輪,轉向相反", 1e-12);
});

test("第 162 種:銷只在升到凸柱那一層時才推動齒輪,推著時兩者相碰不穿入", () => {
  const P = fig162.driver.range[1];
  for (const p of sweep(P, 2400)) {
    const r = reg162(p);
    if (r.state !== "fast") continue;
    // 上齒輪的凸柱在局部角 0、半徑 studs.radius:銷(在心軸轉角處)不會轉進凸柱裡
    const ahead = (((r.upper - r.spindle) % TAU) + TAU) % TAU;
    assert.ok(ahead > (0.04 + studs162.half) / studs162.radius - 0.05, `進程 ${p.toFixed(2)} 銷穿進凸柱`);
  }
  assert.ok(pin162(0) + 0.04 < studs162.upperBottom && pin162(0) - 0.04 > studs162.lowerTop, "正常時銷在兩個凸柱之間");
});

test("第 163 種:皮帶在鬆動輪上時不傳動;過快時撥到下輪、過慢時撥到上輪,閘門軸轉向相反", () => {
  assert.equal(fig163.states, undefined, "速度的起伏在播放時自己呈現,不靠狀態按鈕");
  const P = fig163.driver.range[1];
  const ps = sweep(P, 960);
  const ons = ps.map((p) => reg163(p).on).filter(Boolean);
  const order = ons.filter((o, i) => i === 0 || o !== ons[i - 1]);
  assert.deepEqual(order, ["middle", "lower", "middle", "upper", "middle"], "原文:正常在鬆動輪,過快移到下輪,過慢移到上輪");
  const span = (on) => {
    const at = ps.filter((p) => reg163(p).on === on);
    return reg163(at[at.length - 1]).gate - reg163(at[0]).gate;
  };
  for (let i = 1; i < ps.length; i++) {
    const [a, b] = [reg163(ps[i - 1]), reg163(ps[i])];
    if (a.on === "middle" && b.on === "middle") close(b.gate, a.gate, "鬆動輪上不傳動", 1e-9);
  }
  assert.ok(span("lower") > 1 && span("upper") < -1, "上下兩輪帶動閘門軸的方向相反");
  for (const p of ps) {
    const r = reg163(p);
    if (r.on === "lower") close(r.y, pulleys163.lower, "皮帶整個在下輪上", 0.05);
  }
});

test("第 170 種:交叉的搖臂隨轉速張開,經短連桿移動閥桿", () => {
  const rods = sweep(10, 20, 7).map((v) => gov170(v).rod);
  assert.ok(Math.abs(rods[rods.length - 1] - rods[0]) > 0.05, "閥桿隨轉速移動");
  for (let i = 1; i < rods.length; i++) assert.ok(rods[i] <= rods[i - 1] + 1e-12, "單調");
  assert.ok(gov170(3).alpha > gov170(0).alpha + 0.01, "滑桿的低段就有反應");
});

import fig164, { knee } from "../models/fig164.js";
import { rocker, wave } from "../models/fig165.js";
import { moldX, pinDistance, slot as slot166 } from "../models/fig166.js";
import fig167, { rodY as rod167, stroke as stroke167 } from "../models/fig167.js";
import fig168, { mainCrank as main168 } from "../models/fig168.js";
import fig169, { mainCrank as main169, sizes as sizes169 } from "../models/fig169.js";

test("第 164 種:膝節槓桿——抬起長柄,撐桿越接近直立、壓塊越往下,越接近伸直時每單位轉角的下移越小(力越大)", () => {
  const [lo, hi] = fig164.driver.range;
  const ys = sweep(hi, 30, lo).map((p) => knee(p).y);
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] <= ys[i - 1] + 1e-12, "抬起長柄時壓塊往下");
  assert.ok(Math.abs(ys[ys.length - 1] - ys[ys.length - 2]) < Math.abs(ys[1] - ys[0]), "接近伸直時下移變慢");
});

test("第 165 種:直立軸上的波狀輪經搖動桿使直立桿上下直線運動(每圈六次)", () => {
  const rods = sweep(TAU + 0.05, 720, 0.05).map((t) => rocker(t).rod);
  let turns = 0;
  for (let i = 2; i < rods.length; i++) if ((rods[i] - rods[i - 1]) * (rods[i - 1] - rods[i - 2]) < 0) turns++;
  assert.equal(turns, 12, "六次往返");
  assert.ok(Number.isFinite(wave(0)));
});

test("第 166 種:連桿的長孔讓模具在每一程的盡頭停住一會兒,銷始終在長孔兩端之間", () => {
  const xs = sweep(TAU, 720).map(moldX);
  let still = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - xs[i - 1]) < 1e-12) still++;
  assert.ok(still > 60, "有停住的時段");
  for (const t of sweep(TAU * 2, 60)) {
    const d = pinDistance(t);
    assert.ok(d >= slot166.near - 1e-9 && d <= slot166.far + 1e-9, "銷在長孔內");
  }
  close(moldX(0), moldX(TAU), "每圈重複", 1e-9);
});

test("第 167 種:鼓輪的無端螺旋溝使桿往復一次、鼓輪轉一圈", () => {
  const ys = sweep(TAU, 720).map(rod167);
  close(Math.max(...ys) - Math.min(...ys), stroke167, "行程", 1e-6);
  close(rod167(0), rod167(TAU), "一圈回到原處", 1e-9);
});

test("第 167 種:原文的輸入是往復的桿——主動件是桿、目標件是鼓輪;桿往返一次,鼓輪朝同一方向轉一圈", () => {
  assert.equal(fig167.driver.part, "rod");
  assert.equal(fig167.target, "drum");
  reciprocates(fig167, "rod", "drum", "第 167 種");
  for (const v of sweep(TAU, 40)) close(fig167.pose(v).parts.rod.position[1], rod167(fig167.pose(v).parts.drum.angle), "凸柱始終在溝裡", 1e-9);
});

test("第 168、169 種:原文的輸入是往復動力——主動件是擺動的搖桿,搖桿往返一次,主曲柄轉一圈", () => {
  for (const def of [fig168, fig169]) {
    assert.equal(def.driver.part, "rod");
    assert.equal(def.target, "main");
    let turn = 0;
    const as = sweep(TAU, 720).map((v) => def.pose(v).parts.main.angle);
    for (let i = 1; i < as.length; i++) turn += ((as[i] - as[i - 1] + 3 * Math.PI) % TAU) - Math.PI;
    close(Math.abs(turn), TAU, `第 ${def.figure} 種主曲柄轉一圈`, 1e-6);
    const swings = sweep(TAU, 360).map((v) => def.pose(v).parts.rod.angle);
    let turns = 0;
    for (let i = 2; i < swings.length; i++) if ((swings[i] - swings[i - 1]) * (swings[i - 1] - swings[i - 2]) < 0) turns++;
    assert.ok(turns >= 1 && turns <= 2, "搖桿往返一次");
  }
});

test("第 168 種:抽送桿末端的銷走橢圓形的軌跡,主曲柄轉一圈,曲柄長(銷在溝槽中的位置)隨之改變", () => {
  const lens = sweep(TAU, 360).map((p) => main168(p).length);
  assert.ok(Math.max(...lens) - Math.min(...lens) > 0.2, "曲柄長改變");
  let turn = 0;
  const as = sweep(TAU, 360).map((p) => main168(p).angle);
  for (let i = 1; i < as.length; i++) turn += ((as[i] - as[i - 1] + 3 * Math.PI) % TAU) - Math.PI;
  close(Math.abs(turn), TAU, "主曲柄轉一圈", 1e-6);
});

test("第 169 種:以短連桿取代溝槽,主曲柄半徑固定、轉一圈", () => {
  for (const p of sweep(TAU, 36)) {
    const { p: e, q } = main169(p);
    close(dist(e, q), sizes169.LINK, "連桿長度", 1e-9);
  }
});

import { valveGear as valve171 } from "../models/fig171.js";
import fig175, { stroke as stroke175 } from "../models/fig175.js";
import { reverser } from "../models/fig179.js";
import { gear as gear185 } from "../models/fig185.js";

const travel = (fn, n = 360) => {
  const xs = sweep(TAU, n).map(fn);
  return Math.max(...xs) - Math.min(...xs);
};

test("第 185 種:滑塊在連桿一端得到偏心輪的全部行程;在中間時閥門(幾乎)靜止;在兩者之間只得到部分行程", () => {
  const full = travel((t) => gear185(t, "forward").valve);
  const part = travel((t) => gear185(t, "cutoff").valve);
  const mid = travel((t) => gear185(t, "mid").valve);
  assert.ok(full > part && part > mid, "全程 > 膨脹 > 中位");
  assert.ok(mid < full * 0.2, "中位時閥門幾乎不動");
  // 前進與後退:閥門的動作相位相反(由兩個不同的偏心輪帶動)
  const f = gear185(0.4, "forward").valve - gear185(0, "forward").valve;
  const b = gear185(0.4, "backward").valve - gear185(0, "backward").valve;
  assert.ok(f * b < 0, "前進與後退時閥門反向");
});

test("第 171 種:連桿運動帶動閥桿,經曲面滑塊與搖臂軸傳給閥門;中位時幾乎不動", () => {
  const fwd = travel((t) => valve171(t, "forward").armAngle);
  const mid = travel((t) => valve171(t, "mid").armAngle);
  assert.ok(fwd > 0.05 && mid < fwd * 0.2);
});

test("第 175 種:原文是活塞帶動曲柄——主動件是長槽中的銷(活塞)、目標件是曲柄;活塞往返一次曲柄轉一圈", () => {
  assert.equal(fig175.driver.part, "slider");
  assert.equal(fig175.target, "crank");
  reciprocates(fig175, "slider", "crank", "第 175 種");
});

test("第 175 種:曲柄轉一圈,長槽中的銷往返一次", () => {
  const ys = sweep(TAU, 720).map((t) => stroke175(t).y);
  let turns = 0;
  for (let i = 2; i < ys.length; i++) if ((ys[i] - ys[i - 1]) * (ys[i - 1] - ys[i - 2]) < 0) turns++;
  assert.ok(turns <= 2, "一圈內只往返一次");
  close(ys[0], ys[ys.length - 1], "回到原處", 1e-9);
});

test("第 179 種:偏心輪相對軸轉半圈,閥門的動作反向(引擎因此反轉)", () => {
  for (const t of sweep(TAU, 12)) {
    const a = reverser(t, "forward").valveX - reverser(0, "forward").valveX;
    const b = reverser(t, "backward").valveX - reverser(0, "backward").valveX;
    close(a, -b, `轉角 ${t}`, 0.04); // 偏心桿的斜度造成少許不對稱
  }
});

test("第 172 種:連桿上的一點畫出蛋形的橢圓(一頭大、一頭小)", () => {
  const pts = sweep(TAU, 720).map((t) => oval172(t).point);
  close(dist(pts[0], pts[pts.length - 1]), 0, "一圈畫出封閉曲線", 1e-9);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  assert.ok(Math.max(...ys) - Math.min(...ys) < x1 - x0, "橢圓:寬大於高");
  // 蛋形:在左右兩端各 1/4 寬處量高度,兩頭不一樣大
  const heightAt = (x) => {
    const near = pts.filter((p) => Math.abs(p[0] - x) < 0.03).map((p) => p[1]);
    return Math.max(...near) - Math.min(...near);
  };
  const left = heightAt(x0 + (x1 - x0) / 4);
  const right = heightAt(x1 - (x1 - x0) / 4);
  assert.ok(Math.abs(left - right) > 0.03, `兩頭大小不同(${left.toFixed(3)} vs ${right.toFixed(3)})`);
});

test("第 173 種:圓盤每轉一圈,撥爪輪被撥一次、螺帽移動,導桿的行程跟著改變", () => {
  for (let k = -5; k < 3; k++) {
    const a = traverse173(k * TAU + 1);
    const b = traverse173((k + 1) * TAU + 1);
    close(b.screw - a.screw, TAU / teeth173, "固定銷每圈把撥爪輪撥過一齒(由接觸算)", 1e-3);
    assert.ok(b.stroke < a.stroke, "行程逐圈縮短");
    close(a.stroke - b.stroke, 0.2, "每圈變化相同的量", 1e-3);
  }
  // 一圈之中撥爪輪只在經過固定銷時轉動,其餘時間行程不變
  const stroke = sweep(TAU, 360, 0.01).map((t) => traverse173(t).stroke);
  assert.ok(stroke.filter((v) => Math.abs(v - stroke[0]) > 1e-9).length < 360 * 0.06);
  // 導桿(T 形桿)的位移就是手腕銷的 x:一圈內往返一次,幅度等於行程
  const xs = sweep(TAU, 720, 0.3).map((t) => traverse173(t).x);
  close(Math.max(...xs) - Math.min(...xs), traverse173(0.3).stroke, "幅度 = 行程", 0.01);
  // 撥爪輪的齒與固定銷不互相穿入;撥爪輪只在銷碰到齒時才轉
  for (const t of sweep(TAU, 1440, -TAU)) {
    const { pin, wheel } = tappet173(t);
    if (pin) assert.ok(penetrationDepth(pin, wheel) < 0.01, `轉角 ${t.toFixed(3)} 銷穿進撥爪輪`);
  }
  // 圓盤背面的傘齒輪由右上方的小齒輪帶動:齒數比 2,小齒輪繞自己的軸(朝圓盤中心)正轉
  const pinion = (t) => fig173.pose(t).parts.pinion.angle;
  close(pinion(0.3) - pinion(0), 0.6, "小齒輪轉圓盤的 2 倍", 1e-9);
});

const noseAt = (local, pivot, angle) => {
  const [x, y] = rot2(local, angle);
  return [x + pivot[0], y + pivot[1]];
};

test("第 174 種:把木料推入兩夾爪之間,夾爪繞螺絲轉、夾緊木料兩側", () => {
  const PIVOT = 1.2;
  const out = clamp174(0);
  const inn = clamp174(1);
  assert.ok(inn.end < out.end, "木料往左推進");
  assert.ok(inn.angle < out.angle, "上夾爪順時針轉(下夾爪對稱)");
  close(noseAt(nose174, [0, PIVOT], inn.angle)[1], grip174.HALF, "推到底時上鉤貼著木料上緣", 0.01);
  assert.ok(noseAt(nose174, [0, PIVOT], out.angle)[1] > grip174.HALF + 0.2, "木料抽出時夾爪張開");
  // 木料還沒頂到夾爪尾端時,夾爪不動(頂到的位置由夾爪外形決定)
  close(clamp174(0.05).angle, out.angle);
});

test("第 178 種:滑塊由偏心的圓形溝槽引導,接近底部時曲柄變短,連桿的速度降低", () => {
  close(crankLength178(Math.PI / 2), 2.1 + 0.92, "頂部最長");
  close(crankLength178(-Math.PI / 2), 2.1 - 0.92, "底部最短");
  // 曲柄以等速轉動時,刀具滑塊的速度:曲柄在上方時快、在下方時慢
  const speed = (t) => Math.abs(slotting178(t + 1e-4).slide[0] - slotting178(t - 1e-4).slide[0]) / 2e-4;
  const top = Math.max(...sweep(0.3, 30, -0.3).map(speed));
  const bottom = Math.max(...sweep(Math.PI + 0.3, 30, Math.PI - 0.3).map(speed));
  assert.ok(bottom < top * 0.6, `底部 ${bottom.toFixed(2)} < 頂部 ${top.toFixed(2)}`);
});

test("第 180 種:單一夾爪與固定側板:推入木料,夾爪轉動把木料壓向側板", () => {
  const out = clamp180(0);
  const inn = clamp180(1);
  assert.ok(inn.top > out.top, "木料往上推");
  assert.ok(inn.angle < out.angle, "夾爪順時針轉");
  close(noseAt(nose180, [0, 0], inn.angle)[0], grip180.BOARD.x[1], "推到底時鉤貼著木料", 0.01);
  assert.ok(noseAt(nose180, [0, 0], out.angle)[0] > grip180.BOARD.x[1] + 0.2, "木料退出時夾爪張開");
});

test("第 190 種:轉動手柄,螺桿往上頂住槓桿,支點另一側的壓腳夾住木塊", () => {
  const tight = clamp190(0);
  const loose = clamp190(-TAU * 2);
  assert.ok(tight.rise > loose.rise, "旋緊時螺桿上升");
  assert.ok(tight.lift < loose.lift, "壓腳隨之下降");
  close(tight.foot[1] - 0.45, -0.45, "旋緊時壓腳底面貼著木塊頂面", 1e-9);
  assert.ok(tight.foot[0] < 0, "壓腳在支點另一側(左),螺桿在右");
});

test("第 176、177 種:溝槽在第 176 種位置時手腕帶動曲柄;轉到第 177 種位置時手腕穿過溝槽、曲柄不動", () => {
  for (const t of sweep(TAU, 36)) {
    const c = coupling(t, "coupled");
    close(c.arm, t, "接上:曲柄隨手腕轉");
    close(dist(c.wrist, c.eye), 0, "手腕卡在環中心的溝槽裡", 1e-9);
    assert.equal(coupling(t, "uncoupled").arm, 0, "脫開:曲柄不動");
  }
  // 脫開時,手腕經過環的那段路都在溝槽裡(溝槽沿手腕的路徑方向)
  const inside = sweep(TAU, 3600).map((t) => coupling(t, "uncoupled")).filter((c) => dist(c.wrist, c.eye) < INSERT176);
  assert.ok(inside.length > 0);
  for (const c of inside) assert.ok(Math.abs(c.wrist[1] - ARM176) + WRIST176 <= GROOVE176, "手腕在溝槽內");
});

const cornishSamples = sweep(2 * SPAN181, 1200);

for (const [figs, state] of [["181、182", catchState], ["183、184", cornish]]) {
  test(`第 ${figs} 種:活塞上升時撥爪抬起下方手柄並被卡住,上方手柄同時被放開;下降時撥爪把上方手柄壓回`, () => {
    const start = state(0);
    close(start.lower, CORNISH.lower.A);
    close(start.upper, CORNISH.upper.A);
    assert.deepEqual(valves(start).map((r) => r.value), ["關", "開", "上升"], `第 ${figs} 種(A 位置):下方蒸汽閥與上方排氣閥開,活塞上升`);
    const top = state(SPAN181);
    close(top.lower, CORNISH.lower.B);
    close(top.upper, CORNISH.upper.B);
    assert.deepEqual(valves(top).map((r) => r.value).slice(0, 2), ["開", "關"], `第 ${figs} 種(B 位置):上方蒸汽閥與下方排氣閥開`);
    // 一整個往返回到第 181 種的位置
    const back = state(2 * SPAN181 - 1e-9);
    close(back.lower, CORNISH.lower.A, "下方手柄落回", 1e-6);
    close(back.upper, CORNISH.upper.A, "上方手柄被壓回", 1e-6);
  });
}

test("第 183、184 種:上升途中下方手柄先被抬到頭,上方手柄才放開", () => {
  let lowerDoneAt = null;
  let upperMovedAt = null;
  for (const v of cornishSamples.filter((v) => v <= SPAN181)) {
    const s = cornish(v);
    if (lowerDoneAt === null && Math.abs(s.lower - CORNISH.lower.B) < 1e-9) lowerDoneAt = v;
    if (upperMovedAt === null && Math.abs(s.upper - CORNISH.upper.A) > 1e-9) upperMovedAt = v;
  }
  assert.ok(lowerDoneAt !== null && upperMovedAt !== null && lowerDoneAt <= upperMovedAt);
  // 兩張圖是同一機構的兩個時刻
  assert.equal(fig181.driver.initial, 0);
  assert.equal(fig182.driver.initial, SPAN181);
});

test("第 181、182 種:卡榫的指頭只靠在凸輪上、從不碰進去;A 位置鎖住上方手柄、B 位置鎖住下方手柄", () => {
  const into = (tip, cam) => pointInPolygon(tip, cam) || edgeDistance(tip, cam) < CATCH_TIP - 1e-6;
  const overlaps = (s) => {
    const o = catchOutlines(s);
    return into(o.tips.upper, o.cams.upper) || into(o.tips.lower, o.cams.lower);
  };
  for (const v of cornishSamples) assert.ok(!overlaps(catchState(v)), `v = ${v.toFixed(3)}`);
  const turn = 0.01;
  // A:上方手柄被配重往順時針拉——卡榫不動時上方指頭擋著它;卡榫要讓開(逆時針)得把下方指頭壓進下凸輪
  const a = catchState(0);
  assert.ok(overlaps({ ...a, upper: a.upper - turn }), "A:上方手柄轉不過去");
  assert.ok(overlaps({ ...a, phi: a.phi + turn }), "A:卡榫被下凸輪的圓弧擋住");
  assert.ok(!overlaps({ ...a, lower: a.lower - turn }), "A:下方手柄可以被抬起(指頭沿圓弧滑)");
  // B:下方手柄靠自重往逆時針落——下方指頭擋著它;卡榫要讓開(順時針)得把上方指頭壓進上凸輪
  const b = catchState(SPAN181);
  assert.ok(overlaps({ ...b, lower: b.lower + turn }), "B:下方手柄落不下去");
  assert.ok(overlaps({ ...b, phi: b.phi - turn }), "B:卡榫被上凸輪的圓弧擋住");
  assert.ok(!overlaps({ ...b, upper: b.upper + turn }), "B:上方手柄可以被壓回(指頭沿圓弧滑)");
});

test("第 181、182 種:下方手柄被抬到頭、與卡榫嚙合的同時,上方手柄脫離卡榫甩出;下降時反過來", () => {
  const follow = (9 * Math.PI) / 180; // 被放開之前,手柄只跟著卡榫的斜面轉一小段(約 8.6°)
  let released = null;
  for (const v of cornishSamples.filter((v) => v <= SPAN181)) {
    const s = catchState(v);
    const lowerDone = Math.abs(s.lower - CORNISH.lower.B) < 1e-9;
    if (!lowerDone) assert.ok(CORNISH.upper.A - s.upper < follow, `v = ${v.toFixed(3)}:下方手柄還沒抬到頭,上方手柄仍被卡住`);
    if (released === null && CORNISH.upper.A - s.upper >= follow) released = v;
  }
  assert.ok(released !== null, "上方手柄被配重拉起");
  for (const v of cornishSamples.filter((v) => v > SPAN181)) {
    const s = catchState(v);
    const upperDone = Math.abs(s.upper - CORNISH.upper.A) < 1e-9;
    if (!upperDone) assert.ok(s.lower - CORNISH.lower.B < follow, `v = ${v.toFixed(3)}:上方手柄還沒壓回,下方手柄仍被卡住`);
  }
  // 卡榫只在交接時擺動:兩個位置之間的轉角約 7°
  const turned = catchState(SPAN181).phi - catchState(0).phi;
  assert.ok(turned > 0.05 && turned < 0.2, `卡榫逆時針擺 ${turned}`);
});

test("第 181–184 種:撥爪只在推手柄時碰到手柄,從不穿過手柄", () => {
  for (const v of cornishSamples) for (const s of [catchState(v), cornish(v)]) {
    for (const which of ["upper", "lower"]) {
      const c = crossing(which, s[which]);
      if (c === null) continue;
      assert.ok(!(c > s.y - TAPPET.half + 1e-6 && c < s.y + TAPPET.half - 1e-6), `v = ${v.toFixed(3)} ${which}`);
    }
  }
});

test("第 183、184 種:兩個象限器輪流以圓弧擋住對方的一角,彼此不穿透", () => {
  const shrink = (poly) => {
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    return poly.map(([x, y]) => [cx + (x - cx) * 0.99, cy + (y - cy) * 0.99]);
  };
  for (const v of cornishSamples) {
    const q = quadrantOutlines(cornish(v));
    assert.ok(!polygonsOverlap(shrink(q.upper), shrink(q.lower)), `v = ${v.toFixed(3)}`);
  }
  // A 位置:上方象限器若再順時針轉(放開的方向)就會撞上下方象限器——被鎖住
  const a = cornish(0);
  const blocked = quadrantOutlines({ ...a, upper: a.upper - 0.08 });
  assert.ok(polygonsOverlap(blocked.upper, blocked.lower), "A:上方被擋住");
  // B 位置:下方象限器若逆時針落回就會撞上上方象限器
  const b = cornish(SPAN181);
  const held = quadrantOutlines({ ...b, lower: b.lower + 0.08 });
  assert.ok(polygonsOverlap(held.upper, held.lower), "B:下方被擋住");
});

test("第 186–189 種:扳動手柄(或槓桿)把偏心桿端抬起,銷從鉤口中脫出", () => {
  for (const [fig, m, sign] of [[186, gab186, 1], [187, gab187, 1], [188, gab188, -1], [189, gab189, 1]]) {
    assert.equal(m.unhook(0).released, false, `第 ${fig} 種:原圖位置銷在鉤口中`);
    close(m.unhook(0).lift, 0, `第 ${fig} 種`, 1e-9);
    const lifts = sweep(sign * m.max, 60).map((p) => m.unhook(p).lift);
    for (let i = 1; i < lifts.length; i++) assert.ok(lifts[i] > lifts[i - 1], `第 ${fig} 種:扳得越多桿端抬得越高`);
    assert.equal(m.unhook(sign * m.max).released, true, `第 ${fig} 種:扳到頭(卡進凹槽)時銷已脫出`);
  }
  // 第 186、187 種:「將下方的彈簧手柄向上拉……該銷便會從偏心桿的鉤口中脫離」——桿端是被手柄的指頭(趾頭)頂著搖臂的
  // 凸柱抬起的,抬起的量由兩者的外形相碰算(維護者 2026-10-08 決定)
  for (const [fig, m] of [[186, gab186], [187, gab187]]) {
    for (const p of sweep(m.max, 40).slice(1)) {
      const { handle, stud } = m.contact(p);
      const depth = Math.max(...handle.map((h) => penetrationDepth(h, stud)));
      assert.ok(depth < 1e-3, `第 ${fig} 種:手柄不壓進凸柱(${depth.toFixed(4)})`);
      // 真的頂著:桿端少抬一點,手柄就會壓進凸柱
      const lower = handle.map((h) => h.map(([x, y]) => [x, y - 0.01]));
      assert.ok(lower.some((h) => penetrationDepth(h, stud) > 1e-3), `第 ${fig} 種:手柄轉 ${p.toFixed(2)} 時指頭頂在凸柱上`);
    }
    // 凸柱在偏心桿前面一層、和手柄同一層:桿抬起時從凸柱後面過去,整個行程碰不到(量模型裡的零件本身)
    const def = m.default;
    const depthOf = (q) => (q.kind === "plate" ? q.thickness : q.kind === "cylinder" ? q.length : q.size[2]);
    const zRange = (id, only = () => true) => {
      const part = def.parts.find((x) => x.id === id);
      const z = def.pose(0).parts[id]?.position?.[2] ?? part.center?.[2] ?? 0;
      const pieces = (part.pieces ?? [part]).filter(only);
      return [Math.min(...pieces.map((q) => z + (q.at?.[2] ?? 0) - depthOf(q) / 2)), Math.max(...pieces.map((q) => z + (q.at?.[2] ?? 0) + depthOf(q) / 2))];
    };
    const studOutline = m.contact(0).stud;
    const studZ = zRange("rocker", (q) => q.shape?.outline === studOutline);
    assert.ok(Number.isFinite(studZ[0]), `第 ${fig} 種:搖臂上有凸柱這個零件`);
    const [rod, handle] = [zRange("rod"), zRange("handle")];
    assert.ok(studZ[0] > rod[1], `第 ${fig} 種:凸柱(z ${studZ.map((x) => x.toFixed(3))})在偏心桿(z ${rod})前面,不在同一層`);
    assert.ok(studZ[0] < handle[1] && studZ[1] > handle[0], `第 ${fig} 種:凸柱和手柄同一層`);
  }
  // 第 189 種:吊住桿尾的連桿長度不變
  for (const p of sweep(gab189.max, 20)) {
    const { end, lift } = gab189.unhook(p);
    close(dist(end, onRod(gab189.link.HANGER, lift)), gab189.link.LINK, "連桿長度", 1e-9);
  }
});
