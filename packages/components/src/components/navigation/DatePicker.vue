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
  <div class="cumquat-date-picker relative inline-block w-64">
    <button
      type="button"
      class="cumquat-date-picker__trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-cumquat border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      :class="open ? 'border-cumquat-accent' : 'border-cumquat-border'"
      @click="open = !open"
    >
      <span :class="selected != null ? 'text-cumquat-text' : 'text-cumquat-text-muted'">
        {{ selected != null ? `2026-10-${String(selected).padStart(2, '0')}` : '选择日期' }}
      </span>
      <svg
        class="size-4 text-cumquat-text-muted"
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
      <div
        v-if="open"
        class="cumquat-date-picker__panel absolute z-20 mt-1.5 w-full rounded-cumquat border border-cumquat-border bg-cumquat-surface p-3 shadow-cumquat-overlay"
      >
        <p
          class="cumquat-date-picker__month mb-2 text-center text-sm font-semibold text-cumquat-text"
        >
          2026 年 10 月
        </p>
        <div class="cumquat-date-picker__grid grid grid-cols-7 gap-0.5 text-center text-xs">
          <span
            v-for="w in weeks"
            :key="w"
            class="cumquat-date-picker__weekday py-1 text-cumquat-text-muted"
            >{{ w }}</span
          >
          <button
            v-for="(day, index) in cells"
            :key="index"
            type="button"
            :disabled="day == null"
            class="cumquat-date-picker__day flex aspect-square cursor-pointer items-center justify-center rounded transition-colors"
            :class="
              day == null
                ? 'cursor-default text-transparent'
                : day === selected
                  ? 'bg-cumquat-accent font-medium text-cumquat-text-inverse'
                  : 'text-cumquat-text hover:bg-cumquat-surface-2'
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
