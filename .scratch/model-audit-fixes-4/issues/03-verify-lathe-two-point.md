# 03 — 實體驗證建得出兩點剖面的旋轉體

**What to build:** `verify/solids.js` 的 `lathePieces` 建不出只有兩點剖面的 `lathe`(第 438 種下端的尖頂),實體驗證與一件掃描都看不到它。先用 `npm run test:verify` 寫失敗的例子(兩點剖面的旋轉體要有實體、和別的零件的距離量得到),再改。改完跑全書驗證,新冒出的問題範圍內併進各圖的票,範圍外寫進 pending.md。

**Blocked by:** 無

**Status:** ready

- [ ] 先寫失敗的測試,再改工具
- [ ] 工具自己的測試、`npm test`(與改實體驗證時的 `npm run test:verify`)全過
- [ ] 範圍內報出的列在 Comments 交給各圖的票,範圍外的寫進 pending.md
- [ ] 以獨立暫存區提交(只放自己的檔案)

## Comments
