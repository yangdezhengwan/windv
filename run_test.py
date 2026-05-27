#!/usr/bin/env python3
import paramiko
import subprocess
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Upload test script
sftp = client.open_sftp()
sftp.put("/workspace/projects/workspace/WINDV/windv/test_api_simple.py", "/opt/windv-server/test_api_simple.py")
sftp.close()

# Run test
print("[测试授权API]")
stdin, stdout, stderr = client.exec_command("cd /opt/windv-server && python3 test_api_simple.py", timeout=20)
output = stdout.read().decode()
print(output)
if stderr.read().decode():
    print("Errors:", stderr.read().decode())

client.close()
print("\n完成!")