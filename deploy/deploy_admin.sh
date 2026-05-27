#!/bin/bash
# WindV 管理后台一键部署脚本

echo "🚀 开始部署 WindV 管理后台..."
echo "============================================"

# 配置
SERVER="root@8.137.144.68"
PASSWORD="ZBZSzbzs123123"
REMOTE_DIR="/opt/windv-admin"
LOCAL_DIR="/workspace/projects/workspace/WINDV/windv/admin/dist"

# 检查本地 dist 目录
if [ ! -d "$LOCAL_DIR" ]; then
    echo "❌ 错误：本地 dist 目录不存在"
    echo "请先执行: cd /workspace/projects/workspace/WINDV/windv/admin && npm run build"
    exit 1
fi

echo "✅ 本地 dist 目录存在"

# 尝试使用 expect 自动部署
which expect > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "📤 使用 expect 自动部署..."
    
    expect << EOF
set timeout 120
spawn scp -o StrictHostKeyChecking=no -r $LOCAL_DIR/* $SERVER:$REMOTE_DIR/dist/
expect {
    "password:" {
        send "$PASSWORD\r"
        expect {
            "100%" { send "\r" }
            timeout { puts "Timeout"; exit 1 }
        }
    }
    timeout {
        puts "Connection timeout"
        exit 1
    }
}
spawn ssh -o StrictHostKeyChecking=no $SERVER "nginx -s reload"
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
}
EOF

    echo "✅ 部署完成"
    echo "🌐 访问地址: http://sq.kxkj.ltd"
else
    echo "⚠️ expect 未安装，无法自动部署"
    echo ""
    echo "请选择以下方式之一："
    echo ""
    echo "方法 1: 在服务器上手动执行"
    echo "----------------------------------------"
    echo "ssh root@8.137.144.68"
    echo "cd /opt/windv-admin"
    echo "git pull"
    echo "cd admin && npm run build"
    echo "cp -r dist/* ../dist/"
    echo "nginx -s reload"
    echo ""
    echo "方法 2: 使用 scp 手动上传"
    echo "----------------------------------------"
    echo "scp -r $LOCAL_DIR/* root@8.137.144.68:$REMOTE_DIR/dist/"
fi

echo "============================================"
echo "✨ 部署脚本执行完成"