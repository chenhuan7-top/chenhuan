#!/bin/bash

# tianqizhin-bot 一键部署脚本
# 适用于 Ubuntu/Debian/CentOS 系统

set -e

echo "======================================"
echo "  天启 Bot 一键部署脚本"
echo "  域名: tianqizhin.top"
echo "======================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 权限运行此脚本"
    echo "   使用: sudo bash deploy.sh"
    exit 1
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "✅ 检测到操作系统: $OS"
echo ""

# 第 1 步：安装必要软件
echo "======================================"
echo "第 1 步：安装必要软件"
echo "======================================"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "正在更新软件包..."
    apt update && apt upgrade -y

    echo "正在安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs

    echo "正在安装 PM2..."
    npm install -g pm2

    echo "正在安装 Nginx..."
    apt install -y nginx

    echo "正在安装 Git..."
    apt install -y git

elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    echo "正在更新软件包..."
    yum update -y

    echo "正在安装 Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs

    echo "正在安装 PM2..."
    npm install -g pm2

    echo "正在安装 Nginx..."
    yum install -y nginx

    echo "正在安装 Git..."
    yum install -y git
else
    echo "❌ 不支持的操作系统: $OS"
    exit 1
fi

echo "✅ 软件安装完成"
echo ""

# 第 2 步：检查代码
echo "======================================"
echo "第 2 步：检查项目代码"
echo "======================================"

if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json，请确保你在项目根目录运行此脚本"
    exit 1
fi

echo "✅ 找到项目代码"
echo ""

# 第 3 步：安装依赖
echo "======================================"
echo "第 3 步：安装依赖"
echo "======================================"

if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

echo "正在安装项目依赖..."
pnpm install

echo "✅ 依赖安装完成"
echo ""

# 第 4 步：构建项目
echo "======================================"
echo "第 4 步：构建项目"
echo "======================================"

echo "正在构建项目..."
pnpm build

echo "✅ 项目构建完成"
echo ""

# 第 5 步：检查环境变量
echo "======================================"
echo "第 5 步：检查环境变量"
echo "======================================"

if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，请先配置环境变量"
    echo ""
    echo "请创建 .env 文件并添加以下内容："
    echo ""
    echo "COZE_API_BASE_URL=https://api.coze.cn"
    echo "COZE_API_TOKEN=你的_Coze_API_Token"
    echo "COZE_BOT_ID=你的_Coze_Bot_ID"
    echo ""
    read -p "是否现在配置？(y/n): " configure_env

    if [ "$configure_env" = "y" ]; then
        read -p "请输入 Coze API Token: " api_token
        read -p "请输入 Coze Bot ID: " bot_id

        cat > .env << EOF
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TOKEN=$api_token
COZE_BOT_ID=$bot_id
EOF
        echo "✅ 环境变量已配置"
    else
        echo "❌ 请手动配置 .env 文件后重新运行"
        exit 1
    fi
else
    echo "✅ 找到环境变量文件"
fi

echo ""

# 第 6 步：创建日志目录
echo "======================================"
echo "第 6 步：创建日志目录"
echo "======================================"

mkdir -p logs
echo "✅ 日志目录已创建"
echo ""

# 第 7 步：使用 PM2 启动应用
echo "======================================"
echo "第 7 步：启动应用"
echo "======================================"

if pm2 list | grep -q "tianqizhin-bot"; then
    echo "应用已存在，正在重启..."
    pm2 restart tianqizhin-bot
else
    echo "正在启动应用..."
    pm2 start ecosystem.config.js
fi

echo "✅ 应用已启动"
echo ""

# 第 8 步：设置 PM2 开机自启
echo "======================================"
echo "第 8 步：配置开机自启"
echo "======================================"

pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
if [ -f /tmp/pm2_startup.sh ]; then
    bash /tmp/pm2_startup.sh
    pm2 save
    echo "✅ 开机自启已配置"
fi

echo ""

# 第 9 步：配置 Nginx
echo "======================================"
echo "第 9 步：配置 Nginx"
echo "======================================"

if [ -f "nginx.conf" ]; then
    cp nginx.conf /etc/nginx/sites-available/tianqizhin 2>/dev/null || \
    cp nginx.conf /etc/nginx/conf.d/tianqizhin.conf 2>/dev/null

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        ln -sf /etc/nginx/sites-available/tianqizhin /etc/nginx/sites-enabled/tianqizhin 2>/dev/null || true
    fi

    echo "正在测试 Nginx 配置..."
    nginx -t

    echo "正在重启 Nginx..."
    systemctl restart nginx

    echo "✅ Nginx 已配置"
else
    echo "⚠️  未找到 nginx.conf，请手动配置"
fi

echo ""

# 完成
echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
echo ""
echo "应用状态："
pm2 status
echo ""
echo "下一步操作："
echo "1. 配置域名 DNS 解析到服务器 IP"
echo "   类型: A"
echo "   主机记录: @ 或 www"
echo "   记录值: $(curl -s ifconfig.me)"
echo ""
echo "2. 等待 DNS 生效后访问："
echo "   http://tianqizhin.top"
echo ""
echo "3. 配置 HTTPS（可选）："
echo "   sudo certbot --nginx -d tianqizhin.top -d www.tianqizhin.top"
echo ""
echo "常用命令："
echo "查看状态: pm2 status"
echo "查看日志: pm2 logs"
echo "重启应用: pm2 restart tianqizhin-bot"
echo "重启 Nginx: sudo systemctl restart nginx"
echo ""
