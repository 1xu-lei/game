"""评分与风险指标（规格书 §4.3 / §4.4）。

全部为确定性算术：同输入必得同输出，不含随机数、时间或顺序依赖。
所有参数（权重、映射区间、等级阈值）来自 config/scoring.py。
"""

from app.config.rain_types import RAIN_TYPE_BY_ID
from app.config.scenarios import SCENARIO_BY_ID, SCENARIO_ORDER
from app.config.scoring import SCORING
from app.engine.allocation import round_half_up
from app.engine.flow import clamp


def raw_score(water: dict, rain_type: dict, synergy_bonus: float) -> float:
    """raw = Σ 权重 * 各场景净安全度 + 联动奖励（0-100 区间）。"""
    weights = rain_type["score_weights"]
    weighted = sum(weights[scene_id] * water[scene_id].safety for scene_id in SCENARIO_ORDER)
    return weighted + synergy_bonus


def display_score(raw: float) -> float:
    """raw → 展示分的单调线性映射，保留 1 位小数（不改变任何配置之间的排序）。"""
    low_raw = SCORING["raw_score_floor"]
    high_raw = SCORING["raw_score_ceiling"]
    low_out = SCORING["display_score_floor"]
    high_out = SCORING["display_score_ceiling"]
    ratio = (raw - low_raw) / (high_raw - low_raw)
    mapped = low_out + ratio * (high_out - low_out)
    mapped = clamp(mapped, SCORING["score_min"], SCORING["score_max"])
    return round_half_up(mapped, 1)


def grade_of(score: float) -> tuple:
    for grade in SCORING["grades"]:
        if score >= grade["min_score"]:
            return grade["grade"], grade["label"]
    last = SCORING["grades"][-1]
    return last["grade"], last["label"]


def _weighted_ratio(water: dict, weights: dict) -> float:
    return sum(weight * water[scene_id].ratio for scene_id, weight in weights.items())


def risk_metrics(water: dict) -> dict:
    """项目自定义 0-100 简化指标，不是真实工程单位。"""
    waterlog = 100.0 * clamp(_weighted_ratio(water, SCORING["risk_weights"]["waterlog"]), 0.0, 1.0)
    loss = 100.0 * clamp(_weighted_ratio(water, SCORING["risk_weights"]["loss"]), 0.0, 1.0)
    station_pressure = 100.0 * clamp(water["station"].ratio, 0.0, 1.0)
    drainage_load = 100.0 * clamp(
        water["station"].ratio / SCORING["drainage_capacity_ratio"], 0.0, 1.0
    )
    return {
        "waterlogRisk": int(round_half_up(waterlog, 0)),
        "lossRisk": int(round_half_up(loss, 0)),
        "stationPressure": int(round_half_up(station_pressure, 0)),
        "drainageLoad": int(round_half_up(drainage_load, 0)),
    }


def forecast(rain_type: dict, waterlog_risk: int, loss_risk: int) -> list:
    """城市状态预测双线（阶段系数来自配置，仅用于展示阶段变化，不参与评分）。"""
    weights = rain_type["weights"]
    steps = SCORING["forecast_steps"]
    factors = SCORING["forecast_factors"]
    waterlog_scale = 0.86 + weights["peak"] * 0.28
    loss_scale = 0.82 + weights["volume"] * 0.30
    points = []
    for step, factor in zip(steps, factors):
        points.append(
            {
                "step": step,
                "waterlog": min(100, int(round_half_up(waterlog_risk * factor * waterlog_scale, 0))),
                "loss": min(100, int(round_half_up(loss_risk * factor * loss_scale, 0))),
            }
        )
    return points


def rain_type_name(rain_type_id: str) -> str:
    return RAIN_TYPE_BY_ID[rain_type_id]["name"]


def scene_name(scene_id: str) -> str:
    return SCENARIO_BY_ID[scene_id]["name"]
