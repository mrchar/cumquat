<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import { useActionValue, useFormField } from '@cumquat/composables';
import type { ActionLike, CheckableGroupReturn } from '@cumquat/composables';

type V = string | number;

const props = withDefaults(
  defineProps<{
    /** 该选项的取值 */
    value: V;
    modelValue?: V | null;
    label?: string;
    disabled?: boolean;
    name?: string;
    /** 选择动作（仅独立使用时生效；组内由 RadioGroup 的 action 统一管理）：新值先乐观应用，动作失败自动回退旧值 */
    action?: ActionLike;
  }>(),
  { modelValue: undefined, label: '', disabled: false, name: undefined, action: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: V];
  /** 选择动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 选择动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

const field = useFormField<V | null>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    if (value !== null) emit('update:modelValue', value);
  },
  disabled: () => props.disabled || actionPending.value,
});

/** 处于 RadioGroup 内时由组上下文接管值与互斥 */
const group = inject<CheckableGroupReturn<V> | undefined>('cumquat-radio-group', undefined);
/** 组上下文的 action 执行中标记（由 RadioGroup 提供），期间禁止新的选择 */
const groupPending = inject<Ref<boolean> | undefined>('cumquat-radio-group-pending', undefined);

const isChecked = computed(() =>
  group ? group.isChecked(props.value) : field.value.value === props.value,
);

function pick() {
  if (props.disabled || actionPending.value || (group && groupPending?.value)) return;
  if (group) {
    group.select(props.value);
    return;
  }
  const previous = field.value.value;
  field.handleChange(props.value);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(props.value),
    revert: () => field.handleChange(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}
</script>

<template>
  <label class="cumquat-radio" :class="disabled ? 'cumquat-radio--disabled' : ''" @click="pick">
    <input
      type="radio"
      class="cumquat-radio__input"
      :checked="isChecked"
      :disabled="disabled || actionPending || groupPending"
      @change="pick"
    />
    <span class="cumquat-radio__dot" :class="isChecked ? 'cumquat-radio__dot--checked' : ''">
      <span
        class="cumquat-radio__inner"
        :class="isChecked ? 'cumquat-radio__inner--checked' : ''"
      />
    </span>
    <span v-if="label || $slots.default" class="cumquat-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
