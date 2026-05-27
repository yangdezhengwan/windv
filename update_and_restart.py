#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()
print("上传 server.js...")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/server.js", "/opt/windv-server/src/server.js")
sftp.close()
print("✓ 上传完成")

print("\n重启服务...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server")
print(stdout.read().decode())

print("等待启动...")
import time
time.sleep(5)

print("\n检查授权 API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'"
)
resp = stdout.read().decode()
print(resp)

if "授权码不存在" in resp or "valid" in resp:
    print("\n✓ 授权 API 部署成功！")
else:
    print("\n⚠ 请检查响应")

client.close()