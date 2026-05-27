#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check server.js require statements
print("[server.js requires]")
stdin, stdout, stderr = client.exec_command("grep -n 'require' /opt/windv-server/src/server.js | head -20", timeout=10)
print(stdout.read().decode())

# Check if models exist
print("\n[Check models]")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-server/src/models/", timeout=10)
print(stdout.read().decode())

# Simple test with file
test_script = """
process.chdir('/opt/windv-server');
require('dotenv').config();
const License = require('./src/models/License');
console.log('Type:', typeof License);
if (License) {
  console.log('ModelName:', License.modelName);
} else {
  console.log('License is undefined');
}
"""
with open('/tmp/test_license.js', 'w') as f:
    f.write(test_script)

sftp = client.open_sftp()
sftp.put('/tmp/test_license.js', '/opt/windv-server/test_license.js')
sftp.close()

print("\n[Test]")
stdin, stdout, stderr = client.exec_command("cd /opt/windv-server && node test_license.js", timeout=15)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()