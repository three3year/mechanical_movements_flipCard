# 43 — 收尾

**What to build:** 全書 `npm run verify` 通過(0 個未豁免、沒有過時的豁免);`.scratch/physical-verification/pending.md` 跟上(這一輪新增的「未修」、票 01 列給範圍外各族的干涉);複查入口 `.scratch/recheck-86-507/tables/README.md` 的兩張表(主動件、目標件換了零件的圖)補齊;八份報告每一筆都有「狀態」(已修,或寫明理由的未修);報告與規格的鏡像全部重新發布,規格改成 done。

**Blocked by:** 01–42

**Status:** done

- [x] 全書 `npm run verify` 通過,`npm test` 全過
- [x] `node tools/rigid-links.mjs` 與 `node tools/one-piece.mjs 301-400` 剩下的每一項在報告或 pending.md 寫出理由
- [x] 八份報告第 301–400 種的每一筆都有「狀態」行
- [x] pending.md 與複查入口的兩張表跟上
- [x] 規格的 Status 改成 done,報告與規格的鏡像重新發布
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

- 2026-10-20 做完。全書 `npm run verify` 通過:507 張、0 個未豁免、沒有過時的豁免、357 項豁免(第 301–400 種從掃描時的 94 項減到 20 項,沒有「未修」);`npm test` 3329 項、`npm run test:verify` 49 項全過。這一輪沒有新增「未修」;票 01 補盲點後報出的範圍外干涉(第 132、143、163、454、470、472 種)在 pending.md 的未修清單裡。`node tools/rigid-links.mjs 301-400` 0 張;`node tools/one-piece.mjs 301-400` 剩 7 張(第 331、333、344、345、346、365、370 種),每一項的理由寫在 pending.md「完成到什麼程度」新加的那一條(落地的分件站在同一地面、原圖畫斷口接圖外機架、導件固定在汽缸頂蓋上)。八份報告第 301–400 種的每一筆都有「狀態」行(用腳本逐筆查過)。主動件、目標件換了零件的圖:和這一輪開始時(2ac2068)逐張比對,第 320、326、330、342、348、356、357、373、376 種都已登記在 `tables/README.md` 的兩張表。規格 Status 改成 done。鏡像重新發布:`23-misc-3.md`(https://claude.ai/artifact/Su1WkRew9AAK3HtYdTzrT8)、pending.md(https://claude.ai/artifact/FGB8dWkwMs5tLeS8iGZKUV)、規格(https://claude.ai/artifact/2VqMPXYtdQLmTkkDWBahKa);第 16–22 族的報告這一輪收尾時沒有再改,鏡像是票 01–36 合併後發布的版本。等你決定的 13 題列在 pending.md 那一條裡(第 391、396、397、398 種是這次票 38–41 冒出的,模型目前照各題的 (a) 做)。
