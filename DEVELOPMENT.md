# 开发文档

本项目是一个面向好友娱乐的浏览器多人竞拍游戏原型。目标是尽量保持低部署成本：一台电脑启动 Node.js 服务，同一局域网或同机浏览器即可进入房间游玩。

## 快速启动

```bash
npm start
```

默认地址：

- 玩家页面：`http://localhost:3000/`
- 后台页面：`http://localhost:3000/admin.html`

检查命令：

```bash
npm run check
npm run selftest
```

公网部署请先阅读 [DEPLOYMENT.md](./DEPLOYMENT.md)。至少需要设置 `ADMIN_TOKEN`，并建议通过 Nginx/Caddy 提供 HTTPS。

Docker 部署入口：

- `Dockerfile`：构建生产镜像。
- `docker-compose.yml`：单服务部署，持久化卷为 `/app/data`。
- `.env.docker.example`：Compose 环境变量模板。

## 目录结构

```text
src/server.js                 Node.js 服务端、房间状态、账号鉴权、结算持久化
public/index.html             玩家端页面结构
public/admin.html             后台页面结构
public/js/app.js              玩家端主逻辑
public/js/admin.js            后台交互逻辑
public/css/styles.css         玩家端样式
public/css/admin.css          后台样式
config/server-config.json     可视化后台保存的玩法配置
config/loot-config.json       地图、藏品、仓库模板配置
data/accounts.json            本地账号、现金、仓库、会话数据
scripts/selftest-server.js    服务端流程自测
scripts/run-admin.js          一键启动后台辅助脚本
public/assets/characters/     角色立绘
public/assets/audio/          角色和事件音效
public/assets/item-textures/  藏品贴图与比例占位图
```

根目录的 `占位.png`、`占位立绘.png`、`占位音效.wav` 是生成新占位资源的源文件，不建议删除。

## 运行模型

项目当前没有数据库依赖，服务端把房间保存在内存里，把账号数据写入 `data/accounts.json`。

核心流程：

1. 登录或注册账号。
2. 选择角色和最多 4 种携带道具。
3. 创建或加入房间。
4. 房主开始对局，服务端生成地图暗仓。
5. 每轮自动触发角色技能，玩家可使用 1 次道具并提交报价。
6. 服务端开标、处理平局或倍率提前成交。
7. 结算页逐件清点，赢家选择上锁物品，确认后写回账号仓库。

## 配置扩展

### 地图和藏品

主要配置在 `config/loot-config.json`：

- `mapSettings`：地图档位、门票、资源预算、稀有度权重、品类权重。
- `items`：藏品池，包括 `id`、`name`、`w`、`h`、`rarity`、`value`、`mark`、`tags`、`image`。
- `warehouses`：仓库主题模板，用标签筛选藏品池。

新增藏品时建议：

1. 添加唯一 `id`。
2. 设置 `w`/`h`，当前建议 1 到 5 格。
3. 设置基础值 `value`，最终生成时会按品相浮动。
4. 图片放到 `public/assets/item-textures/`，在 `image` 写相对路径，如 `assets/item-textures/old-book.png`。

### 角色

前端角色定义在 `public/js/app.js` 的 `ROLES`，服务端角色定义在 `src/server.js` 的 `ROLE_POOL`。新增角色时两边都要同步：

- `id`
- `name` / `role`
- `shortName`
- `trait`
- `portrait`
- `voice`
- `summary`

角色自动技能逻辑：

- 前端单机：`applyGameStartRoleSkills`、`applyRoundStartRoleSkills`
- 服务端多人：同名函数在 `src/server.js`

### 道具

道具定义在前后端各一份 `TOOL_DEFS`，当前分为普通、稀有、史诗、传说四档。

新增道具时需要：

1. 在 `public/js/app.js` 和 `src/server.js` 增加同 id 定义。
2. 在前端 `applyToolEffect(tool)` 实现单机效果。
3. 在服务端 `applyToolEffect(game, player, tool)` 实现多人权威效果。
4. 如果道具会揭示信息，优先写入玩家私有视野，不要直接改全局藏品。

## 线上同步与隐私

多人对局使用 HTTP 轮询。前端通过 `GET /api/rooms/:id?playerId=...` 拉取房间快照，通过 `POST /api/rooms/:id/action` 提交意图。

服务端原则：

- 出价、道具、角色技能、结算都由服务端判定。
- 玩家只能收到自己视角下可见的暗仓信息。
- `publicGame` 会裁剪藏品字段：未揭示藏品不返回名称、价值、品相等敏感信息。
- 断线玩家会在超时后由 AI 接管。
- 玩家离开房间后，如果房间只剩 AI，会自动销毁。

## 常用 API

- `GET /api/health`：服务状态。
- `GET /api/auth/me`：当前登录账号。
- `POST /api/auth/register`：注册。
- `POST /api/auth/login`：登录。
- `POST /api/auth/logout`：退出。
- `GET /api/account`：账号资产和仓库。
- `POST /api/rooms`：创建房间。
- `POST /api/rooms/:id/join`：加入房间。
- `GET /api/rooms/:id`：获取房间快照。
- `POST /api/rooms/:id/action`：提交房间动作。
- `GET /api/admin/rooms`：后台房间列表。
- `GET /api/admin/loot-config`：读取藏品配置。
- `PUT /api/admin/loot-config`：保存藏品配置。
- `GET /api/admin/config`：读取玩法配置。
- `PUT /api/admin/config`：保存玩法配置。

常见 action：

- `startGame`
- `setMap`
- `setRole`
- `setTools`
- `useTool`
- `submitBid`
- `setSettlementLock`
- `skipSettlement`
- `confirmSettlement`
- `leaveRoom`

## 性能注意

当前主要性能成本来自房间轮询和大暗仓 DOM 渲染。

已经做的优化：

- 线上快照按玩家视野裁剪藏品字段，减少隐藏信息和 payload。
- 结算仓库渲染使用签名缓存，避免每次轮询都重建 DOM。
- 房间只剩 AI 时自动销毁，减少无效轮询对象。

继续优化方向：

- 将 HTTP 轮询升级为 WebSocket 或 Server-Sent Events。
- 给房间快照增加版本号，未变化时返回轻量响应。
- 将前端 `app.js` 按模块拆分，减少维护成本。
- 对超大仓库网格做虚拟滚动或分块渲染。

## 开发约定

- 不要把 `data/accounts.json` 当作配置文件随意覆盖，它是本地玩家存档。
- 后台配置保存后只影响新开的对局。
- 服务端多人逻辑必须优先改 `src/server.js`，前端单机逻辑只用于本地原型和离线预览。
- 新增资源放到对应 `public/assets/*` 子目录，不要散放在根目录。
- 改动后至少运行 `npm run check`；涉及服务端流程时运行 `npm run selftest`。
