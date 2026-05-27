#!/usr/bin/env python3
import subprocess
import json

# Test license API
result = subprocess.run([
    'curl', '-s', '-X', 'POST',
    'http://localhost:3000/api/license/trial',
    '-H', 'Content-Type: application/json',
    '-d', '{"deviceId":"paramiko_test","deviceName":"ParamikoTest"}'
], capture_output=True, text=True, cwd='/opt/windv-server/src')

print("API Response:", result.stdout)
print("Errors:", result.stderr)

try:
    data = json.loads(result.stdout)
    if data.get('success'):
        print("\n✅ 授权API正常工作!")
        print(f"授权码: {data['license']['licenseCode']}")
        print(f"类型: {data['license']['type']}")
        print(f"有效期: {data['license']['daysLeft']} 天")
except:
    print("\n响应解析失败")
