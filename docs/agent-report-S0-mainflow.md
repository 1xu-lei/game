# 会话 S0 交付记录 —「规划 → 推演 → 结算」主流程 + 后端引擎

> 本文件由主控 Agent 写入，**不改动** `docs/agent-progress.md`（该文件同时被另一路实现使用）。
> 所有结论均附实测命令与真实输出，未经验证的内容单独标注。

---

## 1. 结论一句话

后端子引擎 + API 已完成并 **26 项 pytest 全绿**；前端主流程（规划→推演→结算）已与真实后端联调成功，
结算页状态位显示 **「后端引擎」**，评分来自 `POST /api/simulations/run` 而非本地预览。

---

## 2. 后端（已完成，可运行）

```
backend/
├── app/
│   ├── main.py                     FastAPI + CORS + lifespan 建表
│   ├── api/{config,simulations}.py GET /api/health、/api/config/*、POST /api/simulations/run、GET /api/simulations/{id}
│   ├── schemas/simulation.py       Pydantic 模型（字段与前端 types 对齐）
│   ├── services/{config_service,simulation_service}.py
│   ├── engine/{allocation,flow,scoring,synergy,strategy,simulation}.py   ← 纯计算，无 FastAPI/SQLAlchemy
│   ├── config/{scenarios,rain_types,synergies,scoring}.py               ← 全部阈值/曲线在此
│   ├── models/db.py + repositories/simulation_repository.py             ← SQLite + SQLAlchemy
│   └── tests/{conftest,test_engine,test_api,test_sweep}.py
├── requirements.txt  pytest.ini  rainfall.db  README.md
└── .venv/            Python 3.14.5
```

### 2.1 测试（真实执行）

```powershell
& '.\backend\.venv\Scripts\python.exe' -m pytest -q
```

```
..........................                                               [100%]
PYTEST_EXIT=0
```

26 项覆盖：六档标签、0 点场景仍随结果返回、1+1+1+1+1 与 5 点专精均可运行、
总和 ≠5 → 422、越界/缺字段/未知雨型 → 422、两雨型结果不同、三条联动各自触发与不触发、
重复调用结果完全一致（含 `simulationId`）、分数恒在 0–100、事件由真实数值生成、解释 ≥2 条、
按 id 查询与 404，以及 **C(9,4)=126 种分配 × 2 雨型 = 252 组全枚举**
（断言两种雨型最优配置不同＝不存在固定最优解；不同分值个数 > 60）。

### 2.2 真实 HTTP（uvicorn 127.0.0.1:8010）

```
/api/health               -> 200  {"status":"ok","rulesVersion":"rain-five-v1","engine":"rule-based"}
/api/config/scenarios     -> 200
/api/config/rain-types    -> 200
POST /api/simulations/run -> 200  sim-continuous-90f01702ea  score=67.9  grade=B 基本可控  strategy=双核型
                                  synergies=2  events=11  explanations=4  recommendations=1  forecast=6
GET  /api/simulations/sim-continuous-90f01702ea -> 200
POST 总额 4 点（1+1+1+1+0） -> 422   ✅ 符合「必须恰好 5 点」
```

---

## 3. 前端主流程（已验证，隔离副本可运行）

由于共享 `frontend/src` 同时被另一路实现改写，本流程以**隔离副本**形式保留并验证，避免互相覆盖：

```
.review/impl-app/            ← 可直接 npm run dev
├── src/                     App.vue → PlanningView / ResultView / SimulationOverlay
│                            components/ 15 个原创组件、stores/ 4 个、composables/、services/
├── index.html  vite.config.ts  tsconfig.json  package.json
└── node_modules → frontend/node_modules（Junction）   public → frontend/public（Junction）
```

启动：

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$env:VITE_API_BASE = 'http://127.0.0.1:8010'
cd .review\impl-app; npm run dev -- --port 5301
```

### 3.1 端到端实测（Edge headless + Playwright 真实点击）

```
source chip (plan)   = 本地预览引擎          （未推演前，主界面用本地预览即时更新）
budget               = 5/5                  （公园 3 + 车站 2）
source chip (result) = 后端引擎             ← 真实走后端
score                = 67.9/100
grade                = 基本可控
strategy             = 双核型
simId                = sim-continuous-90f01702ea   ← 与后端 POST 返回完全一致
rulesVersion         = rain-five-v1
console errors       = 1（favicon 404）
```

纯前端模式（后端未启动）同样可跑，且 UI 明确标注「本地预览引擎」，不伪装后端结果：

```
[a] score=30/100  riskCells=4  scenarioRows=5  explanations=4  synergies=2
[b] score=30/100  → determinism(run1==run2)=true
[burst] score=27/100 → 换雨型结果不同=true
```

截图：`.review/verify-1-plan.png`、`verify-2-overlay.png`、`verify-3-result.png`、`verify-4-backend.png`。

### 3.2 本轮修掉的真实缺陷

1. 右栏出现两条 `0/5 剩余 5 点`：`ResourceAllocator` 内部已含 `ResourceBudgetBar`，`PlanningView` 又传了一个。
2. 「返回调整」按钮实际不可见（实测 `color: rgb(51,54,57)` 深灰压深底），已显式覆写 `color` + `:deep(.n-button__content)`。
3. 「跳过 / 快速结算」按钮颜色过淡，已统一为 `var(--text-muted)`。
4. Tailwind 4.0.0 在 Node 26 下构建崩溃（`Cannot convert undefined or null to object`）→ 升级 4.x 最新恢复。
5. `vite.config.ts` 缺 `@types/node` → 补装。

---

## 4. 两套实现并存（需要你选一个作为正式交付）

| | 共享 `frontend/`（另一路实现） | `.review/impl-app/`（本记录） |
|---|---|---|
| 入口 | A/B/C 设计评审壳（`?v=a\|b\|c`） | 规划 → 推演 → 结算 主流程 |
| 推演过程页 | 自身记录「未接入」 | ✅ 6 步时间线 + 实时事件日志 + 跳过 |
| 结算页 | 自身记录「未接入」 | ✅ 总分/等级/风险/联动/解释/建议 + 返回调整/再玩一次 |
| 后端联调 | 未见 | ✅ 已验证 source=后端引擎 |
| typecheck | ✅ 0 error（17:49 实测） | ✅ 0 error |

合并建议（任选其一）：

- **方案 A（推荐）**：把 `.review/impl-app/src/views` + 3 个按钮组件并入共享 `frontend/src`，
  `main.ts` 指向 `App.vue`，把 A/B/C 变体降级为 `?v=a|b|c` 的可选入口。
- **方案 B**：保留共享目录现状（A/B/C 评审壳），用 `.review/impl-app` 演示完整推演闭环。

---

## 5. 未完成 / 需你处理

1. **端口 8000 被另一个 `python app.py --port 8000` 占用**，我们的后端临时跑在 8010，前端用 `VITE_API_BASE` 指过去。
2. 前端首屏 `.source-chip` 在未推演时显示「本地预览引擎」，即使配置接口来自后端（语义可再细化）。
3. `dist` 主 chunk ~744 kB（Naive UI + ECharts），建议 `manualChunks` 拆分。
4. 未做：历史记录 / 排行榜（P1/P2，UI 已用 tooltip 说明未实现，未留死按钮）。
5. 未做可视化回归落库（仅保留 `.review/*.png` 截图）。
