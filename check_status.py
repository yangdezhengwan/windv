#!/usr/bin/env python3
import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("=" * 60)
print("服务器部署状态检查")
print("=" * 60)

# 1. PM2 状态
print("\n[PM2 服务状态]")
stdin, stdout, stderr = client.exec_command("pm2 jlist | grep -E '(name|status|uptime|memory)' | head -20", timeout=10)
print(stdout.read().decode())

# 2. API 健康
print("\n[API 健康检查]")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
resp = stdout.read().decode()
try:
    data = json.loads(resp)
    print(f"✓ 状态: {data.get('status')}")
    print(f"✓ 版本: {data.get('version')}")
    print(f"✓ 运行时间: {float(data.get('uptime', 0)):.0f} 秒")
except:
    print(resp)

# 3. 授权 API
print("\n[授权 API 测试]")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'",
    timeout=10
)
resp = stdout.read().decode()
if "授权码不存在" in resp or "valid" in resp.lower():
    print("✓ 授权 API 正常")
else:
    print(f"响应: {resp[:150]}")

# 4. 用户 API
print("\n[用户 API 测试]")
stdin, stdout, stderr = client.exec_command(
    "curl -s http://localhost:3000/api/settings/info",
    timeout=10
)
resp = stdout.read().decode()
if "system" in resp or "app" in resp:
    print("✓ 系统信息 API 正常")
else:
    print(f"响应: {resp[:150]}")

# 5. 前端
print("\n[前端访问]")
stdin, stdout, stderr = client.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' http://sq.kxkj.ltd/",
    timeout=10
)
code = stdout.read().decode().strip()
if code == "200":
    print(f"✓ 前端正常 (HTTP {code})")
else:
    print(f"⚠ 前端返回 HTTP {code}")

print("\n" + "=" * 60)
client.close()
print("检查完成")