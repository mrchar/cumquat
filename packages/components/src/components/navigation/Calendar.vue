<script setup lang="ts">
import { computed, ref } from 'vue';

/** 静态演示月：2026 年 10 月 */
const selected = ref<number | null>(null);

const weeks = ['日', '一', '二', '三', '四', '五', '六'] as const;
const leading = 4;
const daysCount = 31;

const cells = computed<(number | null)[]>(() => {
  const list: (number | null)[] = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= daysCount; d++) list.push(d);
  while (list.length % 7 !== 0) list.push(null);
  return list;
});

function pick(day: number | null) {
  if (day != null) selected.value = day;
}
</script>

<template>
  <div
    class="cumquat-calendar inline-block rounded-cumquat border border-cumquat-border bg-cumquat-surface p-4"
  >
    <header class="cumquat-calendar__header mb-3 flex items-center justify-between">
      <button
        type="button"
        aria-label="上个月"
        class="cumquat-calendar__nav flex size-8 cursor-pointer items-center justify-center rounded text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text"
      >
        <svg
          class="size-4"
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
      <h3 class="cumquat-calendar__month text-sm font-semibold text-cumquat-text">2026 年 10 月</h3>
      <button
        type="button"
        aria-label="下个月"
        class="cumquat-calendar__nav flex size-8 cursor-pointer items-center justify-center rounded text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text"
      >
        <svg
          class="size-4"
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
    </header>

    <div class="cumquat-calendar__grid grid grid-cols-7 gap-1 text-center text-sm">
      <span
        v-for="w in weeks"
        :key="w"
        class="cumquat-calendar__weekday py-1.5 text-xs text-cumquat-text-muted"
        >{{ w }}</span
      >
      <button
        v-for="(day, index) in cells"
        :key="index"
        type="button"
        :disabled="day == null"
        class="cumquat-calendar__day flex aspect-square cursor-pointer items-center justify-center rounded-cumquat text-cumquat-text transition-colors"
        :class="
          day == null
            ? 'cursor-default text-transparent'
            : day === selected
              ? 'bg-cumquat-accent font-medium text-cumquat-text-inverse'
              : 'hover:bg-cumquat-surface-2'
        "
        @click="pick(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>
