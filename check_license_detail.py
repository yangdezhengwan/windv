#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check the actual license.js content
print("[license.js lines 1-10]")
stdin, stdout, stderr = client.exec_command("sed -n '1,10p' /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

# Check if there's a reference to License in the verify route
print("\n[verify route License usage]")
stdin, stdout, stderr = client.exec_command("sed -n '85,95p' /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

client.close()