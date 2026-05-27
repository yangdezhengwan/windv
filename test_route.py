#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check license.js header
print("[license.js requires]")
stdin, stdout, stderr = client.exec_command("head -10 /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

# Test loading license route
print("\n[Test Route Loading]")
test_code = """
try {
  const licenseRoutes = require('./routes/license');
  console.log('Routes loaded:', typeof licenseRoutes);
} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
"""
stdin, stdout, stderr = client.exec_command(f"cd /opt/windv-server/src && node -e \"{test_code}\"", timeout=10)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()