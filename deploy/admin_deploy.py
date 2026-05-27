#!/usr/bin/env python3
"""
管理后台自动部署脚本
"""

import os
import subprocess
import sys
from pathlib import Path

# 配置信息
SERVER_HOST = '8.137.144.68'
SERVER_USER = 'root'
SERVER_PASSWORD = 'ZBZSzbzs123123'
REMOTE_DIR = '/opt/windv-admin'
LOCAL_DIST = '/workspace/projects/workspace/WINDV/windv/admin/dist'

def run_command(cmd, check=True):
    """执行命令"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=check,
            capture_output=True,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ 命令执行失败: {e}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)

def deploy():
    """部署管理后台"""
    print("🚀 开始部署管理后台...")
    print("=" * 50)

    # 1. 检查本地 dist 目录
    dist_path = Path(LOCAL_DIST)
    if not dist_path.exists():
        print(f"❌ 本地 dist 目录不存在: {LOCAL_DIST}")
        sys.exit(1)

    print(f"✅ 本地 dist 目录: {LOCAL_DIST}")

    # 2. 使用 sshpass 上传文件
    try:
        # 检查 sshpass 是否安装
        result = run_command("which sshpass", check=False)
        if result.returncode != 0:
            print("❌ sshpass 未安装，正在安装...")
            run_command("apt-get update && apt-get install -y sshpass")

        # 上传文件
        print(f"📤 上传文件到 {SERVER_HOST}...")
        cmd = f'sshpass -p "{SERVER_PASSWORD}" rsync -avz --delete {LOCAL_DIST}/ {SERVER_USER}@{SERVER_HOST}:{REMOTE_DIR}/dist/'
        run_command(cmd)

        print("✅ 文件上传成功")
    except Exception as e:
        print(f"❌ 上传失败: {e}")
        print("\n💡 请手动上传文件到服务器:")
        print(f"   本地: {LOCAL_DIST}")
        print(f"   远程: {SERVER_HOST}:{REMOTE_DIR}/dist/")
        print("\n可以使用以下命令:")
        print(f"   scp -r {LOCAL_DIST}/* root@{SERVER_HOST}:{REMOTE_DIR}/dist/")
        sys.exit(1)

    # 3. 重启 Nginx
    print("\n🔄 重启 Nginx...")
    restart_cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh {SERVER_USER}@{SERVER_HOST} "nginx -s reload"'
    run_command(restart_cmd)
    print("✅ Nginx 重启成功")

    print("\n" + "=" * 50)
    print("✅ 部署完成！")
    print(f"🌐 访问地址: http://sq.kxkj.ltd")
    print(f"👤 管理员账号: admin / WindV@2025")

if __name__ == '__main__':
    deploy()