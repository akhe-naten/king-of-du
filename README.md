# 竞拍之王 Web 原型

一个面向好友娱乐的浏览器派对游戏原型：玩家创建或加入房间，选择角色和道具后参与多轮暗仓竞拍，最终由最高价玩家清点藏品并结算收益。

## 目前实现功能

1）核心玩法：经过多轮出价，最终价高者得；
2）角色系统：包含老师，赌神，女星，已创建模板，可通过后台进行拓展；
3）地图系统：分为五档地图，已创建模板，可通过后台进行拓展；
4）藏品系统：藏品可进行自定义，已创建模板，可通过后台进行拓展；


## 快速开始

需要 Node.js 18 或更新版本。

```bash
npm run play
```

也可以直接双击：

- Windows：`start-game-windows.cmd`
- Linux：`start-game-linux.sh`
- macOS：`start-game-macos.command`

启动后会自动打开玩家页面，并在终端显示本机地址和局域网地址。朋友在同一局域网内访问终端里的 LAN 地址即可进入。

## 后台控制台

```bash
npm run admin
```

或双击：

- Windows：`start-admin-windows.cmd`
- Linux：`start-admin-linux.sh` 
- macOS：`start-admin-macos.command`

后台地址：`http://localhost:3000/admin.html`

后台可以查看服务状态、房间列表、玩家状态，并可视化编辑规则、藏品、地图和角色配置。

## 便携包

生成一个适合拷贝给朋友或上传服务器测试的项目包：

```bash
npm run package
```

输出位置：

- `dist/king-of-du-portable/`
- Windows 下会同时尝试生成 `dist/king-of-du-portable.zip`

便携包不会包含 `data/accounts.json`，避免把本地账户、密码哈希和会话数据上传到 GitHub。

## 项目结构

```text
config/                      游戏规则、藏品、地图、角色配置
config/role-skills/          角色技能脚本预留目录
data/                        本地账户和仓库数据，默认不提交
deploy/                      Linux 服务和 Nginx 部署示例
public/                      浏览器页面与静态资源
public/assets/audio/         角色语音和事件音效
public/assets/characters/    角色立绘与头像
public/assets/images/        背景图、地图图
public/assets/item-textures/ 藏品贴图与尺寸占位图
public/css/                  前台和后台样式
public/js/                   前台和后台逻辑
scripts/                     一键启动、自测和打包脚本
src/                         Node.js 服务端
```

## 配置说明

- `config/server-config.json`：轮数、初始资金、最高出价、AI 接管时间、清点速度等基础规则。
- `config/loot-config.json`：地图档位、门票、资源预算、藏品池、稀有度权重和藏品贴图路径。
- `config/roles-config.json`：角色名、立绘、头像、语音、技能脚本路径。

藏品贴图统一放在 `public/assets/item-textures/custom/`。没有贴图时会使用 `public/assets/item-textures/placeholders/` 下对应尺寸的纯色占位图。


## Docker 部署

```bash
docker compose up -d
```

更多公网部署说明见 `DEPLOYMENT.md`。
