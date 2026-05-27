#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("=" * 60)
print("服务器状态检查")
print("=" * 60)

# Health
print("\n[1] 健康检查...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
print("  " + stdout.read().decode().strip())

# Get license code from trial
print("\n[2] 测试授权API...")
test_script = """
import json
import subprocess
result = subprocess.run([
    'curl', '-s', '-X', 'POST', 
    'http://localhost:3000/api/license/trial',
    '-H', 'Content-Type: application/json',
    '-d', '{\"deviceId\":\"server_test\",\"deviceName\":\"ServerTest\"}'
], capture_output=True, text=True)
print(result.stdout)
"""
with open('/tmp/test_api.py', 'w') as f:
    f.write(test_script)

stdin, stdout, stderr = client.exec_command("cd /opt/windv-server && python3 /tmp/test_api.py", timeout=20)
print("  " + stdout.read().decode().strip())

# Check file versions
print("\n[3] 检查文件版本...")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/src/routes/license.js /opt/windv-server/src/models/License.js", timeout=10)
print("  " + stdout.read().decode().strip().replace('\n', '\n  '))

# PM2 status
print("\n[4] PM2状态...")
stdin, stdout, stderr = client.exec_command("pm2 status | grep windv", timeout=10)
print("  " + stdout.read().decode().strip())

print("\n" + "=" * 60)
client.close()
print("检查完成")