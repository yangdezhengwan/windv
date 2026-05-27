const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function createIco() {
  const files = [
    'icon-16x16.png',
    'icon-32x32.png',
    'icon-48x48.png',
    'icon-256x256.png'
  ].map(f => fs.readFileSync(path.join(__dirname, f)));
  
  const buf = await toIco(files);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), buf);
  console.log('Created icon.ico');
}

createIco().catch(console.error);
