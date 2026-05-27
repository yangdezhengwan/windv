/**
 * 软件授权相关路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User } = require('../models/User');
const { License } = require('../models/License');
const { logger } = require('../utils/logger');
const { generateLicense } = require('../utils/licenseGenerator');

/**
 * 生成授权码 (管理员)
 * POST /api/license/generate
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { deviceId, deviceName, type = 'standard', expiryDays = 365, features = ['basic'] } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '缺少设备ID' });
    }
    
    // 检查是否已存在有效授权
    const existingLicense = await License.findOne({ deviceId, isActive: true });
    if (existingLicense) {
      return res.status(400).json({ 
        error: '该设备已有有效授权',
        existingLicense: {
          licenseCode: existingLicense.licenseCode,
          expiryDate: existingLicense.expiryDate,
          type: existingLicense.type,
        }
      });
    }
    
    // 生成新授权
    const licenseCode = generateLicense({
      deviceId,
      deviceName: deviceName || '未命名设备',
      type,
      expiryDays: parseInt(expiryDays),
      features: Array.isArray(features) ? features : ['basic'],
    });
    
    // 保存到数据库
    const license = new License({
      licenseCode,
      deviceId,
      deviceName: deviceName || '未命名设备',
      type,
      features: Array.isArray(features) ? features : ['basic'],
      expiryDate: new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: req.user.id,
    });
    
    await license.save();
    
    logger.info(`管理员生成授权: ${licenseCode} for ${deviceId}`);
    
    res.json({
      success: true,
      license: {
        licenseCode,
        deviceId,
        deviceName: license.deviceName,
        type,
        features: license.features,
        expiryDate: license.expiryDate,
        createdAt: license.createdAt,
      }
    });
  } catch (error) {
    logger.error('生成授权失败:', error);
    res.status(500).json({ error: '生成授权失败: ' + error.message });
  }
});

/**
 * 验证授权码 (客户端使用)
 * POST /api/license/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { licenseCode, deviceId } = req.body;
    
    if (!licenseCode) {
      return res.status(400).json({ error: '缺少授权码' });
    }
    
    const license = await License.findOne({ licenseCode });
    
    if (!license) {
      return res.status(404).json({ 
        valid: false,
        error: '授权码不存在' 
      });
    }
    
    // 检查是否已激活
    if (!license.isActive) {
      return res.status(403).json({ 
        valid: false,
        error: '授权码已失效' 
      });
    }
    
    // 检查是否过期
    if (new Date(license.expiryDate) < new Date()) {
      return res.status(403).json({ 
        valid: false,
        error: '授权已过期',
        expiryDate: license.expiryDate,
      });
    }
    
    // 如果提供了 deviceId，检查是否匹配
    if (deviceId && license.deviceId && license.deviceId !== deviceId) {
      return res.status(403).json({ 
        valid: false,
        error: '授权码与设备不匹配' 
      });
    }
    
    // 首次激活，绑定设备
    if (!license.deviceId && deviceId) {
      license.deviceId = deviceId;
      license.activatedAt = new Date();
      await license.save();
      logger.info(`授权首次激活: ${licenseCode} 绑定设备 ${deviceId}`);
    }
    
    res.json({
      valid: true,
      license: {
        licenseCode: license.licenseCode,
        type: license.type,
        features: license.features,
        expiryDate: license.expiryDate,
        deviceId: license.deviceId,
        deviceName: license.deviceName,
      }
    });
  } catch (error) {
    logger.error('验证授权失败:', error);
    res.status(500).json({ error: '验证失败: ' + error.message });
  }
});

/**
 * 获取授权列表 (管理员)
 * GET /api/license/list
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { page = 1, limit = 20, type, isActive, keyword } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (keyword) {
      query.$or = [
        { licenseCode: { $regex: keyword, $options: 'i' } },
        { deviceId: { $regex: keyword, $options: 'i' } },
        { deviceName: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    const licenses = await License.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await License.countDocuments(query);
    
    // 统计
    const stats = {
      total: await License.countDocuments(),
      active: await License.countDocuments({ isActive: true }),
      expired: await License.countDocuments({ 
        isActive: true, 
        expiryDate: { $lt: new Date() } 
      }),
      byType: {
        admin: await License.countDocuments({ type: 'admin' }),
        standard: await License.countDocuments({ type: 'standard' }),
        trial: await License.countDocuments({ type: 'trial' }),
      }
    };
    
    res.json({
      licenses,
      stats,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    logger.error('获取授权列表失败:', error);
    res.status(500).json({ error: '获取列表失败: ' + error.message });
  }
});

/**
 * 获取当前用户授权
 * GET /api/license/my
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const query = { createdBy: req.user.id, isActive: true };
    if (deviceId) query.deviceId = deviceId;
    
    const licenses = await License.find(query).sort({ createdAt: -1 });
    
    res.json({ licenses });
  } catch (error) {
    logger.error('获取用户授权失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 撤销授权 (管理员)
 * DELETE /api/license/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ error: '授权不存在' });
    }
    
    license.isActive = false;
    license.deactivatedAt = new Date();
    await license.save();
    
    logger.info(`授权已撤销: ${license.licenseCode}`);
    
    res.json({ success: true, message: '授权已撤销' });
  } catch (error) {
    logger.error('撤销授权失败:', error);
    res.status(500).json({ error: '撤销失败: ' + error.message });
  }
});

/**
 * 延长授权有效期 (管理员)
 * POST /api/license/:id/extend
 */
