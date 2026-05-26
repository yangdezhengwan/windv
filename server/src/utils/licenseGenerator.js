const crypto = require('crypto');

/**
 * 生成授权码
 */
function generateLicense(options) {
  const {
    deviceId,
    deviceName = '',
    userId,
    type = 'standard',
    expiryDays = 365,
    features = ['basic', 'sync', 'stats'],
  } = options;

  // 生成授权码 (16位: 8字符-4字符-4字符)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  let licenseCode = '';
  
  // 前缀标识
  const prefix = type === 'admin' ? 'ADM' : type === 'trial' ? 'TRL' : 'STD';
  licenseCode += prefix;
  
  // 随机码 (8位)
  licenseCode += Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
  // 时间戳后缀 (8位)
  const timestamp = Math.floor(Date.now() / 1000).toString(16).toUpperCase();
  licenseCode += timestamp.padEnd(8, '0');
  
  // 校验位
  const dataStr = `${deviceId}|${userId || 'null'}|${type}|${expiryDays}`;
  const hash = crypto.createHash('md5').update(dataStr).digest('hex').toUpperCase();
  licenseCode += hash.slice(0, 4);
  
  // 计算到期日
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  // 生成机器码
  const machineCode = generateMachineCode();
  
  return {
    licenseCode,
    machineCode,
    expiryDate,
    deviceId,
    deviceName,
    userId,
    type,
    features,
  };
}

/**
 * 生成机器码
 */
function generateMachineCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  let result = '';
  
  // 前8位设备标识（可修改为设备序列号等）
  const devicePrefix = 'WINDV2024'; 
  
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return result + devicePrefix;
}

/**
 * 验证授权码格式
 */
function validateLicenseFormat(licenseCode) {
  if (!licenseCode || typeof licenseCode !== 'string') {
    return { valid: false, error: '无效的授权码' };
  }
  
  // 检查长度 (24位: 3前缀 + 8随机 + 8时间戳 + 4校验)
  if (licenseCode.length !== 24) {
    return { valid: false, error: '授权码长度错误' };
  }
  
  // 检查前缀
  const prefixes = ['ADM', 'STD', 'TRL'];
  const prefix = licenseCode.slice(0, 3);
  if (!prefixes.includes(prefix)) {
    return { valid: false, error: '授权码前缀错误' };
  }
  
  // 检查校验位
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  for (let i = 20; i < 24; i++) {
    if (!chars.includes(licenseCode[i]) && licenseCode[i] !== '-') {
      return { valid: false, error: '授权码包含非法字符' };
    }
  }
  
  return { valid: true };
}

/**
 * 计算授权定价（分钟）
 */
function calculatePricing(type, features, days) {
  const rates = {
    admin: {
      base: 0.5, // 元/分钟
      featureMultiplier: 2, // 功能倍数
    },
    standard: {
      base: 0.2,
      featureMultiplier: 1.5,
    },
    trial: {
      base: 0,
      featureMultiplier: 1,
    },
  };
  
  const pricing = rates[type] || rates.standard;
  const minutes = days * 24 * 60;
  
  // 基础价
  let price = pricing.base * minutes;
  
  // 功能加价
  const featureMultiplier = pricing.featureMultiplier;
  const featureRates = {
    all: 3,
    basic: 1,
    sync: 1.5,
    stats: 1.5,
    cloud_backup: 2,
    ai_llm: 2.5,
    local_model: 2,
    risk_control: 1.2,
    advanced_stats: 2,
  };
  
  if (features && Array.isArray(features)) {
    features.forEach(f => {
      if (f !== 'all') {
        const rate = featureRates[f] || 1;
        price = price * rate;
      }
    });
  }
  
  return {
    total: price.toFixed(2),
    perMonth: (price / 12).toFixed(2),
    perYear: price.toFixed(2),
  };
}

module.exports = {
  generateLicense,
  generateMachineCode,
  validateLicenseFormat,
  calculatePricing,
};