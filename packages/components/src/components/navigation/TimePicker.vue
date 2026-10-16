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
  <div class="cumquat-time-picker">
    <button
      type="button"
      class="cumquat-time-picker__trigger"
      :class="open ? 'cumquat-time-picker__trigger--open' : ''"
      @click="open = !open"
    >
      <span
        :class="
          selectedHour != null
            ? 'cumquat-time-picker__value--selected'
            : 'cumquat-time-picker__value--placeholder'
        "
      >
        {{
          selectedHour != null
            ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute ?? 0).padStart(2, '0')}`
            : '选择时间'
        }}
      </span>
      <svg
        class="cumquat-time-picker__icon"
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
      <div v-if="open" class="cumquat-time-picker__panel">
        <ul class="cumquat-time-picker__hours">
          <li
            v-for="h in hours"
            :key="h"
            class="cumquat-time-picker__hour"
            :class="
              h === selectedHour
                ? 'cumquat-time-picker__hour--selected'
                : 'cumquat-time-picker__hour--default'
            "
            @click="pickHour(h)"
          >
            {{ String(h).padStart(2, '0') }} 时
          </li>
        </ul>
        <ul class="cumquat-time-picker__minutes">
          <li
            v-for="m in minutes"
            :key="m"
            class="cumquat-time-picker__minute"
            :class="
              m === selectedMinute
                ? 'cumquat-time-picker__minute--selected'
                : 'cumquat-time-picker__minute--default'
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
