# 无人直播助手 (WindV)

> 多平台无人直播 AI 辅助系统 - Windows 桌面应用

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Electron](https://img.shields.io/badge/Electron-28.0.0-green)
![Vue](https://img.shields.io/badge/Vue-3.4.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🤖 **AI 智能回复** | 自动识别弹幕意图，智能匹配话术回复 |
| 📺 **多平台支持** | 淘宝、拼多多、抖音、视频号全覆盖 |
| 💬 **话术库管理** | 分类管理、批量导入导出、关键词匹配 |
| ⏰ **定时播报** | 自动定时播报产品卖点、活动信息 |
| 📊 **数据统计** | 实时统计、数据报表、Excel 导出 |
| 🛡️ **风控防护** | 违禁词过滤、频率控制、真人模拟 |
| 🔔 **成交播报** | 自动监测订单、实时播报成交信息 |
| 💾 **数据备份** | 一键备份恢复，数据安全有保障 |

## 📋 支持的平台

| 平台 | 状态 | 说明 |
|------|------|------|
| 🛒 淘宝直播 | ✅ 已支持 | WebSocket 拦截方案 |
| 📦 拼多多直播 | ✅ 已支持 | Playwright 自动化 |
| 🎵 抖音电商 | ✅ Beta | 需要测试验证 |
| 📱 视频号直播 | ✅ Beta | 需要测试验证 |

## 🛠️ 技术栈

- **桌面框架**: Electron 28 + Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **本地数据库**: SQLite (better-sqlite3)
- **浏览器自动化**: Playwright
- **构建工具**: Vite + electron-builder
- **AI 引擎**: 规则 + 关键词 + 模糊匹配 (Fuse.js)

## 📁 项目结构

```
windv/
├── electron/                      # Electron 主进程代码
│   ├── main/
│   │   ├── database/             # SQLite 数据库
│   │   │   └── index.ts          # 数据库初始化 + 8张表
│   │   ├── ipc/                  # IPC 通信处理器
│   │   │   └── index.ts          # 20+ IPC 通道
│   │   ├── modules/              # 业务模块
│   │   │   ├── PlatformManager.ts    # 平台管理器
│   │   │   ├── ScriptManager.ts      # 话术管理器
│   │   │   ├── StatisticsCollector.ts # 统计收集器
│   │   │   ├── RiskController.ts     # 风控防护
│   │   │   ├── TrayManager.ts         # 系统托盘
│   │   │   ├── SettingsManager.ts     # 设置管理
│   │   │   ├── BackupManager.ts      # 备份恢复
│   │   │   └── TimingAnnouncer.ts     # 定时播报 ⭐新增
│   │   ├── platform/              # 平台适配层
│   │   │   ├── IPlatformAdapter.ts   # 适配器接口
│   │   │   └── adapters/
│   │   │       ├── TaobaoAdapter.ts      # 淘宝适配器
│   │   │       ├── PinduoduoAdapter.ts   # 拼多多适配器
│   │   │       ├── DouyinAdapter.ts      # 抖音适配器 ⭐新增
│   │   │       └── VideoWeAdapter.ts     # 视频号适配器 ⭐新增
│   │   └── ai/                    # AI 引擎
│   │       ├── IntentClassifier.ts  # 意图分类器
│   │       └── ScriptMatcher.ts     # 话术匹配器
│   └── preload/                   # Preload 脚本
├── src/                          # Vue 前端代码
│   ├── views/                    # 6 个页面
│   ├── router/                   # 路由配置
│   └── styles/                   # SCSS 样式
├── resources/                     # 图标资源 ⭐已添加
│   ├── icon.png
│   └── icon.ico
└── dist/                        # 构建输出
```

## 🚀 快速开始

### 环境要求

- Node.js 18+ (推荐 20.x)
- Python 3.10+ (用于编译原生模块)
- Windows 10/11

### 安装依赖

```bash
cd windv
npm install
```

### 原生模块编译

如果 better-sqlite3 或 nodejieba 编译失败，执行：

```bash
npm install electron-rebuild --save-dev
npx electron-rebuild -f -w better-sqlite3
npx electron-rebuild -f -w nodejieba
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
# 仅构建前端和主进程
npm run build:vite

# 完整打包（生成安装程序）
npm run build
```

## 📖 使用指南

### 首次使用

1. 启动应用后，进入「平台适配」页面
2. 添加直播间（支持淘宝/拼多多/抖音/视频号）
3. 配置直播页面 URL
4. 在「话术库」页面添加常用回复话术
5. 设置「定时播报」话术（可选）
6. 返回「仪表盘」，点击「启动监控」

### 话术配置

| 意图类型 | 关键词示例 | 说明 |
|---------|-----------|------|
| chat | 欢迎、666、棒 | 日常互动 |
| price | 价格、多少钱、便宜 | 价格咨询 |
| logistics | 发货、几天到、快递 | 物流咨询 |
| aftersale | 退货、售后、保修 | 售后咨询 |
| size | 尺码、大小、S/M/L | 尺码咨询 |
| discount | 优惠、优惠券、满减 | 优惠咨询 |

### 风控设置

- **回复延迟**: 1-3 秒随机延迟，模拟真人操作
- **频率限制**: 每分钟最多 20 条回复（可配置）
- **违禁词过滤**: 自动过滤广告引流等敏感内容
- **真人模拟**: 随机语序、语气词变化

## 📊 开发进度

### V1.0 ✅ 已完成

- [x] 项目脚手架搭建
- [x] Electron 主进程框架
- [x] SQLite 数据库（8 张表）
- [x] IPC 通信架构
- [x] 淘宝直播适配器
- [x] 拼多多直播适配器
- [x] AI 意图分类引擎
- [x] 话术匹配引擎
- [x] 风控防护模块
- [x] 数据统计模块
- [x] 备份恢复模块
- [x] 6 个前端页面
- [x] 系统托盘
- [x] 应用图标 ⭐

### V2.0 ✅ 已完成

- [x] 抖音电商适配器 ⭐
- [x] 视频号直播适配器 ⭐
- [x] 定时话术播报模块 ⭐
- [ ] AI 语义模糊识别（需要更多数据）
- [ ] 数据可视化报表（ECharts）
- [ ] 批量话术导入导出

### V3.0 🔄 规划中

- [ ] 云端话术同步
- [ ] 更多小众平台适配
- [ ] AI 自动话术学习
- [ ] 多电脑协同

## ⚠️ 注意事项

1. **合规使用**: 本软件仅作为直播辅助工具，请遵守各平台规则
2. **风控风险**: 不同平台对自动化工具敏感度不同，建议先小规模测试
3. **数据安全**: 所有数据本地存储，不会上传云端
4. **浏览器支持**: 需要使用 Chrome/Edge 浏览器打开直播页面

## 🔧 常见问题

### Q: Playwright 浏览器下载失败？

```bash
# 设置代理或镜像
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npx playwright install chromium
```

### Q: better-sqlite3 编译失败？

```bash
# 确保安装了 Python 和 node-gyp
npm install -g node-gyp

# 重新编译
npx electron-rebuild -f -w better-sqlite3
```

### Q: 应用启动后无法显示窗口？

检查是否有图形界面环境。在无头服务器上需要使用 Xvfb：

```bash
xvfb-run npm run dev
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 邮箱: windv@example.com
- GitHub: https://github.com/windv/liveassistant

---

**提示**: 本项目仅供学习研究使用，请遵守相关法律法规和平台规则。
