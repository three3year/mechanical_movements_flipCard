// 第四章「曲柄與凸輪」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { dist } from "../models/kit.js";
import fig92, { crankSlider } from "../models/fig092.js";
import fig96, { CAM_OUTLINE, ROLLER_RADIUS } from "../models/fig096.js";
import { rot2 } from "../models/kit.js";

test("第 92 種:曲柄轉一圈,滑塊完成一次往返,行程等於曲柄半徑的兩倍", () => {
  const xs = sweep(Math.PI * 2, 360).map((a) => fig92.pose(a).parts.slider.position[0]);
  close(xs[0], xs[xs.length - 1], "轉一圈回到原處");
  const stroke = Math.max(...xs) - Math.min(...xs);
  close(stroke, 2 * 0.92, "行程 = 2 × 曲柄半徑", 1e-3);
  // 一圈中只有一次往、一次返:位移方向只改變兩次
  let turns = 0;
  for (let i = 2; i < xs.length; i++) if (Math.sign(xs[i] - xs[i - 1]) !== Math.sign(xs[i - 1] - xs[i - 2])) turns++;
  assert.equal(turns, 2);
});

test("第 92 種:任何主動量下連桿兩端都接在曲柄銷與滑塊上(長度不變)", () => {
  for (const a of sweep(Math.PI * 4, 50, -1)) {
    const { from, to } = fig92.pose(a).parts.rod;
    close(dist(from, to), 3.1, `轉角 ${a}`, 1e-9);
    const { pin, slider } = crankSlider(a);
    close(dist([from[0], from[1], 0], [pin[0], pin[1], 0]), 0, "連桿接在曲柄銷");
    close(dist([to[0], to[1], 0], [slider[0], slider[1], 0]), 0, "連桿接在滑塊");
  }
});

// 暫代:之後有四連桿模型(如第 35、37 種)時,改由那些模型的測試涵蓋
import { fourBar } from "../models/linkage.js";
test("連桿閉合也能解四連桿:各桿長度不變,極限位置不分離", () => {
  const spec = { a: [0, 0, 0], b: [3, 0, 0], crank: 1, coupler: 3.2, rocker: 2 };
  for (const angle of sweep(Math.PI * 2, 72)) {
    const { pin, joint, reach } = fourBar({ ...spec, angle });
    assert.ok(reach);
    close(dist(pin, spec.a), 1);
    close(dist(pin, joint), 3.2);
    close(dist(joint, spec.b), 2);
  }
  const far = fourBar({ ...spec, coupler: 0.5, angle: Math.PI });
  assert.equal(far.reach, false, "兩圓不相交時標記為不可達");
  assert.ok(far.joint.every(Number.isFinite), "仍回傳最接近的姿勢");
});

test("第 96 種:心形凸輪「將均勻的橫移運動賦予水平桿」——去程與回程的位移各自與轉角成正比", () => {
  const x = (a) => fig96.pose(a).parts.rod.position[0];
  const rate = (x(0.2) - x(0.1)) / 0.1;
  for (const a of sweep(Math.PI - 0.05, 20, 0.05)) close((x(a + 0.04) - x(a)) / 0.04, rate, `去程 ${a}`, 1e-6);
  for (const a of sweep(2 * Math.PI - 0.05, 20, Math.PI + 0.05)) close((x(a + 0.04) - x(a)) / 0.04, -rate, `回程 ${a}`, 1e-6);
  close(x(0), x(2 * Math.PI), "轉一圈回到原處");
});

test("第 96 種:任何轉角下桿端滾子都貼著凸輪輪廓", () => {
  for (const a of sweep(2 * Math.PI, 40)) {
    const pose = fig96.pose(a).parts;
    const [rx, ry] = pose.rod.position;
    const gap = Math.min(...CAM_OUTLINE.map((p) => {
      const [x, y] = rot2(p, pose.cam.angle);
      return Math.hypot(x - rx, y - ry);
    }));
    close(gap, ROLLER_RADIUS, `轉角 ${a}`, 0.01);
  }
});
