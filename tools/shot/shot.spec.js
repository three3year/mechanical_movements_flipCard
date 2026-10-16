// 截圖服務:啟動一個服務、把「畫一頁」換成假的(fake.js),像子代理一樣執行命令列工具,只驗外部看得到的行為。
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { startFake, runClient, outDir, readShot, freePort, sleep } from "./fake.js";

test("給一頁 → 寫出檔案,印出路徑與寬高", async () => {
  const service = await startFake({ "tools/model-strip.html?fig=63": { height: 760 } });
  try {
    const out = join(outDir(), "63.png");
    const r = await runClient(["tools/model-strip.html?fig=63", out], service);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, new RegExp(`${out.replace(/\\/g, "\\\\")}\\s+1800×760`));
    assert.deepEqual(readShot(out).clip, { x: 0, y: 0, width: 1800, height: 760 });
  } finally {
    await service.close();
  }
});

test("沒給輸出路徑 → 失敗並說明", async () => {
  const service = await startFake();
  try {
    const r = await runClient(["tools/model-strip.html?fig=63"], service);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /輸出路徑/);
    assert.deepEqual(service.log, []);
  } finally {
    await service.close();
  }
});

test("服務沒開 → 失敗,叫你回報主 session 啟動", async () => {
  const r = await runClient(["tools/model-strip.html?fig=63", join(outDir(), "a.png")], { port: await freePort() });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /截圖服務沒在跑/);
  assert.match(r.stderr, /回報主 session/);
});

test("頁面標題變成 error → 回報頁面上的訊息", async () => {
  const service = await startFake({ "tools/model-strip.html?fig=999": { title: "error", message: "Error: 沒有第 999 種" } });
  try {
    const out = join(outDir(), "999.png");
    const r = await runClient(["tools/model-strip.html?fig=999", out], service);
    assert.notEqual(r.code, 0);
    assert.match(r.stdout + r.stderr, /沒有第 999 種/);
    assert.equal(existsSync(out), false);
  } finally {
    await service.close();
  }
});

test("服務提供專案的靜態檔", async () => {
  const service = await startFake();
  try {
    const res = await fetch(`http://127.0.0.1:${service.port}/package.json`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).name, "claude-flipcard");
    assert.equal((await fetch(`http://127.0.0.1:${service.port}/%2e%2e/%2e%2e/Windows/win.ini`)).status, 404);
  } finally {
    await service.close();
  }
});

// ── 排隊 ──

const many = (prefix, n, dir) => Array.from({ length: n }, (_, i) => [`tools/model-strip.html?fig=${prefix}${i + 1}`, join(dir, `${prefix}${i + 1}.png`)]).flat();
const waitFor = async (check) => {
  while (!check()) await sleep(10);
};

test("A 送 6 頁、B 稍後送 2 頁 → 輪流畫,B 先完成", async () => {
  const slow = Object.fromEntries(["a1", "a2", "a3", "a4", "a5", "a6", "b1", "b2"].map((k) => [`tools/model-strip.html?fig=${k}`, { delay: 400 }]));
  const service = await startFake(slow);
  try {
    const dir = outDir();
    const a = runClient(many("a", 6, dir), service);
    await waitFor(() => service.log.length >= 1);
    const b = runClient(many("b", 2, dir), service);
    const [ra, rb] = await Promise.all([a, b]);
    assert.equal(ra.code, 0, ra.stderr);
    assert.equal(rb.code, 0, rb.stderr);
    assert.deepEqual(service.log.map((k) => k.split("=")[1]), ["a1", "b1", "a2", "b2", "a3", "a4", "a5", "a6"]);
    assert.ok(rb.finished < ra.finished, "B 應該先完成");
    assert.equal(ra.stdout.trim().split("\n").filter((l) => l.includes("1800×")).length, 6);
  } finally {
    await service.close();
  }
});

test("送 7 頁 → 失敗、說明要分批、什麼都不畫", async () => {
  const service = await startFake();
  try {
    const r = await runClient(many("c", 7, outDir()), service);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /6 頁/);
    assert.match(r.stderr, /分批/);
    assert.deepEqual(service.log, []);
  } finally {
    await service.close();
  }
});

test("等待中印出排隊狀態:前面幾頁、預估秒數", async () => {
  const slow = Object.fromEntries(["d1", "d2", "d3"].map((k) => [`tools/model-strip.html?fig=${k}`, { delay: 300 }]));
  const service = await startFake(slow, { statusInterval: 50 });
  try {
    const dir = outDir();
    const a = runClient(many("d", 3, dir), service);
    await waitFor(() => service.log.length >= 1);
    const b = await runClient(["tools/model-strip.html?fig=e1", join(dir, "e1.png")], service);
    await a;
    assert.equal(b.code, 0, b.stderr);
    assert.match(b.stdout, /前面還有 \d+ 頁.*預估 \d+ 秒/);
  } finally {
    await service.close();
  }
});

test("同一次呼叫裡一頁 error、一頁逾時、一頁載入失敗 → 只有那三頁失敗,其他頁寫出", async () => {
  const service = await startFake(
    {
      "tools/model-strip.html?fig=f2": { title: "error", message: "TypeError: 壞了" },
      "tools/model-strip.html?fig=f3": { title: "載入中" },
      "tools/model-strip.html?fig=f4": { fail: "net::ERR_CONNECTION_REFUSED" },
    },
    { readyTimeout: 300 },
  );
  try {
    const dir = outDir();
    const r = await runClient(many("f", 5, dir), service);
    assert.notEqual(r.code, 0);
    assert.match(r.stdout, /fig=f2.*TypeError: 壞了/);
    assert.match(r.stdout, /fig=f3.*還沒變成 ready.*載入中/);
    assert.match(r.stdout, /fig=f4.*ERR_CONNECTION_REFUSED/);
    for (const ok of ["f1", "f5"]) assert.ok(existsSync(join(dir, `${ok}.png`)), ok);
    for (const bad of ["f2", "f3", "f4"]) assert.equal(existsSync(join(dir, `${bad}.png`)), false, bad);
  } finally {
    await service.close();
  }
});

