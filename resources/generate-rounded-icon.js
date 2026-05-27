const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

/**
 * 创建圆角矩形遮罩
 */
function createRoundedRectMask(size, radius) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * 创建圆形遮罩（用于圆形图标）
 */
function createCircleMask(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
    </svg>
  `;
  return Buffer.from(svg);
}

async function generateRoundedIcons() {
  const logoPath = path.join(__dirname, 'logo.png');
  const outputDir = __dirname;
  
  console.log('开始生成圆角图标...');
  
  // 读取原始 logo
  const logo = await sharp(logoPath)
    .resize(1024, 1024)
    .png()
    .toBuffer();
  
  // 为每个尺寸生成圆角图标
  for (const size of sizes) {
    // 圆角半径 (iOS 标准: 22%)
    const radius = Math.round(size * 0.22);
    const mask = createRoundedRectMask(size, radius);
    
    await sharp(logo)
      .resize(size, size)
      .png()
      .toBuffer()
      .then(async (resized) => {
        await sharp(resized)
          .composite([{
            input: mask,
            blend: 'dest-in'
          }])
          .png()
          .toFile(path.join(outputDir, `rounded-${size}x${size}.png`));
        console.log(`Generated rounded-${size}x${size}.png`);
      });
  }
  
  // 生成主图标 (512x512)
  const mainSize = 512;
  const mainRadius = Math.round(mainSize * 0.22);
  const mainMask = createRoundedRectMask(mainSize, mainRadius);
  
  await sharp(logo)
    .resize(mainSize, mainSize)
    .png()
    .toBuffer()
    .then(async (resized) => {
      await sharp(resized)
        .composite([{
          input: mainMask,
          blend: 'dest-in'
        }])
        .png()
        .toFile(path.join(outputDir, 'icon-rounded.png'));
      console.log('Generated icon-rounded.png');
    });
  
  // 生成圆形图标
  for (const size of [256, 512]) {
    const circleMask = createCircleMask(size);
    
    await sharp(logo)
      .resize(size, size)
      .png()
      .toBuffer()
      .then(async (resized) => {
        await sharp(resized)
          .composite([{
            input: circleMask,
            blend: 'dest-in'
          }])
          .png()
          .toFile(path.join(outputDir, `circle-${size}x${size}.png`));
        console.log(`Generated circle-${size}x${size}.png`);
      });
  }
  
  console.log('圆角图标生成完成！');
  console.log('使用 icon-rounded.png 或 rounded-512x512.png 作为桌面图标');
}

generateRoundedIcons().catch(console.error);
