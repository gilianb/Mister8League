// Optimise les photos d'ambiance déposées dans DONNEES_LIGUE/visuels-site :
// rotation correcte, hauteur 800 px, compression, métadonnées (GPS…) retirées.
// Usage : node scripts/optimize-ambiance.mjs

import { readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SOURCE = "/Users/abderrahim/MISTER 8/DONNEES_LIGUE/visuels-site";
const DEST = join(fileURLToPath(new URL("..", import.meta.url)), "public/ambiance");

mkdirSync(DEST, { recursive: true });

const files = readdirSync(SOURCE)
  .filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f))
  .sort();

let i = 0;
for (const file of files) {
  i += 1;
  const out = join(DEST, `amb-${String(i).padStart(2, "0")}.jpg`);
  const info = await sharp(join(SOURCE, file))
    .rotate() // applique l'orientation EXIF puis la supprime
    .resize({ height: 800, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(out); // les métadonnées (EXIF/GPS) ne sont pas recopiées
  console.log(`${file} -> amb-${String(i).padStart(2, "0")}.jpg (${info.width}x${info.height}, ${Math.round(info.size / 1024)} Ko)`);
}
console.log(`\n${i} photos optimisées dans public/ambiance/`);
