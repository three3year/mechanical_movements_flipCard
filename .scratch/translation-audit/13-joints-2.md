# 中譯檢查:接頭與器具 二(第 259–273 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 3 張圖、5 筆(誤譯 2、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 261 | `oriText/29.txt` 第 1 行 | An arm, C, is jointed to the disk and to the upper arm, A | 臂 A 以鉸接方式連接於圓盤與上方的搖臂上 | 臂 C 以鉸接方式連接於圓盤與上方的臂 A 上 | 誤譯:字母錯：鉸接於圓盤與上臂之間的是 C，上方的臂才是 A（中譯把 A 放錯位置並漏了上臂的字母）。模型已照英文做（models/fig261.js:76 rodC 連圓盤與 armA），不受影響。 |
| 261 | `oriText/29.txt` 第 1 行 | This arm carries with it the pulley, E. | 此臂承載著皮帶輪 E | 此臂承載著滑輪 E | 用詞統一:E 是繞繩（cord）的滑輪，沒有皮帶；但全書 pulley 慣譯皮帶輪，若要保持一致可不改，所以列疑問。引用：models/fig261.js:1（左端裝皮帶輪 E）。 |
| 261 | `oriText/29.txt` 第 1 行 | vibrating on the point, G | 繞著點 G 振動 | 繞著點 G 擺動 | 用詞統一:vibrate / vibratory motion:臂 A 繞點 G 擺動 |
| 262 | `oriText/29.txt` 第 3 行 | The first of these figures is an end view | 第一張為前視圖 | 第一張為端視圖 | 誤譯:end view 是沿螺桿軸從端部看的視圖，不是前視圖（front view）；模型初始視角本來就沿螺桿軸看，結構不受影響。引用：models/fig262.js:1、models/fig263.js:1、models/cone-roller.js:1、models/cone-roller.js:28、tests/joints.test.js:319 測試名稱都寫「前視圖」。 |
| 271 | `oriText/30.txt` 第 3 行 | On vibrating the lever | 槓桿振動時 | 槓桿擺動時 | 用詞統一:vibrate / vibratory motion:槓桿繞軸來回擺動;引用:models/fig127.js:1、models/fig271.js:1、models/fig271.js:136、tests/joints.test.js:475、tests/joints.test.js:479 |
