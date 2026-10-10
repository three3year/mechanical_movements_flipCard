# 04 — 第 251 種:B 是框架頂部的槽,模型把 B 標在整個框架上

**Status:** resolved

**Blocked by:** None

- **類別**:1(不合原文)、5(記號)。
- **證據**:英文「are pressed inward by the sides of the slot, B, in the top of the frame」。舊中譯「被框架 B 的槽兩側向內壓」把 B 掛到框架上,已改成「被框架頂部的槽 B 兩側向內壓」。模型 `models/fig251.js` 第 63 行把標籤 B 放在整個 frame 群組上;第 2 行檔頭(框架 B 的楔形槽)、第 98 行 quote、`tests/joints.test.js` 第 172 行測試名稱都照舊句。
- **建議修法**:標籤 B 移到框架頂部的槽;註解、quote、測試名稱改成新中譯。
- **同類要一起查**:沒有。
- **和定案衝突**:沒有。

- [x] 標籤與引用改好,`npm test` 通過

## Comments

2026-10-10 已做:標籤 B 從整個框架移到框架頂部、兩側槽壁之間(`slotB`);檔頭、quote、測試名稱照新中譯。新測試:框架不標 B、B 在槽裡。`npm test`、`npm run verify -- 251` 通過,截圖確認。
