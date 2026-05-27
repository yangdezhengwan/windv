#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("重启服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server")
print(stdout.read().decode())

print("等待启动...")
import time
time.sleep(5)

print("检查状态...")
stdin, stdout, stderr = client.exec_command("pm2 status | grep windv")
print(stdout.read().decode())

print("检查 API...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
print(stdout.read().decode())

print("检查授权 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'"
)
print(stdout.read().decode())

client.close()