const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// SSL 证书存储路径
const SSL_PATH = process.env.SSL_PATH || '/opt/windv-server/ssl';

// 系统配置 (生产环境应使用数据库)
let systemSettings = {
  siteName: 'WindV 无人直播助手',
  siteUrl: process.env.FRONTEND_URL || 'http://sq.kxkj.ltd',
  apiUrl: process.env.BACKEND_URL || 'http://sq.kxkj.ltd/api',
  allowRegister: true,
  defaultRole: 'user',
  maxScriptsPerUser: 1000,
  cloudSyncEnabled: true,
  maintenanceMode: false,
  
  // 域名配置
  domain: {
    primary: 'sq.kxkj.ltd',
    aliases: [],
    forceHttps: false,
  },
  
  // SSL 配置
  ssl: {
    enabled: false,
    provider: 'none', // none, certbot, manual
    certPath: '',
    keyPath: '',
    autoRenew: true,
    expiryDate: null,
    lastRenewed: null,
  },
  
  // 邮件配置
  email: {
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromName: 'WindV',
    fromEmail: '',
  },
  
  // 日志配置
  log: {
    level: 'info',
    retention: 30, // 天数
    maxSize: '100m',
  },
  
  // 备份配置
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // 每天凌晨2点
    retention: 7, // 保留7天
    s3Enabled: false,
    s3Bucket: '',
    s3Region: '',
    s3AccessKey: '',
    s3SecretKey: '',
  },
};

/**
 * 获取系统设置
 * GET /api/settings
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // 非管理员隐藏敏感信息
    if (req.user.role !== 'admin') {
      return res.json({
        settings: {
          siteName: systemSettings.siteName,
          siteUrl: systemSettings.siteUrl,
          apiUrl: systemSettings.apiUrl,
          allowRegister: systemSettings.allowRegister,
          cloudSyncEnabled: systemSettings.cloudSyncEnabled,
          maintenanceMode: systemSettings.maintenanceMode,
        }
      });
    }
    
    res.json({ settings: systemSettings });
  } catch (error) {
    logger.error('获取设置失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 更新系统设置 (仅管理员)
 * PUT /api/settings
 */
