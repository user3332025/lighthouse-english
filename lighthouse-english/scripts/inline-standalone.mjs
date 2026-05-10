/**
 * 将 Vite 构建产物打成单个 HTML，便于 file:// 双击打开发试用。
 * JS 使用 data:application/javascript;base64 外链，避免内联时破坏 bundle 中的 </script> 片段。
 * 用法：npm run build（默认会替换 dist/index.html）；仅需拆分产物时用 npm run build:split
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '../dist');
const outName = '灯塔英语角-单文件试用.html';

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const jsMatch = html.match(/src="\.\/assets\/([^"]+\.js)"/);
const cssMatch = html.match(/href="\.\/assets\/([^"]+\.css)"/);
if (!jsMatch || !cssMatch) {
  console.error('未在 dist/index.html 中找到 ./assets/*.js 或 *.css，请先执行 vite build');
  process.exit(1);
}

const js = fs.readFileSync(path.join(dist, 'assets', jsMatch[1]), 'utf8');
const css = fs.readFileSync(path.join(dist, 'assets', cssMatch[1]), 'utf8');

const jsB64 = Buffer.from(js, 'utf8').toString('base64');
// 用 Blob URL 加载 ES 模块，避免部分浏览器对 data: 模块下 Web Audio / speechSynthesis 异常
const b64Literal = JSON.stringify(jsB64);
const moduleLoader = `<script>(function(){var b64=${b64Literal};var bin=atob(b64);var u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);var blob=new Blob([u8],{type:"text/javascript;charset=utf-8"});var url=URL.createObjectURL(blob);var s=document.createElement("script");s.type="module";s.src=url;s.onload=function(){URL.revokeObjectURL(url);};document.head.appendChild(s);})();<\/script>`;

html = html.replace(
  /<script[^>]*src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/i,
  moduleLoader
);
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="\.\/assets\/[^"]+\.css"[^>]*>/i,
  `<style>\n${css}\n</style>`
);

const svgPath = path.join(dist, 'lighthouse.svg');
if (fs.existsSync(svgPath)) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  html = html.replace(
    /<link rel="icon"[^>]*>/i,
    `<link rel="icon" type="image/svg+xml" href="${href}" />`
  );
}

const asciiName = 'lighthouse-full.html';
const batName = '一键启用完整功能.bat';
/** 英文名：避免中文文件名、部分杀毒或关联异常导致「打不开」 */
const batNameEn = 'start-full.bat';

/** @param {string} entryHtml 相对当前服务目录的入口文件名 */
function makeBatContent(entryHtml) {
  return `@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
set PORT=8765
set "ENTRY=${entryHtml}"

if not exist "%ENTRY%" (
  echo.
  echo [错误] 当前文件夹里没有网页文件：%ENTRY%
  echo 请把本脚本与 lighthouse-full.html 放在同一文件夹（dist 文件夹里则用 index.html）。
  echo.
  pause
  exit /b 1
)

echo.
echo 灯塔英语角 - 启动本地服务（跟读录音需用下方网址打开，勿直接用双击 HTML）
echo.

where py >nul 2>nul && goto USE_PY
where python >nul 2>nul && goto USE_PYTHON
where node >nul 2>nul && goto USE_NODE

echo [错误] 电脑里没有检测到 Python（命令 py / python）也没有 Node.js（命令 node）。
echo 请先安装其中一个后再双击本脚本，例如：
echo   Python: https://www.python.org/downloads/
echo   Node.js: https://nodejs.org/
echo.
pause
exit /b 1

:USE_PY
start "lighthouse-http" cmd /k "title lighthouse-http ^& py -m http.server %PORT%"
goto OPEN

:USE_PYTHON
start "lighthouse-http" cmd /k "title lighthouse-http ^& python -m http.server %PORT%"
goto OPEN

:USE_NODE
echo 使用 Node 启动（首次可能下载较慢，请稍等）…
start "lighthouse-http" cmd /k "title lighthouse-http ^& npx --yes serve@14 . -l %PORT%"

:OPEN
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/%ENTRY%#/"
echo.
echo 若浏览器没打开，请手动把下面整行复制到浏览器地址栏：
echo http://127.0.0.1:%PORT%/%ENTRY%#/
echo.
echo 请勿关闭标题为 lighthouse-http 的黑色窗口——关掉后网页会打不开。
pause
`;
}

function writeAll(htmlStr) {
  const root = path.join(__dirname, '..');
  /** dist/index.html：替换 vite 默认入口，便于直接分发 dist 或 file:// 试用 */
  fs.writeFileSync(path.join(dist, 'index.html'), htmlStr, 'utf8');
  /** 中文名与纯英文副本（项目根目录的开发模板 index.html 不能覆盖） */
  for (const p of [path.join(dist, outName), path.join(root, outName), path.join(root, asciiName)]) {
    fs.writeFileSync(p, htmlStr, 'utf8');
  }
  const batDist = makeBatContent('index.html');
  const batRoot = makeBatContent(asciiName);
  fs.writeFileSync(path.join(dist, batName), batDist, 'utf8');
  fs.writeFileSync(path.join(dist, batNameEn), batDist, 'utf8');
  fs.writeFileSync(path.join(root, batName), batRoot, 'utf8');
  fs.writeFileSync(path.join(root, batNameEn), batRoot, 'utf8');
}

writeAll(html);

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log(
  `已生成可直接打开的单文件 HTML（约 ${kb} KB），并已替换 dist/index.html：\n` +
    `  - ${path.join(dist, 'index.html')}（分发 dist 文件夹时用此入口）\n` +
    `  - ${path.join(dist, outName)}\n` +
    `  - ${path.join(__dirname, '..', asciiName)}（项目根目录，供 bat 打开；勿覆盖源码 index.html）\n` +
    `  - ${path.join(dist, batName)} / ${batNameEn}（在 dist 内会打开 index.html）\n` +
    `若中文名的 bat 双击无反应，请试 ${batNameEn}；需已安装 Python 或 Node.js。`
);
