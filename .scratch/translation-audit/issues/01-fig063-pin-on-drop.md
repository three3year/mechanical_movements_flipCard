# 01 — 第 63 種:銷應該在落板上,模型把柱子裝在棘爪上

**Status:** open

**Blocked by:** None

模型照舊的誤譯做,中譯已在 2026-10-10 改正(見 [00-4-intermittent.md](../00-4-intermittent.md))。

- **類別**:1(不合原文)。
- **證據**:英文「the spring throws down suddenly the drop, the pin on which strikes the pawl」——銷在落板(drop)上,撞擊的是棘爪。舊中譯「落板撞擊到棘爪的那根柱子」把銷放到棘爪上;模型照舊譯做:柱子裝在棘爪上(`models/fig063.js` 第 23、40 行 `POST`、`POST_AT`),落板只有擋片(第 45、47 行),由擋片壓棘爪的柱子;檔頭第 4、5 行也寫「棘爪的柱子」。
- **建議修法**:銷移到落板上,由落板落下時銷撞棘爪;接觸照舊用外形算。檔頭註解改成新中譯「落板上的銷隨即撞擊棘爪」。
- **同類要一起查**:沒有別張用同一個定義檔。
- **和定案衝突**:沒有查到相關的維護者決定;改之前看 `.scratch/physical-verification/pending.md` 有沒有第 63 種的定案。

- [ ] 模型改成落板上的銷撞棘爪
- [ ] 測試斷言對到新中譯
- [ ] `npm test`、`npm run verify -- 63` 通過
