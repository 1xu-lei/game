"""资源分配校验与通用取整（规格书 §3.1）。

纯计算，不依赖 FastAPI / SQLAlchemy / 任何渲染逻辑。
"""

import math

from app.config.scoring import BUDGET_TOTAL, POINTS_MAX, POINTS_MIN
from app.config.scenarios import SCENARIO_ORDER


def round_half_up(value: float, digits: int = 1) -> float:
    """确定性四舍五入（不用内置 round 的银行家舍入，避免边界上出现意外的 0.5 抖动）。"""
    factor = 10 ** digits
    return math.floor(value * factor + 0.5) / factor


def total_points(allocation: dict) -> int:
    return sum(allocation[scene_id] for scene_id in SCENARIO_ORDER)


def validate_allocation(allocation: dict) -> list:
    """返回错误信息列表，空列表表示合法（总和恰好 5、每场景 0-5 整数、字段完整）。"""
    errors = []
    missing = [scene_id for scene_id in SCENARIO_ORDER if scene_id not in allocation]
    unknown = [key for key in allocation if key not in SCENARIO_ORDER]
    if missing:
        errors.append("缺少场景字段：" + "、".join(missing))
    if unknown:
        errors.append("存在未知场景字段：" + "、".join(sorted(unknown)))
    if errors:
        return errors

    for scene_id in SCENARIO_ORDER:
        points = allocation[scene_id]
        if isinstance(points, bool) or not isinstance(points, int):
            errors.append(f"{scene_id} 的投入必须为整数")
        elif points < POINTS_MIN or points > POINTS_MAX:
            errors.append(f"{scene_id} 的投入必须在 {POINTS_MIN}-{POINTS_MAX} 之间")
    if errors:
        return errors

    total = total_points(allocation)
    if total < BUDGET_TOTAL:
        errors.append(f"投入总和为 {total}，必须恰好等于 {BUDGET_TOTAL}（还差 {BUDGET_TOTAL - total} 点）")
    elif total > BUDGET_TOTAL:
        errors.append(f"投入总和为 {total}，必须恰好等于 {BUDGET_TOTAL}（超出 {total - BUDGET_TOTAL} 点）")
    return errors
