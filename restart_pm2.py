#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 执行重启
print("执行 pm2 restart windv-server...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server 2>&1", timeout=20)
output = stdout.read().decode()
print(output)

# 等待启动
print("\n等待 5 秒...")
time.sleep(5)

# 检查状态
print("检查状态...")
stdin, stdout, stderr = client.exec_command("pm2 status | grep windv", timeout=10)
output = stdout.read().decode()
print(output)

# 测试授权 API
print("\n测试授权 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'",
    timeout=15
)
output = stdout.read().decode()
print(f"响应: {output[:200]}")

client.close()
print("\n完成！")