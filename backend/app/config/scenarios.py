"""五场景配置（规格书 §2 / §3.5）。

数值全部来自仓库根 rules/rules.json 的 scenarios / flowLinks 段，本文件只做装配与常量导出，
不再硬编码任何曲线、转移系数或暴露度。收益曲线仍各场景独立配置（禁止五场景共用一条曲线）。

其余参数含义：
- exposure.volume / exposure.peak：场景在「总量型 / 峰值型」两个维度上的暴露度，
  由雨型权重加权成实际负荷（见 rain_types.py）。
- transfer：未被本地防护拦下的残余径流向下游传递的比例（固定水流关系）。
- rollup：该场景的压力承载力上限，total / rollup 越接近 1 表示越接近失守。
- 调平衡只改 rules/rules.json，不改本文件。
"""

from app.config.rules_loader import RULES

SCENARIO_ORDER = list(RULES["scenarioOrder"])

SCENARIOS = [RULES["scenarios"][scene_id] for scene_id in SCENARIO_ORDER]

SCENARIO_BY_ID = {item["id"]: item for item in SCENARIOS}

# 固定水流关系（规格书 §2.3：禁止随机连线、禁止增删）
FLOW_LINKS = RULES["flowLinks"]


def curve_value(scenario_id: str, points: int) -> float:
    """某场景某档位的防护覆盖度。"""
    return SCENARIO_BY_ID[scenario_id]["curve"][points]


def upstream_of(scenario_id: str) -> list:
    """固定水流关系上的上游场景（只读 FLOW_LINKS，禁止其它连线）。"""
    return [link["from"] for link in FLOW_LINKS if link["to"] == scenario_id]
