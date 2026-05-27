#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查最新日志
print("[最新日志]")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 30 --nostream 2>&1", timeout=15)
output = stdout.read().decode()
print(output[-2000:] if len(output) > 2000 else output)

client.close()