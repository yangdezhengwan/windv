const mongoose = require('mongoose');
const logger = require('../utils/logger');

// 数据库连接
const connectDB = async () => {
  try {
    const mongoURI = process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/windv';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('✅ MongoDB 连接成功');
    logger.info(`📊 数据库: ${mongoURI}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB 连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 连接断开');
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };