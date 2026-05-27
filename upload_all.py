#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# Upload
print("[1] Uploading files...")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/models/License.js", "/opt/windv-server/src/models/License.js")
sftp.put("/workspace/projects/workspace/WINDV/windv/server/src/routes/license.js", "/opt/windv-server/src/routes/license.js")
print("  OK")

sftp.close()

# Restart
print("\n[2] Restarting PM2...")
stdin, stdout, stderr = client.exec_command("pm2 restart windv-server", timeout=20)
stdout.channel.recv_exit_status()
print("  OK")

time.sleep(6)

# Test
print("\n[3] Testing APIs...")

# Health
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
print("  Health:", stdout.read().decode().strip())

# Trial
print("\n[4] Testing Trial API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"final_test_device\",\"deviceName\":\"FinalTest\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print("  Trial:", resp)

# Verify
print("\n[5] Testing Verify API...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/verify "
    "-H 'Content-Type: application/json' "
    "-d '{\"licenseCode\":\"TRIAL-FINAL_T-FINAL_TES-XXXXX\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print("  Verify:", resp)

# Check logs
print("\n[6] Checking logs...")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 15 --nostream 2>&1 | tail -20", timeout=15)
print(stdout.read().decode())

client.close()
print("\nDone!")