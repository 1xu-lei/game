"""导出全组合推演结果，供前端引擎一致性校验比对。

枚举 C(9,4)=126 种分配 × 2 雨型 = 252 组，逐组输出 `simulate()` 的完整 JSON。
前端 `frontend/scripts/check-engine-parity.mjs` 用同一份组合跑前端引擎并逐字段比对，
确保「主界面预期值」与「后端推演结果」同输入同输出。

用法：backend\\.venv\\Scripts\\python.exe backend\\scripts\\dump_engine_results.py > dump.json
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config.scenarios import SCENARIO_ORDER  # noqa: E402
from app.engine.simulation import simulate  # noqa: E402

RAIN_TYPE_IDS = ("continuous", "burst")


def compositions(total, parts):
    if parts == 1:
        yield (total,)
        return
    for first in range(total + 1):
        for rest in compositions(total - first, parts - 1):
            yield (first,) + rest


def main() -> int:
    rows = []
    for combo in compositions(5, len(SCENARIO_ORDER)):
        allocation = {scene_id: points for scene_id, points in zip(SCENARIO_ORDER, combo)}
        for rain_type_id in RAIN_TYPE_IDS:
            rows.append(simulate(allocation, rain_type_id))
    json.dump(rows, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
