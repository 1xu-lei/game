"""简化汇流计算（规格书 §4.2 第 3-5 步）。

只沿 scenarios.FLOW_LINKS 的固定关系计算，禁止随机连线或额外连线：
school → park，market → residential，park + residential → station。

单位说明：全部为项目自定义的「0-1 相对负荷」，最终换算成 0-100 简化指标，
不代表任何真实工程水量或水文学单位。
"""

from dataclasses import dataclass

from app.config.scenarios import SCENARIO_BY_ID, SCENARIO_ORDER, upstream_of


@dataclass(frozen=True)
class SiteWater:
    scene_id: str
    load: float          # 该场景在本雨型下的负荷（0-1）
    defense: float       # 本地防护覆盖度（0-0.95）
    residual: float      # 未被拦下、向下游传递的残余径流
    inflow: float        # 上游到达的汇流
    total: float         # residual + inflow
    ratio: float         # total / rollup，越接近 1 越接近失守
    safety: float        # 净安全度 0-100


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def scenario_load(scene_id: str, rain_type: dict) -> float:
    exposure = SCENARIO_BY_ID[scene_id]["exposure"]
    weights = rain_type["weights"]
    return weights["volume"] * exposure["volume"] + weights["peak"] * exposure["peak"]


def scenario_defense(scene_id: str, points: int, rain_type: dict) -> float:
    curve = SCENARIO_BY_ID[scene_id]["curve"]
    modifier = rain_type["defense_modifier"].get(scene_id, 0.0)
    return clamp(curve[points] + modifier, 0.0, 0.95)


def compute_water(allocation: dict, rain_type: dict) -> dict:
    """按固定水流顺序（SCENARIO_ORDER）逐站计算，保证上游先于下游。"""
    convey_loss = rain_type["convey_loss"]
    water = {}

    for scene_id in SCENARIO_ORDER:
        load = scenario_load(scene_id, rain_type)
        defense = scenario_defense(scene_id, allocation[scene_id], rain_type)
        residual = load * (1.0 - defense)

        inflow = 0.0
        for upstream_id in upstream_of(scene_id):
            upstream = water[upstream_id]
            transfer = SCENARIO_BY_ID[upstream_id]["transfer"]
            inflow += upstream.residual * transfer * convey_loss

        total = residual + inflow
        ratio = total / SCENARIO_BY_ID[scene_id]["rollup"]
        safety = 100.0 * clamp(1.0 - ratio, 0.0, 1.0)
        water[scene_id] = SiteWater(
            scene_id=scene_id,
            load=load,
            defense=defense,
            residual=residual,
            inflow=inflow,
            total=total,
            ratio=ratio,
            safety=safety,
        )

    return water
