#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# 检查文件行数
print("[检查 license.js]")
stdin, stdout, stderr = client.exec_command("wc -l /opt/windv-server/src/routes/license.js", timeout=10)
lines = stdout.read().decode().strip()
print(f"  行数: {lines}")

# 检查第 151 行
print("\n[第 151 行]")
stdin, stdout, stderr = client.exec_command("sed -n '151p' /opt/windv-server/src/routes/license.js", timeout=10)
line = stdout.read().decode().strip()
print(f"  {line}")

# 检查第 148-155 行
print("\n[148-155 行]")
stdin, stdout, stderr = client.exec_command("sed -n '148,155p' /opt/windv-server/src/routes/license.js", timeout=10)
lines = stdout.read().decode()
print(lines)

client.close()