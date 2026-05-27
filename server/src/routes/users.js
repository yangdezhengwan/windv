const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * 获取用户列表 (仅管理员)
 * GET /api/users
 */
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { page = 1, limit = 20, role, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取指定用户
 * GET /api/users/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 非管理员只能查看自己
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    res.json({ user });
  } catch (error) {
    logger.error('获取用户失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 更新用户
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    // 非管理员只能更新自己
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    const allowedFields = req.user.role === 'admin' 
      ? ['username', 'email', 'role', 'isActive']
      : ['username', 'email'];
    
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    logger.info(`更新用户: ${user.username}`);
    
    res.json({ user });
  } catch (error) {
    logger.error('更新用户失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 删除用户 (仅管理员)
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: '不能删除自己' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    logger.info(`删除用户: ${user.username}`);
    
    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error('删除用户失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * 重置用户密码 (仅管理员)
 * POST /api/users/:id/reset-password
 */
router.post('/:id/reset-password', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { newPassword } = req.body;
    const password = newPassword || 'WindV@123456';
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    user.password = password;
    await user.save();
    
    logger.info(`重置用户密码: ${user.username}`);
    
    res.json({ message: '密码已重置', password });
  } catch (error) {
    logger.error('重置密码失败:', error);
    res.status(500).json({ error: '重置失败' });
  }
});

module.exports = router;