# 15 — 外形與洞:第 75、76、77、80 種

**What to build:** 外形與洞的檢查(`node tools/outlines.mjs`)在這幾張報出:第 75 種 `click` 外輪廓自交(三角化 0.150、該有 0.095);第 76 種 `pawl`、第 77 種 `pawlUpper/pawlLower`、第 80 種 `pawlLeft/pawlRight` 的洞一部分在外形外。這四張在第 1–85 種(維護者看過的範圍),只改外形與洞,不動其他地方。逐項修到檢查不再報出——端頭的銷孔畫出圓頭讓洞落在外形裡、拿洞當缺口的改成外形本身的缺口、自交的輪廓重畫。不改零件的運動;外形一改,和它相碰的接觸重新量。細節見 `.scratch/physical-verification/pending.md`「工具補盲點後報出、留給各族的」。規格 User Stories 24–29。

**Blocked by:** 無

**Status:** ready-for-agent

- [ ] `node tools/outlines.mjs 75 76 77 80` 0 項
- [ ] 改到接觸面的,補量接觸的測試(先寫失敗的再改)
- [ ] `npm run verify -- 75 76 77 80` 通過、`npm test` 全過
- [ ] 第 75、76、77、80 種改過的每一張截四個相位(含斜後方)對照原圖,截圖經截圖服務
- [ ] 以獨立暫存區提交(只放自己的檔案);pending.md 不在這張票改(收尾票統一更新),做了什麼寫在本票 Comments
