#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check process
print("[Process]")
stdin, stdout, stderr = client.exec_command("ps aux | grep node | grep -v grep", timeout=10)
print(stdout.read().decode())

# Check port
print("\n[Port 3000]")
stdin, stdout, stderr = client.exec_command("netstat -tlnp | grep 3000", timeout=10)
print(stdout.read().decode())

# Try direct test
print("\n[Test direct]")
test_script = """
const License = require('./models/License');
console.log('License type:', typeof License);
License.findOne({}).then(r => console.log('findOne works:', !!r)).catch(e => console.log('findOne error:', e.message));
"""
stdin, stdout, stderr = client.exec_command(f"cd /opt/windv-server/src && node -e \"{test_script}\"", timeout=15)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()