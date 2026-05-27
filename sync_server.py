#!/usr/bin/env python3
import paramiko
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

REMOTE_DIR = "/opt/windv-server"
LOCAL_DIR = "/workspace/projects/workspace/WINDV/windv/server/src"

print("=" * 60)
print("同步代码到云服务器")
print("=" * 60)

sftp = client.open_sftp()

# 需要上传的文件
files = [
    ("server.js", "src/server.js"),
    ("routes/license.js", "src/routes/license.js"),
    ("routes/settings.js", "src/routes/settings.js"),
    ("routes/users.js", "src/routes/users.js"),
    ("routes/scripts.js", "src/routes/scripts.js"),
    ("routes/stats.js", "src/routes/stats.js"),
    ("routes/auth.js", "src/routes/auth.js"),
    ("models/User.js", "src/models/User.js"),
    ("models/Script.js", "src/models/Script.js"),
    ("models/Stats.js", "src/models/Stats.js"),
    ("models/License.js", "src/models/License.js"),
    ("middleware/auth.js", "src/middleware/auth.js"),
]

print("\n[上传文件]")
for local_rel, remote_rel in files:
    local_path = os.path.join(LOCAL_DIR, local_rel)
    remote_path = f"{REMOTE_DIR}/{remote_rel}"
    
    if os.path.exists(local_path):
        try:
            sftp.put(local_path, remote_path)
            print(f"  ✓ {remote_rel}")
        except Exception as e:
            print(f"  ✗ {remote_rel}: {e}")
    else:
        print(f"  ⚠ {local_rel} 不存在")

sftp.close()

# 安装依赖
print("\n[安装依赖]")
stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && npm install axios --save 2>&1", timeout=60)
stdout.channel.recv_exit_status()

# 重启服务
print("\n[重启服务]")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=30)
stdout.channel.recv_exit_status()

print("\n[等待服务启动]")
import time
time.sleep(5)

# 验证
print("\n[验证服务]")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"健康检查: {health}")

stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'",
    timeout=10
)
resp = stdout.read().decode().strip()
print(f"授权API: {resp[:100]}")

# 检查文件是否存在
print("\n[检查远程文件]")
stdin, stdout, stderr = client.exec_command(f"ls -la {REMOTE_DIR}/src/routes/license.js", timeout=10)
out = stdout.read().decode().strip()
if "license.js" in out:
    print(f"✓ license.js 已上传: {out}")
else:
    print(f"✗ license.js 未找到")

print("\n" + "=" * 60)
print("同步完成")
print("=" * 60)

client.close()
