const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Stelle sicher, dass das Ausgabeverzeichnis existiert
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generiere Icons in verschiedenen Größen
async function generateIcons() {
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`✅ Icon ${size}x${size} generiert`);
  }
}

generateIcons().catch(console.error); 