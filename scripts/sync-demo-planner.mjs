/**
 * Kopieert dist/ naar demo/planner voor GitHub Pages / Etsy-demolink.
 * Voorkomt dat demo/planner verouderde hashed bundles serveert.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const demoAssets = path.join(root, 'demo', 'planner', 'assets');
const outIndex = path.join(root, 'demo', 'planner', 'index.html');

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

const distIndexPath = path.join(dist, 'index.html');
if (!fs.existsSync(distIndexPath)) {
  console.error('Ontbreekt dist/index.html — voer eerst vite build uit.');
  process.exit(1);
}

rimraf(demoAssets);
copyRecursive(path.join(dist, 'assets'), demoAssets);

let html = fs.readFileSync(distIndexPath, 'utf8');
html = html.replace(/href="\/assets\//g, 'href="./assets/');
html = html.replace(/src="\/assets\//g, 'src="./assets/');
html = html.replace(/lang="en"/i, 'lang="nl"');

fs.writeFileSync(outIndex, html, 'utf8');
console.log('demo/planner gesynchroniseerd vanuit dist/');
