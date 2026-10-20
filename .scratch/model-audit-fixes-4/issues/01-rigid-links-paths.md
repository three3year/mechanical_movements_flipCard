# 01 — `rigid-links.mjs` 看得到路徑零件

**What to build:** `tools/rigid-links.mjs` 除了 from/to 擺的零件,也量 kind 為 `rod` 等兩點路徑零件的兩端距離,報出長度會變的。先在它的測試寫失敗的例子(一根兩端跟著不同零件走、長度會變的 `rod`)。改完跑 `node tools/rigid-links.mjs 401-507`,報出的每一根列在本票 Comments,交給各圖的票(已知:第 417、420、499 種的桿;第 478 種管子熱脹、第 483 種風箱皺褶,第 416 種彈簧有理由)。範圍外報出的寫進 `.scratch/physical-verification/pending.md` 留給各族。

**Blocked by:** 無

**Status:** ready

- [ ] 先寫失敗的測試,再改工具
- [ ] 工具自己的測試、`npm test`(與改實體驗證時的 `npm run test:verify`)全過
- [ ] 範圍內報出的列在 Comments 交給各圖的票,範圍外的寫進 pending.md
- [ ] 以獨立暫存區提交(只放自己的檔案)

## Comments
