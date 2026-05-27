#!/usr/bin/env python3
import paramiko
import time
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("=" * 60)
print("重启并验证服务")
print("=" * 60)

# 重启
print("\n[1] 重启 PM2 服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=30)
stdout.channel.recv_exit_status()
print("✓ 服务重启命令已发送")

# 等待启动
print("\n[2] 等待服务启动...")
time.sleep(6)

# 检查状态
print("\n[3] 检查服务状态...")
stdin, stdout, stderr = client.exec_command("pm2 jlist", timeout=10)
try:
    data = json.loads(stdout.read().decode())
    for proc in data:
        if 'windv-server' in str(proc.get('name', '')):
            print(f"  状态: {proc.get('pm2_env', {}).get('status')}")
            print(f"  运行时间: {proc.get('pm2_env', {}).get('pm_uptime')}")
            print(f"  内存: {proc.get('monit', {}).get('memory') / 1024 / 1024:.1f} MB")
except:
    pass

# 健康检查
print("\n[4] 健康检查...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
try:
    health = json.loads(stdout.read().decode())
    print(f"  ✓ {health.get('status')} - v{health.get('version')}")
except:
    print(f"  ✗ {stdout.read().decode()[:50]}")

# 授权 API
print("\n[5] 授权 API 测试...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test123\"}'",
    timeout=10
)
resp = stdout.read().decode()
if "授权码不存在" in resp:
    print(f"  ✓ 授权 API 正常 (license.js 已加载)")
    print(f"  响应: {resp[:80]}...")
elif "valid" in resp:
    print(f"  ✓ 授权 API 正常")
else:
    print(f"  响应: {resp[:100]}")

# 检查 license.js 是否存在
print("\n[6] 检查 license.js 文件...")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/src/routes/license.js", timeout=10)
out = stdout.read().decode()
print(f"  {out.strip()}")

# 检查 license.js 大小
stdin, stdout, stderr = client.exec_command("wc -l /opt/windv-server/src/routes/license.js", timeout=10)
lines = stdout.read().decode().strip()
print(f"  文件行数: {lines}")

print("\n" + "=" * 60)
client.close()
print("完成！")