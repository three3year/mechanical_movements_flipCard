# 02 — 頁碼搜尋跳轉

**Status:** done

頁首加「跳到圖號」輸入框:輸入數字按 Enter 或按鈕,找到該圖所在卡片(用現有 findEntry),切章、選中該圖、清掉返回堆疊;找不到時輸入框短暫標紅。鍵盤翻頁在輸入框內不觸發(現有 keydown 已排除 input)。

## Comments

**2026-10-03(agent)** — index.html 頁籤下方加 form#goto;用 findEntry 跳頁、清返回堆疊、選中該圖;Playwright 驗證:164 跳到引擎章、40 跳到 40–41 卡片。超出 1–507 由瀏覽器原生驗證擋下,其餘找不到時標紅。
