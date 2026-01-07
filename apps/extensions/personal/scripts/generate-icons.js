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

  // Create a gradient-like effect with purple/indigo colors
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Gradient from indigo to purple
      const ratio = (x + y) / (size * 2);
      const r = Math.floor(99 + ratio * 40); // 99-139
      const g = Math.floor(102 + ratio * 56); // 102-158
      const b = Math.floor(241 - ratio * 145); // 241-96
      
      png.data[idx] = r;     // R
      png.data[idx + 1] = g;  // G
      png.data[idx + 2] = b;  // B
      png.data[idx + 3] = 255; // A
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
