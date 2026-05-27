const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// 系统配置存储 (实际项目中应存数据库)
const systemSettings = {
  siteName: 'WindV 管理后台',
  siteUrl: process.env.FRONTEND_URL || 'http://sq.kxkj.ltd',
  allowRegister: true,
  defaultRole: 'user',
  maxScriptsPerUser: 1000,
  cloudSyncEnabled: true,
};

/**
 * 获取系统设置
 * GET /api/settings
 */
router.get('/', authenticate, async (req, res) => {
  try {
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
    
    const { siteName, siteUrl, allowRegister, maxScriptsPerUser } = req.body;
    
    if (siteName !== undefined) systemSettings.siteName = siteName;
    if (siteUrl !== undefined) systemSettings.siteUrl = siteUrl;
    if (allowRegister !== undefined) systemSettings.allowRegister = allowRegister;
    if (maxScriptsPerUser !== undefined) systemSettings.maxScriptsPerUser = maxScriptsPerUser;
    
    logger.info('系统设置已更新');
    
    res.json({ settings: systemSettings });
  } catch (error) {
    logger.error('更新设置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 获取系统信息
 * GET /api/settings/info
 */
router.get('/info', async (req, res) => {
  try {
    const os = require('os');
    const { version } = require('../../package.json');
    
    res.json({
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
        },
        cpu: os.cpus().length,
      },
      app: {
        version: version || '1.0.0',
        name: 'WindV Server',
        env: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    logger.error('获取系统信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;