/**
 * 软件授权相关路由
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticate } = require('../../middleware/auth');
const { User } = require('../../models/User');
const { License } = require('../../models/License');
const { logger } = require('../../utils/logger');
const { generateLicense } = require('../../utils/licenseGenerator');

const router = express.Router();

// 生成随机机器码
function generateMachineCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// 激活码
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 生成授权码
 * POST /api/license/generate
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { deviceId, deviceName, expiryDays = 365 } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '缺少设备ID' });
    }
    
    // 检查设备是否已有授权
    let license = await License.findOne({ deviceId, isActive: true });
    
    if (license && new Date(license.expiryDate) > new Date()) {
      logger.info(`设备 ${deviceId} 已有有效授权`);
      return res.json({
        licenseCode: license.licenseCode,
        expiryDate: license.expiryDate,
        machineCode: license.machineCode,
        type: license.type,
        features: license.features,
        existing: true,
      });
    }
    
    // 检查用户授权配额
    const user = await User.findById(req.user.id);
    if (user.licenseQuota <= 0 && !user.isAdmin) {
      return res.status(403).json({ 
        error: '授权配额已用完，请联系管理员' 
      });
    }
    
    // 生成新的授权
    const licenseCode = await generateLicense({
      deviceId,
      deviceName,
      userId: req.user.id,
      type: user.isAdmin ? 'admin' : 'standard',
      expiryDays,
      features: user.isAdmin ? ['all'] : ['basic', 'sync', 'stats'],
    });
    
    // 扣减用户授权配额
    if (!user.isAdmin) {
      user.licenseQuota -= 1;
      await user.save();
    }
    
    logger.info(`为设备 ${deviceId} 生成授权: ${licenseCode}`);
    
    res.json({
      licenseCode,
      machineCode: license.machineCode,
      expiryDate: license.expiryDate,
      type: license.type,
      features: license.features,
      machineName: license.machineName,
    });
  } catch (error) {
    logger.error('生成授权失败:', error);
    res.status(500).json({ error: '生成授权失败' });
  }
});

/**
 * 验证授权码
 * POST /api/license/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { licenseCode, deviceId } = req.body;
    
    if (!licenseCode) {
      return res.status(400).json({ error: '缺少授权码' });
    }
    
    const license = await License.findOne({ licenseCode, isActive: true });
    
    if (!license) {
      return res.status(404).json({ 
        error: '授权码无效或已失效',
        valid: false,
      });
    }
    
    // 检查设备ID是否匹配
    if (license.deviceId !== deviceId) {
      return res.status(403).json({ 
        error: '授权码与设备不匹配',
        valid: false,
      });
    }
    
    // 检查是否过期
    if (new Date(license.expiryDate) < new Date()) {
      return res.status(403).json({ 
        error: '授权已过期',
        valid: false,
        expiryDate: license.expiryDate,
      });
    }
    
    logger.info(`授权验证成功: ${licenseCode}`);
    
    res.json({
      valid: true,
      type: license.type,
      features: license.features,
      expiryDate: license.expiryDate,
      machineCode: license.machineCode,
    });
  } catch (error) {
    logger.error('验证授权失败:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

/**
 * 检查授权状态
 * GET /api/license/check
 */
