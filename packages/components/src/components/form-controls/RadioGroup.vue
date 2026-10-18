<script setup lang="ts">
import { provide } from 'vue';
import { useActionValue, useCheckableGroup } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

type V = string | number;

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical';
    modelValue?: V | null;
    disabled?: boolean;
    /** 选择动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用组内选择 */
    action?: ActionLike;
  }>(),
  { direction: 'horizontal', modelValue: undefined, disabled: false, action: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: V | null];
  /** 选择动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 选择动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

/** 最近一次对外提交的值（revert 依据；受控外部不回写时 model 读值不可靠） */
let lastEmitted: V | null = props.modelValue ?? null;

const group = useCheckableGroup<V>({
  multiple: false,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    const previous = lastEmitted;
    lastEmitted = value as V | null;
    emit('update:modelValue', value as V | null);
    if (!props.action) return;
    void commitAction({
      execute: () => props.action?.(value),
      revert: () => {
        lastEmitted = previous;
        group.model.value = previous;
        emit('update:modelValue', previous);
      },
    }).then((ok) => {
      if (!ok && actionError.value != null) emit('actionError', actionError.value);
    });
  },
});

provide('cumquat-radio-group', group);
provide('cumquat-radio-group-pending', actionPending);
</script>

<template>
  <div
    class="cumquat-radio-group"
    :class="[
      `cumquat-radio-group--${direction}`,
      disabled || actionPending ? 'cumquat-radio-group--disabled' : '',
    ]"
    role="radiogroup"
  >
    <slot />
  </div>
</template>
