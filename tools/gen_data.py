"""從 oriText/*.txt 逐字生成 data.js,確保文字與原文完全一致。

用法:python tools/gen_data.py

oriText/ 下所有 txt 依檔名排序讀入、串成一份依原書編號排列的條目清單
(用途另由手寫維護的 uses.js 掛上,不在這裡產生)。條目標頭支援三種格式:
  「5. 」               單一編號
  「16 與 17. 」        兩個編號共用一段文字
  「19、20、21 與 22. 」多個編號共用一段文字
無編號段落掛在前一個條目(如 01.txt 第 5 行掛在第 2 條)。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DST = ROOT / "data.js"

HEADER_RE = re.compile(r"^((?:\d+[、.]?\s*(?:與\s*)?)+)\.\s*(.+)$")

def collapse(nos):
    """[19,20,21,22] -> '19–22';[16,17] -> '16–17';[5] -> '5'"""
    if len(nos) == 1:
        return str(nos[0])
    if nos == list(range(nos[0], nos[-1] + 1)):
        return f"{nos[0]}–{nos[-1]}"
    return "、".join(map(str, nos))

def parse_file(path):
    entries = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue
        m = HEADER_RE.match(line)
        if m:
            nos = [int(n) for n in re.findall(r"\d+", m.group(1))]
            entries.append({
                "nos": nos,
                "no": collapse(nos),
                "images": [f"images/{n}.png" for n in nos],
                "text": [m.group(2)],
            })
        else:
            entries[-1]["text"].append(line)
    return entries

all_entries = []
for path in sorted((ROOT / "oriText").glob("*.txt")):
    all_entries.extend(parse_file(path))

all_entries.sort(key=lambda e: e["nos"][0])
entries = [{k: e[k] for k in ("no", "images", "text")} for e in all_entries]

header = (
    "// 機構圖鑑資料(由 tools/gen_data.py 從 oriText/*.txt 生成,勿手動編輯)。\n"
    "// 依原書編號排列的條目清單;新增內容:txt 放進 oriText/、圖放進 images/ 後重跑。\n"
)
body = json.dumps(entries, ensure_ascii=False, indent=2)
DST.write_text(header + "const entries = " + body + ";\n", encoding="utf-8", newline="\n")

covered = {n for e in all_entries for n in e["nos"]}
print(f"{len(entries)} cards, {sum(len(e['images']) for e in entries)} figures")
missing_img = [f"images/{n}.png" for n in sorted(covered) if not (ROOT / "images" / f"{n}.png").exists()]
orphan_img = sorted(
    int(p.stem) for p in (ROOT / "images").glob("*.png")
    if p.stem.isdigit() and int(p.stem) not in covered
)
print("text without image:", missing_img or "none")
print("image without text:", orphan_img or "none")
