# 验收报告 / Verify Report

- 验收时间：2026-11-19 夜
- 验收范围：可构建、可测试、可启动、规则红线复核
- **本次验收未修改任何源码与规则参数**，只新增 `README.md`、`start.bat`、`docs/verify-report.md`、`docs/overnight-report.md`

## 总览

| # | 项目 | 结论 | 证据 |
|---|---|---|---|
| 1 | 后端测试 | ✅ 26 passed | `pytest -q` → `..........................  [100%]` |
| 2 | 前端类型检查 | ✅ 0 error | `npm run typecheck` → exit 0 |
| 3 | 前端生产构建 | ✅ 0 error | `npm run build` → 4813 modules，5.93s，exit 0 |
| 4 | 前端可访问 | ✅ HTTP 200 | `vite preview` → `http://localhost:4173/` 返回 `雨落街角 / Rainfall Corner`，含 `#app` |
| 5 | 后端 API 可用 | ✅ HTTP 200 | `/api/config/scenarios` 1782B、`/api/config/rain-types` 577B |
| 6 | 端到端推演 | ✅ HTTP 200 | `POST /api/simulations/run` → `overallScore=83.0`、`grade=A`、`isValid=True` |
| 7 | 规格书 §4.4 红线 4 | ✅ 已消除 | 126×2 采样中 `fixed_dominant = []` |
| 8 | 评分等级可达性 | ✅ 已修复 | 等级分布 S48 / A62 / B100 / C41 / D1，上限 100 可达 |

## 关键证据明细

### 1. 后端测试

```
cd backend
.venv\Scripts\python.exe -m pytest -q
..........................                                               [100%]
26 passed, 1 warning（Starlette 对 httpx 的弃用提示，非失败）
```

覆盖内容包含 `test_sweep.py` 的 126 组合 × 2 雨型 = 252 次推演：

- 组合数恰为 126
- 252 次得分全部落在 0–100
- 不同分值数 > 60（实测 103 / 104）
- **两种雨型的最优配置不能相同**（反「固定最优解」）

### 2. 126 × 2 全组合实测分布

用真实引擎 `score_only()` 复算（不是估算）：

| 雨型 | 最低 | 中位 | 最高 | 不同分值 | 最优并列 | 最优分配 | 最高等级 |
|---|---|---|---|---|---|---|---|
| continuous 持续型 | 37.1 | 65.2 | 83.0 | 104 | 1 | `[1,1,3,0,0]` | A |
| burst 短时强降雨 | 54.0 | 81.0 | 100.0 | 103 | 4 | `[0,0,0,1,4]` | S |

等级分布（252 次）：S 48 / A 62 / B 100 / C 41 / D 1。

**两种雨型的最优分配不同，且不存在任何一套分配同时拿下两者最优** → `fixed_dominant = []`，规格书红线 4 成立。

### 3. 端到端推演（经 HTTP，不走内部函数）

```
POST http://127.0.0.1:8000/api/simulations/run
{"rainType":"continuous","allocation":{"school":1,"market":1,"park":3,"residential":0,"station":0}}

200  overallScore=83.0  grade=A  strategyType=偏科型  isValid=True
riskMetrics={"waterlogRisk":83,"lossRisk":77,"stationPressure":93,"drainageLoad":100}
triggeredSynergies=["上游调蓄"]
scenarioResults=5  forecast=6  events=11
```

与第 2 节 continuous 最优解 83.0 完全一致 → 引擎与 API 口径统一，无双重实现漂移。

## 遗留风险

1. **`burst` 雨型偏易**：中位分 81.0（A 级），252 次里有 110 次落在 A/S。演示时"短时强降雨"缺少张力。
   若需收紧，只改配置：`rules.json → rainTypes.burst.score_weights.station` 由 0.33 下调至约 0.28，或 `defense_modifier.station` 由 0.18 下调至约 0.12。**改完必须重跑 `test_sweep.py`。**

