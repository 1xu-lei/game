"""评分、风险指标与档位标签配置（规格书 §3.5 / §4.3 / §4.4）。

全部数值来自仓库根 rules/rules.json 的 scoring / budget 段，本文件只做常量导出。

评分的两段式结构（可阅读、可测试、不随机）：

1. 原始分 raw
   raw = Σ score_weights[场景] * safety[场景] + Σ 已触发联动 bonus
   其中 safety = 100 * clamp(1 - total/rollup, 0, 1)，见 engine/flow.py。

2. 展示分 overallScore
   raw 的常用区间较窄，直接用会挤在一起，因此按 rules.json 的
   raw_score_floor..ceiling → display_score_floor..ceiling 做一次单调线性映射并保留 1 位小数。
   线性单调映射不改变任何配置之间的排序，只影响可读性。

调平衡只改 rules/rules.json，不改引擎逻辑。
"""

from app.config.rules_loader import RULES

SCORING = RULES["scoring"]

STAGE_LABELS = list(SCORING["stageLabels"])

BUDGET_TOTAL = RULES["budget"]["total"]
POINTS_MIN = RULES["budget"]["pointsMin"]
POINTS_MAX = RULES["budget"]["pointsMax"]
