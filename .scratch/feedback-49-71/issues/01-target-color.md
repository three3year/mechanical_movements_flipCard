# 01 — 目標件顏色

**Status:** done

模型定義加 `target: <partId>`(或 `targets: [...]`),viewer 以第三種顏色(藍綠)畫該零件;轉向箭頭也用同色。登記表測試:target 必須指向存在的零件。先套用到第 49(上方的斜齒輪)、54(B)、58(下方軸)、63(星形輪)、64/66/67(空心軸)、69(A)、71(C)。

## Comments

**2026-10-03(agent)** — viewer.js 加 TARGET / TARGET_MARK 材質與箭頭色;def.target / targets;kinds.js 與 CONTEXT.md 記下「目標件」;registry 測試檢查目標件存在且不是主動件。已套用:49 top、54 pinionB、58 lowerShaft、63 star、64/66/67 hollow、69 a、70/71 wheel。