router.get('/check', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    if (!deviceId) {
      return res.json({ authorized: false, message: '缺少设备ID' });
    }
    
    const license = await License.findOne({ deviceId, isActive: true });
    
    if (!license) {
      return res.json({ 
        authorized: false, 
        message: '未授权',
        requiresLicense: true,
      });
    }
    
    // 检查是否过期
    const isExpired = new Date(license.expiryDate) < new Date();
    
    if (isExpired) {
      return res.json({ 
        authorized: false, 
        message: '授权已过期',
        expiryDate: license.expiryDate,
      });
    }
    
    res.json({
      authorized: !isExpired,
      type: license.type,
      features: license.features,
      expiryDate: license.expiryDate,
    });
  } catch (error) {
    logger.error('检查授权状态失败:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

/**
 * 获取授权信息
 * GET /api/license/info
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const license = await License.findOne({ deviceId, isActive: true });
    
    if (!license) {
      return res.json({ 
        licensed: false,
        message: '未授权',
        purchaseUrl: 'https://windv.com/pricing',
      });
    }
    
    res.json({
      licensed: true,
      type: license.type,
      features: license.features,
      expiryDate: license.expiryDate,
      machineCode: license.machineCode,
      deviceId: license.deviceId,
      deviceName: license.deviceName,
      createdAt: license.createdAt,
    });
  } catch (error) {
    logger.error('获取授权信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取授权列表
 * GET /api/license/list
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const licenses = await License.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    // 统计各类型授权数量
    const stats = {
      total: licenses.length,
      admin: licenses.filter(l => l.type === 'admin').length,
      standard: licenses.filter(l => l.type === 'standard'). 'trial': licenses.filter(l => l.type === 'trial').length,
    };
    
    res.json({
      licenses,
      stats,
    });
  } catch (error) {
    logger.error('获取授权列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

/**
 * 销定授权到设备
 * POST /api/license/bind
 */
router.post('/bind', authenticate, async (req, res) => {
  try {
    const { licenseCode, deviceId, deviceName } = req.body;
    
    if (!licenseCode || !deviceId) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    // 查找授权码
    const license = await License.findOne({ licenseCode, isActive: true });
    
    if (!license) {
      return res.status(404).json({ error: '授权码无效' });
    }
    
    // 检查是否已绑定
    if (license.deviceId) {
      return res.status(400).json({ error: '该授权码已被其他设备使用' });
    }
    
    // 绑定设备
    license.deviceId = deviceId;
    license.deviceName = deviceName || '未知设备';
    license.boundAt = new Date();
    await license.save();
    
    logger.info(`授权 ${licenseCode} 绑定到设备 ${deviceId}`);
    
    res.json({
      success: true,
      type: license.type,
      features: license.features,
      expiryDate: license.expiryDate,
    });
  } catch (error) {
    logger.error('绑定授权失败:', error);
    res.status(500).json({ error: '绑定失败' });
  }
});

/**
 * 续销授权
 * DELETE /api/license/:id
 */
router.delete('/:id', authenticate, async (req, res) => next) => {
  try {
    const license = await License.findById(req.params.id);
    
    if (!license) {
      return res.status(404).json({ error: '授权不存在' });
    }
    
    // 检查权限
    if (license.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403). json({ error: '无权操作' });
    }
    
    license.isActive = false;
    license.deactivatedAt = new Date();
    await license.save();
    
    logger.info(`授权已注销: ${license.licenseCode}`);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('销毁授权失败:', error);
    res.status(500).json({ error: '销毁失败' });
  }
});

/**
 * 激活试用授权
 * POST /api/license/activate-trial
 */
router.post('/activate-trial', async (req, res) => {
  try {
    const { deviceId, email, phone, deviceName } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '缺少设备ID' });
    }
    
    // 检查是否已有试用授权
    const existingTrial = await License.findOne({ 
      deviceId, 
      isActive: true,
      type: 'trial' 
    });
    
    if (existingTrial) {
      const daysUsed = Math.floor((Date.now() - new Date(existingTrial.createdAt)) / (1000 * 60 * 60 * 24));
      if (daysUsed < 7) { // 7天内不能重复试用
        return res.status(400).json({ 
          error: '已领取过试用授权',
          remainingDays: 7 - daysUsed,
        });
      }
    }
    
    // 生成试用授权
    const licenseCode = await generateLicense({
      deviceId,
      deviceName,
      userId: null, // 试用授权不绑定用户
      type: 'trial',
      expiryDays: 7,
      features: ['basic', 'stats'], // 试用只有基础功能
    });
    
    logger.info(`设备 ${deviceId} 领取试用授权: ${licenseCode}`);
    
    res.json({
      licenseCode,
      machineCode: license.machineCode,
      type: 'trial',
      features: license.features,
      expiryDate: license.expiryDate,
    });
  } catch (error) {
    logger.error('激活试用授权失败:', error);
    res.status(500).json({ error: '激活失败' });
  }
});

/**
 * 续销授权码
 * POST /api/license/revoke
 */
router.post('/revoke', authenticate, async (req, res) => {
  try {
    const { licenseCode } = req.body;
    
    if (!licenseCode) {
      return res.status(400).json({ error: '缺少授权码' });
    }
    
    const license = await License.findOne({ licenseCode, isActive: true });
    
    if (!license) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    // 检查权限（仅管理员或本人）
    if (license.userId?.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403). json({ error: '无权操作' });
    }
    
    license.isActive = false;
    license.deactivatedAt = new Date();
    await license.save();
    
    logger.info(`授权码已撤销: ${licenseCode}`);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('撤销授权失败:', error);
    res.status(500).json({ error: '撤销失败' });
  }
});

module.exports = router;