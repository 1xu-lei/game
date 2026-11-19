"""配置接口的组装层：把 config/ 的内部结构翻译成前端约定的字段。"""

from app.config.rain_types import RAIN_TYPES
from app.config.scenarios import FLOW_LINKS, SCENARIOS


def _flow_role(scene_id: str) -> str:
    outs = [link["to"] for link in FLOW_LINKS if link["from"] == scene_id]
    ins = [link["from"] for link in FLOW_LINKS if link["to"] == scene_id]
    names = {item["id"]: item["name"] for item in SCENARIOS}

    if scene_id == "station":
        return "下游 · 两路汇流的最终压力承受点"
    if ins and outs:
        return f"中游 · 承接{names[ins[0]]} · 排向{names[outs[0]]}"
    if outs:
        return f"上游 · 汇入{names[outs[0]]}"
    return "末端 · 无下游"


def scenario_configs() -> list:
    configs = []
    for item in SCENARIOS:
        configs.append(
            {
                "id": item["id"],
                "name": item["name"],
                "nameEn": item["nameEn"],
                "direction": item["role"],
                "project": " · ".join(item["focus"]),
                "baseNote": f"无专项工程：{item['benefit']}受限",
                "flowRole": _flow_role(item["id"]),
                "accentVar": f"--scene-{item['id']}",
                "asset": f"assets/scenes/{item['id']}.svg",
                "yieldCurve": item["curve"],
                "transfer": item["transfer"],
            }
        )
    return configs


def rain_type_configs() -> list:
    assets = {"continuous": "rain-continuous", "burst": "rain-burst"}
    configs = []
    for item in RAIN_TYPES:
        configs.append(
            {
                "id": item["id"],
                "name": item["name"],
                "nameEn": item["nameEn"],
                "summary": item["summary"],
                "challenge": item["challenge"],
                "weights": item["weights"],
                "asset": f"assets/scenes/{assets[item['id']]}.svg",
            }
        )
    return configs
