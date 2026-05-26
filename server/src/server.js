// 加载环境变量
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// 路由
const authRoutes = require('./routes/auth');
const scriptRoutes = require('./routes/scripts');
const syncRoutes = require('./routes/sync');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

// 中间件
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:"],
    },
  },
}));

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 文件上传
const upload = require('multer')({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个 IP 15 分钟最多 100 个请求
  message: '请求过于频繁，请稍后再试',
});

app.use('/api/', limiter);

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/scripts', authenticate, scriptRoutes);
app.use('/api/sync', authenticate, syncRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/settings', authenticate, settingsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// 静态文件（管理后台）
const adminDistPath = path.join(__dirname, '../admin/dist');
if (fs.existsSync(adminDistPath)) {
  app.use(express.static(adminDistPath));
} else {
  logger.warn('管理后台前端未构建，请先运行: cd admin && npm run build');
}

// SPA 路由支持（所有未匹配的 API 返回 404，页面路由返回 index.html）
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API 路由不存在' });
  } else {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '资源不存在' });
});

// 全局错误处理
app.use(errorHandler);

// 创建 HTTP 服务器
const server = http.createServer(app);

const PORT_NUMBER = parseInt(PORT, 10);

server.listen(PORT_NUMBER, '0.0.0.0', () => {
  logger.info(`🚀 服务器启动成功`);
  logger.info(`📊 监听端口: ${PORT_NUMBER}`);
  logger.info(`🔗 访问地址: http://localhost:${PORT_NUMBER}`);
  logger.info(`🌐 管理后台: http://localhost:${PORT_NUMBER}`);
  logger.info(`📡 API 基础地址: http://localhost:${PORT_NUMBER}/api`);
  
  // PM2 集成
  if (process.env.NODE_ENV === 'production') {
    require('@pm2/io').push({
      name: 'windv-server',
      script: './src/server.js',
    });
    
    logger.info('PM2 模式启动');
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;