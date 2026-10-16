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
  <div class="cumquat-segmented" role="radiogroup">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :disabled="option.disabled"
      class="cumquat-segmented__item"
      :class="option.value === model ? 'cumquat-segmented__item--active' : ''"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
