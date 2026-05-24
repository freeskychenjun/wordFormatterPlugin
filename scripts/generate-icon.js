import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create a 64x64 RGBA PNG — formatting/document icon
const W = 64, H = 64;
const pixels = new Uint8Array(W * H * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
}

function fillRect(x1, y1, w, h, r, g, b, a = 255) {
  for (let y = y1; y < y1 + h; y++)
    for (let x = x1; x < x1 + w; x++)
      setPixel(x, y, r, g, b, a);
}

function fillRoundRect(x1, y1, w, h, radius, r, g, b, a = 255) {
  for (let y = y1; y < y1 + h; y++) {
    for (let x = x1; x < x1 + w; x++) {
      let inside = true;
      // Check rounded corners
      if (x < x1 + radius && y < y1 + radius) {
        const dx = x1 + radius - x - 1, dy = y1 + radius - y - 1;
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 + w - radius && y < y1 + radius) {
        const dx = x - (x1 + w - radius), dy = y1 + radius - y - 1;
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x < x1 + radius && y >= y1 + h - radius) {
        const dx = x1 + radius - x - 1, dy = y - (y1 + h - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 + w - radius && y >= y1 + h - radius) {
        const dx = x - (x1 + w - radius), dy = y - (y1 + h - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      }
      if (inside) setPixel(x, y, r, g, b, a);
    }
  }
}

function drawLine(x1, y1, x2, y2, r, g, b, a = 255) {
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, x = x1, y = y1;
  while (true) {
    setPixel(x, y, r, g, b, a);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// Helper: thick horizontal rectangle (for "text lines")
function hLine(x, y, w, h, r, g, b) {
  fillRect(x, y, w, h, r, g, b);
}

// --- Draw icon ---

// Document body (white rounded rect with subtle shadow)
fillRoundRect(10, 5, 44, 52, 6, 220, 225, 240, 255); // shadow/edge
fillRoundRect(9, 4, 44, 52, 6, 255, 255, 255, 255); // white paper

// Document header bar (blue)
fillRoundRect(9, 4, 44, 16, 6, 47, 111, 221, 255);
// Flatten bottom of header
fillRect(9, 14, 44, 6, 47, 111, 221, 255);

// Text lines on the document
hLine(17, 27, 22, 4, 200, 210, 225);
hLine(17, 34, 16, 4, 200, 210, 225);
hLine(17, 41, 19, 4, 200, 210, 225);

// Sparkle/star (orange/gold) — the "formatting magic" element
const cx = 45, cy = 44;
const sparkleR = 12, sparkleInner = 5;
const points = 5;
for (let i = 0; i < points; i++) {
  const outerAngle = (i * 2 * Math.PI) / points - Math.PI / 2;
  const innerAngle = outerAngle + Math.PI / points;
  const ox = cx + sparkleR * Math.cos(outerAngle);
  const oy = cy + sparkleR * Math.sin(outerAngle);
  const ix = cx + sparkleInner * Math.cos(innerAngle);
  const iy = cy + sparkleInner * Math.sin(innerAngle);
  drawLine(Math.round(ox), Math.round(oy), Math.round(ix), Math.round(iy), 242, 138, 43, 255);
}
// Fill sparkle center
for (let dy = -sparkleInner + 1; dy < sparkleInner; dy++) {
  for (let dx = -sparkleInner + 1; dx < sparkleInner; dx++) {
    if (dx * dx + dy * dy <= sparkleInner * sparkleInner) {
      setPixel(cx + dx, cy + dy, 255, 180, 50, 255);
    }
  }
}

// Build PNG
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  buf.writeUInt32BE(crc32(buf.subarray(4, 8 + len)), 8 + len);
  return buf;
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

// IDAT: filter byte + raw RGBA per row
const rawRows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    row[1 + x * 4] = pixels[i];
    row[2 + x * 4] = pixels[i + 1];
    row[3 + x * 4] = pixels[i + 2];
    row[4 + x * 4] = pixels[i + 3];
  }
  rawRows.push(row);
}
const rawData = Buffer.concat(rawRows);
const compressed = deflateSync(rawData);

// Build file
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const chunks = [
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0)),
];

const outputPath = resolve(__dirname, '..', 'public', 'icon-btn.png');
writeFileSync(outputPath, Buffer.concat([signature, ...chunks]));
console.log(`Icon generated: ${outputPath} (${W}x${H} PNG)`);
