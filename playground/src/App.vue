<script setup lang="ts">
import { ref, watch } from 'vue';
import { CodeCard, LiveDemo } from '@cumquat/components';
import { samples } from './samples';

type ThemeKey = 'light' | 'dark' | 'high-contrast' | 'glass';

const themes: { key: ThemeKey; label: string }[] = [
  { key: 'light', label: '亮色' },
  { key: 'dark', label: '暗色' },
  { key: 'high-contrast', label: '高对比' },
  { key: 'glass', label: '玻璃' },
];

const theme = ref<ThemeKey>('light');

watch(
  theme,
  (value) => {
    const root = document.documentElement;
    root.classList.remove(
      'cq-theme-light',
      'cq-theme-dark',
      'cq-theme-high-contrast',
      'cq-theme-glass',
      'dark',
    );
    root.classList.add(`cq-theme-${value}`);
  },
  { immediate: true },
);

/** 当前片段；切换时重建演示码与作用域，内部状态回到初始 */
const activeKey = ref(samples[0].key);
const activeSample = () => samples.find((sample) => sample.key === activeKey.value) ?? samples[0];
const code = ref(samples[0].code);
const scope = ref(samples[0].scope?.() ?? {});

watch(activeKey, () => {
  const sample = activeSample();
  code.value = sample.code;
  scope.value = sample.scope?.() ?? {};
});
</script>

<template>
  <div class="min-h-screen">
    <aside
      class="fixed inset-y-0 left-0 z-30 flex w-60 flex-col overflow-y-auto border-r border-cumquat-border bg-cumquat-surface px-4 py-6"
    >
      <p class="mb-1 px-2 text-lg font-semibold tracking-tight text-cumquat-text">Cumquat</p>
      <p class="mb-5 px-2 text-xs text-cumquat-text-muted">组件调试沙盒</p>

      <nav class="flex flex-1 flex-col gap-1">
        <button
          v-for="sample in samples"
          :key="sample.key"
          type="button"
          class="cursor-pointer rounded px-2 py-1 text-left text-sm transition-colors"
          :class="
            activeKey === sample.key
              ? 'bg-cumquat-surface-2 font-medium text-cumquat-text'
              : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
          "
          @click="activeKey = sample.key"
        >
          {{ sample.title }}
        </button>
      </nav>

      <div class="flex flex-col gap-1 border-t border-cumquat-border pt-4">
        <p class="mb-1 px-2 text-xs font-semibold tracking-wide text-cumquat-text-muted">主题</p>
        <button
          v-for="item in themes"
          :key="item.key"
          type="button"
          class="cursor-pointer rounded px-2 py-1 text-left text-sm transition-colors"
          :class="
            theme === item.key
              ? 'bg-cumquat-surface-2 font-medium text-cumquat-text'
              : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
          "
          @click="theme = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </aside>

    <main class="ml-60 px-8 py-6">
      <header class="mb-6">
        <h1 class="text-xl font-semibold text-cumquat-text">组件调试沙盒</h1>
        <p class="mt-1 text-sm text-cumquat-text-muted">
          选择左侧片段，直接编辑代码即可实时预览；调试新组件时把模板贴入编辑区。
        </p>
      </header>

      <CodeCard v-model:code="code" editable :title="activeSample().title">
        <LiveDemo :code="code" :scope="scope" />
      </CodeCard>
    </main>
  </div>
</template>
