# 中譯檢查:運動轉換與應用 上(第 128–141 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 5 張圖、6 筆(誤譯 3、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 129 | `oriText/15.txt` 第 3 行 | The movement of the pulley in every revolution of the windlass | 皮帶輪的移動距離 | 滑輪的移動距離 | 誤譯:這個 pulley 是掛在繩圈裡、吊著重物的動滑輪,沒有皮帶;模型(fig129.js 檔頭)與測試(tests/conversion.test.js:55)都已稱滑輪。 |
| 131 | `oriText/15.txt` 第 7 行 | the vibration of the toothed sector | 齒扇形段的振動 | 齒扇形段的擺動 | 用詞統一:vibrate / vibratory motion:齒扇繞軸來回擺動 |
| 132 | `oriText/15.txt` 第 9 行 | Horizontal motion is given to the arm of the lever which turns the upper disk. | 水平運動施加於承載槓桿的臂上 | 水平運動施加於槓桿的臂上 | 誤譯:arm of the lever 是槓桿本身的臂,不是「承載槓桿的臂」;模型照英文(推動上圓盤的槓桿)。 |
| 136 | `oriText/15.txt` 第 17 行 | On turning the wheel, alternate rectilinear motion is communicated to the rod. | 桿便會傳遞出交替方向的直線運動 | 交替方向的直線運動便會傳遞給桿 | 誤譯:主被動弄反:運動是傳給桿,不是桿傳出去。模型照英文(桿被推動)。 |
| 137 | `oriText/16.txt` 第 1 行 | the forked vibrating arm | 叉形振動臂 | 叉形擺動臂 | 用詞統一:vibrate / vibratory motion:叉形臂繞樞軸擺動;引用:models/fig137.js:1、models/fig137.js:88 |
| 137 | `oriText/16.txt` 第 1 行 | to the bottom of which the valve-rod is attached | 該振動臂的底部 | 該擺動臂的底部 | 用詞統一:vibrate / vibratory motion:同上 |
