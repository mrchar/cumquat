<script setup lang="ts">
import { computed } from 'vue';
import { useForm } from '@cumquat/composables';
import type { FormRule, FormRules } from '@cumquat/composables';
import FormItem from './FormItem.vue';
import { resolveField } from './fields';
import type { FieldRenderer, FormFieldMeta } from './fields';

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
    /** 字段元数据：绑定后自动生成表单（字段竞选推断控件），生成字段在前、插槽在后 */
    properties?: FormFieldMeta[];
    /** 局部控件渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先 */
    controls?: FieldRenderer[];
  }>(),
  {
    modelValue: undefined,
    rules: () => ({}),
    disabled: false,
    labelPosition: 'top',
    labelWidth: '6rem',
    properties: undefined,
    controls: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [values: FormValues];
  submit: [values: FormValues];
  invalid: [errors: Record<string, string | undefined>];
}>();

/* ---------------- 字段竞选（properties 驱动自动生成） ---------------- */

/** 派生必填规则并入表单规则源：required 字段自动获得必填校验，宿主同名规则叠加其后；自注册控件经字段上下文同样继承 */
const effectiveRules = computed<FormRules<FormValues>>(() => {
  const merged: Record<string, Array<FormRule> | FormRule> = { ...props.rules };
  for (const field of props.properties ?? []) {
    if (!field.required) continue;
    const required: FormRule = (value) =>
      value === undefined || value === null || value === '' ? `${field.label}不能为空` : true;
    const host = merged[field.name];
    merged[field.name] =
      host === undefined ? required : [required, ...(Array.isArray(host) ? host : [host])];
  }
  return merged;
});

const { values, errors, valid, dirty, validate, validateField, reset, submit, clearValidate, setFieldValue } =
  useForm<FormValues>({
    modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
    rules: () => effectiveRules.value,
    disabled: props.disabled,
    labelPosition: props.labelPosition,
    onChange: (next) => emit('update:modelValue', next),
    onSubmit: (next) => emit('submit', next),
    onInvalid: (next) => emit('invalid', next),
  });

const fieldPlans = computed(() =>
  (props.properties ?? []).map((field) => ({ field, renderer: resolveField(field, props.controls) })),
);

/** 写回字段值；已存在错误的字段写回后自动重新校验，录入修正即时清除错误 */
function writeFieldValue(name: string, value: unknown) {
  setFieldValue(name, value);
  if (errors[name] !== undefined) void validateField(name);
}

/** 默认装配：竞选选中渲染器时装配控件，值与错误经上下文接入表单 */
const FieldView = (viewProps: { field: FormFieldMeta; renderer?: FieldRenderer }) => {
  const field = viewProps.field;
  if (!viewProps.renderer) return null;
  return viewProps.renderer.render(values[field.name], field, {
    name: field.name,
    disabled: props.disabled,
    error: errors[field.name],
    setValue: (next) => writeFieldValue(field.name, next),
  });
};

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
    <!-- properties 绑定：按字段竞选自动生成，字段插槽可覆盖单项 -->
    <FormItem
      v-for="plan in fieldPlans"
      :key="plan.field.name"
      :name="plan.field.name"
      :label="plan.field.label"
      :required="!!plan.field.required"
    >
      <slot
        :name="`field-${plan.field.name}`"
        :field="plan.field"
        :value="values[plan.field.name]"
        :error="errors[plan.field.name]"
        :set-value="(next: unknown) => writeFieldValue(plan.field.name, next)"
      >
        <FieldView :field="plan.field" :renderer="plan.renderer" />
      </slot>
    </FormItem>
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
