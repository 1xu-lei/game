"""联动规则判定（规格书 §3.6）。

阈值与收益一律从 config/synergies.py 读取，本文件不含任何写死的阈值或分值。
联动以「协同奖励分 + 事件说明」体现，不额外改写水量，
以免同一份收益既记账在水流上又记账在奖励上、造成重复计算。
"""

from dataclasses import dataclass

from app.config.scenarios import SCENARIO_BY_ID
from app.config.synergies import SYNERGIES


@dataclass(frozen=True)
class SynergyHit:
    id: str
    name: str
    detail: str
    effect: str
    bonus: float


def _describe(conditions: dict, allocation: dict) -> str:
    parts = []
    for scene_id, threshold in conditions.items():
        name = SCENARIO_BY_ID[scene_id]["name"]
        parts.append(f"{name} {allocation[scene_id]} 点 ≥ 阈值 {threshold}")
    return "，".join(parts)


def evaluate_synergies(allocation: dict) -> list:
    """按配置顺序返回触发的联动（顺序固定，保证输出稳定可复现）。"""
    hits = []
    for rule in SYNERGIES:
        if all(allocation[scene_id] >= threshold for scene_id, threshold in rule["conditions"].items()):
            hits.append(
                SynergyHit(
                    id=rule["id"],
                    name=rule["name"],
                    detail=f"{_describe(rule['conditions'], allocation)}：{rule['effect']}",
                    effect=rule["effect"],
                    bonus=rule["bonus"],
                )
            )
    return hits


def total_bonus(hits: list) -> float:
    return sum(hit.bonus for hit in hits)


def unmet_rule_summary(allocation: dict) -> list:
    """未触发的联动及其缺口，用于结果页解释「为什么没有联动」。"""
    summary = []
    for rule in SYNERGIES:
        if all(allocation[scene_id] >= threshold for scene_id, threshold in rule["conditions"].items()):
            continue
        gaps = [
            f"{SCENARIO_BY_ID[scene_id]['name']}还差 {threshold - allocation[scene_id]} 点"
            for scene_id, threshold in rule["conditions"].items()
            if allocation[scene_id] < threshold
        ]
        summary.append({"id": rule["id"], "name": rule["name"], "gap": "，".join(gaps)})
    return summary