2. **满分饱和**：`display_score()` 在 100 处裁剪，`burst` 有 4 套分配并列 100.0，会削弱"同一输入同一输出可对比"的观感。
   若需消除并列，建议把 `scoring.raw_score_ceiling` 由 34.0 上调（当前最高 raw 已超过该值），保持 floor 20.0 不变；这只改映射区间，不改排序、不动引擎。

3. **进度文件由多会话共同维护**：`docs/agent-progress.md` 内含“会话 S0”的段落。若还有并行会话在写同一目录，改动会互相覆盖，**验收前请确认没有第二个会话在跑**。

## 复验（3 条命令，5 分钟）

```bat
cd C:\Users\11\Desktop\Competition_game\backend
.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
set PATH=C:\Program Files\nodejs;%PATH%
npm run typecheck && npm run build
```

## 环境说明

| 项 | 值 |
|---|---|
| 后端解释器 | `backend\.venv\Scripts\python.exe`（Python 3.14.5），**非系统 Python** |
| 系统 Python | 未安装（`python` 仍是应用商店占位符），因此所有命令必须用 venv 全路径 |
| Node / npm | `C:\Program Files\nodejs\npm.cmd`，npm 11.20.0；**node 未加入系统 PATH**，批处理里已显式前置 |
| 前端端口 | 开发 5199 / 预览 4173（`vite.config.ts`） |
| 后端端口 | 8000（前端 `API_BASE` 默认值） |
| 数据库 | SQLite，`init_db()` 于应用 lifespan 自动创建 |

## 雨滴可视化（本轮新增功能）

原状：三处降雨都是静态 CSS 渐变（`repeating-linear-gradient`）或两条 `span` 雨丝，**切换雨型只是换个背景图，看不到雨滴**；C 版水文仪完全没有降雨层。

现状：新增 Canvas 2D 粒子层 `frontend/src/components/shared/RainField.vue`，雨滴的**数量 / 速度 / 拖尾长度 / 倾角 / 溅落**全部由「雨型 + 雨量强度」驱动。

| 维度 | 持续型降雨（intensity 0.55） | 短时强降雨（intensity 0.92） |
|---|---|---|
| 粒子数 | 320 × 密度系数（约 217） | 140 × 密度系数（约 165） |
| 下落速度 px/s | 340–560 | 820–1320 |
| 拖尾长度 px | 14–26 | 26–60 |
| 倾角 | 7° | 16° |
| 地面溅落 | 无 | 18 个循环涟漪 |
| 观感 | 密、慢、短、近垂直 | 疏一些但更快更长、明显倾斜 |

接入点（4 处，覆盖全部界面）：

| 文件 | 界面 |
|---|---|
| `components/CityOverviewMap.vue` | 主流程「城市全景」 |
| `variants/a/ACityStage.vue` | A 雨夜指挥台 |
| `variants/b/BStage.vue` | B 沉浸全景 |
| `variants/c/CBainMap.vue` | C 水文仪（原先完全没有降雨层） |

配套：`variants/a/ARainRail.vue` 左栏新增 `RAIN LOAD` 强度条（5 格 + 百分比）与「雨滴 开/关」开关；`stores/game.ts` 新增 `rainIntensity`（仅驱动视觉，不参与规则计算）。

工程约束：固定种子线性同余初始化（同尺寸画面可复现）、DPR ≤ 2、`ResizeObserver` 跟随容器、`visibilitychange` 隐藏即暂停、`prefers-reduced-motion` 只画静态一帧、卸载时取消 rAF 与监听。

### 验证

| 项 | 结果 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0，4880 modules，7.00s |
| 主流程持续型 | 雨丝密布可见，见 `docs/screenshots/rain-continuous.png` |
| 主流程短时强降雨 | 雨丝明显更长更斜更亮，见 `docs/screenshots/rain-burst.png` |
| 评审页 A 版 | 雨滴 + `RAIN LOAD 55%` 强度条正常，见 `docs/screenshots/variant-a-raindrops.png` |

