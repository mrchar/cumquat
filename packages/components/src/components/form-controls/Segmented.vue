<script setup lang="ts">
export interface SegmentedOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    options: SegmentedOption[];
  }>(),
  { options: () => [] },
);

const model = defineModel<string | number>({ default: '' });
</script>

<template>
  <div
    class="cumquat-segmented inline-flex gap-1 rounded-cumquat bg-cumquat-surface-3 p-1"
    role="radiogroup"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :disabled="option.disabled"
      class="cumquat-segmented__item cursor-pointer rounded px-4 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        option.value === model
          ? 'bg-cumquat-surface text-cumquat-text shadow-sm'
          : 'text-cumquat-text-muted hover:text-cumquat-text'
      "
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
