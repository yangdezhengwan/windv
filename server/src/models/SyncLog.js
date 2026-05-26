const mongoose = require('mongoose');

/**
 * 同步日志模型 - 记录客户端与云端的同步操作
 */
const syncLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clientId: {
    type: String,
    required: true,
    index: true,
  }, // 客户端设备ID
  deviceId: {
    type: String,
    index: true,
  }, // 设备标识
  clientId: {
    type: String,
    index: true,
  }, // 客户端唯一标识

  // 同步类型
  syncType: {
    type: String,
    enum: ['script', 'category', 'settings', 'stats', 'full'], // full=全量同步
    required: true,
    index: true,
  },

  // 同步方向
  direction: {
    type: String,
    enum: ['upload', 'download'],
    required: true,
  },

  // 同步数据
  data: {
    type: mongoose.Schema.Types.Mixed,
  },

  // 同步状态
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending',
  },

  // 错误信息
  error: {
    type: String,
  },

  // 版本号（用于冲突检测）
  version: {
    type: Number,
    default: 1,
  },

  // 同步时间戳
  syncedAt: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

syncLogSchema.index({ userId: 1, syncType: 1, direction: 1, status: 1 });
syncLogSchema.index({ clientId: 1, syncType: 1, direction: 1, syncedAt: -1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);