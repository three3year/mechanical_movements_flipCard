# 27 — 收尾

**What to build:** 全書檢查與紀錄。跑全書 `npm run verify`(0 個未豁免、沒有過時的豁免)、`npm test`、`npm run test:verify`;`node tools/outlines.mjs` 與 `node tools/rigid-links.mjs` 全書 0 張;取景掃描工具全書重跑(各票改了幾何,外框可能又變),外框變大超過 2% 又沒確認過的圖列出處理。更新 `.scratch/physical-verification/pending.md`:「完成到什麼程度」加一條這一輪的結果、「工具補盲點後報出、留給各族的」改成已處理、「未修清單」移除第 199、132、143、163 種、豁免數與測試數更新;第 8、12、13 族報告的狀態行補齊;規格 Status 改 done;鏡像照 review-mirror 重新發布。跑 code review(Standards / Spec 兩軸),修掉的與不改的都寫在 Comments。

**Blocked by:** 01–26、28–32(其餘全部)

**Status:** ready-for-agent

- [ ] 全書 `npm run verify` 通過(0 個未豁免、沒有過時的豁免),`npm test`、`npm run test:verify` 全過(同一時間只跑一個全書驗證,不和 `npm test` 同時跑)
- [ ] 外形與伸縮桿的檢查全書 0 張;取景掃描報告附在 Comments
- [ ] pending.md、規格、第 8、12、13 族報告更新,鏡像重新發布
- [ ] code review 做完,修正另外提交
- [ ] 以獨立暫存區提交(只放自己的檔案)
