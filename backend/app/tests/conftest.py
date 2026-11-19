"""pytest 公共配置：把测试库指向临时文件，避免污染开发库。"""

import os
import tempfile

import pytest

os.environ.setdefault(
    "RAINFALL_DB_URL", "sqlite:///" + os.path.join(tempfile.gettempdir(), "rainfall_corner_test.db")
)

from app.main import app  # noqa: E402  必须在设置环境变量之后导入
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
