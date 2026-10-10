# 中譯檢查:蒸汽與氣體裝置(第 470–483 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 7 張圖、15 筆(誤譯 7、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 7)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 470 | `oriText/52.txt` 第 9 行 | Cylinder fixed above | 圓筒固定於上方 | 汽缸固定於上方 | 用詞統一:cylinder:蒸汽錘,引擎裡裝活塞的 cylinder |
| 471 | `oriText/52.txt` 第 11 行 | As the cylinder ascends, air entering hole, e, is compressed below piston and lifts hammer. | 從進氣孔 c 進入 | 從進氣孔 e 進入 | 誤譯:英文兩處都是同一個孔 e(應是汽缸壁中段一個孔,活塞經過時補氣),中譯第一處寫成 c。模型照錯譯做成兩個孔:models/fig471.js:69 holeC 標 c(:99 放在汽缸下端)、:70 holeE 在上端;檔頭 fig471.js:2 引用「進氣孔 c」。建議對照插圖確認孔數後改模型。 |
| 471 | `oriText/52.txt` 第 11 行 | a piston fitted to a cylinder, B | 圓筒 B 中 | 汽缸 B 中 | 用詞統一:cylinder:空氣錘裡裝活塞的 cylinder(氣動) |
| 471 | `oriText/52.txt` 第 11 行 | which is connected by a rod, D | 圓筒透過桿 D | 汽缸透過桿 D | 用詞統一:cylinder:空氣錘裡裝活塞的 cylinder(氣動) |
| 471 | `oriText/52.txt` 第 11 行 | As the cylinder ascends | 當圓筒上升時 | 當汽缸上升時 | 用詞統一:cylinder:空氣錘裡裝活塞的 cylinder(氣動) |
| 471 | `oriText/52.txt` 第 11 行 | As cylinder descends | 當圓筒下降時 | 當汽缸下降時 | 用詞統一:cylinder:空氣錘裡裝活塞的 cylinder(氣動) |
| 472 | `oriText/52.txt` 第 13 行 | works in a cylinder, B | 於圓筒 B 中作動 | 於汽缸 B 中作動 | 用詞統一:cylinder:空氣錘裡裝活塞的 cylinder(氣動) |
| 473 | `oriText/52.txt` 第 15 行 | the pipe from shaft or space to be exhausted | 軸井 | 豎井 | 誤譯:shaft 在此是礦坑的豎井(句末 deep shaft 中譯也作豎井),不是軸。models/fig473.js:1 已寫豎井。 |
| 477 | `oriText/53.txt` 第 5 行 | (Hoard & Wiggin's patent) | Heard & Wiggin | Hoard & Wiggin | 誤譯:網站英文作 Hoard,中譯作 Heard;拿不準是哪一邊的抄寫/OCR 差異,網站無勘誤註記。models/fig477.js:1 引用 Heard。 |
| 477 | `oriText/53.txt` 第 5 行 | the diaphragm expands and raises valve up to the seat, a, a. | 將閥門抬升至出口 a、a 處 | 將閥門抬升至閥座 a、a 處 | 誤譯:seat 是閥座,不是出口。模型結構已當閥座(models/fig477.js:44「閥座 a、a」、:80 waiver 也說閥座),但檔頭 fig477.js:3 引用「頂到出口 a、a 處」,:6 推斷也稱「出口 a、a」。 |
| 478 | `oriText/53.txt` 第 7 行 | which terminates in the middle of an attached hollow sphere, C. | 所附空心球體的中央 | 所附空心球體 C 的中央 | 漏譯:漏了零件字母 C;模型 fig478.js:70 有標 C,檔頭 :1 也有 C。 |
| 478 | `oriText/53.txt` 第 7 行 | a loaded elbow lever, D | 加重的肘節槓桿 D | 加重的肘形槓桿 D | 用詞統一:elbow lever 是彎成肘形的槓桿(角槓桿),「肘節」通常指 toggle;全書(如第 155 種)也用肘節槓桿,屬術語統一問題,拿不準要不要改。模型做成彎折的槓桿,結構與英文一致。引用:models/fig478.js:2、tests/steam.test.js:116。 |
| 482 | `oriText/53.txt` 第 15 行 | The regulator-valve, D, of which a separate outside view is given | 另以側視圖示出 | 另單獨示出其外觀圖 | 誤譯:outside view 是外觀圖,不是側視圖。引用:models/fig482.js:2「另以側視圖示出」。 |
| 482 | `oriText/53.txt` 第 15 行 | there are notches, b, in the valve | 閥門上有缺口 h | 閥門上有缺口 b | 誤譯:零件字母 b 誤為 h。模型沒有畫 h 標籤,但註解引用:models/fig482.js:3、:20。 |
| 482 | `oriText/53.txt` 第 15 行 | contracting the opening notches, b | 縮小缺口 h 的開口 | 縮小缺口 b 的開口 | 誤譯:同上,字母 b 誤為 h。引用:models/fig482.js:4、:82(讀數標籤「缺口 h 的開口」,畫面文字)、tests/steam.test.js:148(斷言訊息「缺口 h 縮小」)。 |
