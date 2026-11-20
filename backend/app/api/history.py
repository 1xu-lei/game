"""历史记录与示例榜单（只读，规格书 §8）。"""

from fastapi import APIRouter, Query

from app.repositories.simulation_repository import count_all, list_summaries, top_summaries
from app.schemas.simulation import HistoryOut, LeaderboardOut

history_router = APIRouter(prefix="/api", tags=["history"])
leaderboard_router = APIRouter(prefix="/api", tags=["leaderboard"])

LEADERBOARD_NOTE = "本地 SQLite 推演记录生成的示例榜单，非联网排行榜"


@history_router.get("/history", response_model=HistoryOut)
def history(limit: int = Query(20, ge=1, le=100)) -> dict:
    return {"items": list_summaries(limit), "total": count_all(), "isLocalOnly": True}


@leaderboard_router.get("/leaderboard", response_model=LeaderboardOut)
def leaderboard(limit: int = Query(10, ge=1, le=100)) -> dict:
    items = [{"rank": rank, **item} for rank, item in enumerate(top_summaries(limit), start=1)]
    return {"items": items, "isDemoData": True, "note": LEADERBOARD_NOTE}
