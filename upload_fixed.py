#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# 上传修复后的 license.js
print("上传 license.js...")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/routes/license.js", "/opt/windv-server/src/routes/license.js")
print("✓ 上传完成")

sftp.close()

# 重启服务
print("\n重启服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=20)
stdout.channel.recv_exit_status()

print("等待启动...")
import time
time.sleep(5)

# 验证
print("\n测试授权 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'",
    timeout=10
)
resp = stdout.read().decode()
print(f"响应: {resp}")

client.close()
print("\n完成！")