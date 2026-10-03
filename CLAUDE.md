# claude_flipCard

網頁字卡專案：把圖片和文字配對，像字卡（flip card）一樣呈現。

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

## 開發

- 測試:`npm test`(Node 內建測試執行器,零依賴)。測試只驗模型定義(`pose()` 的輸出與定義資料),不碰 Three.js;斷言對應原文。
- 模型的運動學定義在 `models/`(純函式,不依賴 Three.js),3D 繪圖在 `viewer/`。新增模型:寫一份 `models/figNNN.js`(三位數圖號),再在 `models/registry.js` 登記一行(登記表只記圖號 → 定義檔,定義在切到模型時才載入)。
- 本機預覽要用靜態伺服器(模型是 ES module);`tools/model-preview.html?fig=N` 把插圖與模型初始視角並排,供截圖對照;畫面行為的手動驗證清單見 `docs/models-manual-checklist.md`。
- **改動或新增模型後要跑實體驗證**:`npm run verify`(全書;`npm run verify -- 63 70-71` 只跑指定圖號,`--waivers` 列出豁免)。它檢查干涉、憑空連動、動力重演(用語見 `CONTEXT.md`,決定見 ADR-0003),有未豁免的問題或過時的豁免就失敗。需要開發用依賴(`npm install`:Rapier 與 Three.js),不在 `npm test` 裡;它自己的測試是 `npm run test:verify`。可以接受的問題寫成該模型定義裡的 `waivers`(必須寫原因);虛擬主動件的模型用 `powered` 標出直接受力的零件;靠接觸或重力運作的機構用 `replay` 宣告動力重演(格式見 `verify/replay.js` 檔頭)。
- 對照原文時可用 `node tools/audit.mjs 圖號…` 印出原文與各零件的動作摘要(轉向、轉速比、位移)。
