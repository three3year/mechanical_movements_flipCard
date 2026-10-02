# claude_flipCard

網頁字卡專案：把圖片和文字配對，像字卡（flip card）一樣呈現。

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

## 開發

- 測試:`npm test`(Node 內建測試執行器,零依賴)。測試只驗模型定義(`pose()` 的輸出與定義資料),不碰 Three.js;斷言對應原文。
- 模型的運動學定義在 `models/`(純函式,不依賴 Three.js),3D 繪圖在 `viewer/`。新增模型:寫一份 `models/figNN.js`,再登記到 `models/registry.js`。
- 本機預覽要用靜態伺服器(模型是 ES module);畫面行為的手動驗證清單見 `docs/models-manual-checklist.md`。
