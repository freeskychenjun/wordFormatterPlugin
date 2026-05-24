import { cpSync, mkdirSync, existsSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');
const offline = join(root, 'deploy', 'offline');
const output = join(root, 'release', 'word-formatter-offline');

// Build first
console.log('Building project...');
execSync('npx vite build', { cwd: root, stdio: 'inherit' });

// Clean output (tolerate locked dirs — overwrite instead)
if (existsSync(output)) {
  try { rmSync(output, { recursive: true, force: true }); } catch { /* dir locked, will overwrite */ }
}
mkdirSync(output, { recursive: true });

// Copy web files
console.log('Packaging web files...');
cpSync(dist, join(output, 'web'), { recursive: true });

// Fix HTML paths to be relative
const htmlPath = join(output, 'web', 'index.html');
if (existsSync(htmlPath)) {
  let html = readFileSync(htmlPath, 'utf-8');
  html = html.replace(/href="\/assets\//g, 'href="./assets/');
  html = html.replace(/src="\/assets\//g, 'src="./assets/');
  writeFileSync(htmlPath, html);
}

// Copy offline deployment scripts
cpSync(join(offline, 'server.ps1'), join(output, 'server.ps1'));
cpSync(join(offline, 'install.bat'), join(output, 'install.bat'));
cpSync(join(offline, 'uninstall.bat'), join(output, 'uninstall.bat'));
cpSync(join(root, 'public', 'icon.png'), join(output, 'web', 'icon.png'));
cpSync(join(root, 'public', 'icon2.png'), join(output, 'web', 'icon2.png'));
cpSync(join(root, 'public', 'icon-btn.png'), join(output, 'web', 'icon-btn.png'));
cpSync(join(root, 'public', 'images'), join(output, 'web', 'images'), { recursive: true });

console.log('');
console.log(`Offline package created: ${output}`);
console.log('');
console.log('To distribute:');
console.log(`  1. Zip the "${output}" folder`);
console.log('  2. Send the zip to colleagues');
console.log('  3. Colleagues extract and run install.bat');
