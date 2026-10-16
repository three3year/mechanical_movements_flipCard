# 04 — 規範與真 Chrome 冒煙測試

**What to build:** 專案的規則改成一律用截圖服務。CLAUDE.md 的「開發」加一條:截圖(主 session 自己截或派子代理截)一律經截圖服務;主 session 在一次 prompt 開始時判斷這次要不要截圖,要就啟動、回覆前關閉;子代理發現服務沒開就回報主 session,不自己開;執行截圖工具時指令逾時設 10 分鐘;不要自己執行 `chrome --headless`,不要用 Playwright MCP 截圖。`docs/agents/model-audit.md` 第 3 步「看動作」改成用截圖服務:一張圖用 `model-strip.html` 一次截多個相位(與斜後方、放大另一頁),讀圖時長邊超過 2000 會被縮小所以交給服務切;拿掉現在教的 `chrome --headless --use-angle=swiftshader…` 與 Playwright 的寫法。最後用真的 Chrome 做一次冒煙測試。見規格 User Stories 30–31 與 Testing Decisions 的手動冒煙測試。

**Blocked by:** 02、03

**Status:** ready-for-agent

- [ ] CLAUDE.md「開發」的新條目涵蓋上述六點,寫法照 writing-for-agents
- [ ] `docs/agents/model-audit.md` 第 3 步改寫,不再出現 `chrome --headless` 與 Playwright 的截圖寫法
- [ ] 冒煙測試(結果寫在本票的 Comments):啟動時印出繪圖方式;截一張 4 個相位(單張、相位完整);截一張 30 個相位(切成兩張、沒有相位被切開);截一個外部網址;兩個 client 同時送頁、輪流完成;關閉後沒有殘留的 headless Chrome 行程與暫存設定檔
- [ ] `npm test`、`npm run test:verify`、`npm run test:shot` 全過
- [ ] 規格的 Status 改成 done,規格的鏡像照 review-mirror 重新發布
- [ ] 以獨立暫存區提交(只放自己的檔案)
