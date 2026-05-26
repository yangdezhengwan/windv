const fs = require('fs');
const { createCanvas } = require('canvas');

// 尝试使用 canvas
try {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#409EFF');
  gradient.addColorStop(1, '#67C23A');
  
  // 圆角矩形背景
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(20, 20, 216, 216, 30);
  ctx.fill();
  
  // 绘制电视图标
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📺', 128, 128);
  
  // 保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('resources/icon.png', buffer);
  console.log('Icon created with canvas');
} catch (e) {
  console.log('Canvas not available, creating placeholder');
  // 创建一个简单的 PNG 头
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, // 256x256
    0x08, 0x02, 0x00, 0x00, 0x00, 0xD3, 0x10, 0x3F, 0x31,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,
    0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D,
    0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync('resources/icon.png', header);
}
