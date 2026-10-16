<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    total: number;
    pageSize?: number;
  }>(),
  { pageSize: 10 },
);

const page = defineModel<number>({ default: 1 });

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

/** 页码窗口：最多 7 项，超出折叠为省略号 */
const pages = computed<(number | 'ellipsis')[]>(() => {
  const tp = totalPages.value;
  const cur = page.value;
  if (tp <= 7) {
    return Array.from({ length: tp }, (_, i) => i + 1);
  }
  const list: (number | 'ellipsis')[] = [1];
  if (cur > 3) list.push('ellipsis');
  for (let i = Math.max(2, cur - 1); i <= Math.min(tp - 1, cur + 1); i++) {
    list.push(i);
  }
  if (cur < tp - 2) list.push('ellipsis');
  list.push(tp);
  return list;
});

function go(target: number) {
  if (target >= 1 && target <= totalPages.value) page.value = target;
}
</script>

<template>
  <nav class="cumquat-pagination" aria-label="分页">
    <button
      type="button"
      class="cumquat-pagination__prev"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="go(page - 1)"
    >
      <svg
        class="cumquat-pagination__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <template v-for="(item, index) in pages" :key="`${item}-${index}`">
      <span v-if="item === 'ellipsis'" class="cumquat-pagination__ellipsis">…</span>
      <button
        v-else
        type="button"
        class="cumquat-pagination__page"
        :class="item === page ? 'cumquat-pagination__page--active' : ''"
        :aria-current="item === page ? 'page' : undefined"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="cumquat-pagination__next"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="go(page + 1)"
    >
      <svg
        class="cumquat-pagination__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </nav>
</template>
