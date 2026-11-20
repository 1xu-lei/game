# 雨落街角 / Rainfall Corner

城市内涝防护为主题的策略推演 Demo：5 个场景、5 点资源、2 种雨型、126 种分配组合。
规则由**确定性引擎**计算，同一输入必得同一输出，无随机数、不依赖时间或顺序。

- 前端：Vue 3 + TypeScript + Vite + Tailwind
- 后端：FastAPI + Pydantic + SQLAlchemy（SQLite）
- 规则真源：`rules/rules.json`（前后端共用同一份）

## 功能

| 模块 | 状态 | 说明 |
|---|---|---|
| 规划主界面 | ✅ | 三栏 HUD / 沉浸全景 / 水文仪三套设计版本，`A` 为默认（右下角或键盘 1/2/3 切换）；三版都能分配 5 点 |
| 资源分配 | ✅ | 5 点、每场景 0–5、总数必须恰好 5；加减越界即时说明原因；均衡 / 清空三版均有 |
| 场景详情 | ✅ | 点三版任一场景节点或分配行打开抽屉：0–5 档位效果表、本轮读数、固定水流关系、联动阈值进度、策略提示；面板内可直接加减点，`Esc`/X 关闭 |
| 预期影响预览 | ✅ | 随分配/雨型实时重算，与后端同引擎同口径 |
| 推演过程 | ✅ | 6 步时间线 + 实时事件日志，可跳过；动画不参与计算 |
| 结算页 | ✅ | 总分/等级/策略、五场景分项、风险指标、联动、事件日志、≥2 条因果解释、优化建议 |
| 结果对比 | ✅ | 结算页「与上一轮对比」：分数差、配置变化、场景净安全度变化，只读本机快照不重算 |
| 历史记录 | ✅ | 后端 `GET /api/history` + 浏览器快照；点击可回看完整结算 |
| 排行榜 | ✅ | 后端 `GET /api/leaderboard`，明确标注为本地示例数据 |
| 双人 PK | ✅ | 同设备轮流、无联网：玩家一锁定本局（只公开分数不公开加点）→ 玩家二重新分配 → **严格更高才胜、同分归先手**；判定后揭晓五点摊牌表 |
| 设置与说明 | ✅ | 规则版本、后端连通状态、评分口径、清除本机快照、免责说明 |
| 后端降级 | ✅ | 后端未启动时前端 1.8s 超时后走本地引擎，并在界面标注「本地预览引擎」 |

## 目录结构

```
Rainfall_Corner_Project_Brief_v1.0.md   项目交接规格（先读这个）
rules/rules.json                        规则参数唯一真源（前后端共用）
frontend/
  src/engine/ruleEngine.ts              与 backend/app/engine 逐行对齐的前端引擎
  src/engine/previewEngine.ts           预览入口（只做转发，保留既有签名）
  src/composables/useSceneDetail.ts     场景详情视图模型（读配置 + 引擎结果，不计算分数）
  src/stores/pk.ts                      双人 PK 对局状态（只比对已有结果，不重算）
  src/components/panels/                历史记录 / 排行榜 / 设置 / 场景详情 / 双人 PK 侧栏
  src/services/compare.ts               与上一轮推演对比（本机快照派生）
  src/views/ResultScreen.vue            结算页（全屏）
  src/services/history.ts               本机快照 + 后端历史/榜单数据源
  scripts/check-engine-parity.mjs       252 组前后端结果一致性校验
  public/favicon.svg                    站点图标（本地，无外链）
backend/
  app/api/          REST 路由（config / simulations / history / leaderboard）
  app/engine/       纯计算引擎（scoring / simulation / flow / allocation）
  app/services/     业务编排
  app/repositories/ 持久化
  app/config/       参数装载
  app/tests/        pytest（含 126×2 全组合采样 + 历史/榜单接口）
  scripts/          dump_engine_results.py（一致性校验的后端侧数据源）
  .venv/            已装好的虚拟环境（Python 3.14）
docs/               进度、验收、设计文档
```

## 启动（Windows 一键）

双击根目录的 `start.bat`：会同时起后端（8000）和前端（5199），并打开浏览器。

手动启动：

