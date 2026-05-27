#!/usr/bin/env python3
"""
WindV 管理后台一键部署脚本
使用 paramiko 库通过 SSH 上传文件
"""

import os
import sys
import time
import paramiko
from pathlib import Path

# 配置信息
SERVER_HOST = '8.137.144.68'
SERVER_PORT = 22
SERVER_USER = 'root'
SERVER_PASSWORD = 'ZBZSzbzs123123'
REMOTE_DIR = '/opt/windv-admin'
LOCAL_DIR = '/workspace/projects/workspace/WINDV/windv/admin/dist'

def deploy():
    print("🚀 WindV 管理后台部署脚本")
    print("=" * 50)

    # 1. 检查本地 dist 目录
    local_path = Path(LOCAL_DIR)
    if not local_path.exists():
        print(f"❌ 错误：本地 dist 目录不存在: {LOCAL_DIR}")
        print("请先执行: cd /workspace/projects/workspace/WINDV/windv/admin && npm run build")
        sys.exit(1)

    print(f"✅ 本地 dist 目录: {LOCAL_DIR}")

    # 2. 统计文件数量
    files = list(local_path.glob('**/*'))
    file_count = len([f for f in files if f.is_file()])
    print(f"📦 待上传文件数: {file_count}")

    # 3. 连接服务器
    print(f"\n🔌 连接服务器 {SERVER_HOST}...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(
            hostname=SERVER_HOST,
            port=SERVER_PORT,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        print("✅ SSH 连接成功")
    except Exception as e:
        print(f"❌ SSH 连接失败: {e}")
        sys.exit(1)

    # 4. 创建 SFTP 客户端
    try:
        sftp = ssh.open_sftp()
        print("✅ SFTP 连接成功")
    except Exception as e:
        print(f"❌ SFTP 连接失败: {e}")
        ssh.close()
        sys.exit(1)

    # 5. 上传文件
    print("\n📤 开始上传文件...")
    uploaded = 0
    failed = 0

    for file_path in files:
        if file_path.is_file():
            # 计算相对路径
            rel_path = file_path.relative_to(local_path)
            remote_path = os.path.join(REMOTE_DIR, 'dist', str(rel_path))

            # 创建远程目录（如果不存在）
            remote_dir = os.path.dirname(remote_path)
            try:
                # 尝试创建目录
                sftp.stat(remote_dir)
            except:
                # 目录不存在，需要创建
                dirs_to_create = []
                current_dir = remote_dir
                while current_dir and current_dir != '/':
                    try:
                        sftp.stat(current_dir)
                    except:
                        dirs_to_create.insert(0, current_dir)
                    current_dir = os.path.dirname(current_dir)

                for d in dirs_to_create:
                    try:
                        sftp.mkdir(d)
                    except:
                        pass

            # 上传文件
            try:
                sftp.put(str(file_path), remote_path)
                uploaded += 1
                if uploaded % 20 == 0:
                    print(f"   已上传 {uploaded}/{file_count} 文件...")
            except Exception as e:
                print(f"   上传失败: {rel_path} - {e}")
                failed += 1

    print(f"✅ 上传完成: {uploaded} 成功, {failed} 失败")

    # 6. 重启 Nginx
    print("\n🔄 重启 Nginx...")
    try:
        stdin, stdout, stderr = ssh.exec_command('nginx -s reload')
        output = stdout.read().decode()
        error = stderr.read().decode()
        if error:
            print(f"⚠️ Nginx 重启警告: {error}")
        else:
            print("✅ Nginx 重启成功")
    except Exception as e:
        print(f"❌ Nginx 重启失败: {e}")

    # 7. 关闭连接
    sftp.close()
    ssh.close()

    print("\n" + "=" * 50)
    print("✅ 部署完成！")
    print(f"🌐 访问地址: http://sq.kxkj.ltd")
    print(f"👤 管理员账号: admin / WindV@2025")
    print("=" * 50)

if __name__ == '__main__':
    deploy()