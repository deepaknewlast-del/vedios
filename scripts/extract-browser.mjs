// Remotion needs a Chrome binary. The sandbox cannot reach Google's browser
// CDN, so we unpack the Chromium shipped inside the npm package
// @sparticuz/chromium (including its bundled NSS libraries).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const dest = path.join(root, '.cache', 'chromium');
const binDir = path.join(root, 'node_modules', '@sparticuz', 'chromium', 'bin');
fs.mkdirSync(dest, { recursive: true });

const chromePath = path.join(dest, 'chromium');
if (!fs.existsSync(chromePath)) {
  const br = fs.readFileSync(path.join(binDir, 'chromium.br'));
  fs.writeFileSync(chromePath, zlib.brotliDecompressSync(br));
  fs.chmodSync(chromePath, 0o755);
}

const libDir = path.join(dest, 'lib');
if (!fs.existsSync(path.join(libDir, 'libnss3.so'))) {
  const tarPath = path.join(dest, 'al2023.tar');
  fs.writeFileSync(
    tarPath,
    zlib.brotliDecompressSync(fs.readFileSync(path.join(binDir, 'al2023.tar.br'))),
  );
  execFileSync('tar', ['xf', tarPath, '-C', dest]);
}

// Verify the browser can start.
const env = { ...process.env, LD_LIBRARY_PATH: libDir };
const version = execFileSync(chromePath, ['--version'], { env, encoding: 'utf8' }).trim();
console.error(`[browser] ${version}`);

const envFile = path.join(dest, 'env.sh');
fs.writeFileSync(
  envFile,
  `export REMOTION_BROWSER="${chromePath}"\nexport LD_LIBRARY_PATH="${libDir}:` +
    '${LD_LIBRARY_PATH:-}"\n',
);
console.log(envFile);
