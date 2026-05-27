#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查文件内容
print("[检查 license.js 第 145-160 行]")
stdin, stdout, stderr = client.exec_command("sed -n '145,160p' /opt/windv-server/src/routes/license.js", timeout=10)
output = stdout.read().decode()
print(output)

# 重启服务
print("\n[重启服务]")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server 2>&1", timeout=20)
output = stdout.read().decode()
print(output)

client.close()