/**
 * @mrchar/cumquat 发布包构建脚本
 *
 * 聚合 @cumquat/composables 与 @cumquat/components 的 dist 产物为单包：
 * 1. dist/composables、dist/components — 拷贝子包构建产物
 * 2. dist/index.js / index.d.ts — 命名空间聚合入口（与仓库根 index.ts 语义一致）
 * 3. components 产物内的 @cumquat/composables 引用改写为包内相对路径
 * 4. themes/ — 拷贝主题 CSS 源码
 * 5. style.css — Tailwind v4 预编译样式（扫描组件源码 + 全部主题）
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const composablesDist = path.resolve(pkgDir, '../composables/dist');
const componentsDist = path.resolve(pkgDir, '../components/dist');
const themesSrc = path.resolve(pkgDir, '../themes/src');

if (!existsSync(composablesDist) || !existsSync(componentsDist)) {
  console.error(
    '[cumquat] 缺少子包构建产物，请先执行: pnpm --filter @cumquat/composables build && pnpm --filter @cumquat/components build',
  );
  process.exit(1);
}

// 1. 聚合子包 dist
const outDir = path.join(pkgDir, 'dist');
await rm(outDir, { recursive: true, force: true });
await cp(composablesDist, path.join(outDir, 'composables'), { recursive: true });
await cp(componentsDist, path.join(outDir, 'components'), { recursive: true });

// 2. 改写 components 产物内的子包引用为包内相对路径
for (const file of ['index.js', 'index.d.ts']) {
  const filePath = path.join(outDir, 'components', file);
  const code = await readFile(filePath, 'utf8');
  if (code.includes('@cumquat/')) {
    await writeFile(filePath, code.replaceAll('@cumquat/composables', '../composables/index.js'));
  }
}

// 3. 命名空间聚合入口
const entrySource = `export * as composables from './composables/index.js';\nexport * as components from './components/index.js';\n`;
await writeFile(path.join(outDir, 'index.js'), entrySource);
await writeFile(path.join(outDir, 'index.d.ts'), entrySource);

// 4. 主题 CSS
const themesDir = path.join(pkgDir, 'themes');
await rm(themesDir, { recursive: true, force: true });
await cp(themesSrc, themesDir, { recursive: true });

// 5. 预编译样式（Tailwind v4：扫描组件源码类名 + 全部主题）
execSync('pnpm exec tailwindcss -i style-src.css -o style.css --minify', {
  cwd: pkgDir,
  stdio: 'inherit',
});

// 6. 许可证（npm 会自动包含 LICENSE）
await cp(path.resolve(pkgDir, '../../LICENSE'), path.join(pkgDir, 'LICENSE'));