注：像素统计（区域内蓝色通道亮于基线的采样点）差异不足 3%，因为背景城市本身是深蓝色系，该指标无法区分雨丝；**判据以同分辨率截图目视对比为准**，两张图已在 `docs/screenshots/` 留档。

---

# 补充验收 · 功能补齐后（本次会话）

- 范围：主流程接通、前后端引擎一致性、历史记录 / 排行榜 / 设置、后端 history / leaderboard 接口
- 原则：只记录实际执行过的命令与真实输出；未跑通的项标注为未跑通

## 1. 命令与实际输出

| # | 命令 | 实际结果 |
|---|---|---|
| 1 | `backend\.venv\Scripts\python.exe -m pytest -q` | `................................  [100%]` → **32 passed**，exit 0 |
| 2 | `node frontend\scripts\check-engine-parity.mjs` | `parity rows=252 mismatched=0 backendRows=252`，exit 0 |
| 3 | `node node_modules\vue-tsc\bin\vue-tsc.js --noEmit` | 无输出，exit 0 |
| 4 | `node node_modules\vite\bin\vite.js build` | `✓ built`，`dist/assets/index-*.js 716.57 kB` / `index-*.css 77.73 kB`，exit 0 |
| 5 | `.review/harness/flow-check.mjs`（headless Edge，dev server 5199，后端 8000 在线） | 主流程全部通过，见下表 |

## 2. 主流程实测（生产构建 dist，真实后端 8000，两种分辨率）

截图：`.review/flow-1440x900-*.png`、`.review/flow-1366x768-*.png`（规划 / 推演 / 结算 / 历史 / 榜单 / 设置各一张）

| 检查项 | 1440×900 | 1366×768 |
|---|---|---|
| 预算显示 | 已分配 5/5 剩余 0 | 已分配 5/5 剩余 0 |
| 主界面预期 | 预期韧性 79.5 · A 级 | 预期韧性 79.5 · A 级 |
| 推演过程 | 可见，第 2/6 步、可见事件 6 条 | 同 |
| 结算总分 | 73.5/100 · 韧性良好 · 多元型 | 同 |
| 五场景分项 | 5 行 | 5 行 |
| 因果解释 / 事件 / 建议 | 4 / 11 / 3 | 4 / 11 / 3 |
| 结果来源标注 | 后端引擎 | 后端引擎 |
| 规则版本 / 记录号 | rain-five-v1 / sim-continuous-b7fef49f86 | 同 |
| 页面溢出 | 1440×900 无滚动 | 1366×768 无滚动 |
| 历史记录 | 6 条，标题「本机 SQLite 推演记录 + 浏览器快照」 | 同 |
| 历史回看 | 重新打开为 73.5/100（与当次一致） | 同 |
| 排行榜 | 6 行 | 6 行 |
| 设置页后端状态 | 已连接 · 规则 rain-five-v1 | 同 |
| 控制台错误 | 无 | 无 |


```
budget = 已分配 5 / 5 剩余 0
preview score = 预期韧性 79.5 · A 级           ← 与后端 balanced/continuous 的 79.5 完全一致
after move = 已分配 5 / 5 剩余 0
overlay visible = true
overlay step = 场景防护 · 第 2/6 步
visible events = 6
score = 73.5/100
grade = 韧性良好
strategy = 多元型
breakdown rows = 5
explanations = 4
events = 11
recommendations = 3
source chip = 后端引擎
rules/footer = rules rain-five-v1 sim sim-continuous-b7fef49f86
viewport overflow = {"scrollWidth":1440,"clientWidth":1440,"scrollHeight":900,"clientHeight":900}
history rows = 6
history subtitle = 本机 SQLite 推演记录 + 浏览器快照
reopened score = 73.5/100
rank rows = 6
```

