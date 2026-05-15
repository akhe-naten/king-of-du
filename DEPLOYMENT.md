# 公网部署指南

这份指南面向“找朋友公网测试”。项目仍然是轻量 Node.js 服务，不需要数据库。

## 部署前必须做

1. 设置 `ADMIN_TOKEN`。公网不设置后台 token 等于公开后台配置权限。
2. 使用独立数据目录，例如 `/var/lib/king-of-du`。
3. 用 Nginx 或 Caddy 反代到本机 `127.0.0.1:3000`。
4. 有域名时开启 HTTPS，并设置 `COOKIE_SECURE=true`。
5. 定期备份 `KWA_DATA_DIR/accounts.json`。

## 环境变量

参考 `.env.example`：

```bash
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
KWA_DATA_DIR=/var/lib/king-of-du
ADMIN_TOKEN=一串足够长的随机 token
COOKIE_SECURE=true
```

生成后台 token：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 最快测试：海外或港澳台服务器

适合先找朋友测试，不想等备案。

### Docker Compose 部署

推荐优先使用 Docker Compose，数据会保存在命名卷 `king-of-du-data` 中。

```bash
cp .env.docker.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把生成的随机字符串填到 `.env` 的 `ADMIN_TOKEN`。

启动：

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

访问：

```text
http://服务器IP:3000
http://服务器IP:3000/admin.html
```

更新代码后：

```bash
docker compose up -d --build
```

备份账号数据：

```bash
docker run --rm -v king-of-du-data:/data -v "$PWD":/backup alpine \
  sh -c 'cp /data/accounts.json /backup/accounts.$(date +%F-%H%M).json'
```

如果前面接 Nginx/Caddy 并启用 HTTPS，把 `.env` 中的 `COOKIE_SECURE` 改成 `true`。

### 直接用 Node 部署

```bash
sudo mkdir -p /opt/king-of-du /var/lib/king-of-du
sudo useradd --system --home /opt/king-of-du --shell /usr/sbin/nologin kingofdu
sudo chown -R kingofdu:kingofdu /opt/king-of-du /var/lib/king-of-du
```

把项目上传到 `/opt/king-of-du` 后：

```bash
cd /opt/king-of-du
npm run check
sudo cp deploy/king-of-du.service /etc/systemd/system/king-of-du.service
sudo systemctl daemon-reload
sudo systemctl enable --now king-of-du
sudo systemctl status king-of-du
```

如果只是临时测试，也可以直接：

```bash
ADMIN_TOKEN=你的token HOST=0.0.0.0 PORT=3000 KWA_DATA_DIR=/var/lib/king-of-du node src/server.js
```

然后开放防火墙 `3000` 端口，朋友访问 `http://服务器IP:3000`。

## 推荐测试：Nginx 反代

复制示例：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/king-of-du
sudo ln -s /etc/nginx/sites-available/king-of-du /etc/nginx/sites-enabled/king-of-du
sudo nginx -t
sudo systemctl reload nginx
```

把 `example.com` 改成你的域名。

## 国内大陆长期访问

如果服务器在中国大陆，域名通常需要先完成 ICP 备案才能正常绑定和访问。上线后还应按要求完成公安联网备案。

推荐流程：

1. 购买大陆云服务器。
2. 购买域名并实名认证。
3. 在云厂商提交 ICP 备案。
4. 备案通过后解析域名到服务器。
5. 部署本项目，使用 Nginx + HTTPS。
6. 开站后办理公安联网备案。

## 后台访问

设置 `ADMIN_TOKEN` 后：

- 打开 `/admin.html` 时浏览器会提示输入 token。
- 也可以临时用 `/admin.html?admin_token=你的token` 打开，页面会保存到本地浏览器。

不要把 token 发给普通玩家。

## 运维命令

```bash
sudo systemctl status king-of-du
sudo systemctl restart king-of-du
sudo journalctl -u king-of-du -f
```

备份：

```bash
sudo cp /var/lib/king-of-du/accounts.json /var/lib/king-of-du/accounts.$(date +%F-%H%M).json
```

## 当前公网限制

- 多人同步仍是 HTTP 轮询，不是 WebSocket。
- 房间状态在内存中，服务重启后正在进行的房间会消失。
- 账号和仓库持久化在 JSON 文件，朋友小规模测试够用，长期大规模建议迁 SQLite。
- 文案中仍有历史乱码，部署前不影响功能，但会影响观感。
