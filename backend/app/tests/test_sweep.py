"""全组合采样：C(9,4)=126 种分配 × 2 雨型 = 252 组（规格书 §9.1 的反「固定最优解」要求）。

断言只使用引擎真实输出，不预置任何期望分值。
"""

from app.config.scenarios import SCENARIO_ORDER
from app.engine.simulation import score_only, simulate


def compositions(total: int, parts: int):
    """把 total 点分成 parts 份的全部非负整数解（枚举顺序固定）。"""
    if parts == 1:
        yield (total,)
        return
    for first in range(total + 1):
        for rest in compositions(total - first, parts - 1):
            yield (first,) + rest


def all_allocations():
    result = []
    for combo in compositions(5, len(SCENARIO_ORDER)):
        result.append({scene_id: points for scene_id, points in zip(SCENARIO_ORDER, combo)})
    return result


def test_composition_count_is_126():
    assert len(all_allocations()) == 126


def test_sweep_all_252_runs_stay_in_range_and_are_distinct_enough():
    scores = {"continuous": {}, "burst": {}}
    for allocation in all_allocations():
        for rain in ("continuous", "burst"):
            score = score_only(allocation, rain)
            assert 0 <= score <= 100
            key = tuple(allocation[scene_id] for scene_id in SCENARIO_ORDER)
            scores[rain][key] = score

    assert len(scores["continuous"]) == 126
    assert len(scores["burst"]) == 126

    distinct = len(set(scores["continuous"].values()) | set(scores["burst"].values()))
    # 分数必须有足够区分度，不能成批相同
    assert distinct > 60, f"不同分值只有 {distinct} 个，区分度不足"


def test_no_single_allocation_dominates_both_rain_types():
    best = {}
    for rain in ("continuous", "burst"):
        ranked = sorted(
            (
                (score_only(allocation, rain), tuple(allocation[scene_id] for scene_id in SCENARIO_ORDER))
                for allocation in all_allocations()
            ),
            reverse=True,
        )
        best[rain] = ranked[0][1]

    # 两种雨型的最优配置不能是同一个，否则等于存在「固定最优解」
    assert best["continuous"] != best["burst"], (
        f"两种雨型最优配置相同：{best['continuous']}，存在固定最优解"
    )


def test_full_simulation_matches_lightweight_score():
    allocation = {"school": 0, "market": 0, "park": 3, "residential": 0, "station": 2}
    for rain in ("continuous", "burst"):
        assert simulate(allocation, rain)["overallScore"] == score_only(allocation, rain)
