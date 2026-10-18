<script setup lang="ts">
import { computed } from 'vue';
import { useActionValue, useControllableModel, useListboxNavigation } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

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
    /** 分段选择动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用选择 */
    action?: ActionLike;
  }>(),
  { options: () => [], modelValue: undefined, disabled: false, size: 'md', action: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  /** 分段选择动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 分段选择动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

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
  isItemDisabled: (index) =>
    props.disabled || actionPending.value || Boolean(props.options[index]?.disabled),
  onSelect: (index) => select(props.options[index]),
});

function select(option: SegmentedOption | undefined) {
  if (!option || props.disabled || actionPending.value || option.disabled) return;
  if (option.value === activeValue.value) return;
  const previous = activeValue.value;
  activeValue.value = option.value;
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(option.value),
    revert: () => {
      activeValue.value = previous;
    },
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
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
      :disabled="disabled || actionPending || option.disabled"
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
