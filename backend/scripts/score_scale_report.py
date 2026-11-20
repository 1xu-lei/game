"""评分尺度报告：raw→display 区间重标定的唯一验收口径。

枚举 C(9,4)=126 种分配 × 2 雨型 = 252 组真实引擎输出，
打印 min / max / distinct 与 C 档可达性；尺度一旦退化即非零退出。

用法：backend\\.venv\\Scripts\\python.exe backend\\scripts\\score_scale_report.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config.scenarios import SCENARIO_ORDER  # noqa: E402
from app.config.scoring import SCORING  # noqa: E402
from app.engine.simulation import score_only  # noqa: E402

RAIN_TYPE_IDS = ("continuous", "burst")
C_GRADE_MIN = next(grade["min_score"] for grade in SCORING["grades"] if grade["grade"] == "C")
MAX_SCORE_MIN = 92.0
DISTINCT_MIN = 60


def compositions(total, parts):
    """把 total 点分成 parts 份的全部非负整数解（枚举顺序固定）。"""
    if parts == 1:
        yield (total,)
        return
    for first in range(total + 1):
        for rest in compositions(total - first, parts - 1):
            yield (first,) + rest


def all_allocations():
    return [
        {scene_id: points for scene_id, points in zip(SCENARIO_ORDER, combo)}
        for combo in compositions(5, len(SCENARIO_ORDER))
    ]


def main() -> int:
    rows = []
    for allocation in all_allocations():
        for rain_type_id in RAIN_TYPE_IDS:
            rows.append((score_only(allocation, rain_type_id), rain_type_id, allocation))

    scores = [row[0] for row in rows]
    lowest = min(scores)
    highest = max(scores)
    distinct = len(set(scores))
    c_reachable = any(score >= C_GRADE_MIN for score in scores)

    best = max(rows, key=lambda row: row[0])
    worst = min(rows, key=lambda row: row[0])
    grade_counts = {}
    for score in scores:
        grade = next(grade["grade"] for grade in SCORING["grades"] if score >= grade["min_score"])
        grade_counts[grade] = grade_counts.get(grade, 0) + 1

    print(f"min={lowest:.1f} max={highest:.1f} distinct={distinct} c_reachable={c_reachable}")
    print(f"c_grade_min={C_GRADE_MIN} rows={len(rows)} raw_floor={SCORING['raw_score_floor']} "
          f"raw_ceiling={SCORING['raw_score_ceiling']}")
    print(f"best={best[1]} {best[2]} -> {best[0]}")
    print(f"worst={worst[1]} {worst[2]} -> {worst[0]}")
    print("grades=" + " ".join(f"{grade}:{grade_counts.get(grade, 0)}" for grade in ("S", "A", "B", "C", "D")))

    assert highest >= MAX_SCORE_MIN, f"最高分只有 {highest}，进不了 90 分档"
    assert distinct >= DISTINCT_MIN, f"不同分值只有 {distinct} 个，区分度不足"
    assert c_reachable, f"没有任何配置达到 C 档（{C_GRADE_MIN}）"
    return 0


if __name__ == "__main__":
    sys.exit(main())
