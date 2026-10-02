// 第八章「引擎與調速機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { dist } from "../models/kit.js";
import { feed as feed155, step as step155, stroke as stroke155 } from "../models/fig155.js";
import { bellCrank as crank156 } from "../models/fig156.js";
import { bellCrank as crank157 } from "../models/fig157.js";
import { treadle as treadle158 } from "../models/fig158.js";
import { treadle as treadle159, ropeLengthAt } from "../models/fig159.js";
import { lathe as lathe160 } from "../models/fig160.js";
import { oval as oval172 } from "../models/fig172.js";
import { traverse as traverse173 } from "../models/fig173.js";
import { clamp as clamp174, nose as nose174, grip as grip174 } from "../models/fig174.js";
import { slotting as slotting178, crankLength as crankLength178 } from "../models/fig178.js";
import { clamp as clamp180, nose as nose180, grip as grip180 } from "../models/fig180.js";
import { screwClamp as clamp190 } from "../models/fig190.js";
import { rot2 } from "../models/kit.js";

const TAU = 2 * Math.PI;

test("第 155 種:往復的桿經肘節槓桿上的棘爪使齒輪間歇轉動;棘爪換邊時齒輪反向", () => {
  const cw = sweep(stroke155 * 6, 300).map((v) => feed155(v, 1).gear);
  for (let i = 1; i < cw.length; i++) assert.ok(cw[i] <= cw[i - 1] + 1e-12, "單向");
  close(feed155(stroke155 * 2, 1).gear - feed155(0, 1).gear, -step155, "每次往復推進一次");
  close(feed155(stroke155 * 2, -1).gear - feed155(0, -1).gear, step155, "換邊後反向");
});

test("第 156 種:圓盤上的曲柄銷在曲柄搖臂的溝槽內作動,搖臂來回擺動(變速的交替運動)", () => {
  const ys = sweep(TAU, 360).map((t) => crank156(t).end[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.3);
  close(ys[0], ys[ys.length - 1], "一圈回到原處", 1e-9);
});

test("第 157 種:以連桿取代溝槽,曲柄搖臂同樣來回擺動,連桿長度不變", () => {
  const ref = crank157(0);
  for (const t of sweep(TAU, 36)) {
    const { pin, top } = crank157(t);
    close(dist(pin, top), dist(ref.pin, ref.top), "連桿長度", 1e-9);
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
import { regulator as reg162 } from "../models/fig162.js";
import { regulator as reg163 } from "../models/fig163.js";
import { governor as gov170 } from "../models/fig170.js";

test("第 161 種:引擎速度增加,球向外飛出,把底部的滑塊抬升;速度降低時相反", () => {
  const s = sweep(10, 40).map((v) => gov161(v));
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].alpha >= s[i - 1].alpha - 1e-12, "轉速越大張角越大");
    assert.ok(s[i].sleeve >= s[i - 1].sleeve - 1e-12, "滑塊越高");
  }
  assert.ok(gov161(10).sleeve > gov161(0).sleeve + 0.2);
  assert.equal(fig161.driver.label, "轉速");
});

test("第 162 種:速度正常時兩個斜齒輪靜止;過快與過慢時下方水平軸朝相反方向轉", () => {
  assert.equal(reg162(0.7, "normal").gate, 0);
  assert.ok(reg162(0.7, "fast").gate * reg162(0.7, "slow").gate < 0);
});

test("第 163 種:皮帶在鬆動輪上時不傳動;過快時移到下輪、過慢時移到上輪,傳動方向相反", () => {
  assert.equal(reg163(0.5, "normal").travel, 0);
  assert.ok(reg163(0.5, "fast").y < reg163(0.5, "normal").y && reg163(0.5, "slow").y > reg163(0.5, "normal").y);
  assert.ok(reg163(0.5, "fast").travel !== 0 && reg163(0.5, "slow").travel !== 0);
  assert.ok(reg163(0.5, "fast").direction * reg163(0.5, "slow").direction < 0);
});

test("第 170 種:交叉的搖臂隨轉速張開,經短連桿移動閥桿", () => {
  const rods = sweep(10, 20, 7).map((v) => gov170(v).rod);
  assert.ok(Math.abs(rods[rods.length - 1] - rods[0]) > 0.05, "閥桿隨轉速移動");
  for (let i = 1; i < rods.length; i++) assert.ok(rods[i] <= rods[i - 1] + 1e-12, "單調");
});

import fig164, { knee } from "../models/fig164.js";
import { rocker, wave } from "../models/fig165.js";
import { moldX, pinDistance, slot as slot166 } from "../models/fig166.js";
import { rodY as rod167, stroke as stroke167 } from "../models/fig167.js";
import { mainCrank as main168 } from "../models/fig168.js";
import { mainCrank as main169, sizes as sizes169 } from "../models/fig169.js";

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
import { stroke as stroke175 } from "../models/fig175.js";
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
    close(b.steps - a.steps, 1, "每圈撥一次");
    assert.ok(b.stroke < a.stroke, "行程逐圈縮短");
    close(a.stroke - b.stroke, 0.2, "每圈變化相同的量", 1e-9);
  }
  // 一圈之中撥爪輪只在經過固定銷時轉動,其餘時間行程不變
  const stroke = sweep(TAU, 360, 0.01).map((t) => traverse173(t).stroke);
  assert.ok(stroke.filter((v) => Math.abs(v - stroke[0]) > 1e-9).length < 360 * 0.06);
  // 導桿(T 形桿)的位移就是手腕銷的 x:一圈內往返一次,幅度等於行程
  const xs = sweep(TAU, 720, 0.3).map((t) => traverse173(t).x);
  close(Math.max(...xs) - Math.min(...xs), traverse173(0.3).stroke, "幅度 = 行程", 0.01);
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
  // 木料還沒頂到內緣時,夾爪不動
  close(clamp174(0.2).angle, out.angle);
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
