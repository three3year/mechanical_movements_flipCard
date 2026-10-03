# 08 — 第 64、66、67 種:落下要演出來

**Status:** done

jumps.pushAndFall 增加落下過程:到臨界點後,從動件在主動量接下來的一小段裡以加速(重力式)曲線落過 fall 的角度,再停住;不再瞬移。測試:落下期間轉角單調且先慢後快。

## Comments

**2026-10-03(agent)** — jumps.pushAndFall 加 drop 參數與 falling() 曲線(0.5−0.5cos(π·t^1.7));wormJump 預設 drop = 8°(蝸輪角,約 0.7 秒)。測試改為:落下連續、單步 < 0.3、先慢後快。
