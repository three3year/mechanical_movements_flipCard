# 08 — 第 471 種:原文只有一個孔 e,模型做了孔 c 與孔 e 兩個

**Status:** open

**Blocked by:** None

- **類別**:1(不合原文)、5(記號)。
- **證據**:英文「As the cylinder ascends, air entering hole, e, is compressed below piston and lifts hammer」,後文也是 e,自始至終只有一個孔 e。舊中譯第一處寫成「進氣孔 c」,已改成 e。模型照舊譯做成兩個孔:`models/fig471.js` 第 69 行 `holeC` 標 c、第 99 行放在汽缸下端,第 70 行 `holeE` 在上端;檔頭第 2 行引用「進氣孔 c」。
- **建議修法**:對照原圖(507movements 的 525 px 原圖)確認孔數與位置後,拿掉多出來的孔,檔頭照新中譯改。
- **和定案衝突**:沒有查到。

- [ ] 對照原圖確認孔數
- [ ] 模型與檔頭改好,`npm test`、`npm run verify -- 471` 通過