test("client 等太久就報錯結束,剩下的頁不再畫", async () => {
  const slow = Object.fromEntries(["g1", "g2", "g3"].map((k) => [`tools/model-strip.html?fig=${k}`, { delay: 500 }]));
  const service = await startFake(slow);
  try {
    const started = Date.now();
    const r = await runClient(many("g", 3, outDir()), { ...service, env: { SHOT_TIMEOUT: "0.3" } });
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /等了 .*秒還沒完成/);
    assert.ok(r.finished - started < 1400, "應該在逾時後就結束");
    await sleep(1200);
    assert.deepEqual(service.log.map((k) => k.split("=")[1]), ["g1"]);
  } finally {
    await service.close();
  }
});

// ── 大小、切圖、外部網址 ──

// client 印出的檔案(路徑、寬、高、整行)
const printed = (stdout) => stdout.split("\n").map((line) => line.match(/^(\S.*\.png)\s+(\d+)×(\d+)/)).filter(Boolean).map((m) => ({ path: m[1], width: Number(m[2]), height: Number(m[3]), line: m[0] }));
const linesOf = (stdout) => stdout.split("\n").filter((l) => /\.png\s+\d+×\d+/.test(l));

test("內容高 3000、小圖每列 304 px → 切成兩張,切線不跨過任何小圖,長邊都 ≤ 2000", async () => {
  const boxes = Array.from({ length: 9 }, (_, k) => [4 + k * 308, 4 + k * 308 + 304]);
  const service = await startFake({ "tools/model-strip.html?fig=30": { height: 3000, boxes } });
  try {
    const dir = outDir();
    const r = await runClient(["tools/model-strip.html?fig=30", join(dir, "30.png")], service);
    assert.equal(r.code, 0, r.stderr);
    const files = printed(r.stdout);
    assert.deepEqual(files.map((f) => f.path), [join(dir, "30-1.png"), join(dir, "30-2.png")]);
    assert.equal(existsSync(join(dir, "30.png")), false);
    const clips = files.map((f) => readShot(f.path).clip);
    assert.equal(clips[0].y, 0);
    assert.equal(clips[1].y, clips[0].y + clips[0].height);
    assert.equal(clips[1].y + clips[1].height, 3000);
    for (const f of files) assert.ok(Math.max(f.width, f.height) <= 2000, f.line);
    for (const [top, bottom] of boxes) assert.ok(!(top < clips[1].y && clips[1].y < bottom), `切線 ${clips[1].y} 跨過 ${top}–${bottom}`);
  } finally {
    await service.close();
  }
});

test("長邊不超過 2000 → 只輸出一張,檔名不變", async () => {
  const service = await startFake({ "tools/model-strip.html?fig=31": { height: 2000, boxes: [[0, 1990]] } });
  try {
    const out = join(outDir(), "31.png");
    const r = await runClient(["tools/model-strip.html?fig=31", out], service);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(printed(r.stdout).map((f) => [f.path, f.height]), [[out, 2000]]);
    assert.doesNotMatch(r.stdout, /縮小/);
  } finally {
    await service.close();
  }
});

test("一張小圖高 2500 → 它自己成一張,那一行註明會被縮小", async () => {
  const boxes = [[0, 300], [310, 2810], [2820, 3100]];
  const service = await startFake({ "tools/model-strip.html?fig=32": { height: 3200, boxes } });
  try {
    const dir = outDir();
    const r = await runClient(["tools/model-strip.html?fig=32", join(dir, "32.png")], service);
    assert.equal(r.code, 0, r.stderr);
    const clips = printed(r.stdout).map((f) => readShot(f.path).clip);
    assert.deepEqual(clips.map((c) => [c.y, c.y + c.height]), [[0, 310], [310, 2810], [2810, 3200]]);
    const lines = linesOf(r.stdout);
    assert.match(lines[1], /32-2\.png\s+1800×2500.*會被縮小/);
    for (const i of [0, 2]) assert.doesNotMatch(lines[i], /縮小/);
  } finally {
    await service.close();
  }
});

test("給寬度 → 用那個寬度;超過 16384 → 失敗並說明上限", async () => {
  const service = await startFake({ "tools/model-strip.html?fig=33": { height: 400 } });
  try {
    const dir = outDir();
    const r = await runClient(["tools/model-strip.html?fig=33", join(dir, "33.png"), "--width=1200"], service);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /33\.png\s+1200×400/);
    assert.equal(readShot(join(dir, "33.png")).width, 1200);
    const wide = await runClient(["tools/model-strip.html?fig=33", join(dir, "w.png"), "--width=20000"], service);
    assert.notEqual(wide.code, 0);
    assert.match(wide.stderr, /16384/);
    assert.deepEqual(service.log, ["tools/model-strip.html?fig=33"]);
  } finally {
    await service.close();
  }
});

test("外部網址不等 ready,等指定的秒數後截", async () => {
  const site = "https://507movements.com/mm_063.html";
  const service = await startFake({ [site]: { title: "507 Mechanical Movements", height: 900 } }, { readyTimeout: 5000 });
  try {
    const out = join(outDir(), "site.png");
    const r = await runClient([site, out, "--wait=0.4"], service);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    const { elapsed } = readShot(out);
    assert.ok(elapsed >= 400 && elapsed < 2000, `開頁到截圖 ${elapsed} 毫秒`);
  } finally {
    await service.close();
  }
});