router.post('/:id/extend', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { days = 365 } = req.body;
    
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ error: '授权不存在' });
    }
    
    // 在原有有效期基础上延长
    const currentExpiry = new Date(license.expiryDate);
    const newExpiry = new Date(currentExpiry.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
    license.expiryDate = newExpiry;
    await license.save();
    
    logger.info(`授权已延长: ${license.licenseCode} 至 ${newExpiry}`);
    
    res.json({
      success: true,
      license: {
        licenseCode: license.licenseCode,
        expiryDate: license.expiryDate,
      }
    });
  } catch (error) {
    logger.error('延长授权失败:', error);
    res.status(500).json({ error: '延长失败: ' + error.message });
  }
});

/**
 * 激活试用授权
 * POST /api/license/trial
 */
router.post('/trial', async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: '缺少设备ID' });
    }
    
    // 检查是否已有授权
    const existingLicense = await License.findOne({ deviceId, isActive: true });
    if (existingLicense) {
      return res.status(400).json({ 
        error: '该设备已有授权',
        license: {
          type: existingLicense.type,
          expiryDate: existingLicense.expiryDate,
        }
      });
    }
    
    // 检查是否有过试用记录
    const trialHistory = await License.findOne({ deviceId, type: 'trial' });
    if (trialHistory) {
      return res.status(400).json({ 
        error: '该设备已使用过试用授权' 
      });
    }
    
    // 生成试用授权（7天）
    const licenseCode = generateLicense({
      deviceId,
      deviceName: deviceName || '试用设备',
      type: 'trial',
      expiryDays: 7,
      features: ['basic', 'stats'],
    });
    
    const license = new License({
      licenseCode,
      deviceId,
      deviceName: deviceName || '试用设备',
      type: 'trial',
      features: ['basic', 'stats'],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      activatedAt: new Date(),
    });
    
    await license.save();
    
    logger.info(`试用授权已激活: ${licenseCode} for ${deviceId}`);
    
    res.json({
      success: true,
      license: {
        licenseCode,
        type: 'trial',
        features: ['basic', 'stats'],
        expiryDate: license.expiryDate,
        daysLeft: 7,
      }
    });
  } catch (error) {
    logger.error('激活试用授权失败:', error);
    res.status(500).json({ error: '激活失败: ' + error.message });
  }
});

/**
 * 检查设备授权状态
 * GET /api/license/check/:deviceId
 */
router.get('/check/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const license = await License.findOne({ deviceId, isActive: true });
    
    if (!license) {
      return res.json({
        licensed: false,
        canTrial: !(await License.exists({ deviceId, type: 'trial' })),
      });
    }
    
    const isExpired = new Date(license.expiryDate) < new Date();
    const daysLeft = Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    res.json({
      licensed: !isExpired,
      isExpired,
      daysLeft: isExpired ? 0 : daysLeft,
      license: {
        type: license.type,
        features: license.features,
        expiryDate: license.expiryDate,
      }
    });
  } catch (error) {
    logger.error('检查授权状态失败:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

module.exports = router;