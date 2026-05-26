/**
 * 话术同步路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { CloudScript } = require('../models/CloudScript');
const { SyncLog } = require('../models/SyncLog');
const { logger } = require('../utils/logger');

/**
 * 获取云端话术列表
 * GET /api/sync/scripts
 */
router.get('/scripts', authenticate, async (req, res) => {
  try {
    const { roomId, categoryId } = req.query;
    
    const query = { userId: req.user.id };
    if (roomId) query.roomId = roomId;
    if (categoryId) query.categoryId = categoryId;
    
    const scripts = await CloudScript.find(query).sort({ priority: -1, createdAt: -1 });
    
    // 记录同步日志
    await SyncLog.create({
      userId: req.user.id,
      clientId: req.body.clientId || 'web',
      syncType: 'script',
      direction: 'download',
      status: 'success',
      syncedAt: new Date(),
    });
    
    res.json({
      success: true,
      count: scripts.length,
      scripts,
    });
  } catch (error) {
    logger.error('获取云端话术失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 上传话术到云端
 * POST /api/sync/scripts
 */
router.post('/scripts', authenticate, async (req, res) => {
  try {
    const { scripts, clientId } = req.body;
    
    if (!scripts || !Array.isArray(scripts)) {
      return res.status(400).json({ error: '无效的话术数据' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
    };
    
    for (const script of scripts) {
      try {
        const existScript = await CloudScript.findOne({
          userId: req.user.id,
          _id: script._id,
        });
        
        if (existScript) {
          // 更新
          Object.assign(existScript, {
            keywords: script.keywords,
            responses: script.responses,
            intentType: script.intentType,
            priority: script.priority,
            aiEnabled: script.aiEnabled,
            randomEnabled: script.randomEnabled,
            matchMode: script.matchMode,
            remark: script.remark,
            isActive: script.isActive,
          });
          await existScript.save();
          results.updated++;
        } else {
          // 创建
          await CloudScript.create({
            userId: req.user.id,
            categoryId: script.categoryId,
            roomId: script.roomId,
            keywords: script.keywords,
            responses: script.responses,
            intentType: script.intentType,
            priority: script.priority || 0,
            aiEnabled: script.aiEnabled || false,
            randomEnabled: script.randomEnabled !== false,
            matchMode: script.matchMode || 'keyword',
            remark: script.remark || '',
            isActive: script.isActive !== false,
          });
          results.created++;
        }
      } catch (e) {
        logger.error('同步话术失败:', e);
        results.failed++;
      }
    }
    
    // 记录同步日志
    await SyncLog.create({
      userId: req.user.id,
      clientId: clientId || 'unknown',
      syncType: 'script',
      direction: 'upload',
      data: { count: scripts.length },
      status: 'success',
      syncedAt: new Date(),
    });
    
    logger.info(`用户 ${req.user.id} 同步话术: ${results.created} 创建, ${results.updated} 更新`);
    
    res.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('上传话术失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 删除云端话术
 * DELETE /api/sync/scripts/:id
 */
router.delete('/scripts/:id', authenticate, async (req, res) => {
  try {
    const script = await CloudScript.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    
    if (!script) {
      return res.status(404).json({ error: '话术不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('删除话术失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * 全量同步（获取所有数据）
 * GET /api/sync/full
 */
router.get('/full', authenticate, async (req, res) => {
  try {
    const { clientId } = req.query;
    
    // 获取所有话术
    const scripts = await CloudScript.find({ 
      userId: req.user.id,
      isActive: true,
    });
    
    // 获取同步记录
    const syncLogs = await SyncLog.find({ userId: req.user.id })
      .sort({ syncedAt: -1 })
      .limit(50);
    
    // 记录同步日志
    await SyncLog.create({
      userId: req.user.id,
      clientId: clientId || 'web',
      syncType: 'full',
      direction: 'download',
      status: 'success',
      syncedAt: new Date(),
    });
    
    res.json({
      success: true,
      data: {
        scripts,
        lastSync: syncLogs[0]?.syncedAt,
      },
    });
  } catch (error) {
    logger.error('全量同步失败:', error);
    res.status(500).json({ error: '同步失败' });
  }
});

/**
 * 获取同步状态
 * GET /api/sync/status
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const { clientId } = req.query;
    
    // 获取最后的同步记录
    const lastSync = await SyncLog.findOne({
      userId: req.user.id,
      clientId: clientId || 'unknown',
    }).sort({ syncedAt: -1 });
    
    // 统计同步数据
    const stats = {
      totalScripts: await CloudScript.countDocuments({ 
        userId: req.user.id,
        isActive: true,
      }),
      lastSyncAt: lastSync?.syncedAt,
      lastSyncStatus: lastSync?.status,
    };
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('获取同步状态失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;