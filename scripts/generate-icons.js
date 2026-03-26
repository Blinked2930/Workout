import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const text = 'LL';
const bgColor = '#4a90e2';
const textColor = '#ffffff';

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Draw text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Adjust font size based on icon size
  const fontSize = size * 0.5;
  ctx.font = `bold ${fontSize}px Arial`;
  
  ctx.fillText(text, size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join('public', `pwa-${size}x${size}.png`), buffer);
  
  console.log(`Generated pwa-${size}x${size}.png`);
});

console.log('Icons generated successfully!');
