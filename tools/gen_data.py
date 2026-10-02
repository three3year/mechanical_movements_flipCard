"""從 oriText/*.txt 逐字生成 data.js,確保文字與原文完全一致。

用法:python tools/gen_data.py

oriText/ 下所有 txt 依檔名排序讀入、串成一份條目清單,再依編號範圍分章
(章節邊界與檔案邊界無關)。條目標頭支援三種格式:
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

# 章節依編號範圍劃分;新章節在這裡加一筆 (標題, 起始編號, 結束編號)
RANGES = [
    ("皮帶與滑輪", 1, 23),
    ("齒輪傳動", 24, 49),
    ("離合與變速", 50, 62),
    ("間歇與棘輪運動", 63, 85),
    ("曲柄與凸輪", 86, 101),
    ("螺旋機構", 102, 112),
    ("齒條與小齒輪", 113, 127),
    ("運動轉換與應用", 128, 154),
    ("引擎與調速機構", 155, 190),
    ("變速與曼格機構", 191, 224),
    ("棘輪與擒縱", 225, 242),
    ("接頭與器具", 243, 287),
    ("擒縱機構", 288, 314),
    ("擺與鐘錶調節", 315, 321),
    ("平行運動與引擎", 322, 349),
    ("雜項裝置", 350, 402),
    ("繪圖儀器", 403, 411),
    ("雜項與旋轉引擎", 412, 429),
    ("水車與泵", 430, 469),
    ("蒸汽與氣體裝置", 470, 483),
    ("風力、船舶與起重", 484, 494),
    ("儀錶與周轉輪系", 495, 9999),
]

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

chapters = []
for title, lo, hi in RANGES:
    entries = sorted((e for e in all_entries if lo <= e["nos"][0] <= hi), key=lambda e: e["nos"][0])
    if entries:
        chapters.append({
            "title": title,
            "entries": [{k: e[k] for k in ("no", "images", "text")} for e in entries],
        })

header = (
    "// 機構圖鑑資料(由 tools/gen_data.py 從 oriText/*.txt 生成,勿手動編輯)。\n"
    "// 新增內容:txt 放進 oriText/、圖放進 images/;章節範圍在 gen_data.py 的 RANGES 調整後重跑。\n"
)
body = json.dumps(chapters, ensure_ascii=False, indent=2)
DST.write_text(header + "const chapters = " + body + ";\n", encoding="utf-8", newline="\n")

covered = {n for e in all_entries for n in e["nos"]}
for ch in chapters:
    cards = len(ch["entries"])
    figs = sum(len(e["images"]) for e in ch["entries"])
    print(f"{ch['title']}: {cards} cards, {figs} figures")
missing_img = [f"images/{n}.png" for n in sorted(covered) if not (ROOT / "images" / f"{n}.png").exists()]
orphan_img = sorted(
    int(p.stem) for p in (ROOT / "images").glob("*.png")
    if p.stem.isdigit() and int(p.stem) not in covered
)
print("text without image:", missing_img or "none")
print("image without text:", orphan_img or "none")
