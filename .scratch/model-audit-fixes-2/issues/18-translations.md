# 18 — 中譯四處

**What to build:** 照 507movements 的英文原文改 `oriText/` 的四處:第 262–263 種斷句(#262-3)、第 283 種 racks 是複數(#283-3)、第 284 種 carriage 的譯法(#284-4)、第 288–289 種「擒縱瓦」改成術語表的用語(#288-4);再跑 `tools/gen_data.py` 重新產生 `data.js`。用語照 `.scratch/translation-audit/glossary.md`。

**Blocked by:** 無

**Status:** ready

- [ ] `data.js` 只由 `tools/gen_data.py` 產生,不手改;卡片上看得到改好的句子
- [ ] 報告裡每一筆加「狀態:已修(日期):做了什麼」,報告的鏡像照 review-mirror 重新發布
- [ ] 以獨立暫存區提交(只放自己的檔案)