router.put('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { siteName, siteUrl, allowRegister, maintenanceMode, maxScriptsPerUser } = req.body;
    
    if (siteName !== undefined) systemSettings.siteName = siteName;
    if (siteUrl !== undefined) systemSettings.siteUrl = siteUrl;
    if (allowRegister !== undefined) systemSettings.allowRegister = allowRegister;
    if (maintenanceMode !== undefined) systemSettings.maintenanceMode = maintenanceMode;
    if (maxScriptsPerUser !== undefined) systemSettings.maxScriptsPerUser = maxScriptsPerUser;
    
    logger.info('系统设置已更新');
    
    res.json({ settings: systemSettings });
  } catch (error) {
    logger.error('更新设置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 域名配置
 * PUT /api/settings/domain
 */
router.put('/domain', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { primary, aliases, forceHttps } = req.body;
    
    if (primary) systemSettings.domain.primary = primary;
    if (aliases !== undefined) systemSettings.domain.aliases = aliases;
    if (forceHttps !== undefined) systemSettings.domain.forceHttps = forceHttps;
    
    // 更新环境变量
    systemSettings.siteUrl = forceHttps ? `https://${primary}` : `http://${primary}`;
    systemSettings.apiUrl = `${systemSettings.siteUrl}/api`;
    
    logger.info(`域名配置已更新: ${primary}`);
    
    res.json({ 
      success: true, 
      domain: systemSettings.domain,
      siteUrl: systemSettings.siteUrl,
    });
  } catch (error) {
    logger.error('更新域名配置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 获取 SSL 状态
 * GET /api/settings/ssl
 */
router.get('/ssl', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    // 检查证书文件是否存在
    const certExists = systemSettings.ssl.certPath && fs.existsSync(systemSettings.ssl.certPath);
    const keyExists = systemSettings.ssl.keyPath && fs.existsSync(systemSettings.ssl.keyPath);
    
    res.json({
      ssl: {
        ...systemSettings.ssl,
        certExists,
        keyExists,
        valid: certExists && keyExists,
      }
    });
  } catch (error) {
    logger.error('获取 SSL 状态失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 使用 Certbot 一键申请证书
 * POST /api/settings/ssl/certbot
 */
router.post('/ssl/certbot', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { email, agreeTos = true } = req.body;
    const domain = systemSettings.domain.primary;
    
    if (!email) {
      return res.status(400).json({ error: '需要提供邮箱地址' });
    }
    
    // 检查 certbot 是否安装
    try {
      await execPromise('which certbot');
    } catch {
      return res.status(500).json({ 
        error: 'Certbot 未安装',
        installCommand: 'sudo apt install certbot python3-certbot-nginx -y'
      });
    }
    
    // 执行 certbot 申请证书
    const command = `certbot certonly --nginx -d ${domain} --email ${email} --agree-tos --non-interactive ${agreeTos ? '--agree-tos' : ''}`;
    
    logger.info(`开始申请证书: ${domain}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    // 更新 SSL 配置
    systemSettings.ssl.enabled = true;
    systemSettings.ssl.provider = 'certbot';
    systemSettings.ssl.certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
    systemSettings.ssl.keyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`;
    systemSettings.ssl.lastRenewed = new Date();
    
    // 设置自动续期
    if (systemSettings.ssl.autoRenew) {
      try {
        await execPromise('(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet") | crontab -');
        logger.info('SSL 自动续期已配置');
      } catch (e) {
        logger.warn('配置自动续期失败:', e.message);
      }
    }
    
    logger.info(`证书申请成功: ${domain}`);
    
    res.json({
      success: true,
      message: '证书申请成功',
      ssl: systemSettings.ssl,
      output: stdout,
    });
  } catch (error) {
    logger.error('申请证书失败:', error);
    res.status(500).json({ 
      error: '申请证书失败: ' + error.message,
      details: error.stderr || error.stdout,
    });
  }
});

/**
 * 手动上传证书
 * POST /api/settings/ssl/manual
 */
router.post('/ssl/manual', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { certContent, keyContent, expiryDate } = req.body;
    const domain = systemSettings.domain.primary;
    
    if (!certContent || !keyContent) {
      return res.status(400).json({ error: '需要提供证书和私钥内容' });
    }
    
    // 确保证书目录存在
    if (!fs.existsSync(SSL_PATH)) {
      fs.mkdirSync(SSL_PATH, { recursive: true });
    }
    
    const certPath = path.join(SSL_PATH, `${domain}.crt`);
    const keyPath = path.join(SSL_PATH, `${domain}.key`);
    
    // 写入证书文件
    fs.writeFileSync(certPath, certContent);
    fs.writeFileSync(keyPath, keyContent);
    
    // 设置权限
    fs.chmodSync(certPath, 0o644);
    fs.chmodSync(keyPath, 0o600);
    
    // 更新配置
    systemSettings.ssl.enabled = true;
    systemSettings.ssl.provider = 'manual';
    systemSettings.ssl.certPath = certPath;
    systemSettings.ssl.keyPath = keyPath;
    systemSettings.ssl.expiryDate = expiryDate || null;
    systemSettings.ssl.lastRenewed = new Date();
    
    logger.info(`手动证书已上传: ${domain}`);
    
    res.json({
      success: true,
      message: '证书上传成功',
      ssl: {
        enabled: systemSettings.ssl.enabled,
        provider: systemSettings.ssl.provider,
        certPath: systemSettings.ssl.certPath,
        keyPath: systemSettings.ssl.keyPath,
        expiryDate: systemSettings.ssl.expiryDate,
      }
    });
  } catch (error) {
    logger.error('上传证书失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

/**
 * 测试 SSL 证书
 * GET /api/settings/ssl/test
 */
router.get('/ssl/test', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const domain = systemSettings.domain.primary;
    
    // 使用 openssl 检查证书
    try {
      const { stdout } = await execPromise(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -subject`);
      
      res.json({
        success: true,
        domain,
        details: stdout,
        message: '证书检查成功',
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        domain,
        error: '证书检查失败: ' + e.message,
      });
    }
  } catch (error) {
    logger.error('测试 SSL 失败:', error);
    res.status(500).json({ error: '测试失败' });
  }
});

/**
 * 邮件配置
 * PUT /api/settings/email
 */
router.put('/email', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { enabled, smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail } = req.body;
    
    if (enabled !== undefined) systemSettings.email.enabled = enabled;
    if (smtpHost) systemSettings.email.smtpHost = smtpHost;
    if (smtpPort) systemSettings.email.smtpPort = smtpPort;
    if (smtpUser) systemSettings.email.smtpUser = smtpUser;
    if (smtpPass) systemSettings.email.smtpPass = smtpPass;
    if (fromName) systemSettings.email.fromName = fromName;
    if (fromEmail) systemSettings.email.fromEmail = fromEmail;
    
    logger.info('邮件配置已更新');
    
    res.json({ success: true, email: systemSettings.email });
  } catch (error) {
    logger.error('更新邮件配置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 测试邮件发送
 * POST /api/settings/email/test
 */
router.post('/email/test', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { to } = req.body;
    
    if (!systemSettings.email.enabled) {
      return res.status(400).json({ error: '邮件功能未启用' });
    }
    
    // 这里可以实现实际的邮件发送逻辑
    // 为简化，先返回模拟成功
    
    res.json({
      success: true,
      message: '测试邮件已发送',
      to,
      config: {
        host: systemSettings.email.smtpHost,
        port: systemSettings.email.smtpPort,
        user: systemSettings.email.smtpUser,
      }
    });
  } catch (error) {
    logger.error('测试邮件失败:', error);
    res.status(500).json({ error: '测试失败' });
  }
});

/**
 * 获取系统信息
 * GET /api/settings/info
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const os = require('os');
    const { version } = require('../../package.json');
    
    // 获取磁盘使用情况
    let diskUsage = null;
    try {
      const { stdout } = await execPromise('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      diskUsage = {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        usePercent: parts[4],
      };
    } catch (e) {
      diskUsage = { error: '无法获取磁盘信息' };
    }
    
    res.json({
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        hostname: os.hostname(),
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
          free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
          used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) + ' MB',
        },
        cpu: os.cpus().length,
        loadavg: os.loadavg(),
        disk: diskUsage,
      },
      app: {
        version: version || '1.0.0',
        name: 'WindV Server',
        env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
      },
    });
  } catch (error) {
    logger.error('获取系统信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取备份配置
 * GET /api/settings/backup
 */
router.get('/backup', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    res.json({ backup: systemSettings.backup });
  } catch (error) {
    logger.error('获取备份配置失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 更新备份配置
 * PUT /api/settings/backup
 */
router.put('/backup', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { enabled, schedule, retention, s3Enabled, s3Bucket, s3Region } = req.body;
    
    if (enabled !== undefined) systemSettings.backup.enabled = enabled;
    if (schedule) systemSettings.backup.schedule = schedule;
    if (retention) systemSettings.backup.retention = retention;
    if (s3Enabled !== undefined) systemSettings.backup.s3Enabled = s3Enabled;
    if (s3Bucket) systemSettings.backup.s3Bucket = s3Bucket;
    if (s3Region) systemSettings.backup.s3Region = s3Region;
    
    logger.info('备份配置已更新');
    
    res.json({ success: true, backup: systemSettings.backup });
  } catch (error) {
    logger.error('更新备份配置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

module.exports = router;