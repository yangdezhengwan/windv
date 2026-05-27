const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons() {
  const logoPath = path.join(__dirname, 'logo.png');
  const outputDir = __dirname;
  
  // Resize and save as PNGs
  for (const size of sizes) {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated ${size}x${size}.png`);
  }
  
  // Create 256x256 for ICO (will use png2ico or similar)
  await sharp(logoPath)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  console.log('Generated icon.png');
  
  console.log('Done!');
}

generateIcons().catch(console.error);
