#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Create a test script
test_script = """
process.chdir('/opt/windv-server');
require('dotenv').config();

// Test requiring the route
try {
  const licenseRoutes = require('./src/routes/license');
  console.log('Routes loaded:', typeof licenseRoutes);
  console.log('Routes keys:', Object.keys(licenseRoutes));
} catch (e) {
  console.log('Route load error:', e.message);
  console.log(e.stack);
}
"""
with open('/tmp/test_route2.js', 'w') as f:
    f.write(test_script)

sftp = client.open_sftp()
sftp.put('/tmp/test_route2.js', '/opt/windv-server/test_route2.js')
sftp.close()

print("[Test route loading]")
stdin, stdout, stderr = client.exec_command("cd /opt/windv-server && node test_route2.js 2>&1", timeout=15)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()