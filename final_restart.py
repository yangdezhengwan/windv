#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

print("重启 PM2 服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server && sleep 5 && pm2 status", timeout=30)
stdout.channel.recv_exit_status()

print("\n等待服务完全启动...")
time.sleep(3)

print("\n测试授权 API:")
cmd = 'curl -s -X POST http://localhost:3000/api/license/verify -H "Content-Type: application/json" -d \'{"licenseCode":"TEST","deviceId":"test"}\''
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
resp = stdout.read().decode()
print(f"响应: {resp}")

print("\n测试试用授权 API:")
cmd = 'curl -s -X POST http://localhost:3000/api/license/trial -H "Content-Type: application/json" -d \'{"deviceId":"test_device_001","deviceName":"测试设备"}\''
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
resp = stdout.read().decode()
print(f"响应: {resp[:200]}")

client.close()
print("\n完成！")