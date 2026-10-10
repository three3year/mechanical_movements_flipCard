# 03 — 第 145 種:原文說小支架本身做水平往復,模型的支架固定

**Status:** resolved

**Blocked by:** None

- **類別**:1(不合原文)。
- **證據**:英文「The small standard at the right, to which is attached one end of the lever, has a horizontal reciprocating rectilinear movement」——主詞是小支架。舊中譯把「具有水平的往復直線運動」接在槓桿後面,已改正;同句的 left/right 照網站勘誤改成右側(模型的支架本來就在右側,`fig145.js` 的 `B = [3.35, 0, 0]`)。模型的支架是固定的,沒有水平往復。
- **建議修法**:支架做成在水平導軌上滑動。但支架可滑時機構多一個自由度,要另外想清楚由什麼決定支架的位置(原文沒說)。請維護者判斷:(a)讓支架滑動並推斷約束;(b)維持固定,在註解寫明和原文不同、為什麼。
- **同類要一起查**:沒有。
- **和定案衝突**:第 145 種的主動件、目標件在複查時換過(樑 → 飛輪),見 `.scratch/recheck-86-507/tables/README.md`,改之前一起看。

- [x] 維護者在 (a)、(b) 之間決定
- [x] 照決定改模型或註解

## Comments

維護者 2026-10-10 決定:(b) 維持固定。已在 `models/fig145.js` 檔頭寫明和原文不同之處與理由,並補記在 `.scratch/physical-verification/pending.md` 第 5 族。
