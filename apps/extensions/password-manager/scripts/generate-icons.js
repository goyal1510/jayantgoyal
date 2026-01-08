import { PNG } from "pngjs";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 128];
const outputDir = resolve(__dirname, "../public/icons");

// Create output directory if it doesn't exist
mkdirSync(outputDir, { recursive: true });

function createIcon(size) {
  const png = new PNG({ width: size, height: size });

  // Create a lock icon with dark background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Dark background
      png.data[idx] = 26;     // R
      png.data[idx + 1] = 26; // G
      png.data[idx + 2] = 26; // B
      png.data[idx + 3] = 255; // A
      
      // Draw a simple lock icon in the center
      const centerX = size / 2;
      const centerY = size / 2;
      const lockWidth = size * 0.4;
      const lockHeight = size * 0.5;
      
      // Lock body
      if (
        x >= centerX - lockWidth / 2 &&
        x <= centerX + lockWidth / 2 &&
        y >= centerY - lockHeight / 4 &&
        y <= centerY + lockHeight / 2
      ) {
        png.data[idx] = 33;     // R - Blue
        png.data[idx + 1] = 150; // G
        png.data[idx + 2] = 243; // B
      }
      
      // Lock shackle
      if (
        (x >= centerX - lockWidth / 2 - 2 && x <= centerX - lockWidth / 2 + 2 && y >= centerY - lockHeight / 2 && y <= centerY - lockHeight / 4) ||
        (x >= centerX + lockWidth / 2 - 2 && x <= centerX + lockWidth / 2 + 2 && y >= centerY - lockHeight / 2 && y <= centerY - lockHeight / 4) ||
        (x >= centerX - lockWidth / 2 - 2 && x <= centerX + lockWidth / 2 + 2 && y >= centerY - lockHeight / 2 - 2 && y <= centerY - lockHeight / 2 + 2)
      ) {
        png.data[idx] = 33;     // R
        png.data[idx + 1] = 150; // G
        png.data[idx + 2] = 243; // B
      }
    }
  }

  return PNG.sync.write(png);
}

sizes.forEach((size) => {
  const buffer = createIcon(size);
  writeFileSync(resolve(outputDir, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
});

console.log("All icons generated successfully!");
