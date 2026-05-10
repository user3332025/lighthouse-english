/**
 * 先构建并启动 vite preview，再通过 localtunnel 暴露公网 https 临时链接。
 * 用法：npm run share:public
 * 注意：关闭本进程后链接失效；首次用该链接打开时 localtunnel 可能要求网页上点一次 Continue。
 */
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PORT = 4173;
const DIST_INDEX = path.join(root, 'dist', 'index.html');

function checkDist() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.error('未找到 dist/index.html，请先执行：npm run build');
    process.exit(1);
  }
}

function waitForHttpOk(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else if (Date.now() - started > timeoutMs) reject(new Error('预览服务返回异常'));
        else setTimeout(tick, 400);
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error('等待预览服务超时'));
        else setTimeout(tick, 400);
      });
    };
    tick();
  });
}

async function main() {
  checkDist();

  const isWin = process.platform === 'win32';
  const npx = isWin ? 'npx.cmd' : 'npx';
  const preview = spawn(npx, ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
  });

  preview.on('error', (err) => {
    console.error('无法启动 vite preview:', err);
    process.exit(1);
  });

  try {
    await waitForHttpOk(`http://127.0.0.1:${PORT}/`, 45000);
  } catch (e) {
    console.error(e.message || e);
    preview.kill('SIGTERM');
    process.exit(1);
  }

  let tunnel;
  try {
    const { default: localtunnel } = await import('localtunnel');
    tunnel = await localtunnel({ port: PORT });
  } catch (e) {
    console.error('无法建立公网隧道（localtunnel）：', e.message || e);
    preview.kill('SIGTERM');
    process.exit(1);
  }

  const publicUrl = `${tunnel.url.replace(/\/$/, '')}/#/`;
  console.log('\n========================================');
  console.log(' 公网临时链接（请保持本窗口运行，勿关机断网）');
  console.log(' ', publicUrl);
  console.log('========================================');
  console.log(' 若打开后提示 Tunnel / Password，按页面说明点 Continue 即可。');
  console.log(' 按 Ctrl+C 可停止服务并关闭链接。\n');

  const shutdown = () => {
    try {
      tunnel.close();
    } catch {
      /* ignore */
    }
    preview.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
