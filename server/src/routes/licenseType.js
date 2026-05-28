/**
 * License Type API Routes - 授权类型管理
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Dynamic model loader
function getLicenseTypeModel() {
  return require('../models/LicenseType');
}

// Error logging
function logError(msg, err) {
  console.error('[LicenseType Error]', msg, err ? (err.message || String(err)) : 'unknown');
}

/**
 * 初始化默认授权类型
 * POST /api/license-type/init
 */
router.post('/init', async (req, res) => {
  try {
    const LicenseType = getLicenseTypeModel();
    await LicenseType.initDefaults();
    res.json({ success: true, message: 'Default types initialized' });
  } catch (error) {
    logError('Init defaults failed', error);
    res.status(500).json({ error: 'Failed to initialize defaults' });
  }
});

/**
 * 获取所有授权类型
 * GET /api/license-type/list
 */
router.get('/list', async (req, res) => {
  try {
    const LicenseType = getLicenseTypeModel();
    const types = await LicenseType.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ types });
  } catch (error) {
    logError('Get types failed', error);
    res.status(500).json({ error: 'Failed to get types' });
  }
});

/**
 * 获取激活的授权类型（下拉选择用）
 * GET /api/license-type/active
 */
router.get('/active', async (req, res) => {
  try {
    const LicenseType = getLicenseTypeModel();
    const types = await LicenseType.getActiveTypes();
    res.json({ types });
  } catch (error) {
    logError('Get active types failed', error);
    res.status(500).json({ error: 'Failed to get active types' });
  }
});

/**
 * 获取单个授权类型
 * GET /api/license-type/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const LicenseType = getLicenseTypeModel();
    const type = await LicenseType.findById(req.params.id);
    
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    res.json({ type });
  } catch (error) {
    logError('Get type failed', error);
    res.status(500).json({ error: 'Failed to get type' });
  }
});

/**
 * 创建授权类型
 * POST /api/license-type
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { code, name, description, defaultExpiryDays, features, sortOrder } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // 验证 code 格式（小写字母、数字、连字符）
    if (!/^[a-z0-9-]+$/.test(code)) {
      return res.status(400).json({ error: 'Code can only contain lowercase letters, numbers, and hyphens' });
    }
    
    const LicenseType = getLicenseTypeModel();
    
    // 检查是否已存在
    const existing = await LicenseType.findOne({ code: code.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Type code already exists' });
    }
    
    const type = new LicenseType({
      code: code.toLowerCase(),
      name,
      description: description || '',
      defaultExpiryDays: defaultExpiryDays || 365,
      features: Array.isArray(features) ? features : [],
      sortOrder: sortOrder || 0,
      isActive: true,
      isSystem: false,
    });
    
    await type.save();
    console.log('[LicenseType] Created:', code, name);
    
    res.json({ success: true, type });
  } catch (error) {
    logError('Create type failed', error);
    res.status(500).json({ error: 'Failed to create type' });
  }
});

/**
 * 更新授权类型
 * PUT /api/license-type/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const LicenseType = getLicenseTypeModel();
    const type = await LicenseType.findById(req.params.id);
    
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    // 系统内置类型不允许修改 code
    if (type.isSystem && req.body.code && req.body.code !== type.code) {
      return res.status(400).json({ error: 'Cannot change code of system type' });
    }
    
    const { name, description, defaultExpiryDays, features, sortOrder, isActive } = req.body;
    
    if (name) type.name = name;
    if (description !== undefined) type.description = description;
    if (defaultExpiryDays) type.defaultExpiryDays = defaultExpiryDays;
    if (Array.isArray(features)) type.features = features;
    if (sortOrder !== undefined) type.sortOrder = sortOrder;
    if (isActive !== undefined) type.isActive = isActive;
    
    await type.save();
    console.log('[LicenseType] Updated:', type.code);
    
    res.json({ success: true, type });
  } catch (error) {
    logError('Update type failed', error);
    res.status(500).json({ error: 'Failed to update type' });
  }
});

/**
 * 删除授权类型
 * DELETE /api/license-type/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const LicenseType = getLicenseTypeModel();
    const type = await LicenseType.findById(req.params.id);
    
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    if (type.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system type' });
    }
    
    await LicenseType.findByIdAndDelete(req.params.id);
    console.log('[LicenseType] Deleted:', type.code);
    
    res.json({ success: true, message: 'Type deleted' });
  } catch (error) {
    logError('Delete type failed', error);
    res.status(500).json({ error: 'Failed to delete type' });
  }
});

module.exports = router;
