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
  <div class="cumquat-calendar">
    <header class="cumquat-calendar__header">
      <button type="button" aria-label="上个月" class="cumquat-calendar__nav">
        <svg
          class="cumquat-calendar__nav-icon"
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
      <h3 class="cumquat-calendar__month">2026 年 10 月</h3>
      <button type="button" aria-label="下个月" class="cumquat-calendar__nav">
        <svg
          class="cumquat-calendar__nav-icon"
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

    <div class="cumquat-calendar__grid">
      <span v-for="w in weeks" :key="w" class="cumquat-calendar__weekday">{{ w }}</span>
      <button
        v-for="(day, index) in cells"
        :key="index"
        type="button"
        :disabled="day == null"
        class="cumquat-calendar__day"
        :class="
          day == null
            ? 'cumquat-calendar__day--empty'
            : day === selected
              ? 'cumquat-calendar__day--selected'
              : 'cumquat-calendar__day--default'
        "
        @click="pick(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>
