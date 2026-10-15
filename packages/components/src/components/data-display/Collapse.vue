<script setup lang="ts">
import { ref } from 'vue';

export interface CollapseItem {
  key: string;
  title: string;
  content: string;
}

withDefaults(
  defineProps<{
    items: CollapseItem[];
  }>(),
  { items: () => [] },
);

/** 当前展开的 key 集合（允许多个面板同时展开） */
const expanded = ref<Set<string>>(new Set());

function toggle(key: string) {
  const next = new Set(expanded.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  expanded.value = next;
}
</script>

<template>
  <div
    class="cumquat-collapse flex flex-col divide-y divide-cumquat-border rounded-cumquat border border-cumquat-border bg-cumquat-surface"
  >
    <div v-for="item in items" :key="item.key" class="cumquat-collapse__item">
      <button
        type="button"
        class="cumquat-collapse__header flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
        :aria-expanded="expanded.has(item.key)"
        @click="toggle(item.key)"
      >
        {{ item.title }}
        <svg
          class="cumquat-collapse__chevron size-4 shrink-0 text-cumquat-text-muted transition-transform"
          :class="expanded.has(item.key) ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        v-if="expanded.has(item.key)"
        class="cumquat-collapse__content px-4 pb-4 text-sm text-cumquat-text-muted"
      >
        {{ item.content }}
      </div>
    </div>
  </div>
</template>
