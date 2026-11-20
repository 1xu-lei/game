"""配置包：全部可调参数来自仓库根 rules/rules.json（见 rules_loader.RULES）。"""

from app.config.rules_loader import RULES, RULES_PATH, RULES_VERSION

__all__ = ["RULES", "RULES_PATH", "RULES_VERSION"]
