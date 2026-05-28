/**
 * License Type Model - 自定义授权类型
 */

const mongoose = require('mongoose');

const licenseTypeSchema = new mongoose.Schema({
  // 类型标识（唯一）
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  // 类型名称（显示用）
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // 描述
  description: {
    type: String,
    default: '',
  },
  // 默认有效期（天）
  defaultExpiryDays: {
    type: Number,
    default: 365,
  },
  // 功能列表
  features: [{
    type: String,
  }],
  // 排序权重
  sortOrder: {
    type: Number,
    default: 0,
  },
  // 是否启用
  isActive: {
    type: Boolean,
    default: true,
  },
  // 是否为系统内置（不可删除）
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// 索引
licenseTypeSchema.index({ code: 1 }, { unique: true });
licenseTypeSchema.index({ sortOrder: 1 });

// 静态方法：获取所有激活的类型
licenseTypeSchema.statics.getActiveTypes = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
};

// 静态方法：初始化默认类型
licenseTypeSchema.statics.initDefaults = async function() {
  const defaults = [
    { code: 'admin', name: '管理员', description: '管理员权限，无限制', defaultExpiryDays: 3650, features: ['all'], sortOrder: 1, isSystem: true },
    { code: 'standard', name: '标准版', description: '标准功能授权', defaultExpiryDays: 365, features: ['basic', 'advanced'], sortOrder: 2, isSystem: true },
    { code: 'trial', name: '试用版', description: '试用授权，限制功能', defaultExpiryDays: 7, features: ['basic'], sortOrder: 3, isSystem: true },
  ];

  for (const type of defaults) {
    await this.findOneAndUpdate(
      { code: type.code },
      type,
      { upsert: true, new: true }
    );
  }
  console.log('[LicenseType] Default types initialized');
};

module.exports = mongoose.model('LicenseType', licenseTypeSchema);
