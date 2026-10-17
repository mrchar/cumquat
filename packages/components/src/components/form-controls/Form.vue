<script setup lang="ts">
import { useForm } from '@cumquat/composables';
import type { FormRules } from '@cumquat/composables';

type FormValues = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    /** 整表值（受控或作为初始值） */
    modelValue?: FormValues;
    rules?: FormRules<FormValues>;
    disabled?: boolean;
    /** 标签摆放位置 */
    labelPosition?: 'top' | 'left';
    labelWidth?: string;
  }>(),
  {
    modelValue: undefined,
    rules: () => ({}),
    disabled: false,
    labelPosition: 'top',
    labelWidth: '6rem',
  },
);

const emit = defineEmits<{
  'update:modelValue': [values: FormValues];
  submit: [values: FormValues];
  invalid: [errors: Record<string, string | undefined>];
}>();

const { values, errors, valid, dirty, validate, validateField, reset, submit, clearValidate } =
  useForm<FormValues>({
    modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
    rules: () => props.rules,
    disabled: props.disabled,
    labelPosition: props.labelPosition,
    onChange: (next) => emit('update:modelValue', next),
    onSubmit: (next) => emit('submit', next),
    onInvalid: (next) => emit('invalid', next),
  });

async function onSubmit(event: Event) {
  event.preventDefault();
  await submit();
}

defineExpose({
  values,
  errors,
  valid,
  dirty,
  validate,
  validateField,
  reset,
  clearValidate,
  submit,
});
</script>

<template>
  <form
    class="cumquat-form"
    :class="[`cumquat-form--label-${labelPosition}`, disabled ? 'cumquat-form--disabled' : '']"
    :style="{ '--cumquat-form-label-width': labelWidth }"
    @submit="onSubmit"
  >
    <slot
      :values="values"
      :errors="errors"
      :valid="valid"
      :dirty="dirty"
      :submit="submit"
      :reset="reset"
    />
  </form>
</template>
