#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Kill any running node processes
print("[1] Stopping all processes...")
stdin, stdout, stderr = client.exec_command("pkill -f 'node.*server' || true", timeout=10)
time.sleep(2)

# Check .env exists
print("\n[2] Checking .env...")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/.env && head -5 /opt/windv-server/.env", timeout=10)
print(stdout.read().decode())

# Start with PM2
print("\n[3] Starting with PM2...")
cmd = "cd /opt/windv-server && pm2 start node --name windv-server -- src/server.js"
stdin, stdout, stderr = client.exec_command(cmd, timeout=20)
stdout.channel.recv_exit_status()
print("  OK")

time.sleep(5)

# Test
print("\n[4] Testing APIs...")

# Health
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"  Health: {health}")

# Trial
stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test_device_123\",\"deviceName\":\"Test123\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Trial: {resp}")

client.close()
print("\nDone!")