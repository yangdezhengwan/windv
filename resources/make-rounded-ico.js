const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function createRoundedIco() {
  console.log('生成圆角图标...');
  
  // 首先生成圆角 PNG
  const sharp = require('sharp');
  const sizes = [16, 32, 48, 256];
  
  for (const size of sizes) {
    const logoPath = path.join(__dirname, 'logo.png');
    const radius = Math.round(size * 0.22);
    
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>
    `;
    const mask = Buffer.from(svg);
    
    await sharp(logoPath)
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
          .toFile(path.join(__dirname, `rounded-${size}x${size}.png`));
        console.log(`Created rounded-${size}x${size}.png`);
      });
  }
  
  // 生成 ICO 文件
  const files = [
    'rounded-16x16.png',
    'rounded-32x32.png',
    'rounded-48x48.png',
    'rounded-256x256.png'
  ].map(f => fs.readFileSync(path.join(__dirname, f)));
  
  const buf = await toIco(files);
  fs.writeFileSync(path.join(__dirname, 'icon-rounded.ico'), buf);
  console.log('Created icon-rounded.ico');
  
  // 复制为默认 icon.ico
  fs.copyFileSync(path.join(__dirname, 'icon-rounded.ico'), path.join(__dirname, 'icon.ico'));
  console.log('Updated icon.ico with rounded version');
}

createRoundedIco().catch(console.error);
