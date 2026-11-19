"""推演结果仓储：按 simulationId 幂等地保存与读取。"""

import json

from app.models.db import SimulationRecord, session_scope


def save_result(result: dict) -> None:
    with session_scope() as session:
        record = session.get(SimulationRecord, result["simulationId"])
        payload = json.dumps(result, ensure_ascii=False, sort_keys=True)
        if record is None:
            session.add(
                SimulationRecord(
                    id=result["simulationId"],
                    rain_type=result["rainType"],
                    score=float(result["overallScore"]),
                    result_json=payload,
                )
            )
        else:
            record.result_json = payload
            record.score = float(result["overallScore"])
        session.commit()


def get_result(simulation_id: str) -> dict | None:
    with session_scope() as session:
        record = session.get(SimulationRecord, simulation_id)
        if record is None:
            return None
        return json.loads(record.result_json)
