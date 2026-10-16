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
  <div class="cumquat-collapse">
    <div v-for="item in items" :key="item.key" class="cumquat-collapse__item">
      <button
        type="button"
        class="cumquat-collapse__header"
        :aria-expanded="expanded.has(item.key)"
        @click="toggle(item.key)"
      >
        {{ item.title }}
        <svg
          class="cumquat-collapse__chevron"
          :class="expanded.has(item.key) ? 'cumquat-collapse__chevron--expanded' : ''"
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
      <div v-if="expanded.has(item.key)" class="cumquat-collapse__content">
        {{ item.content }}
      </div>
    </div>
  </div>
</template>