结论：规划 → 推演过程 → 结算 → 历史回看 → 排行榜 全链路可用；结算页必备信息齐全
（总分/等级/策略/五场景分项/风险/联动/事件/4 条解释/3 条建议），1440×900 无滚动溢出。

## 3. 本次修掉的实际缺陷

| 缺陷 | 影响 | 修复 |
|---|---|---|
| 前端预览与后端分数不同口径 | 主界面「预期韧性」与结算分数不一致 | `engine/ruleEngine.ts` 与后端逐行对齐，共用 `rules/rules.json`；252 组逐字段比对为 0 差异 |
| 后端事件日志串场景 | `_build_events` 用 `school, park, market, ... = (water[k] for k in SCENARIO_ORDER)` 解包，`SCENARIO_ORDER` 实为 `school, market, park, ...`，导致「进入公园调蓄」恒取集市的来水（0） | 按场景 id 显式取值，`test_engine` 与 252 组比对均通过 |
| 「开始推演」只弹预演摘要 | 推演过程页与结算页无入口 | 三套设计版本的 CTA 直接调用 `simulation.run()`；`ReviewShell` 挂 `SimulationOverlay` + `ResultScreen` |
| 顶部导航 4 项为死链 | 历史记录 / 排行榜 / 设置无内容 | 新增面板组件与 `stores/ui.ts`，三版本共用 |
| 面板遮罩挡住顶部导航 | 打开一个面板后无法切换另一个面板 | 遮罩 `pointer-events: none`，面板本体 `auto`；关闭走 X / Esc |
| 双入口残留 | `main.ts` 引用已删除的 `App.vue`，构建报 `Could not resolve "./App.vue"` | 入口收敛为 `main.ts → ReviewShell.vue` |

## 4. 未完成 / 已知限制

1. `burst` 偏易（中位 A 档）与 100 分饱和仍是规则平衡问题，本次未调整 `rules.json`（避免打乱既有验收数据）。
2. 生产包单 chunk 716 kB（ECharts + Naive UI），未做 `manualChunks`。
3. 本机 Python / Node 冷启动极慢（单进程曾需 ~40s），验证命令须串行执行；并发跑多个 node/python 会双双卡住。
4. 仓库内还有另一个会话在写文件（`main.ts`、`App.vue`、`simulation.ts` 均被其改写过），
   本次已把入口与状态收敛到单一实现；若继续并行开发，请先确认没有第二个写入方。

---

# 功能补齐验收 · 场景详情 / 三版分配 / 结果对比 / 分包（本次会话）

- 原则：先实测找缺口，再补，再复测；只记录真实命令与输出。

## 1. 先查出来的三个真实缺口（实测证据）

| 缺口 | 探针输出 | 影响 |
|---|---|---|
| 场景详情缺失 | 点 A 版场景节点后 `selected nodes = 1 | panels = []` | 规格书 §5.5 与 §9.2「场景节点可点开详情」不成立 |
| C 版无法分配资源 | `InstrumentC.vue` 中 `Plus / Minus / stepper / fillBalanced / reset` 全部为 0 处 | C 版只能看默认 1/1/1/1/1，无法执行 5 点分配（P0 主玩法） |
| B 版无重置 | `BChrome.vue`（B 版实际挂载的分配器）无「清空 / 均衡」 | §9.2「重置可用」在 B 版不成立 |

探针脚本：`.review/harness/probe-gaps.mjs`（headless Edge，dev server 5199）。

## 2. 本次改动

