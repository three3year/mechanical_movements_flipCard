# 中譯檢查:接頭與器具 一(第 243–258 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 2 張圖、4 筆(誤譯 4、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 0)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 244 | `oriText/28.txt` 第 3 行 | Now, suppose the shaft to be in motion, the screws are to be tightened | 假設要讓軸開始運轉，就將螺絲鎖緊 | 假設軸正在運轉，就鎖緊螺絲 | 誤譯(上一輪找到):是運轉中調整,不是開動前(model-audit #244-3) |
| 244 | `oriText/28.txt` 第 3 行 | one block and a series of straps attached to a band or chain | 一連串的皮帶 | 一連串的條板 | 誤譯(上一輪找到):straps 是鏈上一段段的木條(model-audit #244-3);同行「木塊加皮帶」也一起改 |
| 244 | `oriText/28.txt` 第 3 行 | the two blocks, or the block and straps | 木塊加皮帶 | 木塊加條板 | 誤譯(上一輪找到):同上 |
| 251 | `oriText/28.txt` 第 17 行 | are pressed inward by the sides of the slot, B, in the top of the frame | 被框架 B 的槽兩側向內壓 | 被框架頂部的槽 B 兩側向內壓 | 誤譯:B 是框架頂部的槽，不是框架；中譯把字母掛到框架上，也漏了 in the top of the frame。模型 models/fig251.js:63 把 label B 標在整個 frame 群組上，跟著錯譯；引用：models/fig251.js:2（框架 B 的楔形槽）、models/fig251.js:98 quote、tests/joints.test.js:172 測試名稱。 |
