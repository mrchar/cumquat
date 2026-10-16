<script setup lang="ts">
import { computed, ref } from 'vue';

const open = ref(false);

/** 选中的日期（1-31，演示态） */
const selected = defineModel<number | null>({ default: null });

/** 2026-10：1 号周四，共 31 天（静态演示月） */
const weeks = ['日', '一', '二', '三', '四', '五', '六'] as const;
/** 前导空位（周四 → 4 个） */
const leading = 4;
const daysCount = 31;

const cells = computed<(number | null)[]>(() => {
  const list: (number | null)[] = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= daysCount; d++) list.push(d);
  while (list.length % 7 !== 0) list.push(null);
  return list;
});

function pick(day: number | null) {
  if (day == null) return;
  selected.value = day;
  open.value = false;
}
</script>

<template>
  <div class="cumquat-date-picker">
    <button
      type="button"
      class="cumquat-date-picker__trigger"
      :class="open ? 'cumquat-date-picker__trigger--open' : ''"
      @click="open = !open"
    >
      <span
        :class="
          selected != null
            ? 'cumquat-date-picker__value--selected'
            : 'cumquat-date-picker__value--placeholder'
        "
      >
        {{ selected != null ? `2026-10-${String(selected).padStart(2, '0')}` : '选择日期' }}
      </span>
      <svg
        class="cumquat-date-picker__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <div v-if="open" class="cumquat-date-picker__panel">
        <p class="cumquat-date-picker__month">2026 年 10 月</p>
        <div class="cumquat-date-picker__grid">
          <span v-for="w in weeks" :key="w" class="cumquat-date-picker__weekday">{{ w }}</span>
          <button
            v-for="(day, index) in cells"
            :key="index"
            type="button"
            :disabled="day == null"
            class="cumquat-date-picker__day"
            :class="
              day == null
                ? 'cumquat-date-picker__day--empty'
                : day === selected
                  ? 'cumquat-date-picker__day--selected'
                  : 'cumquat-date-picker__day--default'
            "
            @click="pick(day)"
          >
            {{ day }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
