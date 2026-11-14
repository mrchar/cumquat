import { h } from 'vue';
import type { VNodeChild } from 'vue';
import type { Option, View } from '@cumquat/core';
import DatePicker from './DatePicker.vue';
import Input from './Input.vue';
import InputNumber from './InputNumber.vue';
import Select from './Select.vue';
import Switch from './Switch.vue';

/**
 * 字段竞选：字段视图驱动的表单控件装配机制，与单元格竞选同构。
 *
 * 视图的 `component` 是转换器给出的首选控件：命中同名渲染器即生效；
 * 未注册时按渲染器自我评价竞选，仍无命中回落默认文本输入框。
 * 优先级链路：字段插槽 > component 命中 > 竞选推断 > 默认输入框。
 */

/** 控件渲染器契约：自包含，只声明「擅长什么、怎么装配」 */
export interface FieldRenderer {
  /** 注册名：与视图 component 对应；同名重注册替换既有实现（含内建） */
  name: string;
  /** 自我评价：字段视图 → 适配度分数，0 表示弃权；纯函数、无副作用，不读字段值 */
  fitness: (field: View) => number;
  /** 装配：值 + 字段视图 + 上下文 → 控件节点；值类型语义由选中控件自身定义 */
  render: (value: unknown, field: View, ctx: FieldContext) => VNodeChild;
}

/** 装配上下文：控件的值与错误经此接入表单 */
export interface FieldContext {
  /** 字段名 */
  name: string;
  disabled: boolean;
  /** 当前校验错误信息（无错误为 undefined） */
  error: string | undefined;
  /** 写回整表值；已存在错误的字段写回后自动重新校验 */
  setValue: (value: unknown) => void;
}

const globalFields: FieldRenderer[] = [];

/** 注册控件渲染器：参与全局竞选；同名替换既有实现（含内建） */
export function registerField(field: FieldRenderer): void {
  const index = globalFields.findIndex((item) => item.name === field.name);
  if (index >= 0) globalFields.splice(index, 1, field);
  else globalFields.push(field);
}

/** 视图附加属性读取：转换器把控件所需的 format / options 等放在 props */
function prop<T>(field: View, key: string): T | undefined {
  return field.props?.[key] as T | undefined;
}

/** 按字段视图裁决：component 命中即生效，否则竞选取最高分（同分先注册者优先） */
export function resolveField(field: View, local?: FieldRenderer[]): FieldRenderer | undefined {
  if (field.component) {
    const hit =
      local?.find((item) => item.name === field.component) ??
      globalFields.find((item) => item.name === field.component);
    if (hit) return hit;
  }
  const bias = prop<Record<string, number>>(field, 'bias');
  let best: FieldRenderer | undefined;
  let bestScore = 0;
  const consider = (item: FieldRenderer) => {
    const base = item.fitness(field);
    const score =
      (typeof base === 'number' && Number.isFinite(base) ? base : 0) + (bias?.[item.name] ?? 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  };
  // 局部注册先于全局参与竞选：同分时局部优先
  if (local) for (const item of local) consider(item);
  for (const item of globalFields) consider(item);
  return best;
}

/* ---------------- 内建 Field 集 ---------------- */

function textOf(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/** 默认文本输入框：恒为 1 的兜底，任何字段都不弃权 */
const inputField: FieldRenderer = {
  name: 'input',
  fitness: () => 1,
  render: (value, field, ctx) => {
    const format = prop<string>(field, 'format');
    return h(Input, {
      modelValue: textOf(value),
      'onUpdate:modelValue': (next: string) => ctx.setValue(next),
      type:
        format === 'email'
          ? 'email'
          : format === 'uri'
            ? 'url'
            : format === 'password'
              ? 'password'
              : 'text',
      textarea: format === 'textarea' || format === 'multiline',
      placeholder: prop<string>(field, 'placeholder') ?? field.label,
      disabled: ctx.disabled,
    });
  },
};

const numberField: FieldRenderer = {
  name: 'number',
  fitness: (field) => (field.component === 'number' ? 80 : 0),
  render: (value, field, ctx) =>
    h(InputNumber, {
      modelValue: typeof value === 'number' ? value : null,
      'onUpdate:modelValue': (next: number | null) => ctx.setValue(next),
      placeholder: prop<string>(field, 'placeholder') ?? field.label,
      disabled: ctx.disabled,
    }),
};

const switchField: FieldRenderer = {
  name: 'switch',
  fitness: (field) => (field.component === 'switch' ? 90 : 0),
  render: (value, _field, ctx) =>
    h(Switch, {
      modelValue: value === true,
      'onUpdate:modelValue': (next: boolean) => ctx.setValue(next),
      disabled: ctx.disabled,
    }),
};

const selectField: FieldRenderer = {
  name: 'select',
  fitness: (field) => (field.component === 'select' ? 100 : 0),
  render: (value, field, ctx) =>
    h(Select, {
      modelValue: (value ?? null) as never,
      options: prop<Option[]>(field, 'options') ?? [],
      placeholder: prop<string>(field, 'placeholder') ?? field.label,
      clearable: !field.validation.required,
      disabled: ctx.disabled,
      'onUpdate:modelValue': (next: unknown) => ctx.setValue(next),
    }),
};

const dateField: FieldRenderer = {
  name: 'date',
  fitness: (field) => (field.component === 'date' ? 90 : 0),
  render: (value, field, ctx) =>
    h(DatePicker, {
      modelValue: typeof value === 'number' ? value : null,
      'onUpdate:modelValue': (next: number) => ctx.setValue(next),
      placeholder: prop<string>(field, 'placeholder') ?? '选择日期',
      disabled: ctx.disabled,
    }),
};

// 内建集在模块加载时注册；宿主后续 registerField 同名即可覆盖
for (const field of [inputField, numberField, switchField, selectField, dateField]) {
  registerField(field);
}
