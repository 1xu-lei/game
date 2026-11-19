"""推演接口（规格书 §8）。"""

from fastapi import APIRouter, HTTPException

from app.schemas.simulation import SimulationRequest, SimulationResultOut
from app.services.simulation_service import AllocationInvalid, load_simulation, run_simulation

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("/run", response_model=SimulationResultOut)
def run(payload: SimulationRequest) -> dict:
    try:
        return run_simulation(payload.allocation.model_dump(), payload.rainType)
    except AllocationInvalid as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/{simulation_id}", response_model=SimulationResultOut)
def detail(simulation_id: str) -> dict:
    result = load_simulation(simulation_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"未找到推演记录：{simulation_id}")
    return result
