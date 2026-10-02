# Flow Pilot

Flow Pilot 的目标是让用户在多个客户端创建、执行和追踪网页任务。本地服务将负责调度和执行，并向客户端提供统一的任务与运行记录。客户端连接方式与后台运行策略将在实现相应能力时确定。

## 当前实现

仓库目前包含一个可运行的桌面交互原型，以及用于预览同一界面的网页构建。首页支持创建任务和设置定时；任务页展示页面内容、执行进度和按时间排列的活动记录。

现阶段的网站页面、登录判断、AI 分析、工具调用和发布动作均为模拟。任务状态保存在本机浏览器存储中；定时仅在应用窗口打开且电脑唤醒时检查，错过的运行不会补跑。当前网页构建是桌面界面的预览，并非独立的网页客户端。

仓库使用 pnpm workspace。当前桌面界面、Electron 主进程和共享业务模块采用 TypeScript / TSX；Sites 交接所需的 Worker 与构建脚本仍是独立的 JavaScript 适配层。本地服务及其他客户端尚未实现。

| 目录 | 职责 |
| --- | --- |
| `packages/contracts/` | 当前可复用的定时规则类型 |
| `packages/domain/` | 不依赖界面的定时计算 |
| `apps/desktop/src/app/` | 桌面任务状态、持久化与页面路由 |
| `apps/desktop/src/features/` | 首页、任务详情、活动浮窗和定时编辑 |
| `apps/desktop/src/demo/` | 演示任务、自然语言示例与窗口内模拟调度 |
| `apps/desktop/src/presentation/` | 界面显示文案与时间标签 |
| `apps/desktop/src/styles/` | 按界面区域拆分的桌面样式 |
| `apps/desktop/electron/` | Electron 主进程与静态资源协议 |

演示任务模型只服务于当前桌面原型，不作为未来客户端的数据契约。目前模拟调度仍由打开的界面驱动。接入本地服务时，应先定义正式的任务与运行记录契约，再由服务持有状态和调度执行权。

## 本地开发

需要 Node.js 22 或更新版本，以及 pnpm 11。在仓库目录运行：

```bash
pnpm install --frozen-lockfile
pnpm desktop:dev
```

桌面窗口会直接打开。使用 `pnpm dev` 可预览相同的界面。

## 桌面打包

`pnpm desktop:mac` 构建 Apple 芯片 Mac 应用；`pnpm desktop:linux` 构建 Linux x64 应用。产物位于仓库上一级的 `desktop-builds` 目录，打包内容为构建后的静态界面与 Electron 主进程，不包含开发服务器。

Mac 构建适用于 macOS 13 或更新版本，目前未签名、未公证。取得 `Flow Pilot.app` 后可将其移至“应用程序”。若 macOS 提示无法验证开发者，可尝试打开一次，再到“系统设置 → 隐私与安全性”选择“仍要打开”；若提示应用已损坏，请停止运行，并在 Mac 上从源码重新构建或等待签名版本。

## 验证

```bash
pnpm test
pnpm format:check
```
