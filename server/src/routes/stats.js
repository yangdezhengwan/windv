const express = require('express');
const router = express.Router();
const { Stats } = require('../models/Stats');
const { User } = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * 获取统计数据概览
 * GET /api/stats/overview
 */
router.get('/overview', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await Stats.findOne({ 
      userId, 
      date: { $gte: today } 
    });
    
    // 获取用户总数
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // 获取本月统计
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthStats = await Stats.aggregate([
      { $match: { userId, date: { $gte: monthStart } } },
      { $group: {
        _id: null,
        totalDanmaku: { $sum: '$danmakuCount' },
        totalResponses: { $sum: '$responseCount' },
        totalOrders: { $sum: '$orderCount' },
      }}
    ]);
    
    res.json({
      today: {
        danmaku: todayStats?.danmakuCount || 0,
        responses: todayStats?.responseCount || 0,
        orders: todayStats?.orderCount || 0,
        revenue: todayStats?.revenue || 0,
      },
      month: monthStats[0] || { totalDanmaku: 0, totalResponses: 0, totalOrders: 0 },
      users: { total: totalUsers, active: activeUsers },
    });
  } catch (error) {
    logger.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取趋势数据
 * GET /api/stats/trend
 */
router.get('/trend', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const stats = await Stats.find({
      userId: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });
    
    res.json({ stats });
  } catch (error) {
    logger.error('获取趋势数据失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取高频问题统计
 * GET /api/stats/high-freq
 */
router.get('/high-freq', authenticate, async (req, res) => {
  try {
    const stats = await Stats.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    const highFreqQuestions = stats?.highFreqQuestions || [];
    
    res.json({ 
      questions: highFreqQuestions.slice(0, 20) 
    });
  } catch (error) {
    logger.error('获取高频问题失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 获取时段分布
 * GET /api/stats/time-distribution
 */
router.get('/time-distribution', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const stats = await Stats.aggregate([
      { $match: { userId: req.user.id, createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: '$danmakuCount' },
      }},
      { $sort: { _id: 1 } },
    ]);
    
    // 格式化数据
    const distribution = Array.from({ length: 24 }, (_, i) => {
      const found = stats.find(s => s._id === i);
      return { hour: i, count: found?.count || 0 };
    });
    
    res.json({ distribution });
  } catch (error) {
    logger.error('获取时段分布失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;