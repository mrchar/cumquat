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
  <div
    class="cumquat-input-number inline-flex h-10 items-stretch overflow-hidden rounded-cumquat border border-cumquat-border bg-cumquat-surface transition-colors focus-within:border-cumquat-accent focus-within:ring-2 focus-within:ring-cumquat-accent/20"
    :class="disabled ? 'cursor-not-allowed opacity-60' : ''"
  >
    <button
      type="button"
      aria-label="减少"
      class="cumquat-input-number__decrease flex w-9 cursor-pointer items-center justify-center text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canDecrease"
      @click="decrease"
    >
      <svg
        class="size-3.5"
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
      class="cumquat-input-number__input w-14 border-x border-cumquat-border bg-transparent text-center text-sm text-cumquat-text focus:outline-none disabled:cursor-not-allowed"
      :disabled="disabled"
    />
    <button
      type="button"
      aria-label="增加"
      class="cumquat-input-number__increase flex w-9 cursor-pointer items-center justify-center text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canIncrease"
      @click="increase"
    >
      <svg
        class="size-3.5"
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
