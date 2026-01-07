# 部署指南 - tianqizhin.top

本文档提供完整的部署步骤，将你的个人网站部署到服务器上。

## 📋 前置要求

### 服务器要求
- 操作系统：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- 权限：Root 或 sudo 权限
- 内存：至少 1GB RAM
- 硬盘：至少 10GB 可用空间

### 需要准备
- ✅ 服务器 IP 地址
- ✅ 服务器登录凭据（密码或 SSH 密钥）
- ✅ 域名：tianqizhin.top
- ✅ Coze API Token
- ✅ Coze Bot ID

---

## 🚀 快速部署（5 分钟）

### 第 1 步：安装必要软件

#### Ubuntu/Debian 系统
```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 Git
sudo apt install -y git
```

#### CentOS/RHEL 系统
```bash
# 更新软件包
sudo yum update -y

# 安装 Node.js (v18+)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo yum install -y nginx

# 安装 Git
sudo yum install -y git
```

### 第 2 步：上传代码到服务器

#### 方法 A：使用 Git（推荐）
```bash
# 1. 将代码推送到 GitHub
# 在你的本地电脑执行：
git init
git add .
git commit -m "Initial commit"
git branch -M main
# 创建 GitHub 仓库后执行：
# git remote add origin https://github.com/你的用户名/仓库名.git
# git push -u origin main

# 2. 在服务器上克隆代码
ssh 你的用户名@服务器IP
cd /var/www
sudo mkdir tianqizhin-bot
sudo chown $USER:$USER tianqizhin-bot
cd tianqizhin-bot
git clone https://github.com/你的用户名/仓库名.git .
```

#### 方法 B：使用 SCP 上传
```bash
# 在你的本地电脑执行
scp -r . 你的用户名@服务器IP:/var/www/tianqizhin-bot
```

### 第 3 步：安装依赖和构建

```bash
# 进入项目目录
cd /var/www/tianqizhin-bot

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 创建日志目录
mkdir -p logs
```

### 第 4 步：配置环境变量

```bash
# 创建 .env 文件
nano .env

# 复制以下内容（替换为你的实际值）
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TOKEN=你的_Coze_API_Token
COZE_BOT_ID=你的_Coze_Bot_ID

# 保存并退出（Ctrl+O，回车，Ctrl+X）
```

### 第 5 步：使用 PM2 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
# 执行输出的命令（复制粘贴）
pm2 save
```

### 第 6 步：配置 Nginx

```bash
# 复制 Nginx 配置文件
sudo cp nginx.conf /etc/nginx/sites-available/tianqizhin

# 创建软链接
sudo ln -s /etc/nginx/sites-available/tianqizhin /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 设置 Nginx 开机自启
sudo systemctl enable nginx
```

### 第 7 步：配置域名解析

1. 登录你的域名管理平台（阿里云、腾讯云、Cloudflare 等）
2. 找到域名 **tianqizhin.top**
3. 添加 DNS 记录：

```
类型: A
主机记录: @（或留空）
记录值: 你的服务器IP
TTL: 600

类型: A
主机记录: www
记录值: 你的服务器IP
TTL: 600
```

4. 等待 DNS 生效（通常 5-15 分钟）

### 第 8 步：测试访问

```bash
# 等待 DNS 生效后，在浏览器访问：
http://tianqizhin.top
# 或
http://www.tianqizhin.top
```

---

## 🔒 配置 HTTPS（SSL 证书）

### 使用 Certbot 自动配置

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu/Debian
# 或
sudo yum install -y certbot python3-certbot-nginx  # CentOS

# 自动配置 SSL（会自动修改 Nginx 配置）
sudo certbot --nginx -d tianqizhin.top -d www.tianqizhin.top

# 按照提示输入邮箱、同意条款

# 测试自动续期
sudo certbot renew --dry-run
```

Certbot 会自动：
- ✅ 生成免费的 SSL 证书（Let's Encrypt）
- ✅ 自动配置 Nginx 支持 HTTPS
- ✅ 设置自动续期（证书有效期为 90 天）

---

## 📝 常用命令

### PM2 管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart tianqizhin-bot

# 停止应用
pm2 stop tianqizhin-bot

# 删除应用
pm2 delete tianqizhin-bot

# 监控
pm2 monit
```

### Nginx 管理
```bash
# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置（无停机）
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 测试配置
sudo nginx -t
```

### 应用更新
```bash
cd /var/www/tianqizhin-bot

# 拉取最新代码
git pull

# 安装依赖（如果有变化）
pnpm install

# 重新构建
pnpm build

# 重启应用
pm2 restart tianqizhin-bot
```

---

## 🔧 故障排查

### 问题 1：无法访问网站

**检查清单**：
```bash
# 1. 检查 PM2 状态
pm2 status

# 2. 检查应用日志
pm2 logs

# 3. 检查 Nginx 状态
sudo systemctl status nginx

# 4. 检查 Nginx 配置
sudo nginx -t

# 5. 检查端口是否监听
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80

# 6. 检查防火墙
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS
```

### 问题 2：DNS 解析不生效

**解决方案**：
1. 等待更长时间（DNS 最多需要 48 小时）
2. 检查 DNS 配置是否正确
3. 使用 `ping tianqizhin.top` 测试
4. 尝试清空本地 DNS 缓存

### 问题 3：Bot 无法回复

**解决方案**：
1. 检查环境变量是否正确：`cat .env`
2. 检查 Bot 是否已发布到 API 渠道
3. 查看应用日志：`pm2 logs`

---

## 📊 性能优化

### 开启 Gzip 压缩

在 `nginx.conf` 中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
```

### 调整 PM2 实例数

在 `ecosystem.config.js` 中：
```javascript
instances: 2,  // 根据服务器 CPU 核心数调整
```

---

## 🎯 完成检查清单

- [ ] 服务器环境已配置（Node.js、PM2、Nginx）
- [ ] 代码已上传到服务器
- [ ] 依赖已安装
- [ ] 项目已构建
- [ ] 环境变量已配置
- [ ] PM2 应用已启动
- [ ] Nginx 已配置并启动
- [ ] 域名 DNS 已解析
- [ ] 网站可以正常访问
- [ ] HTTPS 证书已配置（可选）

---

## 📞 支持

遇到问题？
1. 查看本文档的故障排查部分
2. 查看 PM2 日志：`pm2 logs`
3. 查看 Nginx 日志：`sudo tail -f /var/log/nginx/tianqizhin-error.log`

---

**祝你部署成功！** 🚀
