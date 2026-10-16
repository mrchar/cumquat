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
  <nav class="cumquat-anchor" aria-label="锚点导航">
    <a
      v-for="item in items"
      :key="item.href"
      :href="item.href"
      class="cumquat-anchor__link"
      :class="
        active === item.href ? 'cumquat-anchor__link--active' : 'cumquat-anchor__link--inactive'
      "
      @click="go(item)"
    >
      {{ item.label }}
    </a>
  </nav>
</template>
