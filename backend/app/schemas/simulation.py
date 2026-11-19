"""API 请求 / 响应模型（对齐前端 frontend/src/types/index.ts）。"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

SceneId = Literal["school", "market", "park", "residential", "station"]
RainTypeId = Literal["continuous", "burst"]


class Allocation(BaseModel):
    school: int = Field(ge=0, le=5)
    market: int = Field(ge=0, le=5)
    park: int = Field(ge=0, le=5)
    residential: int = Field(ge=0, le=5)
    station: int = Field(ge=0, le=5)


class SimulationRequest(BaseModel):
    rainType: RainTypeId
    allocation: Allocation
    rulesVersion: Optional[str] = None


class ScenarioResultOut(BaseModel):
    sceneId: SceneId
    sceneName: str
    invested: int
    stageLabel: str
    coverage: int
    effective: int
    inflow: int
    outflow: int
    deltaValue: float
    deltaText: str


class RiskMetricsOut(BaseModel):
    waterlogRisk: int
    lossRisk: int
    stationPressure: int
    drainageLoad: int


class SynergyOut(BaseModel):
    id: str
    name: str
    detail: str
    gain: float


class ForecastPointOut(BaseModel):
    step: str
    waterlog: int
    loss: int


class EventOut(BaseModel):
    index: int
    step: int
    stepLabel: str
    sceneId: Optional[SceneId] = None
    text: str
    tone: Literal["info", "good", "warn", "bad"]


class ExplanationOut(BaseModel):
    title: str
    body: str
    evidence: str


class RecommendationOut(BaseModel):
    sceneId: SceneId
    text: str
    gain: float


class SimulationResultOut(BaseModel):
    simulationId: str
    rainType: RainTypeId
    allocation: Allocation
    overallScore: float
    grade: str
    gradeLabel: str
    strategyType: str
    scenarioResults: list[ScenarioResultOut]
    riskMetrics: RiskMetricsOut
    triggeredSynergies: list[SynergyOut]
    forecast: list[ForecastPointOut]
    events: list[EventOut]
    explanations: list[ExplanationOut]
    recommendations: list[RecommendationOut]
    rulesVersion: str
    isValid: bool
    validationMessage: Optional[str] = None


class ScenarioConfigOut(BaseModel):
    id: SceneId
    name: str
    nameEn: str
    direction: str
    project: str
    baseNote: str
    flowRole: str
    accentVar: str
    asset: str
    yieldCurve: list[float]
    transfer: float


class RainTypeConfigOut(BaseModel):
    id: RainTypeId
    name: str
    nameEn: str
    summary: str
    challenge: list[str]
    weights: dict[str, float]
    asset: str


class HealthOut(BaseModel):
    status: str
    rulesVersion: str
    engine: str
