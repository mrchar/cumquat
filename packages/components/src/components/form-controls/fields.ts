import { h } from 'vue';
import type { VNodeChild } from 'vue';
import DatePicker from '../navigation/DatePicker.vue';
import Input from '../basic/Input.vue';
import InputNumber from './InputNumber.vue';
import Select from './Select.vue';
import Switch from './Switch.vue';

/**
 * 字段竞选：字段定义驱动的表单控件推断机制，与单元格竞选同构。
 *
 * 每个 Field 对完整字段定义自我评价返回适配度分数（正数越大越适配，0 弃权），
 * 竞选代理按字段裁决取最高分（同分先注册者优先），无正分回落默认文本输入框。
 * 优先级链路：字段插槽 > 显式指定 control > 竞选推断 > 默认输入框。
 */

/** 竞选输入：完整字段定义（ResourceField 结构兼容）。type / format 只是常用字段，宿主附加的自定义字段同样进入评价输入 */
export interface FormFieldMeta {
  name: string;
  label: string;
  /** 保存格式提示：string / number / boolean / date / datetime / enum */
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  /** 内容格式提示：email / uri / textarea / password…（原样透传文档声明） */
  format?: string;
  /** 枚举选项：select Field 据此装配选项 */
  options?: Array<{ label: string; value: string | number }>;
  /** 必填：自动派生必填校验规则 */
  required?: boolean;
  /** 占位提示，缺省回落 label */
  placeholder?: string;
  /** 显式指定控件渲染器名称（如 'select'），指定即生效，跳过竞选 */
  control?: string;
  /** 竞选加成：对指定渲染器加减分，正负均可，裁决前应用 */
  bias?: Record<string, number>;
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

/** 控件渲染器契约：自包含，只声明「擅长什么、怎么装配」 */
export interface FieldRenderer {
  /** 注册名：显式指定的目标；同名重注册替换既有实现（含内建） */
  name: string;
  /** 自我评价：完整字段定义 → 适配度分数，0 表示弃权；纯函数、无副作用，不读字段值 */
  fitness: (field: FormFieldMeta) => number;
  /** 装配：值 + 字段定义 + 上下文 → 控件节点；值类型语义由选中控件自身定义 */
  render: (value: unknown, field: FormFieldMeta, ctx: FieldContext) => VNodeChild;
}

const globalFields: FieldRenderer[] = [];

/** 注册控件渲染器：参与全局竞选；同名替换既有实现（含内建） */
export function registerField(field: FieldRenderer): void {
  const index = globalFields.findIndex((item) => item.name === field.name);
  if (index >= 0) globalFields.splice(index, 1, field);
  else globalFields.push(field);
}

/** 按字段裁决：显式指定命中即生效，否则竞选取最高分（同分先注册者优先），无正分返回 undefined 走默认输入框 */
export function resolveField(
  field: FormFieldMeta,
  local?: FieldRenderer[],
): FieldRenderer | undefined {
  if (field.control) {
    const hit =
      local?.find((item) => item.name === field.control) ??
      globalFields.find((item) => item.name === field.control);
    if (hit) return hit;
  }
  let best: FieldRenderer | undefined;
  let bestScore = 0;
  const consider = (item: FieldRenderer) => {
    const base = item.fitness(field);
    const score =
      (typeof base === 'number' && Number.isFinite(base) ? base : 0) +
      (field.bias?.[item.name] ?? 0);
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
  render: (value, field, ctx) =>
    h(Input, {
      modelValue: textOf(value),
      'onUpdate:modelValue': (next: string) => ctx.setValue(next),
      type:
        field.format === 'email'
          ? 'email'
          : field.format === 'uri'
            ? 'url'
            : field.format === 'password'
              ? 'password'
              : 'text',
      textarea: field.format === 'textarea' || field.format === 'multiline',
      placeholder: field.placeholder ?? field.label,
      disabled: ctx.disabled,
    }),
};

const numberField: FieldRenderer = {
  name: 'number',
  fitness: (field) => (field.type === 'number' ? 80 : 0),
  render: (value, field, ctx) =>
    h(InputNumber, {
      modelValue: typeof value === 'number' ? value : null,
      'onUpdate:modelValue': (next: number | null) => ctx.setValue(next),
      placeholder: field.placeholder ?? field.label,
      disabled: ctx.disabled,
    }),
};

const switchField: FieldRenderer = {
  name: 'switch',
  fitness: (field) => (field.type === 'boolean' ? 90 : 0),
  render: (value, _field, ctx) =>
    h(Switch, {
      modelValue: value === true,
      'onUpdate:modelValue': (next: boolean) => ctx.setValue(next),
      disabled: ctx.disabled,
    }),
};

const selectField: FieldRenderer = {
  name: 'select',
  fitness: (field) => (field.type === 'enum' ? 100 : 0),
  render: (value, field, ctx) =>
    h(Select, {
      modelValue: (value ?? null) as never,
      options: field.options ?? [],
      placeholder: field.placeholder ?? field.label,
      clearable: !field.required,
      disabled: ctx.disabled,
      'onUpdate:modelValue': (next: unknown) => ctx.setValue(next),
    }),
};

const dateField: FieldRenderer = {
  name: 'date',
  fitness: (field) => (field.type === 'date' ? 90 : 0),
  render: (value, field, ctx) =>
    h(DatePicker, {
      modelValue: typeof value === 'number' ? value : null,
      'onUpdate:modelValue': (next: number) => ctx.setValue(next),
      placeholder: field.placeholder ?? '选择日期',
      disabled: ctx.disabled,
    }),
};

// 内建集在模块加载时注册；宿主后续 registerField 同名即可覆盖
for (const field of [inputField, numberField, switchField, selectField, dateField]) {
  registerField(field);
}
