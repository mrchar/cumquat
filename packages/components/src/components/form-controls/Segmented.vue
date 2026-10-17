<script setup lang="ts">
import { computed } from 'vue';
import { useControllableModel, useListboxNavigation } from '@cumquat/composables';

export interface SegmentedOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: SegmentedOption[];
    modelValue?: string | number;
    disabled?: boolean;
    size?: 'sm' | 'md';
  }>(),
  { options: () => [], modelValue: undefined, disabled: false, size: 'md' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
}>();

const { value: activeValue } = useControllableModel<string | number>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  fallback: '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('change', next);
  },
});

const nav = useListboxNavigation({
  count: computed(() => props.options.length),
  orientation: 'horizontal',
  isItemDisabled: (index) => props.disabled || Boolean(props.options[index]?.disabled),
  onSelect: (index) => select(props.options[index]),
});

function select(option: SegmentedOption | undefined) {
  if (!option || props.disabled || option.disabled) return;
  activeValue.value = option.value;
}

function isActive(option: SegmentedOption) {
  return option.value === activeValue.value;
}
</script>

<template>
  <div
    class="cumquat-segmented"
    :class="[`cumquat-segmented--${size}`, disabled ? 'cumquat-segmented--disabled' : '']"
    role="radiogroup"
    @keydown="nav.onKeydown($event)"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="isActive(option)"
      :tabindex="isActive(option) || (!activeValue && index === 0) ? 0 : -1"
      :disabled="disabled || option.disabled"
      class="cumquat-segmented__item"
      :class="[
        isActive(option) ? 'cumquat-segmented__item--active' : '',
        nav.activeIndex.value === index ? 'cumquat-segmented__item--focus' : '',
      ]"
      @mouseenter="nav.setActiveIndex(index)"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
