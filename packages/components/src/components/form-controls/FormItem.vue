<script setup lang="ts">
import { computed } from 'vue';
import { injectForm, provideFormField, useId } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 字段名：与表单 rules/values 对应，并用于错误提示联动 */
    name?: string;
    label?: string;
    required?: boolean;
    /** 外部直接指定错误信息；非空时优先于表单上下文中的错误 */
    error?: string;
  }>(),
  { name: undefined, label: '', required: false, error: '' },
);

const form = injectForm();
const fieldId = useId('cq-form-item');

const errorMessage = computed(
  () => props.error || (props.name ? form?.errors[props.name] : undefined) || '',
);

provideFormField({
  name: props.name ?? '',
  get error() {
    return errorMessage.value || undefined;
  },
  touched: false,
  fieldId: fieldId.value,
});
</script>

<template>
  <div
    class="cumquat-form-item"
    :class="[
      form?.labelPosition ? `cumquat-form-item--label-${form.labelPosition}` : '',
      errorMessage ? 'cumquat-form-item--invalid' : '',
    ]"
  >
    <label v-if="label" :for="fieldId" class="cumquat-form-item__label">
      <span v-if="required" class="cumquat-form-item__required">*</span>
      {{ label }}
    </label>
    <div class="cumquat-form-item__content">
      <slot :error="errorMessage" />
      <p v-if="errorMessage" class="cumquat-form-item__error">{{ errorMessage }}</p>
    </div>
  </div>
</template>
