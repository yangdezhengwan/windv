#!/bin/bash

# 使用 Token 推送到 GitHub
# 使用方法: ./push_with_token.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
    echo "❌ 请提供 GitHub Personal Access Token"
    echo ""
    echo "获取 Token 步骤:"
    echo "1. 访问 https://github.com/settings/tokens/new"
    echo "2. 填写 Note: WindV Push"
    echo "3. 勾选 'repo' 权限"
    echo "4. 点击 Generate token"
    echo "5. 复制 Token"
    echo ""
    echo "用法: ./push_with_token.sh ghp_xxxxxxxxxxxx"
    exit 1
fi

TOKEN=$1
USERNAME="yangdezhengwan"
REPO_URL="https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/windv.git"

echo "🚀 推送到 GitHub: yangdezhengwan/windv"
echo ""

# 检查是否有远程仓库
if git remote | grep -q origin; then
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

git branch -M main

echo "⬆️  正在推送..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📱 仓库地址: https://github.com/yangdezhengwan/windv"
    echo "🔄 GitHub Actions 构建: https://github.com/yangdezhengwan/windv/actions"
else
    echo ""
    echo "❌ 推送失败"
    echo "请检查:"
    echo "  1. Token 是否正确"
    echo "  2. 仓库是否已创建: https://github.com/new"
fi