<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }>(),
  { min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER, step: 1, disabled: false },
);

const model = defineModel<number>({ default: 0 });

const canDecrease = computed(() => !props.disabled && model.value - props.step >= props.min);
const canIncrease = computed(() => !props.disabled && model.value + props.step <= props.max);

function decrease() {
  if (canDecrease.value) model.value = model.value - props.step;
}

function increase() {
  if (canIncrease.value) model.value = model.value + props.step;
}
</script>

<template>
  <div class="cumquat-input-number" :class="disabled ? 'cumquat-input-number--disabled' : ''">
    <button
      type="button"
      aria-label="减少"
      class="cumquat-input-number__decrease"
      :disabled="!canDecrease"
      @click="decrease"
    >
      <svg
        class="cumquat-input-number__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M5 12h14" />
      </svg>
    </button>
    <input
      v-model.number="model"
      type="text"
      class="cumquat-input-number__input"
      :disabled="disabled"
    />
    <button
      type="button"
      aria-label="增加"
      class="cumquat-input-number__increase"
      :disabled="!canIncrease"
      @click="increase"
    >
      <svg
        class="cumquat-input-number__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
