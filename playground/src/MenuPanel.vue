<script setup lang="ts">
import { computed, ref } from 'vue';
import { sampleGroups } from './samples';

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

/** 片段标题为「英文名 中文名」组合，按标题匹配即可同时支持中英文搜索 */
const search = ref('');
const searching = computed(() => search.value.trim() !== '');
const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return sampleGroups;
  return sampleGroups
    .map((group) => ({
      ...group,
      samples: group.samples.filter((sample) => sample.title.toLowerCase().includes(query)),
    }))
    .filter((group) => group.samples.length > 0);
});

/** 分类折叠：记录收起的分组 key；搜索时强制展开，避免命中结果被折叠项遮挡 */
const collapsedKeys = ref<Set<string>>(new Set());
const isGroupOpen = (key: string) => searching.value || !collapsedKeys.value.has(key);
const toggleGroup = (key: string) => {
  if (searching.value) return;
  const next = new Set(collapsedKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  collapsedKeys.value = next;
};
</script>

<template>
  <p class="mb-5 px-2 text-xs text-cumquat-text-muted">组件调试沙盒</p>

  <div class="relative mb-4 px-1">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-cumquat-text-muted"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" stroke-linecap="round" />
    </svg>
    <input
      v-model="search"
      type="text"
      placeholder="搜索组件…"
      class="w-full rounded border border-cumquat-border bg-cumquat-surface-2 py-1.5 pl-8 pr-7 text-sm text-cumquat-text transition-colors placeholder:text-cumquat-text-muted focus:border-cumquat-accent focus:outline-none"
    />
    <button
      v-if="search"
      type="button"
      aria-label="清空搜索"
      class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-cumquat-text-muted transition-colors hover:text-cumquat-text"
      @click="search = ''"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5">
        <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
      </svg>
    </button>
  </div>

  <nav class="flex flex-1 flex-col gap-4 overflow-y-auto">
    <div v-for="group in filteredGroups" :key="group.key" class="flex flex-col gap-1">
      <button
        type="button"
        class="mb-1 flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-left text-sm font-semibold tracking-wide text-cumquat-text-muted transition-colors hover:text-cumquat-text"
        :aria-expanded="isGroupOpen(group.key)"
        @click="toggleGroup(group.key)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="size-4 shrink-0 transition-transform duration-200"
          :class="isGroupOpen(group.key) ? 'rotate-90' : ''"
        >
          <path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ group.title }}
      </button>
      <template v-if="isGroupOpen(group.key)">
        <button
          v-for="sample in group.samples"
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
      </template>
    </div>
    <p v-if="filteredGroups.length === 0" class="px-2 py-4 text-sm text-cumquat-text-muted">
      无匹配组件
    </p>
  </nav>

  <div class="flex flex-col gap-1 border-t border-cumquat-border pt-4">
    <p class="mb-1 px-2 text-sm font-semibold tracking-wide text-cumquat-text-muted">主题</p>
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
