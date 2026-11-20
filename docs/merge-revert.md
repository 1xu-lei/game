# 备份与回退说明（融合 rain-corner-main 之后补记）

## 1. 现在有哪些可回退的备份

| 备份 | 内容 | 怎么用 |
|---|---|---|
| Git 分支 `backup-before-merge-2026-11-20` → 提交 `e7c6a3a` | **今天所有工作之前**的完整状态（功能补齐、融合都没做） | 见下方命令 |
| Git 提交 `7b83811`（`main`） | **当前状态快照**：功能补齐 + 融合 rain-corner-main | 也是现在工作区的状态 |
| `_backup/2026-11-20-post-merge.zip`（12.7 MB） | 当前状态的可离线拷贝（由 `git archive HEAD` 生成，自动排除 `node_modules` / `.venv` / `dist` / `.review`） | 解压即用 |

> 本机 `git` **不在 PATH**，但已安装：`C:\Program Files\Git\cmd\git.exe`。
> 下面命令都在仓库根目录执行。

```powershell
$git = 'C:\Program Files\Git\cmd\git.exe'

# 看历史
& $git log --oneline --all

# A. 只看看「融合/补齐之前」某个文件（不改工作区）
& $git show e7c6a3a:frontend/src/ReviewShell.vue

# B. 整体回到「今天所有工作之前」（危险：会覆盖工作区，先确认已备份）
& $git restore --source e7c6a3a -- .

# C. 回到刚打好的当前快照（撤销上面的 B）
& $git restore --source 7b83811 -- .
```

## 2. 只想撤掉「融合 rain-corner-main」，保留功能补齐？

**没有单独的中间提交**（融合是在功能补齐的工作区上直接改的）。但融合改动很小且全是加法，可按下面清单精确回退：

新增文件（删掉即可）：

```
frontend/src/stores/pk.ts
frontend/src/components/panels/PkPanel.vue
.review/harness/check-pk.mjs
```

已有文件的 6 处改动（逐个反向删除）：

| 文件 | 需要撤掉的内容 |
|---|---|
| `frontend/src/types/index.ts` | `NavKey` 末尾的 `\| 'pk'` |
| `frontend/src/config/sites.ts` | `NAV_ITEMS` 里的 `{ key: 'pk', label: '双人 PK', icon: 'Swords' }` |
| `frontend/src/components/shared/TopNav.vue` | `Swords` 的 import 与 `ICONS` 表项 |
| `frontend/src/ReviewShell.vue` | `PkPanel` 的 import 与 `<PkPanel v-if="ui.nav === 'pk'" … />` |
| `frontend/src/views/ResultScreen.vue` | `usePkStore` / `Swords` / `Trophy` / `Users` 引用、`lockFirst/restartPk/quitPk`、footer 的 `v-if="pk.active"` 两段、`.pk-badge` / `.pk-verdict` 样式 |
| `frontend/src/stores/simulation.ts` | `usePkStore` import、`const pk = usePkStore()`、`run()` 里 `if (pk.active && pk.turn === 2) pk.commitSecond(...)` |
| `start.bat` | `[3/4] 检查 8000 端口...` 整个 `if not errorlevel 1 (...)` 块（并把下一行改回 `[3/4] 启动后端`） |

文档类改动（不影响运行，可保留）：`README.md` 功能表「双人 PK」行、`docs/verify-report.md` 与
`docs/agent-progress.md` 的「吸收 rain-corner-main」小节。

## 3. 之后的规矩

- 每个阶段结束先 `git add -A && git commit`，再动手改下一块；融合/重构前先开分支：
  `& $git branch backup-<阶段>-<日期>`。
- 本轮已按此补上：分支 `backup-before-merge-2026-11-20` + 快照提交 `7b83811` + 离线 zip。
