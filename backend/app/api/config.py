"""健康检查与配置接口（规格书 §8）。"""

from fastapi import APIRouter

from app.config.scoring import SCORING
from app.schemas.simulation import HealthOut, RainTypeConfigOut, ScenarioConfigOut
from app.services.config_service import rain_type_configs, scenario_configs

router = APIRouter(prefix="/api", tags=["config"])


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(status="ok", rulesVersion=SCORING["rules_version"], engine="rule-based")


@router.get("/config/scenarios", response_model=list[ScenarioConfigOut])
def scenarios() -> list[dict]:
    return scenario_configs()


@router.get("/config/rain-types", response_model=list[RainTypeConfigOut])
def rain_types() -> list[dict]:
    return rain_type_configs()
