# 中譯檢查:水車與泵 上(第 430–449 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 3 張圖、3 筆(誤譯 2、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 1、用詞統一 0)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 432 | `oriText/48.txt` 第 5 行 | has float-boards like the former | 它如同後者一樣具有浮板 | 它如同後者一樣具有浮板（譯注：原文作 the former，即上射式；依上下文有浮板的應為下射式） | 原文疑誤:原文寫 the former(上射式),中譯寫「後者」(下射式)。按理有浮板的是下射式,中譯是悄悄修正原文,網站沒有勘誤註記;建議保留不改(new 與 old 相同),只提請維護者知悉。模型 fig432.js:1 也寫「像下射式一樣有浮板」。 |
| 439 | `oriText/49.txt` 第 1 行 | a counterweight on the other side of the pulley over which it is suspended | 懸掛於皮帶輪另一側 | 懸掛於滑輪另一側 | 誤譯:水桶是用繩懸掛在 pulley 上,是滑輪,不是皮帶輪(沒有皮帶)。模型 fig439.js 已用滑輪與繩。 |
| 445 | `oriText/49.txt` 第 13 行 | a lower and larger tube, provided with a circular plate below concentric with the orifice which receives the stream from the tube above | 下方管則配備一個與孔口同心的圓板，接收來自上方管的水流 | 下方管則在其下方配備一個圓板，與接收上方管水流的孔口同心 | 誤譯:原文接收水流的是孔口(orifice which receives),中譯變成圓板在接收;另漏了 below。模型結構不受影響,但 models/oscillating-column.js:2 寫「接住細管流下的水」是照中譯的讀法。 |
