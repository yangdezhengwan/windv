#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check PM2 logs
print("[PM2 Logs]")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 50 --nostream 2>&1", timeout=15)
print(stdout.read().decode())

client.close()