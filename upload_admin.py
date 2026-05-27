#!/usr/bin/env python3
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("8.137.144.68", 22, "root", "ZBZSzbzs123123", timeout=30)

sftp = client.open_sftp()

# 上传前端文件
print("[1] 上传前端文件...")
admin_dist = "/workspace/projects/workspace/WINDV/windv/admin/dist"
for root, dirs, files in __import__('os').walk(admin_dist):
    for file in files:
        local = __import__('os').path.join(root, file)
        remote = local.replace(admin_dist, '/opt/windv-admin/dist')
        remote_dir = __import__('os').path.dirname(remote)
        try:
            sftp.stat(remote_dir)
        except:
            # Create directory
            client.exec_command(f"mkdir -p {remote_dir}")
        try:
            sftp.put(local, remote)
        except Exception as e:
            print(f"  Error: {e}")

print("  ✓ 上传完成")

sftp.close()

# 检查文件
print("\n[2] 检查文件...")
stdin, stdout, stderr = client.exec_command("ls -la /opt/windv-admin/dist/", timeout=10)
print(stdout.read().decode())

# 重启 Nginx
print("\n[3] 重启 Nginx...")
stdin, stdout, stderr = client.exec_command("nginx -t && nginx -s reload", timeout=15)
print(stdout.read().decode())

client.close()
print("\n[完成]")