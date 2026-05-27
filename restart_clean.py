#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# Upload files
print("[1] Uploading files...")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/server.js", "/opt/windv-server/src/server.js")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/routes/license.js", "/opt/windv-server/src/routes/license.js")
print("  OK")

sftp.close()

# Delete logs and restart
print("\n[2] Restarting PM2...")
stdin, stdout, stderr = client.exec_command("pm2 delete windv-server; pm2 start node --name windv-server -- /opt/windv-server/src/server.js", timeout=30)
stdout.channel.recv_exit_status()
print("  OK")

# Wait
print("\n[3] Waiting 5 seconds...")
time.sleep(5)

# Test
print("\n[4] Testing APIs...")

# Health
stdin, stdout, stderr = client.exec_command("curl -s --max-time 5 http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"  Health: {health}")

# Trial
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test123\",\"deviceName\":\"Test Device\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Trial: {resp}")

# Verify
stdin, stdout, stderr = client.exec_command(
    "curl -s --max-time 10 -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"WINDV-TEST123-ABC123\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Verify: {resp}")

client.close()
print("\nDone!")