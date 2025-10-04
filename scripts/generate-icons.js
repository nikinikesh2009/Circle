import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#14b8a6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="512" height="512" rx="120" fill="#000000"/>
  
  <circle cx="256" cy="256" r="180" fill="url(#grad1)" opacity="0.9"/>
  
  <circle cx="256" cy="256" r="140" fill="none" stroke="white" stroke-width="8" opacity="0.8"/>
  
  <path d="M 256 140 L 280 200 L 340 200 L 290 240 L 310 300 L 256 260 L 202 300 L 222 240 L 172 200 L 232 200 Z" 
        fill="white" opacity="0.9"/>
</svg>`;

const publicDir = join(__dirname, '..', 'client', 'public');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  
  console.log('✓ Generated icon-192.png');
  
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  
  console.log('✓ Generated icon-512.png');
  
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  
  console.log('✓ Generated apple-touch-icon.png');
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
