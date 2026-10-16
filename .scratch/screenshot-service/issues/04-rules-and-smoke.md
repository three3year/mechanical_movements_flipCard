# 04 — 規範與真 Chrome 冒煙測試

**What to build:** 專案的規則改成一律用截圖服務。CLAUDE.md 的「開發」加一條:截圖(主 session 自己截或派子代理截)一律經截圖服務;主 session 在一次 prompt 開始時判斷這次要不要截圖,要就啟動、回覆前關閉;子代理發現服務沒開就回報主 session,不自己開;執行截圖工具時指令逾時設 10 分鐘;不要自己執行 `chrome --headless`,不要用 Playwright MCP 截圖。`docs/agents/model-audit.md` 第 3 步「看動作」改成用截圖服務:一張圖用 `model-strip.html` 一次截多個相位(與斜後方、放大另一頁),讀圖時長邊超過 2000 會被縮小所以交給服務切;拿掉現在教的 `chrome --headless --use-angle=swiftshader…` 與 Playwright 的寫法。最後用真的 Chrome 做一次冒煙測試。見規格 User Stories 30–31 與 Testing Decisions 的手動冒煙測試。

**Blocked by:** 02、03

**Status:** done

- [x] CLAUDE.md「開發」的新條目涵蓋上述六點,寫法照 writing-for-agents
- [x] `docs/agents/model-audit.md` 第 3 步改寫,不再出現 `chrome --headless` 與 Playwright 的截圖寫法
- [x] 冒煙測試(結果寫在本票的 Comments):啟動時印出繪圖方式;截一張 4 個相位(單張、相位完整);截一張 30 個相位(切成兩張、沒有相位被切開);截一個外部網址;兩個 client 同時送頁、輪流完成;關閉後沒有殘留的 headless Chrome 行程與暫存設定檔
- [x] `npm test`、`npm run test:verify`、`npm run test:shot` 全過
- [x] 規格的 Status 改成 done,規格的鏡像照 review-mirror 重新發布
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

- 2026-10-16 規範:CLAUDE.md「開發」加一條「截圖一律經截圖服務」(主 session 判斷開關、子代理回報、逾時 10 分鐘、`chrome --headless` 與 Playwright MCP 都不用並寫出原因);`docs/agents/model-audit.md` 第 3 步改成 `node tools/shot.mjs`,一頁放齊相位、每個狀態 / `dir=` / `fit=` 各一頁、一次最多 6 頁、超過 2000 交給服務切。`docs/models-manual-checklist.md` 裡的 `python -m http.server` 照規格的 Out of Scope 沒改。
- 冒煙測試(真的 Chrome,這台電腦):
  - `start` 印出「截圖服務就緒:GPU(NVIDIA GeForce GTX 1650, Direct3D11);靜態檔 http://127.0.0.1:8618/」。
  - 第 70 種 4 個相位:一張 1800×310,插圖與四個相位完整。
  - 第 70 種 30 個相位:`-1` 1800×1840(6 列)、`-2` 1800×306(最後一個相位),切線在列與列之間,沒有相位被切開。
  - `https://507movements.com/mm_070.html --wait=3`:1800×835。
  - A 送 4 頁、0.6 秒後 B 送 2 頁:寫出順序 a1 a2 b1 a3 b2 a4,B 先完成。
  - `stop` 後 headless Chrome 行程 0 個,系統暫存資料夾裡沒有 `flipcard-shot-*`(設定檔、記錄檔、日誌都清掉)。
- `npm test` 2973 過、`npm run test:verify` 46 過、`npm run test:shot` 15 過。
- 規格 Status 改成 done,鏡像重新發布:https://claude.ai/artifact/Q7mhXW39K1AongyJW7GEBM
