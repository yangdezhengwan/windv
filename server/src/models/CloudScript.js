const mongoose = require('mongoose');

/**
 * 云端话术配置
 */
const cloudScriptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  categoryId: String, // 全局分类ID
  roomId: String, // 关联的直播间ID（可选）

  keywords: [String],
  responses: [String],
  intentType: {
    type: String,
    enum: ['chat', 'price', 'logistics', 'aftersale', 'size', 'discount', 'ad'],
  },
  priority: {
    type: Number,
    default: 0,
  },
  aiEnabled: {
    type: Boolean,
    default: false,
  },
  randomEnabled: {
    type: Boolean,
    default: true,
  },
  matchMode: {
    type: String,
    enum: ['keyword', 'fuzzy'],
    default: 'keyword',
  },
  remark: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  roomId: String, // 房间级话术

  // 云端统计
  hitCount: {
    type: Number,
    default: 0,
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

cloudScriptSchema.index({ userId: 1, roomId: 1, intentType: 1 });
cloudScriptSchema.index({ userId: 1, categoryId: 1 });

cloudScriptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CloudScript', cloudScriptSchema);