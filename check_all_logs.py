#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check logs
print("[Server Logs]")
stdin, stdout, stderr = client.exec_command("cat /root/.pm2/logs/windv-server-out.log 2>/dev/null | tail -50", timeout=15)
print(stdout.read().decode())

# Check error logs
print("\n[Error Logs]")
stdin, stdout, stderr = client.exec_command("cat /root/.pm2/logs/windv-server-error.log 2>/dev/null | tail -30", timeout=15)
print(stdout.read().decode())

client.close()