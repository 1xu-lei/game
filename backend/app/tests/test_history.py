"""历史记录与示例榜单测试（规格书 §8：GET /api/history、GET /api/leaderboard）。"""

from datetime import datetime

import pytest
from sqlalchemy import delete

from app.models.db import SimulationRecord, session_scope

BALANCED = {"school": 1, "market": 1, "park": 1, "residential": 1, "station": 1}
SPECIALIST = {"school": 0, "market": 0, "park": 0, "residential": 0, "station": 5}
SPLIT = {"school": 2, "market": 2, "park": 1, "residential": 0, "station": 0}
NOTE = "本地 SQLite 推演记录生成的示例榜单，非联网排行榜"


@pytest.fixture()
def clean_db():
    """清空记录表：conftest 的临时库在整场测试会话内共享。"""
    with session_scope() as session:
        session.execute(delete(SimulationRecord))
        session.commit()


def _run(client, rain_type: str, allocation: dict) -> dict:
    response = client.post(
        "/api/simulations/run", json={"rainType": rain_type, "allocation": allocation}
    )
    assert response.status_code == 200
    return response.json()


def _set_created_at(simulation_id: str, moment: datetime) -> None:
    """固定创建时间，避免同一秒内多次写入导致顺序断言不稳定。"""
    with session_scope() as session:
        session.get(SimulationRecord, simulation_id).created_at = moment
        session.commit()


def test_history_empty(client, clean_db):
    response = client.get("/api/history")
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "isLocalOnly": True}


def test_history_returns_two_records_newest_first(client, clean_db):
    older = _run(client, "continuous", BALANCED)
    newer = _run(client, "burst", SPECIALIST)
    _set_created_at(older["simulationId"], datetime(2026, 1, 1, 8, 0, 0))
    _set_created_at(newer["simulationId"], datetime(2026, 1, 1, 9, 0, 0))

    body = client.get("/api/history").json()

    assert body["total"] == 2
    assert body["isLocalOnly"] is True
    assert [item["simulationId"] for item in body["items"]] == [
        newer["simulationId"],
        older["simulationId"],
    ]
    latest = body["items"][0]
    assert latest["rainType"] == "burst"
    assert latest["allocation"] == SPECIALIST
    assert latest["overallScore"] == newer["overallScore"]
    assert latest["grade"] == newer["grade"]
    assert latest["strategyType"] == newer["strategyType"]
    assert latest["createdAt"] == "2026-01-01T09:00:00"


def test_history_limit_slices_items_but_not_total(client, clean_db):
    _run(client, "continuous", BALANCED)
    _run(client, "burst", SPECIALIST)

    body = client.get("/api/history", params={"limit": 1}).json()

    assert len(body["items"]) == 1
    assert body["total"] == 2


def test_leaderboard_sorted_by_score_with_continuous_rank(client, clean_db):
    created = [
        _run(client, "continuous", BALANCED),
        _run(client, "burst", SPECIALIST),
        _run(client, "continuous", SPLIT),
    ]

    body = client.get("/api/leaderboard").json()

    assert body["isDemoData"] is True
    assert body["note"] == NOTE
    items = body["items"]
    assert [item["rank"] for item in items] == [1, 2, 3]
    scores = [item["overallScore"] for item in items]
    assert scores == sorted(scores, reverse=True)
    assert items[0]["overallScore"] == max(item["overallScore"] for item in created)
    assert {item["simulationId"] for item in items} == {item["simulationId"] for item in created}

    limited = client.get("/api/leaderboard", params={"limit": 2}).json()["items"]
    assert [item["rank"] for item in limited] == [1, 2]
    assert [item["overallScore"] for item in limited] == scores[:2]


def test_history_score_matches_simulation_detail(client, clean_db):
    created = _run(client, "burst", SPECIALIST)
    item = client.get("/api/history").json()["items"][0]
    detail = client.get(f"/api/simulations/{item['simulationId']}").json()

    assert item["simulationId"] == created["simulationId"]
    assert item["overallScore"] == detail["overallScore"]


def test_broken_result_json_is_skipped(client, clean_db):
    good = _run(client, "continuous", BALANCED)
    with session_scope() as session:
        session.add(
            SimulationRecord(id="sim-broken", rain_type="burst", score=999.0, result_json="{not json")
        )
        session.commit()

    history_body = client.get("/api/history").json()
    assert [item["simulationId"] for item in history_body["items"]] == [good["simulationId"]]
    assert history_body["total"] == 2

    leaderboard_body = client.get("/api/leaderboard").json()
    assert [item["simulationId"] for item in leaderboard_body["items"]] == [good["simulationId"]]
    assert [item["rank"] for item in leaderboard_body["items"]] == [1]
