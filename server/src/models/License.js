/**
 * 软件授权模型
 */

const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  // 授权码信息
  licenseCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // 机器码（用于验证）
  machineCode: {
    type: String,
    required: false,
  },
  
  // 设备信息
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  deviceName: {
    type: String,
    default: '',
  },
  
  // 关联用户（授权给谁）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  
  // 授权类型
  type: {
    type: String,
    enum: ['admin', 'standard', 'trial'],
    default: 'standard',
  },
  
  // 授权功能
  features: [{
    type: String,
    enum: ['all', 'basic', 'sync', 'stats', 'cloud_backup', 'ai_llm', 'local_model', 'risk_control', 'advanced_stats'],
  }],
  
  // 有效期
  expiryDate: {
    type: Date,
    required: true,
    index: true,
  },
  
  // 绑定时间
  boundAt: {
    type: Date,
  },
  
  // 授权状态
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  
  // 销毁时间
  deactivatedAt: {
    type: Date,
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

licenseSchema.index({ userId: 1, isActive: 1 });
licenseSchema.index({ deviceId: 1, isActive: 1 });

licenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('License', licenseSchema);