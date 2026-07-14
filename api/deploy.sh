#!/bin/bash

echo "========================================="
echo "  百鲸G系统 API 部署脚本"
echo "========================================="

if [ "$(id -u)" != "0" ]; then
    echo "请以 root 用户运行此脚本"
    exit 1
fi

echo ""
echo "1. 更新系统..."
apt update && apt upgrade -y

echo ""
echo "2. 安装基础依赖..."
apt install -y curl git nginx build-essential

echo ""
echo "3. 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo ""
echo "4. 安装 MySQL..."
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

echo ""
echo "5. 安装 Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

echo ""
echo "6. 配置 MySQL..."
mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Bwg@2024';
CREATE DATABASE IF NOT EXISTS bwg_performance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EOF

echo ""
echo "7. 创建项目目录..."
mkdir -p /opt/bwg-api
cd /opt/bwg-api

echo ""
echo "8. 上传代码..."
echo "请将代码上传到 /opt/bwg-api 目录后继续"

echo ""
echo "9. 安装依赖..."
npm install

echo ""
echo "10. 构建项目..."
npm run build

echo ""
echo "11. 创建 .env 文件..."
cat > .env <<EOF
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=bwg_performance
DB_USER=root
DB_PASS=Bwg@2024

JWT_SECRET=bwg_performance_2024_secret_key
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

LOG_LEVEL=info
LOG_DIR=./logs

FRONTEND_URL=https://your-client.vercel.app
ALLOWED_ORIGINS=https://your-client.vercel.app,https://your-admin.vercel.app
EOF

echo ""
echo "12. 创建日志目录..."
mkdir -p logs

echo ""
echo "13. 安装 PM2..."
npm install -g pm2

echo ""
echo "14. 启动服务..."
pm2 start dist/index.js --name bwg-api

echo ""
echo "15. 配置 PM2 开机自启..."
pm2 startup
pm2 save

echo ""
echo "16. 配置 Nginx 反向代理..."
cat > /etc/nginx/sites-available/bwg-api <<EOF
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bwg-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ""
echo "========================================="
echo "  部署完成！"
echo ""
echo "  API 地址: http://EC2_PUBLIC_IP"
echo "  PM2 管理: pm2 status / pm2 logs bwg-api"
echo "  请记得："
echo "  1. 修改 .env 中的数据库密码"
echo "  2. 修改 .env 中的 FRONTEND_URL 和 ALLOWED_ORIGINS"
echo "  3. 配置安全组允许 80 和 3000 端口"
echo "========================================="