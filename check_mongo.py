#!/usr/bin/env python3
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

# Check MongoDB status
print("[MongoDB Status]")
stdin, stdout, stderr = client.exec_command("systemctl status mongod | head -10", timeout=15)
print(stdout.read().decode())

# Check MongoDB port
print("\n[MongoDB Port]")
stdin, stdout, stderr = client.exec_command("netstat -tlnp | grep 27017", timeout=10)
print(stdout.read().decode())

# Test MongoDB connection
print("\n[Test MongoDB]")
stdin, stdout, stderr = client.exec_command("mongosh --eval 'db.version()' --quiet 2>&1 | head -5", timeout=15)
print(stdout.read().decode())

# Check connection string
print("\n[Connection String]")
stdin, stdout, stderr = client.exec_command("grep -E 'DB_|MONGO' /opt/windv-server/.env 2>/dev/null || echo 'No .env found'", timeout=10)
print(stdout.read().decode())

client.close()