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
  <nav class="cumquat-menu">
    <template v-for="item in items" :key="item.key">
      <!-- 分组 -->
      <template v-if="item.children">
        <button
          type="button"
          class="cumquat-menu__group"
          :aria-expanded="isExpanded(item.key)"
          @click="toggleGroup(item.key)"
        >
          {{ item.label }}
          <svg
            class="cumquat-menu__chevron"
            :class="isExpanded(item.key) ? 'cumquat-menu__chevron--expanded' : ''"
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
        <div v-if="isExpanded(item.key)" class="cumquat-menu__subgroup">
          <button
            v-for="child in item.children"
            :key="child.key"
            type="button"
            class="cumquat-menu__item"
            :class="
              child.key === active ? 'cumquat-menu__item--active' : 'cumquat-menu__item--inactive'
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
        class="cumquat-menu__item"
        :class="item.key === active ? 'cumquat-menu__item--active' : 'cumquat-menu__item--inactive'"
        @click="active = item.key"
      >
        {{ item.label }}
      </button>
    </template>
  </nav>
</template>
