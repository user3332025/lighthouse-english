import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const assetsDir = path.join(dist, 'assets');
const optimizedDir = path.join(dist, 'standalone-optimized-assets');
const resizeScript = path.join(__dirname, 'resize-standalone-image.ps1');
const standaloneName = 'lighthouse-full.html';
const trialStandaloneName = '灯塔英语角-单文件试用.html';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const RESIZABLE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const MIME_BY_EXT = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const jsMatch = html.match(/src="\.\/assets\/([^"]+\.js)"/);
const cssMatch = html.match(/href="\.\/assets\/([^"]+\.css)"/);
if (!jsMatch || !cssMatch) {
  console.error('Could not find ./assets/*.js and ./assets/*.css in dist/index.html. Run vite build first.');
  process.exit(1);
}

let js = fs.readFileSync(path.join(assetsDir, jsMatch[1]), 'utf8');
let css = fs.readFileSync(path.join(assetsDir, cssMatch[1]), 'utf8');

fs.mkdirSync(optimizedDir, { recursive: true });

const dataUrlCache = new Map();
let compressedCount = 0;
let originalImageBytes = 0;
let packedImageBytes = 0;

function getMimeType(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function resolveAssetPath(assetName) {
  const cleanName = decodeURIComponent(assetName.split(/[?#]/)[0]);
  const candidate = path.join(assetsDir, path.basename(cleanName));
  return fs.existsSync(candidate) ? candidate : null;
}

function compressImageForStandalone(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!RESIZABLE_EXTENSIONS.has(ext) || !fs.existsSync(resizeScript)) {
    return sourcePath;
  }

  const optimizedPath = path.join(
    optimizedDir,
    `${path.basename(sourcePath, ext)}.standalone${ext === '.jpeg' ? '.jpg' : ext}`
  );

  if (!fs.existsSync(optimizedPath)) {
    try {
      execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          resizeScript,
          sourcePath,
          optimizedPath,
          '420',
          '82',
        ],
        { stdio: 'pipe' }
      );
    } catch {
      return sourcePath;
    }
  }

  if (!fs.existsSync(optimizedPath)) {
    return sourcePath;
  }

  const originalSize = fs.statSync(sourcePath).size;
  const optimizedSize = fs.statSync(optimizedPath).size;
  if (optimizedSize > 0 && optimizedSize < originalSize) {
    compressedCount += 1;
    return optimizedPath;
  }
  return sourcePath;
}

function getAssetDataUrl(assetName) {
  const sourcePath = resolveAssetPath(assetName);
  if (!sourcePath) {
    return null;
  }

  const ext = path.extname(sourcePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return null;
  }

  if (dataUrlCache.has(sourcePath)) {
    return dataUrlCache.get(sourcePath);
  }

  const packedPath = compressImageForStandalone(sourcePath);
  const fileBytes = fs.readFileSync(packedPath);
  const dataUrl =
    ext === '.svg'
      ? `data:${getMimeType(sourcePath)},${encodeURIComponent(fileBytes.toString('utf8'))}`
      : `data:${getMimeType(packedPath)};base64,${fileBytes.toString('base64')}`;

  originalImageBytes += fs.statSync(sourcePath).size;
  packedImageBytes += fileBytes.length;
  dataUrlCache.set(sourcePath, dataUrl);
  return dataUrl;
}

function inlineJsImageAssets(source) {
  return source.replace(
    /(["'`])([^"'`\\/]+?\.(?:png|jpe?g|webp|gif|svg))(?:\?[^"'`]*)?\1/gi,
    (match, quote, assetName) => {
      const dataUrl = getAssetDataUrl(assetName);
      return dataUrl ? `${quote}${dataUrl}${quote}` : match;
    }
  );
}

function inlineCssImageAssets(source) {
  return source.replace(
    /url\((["']?)(?:\.\/)?assets\/([^)"']+?\.(?:png|jpe?g|webp|gif|svg))(?:\?[^)"']*)?\1\)/gi,
    (match, quote, assetName) => {
      const dataUrl = getAssetDataUrl(assetName);
      return dataUrl ? `url(${quote}${dataUrl}${quote})` : match;
    }
  );
}

js = inlineJsImageAssets(js);
css = inlineCssImageAssets(css);

const jsB64 = Buffer.from(js, 'utf8').toString('base64');
const moduleLoader = `<script>(function(){var b64=${JSON.stringify(
  jsB64
)};var bin=atob(b64);var u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);var blob=new Blob([u8],{type:"text/javascript;charset=utf-8"});var url=URL.createObjectURL(blob);var s=document.createElement("script");s.type="module";s.src=url;s.onload=function(){URL.revokeObjectURL(url);};document.head.appendChild(s);})();<\/script>`;

html = html.replace(/<script[^>]*src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/i, moduleLoader);
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="\.\/assets\/[^"]+\.css"[^>]*>/i,
  `<style>\n${css}\n</style>`
);

const svgPath = path.join(dist, 'lighthouse.svg');
if (fs.existsSync(svgPath)) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  html = html.replace(
    /<link rel="icon"[^>]*>/i,
    `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}" />`
  );
}

function makeBatContent(entryHtml) {
  return `@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
set PORT=8765
set "ENTRY=${entryHtml}"

if not exist "%ENTRY%" (
  echo Could not find %ENTRY%.
  pause
  exit /b 1
)

where py >nul 2>nul && goto USE_PY
where python >nul 2>nul && goto USE_PYTHON
where node >nul 2>nul && goto USE_NODE

echo Please install Python or Node.js, then run this file again.
pause
exit /b 1

:USE_PY
start "lighthouse-http" cmd /k "title lighthouse-http ^& py -m http.server %PORT%"
goto OPEN

:USE_PYTHON
start "lighthouse-http" cmd /k "title lighthouse-http ^& python -m http.server %PORT%"
goto OPEN

:USE_NODE
start "lighthouse-http" cmd /k "title lighthouse-http ^& npx --yes serve@14 . -l %PORT%"

:OPEN
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/%ENTRY%#/"
echo Opened http://127.0.0.1:%PORT%/%ENTRY%#/
pause
`;
}

function writeAll(htmlString) {
  fs.writeFileSync(path.join(dist, 'index.html'), htmlString, 'utf8');
  fs.writeFileSync(path.join(dist, standaloneName), htmlString, 'utf8');
  fs.writeFileSync(path.join(dist, trialStandaloneName), htmlString, 'utf8');
  fs.writeFileSync(path.join(root, standaloneName), htmlString, 'utf8');
  fs.writeFileSync(path.join(root, trialStandaloneName), htmlString, 'utf8');
  fs.writeFileSync(path.join(dist, 'start-full.bat'), makeBatContent('index.html'), 'utf8');
  fs.writeFileSync(path.join(root, 'start-full.bat'), makeBatContent(standaloneName), 'utf8');
}

writeAll(html);

const htmlKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
const originalKb = (originalImageBytes / 1024).toFixed(0);
const packedKb = (packedImageBytes / 1024).toFixed(0);
console.log(`Standalone HTML written: ${htmlKb} KB`);
console.log(`Images inlined: ${dataUrlCache.size}, compressed: ${compressedCount}, ${originalKb} KB -> ${packedKb} KB`);
console.log(`Output: ${path.join(root, standaloneName)}`);
console.log(`Trial output: ${path.join(root, trialStandaloneName)}`);
