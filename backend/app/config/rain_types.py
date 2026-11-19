"""两种降雨情境配置（规格书 §3.4）。

两种情境共用同一引擎，只通过本文件的参数与权重切换，首版不引入随机天气。

- weights.volume / weights.peak：把场景暴露度加权成实际负荷的两个维度权重
  （持续型偏总量、短时强降雨偏峰值）。
- convey_loss：上游残余径流经管道输送后的到达比例。
- defense_modifier：雨型对各场景防护手段的加成 / 削弱（持续型利于调蓄与下渗，
  短时强降雨利于泵站瞬时排水、不利于渗透型设施）。
- score_weights：各场景对总分的贡献，同雨型内合计为 1，可随雨型变化。
"""

RAIN_TYPES = [
    {
        "id": "continuous",
        "name": "持续型降雨",
        "nameEn": "Continuous Rain",
        "summary": "长时间中高强度降雨，累计水量大",
        "challenge": ["考验调蓄容量", "持续排水能力", "设施长时间承载"],
        "weights": {"volume": 0.72, "peak": 0.28},
        "convey_loss": 0.58,
        "defense_modifier": {"park": 0.15, "station": -0.08},
        "score_weights": {
            "school": 0.17,
            "market": 0.15,
            "park": 0.25,
            "residential": 0.21,
            "station": 0.22,
        },
    },
    {
        "id": "burst",
        "name": "短时强降雨",
        "nameEn": "Cloudburst",
        "summary": "短时间高强度降雨，峰值集中在数十分钟",
        "challenge": ["考验峰值承载", "局部防护强度", "低洼区排水压力"],
        "weights": {"volume": 0.30, "peak": 0.70},
        "convey_loss": 0.48,
        "defense_modifier": {"park": -0.12, "station": 0.18, "market": 0.06},
        "score_weights": {
            "school": 0.15,
            "market": 0.14,
            "park": 0.19,
            "residential": 0.19,
            "station": 0.33,
        },
    },
]

RAIN_TYPE_BY_ID = {item["id"]: item for item in RAIN_TYPES}
