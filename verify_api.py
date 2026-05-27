#!/usr/bin/env python3
import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("=" * 60)
print("授权 API 功能验证")
print("=" * 60)

# 1. 测试授权验证 API
print("\n[1/4] 测试授权验证 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test123\"}' "
    "-w '\\nHTTP_CODE:%{http_code}'"
)
resp = stdout.read().decode()
print(f"响应: {resp[:200]}")
if "error" in resp.lower() or "valid" in resp.lower():
    print("✓ /api/license/verify 正常")
else:
    print("✗ 响应异常")

# 2. 测试检查授权状态 API
print("\n[2/4] 测试检查授权状态 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s http://localhost:3000/api/license/check/test123"
)
resp = stdout.read().decode()
print(f"响应: {resp}")
if "licensed" in resp.lower():
    print("✓ /api/license/check/:deviceId 正常")
else:
    print("✗ 响应异常")

# 3. 测试试用激活 API
print("\n[3/4] 测试试用激活 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test_trial_123\",\"deviceName\":\"Test Device\"}'"
)
resp = stdout.read().decode()
print(f"响应: {resp[:200]}")
if "success" in resp.lower() or "error" in resp.lower():
    print("✓ /api/license/trial 正常")
else:
    print("✗ 响应异常")

# 4. 测试设置 API
print("\n[4/4] 测试系统设置 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s http://localhost:3000/api/settings/info | head -c 500"
)
resp = stdout.read().decode()
if "system" in resp or "app" in resp:
    print("✓ /api/settings/info 正常")
    try:
        data = json.loads(resp)
        print(f"  系统: {data.get('system', {}).get('platform', 'unknown')}")
        print(f"  版本: {data.get('app', {}).get('version', 'unknown')}")
    except:
        pass
else:
    print(f"响应: {resp[:100]}")

print("\n" + "=" * 60)
print("验证完成")
print("=" * 60)

client.close()