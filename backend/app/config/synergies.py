"""联动规则（规格书 §3.6：首版固定 3 条）。

阈值与收益全部来自仓库根 rules/rules.json 的 synergies 段，本文件只导出常量，
引擎只负责读取与判定，不含任何写死的阈值。
bonus 为原始分（引擎内部的 0-100 原始分），对外展示分由 scoring.py 的线性映射换算。
conditions 语义：场景 id -> 最低投入点数。
"""

from app.config.rules_loader import RULES

SYNERGIES = RULES["synergies"]
