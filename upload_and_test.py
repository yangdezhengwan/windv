#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# 上传修复后的文件
print("[上传文件]")
files = [
    "/workspace/projects/workspace/WINDV/windv/server/src/server.js",
    "/workspace/projects/workspace/WINDV/windv/server/src/routes/license.js",
]
for f in files:
    remote = f.replace("/workspace/projects/workspace/WINDV/windv/server/src/", "/opt/windv-server/src/")
    sftp.put(f, remote)
    print(f"  ✓ {f.split('/')[-1]}")

sftp.close()

# 重启
print("\n[重启服务]")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=20)
stdout.channel.recv_exit_status()
print("  ✓ 重启完成")

# 等待启动
print("\n[等待 5 秒...]")
time.sleep(5)

# 测试
print("\n[测试 API]")
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 http://localhost:3000/api/health",
    timeout=15
)
health = stdout.read().decode().strip()
print(f"  健康: {health}")

# 测试授权 API
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  授权: {resp[:100]}")

# 测试试用
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test123\",\"deviceName\":\"测试\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  试用: {resp[:150]}")

client.close()
print("\n完成！")