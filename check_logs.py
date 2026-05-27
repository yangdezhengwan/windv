#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查 PM2 日志
print("[PM2 日志]")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 30 --nostream 2>&1", timeout=15)
output = stdout.read().decode()
print(output[-2000:] if len(output) > 2000 else output)

# 检查 Node 进程
print("\n[Node 进程]")
stdin, stdout, stderr = client.exec_command("ps aux | grep node | grep -v grep", timeout=10)
output = stdout.read().decode()
print(output)

# 检查端口
print("\n[端口监听]")
stdin, stdout, stderr = client.exec_command("netstat -tlnp | grep 3000", timeout=10)
output = stdout.read().decode()
print(output)

client.close()