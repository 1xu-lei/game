"""规则参数单一真源加载器。

仓库根的 rules/rules.json 是所有可调参数的唯一可编辑文件
（场景曲线、雨型权重、联动阈值、评分尺度与等级），
backend 侧模块只读取本加载器导出的 RULES，不再各自硬编码数值。
"""

import json
from pathlib import Path

# rules_loader.py -> config -> app -> backend -> 仓库根
REPO_ROOT = Path(__file__).resolve().parents[3]
RULES_PATH = REPO_ROOT / "rules" / "rules.json"

with RULES_PATH.open(encoding="utf-8") as fp:
    RULES = json.load(fp)

RULES_VERSION = RULES["rulesVersion"]
