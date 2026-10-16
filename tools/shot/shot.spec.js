// 截圖服務:啟動一個服務、把「畫一頁」換成假的(fake.js),像子代理一樣執行命令列工具,只驗外部看得到的行為。
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { startFake, runClient, outDir, readShot, freePort } from "./fake.js";

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
