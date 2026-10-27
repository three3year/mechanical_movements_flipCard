# 57 — 收尾:全書驗證、紀錄與鏡像

**What to build:** 全部票合併後的全書基準,以及這一輪的紀錄:全書 `npm run verify`、`npm run test:verify`、`npm test` 與一件、剛性、外形三個檢查;pending.md(未修清單、第 70、71、462 種那一題、完成到什麼程度、第 8 類查出留到下一輪的)、`tables/README.md` 的換人表、`docs/agents/model-audit.md` 的複查範圍改成全書;12 份報告與 pending.md 的鏡像重新發布。

**報告:** `.scratch/model-audit/00a-belts-1.md`–`00l-intermittent-4.md`。規格:`.scratch/model-audit-fixes-6/spec.md`。

**Blocked by:** 01、02、03、04、05、06、07、08、09、10、11、12、13、14、15、16、17、18、19、20、21、22、23、24、25、26、27、28、29、30、31、32、33、34、35、36、37、38、39、40、41、42、43、44、45、46、47、48、49、50、51、52、53、54、55、56

**Status:** ready-for-agent

- [ ] 全書 `npm run verify` 通過(0 個未豁免、沒有過時的豁免),`npm run test:verify`、`npm test` 全過(同一時間只跑一個)
- [ ] 一件、剛性、外形三個檢查在第 1–85 種沒有沒寫理由的項目
- [ ] 取景掃描重跑,外框變大超過 2% 的新圖截圖確認
- [ ] 12 份報告的 110 筆每一筆都有狀態行
- [ ] pending.md 更新:第 1–85 種的「未修」清空、第 70、71 種補記、完成到什麼程度加這一輪、第 8 類查出的範圍外問題列成新的一段
- [ ] `docs/agents/model-audit.md` 的複查範圍改成全書;`tables/README.md` 的兩張表補這一輪換人的圖、範圍說明改成全書
- [ ] 改過的報告、pending.md 與規格照 review-mirror 重新發布鏡像;規格的 Status 改成 done
