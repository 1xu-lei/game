"""五场景固定配置（规格书 §2 / §3.5）。

收益曲线必须各场景独立配置，禁止五个场景共用同一条曲线（五条数值全部不同）。
curve[points]：投入 points 点后该场景的本地防护覆盖度（0.00-1.00）。

其余参数含义：
- exposure.volume / exposure.peak：场景在「总量型 / 峰值型」两个维度上的暴露度，
  由雨型权重加权成实际负荷（见 rain_types.py）。
- transfer：未被本地防护拦下的残余径流向下游传递的比例（固定水流关系）。
- rollup：该场景的压力承载力上限，total / rollup 越接近 1 表示越接近失守。
- 调平衡只改本文件与 rain_types.py、synergies.py、scoring.py，不改引擎逻辑。
"""

SCENARIO_ORDER = ["school", "market", "park", "residential", "station"]

SCENARIOS = [
    {
        "id": "school",
        "name": "学校",
        "nameEn": "School",
        "role": "人员安全",
        "focus": ["预警", "避险", "防护"],
        "benefit": "降低人员风险",
        "flows_to": "park",
        "transfer": 0.72,
        "exposure": {"volume": 0.58, "peak": 0.62},
        "rollup": 0.80,
        "curve": [0.00, 0.16, 0.30, 0.42, 0.54, 0.64],
    },
    {
        "id": "market",
        "name": "集市",
        "nameEn": "Market",
        "role": "经济活动",
        "focus": ["商铺防护", "经营保障"],
        "benefit": "降低商业损失",
        "flows_to": "residential",
        "transfer": 0.70,
        "exposure": {"volume": 0.66, "peak": 0.70},
        "rollup": 0.90,
        "curve": [0.00, 0.22, 0.38, 0.52, 0.62, 0.70],
    },
    {
        "id": "park",
        "name": "公园",
        "nameEn": "Park",
        "role": "城市调蓄",
        "focus": ["渗透", "雨水花园", "调蓄设施"],
        "benefit": "降低径流、减轻下游压力",
        "flows_to": "station",
        "transfer": 0.64,
        "exposure": {"volume": 0.50, "peak": 0.46},
        "rollup": 0.80,
        "curve": [0.00, 0.26, 0.44, 0.60, 0.72, 0.80],
    },
    {
        "id": "residential",
        "name": "居民区",
        "nameEn": "Residential",
        "role": "社区生活",
        "focus": ["居住防护", "社区改造"],
        "benefit": "减少住宅积水",
        "flows_to": "station",
        "transfer": 0.61,
        "exposure": {"volume": 0.70, "peak": 0.66},
        "rollup": 0.95,
        "curve": [0.00, 0.16, 0.29, 0.42, 0.54, 0.63],
    },
    {
        "id": "station",
        "name": "车站",
        "nameEn": "Station",
        "role": "城市交通",
        "focus": ["排水疏通", "泵站", "排水能力"],
        "benefit": "缓解低洼汇流积水",
        "flows_to": None,
        "transfer": 0.00,
        "exposure": {"volume": 0.78, "peak": 0.94},
        "rollup": 1.20,
        "curve": [0.00, 0.22, 0.38, 0.53, 0.66, 0.76],
    },
]

SCENARIO_BY_ID = {item["id"]: item for item in SCENARIOS}

# 固定水流关系（规格书 §2.3：禁止随机连线、禁止增删）
FLOW_LINKS = [
    {"from": "school", "to": "park", "label": "校园径流"},
    {"from": "market", "to": "residential", "label": "集市来水"},
    {"from": "park", "to": "station", "label": "公园下泄"},
    {"from": "residential", "to": "station", "label": "社区下泄"},
]


def curve_value(scenario_id: str, points: int) -> float:
    """某场景某档位的防护覆盖度。"""
    return SCENARIO_BY_ID[scenario_id]["curve"][points]


def upstream_of(scenario_id: str) -> list:
    """固定水流关系上的上游场景（只读 FLOW_LINKS，禁止其它连线）。"""
    return [link["from"] for link in FLOW_LINKS if link["to"] == scenario_id]
