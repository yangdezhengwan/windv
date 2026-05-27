#!/usr/bin/env python3
"""
检查 WindV 云端服务状态
"""

import paramiko
import json

# 服务器配置
SERVER_IP = "8.137.144.68"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "ZBZSzbzs123123"
DOMAIN = "sq.kxkj.ltd"

def ssh_connect():
    """建立 SSH 连接"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_IP,
        port=SERVER_PORT,
        username=SERVER_USER,
        password=SERVER_PASSWORD,
        timeout=30
    )
    return client

def exec_command(client, cmd, timeout=30):
    """执行远程命令"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    error = stderr.read().decode('utf-8', errors='ignore').strip()
    return exit_code, output, error

def main():
    print("=" * 60)
    print("  WindV 云端服务状态检查")
    print(f"  服务器: {SERVER_IP}")
    print("=" * 60)
    
    client = None
    try:
        client = ssh_connect()
        print("\n✓ SSH 连接成功")
        
        # 检查 PM2 状态
        print("\n[服务状态]")
        exit_code, output, _ = exec_command(client, "pm2 status | grep windv")
        if "windv-server" in output:
            print(f"  {output}")
        else:
            print("  ⚠ windv-server 未运行")
        
        # 检查 API 健康
        print("\n[API 健康检查]")
        exit_code, output, _ = exec_command(client, "curl -s http://localhost:3000/api/health")
        if exit_code == 0:
            try:
                health = json.loads(output)
                print(f"  ✓ 状态: {health.get('status', 'unknown')}")
                print(f"  ✓ 版本: {health.get('version', 'unknown')}")
                print(f"  ✓ 运行时间: {health.get('uptime', 0):.0f} 秒")
            except:
                print(f"  响应: {output}")
        else:
            print("  ✗ API 无法访问")
        
        # 检查 Nginx
        print("\n[Nginx 状态]")
        exit_code, output, _ = exec_command(client, "systemctl is-active nginx")
        if "active" in output:
            print(f"  ✓ Nginx 运行中")
        else:
            print(f"  ✗ Nginx 未运行: {output}")
        
        # 检查 MongoDB
        print("\n[MongoDB 状态]")
        exit_code, output, _ = exec_command(client, "systemctl is-active mongod")
        if "active" in output:
            print(f"  ✓ MongoDB 运行中")
            # 检查连接
            exit_code, output, _ = exec_command(client, "mongosh --eval 'db.version()' --quiet 2>/dev/null || mongo --eval 'db.version()' --quiet")
            if "7.0" in output:
                print(f"  ✓ MongoDB 版本: {output}")
        else:
            print(f"  ✗ MongoDB 未运行")
        
        # 检查授权 API
        print("\n[授权 API 检查]")
        exit_code, output, _ = exec_command(client, "curl -s -X POST http://localhost:3000/api/license/verify -H 'Content-Type: application/json' -d '{\"licenseCode\":\"TEST\",\"deviceId\":\"test\"}'")
        if exit_code == 0:
            try:
                resp = json.loads(output)
                if "error" in resp:
                    print(f"  ✓ 授权 API 正常 (返回预期错误: {resp.get('error')})")
                else:
                    print(f"  ✓ 授权 API 正常")
            except:
                print(f"  响应: {output[:100]}")
        
        # 检查用户 API
        print("\n[用户 API 检查]")
        exit_code, output, _ = exec_command(client, "curl -s http://localhost:3000/api/settings/info | head -100")
        if exit_code == 0 and "system" in output:
            print("  ✓ 系统信息 API 正常")
        
        # 检查域名解析
        print("\n[域名配置]")
        exit_code, output, _ = exec_command(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://{DOMAIN}/api/health")
        if output == "200":
            print(f"  ✓ 域名 {DOMAIN} 可正常访问")
        else:
            print(f"  ⚠ 域名返回状态码: {output}")
        
        print("\n" + "=" * 60)
        print("检查完成")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    main()