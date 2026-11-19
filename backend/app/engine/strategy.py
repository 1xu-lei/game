"""策略类型识别（规格书 §3.3）。

优先级顺序固定，写死在此处保证同一配置永远得到同一标签：
1. 专精型：单一场景投入 >= 4
2. 双核型：恰好两个场景各 >= 2，且这两处合计 >= 4
3. 均衡型：五个场景均 >= 1
4. 偏科型：最高投入 >= 3，且比次高多 >= 2
5. 多元型：其余（资源分布在 3 个及以上场景）
"""


def classify_strategy(allocation: dict) -> str:
    values = sorted(allocation.values(), reverse=True)
    top, second = values[0], values[1]
    active = sum(1 for value in allocation.values() if value > 0)
    cores = sum(1 for value in allocation.values() if value >= 2)

    if top >= 4:
        return "专精型"
    if cores == 2 and top + second >= 4:
        return "双核型"
    if active == len(allocation):
        return "均衡型"
    if top >= 3 and top - second >= 2:
        return "偏科型"
    return "多元型"
