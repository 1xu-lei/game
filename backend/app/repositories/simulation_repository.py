"""推演结果仓储：按 simulationId 幂等地保存与读取。"""

import json
from datetime import datetime

from sqlalchemy import func, select

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


def list_summaries(limit: int) -> list[dict]:
    """按创建时间倒序取最近 limit 条（解析失败的记录跳过）。"""
    with session_scope() as session:
        records = session.scalars(
            select(SimulationRecord)
            .order_by(SimulationRecord.created_at.desc(), SimulationRecord.id.desc())
            .limit(limit)
        ).all()
        return _summaries(records)


def count_all() -> int:
    """推演记录总数（不受 limit 影响）。"""
    with session_scope() as session:
        return int(session.scalar(select(func.count()).select_from(SimulationRecord)) or 0)


def top_summaries(limit: int) -> list[dict]:
    """按分数倒序取前 limit 条，同分按创建时间、id 升序保证稳定。"""
    with session_scope() as session:
        records = session.scalars(
            select(SimulationRecord)
            .order_by(
                SimulationRecord.score.desc(),
                SimulationRecord.created_at.asc(),
                SimulationRecord.id.asc(),
            )
            .limit(limit)
        ).all()
        return _summaries(records)


def _summaries(records: list[SimulationRecord]) -> list[dict]:
    """记录 → 只读摘要；单条 result_json 损坏或字段缺失时跳过该条，不抛出。"""
    summaries = []
    for record in records:
        try:
            result = json.loads(record.result_json)
            summaries.append(
                {
                    "simulationId": record.id,
                    "rainType": record.rain_type,
                    "allocation": result["allocation"],
                    "overallScore": result["overallScore"],
                    "grade": result["grade"],
                    "strategyType": result["strategyType"],
                    "createdAt": _iso(record.created_at),
                }
            )
        except (TypeError, ValueError, KeyError):
            continue
    return summaries


def _iso(moment: datetime | None) -> str | None:
    return moment.isoformat() if moment else None
