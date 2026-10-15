<script setup lang="ts">
import { ref } from 'vue';

export interface AnchorItem {
  href: string;
  label: string;
}

withDefaults(
  defineProps<{
    items: AnchorItem[];
  }>(),
  { items: () => [] },
);

const active = ref('');

function go(item: AnchorItem) {
  active.value = item.href;
}
</script>

<template>
  <nav
    class="cumquat-anchor flex flex-col gap-0.5 border-l-2 border-cumquat-border"
    aria-label="锚点导航"
  >
    <a
      v-for="item in items"
      :key="item.href"
      :href="item.href"
      class="cumquat-anchor__link -ml-0.5 border-l-2 px-4 py-1.5 text-sm transition-colors"
      :class="
        active === item.href
          ? 'border-cumquat-accent font-medium text-cumquat-accent'
          : 'border-transparent text-cumquat-text-muted hover:text-cumquat-text'
      "
      @click="go(item)"
    >
      {{ item.label }}
    </a>
  </nav>
</template>
