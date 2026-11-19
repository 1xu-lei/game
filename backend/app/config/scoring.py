"""评分、风险指标与档位标签配置（规格书 §3.5 / §4.3 / §4.4）。

评分的两段式结构（可阅读、可测试、不随机）：

1. 原始分 raw
   raw = Σ score_weights[场景] * safety[场景] + Σ 已触发联动 bonus
   其中 safety = 100 * clamp(1 - total/rollup, 0, 1)，见 engine/flow.py。
   safety 是权重平均后的 0-100 指标，raw 因此也落在 0-100 区间。

2. 展示分 overallScore
   raw 的常用区间较窄（约 20-35），直接用会挤在一起，
   因此做一次单调线性映射到 display_score_floor..ceiling 并保留 1 位小数。
   线性单调映射不改变任何配置之间的排序，只影响可读性。

调平衡优先改本文件的 raw/display 映射与权重，不改引擎逻辑。
"""

SCORING = {
    "rules_version": "rain-five-v1",
    "score_min": 0.0,
    "score_max": 100.0,
    # raw -> display 的单调线性映射区间
    "raw_score_floor": 18.0,
    "raw_score_ceiling": 36.0,
    "display_score_floor": 24.0,
    "display_score_ceiling": 92.0,
    # 风险指标权重（项目自定义简化指标，不是真实工程单位）
    "risk_weights": {
        "waterlog": {"station": 0.55, "residential": 0.25, "park": 0.20},
        "loss": {"market": 0.50, "residential": 0.50},
    },
    # 排水负荷率：车站压力相对「安全运行上限」的比例，ratio < 1 表示更容易逼近上限
    "drainage_capacity_ratio": 0.85,
    # 结果页折线（推演阶段因子，只是展示用的阶段系数，不参与评分）
    "forecast_steps": ["入流", "坡面汇流", "上游调蓄", "下游汇流", "车站峰值", "退水"],
    "forecast_factors": [0.22, 0.55, 0.78, 0.92, 1.00, 0.68],
    # 对比基准：1+1+1+1+1
    "baseline_allocation": {
        "school": 1,
        "market": 1,
        "park": 1,
        "residential": 1,
        "station": 1,
    },
    # 等级阈值，从高到低匹配
    "grades": [
        {"grade": "S", "min_score": 85.0, "label": "韧性优秀"},
        {"grade": "A", "min_score": 72.0, "label": "韧性良好"},
        {"grade": "B", "min_score": 58.0, "label": "基本可控"},
        {"grade": "C", "min_score": 42.0, "label": "存在缺口"},
        {"grade": "D", "min_score": 0.0, "label": "风险突出"},
    ],
}

STAGE_LABELS = [
    "无专项投入",
    "初步介入",
    "稳定发展",
    "深度发展",
    "阶段突破",
    "极限专精",
]

BUDGET_TOTAL = 5
POINTS_MIN = 0
POINTS_MAX = 5
