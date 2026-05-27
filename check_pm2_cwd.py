#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check PM2 config
print("[PM2 Config]")
stdin, stdout, stderr = client.exec_command("pm2 show windv-server | grep -E 'cwd|script'", timeout=10)
print(stdout.read().decode())

# Test from correct directory
print("\n[Test from /opt/windv-server]")
test = """
process.chdir('/opt/windv-server');
require('dotenv').config();
const License = require('./src/models/License');
console.log('License:', typeof License);
License.findOne({}).then(r => console.log('Works:', !!r)).catch(e => console.log('Error:', e.message));
"""
# Encode properly
stdin, stdout, stderr = client.exec_command('cd /opt/windv-server && node -e "require(\\'dotenv\\').config();const L=require(\\'./src/models/License\\');console.log(\\'Type:\\',typeof L);L.findOne({}).then(r=>console.log(\\'OK:\\',!!r)).catch(e=>console.log(\\'Err:\\',e.message))"', timeout=15)
print(stdout.read().decode())

client.close()