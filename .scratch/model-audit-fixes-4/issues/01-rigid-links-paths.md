# 01 — `rigid-links.mjs` 看得到路徑零件

**What to build:** `tools/rigid-links.mjs` 除了 from/to 擺的零件,也量 kind 為 `rod` 等兩點路徑零件的兩端距離,報出長度會變的。先在它的測試寫失敗的例子(一根兩端跟著不同零件走、長度會變的 `rod`)。改完跑 `node tools/rigid-links.mjs 401-507`,報出的每一根列在本票 Comments,交給各圖的票(已知:第 417、420、499 種的桿;第 478 種管子熱脹、第 483 種風箱皺褶,第 416 種彈簧有理由)。範圍外報出的寫進 `.scratch/physical-verification/pending.md` 留給各族。

**Blocked by:** 無

**Status:** done

- [x] 先寫失敗的測試,再改工具
- [x] 工具自己的測試、`npm test`(與改實體驗證時的 `npm run test:verify`)全過
- [x] 範圍內報出的列在 Comments 交給各圖的票,範圍外的寫進 pending.md
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

2026-10-20:`tools/rigid-links.mjs` 的掃描抽成 `stretchedLinks(def)` 匯出(`tools/rigid-links.test.mjs` 三個測試跑在 `npm test` 裡;直接執行時才印報告)。除了 from/to 擺的零件,也量 kind 為 `rod` 的路徑零件:折線任一段的長度在播放中變了就報,印的是總長的範圍;繩、皮帶、鏈(會收放)與彈簧不算。`node tools/rigid-links.mjs 401-507` 報出 9 張:

| 圖 | 桿 | 總長 | 交給 |
| --- | --- | --- | --- |
| 416 | `spring`(rod) | 4.09–7.10 | 螺旋彈簧畫成 rod,會伸縮有理由(報告 #416 已確認);票 08 不用動 |
| 417 | `rodB` | 1.52–2.41 | 票 08(#417-1) |
| 420 | `wire` | 1.03–1.54 | 票 08(#420-3) |
| 428 | `lining`(封閉的 rod) | 10.77–11.41 | 票 11:橡膠內襯被滾子壓扁變形,周長變 6% 是不是合理(橡膠可以壓扁但不太會拉長),由票 11 判 |
| 453 | `fold0L`、`fold0R`、`fold1L`、`fold1R` | 1.88–2.23 | 票 17:風箱的之字形褶和第 483 種一樣,折數與振幅固定、風箱拉長時每段被拉長 |
| 454 | `membrane` | 1.70–1.78 | 票 17:隔膜(橡膠)拱起時中線變長 5%,由票 17 判是否合理 |
| 478 | `pipe` | 3.45–3.80 | 熱脹是原理本身(報告第 28 族已確認);票 23 不用動 |
| 483 | `pleat0Top`、`pleat0Bottom`、`pleat1Top`、`pleat1Bottom` | 2.48–2.77 | 票 25(#483 風箱皺褶) |
| 499 | `rodL`、`rodR` | 0.58–1.25 / 0.58–1.54 | 票 29(#499-2) |

範圍外(全書共 18 張,扣掉上面 9 張)寫進 `.scratch/physical-verification/pending.md`「工具補盲點後報出、留給各族的」:第 125 種兩層槓桿(`stretch: true`,註解已寫明是近似)、第 235、239、240、287、360 種的彈簧畫成 rod(彈簧會伸縮,屬實)、第 317、319 種補償擺的鋼桿與黃銅桿(熱脹是原理)、第 369 種擺線 0.01。

2026-10-20 code review 後:`defaultSpeed`、起點與範圍改用 `verify/sampling.js` 匯出的(零依賴),不再自己抄一份;順帶改的檔是 `docs/agents/model-audit.md` 第 3 類那一句與 `CLAUDE.md` 測試那一句(`tools/*.test.mjs` 進 `npm test`)。保留在 CLI 檔內 `export` 加 main-guard 的寫法(和 one-piece 的「verify/ 函式庫 + tools/ CLI」不同):這個掃描零依賴、測試要進 `npm test`,放 `verify/` 會混進需要 Rapier 的那一堆。
