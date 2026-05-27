#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Stop PM2
print("[1] Stopping PM2...")
stdin, stdout, stderr = client.exec_command("pm2 stop windv-server 2>&1", timeout=15)
print(stdout.read().decode())

# Kill any remaining processes
print("\n[2] Killing remaining processes...")
stdin, stdout, stderr = client.exec_command("pkill -f 'node.*windv' || true", timeout=10)
print("  Done")

time.sleep(2)

# Clear PM2 logs
print("\n[3] Clearing logs...")
stdin, stdout, stderr = client.exec_command("pm2 flush", timeout=10)
print("  Done")

# Start fresh
print("\n[4] Starting fresh...")
stdin, stdout, stderr = client.exec_command("cd /opt/windv-server/src && node server.js &", timeout=10)
print("  Background started")

time.sleep(5)

# Test
print("\n[5] Testing...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health", timeout=10)
health = stdout.read().decode().strip()
print(f"  Health: {health}")

stdin, stdout, stderr = client.exec_command(
    "curl -s -X POST http://localhost:3000/api/license/trial "
    "-H 'Content-Type: application/json' "
    "-d '{\"deviceId\":\"test999\",\"deviceName\":\"Test99\"}'",
    timeout=15
)
resp = stdout.read().decode().strip()
print(f"  Trial: {resp}")

client.close()
print("\nDone!")