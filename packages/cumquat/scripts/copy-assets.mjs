import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 生成本地构建所需的静态资源：主题 CSS 与 LICENSE。
// style.css 由 tailwindcss CLI 在此之后基于 style-src.css 生成。
const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const repoRoot = join(pkgRoot, '../..');
const themeSrc = join(pkgRoot, '../themes/src');
const themeDest = join(pkgRoot, 'themes');

rmSync(themeDest, { recursive: true, force: true });
mkdirSync(themeDest, { recursive: true });

for (const file of readdirSync(themeSrc).filter((name) => name.endsWith('.css'))) {
  cpSync(join(themeSrc, file), join(themeDest, file));
}

const license = join(repoRoot, 'LICENSE');
if (existsSync(license)) cpSync(license, join(pkgRoot, 'LICENSE'));
