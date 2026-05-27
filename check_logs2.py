#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查日志
print("[最近日志]")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 50 --nostream 2>&1 | tail -60", timeout=15)
output = stdout.read().decode()
print(output)

# 检查端口状态
print("\n[端口]")
stdin, stdout, stderr = client.exec_command("netstat -tlnp 2>/dev/null | grep 3000", timeout=10)
output = stdout.read().decode()
print(output)

client.close()