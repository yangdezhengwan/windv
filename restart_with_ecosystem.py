#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Stop all
print("[1] Stopping all...")
stdin, stdout, stderr = client.exec_command("pm2 stop all; pm2 delete all; pkill -f 'node.*server' || true", timeout=20)
print("  Done")

time.sleep(3)

# Clear cache
print("\n[2] Clearing Node cache...")
stdin, stdout, stderr = client.exec_command("rm -rf /opt/windv-server/node_modules/.cache 2>/dev/null || true", timeout=10)
print("  Done")

# Start fresh with ecosystem config
print("\n[3] Creating ecosystem config...")

ecosystem = """
const path = require('path');
module.exports = {
  apps: [{
    name: 'windv-server',
    script: path.join(__dirname, 'src', 'server.js'),
    cwd: '/opt/windv-server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
"""

with open('/tmp/ecosystem.config.js', 'w') as f:
    f.write(ecosystem)

sftp = client.open_sftp()
sftp.put('/tmp/ecosystem.config.js', '/opt/windv-server/ecosystem.config.js')
sftp.close()

print("  Config created")

time.sleep(2)

# Start with ecosystem
print("\n[4] Starting with ecosystem config...")
stdin, stdout, stderr = client.exec_command("cd /opt/windv-server && pm2 start ecosystem.config.js", timeout=20)
print(stdout.read().decode())

time.sleep(5)

# Test
print("\n[5] Testing...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
print("  Health:", stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"final_test\",\"deviceName\":\"FinalTest\"}'",
    timeout=15
)
print("  Trial:", stdout.read().decode().strip())

# Check logs
print("\n[6] Checking logs...")
stdin, stdout, stderr = client.exec_command("pm2 logs windv-server --lines 30 --nostream 2>&1 | tail -20", timeout=15)
print(stdout.read().decode())

client.close()
print("\nDone!")