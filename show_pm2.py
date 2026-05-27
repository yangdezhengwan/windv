#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check PM2 config
print("[PM2 Config]")
stdin, stdout, stderr = client.exec_command("pm2 show windv-server 2>&1", timeout=10)
output = stdout.read().decode()
print(output)

client.close()