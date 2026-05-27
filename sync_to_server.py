#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# 上传关键文件
print("[1] 上传文件...")
files = [
    ("server/src/server.js", "/opt/windv-server/src/server.js"),
    ("server/src/routes/license.js", "/opt/windv-server/src/routes/license.js"),
    ("server/src/models/License.js", "/opt/windv-server/src/models/License.js"),
    ("server/src/models/User.js", "/opt/windv-server/src/models/User.js"),
    ("server/src/models/Script.js", "/opt/windv-server/src/models/Script.js"),
    ("server/src/models/Stats.js", "/opt/windv-server/src/models/Stats.js"),
    ("server/src/routes/auth.js", "/opt/windv-server/src/routes/auth.js"),
    ("server/src/routes/users.js", "/opt/windv-server/src/routes/users.js"),
    ("server/src/routes/scripts.js", "/opt/windv-server/src/routes/scripts.js"),
    ("server/src/routes/stats.js", "/opt/windv-server/src/routes/stats.js"),
    ("server/src/routes/settings.js", "/opt/windv-server/src/routes/settings.js"),
    ("server/src/middleware/auth.js", "/opt/windv-server/src/middleware/auth.js"),
]

local_base = "/workspace/projects/workspace/WINDV/windv"
for local_rel, remote in files:
    local = f"{local_base}/{local_rel}"
    try:
        sftp.put(local, remote)
        print(f"  ✓ {local_rel.split('/')[-1]}")
    except Exception as e:
        print(f"  ✗ {local_rel}: {e}")

sftp.close()

# 重启
print("\n[2] 重启服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=20)
stdout.channel.recv_exit_status()
print("  ✓ 重启完成")

time.sleep(5)

# 测试
print("\n[3] 测试 API...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"  健康检查: {health}")

stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"sync_test\",\"deviceName\":\"SyncTest\"}'",
    timeout=15
)
trial = stdout.read().decode().strip()
print(f"  试用激活: {trial[:100]}...")

client.close()
print("\n[完成]")