<script setup lang="ts">
import { computed } from 'vue';
import type { ActionHandler, Converter, Rules, Schema, View } from '@cumquat/core';
import type { FormRule, FormRules } from '@cumquat/composables';
import { createValidator, defaultView, useForm } from '@cumquat/composables';

import FormItem from './FormItem.vue';
import { resolveField } from './fields';
import type { FieldRenderer } from './fields';

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
    /** 字段视图：绑定后自动生成表单（视图的 component 决定控件），生成字段在前、插槽在后 */
    properties?: View[];
    /** 数据模型：schema 经 view 投影为字段视图，并由 validation 派生校验规则 */
    schema?: Schema;
    /** 自定义校验与跨字段检查：与纯数据 schema 分离 */
    validation?: Rules;
    /** schema → 视图的转换器，默认使用内置实现 */
    view?: Converter;
    /** 局部控件渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先 */
    controls?: FieldRenderer[];
    /** 提交动作：校验通过后由组件自行调用并管理提交中状态（ActionHandler 形态，如资源客户端的 create / update） */
    action?: ActionHandler;
  }>(),
  {
    modelValue: undefined,
    rules: () => ({}),
    disabled: false,
    labelPosition: 'top',
    labelWidth: '6rem',
    properties: undefined,
    schema: undefined,
    validation: undefined,
    view: undefined,
    controls: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [values: FormValues];
  submit: [values: FormValues];
  invalid: [errors: Record<string, string | undefined>];
}>();

/* ---------------- 字段竞选（properties / schema 驱动自动生成） ---------------- */

/** 渲染字段：显式 properties 优先，其次由 schema 经转换器投影 */
const effectiveProperties = computed<View[]>(() => {
  if (props.properties) return props.properties;
  if (!props.schema) return [];
  return (props.view ?? defaultView).toFields(props.schema);
});

/** 数据模型校验器：schema 约束与独立的 validation 配置编译为表单规则 */
const validator = computed(() =>
  props.schema
    ? createValidator<FormValues>(props.schema, {
        view: props.view,
        rules: props.validation,
      })
    : undefined,
);

/**
 * 规则源：显式 rules 在前，schema 派生规则随后；
 * 未传 schema 时由字段视图的 validation.required 派生必填。
 */
const effectiveRules = computed<FormRules<FormValues>>(() => {
  const merged: Record<string, Array<FormRule> | FormRule> = { ...props.rules };

  for (const [name, rule] of Object.entries(validator.value?.rules ?? {})) {
    if (!rule) continue;
    const host = merged[name];
    const derived = Array.isArray(rule) ? rule : [rule as FormRule];
    merged[name] =
      host === undefined
        ? rule
        : [...(Array.isArray(host) ? host : [host]), ...derived];
  }

  if (!props.schema) {
    for (const field of effectiveProperties.value) {
      if (!field.validation.required) continue;
      const required: FormRule = (value) =>
        value === undefined || value === null || value === '' ? `${field.label}不能为空` : true;
      const host = merged[field.name];
      merged[field.name] =
        host === undefined ? required : [required, ...(Array.isArray(host) ? host : [host])];
    }
  }

  return merged;
});

const {
  values,
  errors,
  valid,
  dirty,
  submitting,
  validate,
  validateField,
  reset,
  submit,
  clearValidate,
  setFieldValue,
} = useForm<FormValues>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  rules: () => effectiveRules.value,
  disabled: props.disabled,
  labelPosition: props.labelPosition,
  onChange: (next) => emit('update:modelValue', next),
  onSubmit: async (next) => {
    emit('submit', next);
    // 状态自持：提供 action 时由组件执行，宿主无需再监听 submit 手动调用
    await props.action?.(next);
  },
  onInvalid: (next) => emit('invalid', next),
});

/** 提交进行中一并禁用全部控件 */
const formDisabled = computed(() => props.disabled || submitting.value);

const fieldPlans = computed(() =>
  effectiveProperties.value.map((field) => ({
    field,
    renderer: resolveField(field, props.controls),
  })),
);

/** 必填星号：由字段视图的 validation 派生 */
function requiredOf(field: View): boolean {
  return field.validation.required;
}

/** 写回字段值；已存在错误的字段写回后自动重新校验，录入修正即时清除错误 */
function writeFieldValue(name: string, value: unknown) {
  setFieldValue(name, value);
  if (errors[name] !== undefined) void validateField(name);
}

/** 默认装配：竞选选中渲染器时装配控件，值与错误经上下文接入表单 */
const FieldView = (viewProps: { field: View; renderer?: FieldRenderer }) => {
  const field = viewProps.field;
  if (!viewProps.renderer) return null;
  return viewProps.renderer.render(values[field.name], field, {
    name: field.name,
    disabled: formDisabled.value,
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
  submitting,
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
    :class="[`cumquat-form--label-${labelPosition}`, formDisabled ? 'cumquat-form--disabled' : '']"
    :style="{ '--cumquat-form-label-width': labelWidth }"
    @submit="onSubmit"
  >
    <!-- properties 绑定：按字段竞选自动生成，字段插槽可覆盖单项 -->
    <FormItem
      v-for="plan in fieldPlans"
      :key="plan.field.name"
      :name="plan.field.name"
      :label="plan.field.label"
      :required="requiredOf(plan.field)"
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
      :submitting="submitting"
      :submit="submit"
      :reset="reset"
    />
  </form>
</template>