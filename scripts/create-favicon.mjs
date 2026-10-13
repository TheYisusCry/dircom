// Build the ICO from our vector mark, rather than retaining the starter favicon.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url));
const png = await sharp(svg).resize(48, 48).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); // ICO
header.writeUInt16LE(1, 4); // One image
header[6] = 48;
header[7] = 48;
header.writeUInt16LE(1, 10); // Planes
header.writeUInt16LE(32, 12); // Bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18); // PNG offset
await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([header, png]));
