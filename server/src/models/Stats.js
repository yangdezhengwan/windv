const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) },
  danmakuCount: { type: Number, default: 0 },
  responseCount: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  highFreqQuestions: [{
    keyword: String,
    count: Number,
    lastSeen: Date,
  }],
  platformStats: {
    taobao: { danmaku: { type: Number, default: 0 }, responses: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    douyin: { danmaku: { type: Number, default: 0 }, responses: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    pinduoduo: { danmaku: { type: Number, default: 0 }, responses: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    video: { danmaku: { type: Number, default: 0 }, responses: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
  },
  hourlyDistribution: [{ hour: Number, count: Number }],
}, { timestamps: true });

// 复合索引
statsSchema.index({ userId: 1, date: 1 }, { unique: true });

const Stats = mongoose.model('Stats', statsSchema);

module.exports = { Stats };