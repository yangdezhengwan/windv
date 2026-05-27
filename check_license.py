#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查文件
print("[1] 检查 license.js")
stdin, stdout, stderr = client.exec_command("head -20 /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

print("\n[2] 检查文件行数")
stdin, stdout, stderr = client.exec_command("wc -l /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode().strip())

print("\n[3] 检查 server.js 是否导入 license")
stdin, stdout, stderr = client.exec_command("grep -n 'license' /opt/windv-server/src/server.js", timeout=10)
print(stdout.read().decode())

client.close()
print("\n完成！")