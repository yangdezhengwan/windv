#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("=" * 60)
print("授权 API 功能验证")
print("=" * 60)

# Test 1: Activate Trial
print("\n[1] 激活试用授权...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"my_device_123\",\"deviceName\":\"MyDevice\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"响应: {resp}")

# Extract license code
import json
try:
    data = json.loads(resp)
    if data.get('success'):
        license_code = data['license']['licenseCode']
        print(f"\n✓ 试用授权成功!")
        print(f"  授权码: {license_code}")
        print(f"  类型: {data['license']['type']}")
        print(f"  有效期: {data['license']['daysLeft']} 天")
        
        # Test 2: Verify
        print("\n[2] 验证授权码...")
        stdin, stdout, stderr = client.exec_command(
            f"curl -s -X POST http://localhost:3000/api/license/verify "
            f"-H 'Content-Type: application/json' "
            f"-d '{{\"licenseCode\":\"{license_code}\",\"deviceId\":\"my_device_123\"}}'",
            timeout=15
        )
        verify_resp = stdout.read().decode().strip()
        print(f"响应: {verify_resp}")
        
        verify_data = json.loads(verify_resp)
        if verify_data.get('valid'):
            print("\n✓ 授权验证成功!")
            print(f"  类型: {verify_data['license']['type']}")
            print(f"  功能: {verify_data['license']['features']}")
        else:
            print(f"\n✗ 验证失败: {verify_data.get('error')}")
        
        # Test 3: Check status
        print("\n[3] 检查设备授权状态...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s http://localhost:3000/api/license/check/my_device_123",
            timeout=15
        )
        check_resp = stdout.read().decode().strip()
        print(f"响应: {check_resp}")
        
except Exception as e:
    print(f"错误: {e}")

print("\n" + "=" * 60)
print("验证完成!")
print("=" * 60)

client.close()