# 中譯檢查:儀錶與周轉輪系(第 495–507 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 5 張圖、7 筆(誤譯 1、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 2、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 495 | `oriText/55.txt` 第 5 行 | is fitted to rotate on stud, E, secured to shaft, D | 固定於軸上的凸柱 E | 固定於軸 D 上的凸柱 E | 漏譯:漏了軸的字母 D。models/fig495.js:1 引用同樣漏 D 的句子。 |
| 495 | `oriText/55.txt` 第 5 行 | the gear, E, revolves around A, and also rotates upon its own axis | 齒輪 E 會繞著 A 公轉 | 齒輪 B 會繞著 A 公轉（譯注：原文作齒輪 E，E 是凸柱，依上下文應為齒輪 B） | 原文疑誤:英文本身寫 E,但 E 是凸柱,依上下文公轉兼自轉的是齒輪 B(疑原書筆誤,網站無勘誤註記)。模型 fig495.js:2 已寫 B。 |
| 495 | `oriText/55.txt` 第 5 行 | bevel-gear | 斜齒輪(2 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 499 | `oriText/55.txt` 第 13 行 | The ends of tube are connected with a toothed sector-piece gearing, with a pinion on the spindle of a pointer | 齒形扇形段齒輪機構上，與 | 齒形扇形段上，扇形段與 | 誤譯:gearing 在此是分詞「與…嚙合」,不是名詞「齒輪機構」。模型結構(扇形段咬小齒輪)正確;檔頭 models/fig499.js:2 引用「齒形扇形段的機構」。 |
| 501 | `oriText/55.txt` 第 17 行 | or cord and pulley, with the spindle of the pointer | 繩索與皮帶輪 | 繩索與滑輪 | 用詞統一:pulley:繞繩索;models/fig501.js:3 已寫滑輪 |
| 503 | `oriText/56.txt` 第 5 行 | bevel-gear | 斜齒輪(2 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 504 | `oriText/56.txt` 第 7 行 | as the arm, E, C, D, is turned round | 當臂 E、C、D 被轉動時 | 當臂 C、D 被轉動時（譯注：原文作臂 E、C、D，E 是輪，依上下文應為臂 C、D） | 原文疑誤:英文本身寫 arm, E, C, D,但前文臂只標 C、D,E 是輪,疑原書筆誤;網站無勘誤註記。模型 fig504.js 只用臂 C、D。 |
