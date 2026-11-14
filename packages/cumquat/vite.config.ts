import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    dts: true,
    // @cumquat/* 是 workspace 内部包，运行时和类型都作为 external，由 bundledDependencies 提供
    deps: {
      neverBundle: [/^@cumquat\//, 'vue', 'shiki', '@shikijs/langs', '@shikijs/themes', 'sucrase'],
    },
  },
});
