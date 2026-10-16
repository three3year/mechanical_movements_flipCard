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
