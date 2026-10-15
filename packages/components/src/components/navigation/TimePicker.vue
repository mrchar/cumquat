<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);

const selectedHour = ref<number | null>(null);
const selectedMinute = ref<number | null>(null);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

function pickHour(h: number) {
  selectedHour.value = h;
}

function pickMinute(m: number) {
  selectedMinute.value = m;
}

function confirm() {
  open.value = false;
}
</script>

<template>
  <div class="cumquat-time-picker relative inline-block w-40">
    <button
      type="button"
      class="cumquat-time-picker__trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-cumquat border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      :class="open ? 'border-cumquat-accent' : 'border-cumquat-border'"
      @click="open = !open"
    >
      <span :class="selectedHour != null ? 'text-cumquat-text' : 'text-cumquat-text-muted'">
        {{
          selectedHour != null
            ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute ?? 0).padStart(2, '0')}`
            : '选择时间'
        }}
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
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="open"
        class="cumquat-time-picker__panel absolute z-20 mt-1.5 flex w-full gap-1 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-2 shadow-cumquat-overlay"
      >
        <ul class="cumquat-time-picker__hours max-h-40 flex-1 overflow-y-auto text-center text-xs">
          <li
            v-for="h in hours"
            :key="h"
            class="cumquat-time-picker__hour cursor-pointer rounded px-2 py-1.5 transition-colors"
            :class="
              h === selectedHour
                ? 'bg-cumquat-accent text-cumquat-text-inverse'
                : 'text-cumquat-text hover:bg-cumquat-surface-2'
            "
            @click="pickHour(h)"
          >
            {{ String(h).padStart(2, '0') }} 时
          </li>
        </ul>
        <ul
          class="cumquat-time-picker__minutes max-h-40 flex-1 overflow-y-auto text-center text-xs"
        >
          <li
            v-for="m in minutes"
            :key="m"
            class="cumquat-time-picker__minute cursor-pointer rounded px-2 py-1.5 transition-colors"
            :class="
              m === selectedMinute
                ? 'bg-cumquat-accent text-cumquat-text-inverse'
                : 'text-cumquat-text hover:bg-cumquat-surface-2'
            "
            @click="pickMinute(m)"
          >
            {{ String(m).padStart(2, '0') }} 分
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
