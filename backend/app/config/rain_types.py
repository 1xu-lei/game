"""两种降雨情境配置（规格书 §3.4）。

数值全部来自仓库根 rules/rules.json 的 rainTypes 段。两种情境共用同一引擎，
只通过参数与权重切换，首版不引入随机天气。

- weights.volume / weights.peak：把场景暴露度加权成实际负荷的两个维度权重
  （持续型偏总量、短时强降雨偏峰值）。
- convey_loss：上游残余径流经管道输送后的到达比例。
- defense_modifier：雨型对各场景防护手段的加成 / 削弱（持续型利于调蓄与下渗，
  短时强降雨利于泵站瞬时排水、不利于渗透型设施）。
- score_weights：各场景对总分的贡献，同雨型内合计为 1，可随雨型变化。
"""

from app.config.rules_loader import RULES

RAIN_TYPE_BY_ID = dict(RULES["rainTypes"])

RAIN_TYPES = [RAIN_TYPE_BY_ID[rain_id] for rain_id in RULES["rainTypes"]]
