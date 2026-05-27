#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Test model loading
print("[Test Model Loading]")
test_code = """
try {
  require('./models/License');
  const License = require('./models/License');
  console.log('License model:', typeof License);
  console.log('License.findOne:', typeof License.findOne);
} catch (e) {
  console.error('Error:', e.message);
}
"""
stdin, stdout, stderr = client.exec_command(f"cd /opt/windv-server/src && node -e \"{test_code}\"", timeout=10)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()