"""pytest 公共配置：每个测试会话用独立临时库，避免并发/残留进程争锁。"""

import os
import tempfile

import pytest

_session_dir = tempfile.mkdtemp(prefix="rainfall_corner_test_")
os.environ["RAINFALL_DB_URL"] = "sqlite:///" + os.path.join(_session_dir, "test.db")

from app.main import app  # noqa: E402  必须在设置环境变量之后导入
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
