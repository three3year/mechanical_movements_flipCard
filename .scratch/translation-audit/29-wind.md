# 中譯檢查:風力、船舶與起重(第 484–494 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 3 張圖、3 筆(誤譯 1、漏譯 0、增譯 1、網站勘誤 0、原文疑誤 0、用詞統一 1)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 490 | `oriText/54.txt` 第 13 行 | a rope which passes round the guide-pulleys | 導引皮帶輪 | 導引滑輪 | 用詞統一:pulley:導引繩索;models/fig490.js 已寫導引滑輪 |
| 492 | `oriText/54.txt` 第 17 行 | Boat-detaching hook (Brown & Level's). | Brown & Level 的專利 | Brown & Level 的 | 增譯:英文沒有 patent(其他圖寫了 patent 才譯專利)。引用:models/fig492.js:1。 |
| 494 | `oriText/55.txt` 第 3 行 | The pull on the shackle which connects the two links causes the latter so to act on the upper arms of the tongs | 拉動連接兩個環節的鉤環時，環節會 | 拉動連接兩根連桿的鉤環時，連桿會 | 誤譯:links 在吊鉗上是接鉤環與鉗臂上端的兩根連桿,「環節」易讀成鏈環;但 link 也可譯鏈節,故列疑問。模型 linkL/linkR 已是桿,結構與英文一致。引用:models/fig494.js:1、:4、:5,tests/wind.test.js:136 測試名稱。 |
