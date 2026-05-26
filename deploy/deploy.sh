#!/bin/bash

# ============================================
# WindV Cloud Service Deployment Script
# 云端服务一键部署脚本
# ============================================

set -e

# 配置
SERVER_IP="8.137.144.68"
SERVER_USER="root"
SERVER_PORT="22"
PROJECT_NAME="windv"
BACKEND_DIR="/opt/windv-server"
ADMIN_DIR="/opt/windv-admin"
LOG_FILE="/tmp/windv-deploy.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 检查 SSH 连接
check_ssh() {
    log "检查 SSH 连接..."
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo 'OK'" 2>/dev/null; then
        log "SSH 连接成功"
        return 0
    else
        warn "SSH 连接失败，请先配置 SSH 密钥"
        return 1
    fi
}

# 初始化服务器
init_server() {
    log "初始化服务器环境..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        # 更新系统
        apt update && apt upgrade -y
        
        # 安装基础软件
        apt install -y curl git wget vim htop tmux nginx certbot python3-certbot-nginx
        
        # 安装 Node.js 20.x
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
        
        # 安装 PM2
        npm install -g pm2
        
        # 创建项目目录
        mkdir -p /opt/windv-server /opt/windv-admin /backup/windv
        
        echo "服务器初始化完成"
ENDSSH
    
    log "服务器初始化完成"
}

# 部署后端服务
deploy_backend() {
    log "部署后端服务..."
    
    # 复制后端文件
    scp -r ../server/* ${SERVER_USER}@${SERVER_IP}:${BACKEND_DIR}/ 2>/dev/null || true
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        cd ${BACKEND_DIR}
        
        # 安装依赖
        npm install
        
        # 创建环境配置文件
        cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DB_CONNECTION_STRING=mongodb://localhost:27017/windv
JWT_SECRET=windv_super_secret_jwt_key_change_in_production_${RANDOM}
FRONTEND_URL=http://${SERVER_IP}
BACKEND_URL=http://${SERVER_IP}
ENVEOF
        
        # 启动服务
        pm2 stop windv-server 2>/dev/null || true
        pm2 delete windv-server 2>/dev/null || true
        pm2 start npm --name "windv-server" -- start
        
        # 保存 PM2 配置
        pm2 save
        pm2 startup
        
        echo "后端服务部署完成"
ENDSSH
    
    log "后端服务部署完成"
}

# 部署管理后台
deploy_admin() {
    log "部署管理后台..."
    
    # 本地构建
    cd ../admin
    npm install
    npm run build
    
    # 复制构建文件
    scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${ADMIN_DIR}/ 2>/dev/null || true
    
    # 配置 Nginx
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        # 备份原配置
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak 2>/dev/null || true
        
        # 创建 Nginx 配置
        cat > /etc/nginx/sites-available/windv << 'NGINXEOF'
server {
    listen 80;
    server_name ${SERVER_IP};
    
    root ${ADMIN_DIR};
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全 headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 禁止访问敏感文件
    location ~ /\.env {
        deny all;
    }
    
    location ~ /\. {
        deny all;
    }
}
NGINXEOF
        
        # 启用配置
        ln -sf /etc/nginx/sites-available/windv /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl restart nginx
        
        echo "Nginx 配置完成"
ENDSSH
    
    log "管理后台部署完成"
}

# 配置防火墙
configure_firewall() {
    log "配置防火墙..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable 2>/dev/null || true
        ufw status
ENDSSH
    
    log "防火墙配置完成"
}

# 验证部署
verify_deployment() {
    log "验证部署..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        # 检查服务状态
        echo "=== PM2 状态 ==="
        pm2 status
        
        echo ""
        echo "=== Nginx 状态 ==="
        systemctl status nginx --no-pager | head -5
        
        echo ""
        echo "=== API 健康检查 ==="
        curl -s http://localhost:3000/api/health | head -100
        
        echo ""
        echo "=== 前端页面 ==="
        curl -s -I http://localhost | head -5
ENDSSH
    
    log "部署验证完成"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "=========================================="
    echo "  🎉 WindV 云端服务部署完成!"
    echo "=========================================="
    echo ""
    echo "📌 访问地址:"
    echo "   管理后台: http://${SERVER_IP}"
    echo "   API 地址:  http://${SERVER_IP}/api"
    echo ""
    echo "🔐 默认管理员:"
    echo "   首次登录后请前往设置修改密码"
    echo ""
    echo "📝 常用命令:"
    echo "   查看日志:  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs windv-server'"
    echo "   重启服务:  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart windv-server'"
    echo "   查看状态:  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
    echo ""
    echo "=========================================="
}

# 主流程
main() {
    echo ""
    echo "=========================================="
    echo "  WindV Cloud Service Deployer"
    echo "  无人直播助手 - 云端服务一键部署"
    echo "=========================================="
    echo ""
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --init      只初始化服务器"
        echo "  --backend   只部署后端服务"
        echo "  --admin     只部署管理后台"
        echo "  --all       完整部署 (默认)"
        echo "  --verify    只验证部署"
        echo "  --help      显示帮助"
        echo ""
        exit 0
    fi
    
    MODE="${1:-all}"
    
    # 执行部署
    case $MODE in
        --init)
            init_server
            ;;
        --backend)
            deploy_backend
            ;;
        --admin)
            deploy_admin
            ;;
        --verify)
            verify_deployment
            ;;
        --all|*)
            if ! check_ssh; then
                error "SSH 连接失败"
                exit 1
            fi
            init_server
            deploy_backend
            deploy_admin
            configure_firewall
            verify_deployment
            show_access_info
            ;;
    esac
}

main "$@"