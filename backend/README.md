# 雨落街角 / Rainfall Corner — 后端

Python + FastAPI + SQLite + SQLAlchemy。分层：`api/`（REST）、`schemas/`（Pydantic）、`services/`（编排）、
`engine/`（**纯计算**）、`config/`（全部阈值与曲线）、`repositories/`、`models/`、`tests/`（pytest）。

核心计算只在 `app/engine/`，不 import FastAPI / SQLAlchemy，不含随机数与时间依赖，因此同输入必得同输出。

## 环境

本机 Python 不在 PATH（`python` 命令只指向 Microsoft Store 占位），真实解释器为：

```
C:\Users\11\AppData\Local\Programs\Python\Python314\python.exe   # Python 3.14.5
```

虚拟环境已建在 `backend\.venv`：

```powershell
& 'C:\Users\11\AppData\Local\Programs\Python\Python314\python.exe' -m venv .venv
& '.\backend\.venv\Scripts\python.exe' -m pip install -r backend\requirements.txt
```

已安装（实测）：`fastapi 0.165.0`、`uvicorn 0.54.0`、`pydantic 2.14.3`、`sqlalchemy 2.1.9`、`pytest 9.2.0`、`httpx 0.28.1`。

## 启动

```powershell
# 在 backend 目录下
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

前端默认请求 `http://127.0.0.1:8000`；若 8000 被占用，可换端口并用 `VITE_API_BASE` 指过去：

```powershell
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8010
# 前端： $env:VITE_API_BASE='http://127.0.0.1:8010'; npm run dev
```

CORS 已放行 `http://localhost:5199`、`http://127.0.0.1:5199`（以及 4173）。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查（含 rulesVersion） |
| GET | `/api/config/scenarios` | 五场景 + 0–5 六档收益曲线（五条曲线互不相同） |
| GET | `/api/config/rain-types` | 持续型降雨 / 短时强降雨（共用同一引擎，仅参数不同） |
| POST | `/api/simulations/run` | 推演；总和必须恰好 5、每场景 0–5 整数，否则 422 |
| GET | `/api/simulations/{id}` | 按 simulationId 读取已保存结果，未找到 404 |
| GET | `/api/history?limit=20` | 最近推演记录（`limit` 1–100），最新在前；`total` 为总记录数，`isLocalOnly` 恒为 true |
| GET | `/api/leaderboard?limit=10` | 本地记录生成的示例榜单，分数倒序、`rank` 从 1 连续；`isDemoData` 恒为 true |

响应字段与前端 `frontend/src/types/index.ts` 一一对应：`simulationId`、`overallScore`、`grade`、`gradeLabel`、
`strategyType`、`scenarioResults`、`riskMetrics`、`triggeredSynergies`、`forecast`、`events`、`explanations`、
`recommendations`、`rulesVersion`、`isValid`、`validationMessage`。

## 参数放哪里

调平衡只改 `app/config/`，不要改引擎逻辑：

- `scenarios.py`：五场景收益曲线、暴露度、传递系数、承载力
- `rain_types.py`：两种雨型的权重、输送损耗、防护修正、评分权重
- `synergies.py`：三条联动的阈值与收益
- `scoring.py`：原始分→展示分的单调映射区间、风险权重、等级阈值、基准方案

## 测试

```powershell
& '.\backend\.venv\Scripts\python.exe' -m pytest -q
```

实测输出（2026-11-19）：

```
..........................                                               [100%]
PYTEST_EXIT=0
```

26 项通过，覆盖：六档标签、0 点场景仍返回、1+1+1+1+1 与 5 点专精均可运行、总和 ≠5 被 422 拒绝、
越界/缺字段被拒绝、两雨型结果不同、三条联动各自触发与不触发、重复调用完全一致（含 simulationId）、
分数恒在 0–100、事件由真实数值生成、解释不少于 2 条、按 id 查询与 404、
以及 **C(9,4)=126 种分配 × 2 雨型 = 252 组全枚举**（断言不存在两种雨型共用的固定最优解、分值区分度 > 60）。

## 已知限制

- 风险指标（积水风险 / 损失概率 / 车站压力 / 排水负荷）是项目自定义的 0–100 简化指标，不是真实工程单位。
- 汇流为相对负荷模型（0–1），未引入真实水文演算或随机天气。
- SQLite 仅保存结果快照，用于按 id 回查，未做用户/历史对比。
