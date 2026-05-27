#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# Upload license.js
print("[1] Uploading license.js...")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/routes/license.js", "/opt/windv-server/src/routes/license.js")
print("  OK")

sftp.close()

# Restart
print("\n[2] Restarting PM2...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=20)
stdout.channel.recv_exit_status()
print("  OK")

# Wait
print("\n[3] Waiting 6 seconds...")
time.sleep(6)

# Test
print("\n[4] Testing APIs...")

# Health
stdin, stdout, stderr = client.exec_command("curl -s --max-time 5 http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"  Health: {health}")

# Verify
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TEST123\",\"deviceId\":\"test\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Verify: {resp}")

# Trial
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test_device_001\",\"deviceName\":\"Test\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Trial: {resp}")

client.close()
print("\nDone!")