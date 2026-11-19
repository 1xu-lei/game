"""推演服务：校验 → 调引擎 → 落库 → 返回（不含计算规则本体）。"""

from app.engine.simulation import simulate
from app.repositories.simulation_repository import get_result, save_result


class AllocationInvalid(Exception):
    """分配非法（总和不为 5、字段缺失等），由 API 层转 422。"""


def run_simulation(allocation: dict, rain_type: str) -> dict:
    try:
        result = simulate(allocation, rain_type)
    except ValueError as error:
        raise AllocationInvalid(str(error)) from error
    save_result(result)
    return result


def load_simulation(simulation_id: str) -> dict | None:
    return get_result(simulation_id)
