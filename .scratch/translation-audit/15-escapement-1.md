# 中譯檢查:擒縱機構 一(第 288–296 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 4 張圖、10 筆(誤譯 3、漏譯 2、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 5)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 288 | `oriText/32.txt` 第 1 行 | the teeth of which come alternately against the outer surface of the pallet, K, and inner surface of pallet, H | 以及叉瓦 K 的內側表面接觸 | 以及叉瓦 H 的內側表面接觸 | 誤譯:內側表面屬於叉瓦 H,中譯寫成兩次 K。模型兩叉瓦 K(右)、H(左)正確。 |
| 288 | `oriText/32.txt` 第 1 行 | the extremities of teeth slide along the surfaces, c, e, and d, b, and give sufficient impulse to pendulum | 並對擺傳遞小量的衝擊 | 並對擺傳遞足夠的衝擊 | 誤譯:sufficient 是「足夠的」,不是「小量」。models/fig288.js:3 檔頭轉述成「給擺一點衝擊」,跟著舊譯。 |
| 288、289 | `oriText/32.txt` 第 1 行 | impulse | 足夠的衝擊 | 足夠的衝量 | 用詞統一:擒縱機構的 impulse 全書多譯衝量 |
| 288 | `oriText/32.txt` 第 1 行 | to vibrate upon the axis, a | 繞著軸 a 振動 | 繞著軸 a 擺動 | 用詞統一:vibrate / vibratory motion:錨形件繞軸 a 擺動 |
| 291 | `oriText/32.txt` 第 5 行 | and thus allows one tooth of escape-wheel to pass, letting them fall immediately to arrest the next | 並讓擒縱輪落下的齒立即抓住下一齒 | 並讓彈簧 A 與擋止 d 立即落下，擋住下一齒 | 誤譯:them 指被抬起的彈簧 A 與擋止 d,是它們落下去擋住下一齒,不是「擒縱輪落下的齒」。模型(fig291.js:4「A 落回,擋止 d 抓住下一齒」)本來就照英文。 |
| 293 | `oriText/32.txt` 第 9 行 | a notch into which the teeth round the edge of the wheel successively fall | 輪的邊緣便會依序落入該凹槽中 | 輪緣上的齒便會依序落入該凹槽中 | 漏譯:漏了 teeth:落進凹槽的是輪緣一圈的齒,不是輪緣本身。模型照英文做(長齒齒尖落進凹槽);models/fig293.js:124 的 quote 引用了舊句。 |
| 293 | `oriText/32.txt` 第 9 行 | impulse | 接收到一個衝擊 | 接收到一個衝量 | 用詞統一:同上 |
| 293 | `oriText/32.txt` 第 9 行 | impulse pallet | 通過衝擊叉瓦 B | 通過衝量叉瓦（impulse pallet）B | 用詞統一:impulse pallet 是受衝量的叉瓦,「衝擊叉瓦」讀起來像動詞 |
| 296 | `oriText/32.txt` 第 13 行 | The wheel gives an impulse to each of the pallets alternately as it leaves a tooth | 會對叉瓦傳遞一個衝擊 | 會交替地對兩個叉瓦各傳遞一個衝擊 | 漏譯:漏了 each of the pallets alternately(兩個叉瓦輪流受衝擊)。 |
| 296 | `oriText/32.txt` 第 13 行 | impulse | 各傳遞一個衝擊 | 各傳遞一個衝量 | 用詞統一:同上 |
