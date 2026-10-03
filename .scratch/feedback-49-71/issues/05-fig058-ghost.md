# 05 — 第 58 種:非作用輪半透明

**Status:** done

pose 可對零件回傳 `ghost: true`,viewer 把該零件換成半透明材質。第 58 種:皮帶所在的輪、它那一軸的齒輪與下方軸的對應齒輪不透明,其餘皮帶輪與齒輪半透明;鬆動輪狀態下只有鬆動輪不透明。

## Comments

**2026-10-03(agent)** — viewer apply() 讀 pose 的 ghost:材質換成半透明(紙色改灰)並移到不描邊那一層。fig058 依狀態標 ghost,下方軸獨立成 lowerShaft(目標件)。
