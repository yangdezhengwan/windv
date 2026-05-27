#!/usr/bin/env python3
"""
WindV 云端服务一键部署脚本
使用域名: sq.kxkj.ltd
"""

import paramiko
import sys
import time
import os
import tarfile
import io

# 服务器配置
SERVER_IP = "8.137.144.68"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "ZBZSzbzs123123"
DOMAIN = "sq.kxkj.ltd"

# 项目路径
LOCAL_PROJECT = "/workspace/projects/workspace/WINDV/windv"

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

def exec_command(client, cmd, timeout=120):
    """执行远程命令"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_code, output, error

def upload_file(client, local_path, remote_path):
    """上传文件"""
    sftp = client.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()

def upload_directory(client, local_dir, remote_dir):
    """上传目录"""
    sftp = client.open_sftp()
    
    for root, dirs, files in os.walk(local_dir):
        # 跳过 node_modules
        if 'node_modules' in root or '.git' in root:
            continue
            
        remote_subdir = os.path.join(remote_dir, os.path.relpath(root, local_dir))
        try:
            sftp.stat(remote_subdir)
        except:
            try:
                sftp.mkdir(remote_subdir)
            except:
                pass
        
        for file in files:
            if file.endswith('.map') or file.startswith('.'):
                continue
            local_file = os.path.join(root, file)
            remote_file = os.path.join(remote_subdir, file)
            try:
                sftp.put(local_file, remote_file)
                print(f"  Uploaded: {file}")
            except Exception as e:
                print(f"  Skip: {file} ({e})")
    
    sftp.close()

def main():
    print("=" * 60)
    print("  WindV 云端服务一键部署")
    print(f"  域名: {DOMAIN}")
    print("=" * 60)
    
    client = None
    try:
        # 1. 连接服务器
        print("\n[1/8] 连接服务器...")
        client = ssh_connect()
        print(f"  ✓ 已连接到 {SERVER_IP}")
        
        # 2. 检查系统环境
        print("\n[2/8] 检查系统环境...")
        exit_code, output, _ = exec_command(client, "node --version && npm --version && nginx -v 2>&1 | head -3")
        print(f"  Node: 已安装" if "v" in output else "  Node: 需要安装")
        
        # 3. 安装必要软件
        print("\n[3/8] 安装必要软件...")
        install_script = '''
apt-get update && apt-get install -y curl git wget vim htop tmux nginx certbot python3-certbot-nginx

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 创建目录
mkdir -p /opt/windv-server /opt/windv-admin /backup/windv /var/log/windv

# 清理
apt autoremove -y
'''
        exit_code, output, error = exec_command(client, install_script, timeout=300)
        if exit_code == 0:
            print("  ✓ 软件安装完成")
        else:
            print(f"  ⚠ 安装可能有警告: {error[:200]}")
        
        # 4. 上传后端代码
        print("\n[4/8] 上传后端代码...")
        exec_command(client, "mkdir -p /opt/windv-server && rm -rf /opt/windv-server/*")
        
        server_dir = os.path.join(LOCAL_PROJECT, "server")
        upload_directory(client, server_dir, "/opt/windv-server")
        print("  ✓ 后端代码上传完成")
        
        # 5. 安装后端依赖
        print("\n[5/8] 安装后端依赖...")
        npm_install = '''
cd /opt/windv-server
npm install --production 2>&1 | tail -5
'''
        exit_code, output, error = exec_command(client, npm_install, timeout=180)
        if exit_code == 0:
            print("  ✓ 依赖安装完成")
        else:
            print(f"  ⚠ {error[:100]}")
        
        # 6. 配置后端环境
        print("\n[6/8] 配置后端环境...")
        backend_env = f'''NODE_ENV=production
PORT=3000
DB_CONNECTION_STRING=mongodb://localhost:27017/windv
JWT_SECRET=windv_{DOMAIN.replace(".","_")}_jwt_secret_{int(time.time())}
FRONTEND_URL=http://{DOMAIN}
BACKEND_URL=http://{DOMAIN}
BIND_ADDR=127.0.0.1
'''
        
        # 写入环境变量文件
        sftp = client.open_sftp()
        with sftp.file('/opt/windv-server/.env', 'w') as f:
            f.write(backend_env)
        sftp.close()
        print("  ✓ 环境变量已配置")
        
        # 7. 构建管理后台
        print("\n[7/8] 构建管理后台...")
        admin_dir = os.path.join(LOCAL_PROJECT, "admin")
        
        # 先上传前端代码
        exec_command(client, "mkdir -p /opt/windv-admin && rm -rf /opt/windv-admin/*")
        upload_directory(client, admin_dir, "/opt/windv-admin")
        
        # 安装依赖并构建
        build_script = '''
cd /opt/windv-admin
npm install 2>&1 | tail -3
npm run build 2>&1 | tail -5
'''
        exit_code, output, error = exec_command(client, build_script, timeout=300)
        if exit_code == 0:
            print("  ✓ 前端构建完成")
        else:
            print(f"  ⚠ 构建输出: {output[-200:]}")
        
        # 8. 配置 Nginx
        print("\n[8/8] 配置 Nginx...")
        nginx_config = f'''server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};
    
    root /opt/windv-admin/dist;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API 代理
    location /api {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    
    # 前端路由
    location / {{
        try_files $uri $uri/ /index.html;
    }}
    
    # 安全 headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志
    access_log /var/log/windv/access.log;
    error_log /var/log/windv/error.log;
}}
'''
        
        sftp = client.open_sftp()
        with sftp.file('/etc/nginx/sites-available/windv', 'w') as f:
            f.write(nginx_config)
        sftp.close()
        
        nginx_setup = '''
# 清理默认配置
rm -f /etc/nginx/sites-enabled/default

# 启用配置
ln -sf /etc/nginx/sites-available/windv /etc/nginx/sites-enabled/windv

# 测试并重启
nginx -t && systemctl restart nginx

# 配置防火墙
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
'''
        exec_command(client, nginx_setup)
        print("  ✓ Nginx 配置完成")
        
        # 9. 启动后端服务
        print("\n[9/9] 启动后端服务...")
        pm2_setup = '''
cd /opt/windv-server

# 停止旧进程
pm2 stop windv-server 2>/dev/null || true
pm2 delete windv-server 2>/dev/null || true

# 启动新服务
pm2 start npm --name "windv-server" -- start

# 保存配置
pm2 save

# 设置开机启动
pm2 startup 2>/dev/null || true
'''
        exit_code, output, error = exec_command(client, pm2_setup, timeout=60)
        print("  ✓ 服务启动完成")
        
        # 10. 创建管理员账号
        print("\n[10/10] 创建管理员账号...")
        
        # 创建初始化脚本
        init_script = '''
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function initAdmin() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/windv');
        
        // 检查是否已有管理员
        const existing = await User.findOne({ role: 'admin' });
        if (existing) {
            console.log('管理员已存在');
            process.exit(0);
        }
        
        // 创建默认管理员
        const admin = new User({
            username: 'admin',
            email: 'admin@windv.local',
            password: 'WindV@2025',
            role: 'admin',
            isActive: true
        });
        
        await admin.save();
        console.log('管理员创建成功');
        console.log('用户名: admin');
        console.log('密码: WindV@2025');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('初始化失败:', error.message);
        process.exit(1);
    }
}

initAdmin();
'''
        
        sftp = client.open_sftp()
        with sftp.file('/opt/windv-server/init-admin.js', 'w') as f:
            f.write(init_script)
        sftp.close()
        
        # 等待 MongoDB 启动并初始化
        exec_command(client, 'mongod --version 2>/dev/null && echo "MongoDB installed" || echo "MongoDB not found"')
        
        init_result = exec_command(client, 'cd /opt/windv-server && node init-admin.js 2>&1', timeout=30)
        print(f"  初始化结果: {init_result[1][:200]}")
        
        # 最终检查
        print("\n" + "=" * 60)
        print("  部署完成!")
        print("=" * 60)
        print(f"\n🌐 访问地址: http://{DOMAIN}")
        print(f"📝 API 地址: http://{DOMAIN}/api")
        print("\n🔐 默认管理员账号:")
        print("   用户名: admin")
        print("   密码: WindV@2025")
        print("\n⚠️  首次登录后请立即修改密码!")
        print("\n常用命令:")
        print(f"   查看日志: pm2 logs windv-server")
        print(f"   重启服务: pm2 restart windv-server")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 部署失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if client:
            client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