| 文件 | 改动 |
|---|---|
| `frontend/src/components/panels/SceneDetailPanel.vue` | 新增：三版共用的场景详情抽屉（规格 §5.5 全字段：概览 / 0–5 档位表 + 边际 / 本轮读数 + 相对基准 Δ / 固定水流关系 + 传递系数 / 联动阈值进度 / 策略提示 + 免责标注），面板内可直接加减点 |
| `frontend/src/composables/useSceneDetail.ts` | 新增：视图模型。档位曲线、传递系数、暴露度、评分权重、联动阈值读 `rules.json`；本轮读数与联动是否触发读 `store.preview`，**组件内零评分** |
| `frontend/src/components/panels/PanelFrame.vue` | 加 `width` 属性（默认 468px，场景详情用 410px） |
| `frontend/src/ReviewShell.vue` | 挂载场景详情抽屉；与导航侧栏互斥；`Esc` 先关抽屉再关侧栏 |
| `frontend/src/variants/{a,b,c}/*` | 场景节点 / 分配行加「点击查看详情」title；C 版表格新增 `− 点数 +` 步进列 + 资源分配条（已分配 / 剩余 / 均衡 / 清空）；B 版分配器补「均衡 / 清空」 |
| `frontend/src/services/compare.ts` | 新增：与上一轮推演对比（本机快照相减，不重算分数） |
| `frontend/src/components/SimulationResultDashboard.vue` | 新增「与上一轮对比」块：分数差 / 上一轮等级策略 / 配置变化 / 净安全度变化最大的 3 个场景 |
| `frontend/src/views/ResultScreen.vue` | 计算并下发 `previous` |
| `frontend/vite.config.ts` | `manualChunks`：charts / ui / icons / vendor；`chunkSizeWarningLimit: 600` |
| `frontend/index.html` + `public/favicon.svg` | 本地图标 + description + theme-color，消除 `/favicon.ico` 404 |

## 3. 命令与实际输出

```
backend\.venv\Scripts\python.exe -m pytest -q
→ 32 passed, 1 warning in 0.77s（PYTEST_EXIT=0）

node frontend\scripts\check-engine-parity.mjs
→ parity rows=252 mismatched=0 backendRows=252（PARITY_EXIT=0）

node frontend\node_modules\vue-tsc\bin\vue-tsc.js --noEmit
→ 无输出（TYPECHECK_EXIT=0）

node frontend\node_modules\vite\bin\vite.js build
→ ✓ 4865 modules transformed，6.28s，退出码 0
  dist/assets/index-CUb4k6ou.js    87.57 kB │ gzip  32.30 kB
  dist/assets/vendor-Dci4yI3o.js   94.29 kB │ gzip  37.02 kB
  dist/assets/ui-CQVn9nRY.js       46.65 kB │ gzip  14.81 kB
  dist/assets/icons-Dr5HoLh5.js    17.73 kB │ gzip   3.99 kB
  dist/assets/charts-f-M0GTtF.js  480.58 kB │ gzip 161.51 kB
  dist/assets/index-BkRYZAC0.css   86.64 kB │ gzip  14.77 kB
  （拆分前为单 chunk 726.72 kB 并伴随 >500 kB 警告；本次构建无该警告）
```

浏览器验收（生产构建 dist，静态服务 5200，真实后端 8000）：

```
node .review/harness/flow-check.mjs（VIEWPORT=1440x900 / 1366x768）
→ 预算 5/5、预期 79.5·A、推演 6 步、结算 73.5/100·多元型、分项 5 / 解释 4 / 事件 11 / 建议 3
  来源「后端引擎」、rules rain-five-v1、历史 8 条可回看、榜单 8 行、设置「已连接」
  两种分辨率 overflow 均为 0、console errors = none

node .review/harness/check-scene-detail.mjs
→ 三版 × 1440 + A 版 1366 共 4 组，每组 12 项全 PASS（ALL PASS）
  抽屉标题「学校 · 场景详情」、读数 4 格、档位表 6 行、水流关系 2 条、联动 1 条
  策略提示「再投 1 点 → 本地防护达成率 +14 个百分点，但 5 点已分完…」
  满 5 点 + 号禁用；面板内 −1 后恢复；Esc 关闭；无溢出

node .review/harness/check-variants-alloc.mjs
→ A/B/C × 1366×768 + 1440×900 共 6 组，每组 8 项全 PASS（ALL PASS）

node .review/harness/check-compare.mjs
→ 第一轮 79.5（无对比块）→ 第二轮公园 5 点 66.4，对比头「79.5 → 66.4 −13.1 上一轮 A 级 · 均衡型」
  配置行「上一轮配置 学1 集1 公1 居1 车1 · 本轮变化 学校 -1 / 集市 -1 / 公园 +4 / 居民区 -1 / 车站 -1」
  场景变化 3 行，控制台无错误（ALL PASS）
```

