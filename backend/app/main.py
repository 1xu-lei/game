"""FastAPI 入口（规格书 §6.3 分层：api / schemas / services / engine / config / repositories / models）。"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import config, history, simulations
from app.models.db import init_db

ALLOWED_ORIGINS = [
    "http://localhost:5199",
    "http://127.0.0.1:5199",
    "http://localhost:5200",
    "http://127.0.0.1:5200",
    "http://localhost:5301",
    "http://127.0.0.1:5301",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="雨落街角 / Rainfall Corner API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(config.router)
app.include_router(simulations.router)
app.include_router(history.history_router)
app.include_router(history.leaderboard_router)
