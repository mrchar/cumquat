<script setup lang="ts">
import { samples } from './samples';

type ThemeKey = 'light' | 'dark' | 'high-contrast' | 'glass';

defineProps<{ activeKey: string; theme: ThemeKey }>();

const emit = defineEmits<{
  select: [key: string];
  'update:theme': [key: ThemeKey];
}>();

const themes: { key: ThemeKey; label: string }[] = [
  { key: 'light', label: '亮色' },
  { key: 'dark', label: '暗色' },
  { key: 'high-contrast', label: '高对比' },
  { key: 'glass', label: '玻璃' },
];
</script>

<template>
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
      @click="emit('select', sample.key)"
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
      @click="emit('update:theme', item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
