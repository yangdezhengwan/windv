#!/usr/bin/env python3
"""
更新 WindV 云端服务代码
"""

import paramiko
import os

# 服务器配置
SERVER_IP = "8.137.144.68"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "ZBZSzbzs123123"
REMOTE_DIR = "/opt/windv-server"
LOCAL_DIR = "/workspace/projects/workspace/WINDV/windv/server"

def ssh_connect():
    """建立 SSH 连接"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_IP,
        port=SERVER_PORT,
        username=SERVER_USER,
        password=SERVER_PASSWORD,
        timeout=30
    )
    return client

def upload_file(sftp, local_path, remote_path):
    """上传文件"""
    try:
        sftp.put(local_path, remote_path)
        print(f"  ✓ {os.path.basename(local_path)}")
        return True
    except Exception as e:
        print(f"  ✗ {os.path.basename(local_path)}: {e}")
        return False

def main():
    print("=" * 60)
    print("  更新 WindV 云端服务代码")
    print("=" * 60)
    
    client = None
    try:
        client = ssh_connect()
        sftp = client.open_sftp()
        
        # 需要更新的文件列表
        files_to_update = [
            ("src/server.js", "src/server.js"),
            ("src/routes/auth.js", "src/routes/auth.js"),
            ("src/routes/users.js", "src/routes/users.js"),
            ("src/routes/scripts.js", "src/routes/scripts.js"),
            ("src/routes/settings.js", "src/routes/settings.js"),
            ("src/routes/stats.js", "src/routes/stats.js"),
            ("src/routes/license.js", "src/routes/license.js"),
            ("src/models/User.js", "src/models/User.js"),
            ("src/models/Script.js", "src/models/Script.js"),
            ("src/models/Stats.js", "src/models/Stats.js"),
            ("src/models/License.js", "src/models/License.js"),
        ]
        
        print("\n[上传文件]")
        for local_rel, remote_rel in files_to_update:
            local_path = os.path.join(LOCAL_DIR, local_rel)
            remote_path = f"{REMOTE_DIR}/{remote_rel}"
            
            if os.path.exists(local_path):
                # 确保远程目录存在
                remote_dir = os.path.dirname(remote_path)
                try:
                    sftp.stat(remote_dir)
                except:
                    client.exec_command(f"mkdir -p {remote_dir}")
                
                upload_file(sftp, local_path, remote_path)
            else:
                print(f"  ⚠ 本地文件不存在: {local_rel}")
        
        sftp.close()
        
        # 安装依赖
        print("\n[安装依赖]")
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && npm install axios 2>&1", timeout=60)
        output = stdout.read().decode('utf-8', errors='ignore')
        if "added" in output or "up to date" in output:
            print("  ✓ 依赖安装完成")
        
        # 重启服务
        print("\n[重启服务]")
        stdin, stdout, stderr = client.exec_command("pm2 restart windv-server 2>&1", timeout=30)
        output = stdout.read().decode('utf-8', errors='ignore')
        if "✓" in output or "restart" in output.lower():
            print("  ✓ 服务已重启")
        
        # 等待服务启动
        print("\n[等待服务启动]")
        import time
        time.sleep(3)
        
        # 检查健康状态
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
        output = stdout.read().decode('utf-8', errors='ignore')
        if '"status":"ok"' in output:
            print("  ✓ 服务运行正常")
        else:
            print(f"  ⚠ 服务状态: {output}")
        
        # 检查授权 API
        print("\n[检查授权 API]")
        stdin, stdout, stderr = client.exec_command(
            "curl -s -X POST http://localhost:3000/api/license/verify "
            "-H 'Content-Type: application/json' "
            "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}' 2>&1",
            timeout=10
        )
        output = stdout.read().decode('utf-8', errors='ignore')
        if "error" in output.lower() and "API 路由不存在" not in output:
            print("  ✓ 授权 API 已部署")
        else:
            print(f"  响应: {output[:200]}")
        
        print("\n" + "=" * 60)
        print("更新完成")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    main()