<script setup lang="ts">
import { ref } from 'vue';

export interface MenuItem {
  key: string;
  label: string;
  children?: MenuItem[];
}

withDefaults(
  defineProps<{
    items: MenuItem[];
  }>(),
  { items: () => [] },
);

const active = defineModel<string>({ default: '' });

/** 当前展开的分组 key 集合 */
const expanded = ref<Set<string>>(new Set());

function toggleGroup(key: string) {
  const next = new Set(expanded.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  expanded.value = next;
}

function isExpanded(key: string) {
  return expanded.value.has(key);
}
</script>

<template>
  <nav
    class="cumquat-menu flex w-56 flex-col gap-0.5 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-2"
  >
    <template v-for="item in items" :key="item.key">
      <!-- 分组 -->
      <template v-if="item.children">
        <button
          type="button"
          class="cumquat-menu__group flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-sm font-medium text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
          :aria-expanded="isExpanded(item.key)"
          @click="toggleGroup(item.key)"
        >
          {{ item.label }}
          <svg
            class="cumquat-menu__chevron size-3.5 text-cumquat-text-muted transition-transform"
            :class="isExpanded(item.key) ? 'rotate-180' : ''"
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
        <div v-if="isExpanded(item.key)" class="cumquat-menu__subgroup flex flex-col gap-0.5 pl-3">
          <button
            v-for="child in item.children"
            :key="child.key"
            type="button"
            class="cumquat-menu__item cursor-pointer rounded px-3 py-2 text-left text-sm transition-colors"
            :class="
              child.key === active
                ? 'bg-cumquat-accent-soft font-medium text-cumquat-accent'
                : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
            "
            @click="active = child.key"
          >
            {{ child.label }}
          </button>
        </div>
      </template>
      <!-- 叶子项 -->
      <button
        v-else
        type="button"
        class="cumquat-menu__item cursor-pointer rounded px-3 py-2 text-left text-sm transition-colors"
        :class="
          item.key === active
            ? 'bg-cumquat-accent-soft font-medium text-cumquat-accent'
            : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
        "
        @click="active = item.key"
      >
        {{ item.label }}
      </button>
    </template>
  </nav>
</template>
