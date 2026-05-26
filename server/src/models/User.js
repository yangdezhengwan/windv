const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: '',
  },
  deviceId: [{
    type: String,
  }], // 绑定的设备ID
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginIp: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
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

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 虚拟字段：移除敏感信息
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);