```bat
:: 后端
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

:: 前端（另开一个窗口）
cd frontend
npm run dev            :: http://localhost:5199
```

前端默认请求 `http://127.0.0.1:8000`；端口被占用时用 `VITE_API_BASE` 覆盖：

```bat
set VITE_API_BASE=http://127.0.0.1:8010
npm run dev
```

后端未启动时前端会在 1.8s 超时后降级到本地预览引擎，并在界面上明确标注「本地预览引擎」，不会白屏。

## 验证

```bat
:: 后端测试（含 126 组合 × 2 雨型 = 252 次推演 + 历史/榜单接口）
cd backend
.venv\Scripts\python.exe -m pytest -q

:: 前端类型检查 + 生产构建
cd frontend
npm run typecheck
npm run build

:: 前后端引擎一致性（252 组逐字段比对，退出码 0 才算一致）
cd ..
node frontend\scripts\check-engine-parity.mjs

:: 浏览器验收（headless Edge，需先起后端 8000 与预览服务 5200）
cd frontend && node scripts\serve-dist.mjs 5200
::  另开一个窗口，在仓库根目录：
node .review\harness\flow-check.mjs          :: 规划→推演→结算→历史→榜单→设置 全链路
node .review\harness\check-scene-detail.mjs  :: 三版场景详情抽屉
node .review\harness\check-variants-alloc.mjs:: 三版分配/校验/推演矩阵（1366 与 1440）
node .review\harness\check-compare.mjs       :: 结算页与上一轮对比
```

`npm` 需要 Node 在 PATH 中；若系统未全局安装，先执行 `set PATH=C:\Program Files\nodejs;%PATH%`。

## API

| Method | Endpoint | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 + 规则版本 |
| GET | `/api/config/scenarios` | 五场景与 0–5 档收益曲线 |
| GET | `/api/config/rain-types` | 两种降雨情境配置 |
| POST | `/api/simulations/run` | 执行推演（非法分配 422） |
| GET | `/api/simulations/{id}` | 推演详情（按 simulationId 幂等） |
| GET | `/api/history?limit=20` | 历史记录（本机 SQLite，最新在前） |
| GET | `/api/leaderboard?limit=10` | 本地示例榜单（分数倒序，明确标注为非联网数据） |

## 规则模型要点

- 5 点资源分给 5 个场景，枚举 C(9,4)=126 种分配
- 两种雨型：`continuous`（持续型，累计水量为主）、`burst`（短时强降雨，峰值为主）
- 每种雨型有自己的 `score_weights`、`convey_loss`、`defense_modifier`
- 水流固定：学校→公园→车站，集市→居民区→车站；车站为汇流出口
- 「上游调蓄」「排蓄协同」「全域均衡」三个联动奖励
- 评分：`raw = Σ 权重 × 净安全度 + 联动奖励`，再经 `display_score()` 单调线性映射到展示分（不改排序）
- 等级：S ≥ 85 / A ≥ 72 / B ≥ 58 / C ≥ 42 / D < 42
- 前端 `src/engine/ruleEngine.ts` 与后端 `app/engine/` 读同一份 `rules/rules.json`，
  因此主界面「预期韧性」与推演结算分数一致（由 `check-engine-parity.mjs` 逐字段校验）

## 已知限制

- 规则为简化教学模型，分数与风险指标不是真实工程单位
- 评分上限做饱和裁剪，少数高分分配会并列 100 分（详见 `docs/verify-report.md`）
- `burst` 雨型偏易（中位分为 A 档），调平衡只改 `rules/rules.json` 并重跑 `pytest`
- 生产包已按 `charts / ui / icons / vendor` 拆分（业务入口 87 kB、vendor 94 kB、ui 47 kB、
  icons 18 kB），但 ECharts 核心仍有 481 kB：城市状态预测图是同步引入，首屏会一并下载；
  若要进一步瘦身，可把 `ImpactChart` 改成 `defineAsyncComponent` 按需加载
- 三份「推演过程 / 结算」旧版组件（`views/PlanningView.vue`、`views/ResultView.vue`、
  `components/GameShell.vue` 等）保留在仓库内但未挂载，实际入口是 `ReviewShell.vue`
- `docs/agent-progress.md` 由多个会话共同维护，历史段落保留原样
