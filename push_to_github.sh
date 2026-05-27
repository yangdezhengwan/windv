#!/bin/bash

# WindV 推送到 GitHub 脚本
# 使用方法: ./push_to_github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "❌ 请提供 GitHub 用户名"
    echo "用法: ./push_to_github.sh your_username"
    exit 1
fi

USERNAME=$1
REPO_URL="https://github.com/$USERNAME/windv.git"

echo "🚀 准备推送到 GitHub: $REPO_URL"
echo ""

# 检查是否有远程仓库
if git remote | grep -q origin; then
    echo "📝 更新远程仓库地址..."
    git remote set-url origin "$REPO_URL"
else
    echo "📝 添加远程仓库..."
    git remote add origin "$REPO_URL"
fi

# 确保分支名为 main
git branch -M main

# 推送代码
echo "⬆️  正在推送代码到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📱 访问地址: https://github.com/$USERNAME/windv"
    echo ""
    echo "⏳ GitHub Actions 将自动开始构建 Windows 版本"
    echo "👀 查看构建状态: https://github.com/$USERNAME/windv/actions"
    echo ""
    echo "📦 构建完成后，在 Release 页面下载 .exe 文件"
else
    echo ""
    echo "❌ 推送失败，可能原因:"
    echo "   1. 仓库不存在 - 请先在 GitHub 创建仓库"
    echo "   2. 用户名错误 - 请检查用户名拼写"
    echo "   3. 需要认证 - 请在弹出窗口输入 GitHub 用户名和密码/Token"
    exit 1
fi