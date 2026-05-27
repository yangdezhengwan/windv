const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Script, Category } = require('../models/Script');
const { logger } = require('../utils/logger');

/**
 * 获取话术分类
 * GET /api/scripts/categories
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id }).sort({ order: 1, createdAt: -1 });
    res.json({ categories });
  } catch (error) {
    logger.error('获取分类失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 创建分类
 * POST /api/scripts/categories
 */
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, color, order } = req.body;
    
    const category = new Category({
      userId: req.user.id,
      name,
      color: color || '#00d4ff',
      order: order || 0,
    });
    
    await category.save();
    res.status(201).json({ category });
  } catch (error) {
    logger.error('创建分类失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * 获取话术列表
 * GET /api/scripts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { categoryId, keyword, page = 1, limit = 50 } = req.query;
    
    const query = { userId: req.user.id };
    if (categoryId) query.categoryId = categoryId;
    if (keyword) {
      query.$or = [
        { keywords: { $regex: keyword, $options: 'i' } },
        { responses: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    const scripts = await Script.find(query)
      .populate('categoryId', 'name color')
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Script.countDocuments(query);
    
    res.json({
      scripts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    logger.error('获取话术列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 创建话术
 * POST /api/scripts
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { categoryId, keywords, responses, intentType, priority, aiEnabled, randomEnabled, matchMode, remark } = req.body;
    
    const script = new Script({
      userId: req.user.id,
      categoryId,
      keywords,
      responses,
      intentType: intentType || 'keyword',
      priority: priority || 0,
      aiEnabled: aiEnabled || false,
      randomEnabled: randomEnabled !== false,
      matchMode: matchMode || 'keyword',
      remark: remark || '',
      isActive: true,
    });
    
    await script.save();
    logger.info(`创建话术: ${script._id}`);
    
    res.status(201).json({ script });
  } catch (error) {
    logger.error('创建话术失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * 更新话术
 * PUT /api/scripts/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const script = await Script.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    
    if (!script) {
      return res.status(404).json({ error: '话术不存在' });
    }
    
    res.json({ script });
  } catch (error) {
    logger.error('更新话术失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 删除话术
 * DELETE /api/scripts/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const script = await Script.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!script) {
      return res.status(404).json({ error: '话术不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error('删除话术失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * 批量导入话术
 * POST /api/scripts/import
 */
router.post('/import', authenticate, async (req, res) => {
  try {
    const { scripts } = req.body;
    
    if (!scripts || !Array.isArray(scripts)) {
      return res.status(400).json({ error: '无效的话术数据' });
    }
    
    const imported = [];
    for (const s of scripts) {
      const script = new Script({
        userId: req.user.id,
        ...s,
      });
      await script.save();
      imported.push(script);
    }
    
    logger.info(`批量导入话术: ${imported.length} 条`);
    
    res.json({ 
      message: `成功导入 ${imported.length} 条话术`,
      count: imported.length 
    });
  } catch (error) {
    logger.error('导入话术失败:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

module.exports = router;