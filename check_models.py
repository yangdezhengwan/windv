#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check models directory
print("[Models]")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/src/models/", timeout=10)
print(stdout.read().decode())

# Check License.js
print("\n[License.js header]")
stdin, stdout, stderr = client.exec_command("head -20 /opt/windv-server/src/models/License.js", timeout=10)
print(stdout.read().decode())

# Check if models are required in server.js
print("\n[Models in server.js]")
stdin, stdout, stderr = client.exec_command("grep -n 'models' /opt/windv-server/src/server.js", timeout=10)
print(stdout.read().decode())

client.close()