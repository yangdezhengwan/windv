#!/bin/bash

# 服务器信息
SERVER="8.137.144.68"
USER="root"
KEY_PATH="~/.ssh/windv_server"

echo "=================================="
echo "  云端服务部署脚本"
echo "=================================="
echo ""

# 1. 检查 SSH 密钥
if [ ! -f "$KEY_PATH" ]; then
  echo "❌ SSH 密钥不存在，正在生成..."
  ssh-keygen -t rsa -b 4096 -f "$KEY_PATH" -N ""
  echo "✅ SSH 密钥已生成"
else
  echo "✅ SSH 密钥已存在"
fi

# 2. 显示公钥
echo ""
echo "=================================="
echo "  请手动执行以下步骤："
echo "=================================="
echo ""
echo "1. 在本地执行以下命令（复制 SSH 公钥到服务器）："
echo ""
cat <<'EOF'
echo "请先在服务器上安装 ssh-copy-id（如果没有）："
echo "  apt-get update && apt-get install -y ssh-copy-id"
echo ""
echo "然后复制公钥："
cat "$KEY_PATH.pub"
echo "↑ 复制上面的公钥内容"
echo ""
echo "2. 在服务器上创建 .ssh 目录并添加公钥："
echo ""
echo "  ssh-copy-id -i ~/.ssh/windv_server.pub $USER@$SERVER"
echo ""
echo "或者手动复制："
echo "  mkdir -p ~/.ssh"
echo "  echo '$(cat "$KEY_PATH.pub")' >> ~/.ssh/authorized_keys"
echo "  chmod 700 ~/.ssh"
echo "  chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "3. 测试连接："
echo "  ssh -i ~/.ssh/windv_server $USER@$SERVER 'echo 连接成功!'"
echo ""
echo "=================================="