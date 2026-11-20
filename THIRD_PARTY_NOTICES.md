# THIRD_PARTY_NOTICES

本项目（雨落街角 / Rainfall Corner，前端部分）使用的第三方资源与参考实现登记。
**原则**：基础设施直接依赖并遵守许可证；算法思路仅参考、代码自写；不整仓迁移他方 UI 或游戏逻辑。

## A 级 · 直接依赖（npm，随 package.json 安装）

| 项目 | 版本 | License | 用途 | 引入方式 |
|---|---|---|---|---|
| Vue | ^3.5 | MIT | 组件框架 | 依赖 |
| Vite | ^5.4 | MIT | 构建与开发服务器 | 依赖（dev） |
| TypeScript | ~5.6 | Apache-2.0 | 类型系统 | 依赖（dev） |
| vue-tsc | ^2.1 | MIT | 类型检查 | 依赖（dev） |
| Pinia | ^3.0 | MIT | 状态管理 | 依赖 |
| Naive UI | ^2.40 | MIT | NModal 等基础弹层 | 依赖 |
| Tailwind CSS | ^4.0 | MIT | 原子化样式（仅构建期） | 依赖（dev） |
| ECharts | ^5.5 | Apache-2.0 | 城市状态预测双线图 | 依赖 |
| Lucide（lucide-vue-next） | ^0.454 | ISC | 图标 | 依赖 |

## B 级 · 仅参考思路（未复制任何源码）

| 项目 | 仓库 | License | 参考了什么 | 本项目的实现 |
|---|---|---|---|---|
| IsoCity / isometric-city | github.com/amilich/isometric-city | MIT | ① Canvas 等距网格的「深度排序 + 图层管理」思路；② 用 HTML 浮层承载交互、Canvas 只负责绘制的分工 | 自写：`scripts/assets/iso.mjs` 的 2:1 等距投影与图元工厂（box/windows/plate/road/water/tree/lamp/car/rain），按 (x+y) 直觉顺序绘制；交互全部用 HTML 浮层（`variants/*/`），未使用 Canvas 命中测试 |
| Cimulity | github.com/zeikar/cimulity | MIT | ① `input → engine（命令）→ core（状态）→ render（只读）` 的分层红线；②「线宽/数值表达流量」的数据可视化手法 | 自写：`stores/game.ts` 作唯一写入口，`engine/previewEngine.ts` 承担全部规则计算，组件只读 `store.preview`；水路连线粗细取 `outflow` |

> 两者均为 **MIT**。本项目**未复制**其代码、素材或 UI；如需正式移植，应另走 `docs/opensource` 审计流程并保留版权声明。

## 资产

- `frontend/public/assets/scenes/*.svg`：本项目自建，由 `scripts/build-scene-assets.mjs` 程序化生成（无第三方素材、无外链、无字体子集依赖）。
- 字体：仅使用系统字体栈（Bahnschrift / Microsoft YaHei UI / PingFang SC 等），不打包第三方字体文件。