截图：`.review/scene-detail-*.png`、`.review/variants-*.png`、`.review/compare-result.png`、
`.review/flow-*.png`。

## 4. 仍未做（如实保留）

1. `burst` 偏易与 100 分饱和未调整（规则平衡需你决策，改法见上一节遗留风险 1、2）。
2. `ImpactChart` 仍是同步引入，charts chunk 481 kB 会随首屏下载；改成异步可再省 480 kB，但会引入图表的加载态，本轮未动。
3. 挑战目标（规格 §10.2 P1）与同设备双人 PK（P2）未实现；当前 P1 只补齐了「历史记录 / 结果对比 / 场景详情」。

---

# 吸收 `rain-corner-main` 优点（本次会话）

对照仓库 `C:\Users\11\Desktop\rain-corner-main`（同题材交付版）逐项比对，**只移植与规格不冲突的能力，
不替换我们已验收的引擎、三套设计版本与 252 组一致性校验**。

| 它的优点 | 我们的处理 | 证据 |
|---|---|---|
| 同设备双人轮流 PK、锁定先手、同分归先手 | **移植**：新增 `stores/pk.ts` + `components/panels/PkPanel.vue`，判定改为「韧性分严格更高才胜，同分归玩家一」；导航新增「双人 PK」；结算页按回合切换「锁定本局 · 交给玩家二 / 再开一局 PK」 | `.review/harness/check-pk.mjs`：玩家一 66.4 → 锁定 → 玩家二 79.5 → 判定「玩家二获胜 +13.1」，摊牌表 5 行，比分与两轮结算一致 |
| 结算文案分层（把判定翻译成中文，不重算） | **移植思路**：判定文案集中在 `stores/pk.ts` 的 `verdict`，组件只渲染 | 同上 |
| 五点摊牌对比表 | **移植**：PK 侧栏表格同时给「双方投入 + 净安全 Δ」 | 同上 |
| `start.bat` 端口占用检测（不会误把别人的服务当自己） | **移植**：启动前检测 8000 占用，打印 PID 与两种处理办法 | `cmd /c netstat…` 实测输出 `FREE`；占用时打印 `[提示] 8000 端口已被别的程序占用` |
| 分层城市地图 / 白泽彩蛋 / 行人动画 | **不移植**：依赖其自有坐标与素材体系，替换会破坏我们已验收的三套布局与 1366/1440 无溢出证据 | — |
| 峰值/十分位水文内核 | **不移植**：与我们的 0–100 韧性分口径不同，替换等于推翻 252 组一致性与既有验收数据 | `pytest` 32 passed、`parity rows=252 mismatched=0` 仍全绿 |

复跑输出：

```
backend\.venv\Scripts\python.exe -m pytest -q  → 32 passed, 1 warning in 0.78s
node frontend\scripts\check-engine-parity.mjs  → parity rows=252 mismatched=0 backendRows=252
node frontend\node_modules\vue-tsc\bin\vue-tsc.js --noEmit → exit 0
node .review\harness\check-pk.mjs → 11 项 PASS（唯一 FAIL 是 8000 被第三方服务占用导致的 CORS 噪音，
                                   该情形下前端已按设计降级到「本地预览引擎」，不影响判定）
```
