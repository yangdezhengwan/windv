#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check current license.js
print("[Current license.js line 8-10]")
stdin, stdout, stderr = client.exec_command("sed -n '8,10p' /opt/windv-server/src/routes/license.js", timeout=10)
print(stdout.read().decode())

# Check PM2 process
print("\n[PM2 Status]")
stdin, stdout, stderr = client.exec_command("pm2 jlist 2>/dev/null | node -e \"const d=require('fs').readFileSync('/dev/stdin','utf8');const p=JSON.parse(d);p.forEach(x=>console.log(x.pm2_env.pm_id,x.pm2_env.name,x.pm2_env.status,x.pm2_env.pm_exec_path))\"", timeout=10)
print(stdout.read().decode())

# Check if server is using new code
print("\n[Process exec path]")
stdin, stdout, stderr = client.exec_command("ps aux | grep 'node.*server.js' | grep -v grep", timeout=10)
print(stdout.read().decode())

client.close()