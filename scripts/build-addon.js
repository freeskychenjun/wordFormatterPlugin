import { copyFileSync, mkdirSync, cpSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');
const addon = join(root, 'wps-addon');
const output = join(root, 'release', 'word-formatter');

if (!existsSync(output)) mkdirSync(output, { recursive: true });

// Copy dist files
cpSync(dist, join(output, 'web'), { recursive: true });
copyFileSync(join(root, 'public', 'icon.png'), join(output, 'web', 'icon.png'));
copyFileSync(join(root, 'public', 'icon2.png'), join(output, 'web', 'icon2.png'));
copyFileSync(join(root, 'public', 'icon-btn.png'), join(output, 'web', 'icon-btn.png'));
cpSync(join(root, 'public', 'images'), join(output, 'web', 'images'), { recursive: true });

// Fix HTML paths to be relative
const htmlPath = join(output, 'web', 'index.html');
let html = readFileSync(htmlPath, 'utf-8');
html = html.replace(/href="\/assets\//g, 'href="./assets/');
html = html.replace(/src="\/assets\//g, 'src="./assets/');
writeFileSync(htmlPath, html);

// Create production addon.xml
const addonXml = `<?xml version="1.0" encoding="UTF-8"?>
<addin>
  <name>文档排版助手</name>
  <type>console</type>
  <url>./web/index.html</url>
  <taskpane>
    <title>文档排版助手</title>
    <url>./web/index.html</url>
    <width>320</width>
  </taskpane>
</addin>`;

writeFileSync(join(output, 'addon.xml'), addonXml);

// Copy ribbon.xml
copyFileSync(join(addon, 'ribbon.xml'), join(output, 'ribbon.xml'));
copyFileSync(join(root, 'public', 'icon.png'), join(output, 'icon.png'));
copyFileSync(join(root, 'public', 'icon2.png'), join(output, 'icon2.png'));
copyFileSync(join(root, 'public', 'icon-btn.png'), join(output, 'icon-btn.png'));
cpSync(join(root, 'public', 'images'), join(output, 'images'), { recursive: true });

console.log(`Addon packaged to: ${output}`);
