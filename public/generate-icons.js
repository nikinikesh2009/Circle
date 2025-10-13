const fs = require('fs');

const sizes = [192, 512];
const svgTemplate = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#217BF4" rx="${size/8}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3.2}" fill="none" stroke="white" stroke-width="${size/16}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/6.4}" fill="white"/>
</svg>`;

sizes.forEach(size => {
  fs.writeFileSync(`icon-${size}.svg`, svgTemplate(size));
  console.log(`Created icon-${size}.svg`);
});
