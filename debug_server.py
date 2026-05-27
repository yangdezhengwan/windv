#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check the license route file on server
print("[Checking license.js on server]")
stdin, stdout, stderr = client.exec_command("head -20 /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

# Check models directory on server
print("\n[Models on server]")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/src/models/", timeout=10)
print(stdout.read().decode())

# Test direct import with working directory
print("\n[Test direct import]")
cmd = 'cd /opt/windv-server && node -e "require(\\'dotenv\\').config();const L=require(\\'./src/models/License\\');console.log(\\'Type:\\',typeof L,L&&L.modelName)"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()