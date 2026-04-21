/**
 * After `vite build`, inlines dist CSS + JS into standalone/Wedding-Budget-Planner.html
 * so opening via file:// shows the same app as npm run dev / preview.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const indexPath = path.join(dist, 'index.html');

function readDistHtml() {
  if (!fs.existsSync(indexPath)) {
    console.error('Missing dist/index.html — run vite build first.');
    process.exit(1);
  }
  return fs.readFileSync(indexPath, 'utf8');
}

function assetPathFromHref(href) {
  const clean = href.replace(/^\.\//, '').replace(/^\//, '');
  return path.join(dist, clean);
}

const html = readDistHtml();
const cssHref = html.match(/href=["']([^"']+\.css)["']/);
const jsSrc = html.match(/src=["']([^"']+\.js)["']/);

if (!cssHref || !jsSrc) {
  console.error('Could not find CSS or JS references in dist/index.html');
  process.exit(1);
}

const cssPath = assetPathFromHref(cssHref[1]);
const jsPath = assetPathFromHref(jsSrc[1]);

const css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');
/* Avoid closing the HTML script tag if the bundle contains </script> */
js = js.replace(/<\/script>/gi, '<\\/script>');

const outPath = path.join(root, 'standalone', 'Wedding-Budget-Planner.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const out = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wedding Budget Planner — één bestand, geen server; je gegevens blijven op je apparaat." />
    <title>Wedding Budget Planner</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Dancing+Script:wght@600;700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${path.relative(root, outPath)} (${(out.length / 1024).toFixed(1)} KB)`);
