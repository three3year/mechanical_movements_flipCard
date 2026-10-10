# 中譯檢查:齒條與小齒輪(第 113–127 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 5 張圖、5 筆(誤譯 3、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 2)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 118 | `oriText/13.txt` 第 15 行 | A mode of doubling the length of stroke of a piston-rod, or the throw of a crank. | 曲柄的擺動加倍 | 曲柄的偏距（throw）加倍 | 誤譯:throw of a crank 是曲柄的偏距(曲柄半徑,決定行程),曲柄是轉動不是擺動。模型結構不受影響。引用:models/fig118.js:1「(或曲柄的擺動)」。 |
| 121 | `oriText/14.txt` 第 5 行 | produces an intermittent rotary motion of the cog-wheel by means of the click | 棘輪（cog-wheel） | 齒輪（cog-wheel） | 誤譯:cog-wheel 是齒輪,不是棘輪(說明檔所舉的例子)。模型用 gearProfile 做成對稱齒的齒輪,結構與英文一致;但註解、標籤、測試都稱棘輪。引用:models/fig121.js:1-2、6-9、201(label 與 quote),tests/racks.test.js:143、144、151。 |
| 122 | `oriText/14.txt` 第 7 行 | The rotation of the two spur-gears, with crank-wrists attached | 曲柄手腕（crank-wrists） | 曲柄銷（crank-wrists） | 誤譯:wrist / crank-wrist 是曲柄銷,不是「手腕」。引用:models/fig122.js:1、3、33(手腕),tests/racks.test.js:174「兩手腕」。 |
| 124 | `oriText/14.txt` 第 11 行 | the string of which passes around the pulley on the spindle | 心軸（spindle）上的皮帶輪 | 心軸（spindle）上的滑輪 | 用詞統一:pulley:繞的是弓弦(線),依規則用滑輪;引用:models/fig124.js:1-4,13(註解用皮帶輪) |
| 127 | `oriText/14.txt` 第 17 行 | On vibrating the lever | 槓桿振動時 | 槓桿擺動時 | 用詞統一:vibrate / vibratory motion:槓桿繞軸來回擺動;引用:models/fig127.js:1、models/fig271.js:1、models/fig271.js:136、tests/joints.test.js:475、tests/joints.test.js:479 |
