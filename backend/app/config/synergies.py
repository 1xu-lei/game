"""联动规则（规格书 §3.6：首版固定 3 条）。

阈值与收益全部集中在此文件，引擎只负责读取与判定，不含任何写死的阈值。
bonus 为原始分（引擎内部的 0-100 原始分），对外展示分由 scoring.py 的线性映射换算。
conditions 语义：场景 id -> 最低投入点数。
"""

SYNERGIES = [
    {
        "id": "upstream_storage",
        "name": "上游调蓄",
        "conditions": {"park": 3},
        "bonus": 0.8,
        "effect": "下游汇流压力下降",
    },
    {
        "id": "coordinated_drainage",
        "name": "排蓄协同",
        "conditions": {"park": 2, "station": 2},
        "bonus": 1.0,
        "effect": "调蓄与排水形成协同收益",
    },
    {
        "id": "balanced_all",
        "name": "全域均衡",
        "conditions": {"school": 1, "market": 1, "park": 1, "residential": 1, "station": 1},
        "bonus": 1.2,
        "effect": "五场景均为正投入的均衡奖励",
    },
]
